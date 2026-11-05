// Preenche menus.lat/lng dos cardápios que já existem (Descobrir, tasks/descobrir/descobrir-todo.md Tarefa 3).
// Rodar uma vez, depois de tasks/descobrir/descobrir.sql:  node --env-file=.env.local scripts/backfill-menu-coords.mjs
// Pode rodar de novo: só pega quem ainda está sem lat.
import { createClient } from "@supabase/supabase-js";
import { geocodeAddress } from "../src/lib/deliveryRadius.js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Faltam NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY (use --env-file=.env.local).");
  process.exit(1);
}
const db = createClient(url, key);

// Regras do Nominatim: User-Agent identificável e no máximo 1 req/s (geocodeAddress pode fazer 2 por endereço)
const nativeFetch = globalThis.fetch;
let last = 0;
globalThis.fetch = async (input, init = {}) => {
  const wait = last + 1100 - Date.now();
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  last = Date.now();
  return nativeFetch(input, { ...init, headers: { ...init.headers, "User-Agent": "BiteMenu/1.0 (www.bitemenu.com.br)" } });
};

const { data: menus, error } = await db
  .from("menus")
  .select("id, slug, address_details, delivery_radius")
  .is("lat", null)
  .not("address_details", "is", null);
if (error) {
  console.error("Erro ao ler menus:", error.message);
  process.exit(1);
}

console.log(`${menus.length} cardápio(s) sem coordenada.`);
let ok = 0;
const failed = [];

for (const m of menus) {
  const r = m.delivery_radius;
  // taxa por raio já tem o ponto da loja marcado pelo dono: mais preciso que geocodificar
  const pos = r?.lat != null && r?.lng != null ? { lat: r.lat, lng: r.lng } : await geocodeAddress(m.address_details);
  if (!pos) {
    failed.push(m.slug);
    continue;
  }
  const { error: upErr } = await db.from("menus").update({ lat: pos.lat, lng: pos.lng }).eq("id", m.id);
  if (upErr) failed.push(`${m.slug} (${upErr.message})`);
  else ok++;
  console.log(`  ${m.slug}: ${upErr ? "erro" : `${pos.lat}, ${pos.lng}`}`);
}

console.log(`\nPreenchidos: ${ok}. Sem coordenada: ${failed.length}.`);
if (failed.length) console.log("Não achados (só aparecem na busca por texto):\n  " + failed.join("\n  "));
