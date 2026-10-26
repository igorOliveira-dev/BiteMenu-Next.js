import crypto from "crypto";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { brToday } from "@/lib/brDate";
import { SITE } from "@/lib/emails/subscriptionEmails";
import { sendRemarketingEmail } from "@/lib/emails/remarketingEmails";

// Remarketing por e-mail: decide quem recebe qual e-mail hoje.
// Config (pausa, limites, condições, conteúdo) fica nas tabelas marketing_* e é editada no /admin/remarketing.
// - Cada pessoa entra só na primeira trilha em que se encaixa: A (ativação) → B (reativação) → C (reapresentação).
// - A e B: sequência por delay_days. Quem está atrasado recebe só o passo mais recente já vencido.
// - C: mensagens rotativas na ordem (position), uma a cada interval_days, para depois de max_unopened sem abertura.
// - Grupo de controle: entra no histórico (is_control) mas nunca recebe e-mail.

const DAY = 864e5;
const PAID = ["plus", "pro", "business"];
const TRACK_ORDER = ["A", "B", "C"];

const brDay = (iso) => new Date(iso).toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });

async function all(table, cols) {
  const out = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabaseAdmin.from(table).select(cols).order("id").range(from, from + 999);
    if (error) throw error;
    out.push(...data);
    if (data.length < 1000) return out;
  }
}

export async function loadConfig() {
  const [settings, tracks, steps] = await Promise.all([
    supabaseAdmin.from("marketing_settings").select("*").eq("id", 1).single(),
    supabaseAdmin.from("marketing_tracks").select("*"),
    supabaseAdmin.from("marketing_steps").select("*").order("track").order("position"),
  ]);
  const error = settings.error || tracks.error || steps.error;
  if (error) throw error;
  return { settings: settings.data, tracks: Object.fromEntries(tracks.data.map((t) => [t.id, t])), steps: steps.data };
}

// Grupo de controle fixo por pessoa (mesmo resultado todo dia)
const isControl = (profileId, percent) =>
  parseInt(crypto.createHash("md5").update(profileId).digest("hex").slice(0, 8), 16) % 100 < percent;

export function varsFor(profile, menu, items, now = Date.now()) {
  const lastActivity = menu?.last_access_at ?? profile.created_at;
  return {
    nome: profile.display_name?.trim().split(/\s+/)[0] ?? "",
    restaurante: menu?.title?.trim() || "seu restaurante",
    link_cardapio: menu?.slug ? `${SITE}/menu/${menu.slug}` : `${SITE}/dashboard`,
    itens: String(items ?? 0),
    dias_sem_acessar: String(Math.max(0, Math.floor((now - new Date(lastActivity)) / DAY))),
    mes_cadastro: new Date(profile.created_at).toLocaleDateString("pt-BR", {
      month: "long",
      year: "numeric",
      timeZone: "America/Sao_Paulo",
    }),
  };
}

async function loadAudience() {
  const [profiles, menus, categories, items, orders, sales, history] = await Promise.all([
    all("profiles", "id, email, display_name, role, created_at, marketing_opt_out_at, deletion_requested_at"),
    all("menus", "id, owner_id, slug, title, last_access_at"),
    all("categories", "id, menu_id"),
    all("menu_items", "id, category_id"),
    all("orders", "id, menu_id, created_at"),
    all("sales", "id, menu_id, created_at"),
    all("marketing_emails", "id, profile_id, track, step_id, cycle, is_control, sent_at, opened_at, clicked_at"),
  ]);

  const menuOfCategory = new Map(categories.map((c) => [c.id, c.menu_id]));
  const itemCount = new Map();
  for (const i of items) {
    const menuId = menuOfCategory.get(i.category_id);
    itemCount.set(menuId, (itemCount.get(menuId) || 0) + 1);
  }
  const lastOrder = new Map();
  for (const o of [...orders, ...sales]) {
    const t = +new Date(o.created_at);
    if (t > (lastOrder.get(o.menu_id) || 0)) lastOrder.set(o.menu_id, t);
  }
  // dono com mais de um cardápio: vale o que tem mais itens
  const menuOf = new Map();
  for (const m of menus) {
    const current = menuOf.get(m.owner_id);
    if (!current || (itemCount.get(m.id) || 0) > (itemCount.get(current.id) || 0)) menuOf.set(m.owner_id, m);
  }
  const historyOf = new Map();
  for (const h of history) {
    if (!historyOf.has(h.profile_id)) historyOf.set(h.profile_id, []);
    historyOf.get(h.profile_id).push(h);
  }
  return { profiles, menuOf, itemCount, lastOrder, historyOf, history };
}

