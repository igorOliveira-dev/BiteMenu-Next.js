// Exclui as contas com profiles.deletion_requested_at preenchido (roteiro: tasks/sql/account-deletion.sql).
// Dry-run (só lista e conta):  node --env-file=.env.local scripts/delete-requested-accounts.mjs
// Executar de verdade:         node --env-file=.env.local scripts/delete-requested-accounts.mjs --execute [--only=<user_id>]
// Apaga filhos antes dos pais, então não depende de "on delete cascade".
// Mantém: nfse (fiscal) e privacy_acceptances (prova de consentimento). Assinatura na ValidaPay é manual.
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Faltam NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY (use --env-file=.env.local).");
  process.exit(1);
}
const db = createClient(url, key, { auth: { persistSession: false } });
const EXECUTE = process.argv.includes("--execute");
const ONLY = process.argv.find((a) => a.startsWith("--only="))?.slice(7);

const must = ({ data, error, count }, what) => {
  if (error) throw new Error(`${what}: ${error.message}`);
  return count ?? data;
};

// Lista recursiva (o list do Storage não desce em subpastas)
async function listFiles(bucket, prefix) {
  const out = [];
  for (let offset = 0; ; offset += 1000) {
    const items = must(await db.storage.from(bucket).list(prefix, { limit: 1000, offset }), `storage ${bucket}/${prefix}`);
    for (const it of items) {
      const path = `${prefix}/${it.name}`;
      if (it.id) out.push(path);
      else out.push(...(await listFiles(bucket, path))); // sem id = pasta
    }
    if (items.length < 1000) return out;
  }
}

// [tabela, coluna, ids]: ordem de exclusão (filhos primeiro)
function plan(menuIds, itemIds, groupIds, userId) {
  return [
    ["option_choices", "group_id", groupIds],
    ["option_groups", "id", groupIds],
    ["combos", "menu_id", menuIds],
    ["sales", "menu_id", menuIds],
    ["orders", "menu_id", menuIds],
    ["online_payments", "menu_id", menuIds],
    ["menu_items", "id", itemIds],
    ["categories", "menu_id", menuIds],
    ["coupons", "menu_id", menuIds],
    ["tables", "menu_id", menuIds],
    ["option_stock", "menu_id", menuIds],
    ["ai_attendant_usage", "menu_id", menuIds],
    ["menu_staff", "menu_id", menuIds],
    ["menus", "id", menuIds],
    ["marketing_emails", "profile_id", [userId]],
    ["profile_surveys", "user_id", [userId]],
    ["cancellation_reasons", "user_id", [userId]],
    ["ai_usage", "user_id", [userId]],
    ["profiles", "id", [userId]],
  ];
}

let q = db
  .from("profiles")
  .select("id, email, display_name, role, deletion_requested_at, validapay_subscription_id, stripe_subscription_id")
  .not("deletion_requested_at", "is", null)
  .order("deletion_requested_at");
if (ONLY) q = q.eq("id", ONLY);
const profiles = must(await q, "profiles");

console.log(`${EXECUTE ? "EXECUTANDO" : "DRY-RUN"} — ${profiles.length} conta(s) com exclusão solicitada\n`);

for (const p of profiles) {
  const days = Math.floor((Date.now() - new Date(p.deletion_requested_at)) / 864e5);
  console.log(`■ ${p.email} (${p.display_name ?? "-"}) id=${p.id}`);
  console.log(`  plano=${p.role ?? "-"} pedido em ${p.deletion_requested_at.slice(0, 10)} (${days} dias)`);
  if (p.validapay_subscription_id || p.stripe_subscription_id)
    console.log(`  ⚠ assinatura: validapay=${p.validapay_subscription_id ?? "-"} stripe=${p.stripe_subscription_id ?? "-"} — cancelar no painel antes`);

  const menus = must(await db.from("menus").select("id, slug").eq("owner_id", p.id), "menus");
  const menuIds = menus.map((m) => m.id);
  console.log(`  cardápio: ${menus.map((m) => m.slug).join(", ") || "(nenhum)"}`);

  const cats = menuIds.length ? must(await db.from("categories").select("id").in("menu_id", menuIds), "categories") : [];
  const items = cats.length ? must(await db.from("menu_items").select("id").in("category_id", cats.map((c) => c.id)), "menu_items") : [];
  const itemIds = items.map((i) => i.id);
  const groups = itemIds.length ? must(await db.from("option_groups").select("id").in("item_id", itemIds), "option_groups") : [];
  const groupIds = groups.map((g) => g.id);
  const staff = menuIds.length ? must(await db.from("menu_staff").select("user_id").in("menu_id", menuIds), "menu_staff") : [];

  const steps = plan(menuIds, itemIds, groupIds, p.id).filter(([, , ids]) => ids.length);
  const counts = [];
  for (const [table, col, ids] of steps) {
    const n = must(await db.from(table).select("*", { count: "exact", head: true }).in(col, ids), `count ${table}`);
    if (n) counts.push(`${table}=${n}`);
  }
  console.log(`  linhas: ${counts.join(" ") || "(nenhuma)"}`);

  const files = {
    menus: await listFiles("menus", p.id),
    "product-images": await listFiles("product-images", `menu-items/${p.id}`),
  };
  console.log(`  storage: menus=${files.menus.length} product-images=${files["product-images"].length}`);
  console.log(`  auth: dono + ${staff.length} login(s) de equipe`);

  if (!EXECUTE) {
    console.log("");
    continue;
  }

  try {
    for (const [bucket, paths] of Object.entries(files))
      for (let i = 0; i < paths.length; i += 100) must(await db.storage.from(bucket).remove(paths.slice(i, i + 100)), `remove ${bucket}`);
    for (const [table, col, ids] of steps) must(await db.from(table).delete().in(col, ids), `delete ${table}`);
    for (const { user_id } of staff) must(await db.auth.admin.deleteUser(user_id), `auth staff ${user_id}`);
    must(await db.auth.admin.deleteUser(p.id), "auth dono");
    console.log("  ✔ excluída\n");
  } catch (err) {
    console.error(`  ✘ parou: ${err.message}\n`);
  }
}
