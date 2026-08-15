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