function candidates({ settings, tracks, steps }, aud, now = Date.now()) {
  const today = brToday();
  const days = (iso) => (iso ? (now - new Date(iso)) / DAY : null);
  const activeSteps = (track) =>
    steps.filter(
      (s) =>
        s.track === track &&
        s.active &&
        (!s.valid_from || s.valid_from <= today) &&
        (!s.valid_until || s.valid_until >= today),
    );

  // A e B: o passo mais recente já vencido, se ainda não foi enviado nesse ciclo
  const pickSequential = (track, cycle, age, hist) => {
    const list = activeSteps(track)
      .filter((s) => s.delay_days != null)
      .sort((a, b) => a.delay_days - b.delay_days);
    const sent = new Set(hist.filter((h) => h.cycle === cycle).map((h) => h.step_id));
    const step = list.filter((s) => s.delay_days <= age).at(-1);
    if (!step || sent.has(step.id)) return null;
    if (list.some((s) => sent.has(s.id) && s.delay_days >= step.delay_days)) return null;
    return step;
  };

  // C: próxima mensagem da lista que a pessoa ainda não recebeu
  const pickRotating = (cond, hist) => {
    const sentC = hist.filter((h) => h.track === "C").sort((a, b) => new Date(a.sent_at) - new Date(b.sent_at));
    const last = sentC.at(-1);
    if (last && days(last.sent_at) < (cond.interval_days ?? 60)) return null;
    const max = cond.max_unopened ?? 3;
    const recent = sentC.filter((h) => !h.is_control).slice(-max);
    if (max > 0 && recent.length >= max && recent.every((h) => !h.opened_at && !h.clicked_at)) return null;
    const sent = new Set(sentC.map((h) => h.step_id));
    return activeSteps("C").find((s) => !sent.has(s.id)) ?? null;
  };

  const out = [];
  for (const p of aud.profiles) {
    if (!p.email || p.marketing_opt_out_at || p.deletion_requested_at) continue; // pediu exclusão: nunca recebe
    const hist = aud.historyOf.get(p.id) ?? [];
    const lastSent = Math.max(0, ...hist.map((h) => +new Date(h.sent_at)));
    if (lastSent && (now - lastSent) / DAY < settings.min_gap_days) continue;

    const menu = aud.menuOf.get(p.id);
    const items = menu ? aud.itemCount.get(menu.id) || 0 : 0;
    const lastOrder = menu ? aud.lastOrder.get(menu.id) : null;
    const noOrdersFor = (d) => !lastOrder || (now - lastOrder) / DAY >= (d ?? 0);
    const signupDays = days(p.created_at);
    const accessDays = days(menu?.last_access_at);
    const roleOk = (track) => (tracks[track]?.conditions?.roles ?? ["free"]).includes(p.role);

    const a = tracks.A?.conditions ?? {};
    const b = tracks.B?.conditions ?? {};
    const c = tracks.C?.conditions ?? {};
    let track = null;
    let cycle = null;
    let step = null;

    if (
      tracks.A &&
      roleOk("A") &&
      ((!menu && a.include_no_menu) || (menu && items === 0 && a.include_empty_menu)) &&
      signupDays <= (a.signup_max_days ?? 30)
    ) {
      track = "A";
      cycle = "signup";
      step = pickSequential("A", cycle, signupDays, hist);
    } else if (
      tracks.B &&
      roleOk("B") &&
      menu &&
      items >= (b.min_items ?? 1) &&
      accessDays != null &&
      accessDays >= (b.inactive_min_days ?? 21) &&
      accessDays <= (b.inactive_max_days ?? 150) &&
      noOrdersFor(b.no_orders_days)
    ) {
      // novo ciclo cada vez que a pessoa volta e para de novo
      track = "B";
      cycle = `B:${brDay(menu.last_access_at)}`;
      step = pickSequential("B", cycle, accessDays, hist);
    } else if (
      tracks.C &&
      roleOk("C") &&
      (accessDays ?? signupDays) >= (c.inactive_min_days ?? 150) &&
      noOrdersFor(c.no_orders_days)
    ) {
      track = "C";
      cycle = "C";
      step = pickRotating(c, hist);
    }
    if (!track || !step) continue;

    out.push({
      profile: p,
      menu,
      items,
      track,
      step,
      cycle,
      // admin nunca cai no controle: senão o teste com "só admin" pode não enviar nada
      isControl: p.role !== "admin" && isControl(p.id, settings.control_percent),
      hadOrder: !!lastOrder,
      signupDays,
      accessDays,
      vars: varsFor(p, menu, items, now),
    });
  }

  // prioridade dentro de cada trilha
  const rank = {
    A: (x, y) => x.signupDays - y.signupDays,
    B: (x, y) => y.hadOrder - x.hadOrder || (y.items >= 5) - (x.items >= 5) || x.accessDays - y.accessDays,
    C: (x, y) => (x.accessDays ?? x.signupDays) - (y.accessDays ?? y.signupDays),
  };
  return TRACK_ORDER.map((t) => out.filter((x) => x.track === t).sort(rank[t]));
}

