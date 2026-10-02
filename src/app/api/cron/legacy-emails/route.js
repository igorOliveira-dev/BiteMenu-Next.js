import crypto from "crypto";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { addDays, brToday } from "@/lib/brDate";
import { legacyPlanInfo, SUBSCRIBE_DAYS_BEFORE_END } from "@/lib/legacyPlan";
import { sendLegacyPlanEmail } from "@/lib/emails/legacyPlanEmails";

// E-mails pra quem tem plano com data de término (Stripe antiga / teste grátis).
// POST { kind: "announce" | "reminder", mode: "dry-run" | "test" | "send", testTo? }
// Authorization: Bearer CRON_SECRET
// - announce: todos com plano ainda dentro da data (rodado uma vez, à mão)
// - reminder: só quem termina daqui a 2 dias (pg_cron chama todo dia)

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
    .in("role", ["plus", "pro"])
    .not("legacy_plan_until", "is", null);

  query =
    kind === "reminder"
      ? query.eq("legacy_plan_until", addDays(today, SUBSCRIBE_DAYS_BEFORE_END))
      : query.gte("legacy_plan_until", today);

  const { data, error } = await query;
  if (error) throw error;
  return data.filter((p) => p.email).map((p) => ({ ...p, info: legacyPlanInfo(p) }));
}

export async function POST(req) {
  if (!authorized(req)) return json({ error: "Unauthorized" }, 401);

  try {
    const { kind, mode = "dry-run", testTo } = await req.json();
    if (!["announce", "reminder"].includes(kind)) return json({ error: "kind inválido" }, 400);

    const list = await recipients(kind);

    if (mode === "dry-run") {
      return json({
        kind,
        count: list.length,
        recipients: list.map((p) => ({ email: p.email, plan: p.role, ends: p.legacy_plan_until })),
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
        await sendLegacyPlanEmail(
          kind,
          p.email,
          { name: p.display_name, info: p.info },
          `legacy-${kind}-${p.id}-${p.legacy_plan_until}`,
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
