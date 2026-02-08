import { supabase } from "./supabaseClient";

export async function uploadItemImage(file, userId, oldImageUrl = null) {
  if (!file) return oldImageUrl || null;

  // Remove imagem antiga (do jeito que você já faz)
  if (oldImageUrl) {
    try {
      const marker = "/object/public/product-images/";
      const pathStart = oldImageUrl.indexOf(marker);

      if (pathStart !== -1) {
        const oldPath = oldImageUrl.substring(pathStart + marker.length);
        await supabase.storage.from("product-images").remove([oldPath]);
      }
    } catch (err) {
      console.error("Falha ao remover imagem antiga:", err);
    }
  }

  // ✅ AQUI: nome final no bucket (sempre webp)
  const filePath = `menu-items/${userId ?? "unknown"}/${crypto.randomUUID()}.webp`;

  const { error } = await supabase.storage.from("product-images").upload(filePath, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: "image/webp", // bom deixar explícito
  });

  if (error) throw error;

  const { data: publicUrlData } = supabase.storage.from("product-images").getPublicUrl(filePath);
  return publicUrlData?.publicUrl ?? null;
}
