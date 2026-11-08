// Self-check do resumo de vendas dos insights:  node scripts/sales-insights-check.mjs
import assert from "node:assert/strict";
import { summarizeSales, brParts } from "../src/lib/salesInsights.js";

// 23h30 de Brasília numa sexta = 02h30 UTC de sábado
assert.deepEqual(brParts("2026-11-07T02:30:00Z"), { day: 5, hour: 23 });
assert.deepEqual(brParts("2026-11-07T03:00:00Z"), { day: 6, hour: 0 });

const menu = {
  categories: [
    {
      name: "Lanches",
      menu_items: [
        { id: "a", name: "X-Burger", price: 20, starred: true, image_url: "https://x/a.jpg" },
        { id: "b", name: "Batata", price: 10, promo_price: 8 },
        { id: "c", name: "Salada", price: 15, description: "" },
        { id: "d", name: "Oculto", price: 1, visible: false },
      ],
    },
    { name: "Bebidas", menu_items: [{ id: "e", name: "Coca", price: 6 }] },
  ],
};

const sales = [
  {
    created_at: "2026-11-07T02:30:00Z",
    total: 36,
    service: "delivery",
    costumer_name: "Fulano Secreto",
    costumer_phone: "11999990000",
    items_list: [
      { id: "a", name: "X-Burger (Grande)", price: 20, qty: 1, additionals: [{ name: "Bacon", price: 4 }] },
      { id: "b", name: "Batata", price: 8, qty: 1 },
      { id: "a", name: "X-Burger", price: 20, qty: 1 }, // mesmo item 2x no pedido: par conta 1 vez
    ],
  },
  {
    created_at: "2026-11-08T15:00:00Z",
    total: 26,
    service: "pickup",
    costumer_phone: "(11) 98888-1111",
    items_list: [
      { name: "Item antigo sem id", price: 20, qty: 1 },
      { id: "e", name: "Coca", price: 6, qty: 1 },
    ],
  },
  { created_at: "2026-11-08T15:10:00Z", total: 10, service: "pickup", costumer_phone: "11 99999-0000", items_list: [{ id: "b", name: "Batata", price: 10, qty: 1 }] },
];

const r = summarizeSales(sales, [{ total: 50 }], menu);

assert.deepEqual(r.periodo, { vendas: 3, faturamento: 72, ticketMedio: 24 });
assert.deepEqual(r.periodoAnterior, { vendas: 1, faturamento: 50, ticketMedio: 50 });
assert.equal(r.porDiaSemana[5].vendas, 1); // sexta
assert.equal(r.porDiaSemana[0].vendas, 2); // domingo 08/11
assert.deepEqual(r.porHora.map((h) => h.hora), [12, 23]);
assert.deepEqual(r.porServico, { delivery: 1, pickup: 2 });

const burger = r.produtos.find((p) => p.nome === "X-Burger");
assert.deepEqual(burger, { nome: "X-Burger", qtd: 2, faturamento: 44, pctComAdicional: 50 });
assert.equal(r.produtos.find((p) => p.nome === "Batata").qtd, 2);
assert.ok(r.produtos.some((p) => p.nome === "Item antigo sem id"));

assert.deepEqual(r.vendidosJuntos.find((p) => p.itens.includes("X-Burger")), { itens: ["Batata", "X-Burger"], pedidos: 1 });

assert.deepEqual(r.naoVenderam.map((i) => i.nome), ["Salada"]); // oculto não entra, vendidos não entram
assert.deepEqual(r.naoVenderam[0], { nome: "Salada", categoria: "Lanches", preco: 15, foto: false, descricao: false, destaque: false });
assert.deepEqual(r.destaques, [{ nome: "X-Burger", qtd: 2 }]);
assert.deepEqual(r.promocoes, [{ nome: "Batata", preco: 10, promo: 8, qtd: 2 }]);
assert.deepEqual(r.clientes, { identificados: 2, recorrentes: 1, pctVendasDeRecorrentes: 67 });

// privacidade: nada de nome/telefone/id de cliente na saída
const out = JSON.stringify(r);
for (const secret of ["Fulano", "99999", "88888"]) assert.ok(!out.includes(secret), `vazou ${secret}`);

// vazio não quebra
const empty = summarizeSales([], [], null);
assert.equal(empty.periodo.ticketMedio, 0);
assert.deepEqual(empty.naoVenderam, []);

console.log("ok");
