/**
 * Retorna a URL da imagem, opcionalmente otimizada via Supabase Image Transformations
 * (disponível no plano Pro). Se width/height não forem informados, retorna a URL original.
 */
export function supabaseImg(url, { width, height, quality = 75, resize = "cover" } = {}) {
  if (!url) return null;

  return url;
  // if (!url.includes("/storage/v1/object/public/")) return url;

  // const transformedBase = url.replace("/storage/v1/object/public/", "/storage/v1/render/image/public/");

  // if (!width && !height) return transformedBase;

  // const params = new URLSearchParams();
  // if (width) params.set("width", width);
  // if (height) params.set("height", height);
  // if (quality) params.set("quality", quality);
  // if (resize) params.set("resize", resize);

  // return `${transformedBase}?${params.toString()}`;
}
