// Linktree do estabelecimento (tasks/linktree/linktree-plan.md). Sem imports de servidor: a aba do painel também usa.
// A segurança está aqui (cleanLinktree), não no banco: o dono pode gravar qualquer JSON em menus.linktree pela API.
// Self-check: node scripts/linktree-check.mjs
import { contrastRatio, getContrastTextColor } from "../utils/color.js";

// mesmo padrão de LANDING_ROLES / CUSTOM_LAYOUT_ROLES: o Enterprise ainda não existe, então hoje é só admin
export const LINKTREE_ROLES = ["admin", "enterprise"];

export const MAX_LINKS = 30;
export const MAX_LABEL = 60;
export const MAX_URL = 500;
export const BUTTON_STYLES = ["fill", "outline", "soft"];
export const BUTTON_SHAPES = ["pill", "rounded"];

// chave → nome no painel. O componente de cada uma fica em LinktreeView (ICON_COMPONENTS).
export const ICONS = {
  link: "Link",
  menu: "Cardápio",
  instagram: "Instagram",
  whatsapp: "WhatsApp",
  facebook: "Facebook",
  tiktok: "TikTok",
  youtube: "YouTube",
  x: "X (Twitter)",
  threads: "Threads",
  ifood: "iFood",
  ubereats: "Uber Eats",
  delivery: "Delivery",
  bag: "Loja",
  maps: "Mapa",
  phone: "Telefone",
  email: "E-mail",
  site: "Site",
  star: "Avaliações",
  calendar: "Reservas",
  gift: "Presente",
  ticket: "Cupom",
  wifi: "Wi-Fi",
  spotify: "Spotify",
  telegram: "Telegram",
  heart: "Favorito",
};

// domínio (ou subdomínio dele) → ícone automático
const AUTO_ICONS = [
  ["instagram", ["instagram.com", "instagr.am"]],
  ["whatsapp", ["wa.me", "whatsapp.com"]],
  ["facebook", ["facebook.com", "fb.com", "fb.me"]],
  ["tiktok", ["tiktok.com"]],
  ["youtube", ["youtube.com", "youtu.be"]],
  ["x", ["x.com", "twitter.com"]],
  ["threads", ["threads.net", "threads.com"]],
  ["ifood", ["ifood.com.br"]],
  ["ubereats", ["ubereats.com"]],
  ["maps", ["maps.app.goo.gl", "maps.google.com", "goo.gl", "waze.com"]],
  ["spotify", ["spotify.com"]],
  ["telegram", ["t.me", "telegram.me", "telegram.org"]],
];

const HEX = /^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
const PROTOCOLS = ["https:", "http:", "tel:", "mailto:"];

const has = (obj, key) => typeof key === "string" && Object.prototype.hasOwnProperty.call(obj, key);

export const newLinkId = () => Math.random().toString(36).slice(2, 10);

// O que o dono digitou → URL. "instagram.com/x" vira "https://instagram.com/x"; "a@b.com" vira "mailto:a@b.com".
// Não valida: quem decide é safeUrl.
export function normalizeUrl(input) {
  const s = String(input ?? "").trim();
  if (!s) return "";
  if (/^[a-z][a-z0-9+.-]*:/i.test(s)) return s; // já tem esquema (inclusive os proibidos: safeUrl recusa)
  if (/^[^\s@/]+@[^\s@/]+\.[^\s@/]+$/.test(s)) return `mailto:${s}`;
  return `https://${s.replace(/^\/+/, "")}`;
}

// URL aceita ou null. Só https/http/tel/mailto; o parser do URL tira tab/quebra de linha ("java\tscript:"),
// então o protocolo checado é o que o navegador usaria.
export function safeUrl(url) {
  if (typeof url !== "string" || !url.trim() || url.length > MAX_URL) return null;
  let u;
  try {
    u = new URL(url.trim());
  } catch {
    return null;
  }
  if (!PROTOCOLS.includes(u.protocol)) return null;
  if ((u.protocol === "https:" || u.protocol === "http:") && !u.hostname.includes(".")) return null;
  if ((u.protocol === "tel:" || u.protocol === "mailto:") && u.pathname.length < 3) return null;
  return u.href;
}

