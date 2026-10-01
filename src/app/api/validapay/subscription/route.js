import { validapay, getUserFromRequest, priceInfo, activePriceId } from "@/lib/validapay";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

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
    if (!profile.validapay_subscription_id) return Response.json(null);

    const sub = await validapay(`/v1/subscriptions/${profile.validapay_subscription_id}`);

    // Downgrade agendado: a ValidaPay já ativa o item novo, mas o plano só muda no próximo ciclo
    const scheduled = priceInfo(activePriceId(sub.items));
    const scheduledChange =
      scheduled && scheduled.plan !== profile.role ? { plan: scheduled.plan, effectiveAt: sub.nextCycleChargeDate } : null;

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
      cancelEffectiveAt: sub.cancelAtPeriodEnd ? sub.cancellation?.effectiveAt ?? null : null,
    });
  } catch (err) {
    console.error("[ValidaPay Subscription] Erro:", err);
    return Response.json({ error: err.message || "Erro interno" }, { status: 500 });
  }
}