// Aplica pausa e limites diários. ignorePause: prévia do painel ("o que sairia se estivesse ligado").
function buildQueue(cfg, aud, { ignorePause = false } = {}) {
  const today = brToday();
  const sentToday = aud.history.filter((h) => !h.is_control && brDay(h.sent_at) === today);
  let remaining = Math.max(0, cfg.settings.daily_limit - sentToday.length);
  const byTrack = candidates(cfg, aud);
  const queue = [];
  const summary = {};

  TRACK_ORDER.forEach((t, i) => {
    const track = cfg.tracks[t];
    const list = byTrack[i];
    const s = (summary[t] = { eligible: 0, control: 0, queued: 0, deferred: 0, paused: !!track?.paused });
    if (!track || (track.paused && !ignorePause)) return;
    let trackLeft = Math.max(0, track.daily_limit - sentToday.filter((h) => h.track === t).length);
    for (const c of list) {
      if (c.isControl) {
        s.control++;
        queue.push(c);
        continue;
      }
      s.eligible++;
      if (remaining <= 0 || trackLeft <= 0) {
        s.deferred++;
        continue;
      }
      s.queued++;
      remaining--;
      trackLeft--;
      queue.push(c);
    }
  });
  return { queue, summary, sentToday: sentToday.length };
}

