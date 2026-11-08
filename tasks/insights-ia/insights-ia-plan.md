# Insights com IA no dashboard de vendas (Enterprise)

**Status (2026-11-08):** implementado e testado pelo dono com a IA (respostas boas). Cartões visuais: ícone por `tipo`,
número principal (`numero`) grande, faixa de cor pelo impacto, ação em caixa própria, maior impacto em largura total.
Modelo decidido: Haiku 5.5. Commitado na `dev`. Pendente só a conferência manual no navegador (ver todo).
Tarefas: `insights-ia-todo.md`.

No Dashboard de vendas completo (`SalesDashboard.jsx`), um botão **Insights com IA** analisa as vendas e os pedidos do
período do filtro e devolve de 3 a 5 sugestões práticas para vender mais (qual produto empurrar, combo, horário fraco,
foto faltando, fidelidade etc.). Só para `INSIGHTS_ROLES = ["admin", "enterprise"]` (mesmo padrão de
`ATTENDANT_ROLES` / `LANDING_ROLES`: o `"enterprise"` libera sozinho quando o plano existir).

## O que já existe e vai ser reaproveitado
- **Dados:** pedido finalizado vira linha em `sales` (com `items_list`) e é apagado de `orders`
  (`Orders.jsx` → `finalizeOrder`). Pedido excluído some sem rastro. Então "vendas e pedidos" = `sales` do período
  (totais, horários, serviço, pagamento) + `sales.items_list` (o que foi pedido, adicionais, o que sai junto).
  Pedidos abertos em `orders` não entram: ainda não aconteceram e não dizem nada sobre tendência.
- **Rota de IA do dono logado:** `src/app/api/assistant/landing/route.js` é o molde: `getUserFromRequest` →
  `profiles.role` → `supabaseAdmin` → Haiku 5.5 → `reserveBudget`/`settleBudget`.
- **Orçamento:** `src/lib/aiBudget.js`, teto mensal das IAs do Enterprise (`ENTERPRISE_AI_MONTHLY_BUDGET_MICRO_USD`,
  admin com o dobro). As funções `ai_attendant_reserve`/`settle` já estão no banco (`atendente-ia.sql`).
  **Não precisa de SQL novo.**
- **Auth no client:** `Bearer <access_token>` da sessão, igual `Landing.jsx`.

## Decisões
- **O servidor busca e resume os dados; o navegador manda só o período** (`start`, `end` em `AAAA-MM-DD`). Motivo:
  o dono não injeta texto no prompt, o tamanho do prompt fica limitado e o telefone/nome dos clientes nunca vai para a
  IA (só contagens).
- **Resumo em código puro** (`summarizeSales` em `src/lib/salesInsights.js`, sem imports de servidor) para ter
  self-check em `scripts/sales-insights-check.mjs` (padrão de `linktree-check.mjs`). O que entra:
  - período atual × anterior (mesma duração): faturamento, nº de vendas, ticket médio
  - por dia da semana e por faixa de hora (contagem + faturamento), no fuso `America/Sao_Paulo`
  - por serviço (delivery/retirada/local)
  - produtos: quantidade e faturamento (top 30), com taxa de adicional
  - pares que saem juntos no mesmo pedido (top 10) → ideia de combo
  - cruzamento com o cardápio: itens visíveis que **não venderam** no período (nome, categoria, preço, tem foto?,
    tem descrição?, é destaque?), destaques e quanto venderam, promoções ativas
  - clientes: % de vendas de quem comprou mais de uma vez (por `customer_id` ou telefone, só a contagem)
  - fidelidade ligada ou não (coluna já lida com o cardápio), para a IA não sugerir o que já existe. Combos e cupons
    ficam de fora (consultas a mais); entram se a IA começar a sugerir combo que já existe.
- **Recorrência só pelo telefone:** `sales.customer_id` só existe com o SQL da fidelidade; `menus.loyalty` é lido
  numa consulta à parte que pode falhar sem derrubar a rota.
- **Teto de linhas:** no máximo 5.000 vendas mais recentes do período (`ponytail:` no código). Acima disso o resumo
  avisa a IA que é amostra.
