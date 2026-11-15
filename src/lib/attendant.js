// Atendente IA no cardápio público (pedido por conversa, tasks/atendente-ia/). Plano Enterprise.
// Sem imports de servidor: o cardápio (AiAttendant.jsx) e a rota /api/attendant usam este arquivo.

// Enterprise ainda não lançado: até lá só admin tem o atendente
export const ATTENDANT_ROLES = ["admin", "enterprise"];

// mesma regra do canShowPromoPrice dos 3 layouts (ClientMenu*.jsx)
export const PROMO_ROLES = ["plus", "pro", "business", "enterprise", "admin", "designer"];

// Tetos de gasto por cardápio, em micro-dólares (1_000_000 = US$ 1). Garantidos pela reserva atômica no banco
// (src/lib/aiBudget.js, ai_attendant_reserve): nem no pior caso, com ataque simultâneo, o gasto passa deles.
// Diário (só o atendente, dia UTC): US$ 2,50 ≈ 1.000 conversas típicas (~US$ 0,0023 cada).
export const ATTENDANT_DAILY_BUDGET_MICRO_USD = 2_500_000;
// Mensal (atendente + landing IA, mês UTC): o que o Enterprise cobra A MAIS que o Business, em dólar com câmbio
// pessimista. Assim o pior mês possível dessas IAs nunca passa do preço extra do plano. O Bite Menu IA do painel é do
// Business e segue com os limites dele (aiUsage). Trocar ENTERPRISE_PRICE_BRL quando o plano existir em Plans.jsx.
const ENTERPRISE_PRICE_BRL = 149.9;
const BUSINESS_PRICE_BRL = 69.9;
const USD_BRL_PESSIMISTA = 6; // câmbio de ~5,5 + folga
export const ENTERPRISE_AI_MONTHLY_BUDGET_MICRO_USD = Math.floor(((ENTERPRISE_PRICE_BRL - BUSINESS_PRICE_BRL) / USD_BRL_PESSIMISTA) * 1e6);

// mesmo limite do check de menus.attendant_info (atendente-ia.sql)
export const ATTENDANT_INFO_MAX = 2000;

// Teto do catálogo enviado à IA (o resto não aparece no atendente, só no cardápio)
// ponytail: cardápio gigante perde itens no atendente; trocar por busca (ferramenta search_items) se alguém chegar perto
export const ATTENDANT_MAX_ITEMS = 300;
// Teto do texto do cardápio (~35k tokens): mantém o pior custo de uma rodada bem abaixo da reserva por mensagem
const ATTENDANT_MAX_CATALOG_CHARS = 120_000;

const norm = (s) => String(s ?? "").trim().toLowerCase();
const money = (v) => Number(v || 0).toFixed(2);

export function visibleItems(menu) {
  return (menu?.categories || []).flatMap((c) =>
    (c.menu_items || []).filter((it) => it.visible).map((it) => ({ ...it, category: c.name })),
  );
}

// Ref curta do item no prompt: um uuid inteiro custa ~20 tokens, x centenas de itens, em toda mensagem.
// ponytail: colisão de 8 caracteres num mesmo cardápio é ~1 em 100 mil com 300 itens; usar o id inteiro se acontecer
export const itemRef = (id) => String(id ?? "").replace(/-/g, "").slice(0, 8);

export function findMenuItem(menu, ref) {
  const key = itemRef(ref);
  return (key && visibleItems(menu).find((it) => itemRef(it.id) === key)) || null;
}

// Item precisa de escolha antes de ir pro carrinho? (variação ou grupo obrigatório)
export const needsChoice = (item) =>
  (item.variations?.options?.length ?? 0) > 0 || (item.option_groups || []).some((g) => Number(g.min_choices ?? 0) > 0);

export function itemPrice(item, canPromo) {
  return Number(item.promo_price && canPromo ? item.promo_price : item.price || 0);
}

