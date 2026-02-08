type ToWebpOptions = {
  quality?: number;
  maxSize?: number;
  force?: boolean;
};

export async function fileToWebp(
  file: File,
  { quality = 0.82, maxSize = 1600, force = false }: ToWebpOptions = {},
): Promise<File> {
  const isWebp = file.type === "image/webp" || file.name.toLowerCase().endsWith(".webp");
  if (isWebp && !force) return file;

  // Decodifica a imagem (createImageBitmap é rápido e bom)
  const bitmap = await createImageBitmap(file);

  // Redimensiona mantendo proporção (opcional)
  let { width, height } = bitmap;
  const scale = Math.min(1, maxSize / Math.max(width, height));
  const targetW = Math.round(width * scale);
  const targetH = Math.round(height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = targetW;
  canvas.height = targetH;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D não disponível");

  ctx.drawImage(bitmap, 0, 0, targetW, targetH);

  const blob: Blob = await new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Falha ao gerar WebP"))), "image/webp", quality);
  });

  const baseName = file.name.replace(/\.[^.]+$/, "");
  return new File([blob], `${baseName}.webp`, { type: "image/webp", lastModified: Date.now() });
}
