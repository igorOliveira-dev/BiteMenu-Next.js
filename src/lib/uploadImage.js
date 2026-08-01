import { supabase } from "./supabaseClient";

export async function uploadItemImage(
  file,
  thumbFile,
  userId,
  oldImageUrl = null,
  oldThumbUrl = null,
) {
  if (!file) return { url: oldImageUrl || null, thumbUrl: oldThumbUrl || null };

  const marker = "/object/public/product-images/";

  // remove imagem antiga (original)
  if (oldImageUrl) {
    try {
      const pathStart = oldImageUrl.indexOf(marker);
      if (pathStart !== -1) {
        const oldPath = oldImageUrl.substring(pathStart + marker.length);
        await supabase.storage.from("product-images").remove([oldPath]);
      }
    } catch (err) {
      console.error("Falha ao remover imagem antiga:", err);
    }
  }

  // remove thumbnail antigo
  if (oldThumbUrl) {
    try {
      const pathStart = oldThumbUrl.indexOf(marker);
      if (pathStart !== -1) {
        const oldThumbPath = oldThumbUrl.substring(pathStart + marker.length);
        await supabase.storage.from("product-images").remove([oldThumbPath]);
      }
    } catch (err) {
      console.error("Falha ao remover thumbnail antigo:", err);
    }
  }

  const id = crypto.randomUUID();
  const filePath = `menu-items/${userId ?? "unknown"}/${id}.webp`;
  const thumbPath = `menu-items/${userId ?? "unknown"}/${id}-thumb.webp`;

  const { error } = await supabase.storage
    .from("product-images")
    .upload(filePath, file, {
      cacheControl: "31536000",
      upsert: false,
      contentType: "image/webp",
    });
  if (error) throw error;

  let thumbUrl = null;
  if (thumbFile) {
    const { error: thumbError } = await supabase.storage
      .from("product-images")
      .upload(thumbPath, thumbFile, {
        cacheControl: "31536000",
        upsert: false,
        contentType: "image/webp",
      });
    if (thumbError) throw thumbError;

    const { data: thumbPublicUrl } = supabase.storage
      .from("product-images")
      .getPublicUrl(thumbPath);
    thumbUrl = thumbPublicUrl?.publicUrl ?? null;
  }

  const { data: publicUrlData } = supabase.storage
    .from("product-images")
    .getPublicUrl(filePath);
  return { url: publicUrlData?.publicUrl ?? null, thumbUrl };
}
