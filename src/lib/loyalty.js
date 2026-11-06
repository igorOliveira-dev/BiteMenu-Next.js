// Programa de fidelidade (tasks/fidelidade/fidelidade-plan.md). Config em menus.loyalty: { enabled, reward, goal }.
// Ciclo de goal + 1 vendas: goal compras que juntam e 1 que usa o prêmio. Self-check: node scripts/loyalty-check.mjs

export const LOYALTY_MIN = 2;
export const LOYALTY_MAX = 20;

// Planos com fidelidade (mesmo corte de Combos no painel)
export const LOYALTY_ROLES = ["plus", "pro", "business", "admin", "designer"];

export const isLoyaltyOn = (loyalty) =>
  !!loyalty?.enabled &&
  !!loyalty.reward?.trim() &&
  Number.isInteger(loyalty.goal) &&
  loyalty.goal >= LOYALTY_MIN &&
  loyalty.goal <= LOYALTY_MAX;

// count = vendas finalizadas do cliente no cardápio.
// done: traços cheios; ready: prêmio liberado (a próxima compra usa); used: prêmios já usados
export function loyaltyState(count, goal) {
  const k = count % (goal + 1);
  return { done: k, ready: k === goal, used: Math.floor(count / (goal + 1)) };
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
