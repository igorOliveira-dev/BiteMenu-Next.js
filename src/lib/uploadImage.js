import { supabase } from "./supabaseClient";

/**
 * Faz upload da imagem de item, removendo a anterior se houver.
 * @param {File} file - novo arquivo
 * @param {string} userId - id do dono
 * @param {string|null} oldImageUrl - URL antiga (para deletar)
 */
export async function uploadItemImage(file, userId, oldImageUrl = null) {
  console.log("🚀 Iniciando uploadItemImage");
  console.log("File recebido:", file);
  console.log("userId:", userId);
  console.log("oldImageUrl:", oldImageUrl);

  if (!file) {
    console.log("⚠ Nenhum arquivo fornecido. Retornando oldImageUrl.");
    return oldImageUrl || null;
  }

  // Se existir imagem anterior, tenta deletar
  if (oldImageUrl) {
    try {
      const marker = "/object/public/product-images/";
      const pathStart = oldImageUrl.indexOf(marker);

      console.log("🔍 Verificando caminho da imagem antiga...");
      console.log("marker:", marker);
      console.log("pathStart:", pathStart);

      if (pathStart !== -1) {
        // pega todo caminho após product-images/
        const path = oldImageUrl.substring(pathStart + marker.length);
        console.log("🗑 Caminho correto para deletar:", path);

        const { data, error } = await supabase.storage.from("product-images").remove([path]);
        console.log("Resposta do remove:", { data, error });

        if (error) {
          console.warn("❌ Erro ao deletar imagem antiga:", error.message);
        } else {
          console.log("✅ Imagem antiga deletada com sucesso.");
        }
      } else {
        console.warn("⚠ Não foi possível identificar caminho correto da imagem antiga.");
      }
    } catch (err) {
      console.error("❌ Falha ao remover imagem antiga:", err);
    }
  }

  const ext = file.name.split(".").pop();
  const path = `menu-items/${userId ?? "unknown"}/${Date.now()}.${ext}`;

  console.log("📤 Caminho para upload:", path);

  const { data, error } = await supabase.storage.from("product-images").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });

  console.log("Resposta do upload:", { data, error });

  if (error) {
    console.error("❌ Erro no upload da imagem:", error);
    throw error;
  }

  const { data: publicUrlData } = supabase.storage.from("product-images").getPublicUrl(path);
  console.log("🔗 URL pública da nova imagem:", publicUrlData?.publicUrl);

  console.log("✅ uploadItemImage finalizado.");
  return publicUrlData?.publicUrl ?? null;
}
