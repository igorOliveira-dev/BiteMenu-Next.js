import crypto from "crypto";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { unsubscribeToken } from "@/lib/emails/remarketingEmails";
import { SITE } from "@/lib/emails/subscriptionEmails";

// Descadastro do remarketing. POST ?u=<profile_id>&t=<token>
// Chamado pela página /descadastro e pelo botão "cancelar inscrição" do Gmail/Outlook (List-Unsubscribe-Post).

function valid(u, t) {
  if (!u || !t) return false;
  const expected = unsubscribeToken(u);
  return t.length === expected.length && crypto.timingSafeEqual(Buffer.from(t), Buffer.from(expected));
}

export async function POST(req) {
  const params = new URL(req.url).searchParams;
  const u = params.get("u");
  if (!valid(u, params.get("t"))) return Response.json({ error: "Link inválido" }, { status: 400 });

  const { error } = await supabaseAdmin
    .from("profiles")
    .update({ marketing_opt_out_at: new Date().toISOString() })
    .eq("id", u)
    .is("marketing_opt_out_at", null);
  if (error) {
    console.error("[Remarketing unsubscribe] Erro:", error);
    return Response.json({ error: "Erro interno" }, { status: 500 });
  }
  return Response.json({ ok: true });
}

// Alguns clientes abrem o link do cabeçalho com GET: manda pra página de confirmação
// (SITE em vez de req.url: atrás do proxy do Coolify o host da requisição é o interno)
export async function GET(req) {
  const { search } = new URL(req.url);
  return Response.redirect(`${SITE}/descadastro${search}`, 303);
}
