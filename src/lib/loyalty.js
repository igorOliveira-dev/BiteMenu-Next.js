// Programa de fidelidade (tasks/fidelidade/fidelidade-plan.md). Config em menus.loyalty: { enabled, reward, goal }.
// Ciclo de goal + 1 vendas: goal compras que juntam e 1 que usa o prêmio (loyaltyState). Self-check: node scripts/loyalty-check.mjs

export const LOYALTY_MIN = 2;
export const LOYALTY_MAX = 20;

// Planos com fidelidade: Pro para cima (mesmo corte de Cupons no painel)
export const LOYALTY_ROLES = ["pro", "business", "admin", "designer"];

export const isLoyaltyOn = (loyalty) =>
  !!loyalty?.enabled &&
  !!loyalty.reward?.trim() &&
  Number.isInteger(loyalty.goal) &&
  loyalty.goal >= LOYALTY_MIN &&
  loyalty.goal <= LOYALTY_MAX;

// Progresso do cliente. dates = created_at das vendas dele no cardápio (data do pedido).
// loyalty.history = metas antigas, [{ goal, until }] da mais antiga para a mais nova (o modal do dono grava ao mudar).
// Cada compra conta com a meta que valia quando o pedido foi feito: mudar a meta não apaga compras. Quem tinha mais
// compras do que a nova meta fica com o prêmio liberado; prêmio liberado continua liberado.
// done: traços cheios; ready: prêmio liberado (a próxima compra usa); used: prêmios já usados
export function loyaltyState(dates, loyalty) {
  const history = (loyalty?.history || []).map((h) => ({ goal: h.goal, until: Date.parse(h.until) }));
  const goalAt = (t) => (history.find((h) => t < h.until) || loyalty).goal;
  let k = 0;
  let used = 0;
  let ready = false; // liberado fica liberado até ser usado, mesmo se a meta subir depois
  for (const t of dates.map((d) => Date.parse(d)).sort((a, b) => a - b)) {
    if (ready || k >= goalAt(t)) {
      used++; // compra com o prêmio liberado: foi a que usou o prêmio
      k = 0;
      ready = false;
    } else ready = ++k >= goalAt(t);
  }
  ready = ready || k >= loyalty.goal;
  return { done: ready ? loyalty.goal : k, ready, used };
}

// Desconto do prêmio sobre o subtotal, para quem está com o prêmio liberado. items = linhas do carrinho.
// type "item": 1 unidade do item escolhido sai grátis quando está no carrinho (a linha mais barata dele, se houver
//   variações; adicionais continuam pagos).
// type "discount": { discount_type: "percentage" | "fixed", discount_value, min_order? }. Abaixo do mínimo: 0.
export function loyaltyDiscount(loyalty, subtotal, items = []) {
  if (subtotal <= 0) return 0;
  let discount = 0;
  if (loyalty?.type === "item") {
    const prices = items
      .filter((it) => String(it.id) === String(loyalty.item_id) && it.qty > 0)
      .map((it) => Number(it.price) || 0);
    if (prices.length) discount = Math.min(...prices);
  } else if (loyalty?.type === "discount") {
    if (subtotal < (Number(loyalty.min_order) || 0)) return 0;
    const value = Number(loyalty.discount_value) || 0;
    discount = loyalty.discount_type === "fixed" ? value : subtotal * (value / 100);
  }
  return Math.round(Math.min(discount, subtotal) * 100) / 100;
}
