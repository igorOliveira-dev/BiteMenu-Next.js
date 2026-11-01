export async function hasMenu(supabase, ownerId) {
  return supabase.from("menus").select("id").eq("owner_id", ownerId);
}

export async function updateMenuById(supabase, menuId, patch) {
  return supabase.from("menus").update(patch).eq("id", menuId);
}

// Todos os slugs, paginando: o PostgREST corta a resposta em 1000 linhas
export async function listMenuSlugs(supabase) {
  const PAGE = 1000;
  const all = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from("menus")
      .select("slug, updated_at")
      .order("id")
      .range(from, from + PAGE - 1);
    if (error) return { data: all, error };
    all.push(...data);
    if (data.length < PAGE) return { data: all, error: null };
  }
}

// Controle manual de aberto/fechado (vale mais que o horário)
export async function getStoreState(supabase, menuId) {
  return supabase.from("menus").select("manual_control, is_open").eq("id", menuId).maybeSingle();
}
