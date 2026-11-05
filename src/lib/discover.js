// Busca e ordem da lista de /descobrir. Função pura: a rota (api/descobrir) carrega os cardápios e chama searchMenus.
// Ordem: região (cidade → estado → resto) → nota → distância (ou nome). Nota: tasks/descobrir/descobrir-avaliacoes.md
import { distanceKm } from "./deliveryRadius.js";

// média bayesiana: nota "neutra" C e peso M (avaliações até a média da loja começar a valer)
const RATING_C = 3.5;
const RATING_M = 5;
const MAX_RESULTS = 50;

// sem acento e sem maiúscula: "Hambúrguer" acha "hamburguer"
export const norm = (s) =>
  String(s ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();

// sem avaliação = nota neutra C: atrás das bem avaliadas, à frente das mal avaliadas; hoje todas empatam
export function ratingScore(m) {
  const n = m.rating_avg == null ? 0 : Number(m.rating_count) || 0;
  return (n * (Number(m.rating_avg) || 0) + RATING_M * RATING_C) / (n + RATING_M);
}

// menus: [{ title, address_details, lat, lng, searchText, rating_avg?, rating_count?, ... }]
// opts: { lat, lng, city, uf, q, local, km } — tudo opcional
export function searchMenus(menus, opts = {}) {
  const q = norm(opts.q);
  const local = norm(opts.local);
  const city = norm(opts.city);
  const uf = norm(opts.uf);
  const from = Number.isFinite(opts.lat) && Number.isFinite(opts.lng) ? { lat: opts.lat, lng: opts.lng } : null;
  const km = from && Number(opts.km) > 0 ? Number(opts.km) : null;

  const rows = [];
  for (const m of menus) {
    const a = m.address_details || {};
    if (q && !norm(m.title).includes(q) && !(m.searchText || "").includes(q)) continue;
    if (local && ![a.neighborhood, a.city, a.state].some((v) => norm(v).includes(local))) continue;

    const distance = from && m.lat != null && m.lng != null ? distanceKm(from, { lat: m.lat, lng: m.lng }) : null;
    if (km && (distance == null || distance > km)) continue;

    const sameUf = uf && norm(a.state) === uf;
    const region = !city && !uf ? 0 : sameUf && city && norm(a.city) === city ? 0 : sameUf ? 1 : 2;
    rows.push({ m, distance, region, score: ratingScore(m) });
  }

  rows.sort(
    (x, y) =>
      x.region - y.region ||
      y.score - x.score ||
      (x.distance ?? Infinity) - (y.distance ?? Infinity) ||
      String(x.m.title).localeCompare(String(y.m.title), "pt-BR"),
  );

  return rows.slice(0, MAX_RESULTS).map(({ m, distance }) => ({ ...m, distance }));
}
