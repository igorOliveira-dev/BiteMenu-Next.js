import { validapay, getUserFromRequest, findPendingBoletoSubscription, openBoleto } from "@/lib/validapay";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// Cancela o boleto da primeira compra (assinatura ainda PENDING, fora do profile), pro cliente
// poder assinar de novo com outra forma. Com assinatura ativa o boleto é cancelado pela troca de
// forma de pagamento: cancelar só a cobrança deixaria o ciclo sem pagamento.
export async function POST(req) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return Response.json({ error: "Não autenticado" }, { status: 401 });

    const { data: profile, error } = await supabaseAdmin
      .from("profiles")
      .select("validapay_subscription_id")
      .eq("id", user.id)
      .single();
    if (error) throw error;
    if (profile.validapay_subscription_id) {
      return Response.json({ error: "Para cancelar este boleto, troque a forma de pagamento." }, { status: 400 });
    }

    const pendingSub = await findPendingBoletoSubscription(user.email);
    const chargeId = pendingSub && openBoleto(pendingSub)?.charge?.chargeId;
    if (!chargeId) return Response.json({ error: "Nenhum boleto em aberto" }, { status: 400 });

    await validapay(`/v1/charges/${chargeId}`, { method: "DELETE" });
    // A assinatura nunca foi paga; encerra pra não ficar pendurada. O webhook ignora
    // (não é a assinatura do profile), e se falhar o checkout já não bloqueia mais.
    await validapay(`/v1/subscriptions/${pendingSub.subscriptionId}`, {
      method: "DELETE",
      body: { reason: "Boleto cancelado pelo cliente no dashboard" },
    }).catch((err) => console.error("[ValidaPay Cancel Boleto] Falha ao encerrar assinatura pendente:", err));

    return Response.json({ ok: true });
  } catch (err) {
    console.error("[ValidaPay Cancel Boleto] Erro:", err);
    return Response.json({ error: err.message || "Erro interno" }, { status: 500 });
  }
}
