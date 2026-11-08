import Image from "next/image";
import BannerImage from "@/components/BannerImage";
import { contrastRatio, getContrastTextColor } from "@/utils/color";
import { iconFor, linkHref, linkIsExternal, linktreeColors } from "@/lib/linktree";
import logo from "../../../../public/brand/logo-sino.png";
import {
  FaBagShopping,
  FaCalendar,
  FaEnvelope,
  FaFacebook,
  FaGift,
  FaGlobe,
  FaHeart,
  FaInstagram,
  FaLink,
  FaLocationDot,
  FaMotorcycle,
  FaPhone,
  FaSpotify,
  FaStar,
  FaTelegram,
  FaThreads,
  FaTicket,
  FaTiktok,
  FaUtensils,
  FaWhatsapp,
  FaWifi,
  FaXTwitter,
  FaYoutube,
} from "react-icons/fa6";
import { SiIfood, SiUbereats } from "react-icons/si";

// chaves de ICONS (src/lib/linktree.js) → componente
export const ICON_COMPONENTS = {
  link: FaLink,
  menu: FaUtensils,
  instagram: FaInstagram,
  whatsapp: FaWhatsapp,
  facebook: FaFacebook,
  tiktok: FaTiktok,
  youtube: FaYoutube,
  x: FaXTwitter,
  threads: FaThreads,
  ifood: SiIfood,
  ubereats: SiUbereats,
  delivery: FaMotorcycle,
  maps: FaLocationDot,
  phone: FaPhone,
  email: FaEnvelope,
  site: FaGlobe,
  star: FaStar,
  calendar: FaCalendar,
  gift: FaGift,
  ticket: FaTicket,
  wifi: FaWifi,
  spotify: FaSpotify,
  telegram: FaTelegram,
  heart: FaHeart,
  bag: FaBagShopping,
};

const BITE_RED = "#d42020";
const isImage = (url) => typeof url === "string" && /^https?:\/\//.test(url);

// Linktree pública (/links/[slug]) e prévia da aba Links: mesmo componente, para a prévia ser igual à página.
// `linktree` já passou por cleanLinktree. Cores só por estilo inline: o tema do painel não vaza na prévia.
export default function LinktreeView({ menu, linktree, preview = false }) {
  const { links, style } = linktree;
  const c = linktreeColors(style, menu);
  const visible = links.filter((l) => !l.hidden);
  const banner = style.showBanner && isImage(menu.banner_mobile_url || menu.banner_url);
  const showLogo = style.showLogo && isImage(menu.logo_url);
  const shape = style.shape === "rounded" ? "rounded-2xl" : "rounded-full";

  const buttonStyle =
    style.button === "outline"
      ? { backgroundColor: "transparent", color: c.foreground, borderColor: c.border }
      : style.button === "soft"
        ? { backgroundColor: c.translucid, color: c.foreground, borderColor: c.translucid }
        : { backgroundColor: c.details, color: c.onDetails, borderColor: c.details };

  // selo: vermelho do Bite Menu quando dá para ler sobre o fundo, senão monocromático (regra do MenuFooter)
  const useRed = contrastRatio(c.bg, BITE_RED) >= 3;
  const monoIsWhite = getContrastTextColor(c.bg) === "white";

  return (
    <div className={`w-full ${preview ? "min-h-full" : "min-h-dvh"}`} style={{ backgroundColor: c.bg, color: c.foreground }}>
      <main className="mx-auto flex w-full max-w-[480px] flex-col items-center px-4 pb-10 pt-4">
        {banner && (
          <div className="relative aspect-[2/1] w-full overflow-hidden rounded-2xl">
            {/* coluna estreita: sempre o recorte de celular (2:1) */}
            <BannerImage desktop={menu.banner_mobile_url || menu.banner_url} mobile={menu.banner_mobile_url || menu.banner_url} />
          </div>
        )}

        {showLogo && (
          <Image
            alt="Logo do estabelecimento"
            src={menu.logo_url}
            width={112}
            height={112}
            className={`relative aspect-square w-24 rounded-full object-cover ${banner ? "-mt-12" : "mt-6"}`}
            style={{ boxShadow: `0 0 0 4px ${c.bg}` }}
          />
        )}

        <h1
          className={`text-center text-2xl font-extrabold tracking-tight ${showLogo ? "mt-3" : "mt-6"}`}
          style={{ color: c.title }}
        >
          {menu.title}
        </h1>

        {style.showDescription && menu.description && (
          <p className="mt-1 whitespace-pre-line text-center text-sm" style={{ color: c.gray }}>
            {menu.description}
          </p>
        )}

        <nav className="mt-6 flex w-full flex-col gap-3" aria-label="Links">
          {visible.map((link) => {
            const Icon = ICON_COMPONENTS[iconFor(link)] || FaLink;
            // na prévia tudo abre em nova aba: clicar não tira o dono do painel
            const newTab = preview || linkIsExternal(link);
            return (
              <a
                key={link.id}
                href={linkHref(link, menu.slug)}
                {...(newTab && { target: "_blank", rel: "noopener noreferrer nofollow" })}
                className={`grid min-h-14 w-full grid-cols-[1.25rem_1fr_1.25rem] items-center gap-3 border px-5 py-3 text-[15px] font-semibold transition hover:opacity-85 ${shape}`}
                style={buttonStyle}
              >
                <Icon className="text-lg" aria-hidden />
                <span className="break-words text-center">{link.label}</span>
                <span />
              </a>
            );
          })}
          {preview && visible.length === 0 && (
            <p className="rounded-2xl border border-dashed p-6 text-center text-sm" style={{ borderColor: c.translucid, color: c.gray }}>
              Adicione um link para ele aparecer aqui.
            </p>
          )}
        </nav>

        <a
          href="https://www.bitemenu.com.br"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-10 flex items-center gap-1.5 text-xs font-semibold hover:underline"
          style={{ color: useRed ? BITE_RED : monoIsWhite ? "#ffffff" : "#000000" }}
        >
          <Image
            src={logo}
            alt=""
            width={18}
            height={17}
            style={useRed ? undefined : { filter: monoIsWhite ? "brightness(0) invert(1)" : "brightness(0)" }}
          />
          Feito com Bite Menu
        </a>
      </main>
    </div>
  );
}
