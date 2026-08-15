export async function getCombosByMenuId(supabase, menuId) {
  return supabase.from("combos").select("*").eq("menu_id", menuId);
}
