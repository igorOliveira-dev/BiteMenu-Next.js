import { validapay, getUserFromRequest } from "@/lib/validapay";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// Só leitura, pro gráfico do painel admin: datas dos primeiros pagamentos das assinaturas ValidaPay.
// O período e o agrupamento por dia são feitos no cliente.
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

    // PENDING nunca foi paga; nas outras, o primeiro paidAt das faturas é o dia em que virou pagante
    const firstPaidAt = async (s) => {
      const sub = await validapay(`/v1/subscriptions/${s.subscriptionId}`);
      const paid = (sub.billingCycles ?? [])
        .flatMap((c) => c.invoices ?? [])
        .map((i) => i.paidAt)
        .filter(Boolean)
        .sort();
      return paid[0] ?? null;
    };

    const candidates = subs.filter((s) => s.status !== "PENDING");
    // A primeira sozinha deixa o token OAuth em cache; senão todas pedem token ao mesmo tempo.
    // ponytail: 1 chamada por assinatura; guardar a data do 1º pagamento no profile se passar de algumas centenas
    const [first, ...rest] = candidates;
    const paidDates = first ? [await firstPaidAt(first), ...(await Promise.all(rest.map(firstPaidAt)))] : [];

    return Response.json({ paying: paidDates.filter(Boolean) });
  } catch (err) {
    console.error("[ValidaPay Admin Daily] Erro:", err);
    return Response.json({ error: err.message || "Erro interno" }, { status: 500 });
  }
}
