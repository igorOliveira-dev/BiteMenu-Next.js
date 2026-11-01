import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getUserFromRequest } from "@/lib/validapay";
import { resend, RESEND_FROM_EMAIL } from "@/lib/resend";

// Pedido de exclusão de conta: só registra e tira o cardápio do ar.
// A exclusão em si é manual (roteiro em tasks/account-deletion.sql).
const NOTIFY_EMAIL = process.env.ACCOUNT_DELETION_NOTIFY_EMAIL || "contato@bitemenu.com.br";

const unauthorized = () => Response.json({ error: "Não autenticado" }, { status: 401 });

async function setRequested(userId, value) {
  const { error } = await supabaseAdmin.from("profiles").update({ deletion_requested_at: value }).eq("id", userId);
  if (error) return error;

  // derruba o cache do ISR pra o cardápio sair (ou voltar) do ar na hora
  const { data: menu } = await supabaseAdmin.from("menus").select("slug").eq("owner_id", userId).maybeSingle();
  if (menu?.slug) revalidatePath(`/menu/${menu.slug}`);
  return null;
}

// Nunca lança: o pedido já foi registrado, falha de e-mail não pode derrubar a resposta.
async function notify(user, requestedAt) {
  if (!resend) {
    console.warn("[Resend] RESEND_API_KEY não configurada; aviso de exclusão não enviado");
    return;
  }

  try {
    const [{ data: profile }, { data: menu }] = await Promise.all([
      supabaseAdmin.from("profiles").select("display_name, role").eq("id", user.id).maybeSingle(),
      supabaseAdmin.from("menus").select("slug").eq("owner_id", user.id).maybeSingle(),
    ]);

    const { error } = await resend.emails.send({
      from: RESEND_FROM_EMAIL,
      to: NOTIFY_EMAIL,
      subject: `Pedido de exclusão de conta: ${user.email}`,
      html: `<p>Um usuário pediu a exclusão da conta. Prazo: até 15 dias.</p>
        <ul>
          <li><strong>ID:</strong> ${user.id}</li>
          <li><strong>E-mail:</strong> ${user.email}</li>
          <li><strong>Nome:</strong> ${profile?.display_name ?? "-"}</li>
          <li><strong>Plano:</strong> ${profile?.role ?? "-"}</li>
          <li><strong>Cardápio:</strong> ${menu?.slug ?? "-"}</li>
          <li><strong>Pedido em:</strong> ${requestedAt}</li>
        </ul>
        <p>Roteiro em tasks/account-deletion.sql.</p>`,
    });
    if (error) console.error("[Resend] Falha ao avisar pedido de exclusão:", error);
  } catch (err) {
    console.error("[Resend] Erro ao avisar pedido de exclusão:", err);
  }
}

export async function POST(req) {
  const user = await getUserFromRequest(req);
  if (!user) return unauthorized();

  const requestedAt = new Date().toISOString();
  const error = await setRequested(user.id, requestedAt);
  if (error) return Response.json({ error: error.message }, { status: 500 });

  await notify(user, requestedAt);
  return Response.json({ deletion_requested_at: requestedAt });
}

// Desistência antes da exclusão ser feita
export async function DELETE(req) {
  const user = await getUserFromRequest(req);
  if (!user) return unauthorized();

  const error = await setRequested(user.id, null);
  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({ deletion_requested_at: null });
}
