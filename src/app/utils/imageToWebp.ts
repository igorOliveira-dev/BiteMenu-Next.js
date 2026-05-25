function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);

    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Falha ao carregar imagem"));
    };

    img.src = url;
  });
}

function canvasToWebpBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Falha ao gerar WebP"));
        }
      },
      "image/webp",
      quality,
    );
  });
}

export async function fileToWebp(file: File): Promise<File> {
  const img = await loadImage(file);

  const origWidth = img.naturalWidth;
  const origHeight = img.naturalHeight;

  let width = origWidth;
  let height = origHeight;

  /**
   * Evita canvas gigantescos que podem travar celulares
   * ou consumir muita memória.
   *
   * 4000px é mais do que suficiente para fotos de cardápio.
   */
  const MAX_SIDE = 4000;

  const largestSide = Math.max(width, height);

  if (largestSide > MAX_SIDE) {
    const scale = MAX_SIDE / largestSide;

    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }

  const canvas = document.createElement("canvas");

  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Canvas 2D não disponível");
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  ctx.drawImage(img, 0, 0, width, height);

  /**
   * 95% mantém qualidade excelente
   * e ainda reduz bastante o tamanho
   * comparado ao JPEG original.
   */
  const blob = await canvasToWebpBlob(canvas, 0.95);

  console.log("Conversão WebP", {
    original: {
      nome: file.name,
      tipo: file.type,
      tamanhoKB: Math.round(file.size / 1024),
      largura: origWidth,
      altura: origHeight,
    },
    final: {
      tamanhoKB: Math.round(blob.size / 1024),
      largura: width,
      altura: height,
      qualidade: 0.95,
      tipo: "image/webp",
    },
  });

  const baseName = file.name.replace(/\.[^.]+$/, "");

  return new File([blob], `${baseName}.webp`, {
    type: "image/webp",
    lastModified: Date.now(),
  });
}
