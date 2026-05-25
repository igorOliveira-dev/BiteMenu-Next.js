type ToWebpTargetOptions = {
  maxUploadMB?: number;
};

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

export async function fileToWebp(file: File, { maxUploadMB = 20 }: ToWebpTargetOptions = {}): Promise<File> {
  const sizeMB = file.size / 1024 / 1024;

  if (sizeMB > maxUploadMB) {
    throw new Error(`A imagem possui ${sizeMB.toFixed(1)} MB. O limite é ${maxUploadMB} MB.`);
  }

  const img = await loadImage(file);

  const origW = img.naturalWidth;
  const origH = img.naturalHeight;

  let width = origW;
  let height = origH;

  let quality = 0.9;
  let maxDimension = Infinity;

  // Imagens grandes recebem tratamento leve
  if (sizeMB > 8) {
    maxDimension = 2000;
    quality = 0.85;
  } else if (sizeMB > 3) {
    maxDimension = 2500;
    quality = 0.88;
  }

  // Proteção contra resoluções absurdas
  const MAX_PIXEL_SIDE = 4000;

  const currentLargestSide = Math.max(width, height);

  if (currentLargestSide > MAX_PIXEL_SIDE) {
    const scale = MAX_PIXEL_SIDE / currentLargestSide;

    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }

  // Redimensionamento conforme o peso do arquivo
  const resizedLargestSide = Math.max(width, height);

  if (Number.isFinite(maxDimension) && resizedLargestSide > maxDimension) {
    const scale = maxDimension / resizedLargestSide;

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

  const blob = await canvasToWebpBlob(canvas, quality);

  console.log("Conversão WebP", {
    original: {
      nome: file.name,
      tipo: file.type,
      tamanhoKB: Math.round(file.size / 1024),
      largura: origW,
      altura: origH,
    },
    final: {
      tamanhoKB: Math.round(blob.size / 1024),
      largura: width,
      altura: height,
      qualidade: quality,
      tipo: "image/webp",
    },
  });

  const baseName = file.name.replace(/\.[^.]+$/, "");

  return new File([blob], `${baseName}.webp`, {
    type: "image/webp",
    lastModified: Date.now(),
  });
}
