export async function countVisibleOrders(supabase, menuId) {
  return supabase
    .from("orders")
    .select("*", {
      count: "exact",
      head: true,
    })
    .eq("menu_id", menuId)
    .or("payment_method.neq.stripe,is_paid.eq.true");
}

// Totais da aba Pedidos calculados no banco (função em tasks/orders-summary.sql)
export async function getOrdersSummary(supabase, menuId, filters = {}) {
  const all = (v) => (v && v !== "all" ? v : null);
  const search = filters.search?.trim().replace(/[,()]/g, "") || null;

  const { data, error } = await supabase
    .rpc("orders_summary", {
      p_menu_id: menuId,
      p_is_paid: typeof filters.isPaid === "boolean" ? filters.isPaid : null,
      p_service: all(filters.deliveryType),
      p_payment: all(filters.payment),
      p_table_only: !!filters.tableOnly,
      p_status: all(filters.status),
      p_date_from: filters.dateFrom ? new Date(filters.dateFrom).toISOString() : null,
      p_date_to: filters.dateTo ? new Date(filters.dateTo).toISOString() : null,
      p_search: search,
    })
    .single();

  return { data, error };
}
