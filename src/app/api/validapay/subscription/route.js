import {
  validapay,
  getUserFromRequest,
  priceInfo,
  activePriceId,
  findPendingBoletoSubscription,
  DAYS_TO_PAY_AFTER_DUE,
} from "@/lib/validapay";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const OPEN_INVOICE = ["PENDING", "AWAITING_PAYMENT", "OVERDUE"];
const DAY = 86400000;

// Cobrança que pede atenção do cliente:
// - boleto emitido e ainda não pago (vencido ou não), com link pro PDF;
// - qualquer forma de pagamento vencida (cartão/Pix Automático recusados, boleto atrasado).
// Pix Automático e cartão em dia não aparecem: o débito é automático.
function paymentAlert(sub) {
  const invoices = (sub.billingCycles ?? []).flatMap((c) => c.invoices ?? []);
  const open = invoices
    .filter((i) => OPEN_INVOICE.includes(i.status))
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))[0];
  if (!open) return null;

  const dueDate = open.dueDate ? new Date(open.dueDate) : null;
  const overdue =
    open.status === "OVERDUE" ||
    ["PAST_DUE", "DEFAULT"].includes(sub.status) ||
    // 1 dia de folga: o Pix Automático é debitado ao longo do dia do vencimento
    (dueDate && dueDate.getTime() + DAY < Date.now());
  const isBoleto = (open.paymentType ?? sub.paymentType) === "BOLETO";
  if (!overdue && !isBoleto) return null;

  const chargeId = open.charge?.chargeId;
  return {
    overdue,
    paymentType: open.paymentType ?? sub.paymentType,
    amount: open.summary?.total ?? sub.currentCycleAmount,
    dueDate: open.dueDate ?? null,
    // depois disso a assinatura é encerrada e a conta volta pro Free
    payUntil: dueDate ? new Date(dueDate.getTime() + DAYS_TO_PAY_AFTER_DUE * DAY).toISOString() : null,
    boletoUrl: isBoleto && chargeId ? `${process.env.VALIDAPAY_API_URL}/v1/charges/${chargeId}/boleto.pdf` : null,
  };
}

// Resumo de faturamento da assinatura do usuário logado (só o que a tela mostra).
export async function GET(req) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return Response.json({ error: "Não autenticado" }, { status: 401 });

    const { data: profile, error } = await supabaseAdmin
      .from("profiles")
      .select("role, validapay_subscription_id")
      .eq("id", user.id)
      .single();
    if (error) throw error;
    // Primeira compra no boleto: a assinatura só entra no profile quando o boleto compensa,
    // mas o aviso com o boleto já aparece (só o BillingAlert chama sem assinatura no profile)
    if (!profile.validapay_subscription_id) {
      const pendingSub = await findPendingBoletoSubscription(user.email);
      const alert = pendingSub && paymentAlert(pendingSub);
      if (!alert) return Response.json(null);
      return Response.json({
        alert: { ...alert, pending: true, plan: priceInfo(activePriceId(pendingSub.items))?.plan ?? null },
      });
    }

    const sub = await validapay(`/v1/subscriptions/${profile.validapay_subscription_id}`);

    // Downgrade agendado: a ValidaPay já ativa o item novo, mas o plano só muda no próximo ciclo
    const scheduled = priceInfo(activePriceId(sub.items));
    const scheduledChange =
      scheduled && scheduled.plan !== profile.role
        ? { plan: scheduled.plan, effectiveAt: sub.nextCycleChargeDate }
        : null;

    return Response.json({
      status: sub.status,
      interval: sub.interval,
      cycle: sub.interval === "YEARLY" ? "yearly" : "monthly",
      scheduledChange,
      paymentType: sub.paymentType,
      card: sub.card ? { brand: sub.card.brand, lastFour: sub.card.lastFour } : null,
      nextChargeDate: sub.nextCycleChargeDate,
      nextChargeAmount: sub.nextCycleAmount,
      cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
      cancelEffectiveAt: sub.cancelAtPeriodEnd ? (sub.cancellation?.effectiveAt ?? null) : null,
      alert: paymentAlert(sub),
    });
  } catch (err) {
    console.error("[ValidaPay Subscription] Erro:", err);
    return Response.json({ error: err.message || "Erro interno" }, { status: 500 });
  }
}
