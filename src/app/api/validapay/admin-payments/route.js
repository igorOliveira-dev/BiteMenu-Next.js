import { validapay, getUserFromRequest, priceInfo, activePriceId, userIdFromSubscription } from "@/lib/validapay";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// Só leitura, pro painel admin: faturas pagas de todas as assinaturas ValidaPay,
// com o cliente (profile) e a origem dele (acquisition_source / utm_source).
// Filtros e totais por origem são feitos no cliente.
export async function GET(req) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return Response.json({ error: "Não autenticado" }, { status: 401 });

    const { data: me } = await supabaseAdmin.from("profiles").select("role").eq("id", user.id).single();
    if (me?.role !== "admin") return Response.json({ error: "Sem permissão" }, { status: 403 });

    const subs = [];
    let lastKey = null;
    do {
      const page = await validapay(
        `/v1/subscriptions?limit=100${lastKey ? `&lastKey=${encodeURIComponent(lastKey)}` : ""}`,
      );
      subs.push(...page.items);
      lastKey = page.pagination?.lastKey;
    } while (lastKey);

    const { data: profiles, error } = await supabaseAdmin
      .from("profiles")
      .select("id, display_name, email, acquisition_source, validapay_subscription_id")
      .not("validapay_subscription_id", "is", null);
    if (error) throw error;
    const byId = new Map(profiles.map((p) => [p.id, p]));
    const bySub = new Map(profiles.filter((p) => p.validapay_subscription_id).map((p) => [p.validapay_subscription_id, p]));

    // Mesma ordem do webhook: metadata → assinatura ligada ao profile → sessão de checkout
    // (assinaturas antigas, já trocadas ou canceladas, não estão mais no profile)
    const profileOf = async (sub) => {
      if (bySub.has(sub.subscriptionId)) return bySub.get(sub.subscriptionId);
      const userId = sub.metadata?.userId ?? (await userIdFromSubscription(sub.subscriptionId).catch(() => null));
      if (!userId) return null;
      if (byId.has(userId)) return byId.get(userId);
      const { data } = await supabaseAdmin
        .from("profiles")
        .select("id, display_name, email, acquisition_source")
        .eq("id", userId)
        .maybeSingle();
      return data;
    };

    // PENDING nunca foi paga
    const paymentsOf = async (s) => {
      const sub = await validapay(`/v1/subscriptions/${s.subscriptionId}`);
      const paid = (sub.billingCycles ?? []).flatMap((c) => c.invoices ?? []).filter((i) => i.paidAt);
      if (!paid.length) return [];

      const profile = await profileOf(sub);
      const info = priceInfo(activePriceId(sub.items));
      return paid.map((i) => ({
        subscriptionId: sub.subscriptionId,
        paidAt: i.paidAt,
        amount: i.summary?.total ?? null,
        paymentType: i.paymentType ?? sub.paymentType ?? null,
        plan: info?.plan ?? null,
        cycle: info?.cycle ?? null,
        userId: profile?.id ?? null,
        name: profile?.display_name ?? null,
        email: profile?.email ?? null,
        source: profile?.acquisition_source ?? null,
      }));
    };

    const candidates = subs.filter((s) => s.status !== "PENDING");
    // A primeira sozinha deixa o token OAuth em cache; senão todas pedem token ao mesmo tempo.
    // ponytail: 1 chamada por assinatura, igual ao admin-daily
    const [first, ...rest] = candidates;
    const lists = first ? [await paymentsOf(first), ...(await Promise.all(rest.map(paymentsOf)))] : [];

    const payments = lists.flat().sort((a, b) => new Date(b.paidAt) - new Date(a.paidAt));
    return Response.json({ payments });
  } catch (err) {
    console.error("[ValidaPay Admin Payments] Erro:", err);
    return Response.json({ error: err.message || "Erro interno" }, { status: 500 });
  }
}
