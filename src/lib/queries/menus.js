export async function hasMenu(supabase, ownerId) {
  return supabase.from("menus").select("id").eq("owner_id", ownerId);
}

export async function updateMenuById(supabase, menuId, patch) {
  return supabase.from("menus").update(patch).eq("id", menuId);
}
