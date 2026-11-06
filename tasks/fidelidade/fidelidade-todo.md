# Tarefas: programa de fidelidade

Plano e decisões em `tasks/fidelidade/fidelidade-plan.md`. Verificação padrão de toda tarefa: `npm run lint` e
`npm run build` sem erro novo; teste no app com a skill `run-bitemenu` (fake-supabase) em 390px e desktop, claro e escuro.

Regra do ciclo (usada em todas as telas): `k = vendas % (goal + 1)`. `k < goal` = juntando (k de goal);
`k === goal` = prêmio liberado, a próxima compra usa o prêmio.

## Tarefa 1: SQL manual
**Descrição:** escrever `tasks/fidelidade/fidelidade.sql` para rodar à mão no SQL Editor (regra do `CLAUDE.md`).

**Critérios de aceite:**
- [x] `menus.loyalty jsonb` (nulo = desligado)
- [x] `sales.customer_id uuid references auth.users on delete set null` + índice parcial
  `(customer_id, menu_id) where customer_id is not null`
- [x] Policy `sales_select_own_customer` (`for select to authenticated using (customer_id = auth.uid())`), sem mexer
  nas policies do dono/equipe; bloco de conferência comentado no fim, igual a `orders-customer.sql`

**Verificação:**
- [ ] Revisão humana do SQL (mexe em RLS de `sales`)
- [ ] Depois de rodar: cliente A não lê venda do cliente B; dono continua lendo e inserindo vendas

**Dependências:** nenhuma
**Arquivos:** `tasks/fidelidade/fidelidade.sql`
**Tamanho:** XS

## Tarefa 2: Regra do ciclo e linha tracejada
**Descrição:** `src/lib/loyalty.js` com `loyaltyState(count, goal)` → `{ done, ready, used }` e `isLoyaltyOn(loyalty)`
(ligado, recompensa preenchida, goal 2–20). `src/components/LoyaltyProgress.jsx` com os traços e o texto indicativo,
tema do Bite Menu por padrão e `colors` opcional para o cardápio. `scripts/loyalty-check.mjs` com `assert` dos casos.

**Critérios de aceite:**
- [x] goal 5: 0→0/5, 3→3/5, 5→liberado, 6→0/5 e 1 usado, 11→liberado, 12→0/5 e 2 usados
- [x] Textos: "3 de 5 compras · faltam 2 para ganhar X" e "Prêmio liberado! Na sua próxima compra você ganha X"
- [x] `role="progressbar"` com `aria-valuenow`/`aria-valuemax`

**Verificação:** `node scripts/loyalty-check.mjs` passa; lint
**Dependências:** nenhuma
**Arquivos:** `src/lib/loyalty.js`, `src/components/LoyaltyProgress.jsx`, `scripts/loyalty-check.mjs` (novos)
**Tamanho:** S

## Tarefa 3: Dono configura a fidelidade
**Descrição:** botão "Fidelidade" (`FaGift`) na barra Ferramentas de `MenuItems.jsx`, com cadeado quando
`!hasPlusPermissions`. `LoyaltyModal.jsx`: switch "Programa ativo", "Recompensa" (até 80), "Compras necessárias"
(2 a 20) e prévia com o `LoyaltyProgress`. Grava `menus.loyalty` direto. Sem Plus: abre, mas o salvar mostra
`UpdatePlanModal plan="plus"` (igual a Cupons). Textos: "Depois de N compras, a próxima sai com o prêmio", "A compra
conta quando você finaliza o pedido" e, ao mudar o número com o programa ativo, aviso de que o progresso dos clientes
é recalculado.

**Critérios de aceite:**
- [x] Salvar grava `{ enabled, reward, goal }` e reabrir o modal mostra os valores salvos
- [x] Recompensa vazia ou número fora de 2–20 não salva (mensagem no campo)
- [x] Free vê o cadeado e o convite do Plus; Plus, Pro, Business, admin e designer salvam

