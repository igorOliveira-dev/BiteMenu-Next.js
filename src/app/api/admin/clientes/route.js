import { getUserFromRequest } from "@/lib/validapay";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// Painel /admin/clientes (só role admin): perfis account_type = "customer" + nº de compras finalizadas (sales)
export async function GET(req) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return Response.json({ error: "Não autenticado" }, { status: 401 });

    const { data: me } = await supabaseAdmin.from("profiles").select("role").eq("id", user.id).single();
    if (me?.role !== "admin") return Response.json({ error: "Sem permissão" }, { status: 403 });

    const { data: profiles, error } = await supabaseAdmin.from("profiles").select("*").eq("account_type", "customer");
    if (error) throw error;

    // ponytail: puxa todas as sales com cliente; trocar por RPC com count/group by se ficar pesado
    const { data: sales } = await supabaseAdmin
      .from("sales")
      .select("customer_id, created_at")
      .not("customer_id", "is", null)
      .limit(50000);

    const stats = {};
    for (const s of sales || []) {
      const st = (stats[s.customer_id] ||= { count: 0, last: null });
      st.count++;
      if (!st.last || s.created_at > st.last) st.last = s.created_at;
    }

    return Response.json(
      profiles.map((p) => ({
        id: p.id,
        name: p.display_name,
        email: p.email,
        phone: p.phone,
        cep: p.cep,
        address: p.address_details,
        created_at: p.created_at ?? p.privacy_accepted_at ?? null,
        deletion_requested_at: p.deletion_requested_at,
        marketing_opt_out_at: p.marketing_opt_out_at,
        purchases: stats[p.id]?.count || 0,
        last_purchase_at: stats[p.id]?.last || null,
      })),
    );
  } catch (err) {
    console.error("[Admin Clientes] Erro:", err);
    return Response.json({ error: err.message || "Erro interno" }, { status: 500 });
  }
}
