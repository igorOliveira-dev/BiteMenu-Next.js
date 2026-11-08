// Layout personalizado do cardápio (tasks/layout-personalizado/). Plano Enterprise.
// O cardápio vira uma lista de blocos; cada bloco tem estilo do painel, template HTML (com {{campos}}) e CSS.
// Sem imports: usado no servidor (page.jsx, rota da IA), no cardápio, na prévia e na aba do dashboard.
// Self-check: node scripts/custom-layout-check.mjs
import { contrastRatio, getContrastTextColor } from "../utils/color.js";

// Enterprise ainda não lançado: até lá só admin
export const CUSTOM_LAYOUT_ROLES = ["admin", "enterprise"];

// mesmo limite do check de menus.custom_layout (tasks/layout-personalizado/layout-personalizado.sql)
export const CUSTOM_LAYOUT_MAX_LENGTH = 200_000;
const MAX_BLOCKS = 30;
const MAX_TEMPLATE = 20_000;
const MAX_CSS = 30_000;

// Google Fonts liberadas (família -> parâmetro da API css2)
export const FONTS = {
  Inter: "Inter:wght@400;600;700;800",
  Poppins: "Poppins:wght@400;600;700;800",
  Montserrat: "Montserrat:wght@400;600;700;800",
  Nunito: "Nunito:wght@400;600;700;800",
  "Playfair Display": "Playfair+Display:wght@400;600;700;800",
  Lora: "Lora:wght@400;600;700",
  "DM Serif Display": "DM+Serif+Display",
  Oswald: "Oswald:wght@400;600;700",
  "Bebas Neue": "Bebas+Neue",
  "Roboto Slab": "Roboto+Slab:wght@400;600;700;800",
  Pacifico: "Pacifico",
  Caveat: "Caveat:wght@400;700",
};

// Campos de cada tipo de template ({{campo}}). Campo vazio esconde os elementos com data-if="campo".
export const FIELDS = {
  menu: ["title", "description", "logo", "banner", "address", "maps", "whatsapp", "status", "status_color"],
  item: ["name", "description", "price", "old_price", "image", "combos", "from"],
  category: ["name", "combos"],
};
// Só estes campos podem ser o valor inteiro de src/href: os outros são texto do dono (ex.: "javascript:...")
const URL_FIELDS = ["logo", "banner", "image", "maps", "whatsapp"];
// Cliques sem JS: data-action="hours" abre os horários, data-action="cart" abre o carrinho
export const ACTIONS = ["hours", "cart"];
export const DISPLAYS = ["list", "grid", "carousel"];

const HEADER_HTML = `<div class="bm-header">
  <img data-if="logo" class="bm-logo" src="{{logo}}" alt="Logo">
  <h1 class="bm-title">{{title}}</h1>
  <p data-if="description" class="bm-desc">{{description}}</p>
  <button data-action="hours" class="bm-status" style="color:{{status_color}}">{{status}}</button>
  <a data-if="address" class="bm-address" href="{{maps}}" target="_blank">{{address}}</a>
  <a data-if="whatsapp" class="bm-whats" href="{{whatsapp}}" target="_blank">WhatsApp</a>
</div>`;
const HEADER_CSS = `.bm-header{display:flex;flex-direction:column;align-items:center;gap:6px;text-align:center}
.bm-logo{width:96px;height:96px;border-radius:999px;object-fit:cover}
.bm-title{font-size:2rem;line-height:1.1;font-weight:800;color:var(--bm-title)}
.bm-desc{color:var(--bm-muted);max-width:28rem;font-size:.9rem}
.bm-status{font-size:.875rem;cursor:pointer}
.bm-address{font-size:.75rem;color:var(--bm-muted)}
.bm-whats{font-size:.75rem;border:1px solid var(--bm-line);border-radius:999px;padding:4px 12px;margin-top:4px}`;

