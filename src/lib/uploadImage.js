import { supabase } from "./supabaseClient";

export async function uploadItemImage(file, userId) {
  if (!file) return null;
  const ext = file.name.split(".").pop();
  const path = `menu-items/${userId}/${Date.now()}.${ext}`;

  const { data, error } = await supabase.storage.from("public").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });

  if (error) throw error;

  const { data: publicUrlData } = supabase.storage.from("public").getPublicUrl(path);
  return publicUrlData.publicUrl;
}
