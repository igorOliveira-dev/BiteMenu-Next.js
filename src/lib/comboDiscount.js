function lineValue(item) {
  const addonsTotal = (item.additionals || []).reduce((s, a) => s + Number(a.price || 0), 0);
  return (Number(item.price || 0) + addonsTotal) * Number(item.qty || 0);
}

export function calculateComboDiscount({ items = [], combos = [], categoryByItemId = {} }) {
  if (!Array.isArray(combos) || combos.length === 0 || !items.length) {
    return { totalDiscount: 0, appliedCombos: [], cartSubtotal: 0 };
  }

  const cartSubtotal = items.reduce((sum, it) => sum + lineValue(it), 0);

  const groups = new Map();
  combos.forEach((combo) => {
    const targetKey = combo.scope === "item" ? combo.item_id : combo.scope === "category" ? combo.category_id : "cart";
    const key = `${combo.scope}:${targetKey}:${combo.trigger_type}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(combo);
  });

  let totalDiscount = 0;
  const appliedCombos = [];

  groups.forEach((groupCombos) => {
    const sample = groupCombos[0];

    let targetItems;
    if (sample.scope === "item") {
      targetItems = items.filter((it) => it.id === sample.item_id);
    } else if (sample.scope === "category") {
      targetItems = items.filter((it) => categoryByItemId[it.id] === sample.category_id);
    } else {
      targetItems = items;
    }

    if (targetItems.length === 0) return;

    const targetValue = targetItems.reduce((sum, it) => sum + lineValue(it), 0);
    const targetQty = targetItems.reduce((sum, it) => sum + Number(it.qty || 0), 0);
    const metric = sample.trigger_type === "quantity" ? targetQty : targetValue;

    const eligible = groupCombos
      .filter((c) => metric >= Number(c.trigger_value))
      .sort((a, b) => Number(b.trigger_value) - Number(a.trigger_value));

    if (eligible.length === 0) return;

    const best = eligible[0];
    let discount =
      best.discount_type === "percentage"
        ? targetValue * (Number(best.discount_value) / 100)
        : Math.min(Number(best.discount_value), targetValue);

    if (discount > 0) {
      totalDiscount += discount;
      appliedCombos.push({ combo: best, discount });
    }
  });

  totalDiscount = Math.min(totalDiscount, cartSubtotal);

  return { totalDiscount, appliedCombos, cartSubtotal };
}
