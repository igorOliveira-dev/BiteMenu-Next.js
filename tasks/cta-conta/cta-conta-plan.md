# Plano: convite para criar conta no checkout

## Visão geral
Visitante (sem login) que vai finalizar um pedido num cardápio vê um convite para criar conta de cliente: com conta,
os dados já vêm preenchidos nos próximos pedidos e ele vê o histórico em `/conta`. O convite não bloqueia: dá para
seguir o pedido sem conta. Ele segue as cores do estabelecimento no cardápio e a identidade do Bite Menu fora dele.

Tarefas em `tasks/cta-conta/cta-conta-todo.md`.

**Fora do escopo:** login social, cadastro dentro do modal, popup ao abrir o cardápio, lembrar "agora não" entre visitas.

## Como está hoje (lido no código)
- **O que o convite promete já funciona.** O carrinho completa nome, telefone e endereço pela conta do cliente logado
  (`CartDrawer.jsx:607`, aparelho primeiro, depois `profiles`). O pedido grava `orders.customer_id` e `/conta` >
  Histórico lê do banco e junta os comprovantes do aparelho (`tasks/descobrir/descobrir-plan.md`, ajuste do checkpoint 3).
- **Sair para o cadastro não perde nada.** O carrinho fica em `localStorage` (`CartContext.js:97`). O cadastro e o
  login repassam `?tipo=cliente&next=` e voltam para o `next` (`register/page.jsx:157`). O cadastro já puxa o CEP de
  `customerInfo` (descobrir, tarefa 9).
- **Os links já existem:** `MenuAccountButton.jsx:18` e `descobrir/page.jsx:210` montam
  `/login?tipo=cliente&next=...`. Nenhum componente de convite existe hoje.
- **Fluxo do checkout:** "Continuar compra" abre o modal → `services` (pula sozinho se só há 1 opção) →
  `costumerInfos` (onde o cliente digita os dados) → pagamento → `whatsapp` / `pixOnline` / `tableSuccess`.
- **Cores do dono no carrinho:** `foregroundToUse`, `grayToUse`, `translucidToUse` e `menu.details_color` com
  `getContrastTextColor` (mesmo padrão de todos os botões do modal).
- `useUser()` devolve `{ user, profile, loading }`; o `CartDrawer` hoje só lê `profile`.

## Decisões
- **Um componente só: `src/components/SignUpCta.jsx`.** Recebe `next` (caminho de volta) e `colors` opcional
  (`{ text, muted, surface, accent }`). Com `colors`: estilo inline com as cores do dono. Sem `colors`: classes da
  identidade do Bite Menu (`bg-brand-surface`, `border-brand-line`, texto `text-brand-muted`, botão "Criar conta" em
  `bg-azul`, que é a cor de "criar" no papel das cores). Dois formatos de tema não justificam mais que esse `if`.
- **Conteúdo:** título "Peça mais rápido da próxima vez", texto "Crie sua conta grátis: seus dados ficam salvos e
  você acompanha o histórico dos seus pedidos.", botão "Criar conta" (`/register?tipo=cliente&next=`), link
  "Já tenho conta" (`/login?tipo=cliente&next=`) e um "×" que esconde o convite.
- **"×" só vale até fechar o modal** (`useState`). Sem `localStorage`: é um cartão pequeno, não um popup, e
  reaparecer no próximo pedido é o objetivo.
- **Local 1 (pedido): topo da etapa `costumerInfos`**, acima de "Digite seu nome". É a etapa que sempre aparece e é
  exatamente onde a dor (preencher tudo) acontece. Uma etapa nova bloqueando o checkout custaria conversão.
- **Quem vê:** `!loading && !user`. Dono/equipe estão logados, então balcão (`?balcao=1`) e conta de dono ficam de fora
  sem regra extra. Mesa (`?mesa=`) vê normalmente.
- **Antes de sair para o cadastro, `saveCustomerInfo()`** (já existe): o que ele digitou fica no aparelho e volta
  preenchido. O componente recebe `onBeforeLeave` para isso.
- **Local 2 (sugestão): tela de pedido enviado** (`whatsapp`, `tableSuccess` e Pix pago), com texto
  "Crie sua conta e veja este pedido no seu histórico". Momento de maior intenção, e o pedido recém-feito aparece no
  histórico porque `/conta` junta os comprovantes do aparelho. No `whatsapp`, o convite fica **abaixo** do
  "Enviar confirmação", para não competir com o passo que confirma o pedido.