// Pedido da IA → linha do carrinho no formato do handleAddToCart dos layouts. Devolve { line } ou { error }.
export function buildCartLine(item, { qty = 1, variation, options = [], note = "" } = {}, canPromo) {
  const vars = item.variations?.options || [];
  let chosen = null;
  if (vars.length) {
    chosen = vars.find((o) => norm(o.name) === norm(variation));
    if (!chosen) {
      return { error: `Escolha ${item.variations.name || "uma opção"} de "${item.name}": ${vars.map((o) => o.name).join(", ")}.` };
    }
  }

  const raw = (Array.isArray(options) ? options : []).map((o) => String(o ?? "").trim()).filter(Boolean);
  const wanted = raw.map(norm);
  const matched = new Set();
  const additionals = [];
  for (const g of item.option_groups || []) {
    const visible = (g.option_choices || []).filter((c) => !c.hidden);
    const picked = visible.filter((c) => wanted.includes(norm(c.name)));
    picked.forEach((c) => matched.add(norm(c.name)));
    const min = Number(g.min_choices ?? 0);
    const max = Number(g.max_choices ?? 0);
    if (picked.length < min) {
      return { error: `Escolha ${min > 1 ? `${min} opções` : "uma opção"} em "${g.name}" de "${item.name}": ${visible.map((c) => c.name).join(", ")}.` };
    }
    if (max > 0 && picked.length > max) {
      return { error: `Em "${g.name}" dá para escolher no máximo ${max}.` };
    }
    additionals.push(...picked.map((c) => ({ id: c.id, group: g.name, name: c.name, price: Number(c.price) })));
  }
  const unknown = raw.filter((o) => !matched.has(norm(o)));
  if (unknown.length) return { error: `"${item.name}" não tem a opção "${unknown.join('", "')}".` };

  return {
    line: {
      id: item.id,
      name: chosen ? `${item.name} (${chosen.name})` : item.name,
      image_url: item.image_url || null,
      price: chosen ? Number(chosen.price) : itemPrice(item, canPromo),
      qty: Math.min(99, Math.max(1, Math.round(Number(qty) || 1))),
      additionals,
      note: String(note || "").slice(0, 200),
    },
  };
}

function groupRule(g) {
  const min = Number(g.min_choices ?? 0);
  const max = Number(g.max_choices ?? 0);
  if (min > 0) return `obrigatório, ${min === max ? `escolha ${min}` : `${min} a ${max || "várias"}`}`;
  return max > 0 ? `opcional, até ${max}` : "opcional";
}

// Cardápio em texto compacto para o prompt (fica no cache da Anthropic entre as mensagens)
export function catalogText(menu, canPromo) {
  const lines = [];
  let lastCategory = null;
  let size = 0;
  for (const it of visibleItems(menu).slice(0, ATTENDANT_MAX_ITEMS)) {
    if (size > ATTENDANT_MAX_CATALOG_CHARS) break;
    const start = lines.length;
    if (it.category !== lastCategory) lines.push(`\n# ${it.category}`);
    lastCategory = it.category;
    const promo = it.promo_price && canPromo ? ` (promoção, de ${money(it.price)})` : "";
    const desc = it.description ? ` | ${it.description.replace(/\s+/g, " ").slice(0, 100)}` : "";
    lines.push(`- ${itemRef(it.id)} | ${it.name} | ${money(itemPrice(it, canPromo))}${promo}${it.starred ? " | destaque" : ""}${desc}`);
    const vars = it.variations?.options || [];
    if (vars.length) lines.push(`  · ${it.variations.name || "Variação"} (obrigatório, escolha 1; o preço da variação substitui o do item): ${vars.map((o) => `${o.name} ${money(o.price)}`).join(" | ")}`);
    for (const g of it.option_groups || []) {
      const choices = (g.option_choices || []).filter((c) => !c.hidden);
      if (!choices.length) continue;
      lines.push(`  · ${g.name} (${groupRule(g)}): ${choices.map((c) => (Number(c.price) ? `${c.name} +${money(c.price)}` : c.name)).join(" | ")}`);
    }
    for (let i = start; i < lines.length; i++) size += lines[i].length + 1;
  }
  return lines.join("\n").trim();
}
