import { resend } from "@/lib/resend";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// Webhook do Resend: marca abertura, clique, bounce e spam nos e-mails do remarketing (marketing_emails).
// Bounce ou spam descadastra a pessoa do remarketing. Eventos de outros e-mails (assinatura, legacy) são ignorados.
// Configurar no painel do Resend apontando pra /api/remarketing/resend-webhook; segredo em RESEND_WEBHOOK_SECRET.

const FIELDS = {
  "email.opened": "opened_at",
  "email.clicked": "clicked_at",
  "email.bounced": "bounced_at",
  "email.complained": "complained_at",
};

export async function POST(req) {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!resend || !secret) return Response.json({ error: "Webhook não configurado" }, { status: 503 });

  const payload = await req.text();
  let event;
  try {
    event = resend.webhooks.verify({
      payload,
      headers: {
        id: req.headers.get("svix-id") ?? "",
        timestamp: req.headers.get("svix-timestamp") ?? "",
        signature: req.headers.get("svix-signature") ?? "",
      },
      webhookSecret: secret,
    });
  } catch {
    return Response.json({ error: "Assinatura inválida" }, { status: 401 });
  }

  const field = FIELDS[event.type];
  const emailId = event.data?.email_id;
  if (!field || !emailId) return Response.json({ ignored: true });

  try {
    const { data: rows, error } = await supabaseAdmin
      .from("marketing_emails")
      .update({ [field]: event.created_at ?? new Date().toISOString() })
      .eq("resend_id", emailId)
      .is(field, null)
      .select("profile_id");
    if (error) throw error;

    if ((field === "bounced_at" || field === "complained_at") && rows?.length) {
      await supabaseAdmin
        .from("profiles")
        .update({ marketing_opt_out_at: new Date().toISOString() })
        .in("id", rows.map((r) => r.profile_id))
        .is("marketing_opt_out_at", null);
    }
    return Response.json({ ok: true });
  } catch (err) {
    console.error("[Remarketing webhook] Erro:", err);
    return Response.json({ error: "Erro interno" }, { status: 500 });
  }
}