const ITEM_ROW_HTML = `<div class="bm-card">
  <div class="bm-info">
    <p class="bm-name">{{name}}</p>
    <p data-if="description" class="bm-desc">{{description}}</p>
    <p data-if="combos" class="bm-combos">{{combos}}</p>
    <p class="bm-price"><small data-if="from">{{from}} </small><s data-if="old_price">{{old_price}}</s> {{price}}</p>
  </div>
  <img data-if="image" class="bm-img" src="{{image}}" alt="{{name}}" loading="lazy">
</div>`;
const ITEM_ROW_CSS = `.bm-card{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 0;border-bottom:1px solid var(--bm-line)}
.bm-info{flex:1;min-width:0}
.bm-name{font-weight:600}
.bm-desc{font-size:.875rem;color:var(--bm-muted);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.bm-combos{font-size:.75rem;font-weight:600;color:var(--bm-accent)}
.bm-price{font-weight:700;margin-top:6px}
.bm-price s{font-weight:400;font-size:.75rem;color:var(--bm-muted);margin-right:4px}
.bm-price small{display:block;font-weight:400;font-size:.75rem}
.bm-img{width:88px;height:88px;border-radius:12px;object-fit:cover;flex-shrink:0}
.bm-cat{font-size:1.25rem;font-weight:800;padding-top:24px}
.bm-cat small{font-size:.75rem;font-weight:600;color:var(--bm-accent);margin-left:8px}`;

const ITEM_CARD_HTML = `<div class="bm-card">
  <img data-if="image" class="bm-img" src="{{image}}" alt="{{name}}" loading="lazy">
  <div class="bm-info">
    <p class="bm-name">{{name}}</p>
    <p class="bm-price"><s data-if="old_price">{{old_price}}</s> {{price}}</p>
  </div>
</div>`;
const ITEM_CARD_CSS = `.bm-title-section{font-size:.75rem;font-weight:600;text-transform:uppercase;letter-spacing:.15em;color:var(--bm-muted);margin-bottom:12px}
.bm-card{border-radius:16px;overflow:hidden;background:var(--bm-line);height:100%}
.bm-img{width:100%;aspect-ratio:1;object-fit:cover}
.bm-info{padding:12px}
.bm-name{font-weight:600;font-size:.9rem}
.bm-price{font-weight:700;margin-top:4px}
.bm-price s{font-weight:400;font-size:.75rem;color:var(--bm-muted);margin-right:4px}`;

const CATEGORY_HTML = `<h2 class="bm-cat">{{name}} <small data-if="combos">{{combos}}</small></h2>`;

// Blocos que o dono pode usar. template: tipo de campos do html do bloco.
export const BLOCK_TYPES = {
  banner: { label: "Banner", hint: "Imagem de capa do cardápio" },
  header: { label: "Cabeçalho", hint: "Logo, nome, descrição, horário e endereço", template: "menu" },
  search: { label: "Busca", hint: "Campo para buscar produtos" },
  loyalty: { label: "Fidelidade", hint: "Progresso do programa de fidelidade" },
  categories: { label: "Barra de categorias", hint: "Atalhos fixos para cada categoria" },
  starred: { label: "Destaques", hint: "Produtos marcados como destaque", template: "item" },
  items: { label: "Produtos", hint: "Todas as categorias com os produtos", template: "item" },
  html: { label: "Aviso ou texto", hint: "Promoção, recado, horário especial...", template: "menu" },
};

const BLOCK_DEFAULTS = {
  banner: {},
  header: { style: { padding: 24 }, html: HEADER_HTML, css: HEADER_CSS },
  search: { style: { padding: 12 }, placeholder: "Buscar item do cardápio..." },
  loyalty: { style: { padding: 12 } },
  categories: {},
  starred: {
    style: { padding: 12 },
    title: "Destaques",
    display: "carousel",
    itemWidth: 220,
    html: ITEM_CARD_HTML,
    css: ITEM_CARD_CSS,
  },
  items: {
    style: { padding: 12 },
    display: "list",
    columns: 2,
    gap: 0,
    html: ITEM_ROW_HTML,
    categoryHtml: CATEGORY_HTML,
    css: ITEM_ROW_CSS,
  },
  html: {
    style: { padding: 12 },
    html: `<div class="bm-notice"><strong>Aviso</strong><p>Escreva aqui uma promoção ou recado para os clientes.</p></div>`,
    css: `.bm-notice{border-radius:16px;padding:16px;background:var(--bm-accent);color:var(--bm-accent-text);text-align:center}`,
  },
};

