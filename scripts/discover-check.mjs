// Self-check da busca de /descobrir:  node scripts/discover-check.mjs
import assert from "node:assert/strict";
import { searchMenus, norm } from "../src/lib/discover.js";

const SP = { lat: -23.5505, lng: -46.6333 };
const menu = (title, city, state, extra = {}) => ({
  title,
  slug: norm(title).replace(/\s+/g, "-"),
  address_details: { neighborhood: "Centro", city, state },
  lat: null,
  lng: null,
  searchText: "",
  ...extra,
});

const menus = [
  menu("Zeca Lanches", "Campinas", "SP", { lat: -22.9, lng: -47.06, searchText: norm("X-Burguer") }),
  menu("Pizzaria Bella", "São Paulo", "SP", { lat: -23.56, lng: -46.64 }),
  menu("Açaí do Rio", "Rio de Janeiro", "RJ", { lat: -22.9, lng: -43.2, searchText: norm("Pizza de açaí") }),
  menu("Bar Longe", "São Paulo", "SP", { lat: -23.7, lng: -46.8, searchText: norm("Hambúrguer artesanal") }),
  menu("Sem Mapa", "São Paulo", "SP"),
];
const slugs = (r) => r.map((m) => m.title);

// sem nada do cliente: de todo lugar, alfabética
assert.deepEqual(slugs(searchMenus(menus)), ["Açaí do Rio", "Bar Longe", "Pizzaria Bella", "Sem Mapa", "Zeca Lanches"]);

// região: cidade → estado → resto; dentro do grupo, distância; sem coordenada no fim do grupo
assert.deepEqual(slugs(searchMenus(menus, { ...SP, city: "sao paulo", uf: "SP" })), [
  "Pizzaria Bella",
  "Bar Longe",
  "Sem Mapa",
  "Zeca Lanches",
  "Açaí do Rio",
]);

// q acha pelo nome e pelo produto, sem acento
assert.deepEqual(slugs(searchMenus(menus, { q: "pizza" })), ["Açaí do Rio", "Pizzaria Bella"]);
assert.deepEqual(slugs(searchMenus(menus, { q: "hamburguer" })), ["Bar Longe"]);

// local: cidade ou bairro
assert.deepEqual(slugs(searchMenus(menus, { local: "campinas" })), ["Zeca Lanches"]);

// km: só até a distância, e quem não tem coordenada sai
const near = searchMenus(menus, { ...SP, km: 5 });
assert.deepEqual(slugs(near), ["Pizzaria Bella"]);
assert.ok(near[0].distance > 0 && near[0].distance < 5);
// km sem coordenada do cliente é ignorado
assert.equal(searchMenus(menus, { km: 5 }).length, menus.length);

// nota: dentro do grupo, maior nota primeiro; 1×5 não passa 200×4,8; sem nota fica no meio (neutra)
const rated = [
  menu("Uma Nota", "São Paulo", "SP", { rating_avg: 5, rating_count: 1 }),
  menu("Muitas Notas", "São Paulo", "SP", { rating_avg: 4.8, rating_count: 200 }),
  menu("Sem Nota", "São Paulo", "SP"),
  menu("Nota Baixa", "São Paulo", "SP", { rating_avg: 2, rating_count: 50 }),
  menu("Outro Estado", "Curitiba", "PR", { rating_avg: 5, rating_count: 500 }),
];
assert.deepEqual(slugs(searchMenus(rated, { city: "São Paulo", uf: "sp" })), [
  "Muitas Notas",
  "Uma Nota",
  "Sem Nota",
  "Nota Baixa",
  "Outro Estado",
]);

console.log("discover-check: ok");
