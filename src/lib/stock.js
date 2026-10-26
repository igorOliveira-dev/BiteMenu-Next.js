// Controle de estoque (plano Business). stock null = sem controle.
// Itens: menu_items.stock. Opções: tabela option_stock (menu_id, name_key, stock), compartilhada
// por nome — "Bacon" em qualquer item/grupo do cardápio usa o mesmo estoque.
// A baixa de verdade (atômica) é a RPC consume_stock, ver supabase/estoque.sql.
export const STOCK_ROLES = ["business", "admin", "designer"];

export const optionKey = (name) => (name || "").trim().toLowerCase();

const soldOut = (x) => x.stock != null && x.stock <= 0;

// Põe o estoque nas opções e esconde itens/opções esgotados reaproveitando visible/hidden,
// que os 3 layouts já respeitam. optionStock: linhas de option_stock do cardápio.
export function applyStock(menu, ownerRole, optionStock) {
  if (!menu || !STOCK_ROLES.includes(ownerRole)) return menu;
  const byKey = Object.fromEntries((optionStock || []).map((r) => [r.name_key, r.stock]));
  return {
    ...menu,
    categories: (menu.categories || []).map((cat) => ({
      ...cat,
      menu_items: (cat.menu_items || []).map((it) => ({
        ...it,
        visible: it.visible && !soldOut(it),
        option_groups: (it.option_groups || []).map((g) => ({
          ...g,
          option_choices: (g.option_choices || []).map((c) => {
            const withStock = { ...c, stock: byKey[optionKey(c.name)] ?? null };
            return { ...withStock, hidden: c.hidden || soldOut(withStock) };
          }),
        })),
      })),
    })),
  };
}

// Grupo de opções com todas as opções ocultadas pelo dono = grupo oculto: sai do cardápio público
// (senão aparece vazio e, se for obrigatório, trava o pedido). Rodar ANTES do applyStock:
// grupo vazio só por estoque esgotado continua, pra não liberar o item sem a escolha obrigatória.
export function hideHiddenGroups(menu) {
  if (!menu) return menu;
  return {
    ...menu,
    categories: (menu.categories || []).map((cat) => ({
      ...cat,
      menu_items: (cat.menu_items || []).map((it) => ({
        ...it,
        option_groups: (it.option_groups || []).filter(
          (g) => !((g.option_choices || []).length > 0 && g.option_choices.every((c) => c.hidden)),
        ),
      })),
    })),
  };
}

// Carrinho + o que vai entrar passa do estoque? Retorna a mensagem de erro ou null.
// choiceIds: ids das opções escolhidas no item.
export function stockError(ownerRole, cartItems, item, qty, choiceIds) {
  if (!STOCK_ROLES.includes(ownerRole)) return null;
  const choices = (item.option_groups || []).flatMap((g) => g.option_choices || []).filter((c) => choiceIds.includes(c.id));
  const checks = [
    { x: item, inLine: (it) => it.id === item.id },
    ...choices.map((c) => ({ x: c, inLine: (it) => (it.additionals || []).some((a) => optionKey(a.name) === optionKey(c.name)) })),
  ];
  for (const { x, inLine } of checks) {
    if (x.stock == null) continue;
    const inCart = (cartItems || []).reduce((s, it) => s + (inLine(it) ? it.qty : 0), 0);
    if (inCart + qty > x.stock) {
      const left = Math.max(0, x.stock - inCart);
      return left > 0 ? `Só restam ${left} unidade(s) de "${x.name}".` : `"${x.name}" esgotou.`;
    }
  }
  return null;
}

// Formato esperado pela RPC consume_stock
export const stockPayload = (cartItems) =>
  (cartItems || []).map((it) => ({
    item_id: it.id,
    qty: it.qty,
    choice_keys: (it.additionals || []).map((a) => optionKey(a.name)).filter(Boolean),
  }));