// Bloco novo com os valores padrão (o template padrão é o "padrão" que a IA segue)
export function newBlock(type, id) {
  return normalizeBlock({ ...structuredClone(BLOCK_DEFAULTS[type]), type, id: id || Math.random().toString(36).slice(2, 8) });
}

// Ponto de partida: parecido com o layout Lista
export function defaultLayout() {
  return normalizeLayout({
    blocks: ["banner", "header", "search", "loyalty", "categories", "starred", "items"].map((t) => newBlock(t, t)),
  });
}

const HEX = /^#[0-9a-f]{3,8}$/i;
// fundo de seção pela paleta: [fundo, texto legível por cima]
const BG_TOKENS = { soft: ["var(--bm-soft)", "var(--bm-text)"], accent: ["var(--bm-accent)", "var(--bm-accent-text)"] };
// [fundo, texto] da seção para CSS; null sem fundo
export const sectionColors = (style) =>
  style?.bg ? [BG_TOKENS[style.bg]?.[0] ?? style.bg, style.color || BG_TOKENS[style.bg]?.[1] || readable(style.bg)] : null;
const num = (v, min, max, def) => {
  if (v === null || v === undefined || v === "") return def;
  const n = Number(v);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, Math.round(n))) : def;
};
const str = (v, max) => (typeof v === "string" ? v.slice(0, max) : "");

function normalizeBlock(b, fallbackId) {
  const kind = BLOCK_TYPES[b.type];
  const s = b.style && typeof b.style === "object" ? b.style : {};
  const out = {
    id: /^[a-z0-9]{1,16}$/i.test(b.id ?? "") ? b.id : fallbackId,
    type: b.type,
    hidden: b.hidden === true,
    style: {
      bg: HEX.test(s.bg ?? "") || BG_TOKENS[s.bg] ? s.bg : "", // hex ou cor da paleta (acompanha se a paleta mudar)
      color: HEX.test(s.color ?? "") ? s.color : "",
      padding: num(s.padding, 0, 120, null),
      radius: num(s.radius, 0, 64, 0),
      maxWidth: num(s.maxWidth, 0, 2000, 0),
    },
    css: str(b.css, MAX_CSS),
  };
  if (kind.template) {
    out.html = str(b.html, MAX_TEMPLATE);
    out.hide = (Array.isArray(b.hide) ? b.hide : []).filter((f) => FIELDS[kind.template].includes(f));
  }
  if (b.type === "items" || b.type === "starred") {
    out.display = DISPLAYS.includes(b.display) ? b.display : "list";
    out.columns = num(b.columns, 1, 6, 3);
    out.columnsMobile = num(b.columnsMobile, 1, 3, 1);
    out.gap = num(b.gap, 0, 64, 12);
    out.itemWidth = num(b.itemWidth, 120, 480, 220);
    out.featured = b.featured === true; // primeiro produto maior (só na grade)
  }
  if (b.type === "starred") out.title = str(b.title, 80);
  if (b.type === "items") out.categoryHtml = str(b.categoryHtml, 4000);
  if (b.type === "search") out.placeholder = str(b.placeholder, 80);
  return out;
}

// Valida e completa o JSON (vindo do banco, da IA ou do painel). null = inválido.
export function normalizeLayout(raw) {
  if (!raw || typeof raw !== "object" || !Array.isArray(raw.blocks)) return null;
  const ids = new Set();
  const blocks = raw.blocks
    .filter((b) => b && typeof b === "object" && BLOCK_TYPES[b.type])
    .slice(0, MAX_BLOCKS)
    .map((b, i) => {
      const block = normalizeBlock(b, `b${i}x`);
      if (ids.has(block.id)) block.id = `b${i}x`;
      ids.add(block.id);
      return block;
    });
  const c = raw.colors && typeof raw.colors === "object" ? raw.colors : {};
  const color = (v) => (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v ?? "") ? v : ""); // o campo hex aceita #abc
  return {
    v: 1,
    font: FONTS[raw.font] ? raw.font : "",
    pageWidth: num(raw.pageWidth, 480, 1600, 1100),
    // cores do cardápio escolhidas no painel/IA; vazio = cor do dono (aba Aparência). Texto vazio = automático legível
    colors: { bg: color(c.bg), text: color(c.text), accent: color(c.accent) },
    css: str(raw.css, MAX_CSS),
    blocks,
  };
}

