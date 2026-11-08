import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getUserFromRequest } from "@/lib/validapay";
import { ATTENDANT_DAILY_BUDGET_MICRO_USD, ENTERPRISE_AI_MONTHLY_BUDGET_MICRO_USD } from "@/lib/attendant";

// Gasto de hoje do atendente IA do cardápio do dono (aba "Atendente IA"). A tabela não tem policy: lê pelo servidor.
export async function GET(req) {
  const user = await getUserFromRequest(req);
  if (!user) return Response.json({ error: "Não autenticado" }, { status: 401 });

  const { data: menu } = await supabaseAdmin.from("menus").select("id").eq("owner_id", user.id).maybeSingle();
  if (!menu) return Response.json({ error: "Cardápio não encontrado" }, { status: 404 });

  const { data, error } = await supabaseAdmin
    .from("ai_attendant_usage")
    .select("day, micro_usd, messages, month, month_micro_usd")
    .eq("menu_id", menu.id)
    .maybeSingle();
  if (error) {
    console.error("[attendant] erro ao ler uso:", error);
    return Response.json({ error: "Não foi possível carregar o uso." }, { status: 503 });
  }
  const now = new Date().toISOString();
  const isToday = data?.day === now.slice(0, 10);
  const isThisMonth = data?.month === `${now.slice(0, 7)}-01`;
  const pct = (spent, cap) => Math.min(100, Math.round((spent / cap) * 100));
  // só % dos limites: o valor em dólar é custo interno do Bite Menu, não vai para o estabelecimento
  return Response.json({
    messages: isToday ? data.messages : 0,
    percent: pct(isToday ? data.micro_usd : 0, ATTENDANT_DAILY_BUDGET_MICRO_USD),
    monthPercent: pct(isThisMonth ? data.month_micro_usd : 0, ENTERPRISE_AI_MONTHLY_BUDGET_MICRO_USD),
  });
}
