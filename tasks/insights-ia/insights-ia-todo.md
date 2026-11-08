# Tarefas: insights com IA no dashboard de vendas

**Status (2026-11-08):** tarefas 1–3 implementadas e commitadas na `dev`. Testado pelo dono com a IA (respostas boas);
modelo decidido: Haiku 5.5. Pendente só a conferência manual marcada abaixo (visual no celular/tema escuro, conta sem o
plano, período com < 5 vendas). O lint do projeto não roda (sem `eslint.config.*`, já era assim).

Plano: `tasks/insights-ia/insights-ia-plan.md`. O projeto não tem testes automatizados: a verificação é o self-check,
o `npm run build` e o teste manual (fake-supabase pela skill `run-bitemenu`, ou conta admin real).

## Fase 1: dados

### Tarefa 1: resumo das vendas para a IA
**Descrição:** criar `src/lib/salesInsights.js` com `INSIGHTS_ROLES` e `summarizeSales(sales, prevSales, menu)`, puro,
que devolve o objeto compacto descrito no plano (comparação com o período anterior, dia da semana, hora, serviço,
produtos, pares, itens que não venderam, recorrência; a fidelidade vem da rota). Self-check em
`scripts/sales-insights-check.mjs`.

**Critérios de aceite:**
- [x] Venda às 23h30 de Brasília (02h30 UTC do dia seguinte) cai na hora 23 e no dia da semana certo
- [x] Item visível do cardápio sem venda no período aparece em "não venderam"; item vendido não aparece
- [x] Pares contam uma vez por pedido; nome/telefone de cliente não aparece em nenhum campo da saída

**Verificação:**
- [x] `node scripts/sales-insights-check.mjs` imprime `ok`

**Dependências:** nenhuma
**Arquivos:** `src/lib/salesInsights.js`, `scripts/sales-insights-check.mjs`
**Tamanho:** S

### Tarefa 2: rota `/api/assistant/insights`
**Feito assim:** saída por `output_config.format` (JSON schema) em vez de ferramenta forçada: funciona no Haiku e no
Sonnet. Recorrência de clientes só pelo telefone (`sales.customer_id` depende do SQL da fidelidade); `menus.loyalty`
lido numa consulta à parte que pode falhar sem derrubar a rota. Menos de 5 vendas → 422 sem chamar a IA.

**Descrição:** `POST { start, end }` no molde da rota da landing: `getUserFromRequest`, `profiles.role` em
`INSIGHTS_ROLES`, cardápio do dono (com categorias/itens e `loyalty`), vendas do período e do
anterior (até 5.000), `summarizeSales`, `reserveBudget` → Haiku com saída em JSON schema →
`settleBudget`. Devolve `{ resumo, insights }`. Inclui o bucket `ai` no `src/proxy.js`.

**Critérios de aceite:**
- [ ] Sem token → 401 (testado no dev, inclusive token inválido); plano fora de `INSIGHTS_ROLES` → 403; datas inválidas ou intervalo > 5 anos → 400
- [ ] Menos de 5 vendas no período → resposta sem chamar a IA
- [x] Com vendas, devolve 3 a 5 insights, cada um com `dado` (número real do resumo) e `acao`; teto mensal atingido → 429

**Verificação:**
- [x] Com conta admin no `npm run dev` devolve insights (teste do dono); sem token, 401
- [x] `npm run build` passa

**Dependências:** Tarefa 1
**Arquivos:** `src/app/api/assistant/insights/route.js`, `src/proxy.js`
**Tamanho:** M

### Checkpoint: dados
- [x] Self-check ok, build ok
- [x] Ler 2 ou 3 respostas reais da rota: os insights são específicos? (dono: "as respostas estão boas")
- [x] Revisão com o dono antes da tela

## Fase 2: tela

### Tarefa 3: botão e painel no dashboard de vendas
**Feito assim:** um cartão só ("Insights com IA", botão + resultado) logo abaixo dos filtros, em vez de botão no
cabeçalho + painel separado. `key` = período: trocar o filtro limpa o resultado. Oculto fora de `INSIGHTS_ROLES`.
Visual (pedido do dono): ícone por `tipo` (combo, destaque, foto, horário, promoção, fidelidade, preço, outro), `numero`
grande, faixa colorida pelo impacto, "O que fazer" em caixa, resumo num banner e esqueleto animado enquanto carrega.

**Descrição:** `SalesInsights.jsx`: botão "Insights com IA" (ícone `FaMagic`, visual dos botões do cabeçalho) que
chama a rota com o período aplicado no filtro e mostra o painel acima dos KPIs: carregando, erro (texto da rota),
resumo + cartões (título, dado, ação, selo de impacto) e "Gerar de novo". Montado no `SalesDashboard.jsx` só quando
`INSIGHTS_ROLES.includes(ownerRole)`.

**Critérios de aceite:**
- [ ] Admin vê o botão (ok, teste do dono); Business/Pro não vê (conferir)
- [ ] Trocar o período e clicar gera para o novo período; botão travado enquanto carrega
- [ ] Legível no celular (375px) e no tema escuro

**Verificação:**
- [x] `npm run build` passa (lint indisponível no projeto)
- [x] Manual: dashboard → Vendas → Dashboard completo → Insights com IA (teste do dono)

**Dependências:** Tarefa 2
**Arquivos:** `src/app/dashboard/tabs/components/sales/SalesInsights.jsx`, `src/app/dashboard/tabs/SalesDashboard.jsx`
**Tamanho:** S

### Checkpoint: completo
- [ ] Critérios de aceite das 3 tarefas
- [x] `graphify update .`
- [x] Status deste arquivo e do plano atualizados; linha no `tasks/README.md`