- **Saída estruturada:** `output_config.format` (JSON schema; ferramenta forçada não existe no Sonnet 5.5) →
  `{ resumo, insights: [{ tipo, numero, titulo, dado, acao, impacto: "alto"|"medio"|"baixo" }] }` (3 a 5). A tela desenha os
  cartões; nada de HTML vindo da IA.
- **Modelo: Haiku 5.5** (decidido em 2026-11-08: as respostas reais ficaram boas). Fica na constante
  `INSIGHTS_MODEL`; trocar para Sonnet exige o preço dele em `costMicroUsd` e um limite diário de cliques. ~4k tokens de entrada + ~1,5k de saída:
  | | Haiku 5.5 | Sonnet 5.5 |
  |---|---|---|
  | Por clique | ~US$ 0,001 | ~US$ 0,02–0,04 (com raciocínio) |
  | Cliques no teto mensal (US$ 13,33, dividido com atendente e landing) | ~11.000 | ~400–600 |
  | Resposta | poucos segundos | 10–30 s |
  O cálculo pesado fica no `summarizeSales`; a IA só interpreta. O Sonnet tende a cruzar mais sinais e ser menos
  genérico. Quem clica é o dono (dezenas de vezes/mês), então o custo do Sonnet é baixo; se for o escolhido, limitar
  alguns cliques por dia para não comer o saldo do atendente.
- **Sem persistência:** o resultado fica só no estado do componente. Gerar de novo = novo clique. Guardar histórico de insights fica para depois, se o dono pedir.
- **Rate limit:** `/api/assistant/insights` entra no bucket `ai` do `src/proxy.js` (15/min por IP).
- **Fora do plano:** o cartão não aparece (decidido com o dono).

## Arquivos
| Arquivo | O que faz |
|---|---|
| `src/lib/salesInsights.js` (novo) | `INSIGHTS_ROLES`, `summarizeSales(sales, prevSales, menu)` (puro) |
| `scripts/sales-insights-check.mjs` (novo) | self-check do resumo com vendas de exemplo |
| `src/app/api/assistant/insights/route.js` (novo) | `POST { start, end }`: auth, plano, busca, resumo, IA, orçamento |
| `src/app/dashboard/tabs/components/sales/SalesInsights.jsx` (novo) | cartão abaixo dos filtros: botão, carregando, erro e cartões |
| `src/app/dashboard/tabs/SalesDashboard.jsx` | monta o `SalesInsights` abaixo dos filtros, só para `INSIGHTS_ROLES` |
| `src/proxy.js` | `/api/assistant/insights` no bucket `ai` |

## Riscos
| Risco | Impacto | Mitigação |
|---|---|---|
| Insight genérico ("faça promoções") | Alto (o recurso perde valor) | Prompt exige citar o número que motivou cada sugestão (`dado`) e uma ação concreta no Bite Menu; testar com dados reais e trocar para Sonnet se precisar |
| Período longo com muitas vendas (5 anos) | Médio (rota lenta, prompt grande) | Teto de 5.000 linhas + resumo agregado (o prompt não cresce com o nº de vendas) |
| Fuso: servidor em UTC agrupa hora/dia errado | Médio | Agrupar com `toLocaleString(..., { timeZone: "America/Sao_Paulo" })`; self-check cobre venda às 23h30 de Brasília |
| Poucas vendas (ex.: 2 no período) | Baixo | Abaixo de 5 vendas a rota responde sem chamar a IA ("poucas vendas para analisar") |
| Abuso de cliques | Baixo | Teto mensal do Enterprise + bucket `ai` + botão travado enquanto carrega |

## Manual (fora do código)
Nada no banco. Para testar local: `ANTHROPIC_API_KEY` no `.env.local`, entrar com conta admin, Vendas → Dashboard
completo → Gerar insights. Fora de produção a resposta traz `debug.usage` (tokens) para conferir o custo.

## Limitações conhecidas
- "Atualizar" no topo do dashboard remonta a tela e limpa os insights (gerar de novo custa ~US$ 0,001).