**Verificação:** manual no painel com plano free e plus (fake-supabase) + lint/build
**Dependências:** Tarefas 1 e 2
**Arquivos:** `src/app/dashboard/tabs/components/menu/LoyaltyModal.jsx` (novo), `src/app/dashboard/tabs/components/menu/MenuItems.jsx`
**Tamanho:** S

## Tarefa 4: Finalizar pedido leva o cliente para a venda
**Descrição:** em `finalizeOrder` (`Orders.jsx:504`), incluir `customer_id: order.customer_id ?? null` no insert de
`sales`. Se der erro de coluna, tentar de novo sem o campo (mesmo padrão de `CartDrawer.jsx:49`).

**Critérios de aceite:**
- [x] Pedido de cliente logado finalizado → venda com `customer_id`
- [x] Pedido de visitante/balcão → venda com `customer_id` nulo
- [x] Sem a coluna no banco, a venda continua sendo registrada

**Verificação:** finalizar um pedido de cada tipo e conferir `sales` no banco
**Dependências:** Tarefa 1
**Arquivos:** `src/app/dashboard/tabs/Orders.jsx`
**Tamanho:** XS

## Checkpoint 1
- [ ] SQL rodado e revisado
- [ ] Dono Plus liga a fidelidade e finaliza um pedido de cliente logado: a venda tem `customer_id`
- [ ] Revisão humana antes de seguir

## Tarefa 5: Aba "Fidelidades" em `/conta`
**Descrição:** item `{ tab: "fidelidades", label: "Fidelidades", Icon: FaGift }` em `TABS` e componente
`LoyaltyCards.jsx`: lê `sales.menu_id` do cliente, conta por cardápio, busca `menus` (`id, slug, title, logo_url,
banner_url, banner_mobile_url, loyalty`) e mostra os com `isLoyaltyOn`. Card conforme o plano (banner, logo
sobreposto, nome, `LoyaltyProgress`, "Prêmios usados: X", "Ver cardápio"); prêmio liberado primeiro. Atalho
"Fidelidades" no `CustomerMenu`.

**Critérios de aceite:**
- [x] Mostra todos os programas ativos com pelo menos 1 venda do cliente, cada um com linha e texto
- [x] Programa desligado ou sem venda não aparece; estado vazio com texto e link para `/descobrir`
- [x] Sem banner/logo o card não quebra; sem a policy/coluna mostra o vazio e loga um `console.warn`

**Verificação:** fake-supabase com vendas de exemplo (goal 5 com 3, 5 e 6 vendas; um programa desligado), 390px e
desktop, claro e escuro
**Dependências:** Tarefas 1, 2 e 4
**Arquivos:** `src/app/conta/page.jsx`, `src/app/conta/components/LoyaltyCards.jsx` (novo), `src/components/CustomerMenu.jsx`
**Tamanho:** M

## Tarefa 6: Progresso no cardápio, acima das categorias
**Descrição:** `loyalty` entra no select de `getMenuData.js`; o `page.jsx` zera `menu.loyalty` quando o `ownerRole` não é
Plus+. Componente `LoyaltyBanner.jsx` em `menu/[slug]/components/`: só para cliente logado (`useUser`,
`account_type = 'customer'`), conta as vendas dele no cardápio e mostra a faixa com o `LoyaltyProgress` nas cores do
dono. Uma linha em cada layout, logo antes do `div sticky` das categorias.

**Critérios de aceite:**
- [x] Cliente logado vê "N de goal" (0 inclusive) ou "Prêmio liberado" nos 3 layouts, com as cores do cardápio
- [x] Visitante vê a faixa sem linha, com "Entre para participar" (volta para o cardápio depois do login)
- [x] Dono, equipe, programa desligado ou dono abaixo do Plus: nada aparece e nada é consultado
- [x] A faixa não fica fixa e não cobre a barra de categorias; o layout não pula ao carregar (renderiza só com o
  número pronto)

