# Tarefas: convite para criar conta no checkout

Plano e registro das mudanças em `tasks/cta-conta/cta-conta-plan.md`.

## Tarefa 1: Componente `SignUpCta` (feito)

**Descrição:** Cartão com título, texto, "Criar conta", "Já tenho conta" e "×". Props: `next`, `colors` opcional
(`{ text, muted, surface, accent }`), `onBeforeLeave`, `title` e `text` opcionais. Com `colors`, estilo inline do dono;
sem, classes da identidade do Bite Menu. Links no formato de `MenuAccountButton.jsx` (`?tipo=cliente&next=`).

**Critérios de aceite:**
- [x] Os links levam a `/register?tipo=cliente&next=<next>` e `/login?tipo=cliente&next=<next>`
- [x] Botão com `accent` usa `getContrastTextColor(accent)` no texto
- [ ] Sem `colors`, fica certo no tema escuro do Bite Menu (só o claro foi visto)

**Verificação:**
- [x] `npm run build` passa (`npm run lint` não roda no Next 16)

**Arquivos:** `src/components/SignUpCta.jsx`

## Tarefa 2: Convite no checkout e volta para a compra (feito)

**Descrição:** No `CartDrawer`, `SignUpCta` no topo da etapa `costumerInfos` para visitante, com as cores do dono,
`next=/menu/<slug>?finalizar=<serviço>` e `onBeforeLeave={saveCustomerInfo}`. Na volta com `?finalizar=`, reabre o
carrinho e a compra na mesma etapa e tira o parâmetro da URL.

**Critérios de aceite:**
- [x] Visitante vê o convite ao chegar em "Confirmar compra" (dono, equipe e balcão estão logados, então não veem)
- [x] Abrir `/menu/<slug>?finalizar=delivery` com itens no carrinho reabre "Confirmar compra (entrega)" e limpa a URL
- [ ] Cadastro real pelo convite volta para a compra com os dados preenchidos (não testado: o fake não cria conta)

**Verificação:**
- [x] `npm run build` passa
- [x] Manual (fake-supabase, 390px, layout padrão): convite, links e volta pelo `?finalizar=`
- [ ] Manual: os layouts lista e grade, cardápio escuro e desktop

**Arquivos:** `src/app/menu/[slug]/components/CartDrawer.jsx`

## Tarefa 3: Convite no pedido enviado e em `/descobrir` (feito)

**Descrição:** "Guarde este pedido" nas etapas `whatsapp` (abaixo de "Enviar confirmação"), `tableSuccess` e Pix pago.
Em `/descobrir`, o mesmo componente sem `colors`, abaixo do título, só para visitante.

**Critérios de aceite:**
- [x] Aparece só para visitante e fica abaixo do botão de confirmação no WhatsApp
- [x] `/descobrir` mostra o convite na identidade do Bite Menu
- [ ] Depois de criar a conta no mesmo aparelho, o pedido recém-feito aparece em `/conta` > Histórico (não testado)

**Verificação:**
- [x] `npm run build` passa
- [x] Manual (fake-supabase): pedido de retirada até a tela do WhatsApp; `/descobrir` deslogado

**Arquivos:** `src/app/menu/[slug]/components/CartDrawer.jsx`, `src/app/descobrir/page.jsx`

## Checkpoint (manual, antes de publicar)
- [ ] Rodar o SQL pendente de `login-usuario` (`profile-cep.sql`) e `descobrir` (`orders-customer.sql`)
- [ ] Cadastro real pelo convite do checkout: volta com carrinho, dados e compra aberta
- [ ] Pedido feito como visitante aparece em `/conta` > Histórico depois do cadastro
- [ ] Layouts lista e grade, cardápio escuro, desktop
