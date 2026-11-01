import { addDays, brDate, brToday } from "@/lib/brDate";

// Planos com data de término (legacy_plan_until): assinantes da Stripe e testes grátis.
// legacy_plan_until é o dia D, em que a conta já está no Free (o plano vale até o dia anterior).
// O pg_cron diário rebaixa pro Free no dia D.
export const SUBSCRIBE_DAYS_BEFORE_END = 5;

// Cupons criados na ValidaPay (o cliente digita no checkout)
export const LEGACY_COUPONS = {
  early: { code: "VOLTA25", percent: 25 }, // de D-5 até D
  comeback: { code: "REATIVACAO", percent: 15, daysAfterEnd: 7 }, // a partir de D, por 7 dias
};

// Dias antes de D em que sai e-mail + tela cheia no dashboard
const STAGE_BY_DAYS_LEFT = { 5: "d5", 2: "d2", 1: "d1", 0: "free" };
export const LEGACY_STAGES = Object.values(STAGE_BY_DAYS_LEFT);

const daysBetween = (from, to) => Math.round((new Date(`${to}T12:00:00Z`) - new Date(`${from}T12:00:00Z`)) / 86400000);

function labels(end) {
  return {
    end,
    endLabel: brDate(end),
    lastDayLabel: brDate(addDays(end, -1)),
    comebackUntilLabel: brDate(addDays(end, LEGACY_COUPONS.comeback.daysAfterEnd)),
  };
}

export function legacyPlanInfo(profile) {
  const end = profile?.legacy_plan_until;
  if (!end || !["plus", "pro"].includes(profile.role)) return null;

  const today = brToday();
  if (end <= today) return null; // já é o dia D: o cron rebaixa, não mostra aviso velho

  const subscribeFrom = addDays(end, -SUBSCRIBE_DAYS_BEFORE_END);
  return {
    plan: profile.role,
    ...labels(end),
    subscribeFromLabel: brDate(subscribeFrom),
    // já está na janela de reassinar (a partir de 5 dias antes)
    canSubscribeNow: today >= subscribeFrom,
    daysLeft: daysBetween(today, end),
  };
}

// Etapa do aviso de hoje (d5 | d2 | d1 | free) ou null. `forceStage` é só pro e-mail de teste.
// No dia D a conta pode já estar no Free (rebaixada) ou ainda não (cron não rodou): as duas contam.
// Quem reassina pela ValidaPay tem legacy_plan_until zerado pelo webhook e sai do fluxo.
export function legacyNotice(profile, forceStage) {
  const end = profile?.legacy_plan_until;
  if (!end) return null;

  const stage = forceStage ?? STAGE_BY_DAYS_LEFT[daysBetween(brToday(), end)];
  if (!stage) return null;

  const allowed = stage === "free" ? ["free", "plus", "pro"] : ["plus", "pro"];
  if (!allowed.includes(profile.role)) return null;

  return {
    stage,
    plan: profile.role === "free" ? null : profile.role, // no dia D rebaixado, o plano antigo não fica salvo
    ...labels(end),
  };
}
