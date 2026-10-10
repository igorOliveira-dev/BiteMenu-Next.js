// Proporções fixas do banner: o recorte feito no dashboard aparece exatamente assim em todos os layouts.
// Mudou aqui? Mude também BANNER_CROPS em BannerCropper.jsx.
export const BANNER_ASPECT_CLASS = "aspect-[2/1] md:aspect-[4/1]";

// Recorte de celular abaixo de 768px, recorte de desktop a partir disso.
// Banners antigos (sem recorte mobile) usam a mesma imagem nos dois.
export default function BannerImage({ desktop, mobile, alt = "Banner do estabelecimento", className = "" }) {
  return (
    <picture>
      <source media="(min-width: 768px)" srcSet={desktop} />
      <img
        src={mobile || desktop}
        alt={alt}
        fetchPriority="high"
        className={`absolute inset-0 w-full h-full object-cover ${className}`}
      />
    </picture>
  );
}
