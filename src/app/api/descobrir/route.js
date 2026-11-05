import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { norm, searchMenus } from "@/lib/discover";

// em dev sem cache: logo/banner/endereço trocados no painel aparecem na hora
const CACHE_MS = process.env.NODE_ENV === "production" ? 10 * 60 * 1000 : 0;
// shortcut: cache em memória vale porque a produção roda numa instância só (igual ao proxy.js); com mais de uma,
// cada uma tem o seu. Com milhares de cardápios, trocar por RPC/PostGIS no banco.
let cache = { at: 0, menus: null };

async function loadMenus() {
  if (cache.menus && Date.now() - cache.at < CACHE_MS) return cache.menus;

  // quando houver avaliação, incluir rating_avg e rating_count aqui (tasks/descobrir/descobrir-avaliacoes.md)
  const { data, error } = await supabaseAdmin
    .from("menus")
    .select("id, owner_id, slug, title, logo_url, banner_url, address_details, lat, lng, categories(menu_items(name, description, visible))")
    .eq("discoverable", true)
    .not("address_details", "is", null);
  if (error) throw error;

  const ownerIds = [...new Set(data.map((m) => m.owner_id).filter(Boolean))];
  const { data: owners, error: ownersError } = ownerIds.length
    ? await supabaseAdmin.from("profiles").select("id, account_type, deletion_requested_at").in("id", ownerIds)
    : { data: [] };
  if (ownersError) throw ownersError;
  const blocked = new Set(
    owners.filter((p) => p.deletion_requested_at || p.account_type === "customer").map((p) => p.id),
  );

  const menus = [];
  for (const m of data) {
    if (!m.slug || !m.address_details?.city || blocked.has(m.owner_id)) continue;
    const items = (m.categories || []).flatMap((c) => c.menu_items || []).filter((i) => i.visible !== false);
    if (!items.length) continue;
    menus.push({
      slug: m.slug,
      title: m.title,
      logo_url: m.logo_url,
      banner_url: m.banner_url,
      address_details: m.address_details,
      lat: m.lat,
      lng: m.lng,
      searchText: norm(items.map((i) => `${i.name} ${i.description || ""}`).join(" ")),
    });
  }

  cache = { at: Date.now(), menus };
  return menus;
}

const FALLBACK_KM = 100;
const num = (v) => (v == null || v === "" ? NaN : Number(v));

export async function GET(request) {
  const p = request.nextUrl.searchParams;
  const text = (k) => (p.get(k) || "").slice(0, 80);

  let menus;
  try {
    menus = await loadMenus();
  } catch (e) {
    console.error("[api/descobrir] erro ao carregar cardápios:", e);
    return NextResponse.json({ error: "Não foi possível carregar os estabelecimentos." }, { status: 500 });
  }

  const opts = {
    lat: num(p.get("lat")),
    lng: num(p.get("lng")),
    km: num(p.get("km")),
    city: text("cidade"),
    uf: text("uf"),
    q: text("q"),
    local: text("local"),
  };
  let results = searchMenus(menus, opts);

  // nada no raio escolhido: tenta até 100 km; se ainda vazio, lista padrão (sem limite de distância)
  let expanded = null;
  if (!results.length && opts.km > 0) {
    if (opts.km < FALLBACK_KM) results = searchMenus(menus, { ...opts, km: FALLBACK_KM });
    expanded = results.length ? FALLBACK_KM : "all";
    if (!results.length) results = searchMenus(menus, { ...opts, km: NaN });
  }

  // só o que o cardápio público já mostra: sem owner_id, telefone, plano ou pix
  return NextResponse.json({
    expanded,
    results: results.map((m) => ({
      slug: m.slug,
      title: m.title,
      logo_url: m.logo_url,
      banner_url: m.banner_url,
      neighborhood: m.address_details?.neighborhood || "",
      city: m.address_details?.city || "",
      state: m.address_details?.state || "",
      distance: m.distance == null ? null : Math.round(m.distance * 10) / 10,
    })),
  });
}
