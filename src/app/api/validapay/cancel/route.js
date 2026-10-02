import { validapay, getUserFromRequest } from "@/lib/validapay";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// Com período pago pela frente a ValidaPay agenda o cancelamento pro fim dele;
// sem período pago cancela na hora. O webhook também reflete isso; aqui só
// adiantamos pra tela já mostrar o resultado.
export async function POST(req) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return Response.json({ error: "Não autenticado" }, { status: 401 });

    const { data: profile, error } = await supabaseAdmin
      .from("profiles")
      .select("role, validapay_subscription_id")
      .eq("id", user.id)
      .single();
    if (error) throw error;
    if (!profile.validapay_subscription_id) {
      return Response.json({ error: "Nenhuma assinatura ativa" }, { status: 400 });
    }

    const result = await validapay(`/v1/subscriptions/${profile.validapay_subscription_id}`, {
      method: "DELETE",
      body: { reason: "Cancelado pelo cliente no dashboard" },
    });

    const patch = result.immediate
      ? { role: "free", validapay_subscription_id: null, cancel_at_period_end: false, plan_until: null }
      : { cancel_at_period_end: true, plan_until: result.effectiveAt };

    if (profile.role === "admin") delete patch.role; // role também marca admin
    await supabaseAdmin.from("profiles").update(patch).eq("id", user.id);

    return Response.json(patch);
  } catch (err) {
    console.error("[ValidaPay Cancel] Erro:", err);
    return Response.json({ error: err.message || "Erro interno" }, { status: 500 });
  }
}
