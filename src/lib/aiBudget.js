// Cobrança das IAs do Enterprise (atendente e landing) no orçamento do cardápio (tasks/atendente-ia/atendente-ia.sql).
// Reserva o custo MÁXIMO da chamada antes, acerta pelo real depois: o teto vale mesmo com chamadas simultâneas.
// Só servidor.
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { ATTENDANT_DAILY_BUDGET_MICRO_USD, ENTERPRISE_AI_MONTHLY_BUDGET_MICRO_USD } from "@/lib/attendant";

// Haiku 5.5, US$ por milhão de tokens = micro-dólares por token. Prompt acima de 100k tokens usa a tabela mais cara.
const PRICE = { input: 0.1, output: 0.5, cacheRead: 0.01, cacheWrite1h: 0.2 };
const PRICE_LONG = { input: 0.5, output: 2.5, cacheRead: 0.05, cacheWrite1h: 1 };

export function costMicroUsd(u) {
  const promptTokens = (u.input_tokens ?? 0) + (u.cache_read_input_tokens ?? 0) + (u.cache_creation_input_tokens ?? 0);
  const p = promptTokens > 100_000 ? PRICE_LONG : PRICE;
  return Math.ceil(
    (u.input_tokens ?? 0) * p.input +
      (u.cache_creation_input_tokens ?? 0) * p.cacheWrite1h +
      (u.cache_read_input_tokens ?? 0) * p.cacheRead +
      (u.output_tokens ?? 0) * p.output,
  );
}

// true = reservado, pode chamar a IA. daily: conta no teto diário do atendente (a landing só conta no mensal).
// Erro no banco = não reserva (fail closed): sem conta, sem chamada.
export async function reserveBudget(menuId, amount, daily) {
  const { data, error } = await supabaseAdmin.rpc("ai_attendant_reserve", {
    p_menu_id: menuId,
    p_amount: amount,
    p_daily_cap: ATTENDANT_DAILY_BUDGET_MICRO_USD,
    p_monthly_cap: ENTERPRISE_AI_MONTHLY_BUDGET_MICRO_USD,
    p_daily: daily,
  });
  if (error) {
    console.error("[aiBudget] erro ao reservar:", error);
    return false;
  }
  return data === true;
}

// Devolve a sobra da reserva. Se falhar, a reserva inteira fica contada (erra para o lado seguro).
export async function settleBudget(menuId, reserved, actual, daily, message) {
  const { error } = await supabaseAdmin.rpc("ai_attendant_settle", {
    p_menu_id: menuId,
    p_delta: actual - reserved,
    p_daily: daily,
    p_message: message,
  });
  if (error) console.error("[aiBudget] erro ao acertar:", error);
}
