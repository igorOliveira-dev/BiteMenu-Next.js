// Limite de tokens por sessão do Bite Menu IA (tabela ai_usage, só o servidor acessa).
// Compartilhado pelo assistente do cardápio e pela landing: os dois gastam do mesmo saldo.
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { AI_SESSION_HOURS, AI_SESSION_TOKEN_LIMIT } from "@/lib/assistant";

const SESSION_MS = AI_SESSION_HOURS * 60 * 60 * 1000;

// Sem linha ou janela vencida = sessão zerada (a nova começa na próxima mensagem)
export async function getUsage(userId) {
  const { data, error } = await supabaseAdmin
    .from("ai_usage")
    .select("window_start, tokens")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  if (!data || Date.now() - new Date(data.window_start).getTime() >= SESSION_MS) return { windowStart: null, tokens: 0 };
  return { windowStart: data.window_start, tokens: data.tokens };
}

export async function addUsage(userId, current, used) {
  const row = {
    user_id: userId,
    window_start: current.windowStart ?? new Date().toISOString(),
    tokens: current.tokens + used,
    updated_at: new Date().toISOString(),
  };
  const { error } = await supabaseAdmin.from("ai_usage").upsert(row);
  if (error) console.error("[assistant] erro ao registrar uso:", error);
  return { windowStart: row.window_start, tokens: row.tokens };
}

// O que o painel mostra: % usado e quando a sessão zera
export function usageInfo({ windowStart, tokens }) {
  return {
    percent: Math.min(100, Math.round((tokens / AI_SESSION_TOKEN_LIMIT) * 100)),
    resetsAt: windowStart ? new Date(new Date(windowStart).getTime() + SESSION_MS).toISOString() : null,
  };
}
