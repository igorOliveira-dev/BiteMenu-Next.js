import { getUserFromRequest } from "@/lib/validapay";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { loadConfig, loadMetrics, runRemarketing, varsFor } from "@/lib/remarketing";
import { renderRemarketingEmail, sendRemarketingEmail } from "@/lib/emails/remarketingEmails";

// Painel /admin/remarketing (só role admin).
// GET: config + métricas  ·  GET ?view=queue: fila de hoje (dry-run, ignora a pausa)
// POST { action: "settings" | "track" | "step-save" | "step-delete" | "preview" | "test", ... }

export const maxDuration = 120;

const json = (body, status = 200) => Response.json(body, { status });
const int = (v, fallback = 0) => (Number.isFinite(Number(v)) ? Math.max(0, Math.round(Number(v))) : fallback);
const CONTENT_FIELDS = ["subject", "preview", "title", "body", "cta_label", "cta_path"];

async function requireAdmin(req) {
  const user = await getUserFromRequest(req);
  if (!user) return null;
  const { data: me } = await supabaseAdmin.from("profiles").select("*").eq("id", user.id).single();
  return me?.role === "admin" ? me : null;
}

// Variáveis do teste/prévia: dados do próprio admin
async function ownVars(me) {
  const { data: menu } = await supabaseAdmin
    .from("menus")
    .select("id, slug, title, last_access_at")
    .eq("owner_id", me.id)
    .limit(1)
    .maybeSingle();
  let items = 0;
  if (menu) {
    const { data: cats } = await supabaseAdmin.from("categories").select("id").eq("menu_id", menu.id);
    if (cats?.length) {
      const { count } = await supabaseAdmin
        .from("menu_items")
        .select("id", { count: "exact", head: true })
        .in("category_id", cats.map((c) => c.id));
      items = count ?? 0;
    }
  }
  return varsFor(me, menu, items);
}

const cleanStep = (s) => ({
  track: s.track,
  name: String(s.name ?? "").trim() || "Sem nome",
  position: int(s.position),
  delay_days: s.delay_days === "" || s.delay_days == null ? null : int(s.delay_days),
  subject: String(s.subject ?? ""),
  preview: String(s.preview ?? ""),
  title: String(s.title ?? ""),
  body: String(s.body ?? ""),
  cta_label: String(s.cta_label ?? ""),
  cta_path: String(s.cta_path ?? "") || "/dashboard",
  active: !!s.active,
  valid_from: s.valid_from || null,
  valid_until: s.valid_until || null,
});

export async function GET(req) {
  try {
    if (!(await requireAdmin(req))) return json({ error: "Sem permissão" }, 403);
    if (new URL(req.url).searchParams.get("view") === "queue") return json(await runRemarketing({ send: false }));
    const config = await loadConfig();
    return json({ ...config, metrics: await loadMetrics(config.steps) });
  } catch (err) {
    console.error("[Remarketing admin] Erro:", err);
    return json({ error: err.message || "Erro interno" }, 500);
  }
}

export async function POST(req) {
  try {
    const me = await requireAdmin(req);
    if (!me) return json({ error: "Sem permissão" }, 403);
    const { action, ...p } = await req.json();
    const now = new Date().toISOString();

    if (action === "settings") {
      const { error } = await supabaseAdmin
        .from("marketing_settings")
        .update({
          paused: !!p.paused,
          daily_limit: int(p.daily_limit, 60),
          min_gap_days: int(p.min_gap_days, 7),
          control_percent: Math.min(100, int(p.control_percent, 10)),
          updated_at: now,
        })
        .eq("id", 1);
      if (error) throw error;
      return json({ ok: true });
    }

    if (action === "track") {
      if (!["A", "B", "C"].includes(p.id)) return json({ error: "Trilha inválida" }, 400);
      const { error } = await supabaseAdmin
        .from("marketing_tracks")
        .update({ paused: !!p.paused, daily_limit: int(p.daily_limit, 30), conditions: p.conditions ?? {}, updated_at: now })
        .eq("id", p.id);
      if (error) throw error;
      return json({ ok: true });
    }

    if (action === "step-save") {
      const step = cleanStep(p.step ?? {});
      if (!["A", "B", "C"].includes(step.track)) return json({ error: "Trilha inválida" }, 400);
      if (!p.step.id) {
        const { data, error } = await supabaseAdmin.from("marketing_steps").insert({ ...step, updated_at: now }).select().single();
        if (error) throw error;
        return json({ step: data });
      }
      // mudou o texto → nova versão (as métricas separam por versão)
      const { data: old, error: oldError } = await supabaseAdmin.from("marketing_steps").select("*").eq("id", p.step.id).single();
      if (oldError) throw oldError;
      const changed = CONTENT_FIELDS.some((f) => (old[f] ?? "") !== step[f]);
      const { data, error } = await supabaseAdmin
        .from("marketing_steps")
        .update({ ...step, track: old.track, version: changed ? old.version + 1 : old.version, updated_at: now })
        .eq("id", p.step.id)
        .select()
        .single();
      if (error) throw error;
      return json({ step: data });
    }

    if (action === "step-delete") {
      const { count } = await supabaseAdmin
        .from("marketing_emails")
        .select("id", { count: "exact", head: true })
        .eq("step_id", p.id);
      if (count) return json({ error: "Esse e-mail já foi enviado. Desative em vez de excluir, para manter o histórico." }, 400);
      const { error } = await supabaseAdmin.from("marketing_steps").delete().eq("id", p.id);
      if (error) throw error;
      return json({ ok: true });
    }

    if (action === "preview") {
      const { subject, html } = renderRemarketingEmail(cleanStep(p.step ?? {}), await ownVars(me), me.id);
      return json({ subject, html });
    }

    if (action === "test") {
      if (!me.email) return json({ error: "Seu perfil não tem e-mail" }, 400);
      await sendRemarketingEmail(cleanStep(p.step ?? {}), me.email, await ownVars(me), me.id, { test: true });
      return json({ sentTo: me.email });
    }

    return json({ error: "action inválida" }, 400);
  } catch (err) {
    console.error("[Remarketing admin] Erro:", err);
    return json({ error: err.message || "Erro interno" }, 500);
  }
}
