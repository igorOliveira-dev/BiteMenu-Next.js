# Plano: Descobrir abre a landing ou o cardápio

## Visão geral
O dono escolhe o que o cliente vê ao tocar no estabelecimento em `/descobrir`: o **cardápio** (`/menu/[slug]`, como
hoje) ou a **landing page** (`/site/[slug]`). Padrão: cardápio. Só faz sentido para quem tem landing
(`LANDING_ROLES`, hoje só admin). A opção fica em **Configurações > Informações básicas** (abaixo de "Aparecer em
Descobrir") e no **modal do status do Descobrir** (banner da aba Cardápio).

## Como está hoje (lido no código)
- `/descobrir` (`src/app/descobrir/page.jsx:355`) liga cada card em `/menu/${m.slug}` com `<Link>`.
- `/api/descobrir` (`src/app/api/descobrir/route.js`) lê `menus` com service role, cache de 10 min em produção,
  e devolve só campos públicos.
- `/site/[slug]` (`src/app/site/[slug]/route.js`) já redireciona para `/menu/[slug]` quando não há `landing_html`
  ou o dono saiu de `LANDING_ROLES`.
- A aba `src/app/dashboard/tabs/Landing.jsx` grava por `updateMenuById` (client do dono + RLS); `useMenu` faz
  `select("*")`, então coluna nova chega sozinha.

## Decisões
- **1 coluna `menus.discover_landing boolean not null default false`.** SQL manual em
  `tasks/landing-ia/landing-descobrir.sql` (regra do `CLAUDE.md`). Policy de update de `menus` já cobre.
- **A rota não lê `landing_html`** (até 300 KB por loja). Devolve `landing: true` quando `discover_landing` está
  ligado **e o dono está em `LANDING_ROLES`** (o `role` vem na consulta de `profiles` que a rota já faz), e o card
  aponta para `/site/[slug]`. Sem landing publicada, o fallback de `/site` cai no cardápio com um redirect a mais.
- **Card usa `<a>` quando vai para `/site`**: é route handler com HTML cru, não página do App Router.
- **Campo `discoverLanding` no `StatesManager`**, igual ao `discoverable`: só vai no update quando mexido.
  Configurações salva pelo "Salvar tudo"; o modal do status salva na hora pelo `saveAll` (como o switch dele).
- **Tudo amarrado à landing (`LANDING_ROLES`):** o seletor, os termos da busca de Configurações ("landing", "abrir
  primeiro"…) e o link da rota. Quem não tem a landing não vê nem acha a opção.
- **Seletor "No Descobrir, abrir primeiro: Cardápio | Landing page"**, só para `LANDING_ROLES`. Sem landing publicada
  a opção "Landing page" fica desabilitada e o seletor mostra "Cardápio".
- **Remover a landing não mexe na coluna:** o `/site` já cai no cardápio; se republicar, a escolha do dono volta.
- **Dropdown `DiscoverOpenSelect`**, com descrição em cada opção. Depois passou a usar o `Select` comum
  (`src/components/Select.jsx`, lista em portal: não é cortada pelo `overflow` do modal). Ver `tasks/dropdown/`.
- **Busca de Configurações:** "descobrir" entra nos termos de Informações básicas (achava nada antes); os termos da
  landing (`LANDING_SEARCH`) só entram para `LANDING_ROLES`.
- Nada muda em `/site`, na aba Landing, nas regras de quem aparece no Descobrir, nem em RLS/auth.

## Riscos
| Risco | Impacto | Mitigação |
|---|---|---|
| Coluna não criada em produção e o select da rota quebra o Descobrir inteiro | Alto | Rodar o SQL antes do deploy (Tarefa 1 é checkpoint) |
| Dono cai de plano com a opção ligada | Baixo | Rota volta a mandar para o cardápio; a escolha fica salva para quando o plano voltar |
| Cliente cai na landing e não acha o cardápio | Baixo | Botões da landing já levam para `/menu/[slug]` (prompt da IA) |

Tarefas em `tasks/landing-ia/landing-descobrir-todo.md`.
