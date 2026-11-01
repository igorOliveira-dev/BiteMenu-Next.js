import crypto from "crypto";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { addDays, brToday } from "@/lib/brDate";
import { legacyNotice, legacyPlanInfo, LEGACY_STAGES } from "@/lib/legacyPlan";
import { sendLegacyPlanEmail } from "@/lib/emails/legacyPlanEmails";

// E-mails pra quem tem plano com data de término (Stripe antiga / teste grátis).
// POST { kind: "announce" | "reminder", mode: "dry-run" | "test" | "send", testTo?, stage? }
// Authorization: Bearer CRON_SECRET
// - announce: todos com plano ainda dentro da data (rodado uma vez, à mão)
// - reminder: pg_cron chama todo dia; cada um recebe o e-mail da etapa de hoje (D = legacy_plan_until):
//   d5 (cupom 25%), d2 (lembrete), d1 (último dia), free (voltou ao Free, cupom de reativação).
//   No modo test, `stage` escolhe qual etapa mandar.

// ~1s por destinatário (limite do Resend): 72 clientes passam de 60s
export const maxDuration = 300;

const json = (body, status = 200) => Response.json(body, { status });

function authorized(req) {
  const secret = process.env.CRON_SECRET;
  const given = req.headers.get("authorization")?.replace("Bearer ", "") ?? "";
  return !!secret && given.length === secret.length && crypto.timingSafeEqual(Buffer.from(given), Buffer.from(secret));
}

async function recipients(kind) {
  const today = brToday();
  let query = supabaseAdmin
    .from("profiles")
    .select("id, email, display_name, role, legacy_plan_until")
    .not("legacy_plan_until", "is", null);

  query =
    kind === "reminder"
      ? query.in("role", ["free", "plus", "pro"]).in("legacy_plan_until", [5, 2, 1, 0].map((d) => addDays(today, d)))
      : query.in("role", ["plus", "pro"]).gt("legacy_plan_until", today);

  const { data, error } = await query;
  if (error) throw error;
  return data
    .filter((p) => p.email)
    .map((p) => (kind === "reminder" ? { ...p, notice: legacyNotice(p) } : { ...p, info: legacyPlanInfo(p) }))
    .filter((p) => p.notice || p.info);
}

export async function POST(req) {
  if (!authorized(req)) return json({ error: "Unauthorized" }, 401);

  try {
    const { kind, mode = "dry-run", testTo, stage = "d5" } = await req.json();
    if (!["announce", "reminder"].includes(kind)) return json({ error: "kind inválido" }, 400);

    const list = await recipients(kind);

    if (mode === "dry-run") {
      return json({
        kind,
        count: list.length,
        recipients: list.map((p) => ({ email: p.email, plan: p.role, ends: p.legacy_plan_until, stage: p.notice?.stage })),
      });
    }

    if (mode === "test") {
      if (!testTo) return json({ error: "testTo obrigatório no modo test" }, 400);
      // usa os dados do próprio perfil de quem recebe o teste (nome, plano e data de término)
      const { data: own, error: ownError } = await supabaseAdmin
        .from("profiles")
        .select("display_name, role, legacy_plan_until")
        .eq("email", testTo)
        .maybeSingle();
      if (ownError) throw ownError;
      if (kind === "reminder") {
        if (!LEGACY_STAGES.includes(stage)) return json({ error: `stage inválido (${LEGACY_STAGES.join(", ")})` }, 400);
        const notice = legacyNotice(own, stage);
        if (!notice) return json({ error: `${testTo} precisa ter legacy_plan_until e role plus/pro` }, 400);
        await sendLegacyPlanEmail(stage, testTo, { name: own.display_name, notice });
        return json({ kind, stage, sentTo: testTo, plan: own.role, ends: own.legacy_plan_until });
      }
      const info = legacyPlanInfo(own);
      if (!info) {
        return json({ error: `${testTo} não tem plano com data de término válida (role plus/pro e legacy_plan_until futura)` }, 400);
      }
      await sendLegacyPlanEmail(kind, testTo, { name: own.display_name, info });
      return json({ kind, sentTo: testTo, plan: own.role, ends: own.legacy_plan_until });
    }

    if (mode !== "send") return json({ error: "mode inválido" }, 400);

    const sent = [];
    const failed = [];
    for (const p of list) {
      try {
        // mesmo cliente + mesma data = mesmo e-mail: rodar de novo no mesmo dia não duplica
        const template = p.notice?.stage ?? kind;
        await sendLegacyPlanEmail(
          template,
          p.email,
          { name: p.display_name, info: p.info, notice: p.notice },
          `legacy-${template}-${p.id}-${p.legacy_plan_until}`,
        );
        sent.push(p.email);
      } catch (err) {
        failed.push({ email: p.email, error: err.message });
      }
      await new Promise((r) => setTimeout(r, 600)); // limite de envio do Resend
    }

    console.log(`[Legacy Emails] ${kind}: ${sent.length} enviados, ${failed.length} falhas`);
    return json({ kind, sent: sent.length, failed });
  } catch (err) {
    console.error("[Legacy Emails] Erro:", err);
    return json({ error: err.message || "Erro interno" }, 500);
  }
}