const queueRow = (c) => ({
  email: c.profile.email,
  name: c.profile.display_name,
  role: c.profile.role,
  track: c.track,
  step: c.step.name,
  control: c.isControl,
  restaurant: c.menu?.title ?? null,
  items: c.items,
  hadOrder: c.hadOrder,
  signupDays: Math.floor(c.signupDays),
  accessDays: c.accessDays == null ? null : Math.floor(c.accessDays),
});

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// send=false: só calcula a fila (dry-run). send=true: envia, respeitando a pausa geral e por trilha.
export async function runRemarketing({ send = false } = {}) {
  const cfg = await loadConfig();
  if (send && cfg.settings.paused) return { paused: true, sent: 0 };

  const aud = await loadAudience();
  const { queue, summary, sentToday } = buildQueue(cfg, aud, { ignorePause: !send });
  const base = { paused: cfg.settings.paused, dailyLimit: cfg.settings.daily_limit, sentToday, summary };

  if (!send) return { ...base, queue: queue.map(queueRow) };

  let sent = 0;
  let control = 0;
  const failed = [];
  for (const c of queue) {
    // reserva a linha antes de enviar: a unique (profile_id, step_id, cycle) impede envio duplicado
    const { data: row, error } = await supabaseAdmin
      .from("marketing_emails")
      .insert({
        profile_id: c.profile.id,
        track: c.track,
        step_id: c.step.id,
        step_version: c.step.version,
        cycle: c.cycle,
        is_control: c.isControl,
      })
      .select("id")
      .single();
    if (error) {
      failed.push({ email: c.profile.email, error: error.message });
      continue;
    }
    if (c.isControl) {
      control++;
      continue;
    }
    try {
      const resendId = await sendRemarketingEmail(c.step, c.profile.email, c.vars, c.profile.id, {
        idempotencyKey: `mkt-${c.step.id}-${c.profile.id}-${c.cycle}`,
      });
      await supabaseAdmin.from("marketing_emails").update({ resend_id: resendId }).eq("id", row.id);
      sent++;
    } catch (err) {
      await supabaseAdmin.from("marketing_emails").delete().eq("id", row.id);
      failed.push({ email: c.profile.email, error: err.message });
    }
    await sleep(600); // limite de envio do Resend
  }

  console.log(`[Remarketing] ${sent} enviados, ${control} controle, ${failed.length} falhas`);
  return { ...base, sent, control, failed };
}

// Métricas por trilha (últimos 30 dias) e por e-mail/versão (todo o histórico).
// "Voltou" = acessou o painel depois do envio; "assinou" = está num plano pago hoje.
export async function loadMetrics(steps) {
  const [history, profiles, menus] = await Promise.all([
    all("marketing_emails", "id, profile_id, track, step_id, step_version, is_control, sent_at, opened_at, clicked_at, bounced_at, complained_at"),
    all("profiles", "id, role, marketing_opt_out_at"),
    all("menus", "id, owner_id, last_access_at"),
  ]);
  const roleOf = new Map(profiles.map((p) => [p.id, p.role]));
  const lastAccessOf = new Map();
  for (const m of menus) {
    const t = m.last_access_at ? +new Date(m.last_access_at) : 0;
    if (t > (lastAccessOf.get(m.owner_id) ?? 0)) lastAccessOf.set(m.owner_id, t);
  }

  const empty = () => ({ sent: 0, opened: 0, clicked: 0, bounced: 0, complained: 0, returned: 0, subscribed: 0, control: 0, controlReturned: 0, controlSubscribed: 0 });
  const add = (acc, h) => {
    const returned = (lastAccessOf.get(h.profile_id) ?? 0) > +new Date(h.sent_at);
    const subscribed = PAID.includes(roleOf.get(h.profile_id));
    if (h.is_control) {
      acc.control++;
      acc.controlReturned += returned;
      acc.controlSubscribed += subscribed;
      return;
    }
    acc.sent++;
    acc.opened += !!(h.opened_at || h.clicked_at);
    acc.clicked += !!h.clicked_at;
    acc.bounced += !!h.bounced_at;
    acc.complained += !!h.complained_at;
    acc.returned += returned;
    acc.subscribed += subscribed;
  };

  const since30 = new Date(Date.now() - 30 * DAY).toISOString();
  const tracks = Object.fromEntries(TRACK_ORDER.map((t) => [t, empty()]));
  const byStep = {};
  for (const h of history) {
    if (h.sent_at >= since30) add(tracks[h.track], h);
    const key = `${h.step_id}:${h.step_version}`;
    add((byStep[key] ??= empty()), h);
  }

  const stepName = new Map(steps.map((s) => [s.id, s.name]));
  const today = brToday();
  return {
    sentToday: history.filter((h) => !h.is_control && brDay(h.sent_at) === today).length,
    optOuts: profiles.filter((p) => p.marketing_opt_out_at).length,
    tracks,
    steps: Object.entries(byStep).map(([key, m]) => {
      const [stepId, version] = key.split(":");
      return { stepId, version: Number(version), name: stepName.get(stepId) ?? "(removido)", ...m };
    }),
  };
}
