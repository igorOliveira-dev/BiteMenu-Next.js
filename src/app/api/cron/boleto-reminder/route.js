import crypto from "crypto";
import { validapay, planFromPriceId } from "@/lib/validapay";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { addDays, brToday } from "@/lib/brDate";
import { sendSubscriptionEmail } from "@/lib/emails/subscriptionEmails";

// Lembrete 1 dia antes do vencimento do boleto, chamado pelo pg_cron uma vez por dia (tasks/boleto-reminder.sql).
// POST { mode: "dry-run" | "send" }  ·  Authorization: Bearer CRON_SECRET
// Só assinatura atual do profile (mesma regra do e-mail "boleto" no webhook); idempotencyKey = fatura,
// então rodar de novo no mesmo dia não duplica.

export const maxDuration = 300;

const json = (body, status = 200) => Response.json(body, { status });

function authorized(req) {
  const secret = process.env.CRON_SECRET;
  const given = req.headers.get("authorization")?.replace("Bearer ", "") ?? "";
  return !!secret && given.length === secret.length && crypto.timingSafeEqual(Buffer.from(given), Buffer.from(secret));
}

async function dueTomorrow() {
  const { data: profiles, error } = await supabaseAdmin
    .from("profiles")
    .select("email, validapay_subscription_id")
    .not("validapay_subscription_id", "is", null);
  if (error) throw error;
  const emailOf = new Map(profiles.map((p) => [p.validapay_subscription_id, p.email]));

  const subs = [];
  let lastKey = null;
  do {
    const page = await validapay(`/v1/subscriptions?limit=100${lastKey ? `&lastKey=${encodeURIComponent(lastKey)}` : ""}`);
    subs.push(...page.items);
    lastKey = page.pagination?.lastKey;
  } while (lastKey);

  const tomorrow = addDays(brToday(), 1);
  const list = [];
  for (const s of subs) {
    if (s.paymentType !== "BOLETO" || !["ACTIVE", "PAST_DUE"].includes(s.status) || !emailOf.get(s.subscriptionId)) continue;
    const sub = await validapay(`/v1/subscriptions/${s.subscriptionId}`);
    for (const invoice of (sub.billingCycles ?? []).flatMap((c) => c.invoices ?? [])) {
      if (invoice.status === "PENDING" && invoice.paymentType === "BOLETO" && invoice.dueDate?.slice(0, 10) === tomorrow) {
        list.push({ to: emailOf.get(s.subscriptionId), sub, invoice });
      }
    }
  }
  return list;
}

export async function POST(req) {
  if (!authorized(req)) return json({ error: "Unauthorized" }, 401);

  try {
    const { mode = "dry-run" } = await req.json().catch(() => ({}));
    if (!["dry-run", "send"].includes(mode)) return json({ error: "mode inválido" }, 400);

    const list = await dueTomorrow();
    const summary = list.map(({ to, invoice }) => ({ to, invoice: invoice.invoiceId, amount: invoice.summary?.total, dueDate: invoice.dueDate }));
    if (mode === "dry-run") return json({ count: list.length, reminders: summary });

    for (const { to, sub, invoice } of list) {
      await sendSubscriptionEmail(
        "boletoReminder",
        to,
        {
          plan: planFromPriceId(sub.priceId),
          amount: invoice.summary?.total,
          dueDate: invoice.dueDate,
          boletoUrl: `${process.env.VALIDAPAY_API_URL}/v1/charges/${invoice.charge?.chargeId}/boleto.pdf`, // rota pública
        },
        invoice.invoiceId,
      );
      await new Promise((r) => setTimeout(r, 600)); // limite de envio do Resend
    }

    console.log(`[Boleto Reminder] ${list.length} lembrete(s)`, summary);
    return json({ count: list.length, reminders: summary });
  } catch (err) {
    console.error("[Boleto Reminder] Erro:", err);
    return json({ error: err.message || "Erro interno" }, 500);
  }
}
