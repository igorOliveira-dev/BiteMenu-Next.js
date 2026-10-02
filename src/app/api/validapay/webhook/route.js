import { validapay, planFromPriceId, activePriceId, isValidSignature } from "@/lib/validapay";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { sendSubscriptionEmail } from "@/lib/emails/subscriptionEmails";

// A ValidaPay cuida de renovação, retentativas e cancelamento no fim do período;
// aqui refletimos o estado da assinatura no profile e mandamos os e-mails ao cliente (Resend).
// downgrade_scheduled fica de fora de propósito: o plano só cai quando o próximo ciclo é pago (renewed).
// subscription.upgraded não dá pra assinar pelo painel; por isso o plano vem da assinatura consultada
// na hora (um payment.success do upgrade já reflete o plano novo).
const PAID_EVENTS = ["subscription.activated", "subscription.renewed", "subscription.upgraded", "payment.success"];
const ENDED_EVENTS = ["subscription.canceled", "subscription.expired"];
const NOTIFY_ONLY_EVENTS = ["charge.created", "payment.failed"];

async function findProfile(evt) {
  const select = "id, email, role, validapay_subscription_id";
  const tries = [
    evt.metadata?.userId && ["id", evt.metadata.userId],
    ["validapay_subscription_id", evt.subscriptionId],
    evt.email && ["email", evt.email],
  ].filter(Boolean);

  for (const [column, value] of tries) {
    const { data, error } = await supabaseAdmin.from("profiles").select(select).eq(column, value).maybeSingle();
    if (error) throw error;
    if (data) return data;
  }
  return null;
}

export async function POST(req) {
  const rawBody = await req.text();

  if (!isValidSignature(req.headers.get("x-webhook-signature"), rawBody, process.env.VALIDAPAY_WEBHOOK_SECRET)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const evt = JSON.parse(rawBody);
  const isPaid = PAID_EVENTS.includes(evt.event);
  const isEnded = ENDED_EVENTS.includes(evt.event);
  const isCancelScheduled = evt.event === "subscription.cancel_scheduled";
  const isNotifyOnly = NOTIFY_ONLY_EVENTS.includes(evt.event);

  // Responder 200 pro que não interessa (inclui pagamento avulso e falha na criação, sem subscriptionId).
  if (!evt.subscriptionId || !(isPaid || isEnded || isCancelScheduled || isNotifyOnly)) return new Response("ok");

  // Mesmo id em todas as retentativas do evento: evita e-mail duplicado
  const eventId = req.headers.get("x-webhook-id") ?? `${evt.event}:${evt.subscriptionId}:${evt.chargeId ?? evt.timestamp}`;

  try {
    const profile = await findProfile(evt);
    if (!profile) {
      console.log(`[ValidaPay Webhook] ${evt.event} da assinatura ${evt.subscriptionId} sem profile correspondente`);
      return new Response("ok");
    }

    const to = profile.email ?? evt.email;
    const isCurrent = profile.validapay_subscription_id === evt.subscriptionId;
    const eventPlan = planFromPriceId(activePriceId(evt.items)) ?? profile.role;
    let patch = null;
    let email = null; // [tipo, dados]

    if (isPaid) {
      const sub = await validapay(`/v1/subscriptions/${evt.subscriptionId}`);
      const plan = planFromPriceId(activePriceId(sub.items)) ?? planFromPriceId(activePriceId(evt.items)) ?? evt.metadata?.plan;
      if (!["plus", "pro"].includes(plan)) {
        console.error(`[ValidaPay Webhook] Plano não identificado na assinatura ${evt.subscriptionId}`);
        return new Response("ok");
      }
      patch = {
        role: plan,
        validapay_subscription_id: evt.subscriptionId,
        legacy_plan_until: null, // reassinou: não cai no rebaixamento dos planos Stripe
        ...(evt.event === "subscription.activated" && { cancel_at_period_end: false, plan_until: null }),
      };

      // payment.success acompanha activated/renewed; o e-mail sai só pelos dois
      if (evt.event === "subscription.activated" || evt.event === "subscription.renewed") {
        email = [
          evt.event === "subscription.activated" ? "activated" : "renewed",
          {
            plan,
            interval: sub.interval,
            amount: evt.currentCycle?.amount ?? sub.currentCycleAmount,
            nextChargeDate: sub.nextCycleChargeDate,
          },
        ];
      }
    } else if (isCancelScheduled && isCurrent) {
      patch = { cancel_at_period_end: true, plan_until: evt.effectiveAt ?? null };
      email = ["cancelScheduled", { plan: profile.role, effectiveAt: evt.effectiveAt }];
    } else if (isEnded && isCurrent) {
      patch = { role: "free", validapay_subscription_id: null, cancel_at_period_end: false, plan_until: null };
      email = [evt.event === "subscription.expired" ? "expired" : "canceled", { plan: profile.role }];
    } else if (evt.event === "charge.created" && evt.paymentType === "BOLETO") {
      // Primeira compra ainda não tem assinatura no profile; renovação precisa ser da assinatura atual
      if (isCurrent || !profile.validapay_subscription_id) {
        email = [
          "boleto",
          {
            plan: eventPlan,
            amount: evt.amount,
            dueDate: evt.dueDate,
            boletoUrl: `${process.env.VALIDAPAY_API_URL}/v1/charges/${evt.chargeId}/boleto.pdf`, // rota pública
          },
        ];
      }
    } else if (evt.event === "payment.failed" && isCurrent) {
      email = [
        "paymentFailed",
        {
          plan: profile.role,
          amount: evt.amount,
          reason: evt.retry?.failureReason,
          nextRetryAt: evt.retry?.nextRetryAt,
        },
      ];
    }

    // role também marca admin: assinatura de admin nunca mexe nisso
    if (patch && profile.role === "admin") delete patch.role;

    if (patch) {
      const { error } = await supabaseAdmin.from("profiles").update(patch).eq("id", profile.id);
      if (error) throw error;
      console.log(`[ValidaPay Webhook] ${evt.event}: profile ${profile.id}`, patch);
    }

    if (email) await sendSubscriptionEmail(email[0], to, email[1], eventId);

    return new Response("ok");
  } catch (err) {
    // 5xx faz a ValidaPay tentar de novo (retry por até 72h)
    console.error("[ValidaPay Webhook] Erro:", err);
    return new Response("error", { status: 500 });
  }
}
