type ToWebpTargetOptions = {
  maxBytes?: number; // ex: 400 * 1024
  maxDimension?: number; // ex: 1600 (limite inicial)
  minDimension?: number; // ex: 720 (não deixa ficar minúscula)
  startQuality?: number; // ex: 0.82
  minQuality?: number; // ex: 0.45
  maxAttempts?: number; // ex: 12
  force?: boolean;
};

async function canvasToWebpBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return await new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Falha ao gerar WebP"))), "image/webp", quality);
  });
}

export async function fileToWebp(
  file: File,
  {
    maxBytes = 400 * 1024,
    maxDimension = 1600,
    minDimension = 720,
    startQuality = 0.82,
    minQuality = 0.45,
    maxAttempts = 12,
    force = true,
  }: ToWebpTargetOptions = {},
): Promise<File> {
  const isWebp = file.type === "image/webp" || file.name.toLowerCase().endsWith(".webp");
  if (isWebp && !force && file.size <= maxBytes) return file;

  const bitmap = await createImageBitmap(file);

  const origW = bitmap.width;
  const origH = bitmap.height;

  // escala inicial respeitando maxDimension
  let scale = Math.min(1, maxDimension / Math.max(origW, origH));
  let quality = startQuality;

  let bestBlob: Blob | null = null;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const w = Math.max(1, Math.round(origW * scale));
    const h = Math.max(1, Math.round(origH * scale));

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;

    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D não disponível");
    ctx.drawImage(bitmap, 0, 0, w, h);

    const blob = await canvasToWebpBlob(canvas, quality);

    // guarda o melhor (menor) que conseguimos até agora
    if (!bestBlob || blob.size < bestBlob.size) bestBlob = blob;

    if (blob.size <= maxBytes) {
      const baseName = file.name.replace(/\.[^.]+$/, "");
      return new File([blob], `${baseName}.webp`, { type: "image/webp", lastModified: Date.now() });
    }

    // não coube: estratégia
    // 1) diminui quality até o mínimo
    // 2) depois diminui dimensão (scale) até minDimension
    if (quality > minQuality) {
      quality = Math.max(minQuality, quality - 0.08);
    } else {
      const nextScale = scale * 0.85;
      const nextMaxDim = Math.round(Math.max(origW, origH) * nextScale);

      if (nextMaxDim < minDimension) break; // não vamos reduzir mais que isso
      scale = nextScale;
    }
  }

  // Se falhou em bater o alvo, você decide: bloquear ou aceitar o melhor que deu.
  // Eu recomendo bloquear e pedir recorte/imagem melhor, porque 400KB é a regra.
  throw new Error(
    `Não foi possível comprimir para ≤ ${Math.round(maxBytes / 1024)}KB sem passar do limite mínimo de qualidade/dimensão.`,
  );
}
