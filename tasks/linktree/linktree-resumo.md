# Resumo: linktree do estabelecimento

Plano: `linktree-plan.md` · Tarefas: `linktree-todo.md` · SQL: `linktree.sql`

## Onde parou (2026-11-08)
- Tarefas 1–6 **implementadas** e commitadas na `dev` ("feat: linktree do estabelecimento"). `npm run build` ok e self-check ok.
- **SQL `linktree.sql` ainda não rodado.** Ele cria `menus.linktree` (até 50 mil caracteres) e `menus.discover_links`. Rodar **antes do
  deploy**: sem `discover_links`, o `/api/descobrir` quebra.
- Liberado **só para `admin`** (`LINKTREE_ROLES = ["admin", "enterprise"]`; o Enterprise ainda não existe).

## Decisões do dono
- URL `/links/[slug]`; só admin por enquanto; sem contagem de cliques na v1.
- Cores do cardápio por padrão, com opção de cores próprias.
- Depois do plano: ícone escolhido na mão, modal de compartilhar e "Links" como opção de "No Descobrir, abrir
  primeiro".

## Arquivos
| Arquivo | O que faz |
|---|---|
| `src/lib/linktree.js` (novo) | `LINKTREE_ROLES`, `ICONS`, `cleanLinktree` (lista branca https/http/tel/mailto, 30 links, 60 caracteres, enums, cores hex), `normalizeUrl`, `safeUrl`, `iconFor` (manual ou automático pelo domínio), `linktreeColors` (cores + tons derivados, com fallback de contraste), `defaultLinktree`, `hasVisibleLinks` |
| `scripts/linktree-check.mjs` (novo) | Self-check: `node scripts/linktree-check.mjs` → `ok` |
| `src/app/links/[slug]/page.jsx` (novo) | Página pública com ISR (5 min). Consulta enxuta + `getOwnerInfo`. Sem linktree, sem link visível ou fora do plano → `redirect('/menu/<slug>')` |
| `src/app/links/[slug]/LinktreeView.jsx` (novo) | Visual da página e da prévia (mesmo componente). `ICON_COMPONENTS` (react-icons fa6 + si). Selo "Feito com Bite Menu" com a regra de cor do `MenuFooter` |
| `src/app/links/[slug]/layout.jsx` (novo) | Marcador `.public-menu` |
| `src/app/dashboard/tabs/Linktree.jsx` (novo) | Aba Links: botões (arrastar, esconder, remover, ícone em grade), aparência, prévia ao vivo, Salvar próprio, Ver página, Compartilhar |
| `src/app/dashboard/Dashboard.jsx` | Item "Links" (`FaLink`) na barra lateral e no menu do celular, só `LINKTREE_ROLES` |
| `src/app/dashboard/tabs/components/menu/QrCodeModal.jsx` | Prop opcional `shareText`: botões WhatsApp e Compartilhar (`navigator.share`, só onde existe). Sem a prop, nada muda |
| `DiscoverOpenSelect.jsx`, `DiscoverStatus.jsx`, `ConfigMenu.jsx` | Opção "Links" no seletor; `onChange` devolve `{ discoverLanding, discoverLinks }` |
| `StatesManager.jsx`, `Menu.jsx` | Campo `discoverLinks` (`discover_links`), só vai no update quando mexido |
| `src/app/api/descobrir/route.js`, `src/app/descobrir/page.jsx` | `links: true` (dono em `LINKTREE_ROLES`, ganha da landing) → card aponta para `/links/<slug>` |
| `src/proxy.js` | `/links/` no rate limit `menu` |
| `src/app/api/revalidate-menu/route.js` | `revalidatePath('/links/<slug>')` ao salvar |

## Verificado (fake-supabase, `FAKE_ROLE=admin`)
- `/links/demo` sem linktree → redireciona para `/menu/demo`.
- Aba Links: adicionar botão, `instagram.com/x` vira `https://…`, `oi@x.com` vira `mailto:`, `javascript:alert(1)`
  marcado como "Endereço inválido" e não salva. Ícone manual (estrela) e automático (e-mail) na prévia. Cores próprias,
  Contorno, Arredondado, Salvar ("Links salvos!") e modal de compartilhar com QR + WhatsApp.
- `/links/demo` no celular (390px): botões na ordem; "Ver cardápio" → `/menu/demo` na mesma aba; externos com
  `target=_blank rel="noopener noreferrer nofollow"`; sem erros no console.
- Configurações: o seletor mostra Cardápio / Landing page (desabilitada, sem landing) / Links; escolher Links e
  "Salvar tudo" grava `discover_links: true`.

## Falta (manual, conta real)
- [ ] Rodar `linktree.sql` no Supabase
- [ ] Banner e logo na página (o demo falso não tem imagem `https`)
- [ ] Arrastar no toque (celular) e a aba Links no celular
- [ ] Cardápio claro e escuro; cores extremas; painel no tema escuro
- [ ] Ler o QR com o celular; WhatsApp; "Compartilhar" nativo no celular
- [ ] Card do `/descobrir` abrindo `/links/<slug>` (o demo falso não aparece no Descobrir: falta cidade)
- [ ] Status do Descobrir (banner da aba Cardápio) trocando a opção
