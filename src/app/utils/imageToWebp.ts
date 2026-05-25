type ToWebpTargetOptions = {
  maxBytes?: number;
  maxDimension?: number;
  minDimension?: number;
  startQuality?: number;
  minQuality?: number;
  maxAttempts?: number;
  force?: boolean;
};

async function canvasToWebpBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return await new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Falha ao gerar WebP"));
      },
      "image/webp",
      quality,
    );
  });
}

export async function fileToWebp(
  file: File,
  {
    maxBytes = 1024 * 1024, // 1MB
    maxDimension = 2000,
    minDimension = 1200,
    startQuality = 0.92,
    minQuality = 0.7,
    maxAttempts = 12,
    force = true,
  }: ToWebpTargetOptions = {},
): Promise<File> {
  // Não processa imagens pequenas
  if (file.size <= maxBytes) {
    return file;
  }

  const isWebp = file.type === "image/webp" || file.name.toLowerCase().endsWith(".webp");

  if (isWebp && !force && file.size <= maxBytes) {
    return file;
  }

  const bitmap = await createImageBitmap(file);

  const origW = bitmap.width;
  const origH = bitmap.height;

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

    if (!ctx) {
      throw new Error("Canvas 2D não disponível");
    }

    ctx.drawImage(bitmap, 0, 0, w, h);

    const blob = await canvasToWebpBlob(canvas, quality);

    console.log("Compressão:", {
      tentativa: attempt + 1,
      tamanhoKB: Math.round(blob.size / 1024),
      largura: w,
      altura: h,
      qualidade: quality,
    });

    bestBlob = blob;

    if (blob.size <= maxBytes) {
      const baseName = file.name.replace(/\.[^.]+$/, "");

      return new File([blob], `${baseName}.webp`, {
        type: "image/webp",
        lastModified: Date.now(),
      });
    }

    // Primeiro reduz qualidade
    if (quality > minQuality) {
      quality = Math.max(minQuality, quality - 0.05);
    }
    // Depois reduz resolução
    else {
      const nextScale = scale * 0.92;

      const nextMaxDimension = Math.max(origW, origH) * nextScale;

      if (nextMaxDimension < minDimension) {
        break;
      }

      scale = nextScale;
    }
  }

  // Retorna o melhor resultado obtido
  if (bestBlob) {
    const baseName = file.name.replace(/\.[^.]+$/, "");

    return new File([bestBlob], `${baseName}.webp`, {
      type: "image/webp",
      lastModified: Date.now(),
    });
  }

  throw new Error("Falha ao processar imagem.");
}
