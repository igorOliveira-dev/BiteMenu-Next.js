import Anthropic from "@anthropic-ai/sdk";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getUserFromRequest } from "@/lib/validapay";
import { costMicroUsd, reserveBudget, settleBudget } from "@/lib/aiBudget";
import { isLoyaltyOn } from "@/lib/loyalty";
import { INSIGHTS_MAX_ROWS, INSIGHTS_MIN_SALES, INSIGHTS_ROLES, summarizeSales } from "@/lib/salesInsights";

// Insights com IA do Dashboard de vendas (tasks/insights-ia/insights-ia-plan.md).
// O navegador manda só o período; o servidor busca as vendas do dono, resume e pede as sugestões.
export const maxDuration = 120;

const anthropic = new Anthropic();
// Haiku x Sonnet: decidir no checkpoint. Trocar para Sonnet exige o preço dele em costMicroUsd (aiBudget usa o do Haiku).
const INSIGHTS_MODEL = "claude-haiku-5-5";
const MAX_TOKENS = 8000;
const MAX_DAYS = 5 * 366;
const DAY = 24 * 60 * 60 * 1000;

const SYSTEM = `Você é um consultor de vendas de restaurantes e analisa os dados de um estabelecimento que usa o Bite Menu (cardápio digital com pedidos).
Objetivo: dar ao dono de 3 a 5 sugestões práticas para VENDER MAIS PRODUTOS, em português do Brasil.

Os dados chegam em JSON: totais do período e do anterior, vendas por dia da semana e hora (horário de Brasília), serviço (delivery, pickup = retirada, dinein = no local), produtos mais vendidos (qtd, faturamento, % com adicional), itens que saem juntos no mesmo pedido, itens do cardápio que não venderam no período (com foto? com descrição? é destaque?), destaques, promoções, recorrência de clientes e se a fidelidade está ligada. "amostra: true" = só as vendas mais recentes do período.

Regras:
- Cada sugestão nasce de um número real dos dados: escreva esse número em "dado" (ex.: "Batata saiu junto do X-Burger em 42 de 180 pedidos"). Nunca invente números, produtos ou percentuais.
- "acao" é concreta e dá para fazer nesta semana, de preferência com o que o Bite Menu já tem: marcar item como destaque, adicionar foto ou descrição, preço promocional, combo de desconto, cupom, programa de fidelidade, ajustar o horário de funcionamento.
- Nada genérico ("faça promoções", "melhore o atendimento"). Diga qual item, qual dia, qual horário.
- Não sugira ligar a fidelidade se "fidelidade" for true.
- "numero": o número principal do "dado" em até 14 caracteres, para aparecer grande na tela (ex.: "42 pedidos", "+23%", "0 vendas", "R$ 1.230").
- "tipo": o tipo da ação (combo, destaque, foto, horario, promocao, fidelidade, preco; "outro" se nenhum servir).
- "titulo": curto, até 8 palavras.
- Ordene da sugestão de maior impacto para a menor. "impacto": alto, medio ou baixo.
- "resumo": 1 ou 2 frases sobre como foi o período em relação ao anterior.
- Seja direto, linguagem simples de dono de restaurante, sem jargão.`;

const SCHEMA = {
  type: "object",
  properties: {
    resumo: { type: "string" },
    insights: {
      type: "array",
      items: {
        type: "object",
        properties: {
          tipo: { type: "string", enum: ["combo", "destaque", "foto", "horario", "promocao", "fidelidade", "preco", "outro"] },
          numero: { type: "string" },
          titulo: { type: "string" },
          dado: { type: "string" },
          acao: { type: "string" },
          impacto: { type: "string", enum: ["alto", "medio", "baixo"] },
        },
        required: ["tipo", "numero", "titulo", "dado", "acao", "impacto"],
        additionalProperties: false,
      },
    },
  },
  required: ["resumo", "insights"],
  additionalProperties: false,
};

const fail = (error, status) => Response.json({ error }, { status });
// "AAAA-MM-DD" no horário de Brasília (sem horário de verão desde 2019)
const brTime = (ymd, end) => new Date(`${ymd}T${end ? "23:59:59.999" : "00:00:00.000"}-03:00`);
const isYmd = (v) => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(new Date(v).getTime());

