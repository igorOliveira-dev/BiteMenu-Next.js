# Plano: programa de fidelidade

## Visão geral
O dono (plano Pro para cima) liga um programa de fidelidade no cardápio e escolhe a recompensa (texto livre, ex.:
"1 pizza broto grátis") e quantas compras são necessárias. Depois de N compras, a **compra seguinte (N+1)** usa o
prêmio. O cliente logado vê o progresso em dois lugares, sempre com a linha tracejada (1 traço = 1 compra) e um texto
indicativo:
- **no cardápio**, numa faixa logo acima da barra de categorias, com as cores do cardápio;
- **em `/conta` > Fidelidades**, com todos os programas de que participa (banner, logo, nome, recompensa, progresso).

O dono vê no card do pedido quando aquela compra é a que usa o prêmio.

Tarefas em `tasks/fidelidade/fidelidade-todo.md`.

**Fora do escopo:** mais de um programa por cardápio, validade das compras, desconto aplicado sozinho no carrinho,
compra de visitante contando, cardápio "só WhatsApp", notificação ao liberar o prêmio.

## Como está hoje (lido no código)
- **Pedido de cliente logado já tem dono:** o carrinho grava `orders.customer_id` (`CartDrawer.jsx:49`, SQL em
  `tasks/descobrir/orders-customer.sql`). Visitante e balcão gravam vazio.
- **"Finalizar pedido" apaga o pedido e cria uma venda** (`Orders.jsx:504`): copia nome, telefone, itens e total para
  `sales` e faz `delete` em `orders`. O `customer_id` **não** é copiado e se perde. É o único lugar que grava em `sales`.
- **`sales` é a melhor contagem de compra:** pedido excluído (não finalizado) não vira venda, então ninguém ganha
  compra mandando pedido falso. Não há policies de `sales` documentadas em `tasks/seguranca/`: conferir no Supabase.
- **Cardápio público:** `getMenuData.js` lista as colunas de `menus` uma a uma (a nova precisa entrar ali). O
  `page.jsx` já tem o `ownerRole` no servidor e escolhe entre 3 layouts (`ClientMenu`, `ClientMenu2`, `ClientMenu3`).
  Em todos, a barra de categorias é um `div sticky` (`ClientMenu.jsx:671`, `ClientMenu2.jsx:624`, `ClientMenu3.jsx:634`)
  e as cores do dono saem de `foregroundToUse`, `grayToUse`, `translucidToUse` e `menu.details_color` com
  `getContrastTextColor`.
- **Cardápios são legíveis pelo cliente** (`OrdersHistory.jsx` já lê `menus` por id).
- **`/conta`** (`src/app/conta/page.jsx`): lista `TABS` com `?aba=`, conteúdo em `components/`. `CustomerMenu.jsx`
  tem os atalhos da navbar.
- **Ferramentas do dono:** a barra "Ferramentas" em `MenuItems.jsx:2943` (Ordenar, Combos, Cupons, Estoque) abre
  modais que gravam direto no banco, com cadeado por plano (`CouponsModal` + `UpdatePlanModal`). Combos usa
  `hasPlusPermissions` (Plus+); Cupons é Pro+, o corte usado pela fidelidade.

## Decisões
- **Configuração: 1 coluna `menus.loyalty jsonb`**, padrão `null` = desligado:
  `{ enabled, goal, type: "item" | "discount", reward, item_id?, discount_type?, discount_value?, min_order? }`.
  Uma coluna só porque os campos andam juntos, igual a `delivery_radius`. `goal`: inteiro de 2 a 20 (acima disso os
  traços ficam finos demais no celular).