export function iconFor(link) {
  if (has(ICONS, link?.icon)) return link.icon;
  if (link?.kind === "menu") return "menu";
  const url = link?.url || "";
  if (url.startsWith("tel:")) return "phone";
  if (url.startsWith("mailto:")) return "email";
  try {
    const u = new URL(url);
    const host = u.hostname.toLowerCase().replace(/^www\./, "");
    if (/(^|\.)google\.[a-z.]+$/.test(host) && u.pathname.startsWith("/maps")) return "maps";
    for (const [key, domains] of AUTO_ICONS) {
      if (domains.some((d) => host === d || host.endsWith(`.${d}`))) return key;
    }
  } catch {}
  return "link";
}

export const linkHref = (link, slug) => (link.kind === "menu" ? `/menu/${slug}` : link.url);

export const linkIsExternal = (link) => link.kind !== "menu";

// Qualquer entrada (null, lixo, JSON antigo) → linktree válida. Link inválido some; estilo inválido volta ao padrão.
export function cleanLinktree(raw) {
  const src = raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
  const s = src.style && typeof src.style === "object" ? src.style : {};
  const c = s.colors;
  const colors =
    c && typeof c === "object" && [c.bg, c.title, c.details].every((v) => typeof v === "string" && HEX.test(v))
      ? { bg: c.bg, title: c.title, details: c.details }
      : null;

  const links = [];
  const ids = new Set();
  for (const l of Array.isArray(src.links) ? src.links : []) {
    if (links.length >= MAX_LINKS) break;
    if (!l || typeof l !== "object") continue;
    const label = typeof l.label === "string" ? l.label.trim().slice(0, MAX_LABEL) : "";
    if (!label) continue;

    let id = typeof l.id === "string" && /^[\w-]{1,40}$/.test(l.id) ? l.id : newLinkId();
    if (ids.has(id)) id = `${id}-${links.length}`;
    ids.add(id);

    const base = { id, label, icon: has(ICONS, l.icon) ? l.icon : null, hidden: l.hidden === true };
    if (l.kind === "menu") {
      links.push({ ...base, kind: "menu" });
    } else {
      const url = safeUrl(l.url);
      if (url) links.push({ ...base, kind: "url", url });
    }
  }

  return {
    v: 1,
    links,
    style: {
      colors,
      button: BUTTON_STYLES.includes(s.button) ? s.button : "fill",
      shape: BUTTON_SHAPES.includes(s.shape) ? s.shape : "pill",
      showBanner: s.showBanner !== false,
      showLogo: s.showLogo !== false,
      showDescription: s.showDescription !== false,
    },
  };
}

export function defaultLinktree() {
  const base = cleanLinktree(null);
  return { ...base, links: [{ id: newLinkId(), kind: "menu", label: "Ver cardápio", icon: null, hidden: false }] };
}

export const hasVisibleLinks = (linktree) => !!linktree?.links?.some((l) => !l.hidden);

// Cores próprias da linktree ou as do cardápio, mais os tons derivados (mesma regra do useClientMenu).
// Título e borda caem para a cor de texto quando não dá para ler sobre o fundo.
export function linktreeColors(style, menu) {
  const own = style?.colors;
  const bg = own?.bg || menu?.background_color || "#ffffff";
  const title = own?.title || menu?.title_color || "#171717";
  const details = own?.details || menu?.details_color || "#d42020";
  const dark = getContrastTextColor(bg) === "white";
  const foreground = dark ? "#fafafa" : "#171717";
  return {
    bg,
    details,
    foreground,
    title: contrastRatio(bg, title) >= 3 ? title : foreground,
    gray: dark ? "#cccccc" : "#333333",
    translucid: dark ? "#ffffff15" : "#00000015",
    onDetails: getContrastTextColor(details) === "white" ? "#ffffff" : "#000000",
    border: contrastRatio(bg, details) >= 3 ? details : foreground,
  };
}