export async function POST(req) {
  const user = await getUserFromRequest(req);
  if (!user) return fail("Não autenticado", 401);
  const { data: profile } = await supabaseAdmin.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (!INSIGHTS_ROLES.includes(profile?.role)) return fail("Os insights com IA não estão disponíveis no seu plano.", 403);

  const { start, end } = await req.json().catch(() => ({}));
  if (!isYmd(start) || !isYmd(end)) return fail("Período inválido", 400);
  const from = brTime(start, false);
  const to = brTime(end, true);
  if (to < from || to - from > MAX_DAYS * DAY) return fail("Período inválido", 400);
  // período anterior: mesma duração, terminando logo antes do início
  const prevFrom = new Date(from.getTime() - (to.getTime() + 1 - from.getTime()));

  const { data: menu } = await supabaseAdmin
    .from("menus")
    .select("id, currency, categories ( name, menu_items ( id, name, price, promo_price, image_url, description, starred, visible ) )")
    .eq("owner_id", user.id)
    .maybeSingle();
  if (!menu) return fail("Crie seu cardápio antes de pedir insights.", 400);

  const [{ data: sales, error }, { data: prevSales }, { data: loyaltyRow }] = await Promise.all([
    supabaseAdmin
      .from("sales")
      .select("created_at, total, service, items_list, costumer_phone")
      .eq("menu_id", menu.id)
      .gte("created_at", from.toISOString())
      .lte("created_at", to.toISOString())
      .order("created_at", { ascending: false })
      .limit(INSIGHTS_MAX_ROWS),
    supabaseAdmin
      .from("sales")
      .select("total")
      .eq("menu_id", menu.id)
      .gte("created_at", prevFrom.toISOString())
      .lt("created_at", from.toISOString())
      .limit(INSIGHTS_MAX_ROWS),
    // coluna da fidelidade (tasks/fidelidade/fidelidade.sql): sem ela, segue sem a informação
    supabaseAdmin.from("menus").select("loyalty").eq("id", menu.id).maybeSingle(),
  ]);
  if (error) {
    console.error("[insights] erro ao ler vendas:", error);
    return fail("Não foi possível ler as vendas agora. Tente novamente.", 503);
  }
  if ((sales?.length ?? 0) < INSIGHTS_MIN_SALES) {
    return fail(`Poucas vendas nesse período para analisar (mínimo ${INSIGHTS_MIN_SALES}). Escolha um período maior.`, 422);
  }

  const data = {
    inicio: start,
    fim: end,
    moeda: menu.currency || "BRL",
    fidelidade: isLoyaltyOn(loyaltyRow?.loyalty),
    ...summarizeSales(sales, prevSales || [], menu),
  };
  const messages = [{ role: "user", content: `Dados do estabelecimento:\n${JSON.stringify(data)}` }];

  // Teto mensal das IAs do Enterprise: reserva o pior custo (1 token a cada 2 caracteres + saída máxima), acerta depois
  const promptTokens = Math.ceil(JSON.stringify([SYSTEM, SCHEMA, messages]).length / 2);
  const reserved = Math.ceil(promptTokens * 0.1 + MAX_TOKENS * 0.5);
  if (!(await reserveBudget(menu.id, reserved, false, profile.role))) {
    return fail("O limite mensal de IA do seu plano foi atingido. Ele renova no início do próximo mês.", 429);
  }

  let response;
  try {
    response = await anthropic.messages.create({
      model: INSIGHTS_MODEL,
      max_tokens: MAX_TOKENS,
      output_config: { effort: "medium", format: { type: "json_schema", schema: SCHEMA } },
      system: SYSTEM,
      messages,
    });
  } catch (err) {
    console.error("[insights] erro na API da Anthropic:", err);
    await settleBudget(menu.id, reserved, 0, false, false);
    return fail("A IA está indisponível agora. Tente novamente.", 503);
  }
  await settleBudget(menu.id, reserved, costMicroUsd(response.usage ?? {}), false, false);

  if (response.stop_reason === "refusal" || response.stop_reason === "max_tokens") {
    return fail("Não consegui gerar os insights agora. Tente novamente.", 502);
  }
  let out;
  try {
    out = JSON.parse(response.content.find((b) => b.type === "text")?.text ?? "");
  } catch {
    return fail("Não consegui gerar os insights agora. Tente novamente.", 502);
  }
  return Response.json({
    resumo: out.resumo,
    insights: out.insights.slice(0, 5),
    ...(process.env.NODE_ENV !== "production" && { debug: { usage: response.usage, model: INSIGHTS_MODEL } }),
  });
}
