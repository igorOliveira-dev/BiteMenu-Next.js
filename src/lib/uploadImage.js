import { supabase } from "./supabaseClient";

const MARKER = "/object/public/product-images/";

// Só envia; o arquivo antigo é apagado depois que o banco salvar (removeUnusedImages)
export async function uploadItemImage(file, thumbFile, userId) {
  if (!file) return { url: null, thumbUrl: null };

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

// Apaga do bucket as imagens que nenhum item usa mais.
// Itens duplicados compartilham a mesma imagem, então checa no banco antes de apagar.
export async function removeUnusedImages(urls) {
  const list = [...new Set(urls.filter((u) => u && u.includes(MARKER)))];
  if (!list.length) return;

  try {
    const [byImage, byThumb] = await Promise.all([
      supabase.from("menu_items").select("image_url").in("image_url", list),
      supabase.from("menu_items").select("thumb_url").in("thumb_url", list),
    ]);
    if (byImage.error || byThumb.error) return; // na dúvida, não apaga

    const used = new Set([
      ...byImage.data.map((r) => r.image_url),
      ...byThumb.data.map((r) => r.thumb_url),
    ]);
    const paths = list
      .filter((u) => !used.has(u))
      .map((u) => u.substring(u.indexOf(MARKER) + MARKER.length));

    if (paths.length) await supabase.storage.from("product-images").remove(paths);
  } catch (err) {
    console.error("Falha ao remover imagens antigas:", err);
  }
}
