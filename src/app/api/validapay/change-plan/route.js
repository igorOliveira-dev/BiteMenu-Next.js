import { validapay, getUserFromRequest, PRICE_IDS, TIER, priceInfo, activePriceId } from "@/lib/validapay";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const json = (body, status = 200) => Response.json(body, { status });
const CYCLE_OF = { MONTHLY: "monthly", YEARLY: "yearly" };

// Regras:
// - mesmo ciclo, plano maior: cobra a diferença proporcional agora; vale quando ela é paga (cartão: na hora)
// - mesmo ciclo, plano menor (ou voltar pro plano atual com downgrade agendado): vale no próximo ciclo
// - troca de ciclo: a ValidaPay sempre aplica na hora, convertendo o que já foi pago em dias do plano novo
//
// Body: { planId, cycle, confirm }. Sem confirm só simula (dryRun), com o mesmo corpo da troca real.
export async function POST(req) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return json({ error: "Não autenticado" }, 401);

    const { planId, cycle, confirm } = await req.json();
    const targetCycle = cycle === "yearly" ? "yearly" : "monthly";
    const priceId = PRICE_IDS[planId]?.[targetCycle];
    if (!priceId) return json({ error: "Plano inválido" }, 400);

    const { data: profile, error } = await supabaseAdmin
      .from("profiles")
      .select("role, validapay_subscription_id, cancel_at_period_end")
      .eq("id", user.id)
      .single();
    if (error) throw error;
    if (!profile.validapay_subscription_id) return json({ error: "Você ainda não tem uma assinatura." }, 400);
    if (profile.cancel_at_period_end) {
      return json({ error: "Sua assinatura está com cancelamento agendado. Restaure-a em Detalhes do Plano para trocar de plano." }, 400);
    }

    const sub = await validapay(`/v1/subscriptions/${profile.validapay_subscription_id}`);
    const itemId = sub.primaryItemId;
    const scheduledPriceId = activePriceId(sub.items); // com downgrade agendado já é o plano novo
    const currentCycle = CYCLE_OF[sub.interval] ?? "monthly";

    // O plano vigente é o do profile (o downgrade agendado ainda não vale)
    const isSamePlan = planId === profile.role && targetCycle === currentCycle;
    if (scheduledPriceId === priceId) {
      return json({ error: isSamePlan ? "Você já está nesse plano." : "Essa troca já está agendada." }, 400);
    }

    const sameCycle = targetCycle === currentCycle;
    const isDowngrade = sameCycle && TIER[planId] <= TIER[profile.role];

    const body = { priceId, ...(isDowngrade && { prorata: { enabled: false } }) };

    if (!confirm) {
      const sim = await validapay(`/v1/subscriptions/${sub.subscriptionId}/items/${itemId}`, {
        method: "PUT",
        body: { ...body, dryRun: true },
      });
      return json(summarize(sim, sub, isDowngrade));
    }

    const result = await validapay(`/v1/subscriptions/${sub.subscriptionId}/items/${itemId}`, { method: "PUT", body });

    // Pago na hora (cartão) ou troca de ciclo: já vale. Pix/boleto: vale no webhook subscription.upgraded.
    const appliesNow =
      result.mode === "RECURRENCE_CHANGE" || (result.mode === "PRORATA_NOW" && result.settlement === "PAID");
    if (appliesNow && planId !== profile.role) {
      await supabaseAdmin.from("profiles").update({ role: planId }).eq("id", user.id);
    }

    const payment = result.settlement === "AWAITING_PAYMENT" ? result.payment : null;

    return json({
      role: appliesNow ? planId : profile.role,
      appliesNow,
      awaitingPayment: !!payment,
      pix: payment?.pix ? { emv: payment.pix.emv, qrCode: payment.pix.qrCode } : null,
      boletoUrl: payment?.boleto?.boletoUrl ?? payment?.boleto?.pdfUrl ?? null,
      dueDate: payment?.dueDate ?? null,
      amountNow: result.amounts?.chargeTotal ?? 0,
    });
  } catch (err) {
    console.error("[ValidaPay Change Plan] Erro:", err);
    const messages = {
      PAYMENT_DECLINED: "Cartão recusado. Confira o cartão cadastrado e tente de novo.",
      INTERNAL_ERROR: "Não conseguimos gerar a cobrança da diferença agora. Tente de novo em alguns minutos.",
      RECURRENCE_CHANGE_REQUIRES_NEW_ADHESION:
        "No Pix Automático não dá pra trocar entre mensal e anual por aqui. Fale com o suporte do Bite Menu que a gente ajuda.",
    };
    const status = ["PAYMENT_DECLINED", "RECURRENCE_CHANGE_REQUIRES_NEW_ADHESION"].includes(err.code) ? 400 : 500;
    return json({ error: messages[err.code] || err.message || "Erro interno" }, status);
  }
}

// Resumo da simulação no formato que a tela mostra.
function summarize(sim, sub, isDowngrade) {
  if (sim.mode === "RECURRENCE_CHANGE") {
    return {
      kind: "reschedule",
      amountNow: 0,
      effectiveNow: true,
      nextChargeDate: sim.reschedule?.nextChargeDate ?? null,
      nextChargeAmount: sim.reschedule?.nextChargeAmount ?? null,
    };
  }
  if (isDowngrade) {
    return {
      kind: "next_cycle",
      amountNow: 0,
      effectiveNow: false,
      effectiveAt: sim.effectiveAt ?? sub.nextCycleChargeDate,
      nextChargeDate: sim.effectiveAt ?? sub.nextCycleChargeDate,
      nextChargeAmount: sim.amounts?.recurringTotal ?? null,
    };
  }
  return {
    kind: "charge_now",
    amountNow: sim.amounts?.chargeTotal ?? 0,
    paymentType: sub.paymentType,
    effectiveNow: true,
    nextChargeDate: sub.nextCycleChargeDate,
    nextChargeAmount: sim.amounts?.recurringTotal ?? null,
  };
}
