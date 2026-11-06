// Self-check do ciclo da fidelidade:  node scripts/loyalty-check.mjs
import assert from "node:assert/strict";
import { loyaltyState, isLoyaltyOn, loyaltyDiscount } from "../src/lib/loyalty.js";

const s = (count) => loyaltyState(count, 5);
assert.deepEqual(s(0), { done: 0, ready: false, used: 0 });
assert.deepEqual(s(3), { done: 3, ready: false, used: 0 });
assert.deepEqual(s(5), { done: 5, ready: true, used: 0 }); // 5 compras: a 6ª usa o prêmio
assert.deepEqual(s(6), { done: 0, ready: false, used: 1 }); // 6ª foi a do prêmio: novo ciclo
assert.deepEqual(s(11), { done: 5, ready: true, used: 1 });
assert.deepEqual(s(12), { done: 0, ready: false, used: 2 });

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
