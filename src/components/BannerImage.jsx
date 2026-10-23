import { getImageProps } from "next/image";

// Proporções fixas do banner: o recorte feito no dashboard aparece exatamente assim em todos os layouts.
// Mudou aqui? Mude também BANNER_CROPS em BannerCropper.jsx.
export const BANNER_ASPECT_CLASS = "aspect-[2/1] md:aspect-[4/1]";

// Só URLs remotas passam pelo otimizador do Next (servido pela VPS, sem egress do Supabase).
// Prévias locais do dashboard (blob:) vão direto.
const isRemote = (src) => typeof src === "string" && /^https?:\/\//.test(src);

function optimizedSrcSet(src, width, height) {
  if (!isRemote(src)) return { srcSet: src, src };
  const { props } = getImageProps({ src, alt: "", width, height, sizes: "100vw" });
  return { srcSet: props.srcSet, src: props.src };
}

// Recorte de celular abaixo de 768px, recorte de desktop a partir disso.
// Banners antigos (sem recorte mobile) usam a mesma imagem nos dois.
export default function BannerImage({ desktop, mobile, alt = "Banner do estabelecimento", className = "" }) {
  const desktopImg = optimizedSrcSet(desktop, 1640, 410);
  const mobileImg = optimizedSrcSet(mobile || desktop, 1080, 540);

  return (
    <picture>
      <source media="(min-width: 768px)" srcSet={desktopImg.srcSet} sizes="100vw" />
      <img
        src={mobileImg.src}
        srcSet={mobileImg.srcSet}
        sizes="100vw"
        alt={alt}
        fetchPriority="high"
        className={`absolute inset-0 w-full h-full object-cover ${className}`}
      />
    </picture>
  );
}