- **Tipos de recompensa** (`type`), escolhidos no modal (texto livre e cupom foram tirados a pedido):
  - **Item do cardápio** (`item_id`): escolhido no `SearchSelect` (dropdown com busca, cores do tema, itens agrupados
    por categoria com espaço entre elas). **Na compra do prêmio, 1 unidade do item sai de graça** quando o cliente o
    coloca no carrinho: o desconto é o preço de 1 unidade (a linha mais barata, se houver variações; adicionais
    continuam pagos), na linha "Fidelidade: 1 X-Burguer grátis". Sem o item no carrinho, aparece o lembrete
    "Adicione o item ao carrinho e ele sai de graça".
  - **Desconto** em porcentagem (1 a 100) ou valor fixo (`discount_type`, `discount_value`), com caixinha "Exigir valor
    mínimo de compra" que mostra o campo do mínimo (`min_order`) com o símbolo da moeda do cardápio.
    **O carrinho aplica sozinho** na compra do prêmio (`loyaltyDiscount` em `src/lib/loyalty.js`), sobre o subtotal já
    com combo e cupom, numa linha "Prêmio da fidelidade". Soma em `discountAmount`, o mesmo caminho do cupom: total,
    pedido, WhatsApp e Pix online seguem iguais (a rota do Pix já recebe o total do navegador; nada do ValidaPay mudou).
    Com valor mínimo, uma barra contínua fica logo acima do campo de cupom: "Faltam R$ X para usar seu prêmio da
    fidelidade: 10% de desconto", enchendo conforme o subtotal (já com combo e cupom) chega no mínimo; ao chegar,
    "Prêmio da fidelidade liberado". Cores do cardápio (`details_color` sobre `translucidToUse`).
  - **Um prêmio por ciclo:** o prêmio só "gasta" quando o dono finaliza o pedido. Se o cliente com prêmio liberado já tem
    um pedido em aberto naquele cardápio (`orders` com o `customer_id` dele, policy de `orders-customer.sql`), o
    carrinho não dá o desconto de novo e avisa "Seu prêmio ficou no pedido em aberto". Reconfere quando o carrinho
    esvazia. Como o cupom, é validado só no navegador (comentário `ponytail:`).
  - `reward` é o texto que todas as telas mostram, gerado ao salvar ("1 X-Salada grátis", "10% de desconto em compras a
    partir de R$ 30,00"). Renomear o item depois não atualiza o texto: é só salvar de novo (comentário `ponytail:`).
- **Plano: Pro para cima** (`LOYALTY_ROLES` em `src/lib/loyalty.js`: pro, business, admin, designer; mesmo corte de
  Cupons). Era Plus+ e passou para Pro+ a pedido. Botão "Fidelidade" na barra Ferramentas com cadeado e
  `UpdatePlanModal plan="pro"` para quem não tem. O card do pedido só mostra a fidelidade para Pro+.
- **Dono que cai abaixo do Pro: fidelidade bloqueada para ele e para o cliente**, sem mexer no banco (a configuração
  e o progresso ficam guardados e voltam a valer se ele voltar ao Pro):
  - Dono: botão com cadeado; o modal abre com o aviso "Seu plano não inclui a fidelidade: ela fica bloqueada para
    você e para seus clientes…" e o salvar abre o convite do Pro.
  - Cardápio: o `page.jsx` marca `loyalty.locked` (em vez de apagar). O carrinho não dá prêmio com `locked`. A faixa
    some para visitante e para cliente sem compra; o cliente que já participa vê a faixa com cadeado, a linha apagada
    e "Este estabelecimento não tem acesso à fidelidade no momento. Seu progresso fica guardado e volta a valer quando
    o programa for liberado."
  - `/conta` > Fidelidades: card com selo "Bloqueada" sobre o banner (vidro escuro), banner em cinza, linha apagada e a
    mesma mensagem; bloqueados vão para o fim da lista. O plano do dono vem de `GET /api/fidelidade?menus=<ids>`
    (`src/app/api/fidelidade/route.js`): o servidor lê `menus`/`profiles` com service role e devolve só
    `{ allowed: { <menu_id>: true|false } }`, nunca o plano (profiles não é legível pelo cliente e `menu_owner_role`
    só responde ao dono/equipe). Até 50 ids, só UUID; rate limit de `/api/` no `proxy.js`. Se a rota falhar, o card
    aparece sem cadeado (o carrinho continua sem prêmio, porque quem decide é o `page.jsx`).
- **Compra = venda finalizada com `sales.customer_id`.** `finalizeOrder` passa a copiar `order.customer_id`. Se o banco
  recusar (coluna ainda não criada), grava de novo sem ele, igual ao carrinho: a venda nunca se perde.
- **Prêmio na compra N+1, sem tabela de resgate.** Cada ciclo tem `goal + 1` vendas: `goal` que juntam e 1 que usa o
  prêmio. Tudo sai de uma conta, em `src/lib/loyalty.js`:
  - `k = vendas % (goal + 1)` enquanto a meta não muda (com meta mudada, `loyaltyState` percorre as vendas por data, ver riscos)
  - `k < goal`: juntando, `k` de `goal` traços cheios. Texto: "3 de 5 compras · faltam 2 para ganhar <recompensa>".
  - `k === goal`: prêmio liberado, linha cheia e verde. Texto: "Prêmio liberado! Na sua próxima compra você ganha
    <recompensa>".
  - Depois da compra do prêmio, `k` volta a 0 e começa outro ciclo. "Prêmios usados: X" = `floor(vendas / (goal + 1))`.
  - Dono: no card de um pedido aberto, se as vendas finalizadas daquele cliente derem `k === goal`, aparece
    "🎁 Fidelidade: esta compra usa o prêmio <recompensa>". Ao finalizar, a venda conta como a compra do prêmio.
  - Pedido do prêmio excluído (não finalizado) não gasta o prêmio: ele continua liberado.
- **Cliente lê só as próprias vendas:** policy `sales_select_own_customer` (`customer_id = auth.uid()`), a mesma regra
  de `orders`. Sem RPC: um cliente tem poucas vendas.
- **Linha tracejada: um componente só, `src/components/LoyaltyProgress.jsx`.** Recebe `count`, `goal`, `reward` e
  `colors` opcional (mesmo padrão do `SignUpCta`). `flex gap-1` com `goal` traços `h-2 flex-1 rounded-full` + o texto
  indicativo embaixo. `role="progressbar"` com `aria-valuenow/max`.
  - Sem `colors` (identidade do Bite Menu): feito `bg-info` (azul = "andamento", a cor da barra de uso da IA), falta
    `bg-[var(--translucid)]`, liberado `bg-st-done` (verde = concluído).
  - Com `colors` (cardápio): feito `menu.details_color`, falta `translucidToUse`, texto `foregroundToUse`/`grayToUse`.
    Liberado usa a mesma cor de destaque, com o texto do prêmio em negrito (verde fixo pode sumir no fundo do dono).
- **Cardápio: `LoyaltyBanner` acima da barra de categorias**, nos 3 layouts (1 linha em cada). Só para cliente logado
  (`account_type = 'customer'`), com 0 compras inclusive ("0 de 5"). Faixa `rounded-2xl` com fundo `translucidToUse`,
  ícone de presente, "Programa de fidelidade" e o `LoyaltyProgress` com as cores do dono. Busca as vendas do cliente
  naquele cardápio no navegador (`sales` com `menu_id` e `customer_id`, `count: "exact", head: true`).
  **Visitante** vê a mesma faixa sem a linha: "A cada N compras, a próxima sai com <recompensa>" e "Entre para
  participar" (`/login?tipo=cliente&next=/menu/<slug>`, mesmo link do `MenuAccountButton`). Dono e equipe não veem nada.
- **Aba "Fidelidades" em `/conta`** (`?aba=fidelidades`) + atalho no `CustomerMenu`. Lista os programas de que o cliente
  participa: cardápio com programa ativo **e** pelo menos 1 venda dele. Card na identidade do Bite Menu:
  `rounded-2xl border border-brand-line bg-brand-surface`, banner em cima (`banner_mobile_url` → `banner_url` → faixa
  `bg-[var(--translucid)]`), logo redondo sobreposto ao banner, nome (`h3 text-base`), `LoyaltyProgress` sem `colors`,
  "Prêmios usados: X" e "Ver cardápio" (contorno, nova guia). Programas com prêmio liberado vêm primeiro.

## Lista de tarefas
- [x] Tarefa 1: SQL manual (escrito; rodar à mão: `tasks/fidelidade/fidelidade.sql`)
- [x] Tarefa 2: Regra do ciclo (`lib/loyalty.js` + self-check) e linha tracejada (`LoyaltyProgress`)
- [x] Tarefa 3: Dono configura a fidelidade (Ferramentas + `LoyaltyModal`, Pro+)
- [x] Tarefa 4: Finalizar pedido leva o `customer_id` para a venda
- [ ] Checkpoint 1: venda finalizada de cliente logado tem `customer_id` no banco
- [x] Tarefa 5: Aba "Fidelidades" em `/conta`
- [x] Tarefa 6: Progresso no cardápio, acima das categorias (3 layouts)
- [x] Tarefa 7: Card do pedido avisa o dono da compra que usa o prêmio
- [ ] Checkpoint 2: fluxo de ponta a ponta e pronto para revisão
- [x] Tarefa 8: Recompensa como item do cardápio ou desconto (porcentagem/valor fixo, mínimo opcional) aplicado no carrinho
- [x] Tarefa 9: Fidelidade bloqueada (cadeado + aviso) quando o dono cai abaixo do Pro

### SQL pendente (rodar no Supabase ANTES do deploy)
- [ ] `tasks/fidelidade/fidelidade.sql`: `menus.loyalty`, `sales.customer_id` + índice, policy `sales_select_own_customer`
  (**mexe em RLS de sales: revisar**). Sem `menus.loyalty`, a consulta do cardápio público falha.

## O que foi feito
| Arquivo | Mudança |
|---|---|
| `src/lib/loyalty.js` (novo) | Regra do ciclo (`loyaltyState`), `isLoyaltyOn`, limites e `LOYALTY_ROLES` (Pro+). Self-check: `node scripts/loyalty-check.mjs` |
| `src/components/LoyaltyProgress.jsx` (novo) | Linha tracejada + texto indicativo; identidade do Bite Menu ou `colors` do cardápio |
| `src/app/dashboard/tabs/components/menu/LoyaltyModal.jsx` (novo) | Modal do dono: ativo, recompensa, compras (2–20), prévia, aviso ao mudar o número, convite do Pro |
| `src/app/dashboard/tabs/components/menu/MenuItems.jsx` | Botão "Fidelidade" na barra Ferramentas (cadeado abaixo do Pro) |
| `src/app/dashboard/tabs/Orders.jsx` | `finalizeOrder` copia `customer_id` para `sales` (tenta de novo sem ele se a coluna faltar); card do pedido mostra "esta compra usa o prêmio" ou "Fidelidade: 3 de 5" |
| `src/app/conta/page.jsx`, `src/app/conta/components/LoyaltyCards.jsx` (novo) | Aba Fidelidades: banner, logo, linha, texto, "Prêmios usados", "Ver cardápio"; prêmio liberado primeiro |
| `src/components/CustomerMenu.jsx` | Atalho "Fidelidades" |
| `src/app/menu/[slug]/getMenuData.js`, `page.jsx` | Lê `loyalty`; marca `locked` quando o dono está abaixo do Pro |
| `src/app/api/fidelidade/route.js` (novo) | Diz, por cardápio, se a fidelidade está liberada (dono Pro+), sem expor o plano |
| `src/app/menu/[slug]/components/LoyaltyBanner.jsx` (novo), `ClientMenu*.jsx` | Faixa acima das categorias nas cores do dono: progresso para cliente, "Entre para participar" para visitante |
| `LoyaltyModal.jsx`, `MenuItems.jsx` (tarefa 8) | Recompensa: Item do cardápio (`SearchSelect`, itens agrupados por categoria) ou Desconto (porcentagem/valor fixo, mínimo opcional na moeda do cardápio) |
| `src/hooks/useLoyaltyCount.js` (novo) | Vendas do cliente no cardápio; usado pela faixa e pelo carrinho |
| `src/app/menu/[slug]/components/CartDrawer.jsx` | Desconto da fidelidade na compra do prêmio (linha própria no resumo), bloqueado com pedido em aberto |

Testado com fake-supabase: visitante e cliente (0, 3, prêmio liberado, 12 vendas com meta 8) nos 3 layouts, fundo claro
e escuro do dono, 390px; `/conta` > Fidelidades (390px, tema claro); modal do dono (validação, confirmação ao trocar o
número, gravação) e aviso no card do pedido (desktop); dono abaixo do plano exigido não mostra a faixa. Build ok.
Não testado: dados reais (SQL não rodado), `/conta` no tema escuro e no desktop, staff (caixa) lendo `sales`.
Tarefa 8 (item/desconto), testado com fake-supabase em 390px: modal com dropdown agrupado por categoria (claro e
escuro), desconto em valor fixo com mínimo (erro sem o mínimo, símbolo da moeda, gravação certa); carrinho com prêmio
liberado: barra do mínimo ("Faltam R$ 5,00…") e desconto ao passar dele (R$ 50 → R$ 45); item grátis (só 1 unidade:
R$ 78 → R$ 53) e lembrete sem o item; pedido em aberto bloqueia o prêmio. Build ok, self-check ok.

Mudança para Pro+ testada com fake-supabase: dono Plus não mostra a faixa no cardápio e, no modal, o salvar abre
"Disponível a partir do plano Pro"; dono Pro mostra a faixa.

Bloqueio abaixo do Pro testado com fake-supabase (dono Plus, cliente com prêmio liberado, 390px): `/api/fidelidade`
devolve `false` e ignora id inválido; visitante não vê a faixa; cliente vê a faixa com cadeado e a mensagem; carrinho
sem prêmio (X-Burguer cobrado R$ 25); `/conta` com o card "Bloqueada" e a mensagem; modal do dono com o aviso. Com dono
Pro, `/conta` sem cadeado e com "3 de 5".

### Também nesta entrega: quantidade no carrinho
O botão "Remover" de cada produto do carrinho (`CartDrawer.jsx`) virou `− [qtd] +` (`QtyStepper`, no mesmo arquivo),
nas cores do cardápio, igual ao − e + do modal do item. Usa o `updateQty` que o `CartContext` já tinha.
- "−" em 1 tira o produto (rótulo "Remover <produto>" para leitor de tela).
- O campo aceita digitar até 99; vazio ou 0 ao sair do campo volta para a quantidade anterior (tirar é só pelo "−").
- Total, desconto e barra da fidelidade se atualizam na hora. Vale para os 3 layouts (o carrinho é um só).
Testado com fake-supabase em 390px: +, digitar 5, 0 + sair do campo (voltou para 5), "−" até remover.

## Riscos
| Risco | Impacto | Como evitar |
|---|---|---|
| Código publicado antes do SQL | Alto | Venda grava de novo sem `customer_id` (não perde venda); `getMenuData` sem a coluna quebraria o cardápio: **rodar o SQL antes do deploy** |
| Policy de `sales` mal escrita expõe vendas de outros clientes | Alto | Só `select` com `customer_id = auth.uid()`; conferir com 2 contas antes de publicar (mexe em RLS: revisar) |
| Dono esquece de dar o prêmio na compra N+1 | Médio | Aviso no card do pedido; o cliente também vê "Prêmio liberado" e pede |
| Dono não usa "Finalizar" (só exclui ou deixa parado) | Médio | Texto no modal: "A compra conta quando você finaliza o pedido" |
| Dono muda o `goal` com clientes no meio | Médio | Resolvido sem SQL: `loyalty.history` guarda as metas antigas (`{ goal, until }`) e cada venda conta com a meta da data do pedido (`sales.created_at`). Ninguém perde compras; quem passa da nova meta fica com o prêmio liberado; liberado continua liberado. Self-check em `scripts/loyalty-check.mjs` |
| Dois pedidos abertos do mesmo cliente: os dois mostram "usa o prêmio" | Baixo | Aceito; o dono vê os dois juntos. Comentário `ponytail:` |
| Dono que cai abaixo do Pro | Médio | Bloqueada para ele e para o cliente (cadeado + aviso no cardápio e em `/conta`, sem prêmio no carrinho); `/api/fidelidade` diz quais cardápios estão liberados |
| Desconto da fidelidade aplicado por quem mexe no navegador | Médio | Mesmo limite do cupom (total calculado no navegador). O dono confere: o card do pedido só mostra "usa o prêmio" para quem liberou de verdade |
| Vendas antigas não têm `customer_id` | Baixo | O programa conta a partir do deploy; dito no modal |

## Perguntas em aberto
1. ~~Visitante no cardápio?~~ **Decidido:** vê a faixa sem progresso, com "Entre para participar".