- **Alternativa ao local 2, com identidade do Bite Menu:** cartão em `/descobrir` para visitante, abaixo do título
  (mesmo componente sem `colors`, `next="/descobrir"`).

- **Volta para a compra:** o convite do checkout manda `next=/menu/<slug>?finalizar=<serviço>` (mantém `?mesa=`). Na
  volta, o `CartDrawer` espera o carrinho carregar do aparelho, tira o `?finalizar=` da URL, abre o carrinho e a compra
  em "Confirmar compra" com o mesmo serviço; os dados digitados voltam do `customerInfo`. Sem itens no carrinho, não
  abre nada. Loja fora do horário: abre só o carrinho, e o "Continuar compra" mostra o aviso de sempre.

## Lista de tarefas
- [x] Tarefa 1: Componente `SignUpCta` (tema do dono e do Bite Menu)
- [x] Tarefa 2: Convite no checkout (etapa `costumerInfos`) e volta para a compra aberta
- [ ] Checkpoint 1: visitante cria conta no meio do pedido e volta com carrinho e dados (fluxo de volta testado no
  app com fake-supabase; cadastro real não testado)
- [x] Tarefa 3: Convite na tela de pedido enviado **e** em `/descobrir` (decidido: os dois)
- [ ] Checkpoint 2: pronto para revisão

## O que foi feito
| Arquivo | Mudança |
|---|---|
| `src/components/SignUpCta.jsx` (novo) | Cartão de convite com "Criar conta", "Já tenho conta" e "×". Com `colors` usa o tema do cardápio; sem, a identidade do Bite Menu (botão `bg-azul`) |
| `src/app/menu/[slug]/components/CartDrawer.jsx` | Convite no topo de "Confirmar compra" (salva os dados digitados antes de sair); "Guarde este pedido" abaixo do "Enviar confirmação", na mesa e no Pix pago; volta pelo `?finalizar=` reabrindo carrinho e compra |
| `src/app/descobrir/page.jsx` | Convite para visitante abaixo do título |

- Só visitante vê o convite (`!loading && !user`); dono, equipe e balcão estão logados.
- Na volta, a compra só reabre com itens no carrinho e dentro do horário; fora dele abre só o carrinho.
  O controle manual de loja e o pedido mínimo são conferidos só no "Continuar compra" (comentário `ponytail:` no código).
- Testado com fake-supabase em 390px no layout padrão: convite no checkout, links com
  `next=/menu/demo?finalizar=delivery`, volta reabrindo "Confirmar compra (entrega)", convite na tela do WhatsApp e em
  `/descobrir`. Não testado: cadastro real, histórico depois do cadastro, layouts lista/grade, tema escuro e desktop.
- Testes locais: `fake-supabase.mjs` ganhou `FAKE_ORDERS` (ex. `site_whatsapp`), porque com o padrão o cardápio demo
  não mostra o carrinho (arquivo fora do git, em `.claude/`).

## Riscos
| Risco | Impacto | Como evitar |
|---|---|---|
| Convite distrair do "Enviar confirmação" no WhatsApp e o pedido não chegar ao dono | Alto | Local 2 fica abaixo do botão, com peso visual menor |
| Cliente perder o que digitou ao ir para o cadastro | Médio | `saveCustomerInfo()` antes de navegar; carrinho já persiste |
| Cor do dono com pouco contraste no botão | Médio | `getContrastTextColor(accent)`, igual aos outros botões do modal |
| Piscar do convite para quem está logado | Baixo | Só renderiza com `loading === false` |
| SQL pendente (`profile-cep`, `orders-customer`) não rodado: cadastro falha ou histórico não grava | Alto | Já listado em `login-usuario` e `descobrir`; rodar antes de publicar o convite |

## Perguntas em aberto
1. ~~Segundo local?~~ **Decidido:** os dois (tela de pedido enviado e `/descobrir`).
2. **Modal "Meus pedidos recentes"** (`MyOrdersModal`, só pedidos do aparelho): vale uma linha "Crie sua conta para ver
   seus pedidos em qualquer aparelho"? Sugestão: não por agora.
