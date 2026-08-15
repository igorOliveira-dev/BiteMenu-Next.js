export async function getOwnerRole(supabase, ownerId) {
  return supabase.from("profiles").select("role").eq("id", ownerId).single();
}
