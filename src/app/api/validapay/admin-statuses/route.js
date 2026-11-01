import { validapay, getUserFromRequest } from "@/lib/validapay";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// Só leitura, pro painel admin: { [profileId]: status da assinatura na ValidaPay }.
// Profiles sem validapay_subscription_id ficam de fora.
export async function GET(req) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return Response.json({ error: "Não autenticado" }, { status: 401 });

    const { data: me } = await supabaseAdmin.from("profiles").select("role").eq("id", user.id).single();
    if (me?.role !== "admin") return Response.json({ error: "Sem permissão" }, { status: 403 });

    const { data: profiles, error } = await supabaseAdmin
      .from("profiles")
      .select("id, validapay_subscription_id")
      .not("validapay_subscription_id", "is", null);
    if (error) throw error;

    const statusOf = async (p) => {
      try {
        const sub = await validapay(`/v1/subscriptions/${p.validapay_subscription_id}`);
        return [p.id, sub.cancelAtPeriodEnd ? `${sub.status} (cancela no fim)` : sub.status];
      } catch (err) {
        return [p.id, `ERRO: ${err.message}`];
      }
    };

    // A primeira sozinha deixa o token OAuth em cache; senão todas pedem token ao mesmo tempo.
    // ponytail: 1 chamada por assinatura; trocar pela listagem paginada se passar de algumas centenas
    const [first, ...rest] = profiles;
    const entries = first ? [await statusOf(first), ...(await Promise.all(rest.map(statusOf)))] : [];

    return Response.json(Object.fromEntries(entries));
  } catch (err) {
    console.error("[ValidaPay Admin Statuses] Erro:", err);
    return Response.json({ error: err.message || "Erro interno" }, { status: 500 });
  }
}
