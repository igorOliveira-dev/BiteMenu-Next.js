import { addDays, brDate, brToday } from "@/lib/brDate";

// Planos com data de término (legacy_plan_until): assinantes da Stripe (28/10) e testes grátis.
// O pg_cron diário rebaixa pro Free na virada da data.
export const SUBSCRIBE_DAYS_BEFORE_END = 2;

export function legacyPlanInfo(profile) {
  const end = profile?.legacy_plan_until;
  if (!end || !["plus", "pro"].includes(profile.role)) return null;

  const today = brToday();
  if (end < today) return null; // já passou: o cron rebaixa, não mostra aviso velho

  const subscribeFrom = addDays(end, -SUBSCRIBE_DAYS_BEFORE_END);
  return {
    plan: profile.role,
    endLabel: brDate(end),
    subscribeFromLabel: brDate(subscribeFrom),
    // já está na janela de reassinar (a partir de 2 dias antes)
    canSubscribeNow: today >= subscribeFrom,
    daysLeft: Math.round((new Date(`${end}T12:00:00Z`) - new Date(`${today}T12:00:00Z`)) / 86400000),
  };
}