// --- Sanitização (o cardápio roda na origem do bitemenu, com a sessão dos clientes: aqui é a barreira) ---

// CSS: sem fechar o <style>, sem @import/expression, url() só https ou imagem data:.
export function cleanCss(css) {
  return String(css ?? "")
    .slice(0, MAX_CSS)
    .replace(/\/\*[\s\S]*?(\*\/|$)/g, "")
    .replace(/[<\\]/g, "") // "<" fecharia o <style>; "\" permitiria escapes como @\69mport
    .replace(/"[^"\n]*"|'[^'\n]*'/g, (s) => s.replace(/[{}]/g, "")) // chave dentro de string confundiria o escopo
    .replace(/@import[^;]*;?/gi, "")
    .replace(/expression\s*\(|javascript:|behavior\s*:|-moz-binding/gi, "")
    .replace(/url\(\s*(?!["']?\s*(https:|data:image\/))[^)]*\)/gi, "none");
}

// CSS do bloco dentro do seletor dele (CSS aninhado nativo). Declarações soltas valem para o próprio bloco.
// @keyframes/@font-face não podem ficar aninhados: vão para fora. Chaves sobrando são descartadas/fechadas,
// para nenhuma regra escapar do escopo.
export function scopeCss(sel, raw) {
  const css = cleanCss(raw);
  let hoisted = "";
  let rest = "";
  let depth = 0;
  for (let i = 0; i < css.length; i++) {
    if (depth === 0 && /^@(-webkit-)?keyframes\b|^@font-face\b/i.test(css.slice(i, i + 20))) {
      let d = 0;
      let j = i;
      for (; j < css.length; j++) {
        if (css[j] === "{") d++;
        else if (css[j] === "}" && --d === 0) break;
      }
      hoisted += css.slice(i, j + 1) + "}".repeat(Math.max(0, d)) + "\n";
      i = j;
      continue;
    }
    if (css[i] === "{") depth++;
    else if (css[i] === "}") {
      if (depth === 0) continue;
      depth--;
    }
    rest += css[i];
  }
  rest += "}".repeat(depth);
  return hoisted + (rest.trim() ? `${sel}{${rest}}\n` : "");
}

const TAGS = new Set(
  "div span p h1 h2 h3 h4 h5 h6 strong em b i u s small br hr img a ul ol li section header footer article figure figcaption blockquote mark del button".split(
    " ",
  ),
);
const VOID = new Set(["br", "hr", "img"]);
const PLAIN_ATTRS = new Set(["class", "alt", "title", "data-if", "loading", "aria-label", "aria-hidden", "role", "width", "height"]);
const SAFE_URL = new RegExp(`^(https://|tel:|mailto:|#|\\{\\{(${URL_FIELDS.join("|")})\\}\\}$)`, "i");
const attrEsc = (v) => v.replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function cleanAttrs(tag, raw) {
  let out = "";
  const seen = new Set();
  for (const [, n, v1, v2, v3] of raw.matchAll(/([^\s"'>/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g)) {
    const name = n.toLowerCase();
    let v = (v1 ?? v2 ?? v3 ?? "").trim();
    if (seen.has(name)) continue;
    if (name === "style") v = cleanCss(v).replace(/[{}]/g, "");
    else if (name === "src" || name === "href") {
      if ((name === "src") !== (tag === "img") || (name === "href" && tag !== "a") || !SAFE_URL.test(v)) continue;
    } else if (name === "target") {
      if (v !== "_blank") continue;
    } else if (name === "data-action") {
      if (!ACTIONS.includes(v)) continue;
    } else if (!PLAIN_ATTRS.has(name)) continue;
    seen.add(name);
    out += ` ${name}="${attrEsc(v)}"`;
  }
  if (seen.has("target")) out += ' rel="noopener noreferrer"';
  return out;
}

// HTML por lista branca, RECONSTRUÍDO (não é um "remover o perigoso"): só tags e atributos da lista saem, sempre
// com valor entre aspas e escapado; qualquer outro "<" vira texto; tags fechadas na ordem certa (não vaza do bloco).
export function cleanHtml(html) {
  const src = String(html ?? "")
    .slice(0, MAX_TEMPLATE)
    .replace(/<!--[\s\S]*?(-->|$)/g, "")
    .replace(/<(script|style|textarea|title|noscript|template|iframe|object|svg|math|select)\b[\s\S]*?(<\/\1\s*>|$)/gi, "");
  const out = [];
  const open = [];
  for (const [tok, close, rawName, attrs] of src.matchAll(/<(\/?)([a-zA-Z][a-zA-Z0-9]*)([^<>]*)>|[^<]+|</g)) {
    if (!rawName) {
      out.push(tok === "<" ? "&lt;" : tok.replace(/>/g, "&gt;"));
      continue;
    }
    const name = rawName.toLowerCase();
    if (!TAGS.has(name)) continue;
    if (close) {
      const at = open.lastIndexOf(name);
      if (at === -1) continue;
      while (open.length > at) out.push(`</${open.pop()}>`);
      continue;
    }
    out.push(`<${name}${cleanAttrs(name, attrs)}>`);
    if (!VOID.has(name)) open.push(name);
  }
  while (open.length) out.push(`</${open.pop()}>`);
  return out.join("");
}

// Layout pronto para renderizar: validado e com os templates limpos (o CSS é limpo em layoutCss)
export function cleanLayout(raw) {
  const layout = normalizeLayout(raw);
  if (!layout) return null;
  layout.blocks = layout.blocks.map((b) => ({
    ...b,
    ...(b.html !== undefined && { html: cleanHtml(b.html) }),
    ...(b.categoryHtml !== undefined && { categoryHtml: cleanHtml(b.categoryHtml) }),
  }));
  return layout;
}

// --- Edição manual x IA ---

const stable = (v) =>
  JSON.stringify(v, (_, x) => (x && typeof x === "object" && !Array.isArray(x) ? Object.fromEntries(Object.keys(x).sort().map((k) => [k, x[k]])) : x));
const same = (a, b) => stable(a) === stable(b);

// Três vias, campo a campo: entra só o que a IA mudou em relação ao que ela recebeu (base) e que o dono não mexeu
// desde o envio (cur). Assim a IA nunca desfaz uma edição manual (nem reverte campos que ela não tocou) e uma edição
// manual feita depois sempre vale. Se os dois mexeram no mesmo campo durante a geração, vale o do dono.
function mergeFields(base, ai, cur) {
  const out = { ...cur };
  for (const k of new Set([...Object.keys(base), ...Object.keys(ai)])) {
    if (same(ai[k], base[k]) || !same(cur[k], base[k])) continue;
    if (ai[k] === undefined) delete out[k];
    else out[k] = ai[k];
  }
  return out;
}
const mergeBlock = (base, ai, cur) => ({ ...mergeFields(base, ai, cur), style: mergeFields(base.style || {}, ai.style || {}, cur.style || {}) });

// base: layout enviado à IA · ai: resposta · cur: layout na tela quando a resposta chega (os três já normalizados)
export function mergeAiLayout(base, ai, cur) {
  const { blocks: _b, colors: _c, ...baseTop } = base;
  const { blocks: _a, colors: _d, ...aiTop } = ai;
  const { blocks: _e, colors: curColors, ...curTop } = cur;
  const out = { ...mergeFields(baseTop, aiTop, curTop), colors: mergeFields(base.colors || {}, ai.colors || {}, curColors || {}) };

  const B = new Map(base.blocks.map((b) => [b.id, b]));
  const A = new Map(ai.blocks.map((b) => [b.id, b]));
  // a IA removeu e o dono não mexeu: some. O que o dono criou ou alterou fica; o que o dono removeu continua removido
  let blocks = cur.blocks
    .filter((b) => !(B.has(b.id) && !A.has(b.id) && same(b, B.get(b.id))))
    .map((b) => (B.has(b.id) && A.has(b.id) ? mergeBlock(B.get(b.id), A.get(b.id), b) : b));
  const added = ai.blocks.filter((b) => !B.has(b.id));

  // ordem: se o dono não reordenou desde o envio, vale a da IA (blocos só do dono vão para o fim)
  // ponytail: bloco criado pelo dono no meio da lista durante uma reordenação da IA vai para o fim; raro demais para mais código
  const ids = (l) => l.map((b) => b.id);
  const common = (l, other) => ids(l).filter((id) => other.has(id));
  const userReordered = !same(common(cur.blocks, B), common(base.blocks, new Map(cur.blocks.map((b) => [b.id, b]))));
  if (!userReordered) {
    const byId = new Map([...blocks, ...added].map((b) => [b.id, b]));
    const ordered = ai.blocks.map((b) => byId.get(b.id)).filter(Boolean);
    blocks = [...ordered, ...blocks.filter((b) => !A.has(b.id))];
  } else {
    blocks = [...blocks, ...added];
  }
  return { ...out, blocks };
}

// --- Renderização ---

const TEXT_ESC = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
// Preenche {{campo}} com o valor escapado. Rodar DEPOIS do cleanHtml.
export const fill = (tpl, values) => tpl.replace(/\{\{(\w+)\}\}/g, (_, k) => String(values[k] ?? "").replace(/[&<>"']/g, (c) => TEXT_ESC[c]));
// Valor do atributo data-empty do wrapper: campos vazios (escondem os data-if correspondentes)
export const emptyFields = (values) =>
  Object.keys(values)
    .filter((k) => !values[k])
    .join(" ");

const ALL_FIELDS = [...new Set([...FIELDS.menu, ...FIELDS.item, ...FIELDS.category])];
const BASE_CSS =
  ALL_FIELDS.map((f) => `.bm-custom [data-empty~="${f}"] [data-if="${f}"]`).join(",") +
  "{display:none}\n.bm-custom{background:var(--bm-bg);color:var(--bm-text)}\n" + // aqui e não inline: o CSS geral do dono sobrescreve
  // Coluna única: todo bloco (menos o banner, .bm-full) tem a largura da página, centralizado e com a mesma margem
  // lateral, para tudo começar na mesma linha. !important + seletor mais forte: o CSS de bloco/IA não desalinha.
  // Nada vaza da coluna (clip); a barra de categorias (.bm-nav) rola de lado, então não é cortada.
  ".bm-custom{--bm-gutter:16px;overflow-x:clip}\n@media(min-width:768px){.bm-custom{--bm-gutter:24px}}\n" +
  ".bm-custom>:not(.bm-full){width:100%!important;max-width:min(var(--bm-w,100%),var(--bm-page))!important;margin-left:auto!important;" +
  "margin-right:auto!important;padding-left:var(--bm-gutter)!important;padding-right:var(--bm-gutter)!important;box-sizing:border-box!important}\n" +
  ".bm-custom>:not(.bm-full):not(.bm-nav){overflow-x:clip}\n" +
  // cada produto fica na própria célula da lista/grade/carrossel (card com width>100% ou margem negativa não invade o vizinho)
  ".bm-custom .bm-item{min-width:0}\n.bm-custom .bm-item>*{max-width:100%!important;margin-left:0!important;margin-right:0!important;box-sizing:border-box}\n" +
  ".bm-custom [data-action],.bm-custom .bm-item{cursor:pointer}\n.bm-custom img{max-width:100%}\n";

// Primeiro produto maior sem buraco: com 3+ colunas ocupa 2x2 (os vizinhos empilham ao lado e a foto estica para
// preencher a altura); com 2 colunas ocupa a linha inteira (sem vizinho para inflar); com 1 coluna fica normal.
// dense: nenhum espaço da grade fica vazio.
function featuredCss(list, b) {
  const f = `${list}>.bm-item:first-child`;
  const fill = `${f}>*{height:100%;display:flex;flex-direction:column}${f}>*>img,${f}>*>:has(img){flex:1 1 0;min-height:160px}${f}>*>:has(img) img{height:100%}${f} img{width:100%;aspect-ratio:auto;object-fit:cover}`;
  const at = (cols) => (cols >= 2 ? `${f}{grid-column:span 2;grid-row:${cols >= 3 ? "span 2" : "auto"}}${cols >= 3 ? fill : ""}` : "");
  return `${list}{grid-auto-flow:dense}\n@media(max-width:767px){${at(b.columnsMobile)}}\n@media(min-width:768px){${at(b.columns)}}\n`;
}

export function blockCss(b) {
  const sel = `.bm-b-${b.id}`;
  const s = b.style || {};
  const own = [
    sectionColors(s) && `background:${sectionColors(s)[0]};color:${sectionColors(s)[1]}`, // texto legível automático
    !s.bg && s.color && `color:${s.color}`,
    s.padding != null && `padding-top:${s.padding}px;padding-bottom:${s.padding}px`, // laterais: margem fixa da página (BASE_CSS)
    s.radius && `border-radius:${s.radius}px`,
    s.maxWidth && `--bm-w:${s.maxWidth}px`, // mais estreito que a página; nunca mais largo
  ]
    .filter(Boolean)
    .join(";");
  let out = own ? `${sel}{${own}}\n` : "";
  if (b.display) {
    const list = `${sel} .bm-list`;
    const gap = `gap:${b.gap}px`;
    if (b.display === "grid") {
      out += `${list}{display:grid;${gap};grid-template-columns:repeat(${b.columnsMobile},minmax(0,1fr))}\n`;
      out += `@media(min-width:768px){${list}{grid-template-columns:repeat(${b.columns},minmax(0,1fr))}}\n`;
      if (b.featured) out += featuredCss(list, b);
    } else if (b.display === "carousel") {
      out += `${list}{display:flex;${gap};overflow-x:auto;scroll-snap-type:x mandatory;padding-bottom:8px}\n`;
      out += `${list}>*{flex:0 0 ${b.itemWidth}px;scroll-snap-align:start}\n`;
    } else {
      out += `${list}{display:flex;flex-direction:column;${gap}}\n`;
    }
  }
  for (const f of b.hide || []) out += `${sel} [data-if="${f}"]{display:none}\n`;
  return out + scopeCss(sel, b.css);
}

// Folha de estilo inteira do layout: paleta + base + CSS geral (escopo .bm-custom) + cada bloco.
// A paleta vai como regra (não inline) para o CSS geral poder redefinir as variáveis --bm-*.
export function layoutCss(layout, base) {
  const vars = Object.entries(layoutPalette(layout, base))
    .map(([k, v]) => `--bm-${k}:${v}`)
    .join(";");
  return `.bm-custom{${vars};--bm-page:${layout.pageWidth}px}\n` + BASE_CSS + scopeCss(".bm-custom", layout.css) + layout.blocks.map(blockCss).join("");
}

// --- Contraste ---

const readable = (bg) => (getContrastTextColor(bg) === "white" ? "#fafafa" : "#171717");
const toRgb = (hex) => {
  let h = hex.slice(1);
  if (h.length < 6) h = [...h.slice(0, 3)].map((x) => x + x).join("");
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
};
// a sobre b na proporção t (hex sólido: dá para medir contraste, diferente de color-mix)
const mix = (a, b, t) => {
  const [x, y] = [toRgb(a), toRgb(b)];
  return "#" + x.map((v, i) => Math.round(v * t + y[i] * (1 - t)).toString(16).padStart(2, "0")).join("");
};

// Paleta final: base do dono + layout.colors. O resto (secundário, linhas, texto sobre o destaque) é derivado,
// então 3 cores bastam e o texto continua legível.
export function layoutPalette(layout, base) {
  const c = layout.colors || {};
  const p = { ...base };
  if (c.bg) p.bg = c.bg;
  if (c.bg || c.text) {
    p.text = c.text || readable(p.bg);
    p.title = p.text;
    p.muted = mix(p.text, p.bg, 0.72);
    p.line = mix(p.text, p.bg, 0.12);
  }
  if (c.accent) {
    p.accent = c.accent;
    p["accent-text"] = getContrastTextColor(c.accent) === "white" ? "#ffffff" : "#000000";
  }
  p.soft = mix(p.text, p.bg, 0.07); // fundo suave de seção/cartão
  return p;
}
const MIN_CONTRAST = 4.5; // WCAG AA para texto normal
const PALETTE_KEYS = "accent-text|bg|text|muted|title|accent|line";

// Paleta base do cardápio: as mesmas cores que useClientMenu calcula a partir das cores do dono
export function basePalette(menu) {
  const bg = HEX.test(menu?.background_color ?? "") ? menu.background_color : "#ffffff";
  const dark = getContrastTextColor(bg) === "white";
  const accent = HEX.test(menu?.details_color ?? "") ? menu.details_color : "#7b1730";
  return {
    bg,
    text: dark ? "#fafafa" : "#171717",
    muted: dark ? "#cccccc" : "#333333",
    title: HEX.test(menu?.title_color ?? "") ? menu.title_color : dark ? "#fafafa" : "#171717",
    accent,
    "accent-text": getContrastTextColor(accent) === "white" ? "#ffffff" : "#000000",
    line: dark ? "#ffffff15" : "#00000015",
  };
}

// Corrige texto ilegível no que a IA gerou (o que o dono escolhe no painel não passa por aqui):
// variáveis --bm-* do CSS geral, fundo/texto do painel de cada bloco e regras CSS com background + color.
// ponytail: só confere cores sólidas (hex ou var(--bm-*)); gradiente, rgba e texto sobre foto ficam por conta do prompt
export function fixContrast(layout, base) {
  const pal = { ...base };
  for (const [, k, v] of layout.css.matchAll(new RegExp(`--bm-(${PALETTE_KEYS})\\s*:\\s*(#[0-9a-f]{3,8})\\b`, "gi"))) {
    pal[k.toLowerCase()] = v;
  }
  const want = {};
  if (contrastRatio(pal.text, pal.bg) < MIN_CONTRAST) want.text = readable(pal.bg);
  const text = want.text ?? pal.text;
  if (contrastRatio(pal.muted, pal.bg) < MIN_CONTRAST) want.muted = text;
  if (contrastRatio(pal.title, pal.bg) < 3) want.title = text; // título é texto grande: 3:1
  if (contrastRatio(pal["accent-text"], pal.accent) < MIN_CONTRAST) want["accent-text"] = readable(pal.accent);
  Object.assign(pal, want);

  let css = layout.css;
  for (const [k, v] of Object.entries(want)) {
    const re = new RegExp(`--bm-${k}(?![\\w-])\\s*:[^;}]*`, "gi");
    css = css.match(re) ? css.replace(re, `--bm-${k}:${v}`) : `--bm-${k}:${v};\n${css}`;
  }

  const resolve = (v) => {
    const t = v.trim();
    const m = t.match(/^var\(\s*--bm-([a-z-]+)\s*\)$/i);
    if (m) return pal[m[1].toLowerCase()] ?? null;
    return HEX.test(t) ? t : null;
  };
  // regras sem nada aninhado: { ... background ... color ... }
  const fixRules = (src, inherited) =>
    src.replace(/\{([^{}]*)\}/g, (all, body) => {
      const bgM = body.match(/(?:^|[;\s])background(?:-color)?\s*:\s*([^;!}]+)/i);
      const bg = bgM && resolve(bgM[1]);
      if (!bg) return all;
      const colM = body.match(/(?:^|[;\s])color\s*:\s*([^;!}]+)/i);
      const col = colM ? resolve(colM[1]) : inherited;
      if (!col || contrastRatio(col, bg) >= MIN_CONTRAST) return all;
      const fixed = readable(bg);
      return colM ? `{${body.replace(colM[0], colM[0].replace(colM[1], fixed))}}` : `{${body.replace(/;?\s*$/, "")};color:${fixed}}`;
    });

  const blocks = layout.blocks.map((b) => {
    const style = { ...b.style };
    if (HEX.test(style.bg) && contrastRatio(style.color || pal.text, style.bg) < MIN_CONTRAST) style.color = readable(style.bg);
    return { ...b, style, css: fixRules(b.css, style.color || pal.text) };
  });
  return { ...layout, css: fixRules(css, pal.text), blocks };
}

export const fontHref = (font) => (FONTS[font] ? `https://fonts.googleapis.com/css2?family=${FONTS[font]}&display=swap` : null);