**Verificação:** fake-supabase nos 3 layouts, fundo claro e escuro do dono, 390px e desktop
**Dependências:** Tarefas 1, 2 e 4
**Arquivos:** `src/app/menu/[slug]/getMenuData.js`, `src/app/menu/[slug]/page.jsx`,
`src/app/menu/[slug]/components/LoyaltyBanner.jsx` (novo), `ClientMenu.jsx`, `ClientMenu2.jsx`, `ClientMenu3.jsx`
(1 linha cada)
**Tamanho:** M

## Tarefa 7: Dono vê a compra que usa o prêmio
**Descrição:** em `Orders.jsx`, com o programa ativo, contar as vendas dos clientes dos pedidos da página (`sales` com
`menu_id` e `customer_id in (...)`, 1 consulta por página) e usar `loyaltyState`. `ready` → pílula
"🎁 Fidelidade: esta compra usa o prêmio <recompensa>" (`bg-st-done/12 text-st-done`). Nos outros pedidos de cliente
logado, texto pequeno "Fidelidade: 3 de 5".

**Critérios de aceite:**
- [x] Aviso só no pedido da compra N+1; some ao desligar o programa
- [x] Nenhuma consulta extra com o programa desligado
- [x] Visitante não mostra nada

**Verificação:** fake-supabase com cliente de prêmio liberado; lint/build
**Dependências:** Tarefas 2, 3 e 4
**Arquivos:** `src/app/dashboard/tabs/Orders.jsx`
**Tamanho:** S

## Checkpoint 2: pronto para revisão
- [ ] Ponta a ponta: dono Plus liga (goal 3) → cliente logado faz 3 pedidos e o dono finaliza → cardápio e `/conta`
  mostram 1, 2, 3 e "Prêmio liberado" → 4º pedido tem o aviso do prêmio → depois de finalizado volta para 0 de 3 com
  "Prêmios usados: 1"
- [x] `graphify update .` rodado
- [x] Resumo "o que foi feito" no plano e SQL pendente listado

## Tarefa 8: Recompensa como item do cardápio ou desconto
**Descrição:** no `LoyaltyModal`, escolher Item do cardápio (`SearchSelect`, no tema do site) ou Desconto (porcentagem
ou valor fixo, caixinha de valor mínimo com o símbolo da moeda do cardápio). O carrinho aplica o desconto sozinho na
compra do prêmio (`loyaltyDiscount`), menos quando o cliente já tem pedido em aberto no cardápio.

**Critérios de aceite:**
- [x] Item: sem seleção não salva; o dropdown segue o tema (claro/escuro)
- [x] Desconto: % de 1 a 100 ou valor > 0; com a caixinha marcada, mínimo > 0 obrigatório
- [x] Item: na compra do prêmio, 1 unidade do item no carrinho sai grátis ("Fidelidade: 1 X grátis"); sem o item, lembrete
- [x] Desconto: "Prêmio da fidelidade -R$ X" e o total já descontado; abaixo do mínimo não desconta
- [x] Valor mínimo: texto + barra contínua acima do campo de cupom, enchendo até o mínimo
- [x] Com pedido em aberto no cardápio, o desconto não se repete

**Verificação:** `node scripts/loyalty-check.mjs` (feito); no app (pendente): modal claro/escuro, carrinho com
`FAKE_LOYALTY=5 FAKE_LOYALTY_TYPE=discount FAKE_SALES=5 FAKE_ACCOUNT=customer FAKE_ORDERS=site_whatsapp`
**Dependências:** Tarefas 3, 5 e 6
**Arquivos:** `LoyaltyModal.jsx`, `MenuItems.jsx`, `CartDrawer.jsx`, `src/hooks/useLoyaltyCount.js` (novo),
`LoyaltyBanner.jsx`, `LoyaltyCards.jsx`, `src/lib/loyalty.js`
**Tamanho:** M
