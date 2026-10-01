import { validapay, planFromPriceId, activePriceId, isValidSignature } from "@/lib/validapay";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// A ValidaPay cuida de renovação, retentativas e cancelamento no fim do período;
// aqui só refletimos o estado da assinatura no profile.
// downgrade_scheduled fica de fora de propósito: o plano só cai quando o próximo ciclo é pago (renewed).
// subscription.upgraded não dá pra assinar pelo painel; por isso o plano vem da assinatura consultada
// na hora (um payment.success do upgrade já reflete o plano novo).
const PAID_EVENTS = ["subscription.activated", "subscription.renewed", "subscription.upgraded", "payment.success"];
const ENDED_EVENTS = ["subscription.canceled", "subscription.expired"];

async function findProfile(evt) {
  const select = "id, validapay_subscription_id";
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

  // Responder 200 pro que não interessa (inclui pagamento avulso sem subscriptionId).
  if (!evt.subscriptionId || !(isPaid || isEnded || isCancelScheduled)) return new Response("ok");

  try {
    const profile = await findProfile(evt);
    if (!profile) {
      console.log(`[ValidaPay Webhook] ${evt.event} da assinatura ${evt.subscriptionId} sem profile correspondente`);
      return new Response("ok");
    }

    const isCurrent = profile.validapay_subscription_id === evt.subscriptionId;
    let patch = null;

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
    } else if (isCancelScheduled && isCurrent) {
      patch = { cancel_at_period_end: true, plan_until: evt.effectiveAt ?? null };
    } else if (isEnded && isCurrent) {
      patch = { role: "free", validapay_subscription_id: null, cancel_at_period_end: false, plan_until: null };
    }

    if (patch) {
      const { error } = await supabaseAdmin.from("profiles").update(patch).eq("id", profile.id);
      if (error) throw error;
      console.log(`[ValidaPay Webhook] ${evt.event}: profile ${profile.id}`, patch);
    }

    return new Response("ok");
  } catch (err) {
    // 5xx faz a ValidaPay tentar de novo (retry por até 72h)
    console.error("[ValidaPay Webhook] Erro:", err);
    return new Response("error", { status: 500 });
  }
}
