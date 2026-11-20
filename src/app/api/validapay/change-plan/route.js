import {
  validapay,
  getUserFromRequest,
  PRICE_IDS,
  TIER,
  priceInfo,
  activePriceId,
  openBoleto,
  applyPaidUpgrade,
} from "@/lib/validapay";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { brDate } from "@/lib/brDate";

const json = (body, status = 200) => Response.json(body, { status });
const CYCLE_OF = { MONTHLY: "monthly", YEARLY: "yearly" };

// Regras:
// - mesmo ciclo, plano maior: cobra a diferença proporcional agora; vale quando ela é paga (cartão: na hora)
// - mesmo ciclo, plano menor (ou voltar pro plano atual com downgrade agendado): vale no próximo ciclo
// - troca de ciclo: a ValidaPay sempre aplica na hora, convertendo o que já foi pago em dias do plano novo
// - Pix Automático, plano maior no mesmo ciclo: a ValidaPay só cobraria a diferença no próximo débito;
//   cobramos num Pix avulso e o plano muda quando ele é pago (applyPaidUpgrade)
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
      .select("role, validapay_subscription_id, cancel_at_period_end, pending_upgrade")
      .eq("id", user.id)
      .single();
    if (error) throw error;
    if (!profile.validapay_subscription_id) return json({ error: "Você ainda não tem uma assinatura." }, 400);
    if (profile.cancel_at_period_end) {
      return json({ error: "Sua assinatura está com cancelamento agendado. Restaure-a em Detalhes do Plano para trocar de plano." }, 400);
    }

    const sub = await validapay(`/v1/subscriptions/${profile.validapay_subscription_id}`);

    const pending = openBoleto(sub);
    if (pending) {
      const due = pending.dueDate ? ` (vencimento ${brDate(pending.dueDate)})` : "";
      return json(
        {
          error: `Você já tem um boleto em aberto${due}. Pague esse boleto (o link está no aviso no topo do painel) e aguarde a compensação, que leva até 3 dias úteis, antes de trocar de plano.`,
        },
        400,
      );
    }

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

    const isPixAutoUpgrade = sub.paymentType === "PIX_AUTOMATICO" && sameCycle && !isDowngrade;
    const body = { priceId, ...(isDowngrade && { prorata: { enabled: false } }) };

    if (!confirm || isPixAutoUpgrade) {
      const sim = await validapay(`/v1/subscriptions/${sub.subscriptionId}/items/${itemId}`, {
        method: "PUT",
        body: { ...body, dryRun: true },
      });
      if (!confirm) return json(summarize(sim, sub, isDowngrade));
      return json(await pixUpgrade({ user, profile, sub, planId, targetCycle, amount: diffOf(sim) }));
    }

    const result = await validapay(`/v1/subscriptions/${sub.subscriptionId}/items/${itemId}`, { method: "PUT", body });

    // Pago na hora (cartão) ou troca de ciclo: já vale. Pix/boleto: vale no webhook subscription.upgraded.
    const appliesNow =
      result.mode === "RECURRENCE_CHANGE" || (result.mode === "PRORATA_NOW" && result.settlement === "PAID");
    if (appliesNow && planId !== profile.role && profile.role !== "admin") {
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
      PIX_PROCESSING: "Seu Pix anterior está sendo processado. Aguarde alguns segundos e atualize a página.",
      RECURRENCE_CHANGE_REQUIRES_NEW_ADHESION:
        "No Pix Automático não dá pra trocar entre mensal e anual por aqui. Fale com o suporte do Bite Menu que a gente ajuda.",
    };
    const status = ["PAYMENT_DECLINED", "RECURRENCE_CHANGE_REQUIRES_NEW_ADHESION", "PIX_PROCESSING"].includes(err.code)
      ? 400
      : 500;
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
    amountNow: diffOf(sim),
    paymentType: sub.paymentType,
    effectiveNow: true,
    nextChargeDate: sub.nextCycleChargeDate,
    nextChargeAmount: sim.amounts?.recurringTotal ?? null,
  };
}

// Polling do modal: libera o plano quando o Pix avulso do upgrade é pago.
export async function GET(req) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return json({ error: "Não autenticado" }, 401);
    return json({ status: await applyPaidUpgrade(user.id) });
  } catch (err) {
    console.error("[ValidaPay Change Plan] Erro no polling:", err);
    return json({ error: err.message || "Erro interno" }, 500);
  }
}

// Diferença do upgrade: no Pix Automático a ValidaPay não cobra agora (chargeTotal 0) e põe a pró-rata no próximo débito
const diffOf = (sim) =>
  Math.round((sim.amounts?.chargeTotal || sim.amounts?.prorata || sim.prorataPeriod?.prorataAmount || 0) * 100) / 100;

// Upgrade no Pix Automático: cobra a diferença num Pix avulso; o item só é trocado depois de pago (applyPaidUpgrade).
async function pixUpgrade({ user, profile, sub, planId, targetCycle, amount }) {
  // Pix de uma tentativa anterior: pago → libera o plano; em aberto → cancela (não ficam dois códigos pagáveis)
  const previousId = profile.pending_upgrade?.chargeId;
  if (previousId) {
    const previous = await applyPaidUpgrade(user.id);
    if (previous === "PAID") return { appliesNow: true, awaitingPayment: false };
    if (previous === "PROCESSING") throw Object.assign(new Error("Pix em processamento"), { code: "PIX_PROCESSING" });
    if (["PENDING", "AWAITING_PAYMENT"].includes(previous)) {
      await validapay(`/v1/charges/${previousId}`, { method: "DELETE" }).catch((err) =>
        console.error("[ValidaPay Change Plan] Falha ao cancelar Pix anterior:", err),
      );
    }
  }

  // Diferença abaixo do mínimo do Pix (R$ 1,00): troca sem cobrar
  if (amount < 1) {
    await validapay(`/v1/subscriptions/${sub.subscriptionId}/items/${sub.primaryItemId}`, {
      method: "PUT",
      body: { priceId: PRICE_IDS[planId][targetCycle], prorata: { enabled: false } },
    });
    const patch = { pending_upgrade: null, ...(profile.role !== "admin" && { role: planId }) };
    const { error } = await supabaseAdmin.from("profiles").update(patch).eq("id", user.id);
    if (error) throw error;
    return { appliesNow: true, awaitingPayment: false, role: planId };
  }

  const charge = await validapay("/v1/charges/pix", {
    method: "POST",
    body: { amount, metadata: { userId: user.id, plan: planId, cycle: targetCycle, kind: "upgrade" } },
  });
  // Sem gravar o pendente o pagamento não liberaria o plano: se falhar aqui, o cliente não vê o QR
  const { error } = await supabaseAdmin
    .from("profiles")
    .update({ pending_upgrade: { chargeId: charge.chargeId, plan: planId, cycle: targetCycle } })
    .eq("id", user.id);
  if (error) throw error;

  return {
    role: profile.role,
    appliesNow: false,
    awaitingPayment: true,
    pix: { emv: charge.emv, qrCode: charge.qrCode },
    boletoUrl: null,
    dueDate: null,
    amountNow: amount,
  };
}
