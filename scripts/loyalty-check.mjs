// Self-check do ciclo da fidelidade:  node scripts/loyalty-check.mjs
import assert from "node:assert/strict";
import { loyaltyState, isLoyaltyOn, loyaltyDiscount } from "../src/lib/loyalty.js";

// vendas em dias seguidos de novembro (dia 1, 2, ...)
const days = (from, n) => Array.from({ length: n }, (_, i) => `2026-11-${String(from + i).padStart(2, "0")}T12:00:00+00:00`);
const s = (count) => loyaltyState(days(1, count), { goal: 5 });
assert.deepEqual(s(0), { done: 0, ready: false, used: 0 });
assert.deepEqual(s(3), { done: 3, ready: false, used: 0 });
assert.deepEqual(s(5), { done: 5, ready: true, used: 0 }); // 5 compras: a 6ª usa o prêmio
assert.deepEqual(s(6), { done: 0, ready: false, used: 1 }); // 6ª foi a do prêmio: novo ciclo
assert.deepEqual(s(11), { done: 5, ready: true, used: 1 });
assert.deepEqual(s(12), { done: 0, ready: false, used: 2 });
assert.deepEqual(loyaltyState([...days(1, 3)].reverse(), { goal: 5 }).done, 3); // ordem não importa

// dono muda a meta no dia 20 (vendas antes disso contaram com a meta antiga)
const changed = (oldGoal, newGoal) => ({ goal: newGoal, history: [{ goal: oldGoal, until: "2026-11-20T00:00:00.000Z" }] });
const c = (dates, oldGoal, newGoal) => loyaltyState(dates, changed(oldGoal, newGoal));
assert.deepEqual(c(days(1, 4), 5, 3), { done: 3, ready: true, used: 0 }); // 4 de 5 → meta 3: prêmio liberado
assert.deepEqual(c(days(1, 5), 5, 3), { done: 3, ready: true, used: 0 }); // prêmio liberado continua
assert.deepEqual(c(days(1, 2), 5, 3), { done: 2, ready: false, used: 0 }); // 2 de 5 → 2 de 3
assert.deepEqual(c(days(1, 6), 5, 3), { done: 0, ready: false, used: 1 }); // ciclo novo continua novo
assert.deepEqual(c(days(1, 3), 3, 5), { done: 5, ready: true, used: 0 }); // liberado com 3 → meta 5: continua liberado
assert.deepEqual(c([...days(1, 3), ...days(21, 1)], 3, 5), { done: 0, ready: false, used: 1 }); // usou depois da troca
assert.deepEqual(c([...days(1, 4), ...days(21, 1)], 5, 3), { done: 0, ready: false, used: 1 }); // usou com a meta nova
assert.deepEqual(c([...days(1, 2), ...days(21, 1)], 5, 3), { done: 3, ready: true, used: 0 }); // 2 antigas + 1 nova = 3 de 3
assert.deepEqual(c([...days(1, 2), ...days(21, 2)], 5, 3), { done: 0, ready: false, used: 1 }); // a 4ª usou o prêmio

assert.equal(isLoyaltyOn({ enabled: true, reward: "Pizza", goal: 5 }), true);
assert.equal(isLoyaltyOn({ enabled: false, reward: "Pizza", goal: 5 }), false);
assert.equal(isLoyaltyOn({ enabled: true, reward: "  ", goal: 5 }), false);
assert.equal(isLoyaltyOn({ enabled: true, reward: "Pizza", goal: 1 }), false);
assert.equal(isLoyaltyOn({ enabled: true, reward: "Pizza", goal: 21 }), false);
assert.equal(isLoyaltyOn(null), false);

const pct = { type: "discount", discount_type: "percentage", discount_value: 10 };
assert.equal(loyaltyDiscount(pct, 55), 5.5);
assert.equal(loyaltyDiscount({ ...pct, min_order: 60 }, 55), 0); // abaixo do mínimo
assert.equal(loyaltyDiscount({ ...pct, min_order: 50 }, 55), 5.5);
const fixed = { type: "discount", discount_type: "fixed", discount_value: 20 };
assert.equal(loyaltyDiscount(fixed, 55), 20);
assert.equal(loyaltyDiscount(fixed, 15), 15); // nunca maior que o subtotal
const freeItem = { type: "item", item_id: "i1" };
assert.equal(loyaltyDiscount(freeItem, 55), 0); // item fora do carrinho
const cartLines = [
  { id: "i2", name: "X-Salada", price: 28, qty: 1 },
  { id: "i1", name: "X-Burguer (duplo)", price: 32, qty: 1 },
  { id: "i1", name: "X-Burguer", price: 25, qty: 2, additionals: [{ name: "Bacon", price: 4 }] },
];
assert.equal(loyaltyDiscount(freeItem, 118, cartLines), 25); // 1 unidade, a linha mais barata, sem adicionais
assert.equal(loyaltyDiscount(freeItem, 20, cartLines), 20); // nunca maior que o subtotal
assert.equal(loyaltyDiscount(pct, 0), 0);

console.log("loyalty ok");
