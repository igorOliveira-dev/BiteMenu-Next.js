// Plano do dono via função (tasks/seguranca/security-1-functions.sql): profiles só é legível pelo próprio usuário,
// e a equipe do cardápio também precisa saber o plano do dono
export async function getOwnerRole(supabase, ownerId) {
  const { data, error } = await supabase.rpc("menu_owner_role", { p_owner_id: ownerId });
  return { data: data ? { role: data } : null, error };
}

// Endereço do cliente na conta (tasks/descobrir/profile-address.sql), para não depender só do aparelho
export async function saveProfileAddress(supabase, profileId, addressParts) {
  return supabase
    .from("profiles")
    .update({ address_details: addressParts, cep: addressParts.cep || null })
    .eq("id", profileId);
}

// Cadastro: telefone já usado por outra conta?
export async function isPhoneInUse(supabase, phone) {
  return supabase.rpc("phone_in_use", { p_phone: phone });
}
