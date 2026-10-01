import { validapay, getUserFromRequest } from "@/lib/validapay";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// Desfaz o cancelamento agendado: a assinatura segue normal e as cobranças voltam nas datas previstas.
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
    if (!profile.validapay_subscription_id) {
      return Response.json({ error: "Nenhuma assinatura para restaurar" }, { status: 400 });
    }

    try {
      await validapay(`/v1/subscriptions/${profile.validapay_subscription_id}/scheduled-cancellation`, {
        method: "DELETE",
      });
    } catch (err) {
      // Já não havia cancelamento agendado: só sincroniza o profile
      if (err.code !== "CANCEL_NOT_SCHEDULED") throw err;
    }

    const patch = { cancel_at_period_end: false, plan_until: null };
    await supabaseAdmin.from("profiles").update(patch).eq("id", user.id);

    return Response.json(patch);
  } catch (err) {
    console.error("[ValidaPay Reactivate] Erro:", err);
    const message =
      err.code === "SUBSCRIPTION_ALREADY_CANCELED"
        ? "Essa assinatura já foi encerrada. Assine novamente pela página de planos."
        : err.message;
    return Response.json({ error: message || "Erro interno" }, { status: 500 });
  }
}
