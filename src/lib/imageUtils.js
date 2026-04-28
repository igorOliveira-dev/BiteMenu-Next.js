/**
 * Retorna a URL original da imagem.
 * A otimização (WebP, redimensionamento) é feita pelo Next.js Image via /_next/image.
 * Para usar a transformação nativa do Supabase Storage, é necessário o plano Pro.
 */
export function supabaseImg(url) {
  return url ?? null;
}
