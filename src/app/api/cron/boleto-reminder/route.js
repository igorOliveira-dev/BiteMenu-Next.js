import crypto from "crypto";
import { validapay, planFromPriceId, activePriceId, OPEN_INVOICE, payUntil, DAYS_TO_PAY_AFTER_DUE } from "@/lib/validapay";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { addDays, brToday, brYmd } from "@/lib/brDate";
import { sendSubscriptionEmail } from "@/lib/emails/subscriptionEmails";

// Lembretes diários da assinatura, chamado pelo pg_cron uma vez por dia (tasks/sql/boleto-reminder.sql):
// - boletoReminder: boleto que vence amanhã;
// - overdue: cobrança vencida (boleto, cartão ou Pix Automático), no 1º dia depois do vencimento e 3 dias
//   antes de a assinatura expirar (3 dias = tempo de compensação do boleto pelo código de barras). Cobre também
//   cartão/Pix Automático, porque a ValidaPay nem sempre manda payment.failed;
// - renewalReminder: plano anual no cartão/Pix Automático, 7 dias antes da renovação.
// POST { mode: "dry-run" | "send" }  ·  Authorization: Bearer CRON_SECRET
// Só assinatura atual do profile (mesma regra do e-mail "boleto" no webhook). Cada lembrete sai num dia
// específico e a idempotencyKey é por fatura/ciclo, então rodar de novo no mesmo dia não duplica.

export const maxDuration = 300;

const RENEWAL_NOTICE_DAYS = 7;

const json = (body, status = 200) => Response.json(body, { status });

function authorized(req) {
  const secret = process.env.CRON_SECRET;
  const given = req.headers.get("authorization")?.replace("Bearer ", "") ?? "";
  return !!secret && given.length === secret.length && crypto.timingSafeEqual(Buffer.from(given), Buffer.from(secret));
}

async function remindersToday() {
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

  const today = brToday();
  const tomorrow = addDays(today, 1);
  const renewalDay = addDays(today, RENEWAL_NOTICE_DAYS);
  const firstOverdueDay = addDays(today, -1);
  const lastOverdueDay = addDays(today, -(DAYS_TO_PAY_AFTER_DUE - 3));

  const list = [];
  // ponytail: busca o detalhe de cada assinatura em série; paralelizar se passar de umas centenas e estourar o maxDuration
  for (const s of subs) {
    const to = emailOf.get(s.subscriptionId);
    if (!to || !["ACTIVE", "PAST_DUE"].includes(s.status)) continue;
    const sub = await validapay(`/v1/subscriptions/${s.subscriptionId}`);
    const plan = planFromPriceId(activePriceId(sub.items) ?? sub.priceId);

    if (
      sub.status === "ACTIVE" &&
      sub.interval === "YEARLY" &&
      !sub.cancelAtPeriodEnd &&
      ["CREDIT_CARD", "PIX_AUTOMATICO"].includes(sub.paymentType) &&
      brYmd(sub.nextCycleChargeDate) === renewalDay
    ) {
      list.push({
        kind: "renewalReminder",
        to,
        key: `${sub.subscriptionId}-${renewalDay}`,
        data: {
          plan,
          amount: sub.nextCycleAmount ?? sub.currentCycleAmount,
          chargeDate: sub.nextCycleChargeDate,
          paymentType: sub.paymentType,
          cardLastFour: sub.card?.lastFour,
        },
      });
    }

    for (const invoice of (sub.billingCycles ?? []).flatMap((c) => c.invoices ?? [])) {
      const paymentType = invoice.paymentType ?? sub.paymentType;
      const isBoleto = paymentType === "BOLETO";
      if (isBoleto && !invoice.charge?.chargeId) continue;
      const due = brYmd(invoice.dueDate);
      const data = {
        plan,
        amount: invoice.summary?.total,
        dueDate: invoice.dueDate,
        paymentType,
        boletoUrl: isBoleto ? `${process.env.VALIDAPAY_API_URL}/v1/charges/${invoice.charge.chargeId}/boleto.pdf` : null, // rota pública
      };

      if (isBoleto && invoice.status === "PENDING" && due === tomorrow) {
        list.push({ kind: "boletoReminder", to, key: invoice.invoiceId, data });
      } else if (OPEN_INVOICE.includes(invoice.status) && (due === firstOverdueDay || due === lastOverdueDay)) {
        const last = due === lastOverdueDay;
        list.push({
          kind: "overdue",
          to,
          key: `${invoice.invoiceId}-${last ? "last" : "first"}`,
          data: { ...data, payUntil: payUntil(invoice.dueDate), last },
        });
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

    const list = await remindersToday();
    const summary = list.map(({ kind, to, key, data }) => ({ kind, to, key, amount: data.amount }));
    if (mode === "dry-run") return json({ count: list.length, reminders: summary });

    for (const { kind, to, key, data } of list) {
      await sendSubscriptionEmail(kind, to, data, key);
      await new Promise((r) => setTimeout(r, 600)); // limite de envio do Resend
    }

    console.log(`[Boleto Reminder] ${list.length} lembrete(s)`, summary);
    return json({ count: list.length, reminders: summary });
  } catch (err) {
    console.error("[Boleto Reminder] Erro:", err);
    return json({ error: err.message || "Erro interno" }, 500);
  }
}
