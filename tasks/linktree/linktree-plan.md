# Plano: linktree do estabelecimento

## Visão geral
O dono monta uma página de links no estilo das linktrees que já existem: cabeçalho com banner, logo, nome e descrição
do cardápio, e uma lista de botões (Instagram, WhatsApp, iFood, Google Maps, "Ver cardápio"…). Cada botão leva o
cliente para onde o dono quiser. A página fica pública em **`/links/[slug]`**, pensada para a bio do Instagram.

A página usa as **cores do cardápio** por padrão, mas o dono pode trocar por **cores próprias**. Ele também escolhe o
estilo e o formato dos botões e o que aparece no cabeçalho. Os elementos (fonte, formas, linhas) seguem a identidade
do Bite Menu, como no cardápio público (`tasks/cardapio-visual/`).

Fica liberado **só para `admin`** por enquanto, com `LINKTREE_ROLES = ["admin", "enterprise"]` (mesmo padrão de
`LANDING_ROLES` e `CUSTOM_LAYOUT_ROLES`; o Enterprise ainda não existe). Liberar para outros planos é editar essa lista.

Tarefas em `tasks/linktree/linktree-todo.md`. SQL manual em `tasks/linktree/linktree.sql`.

**Fora do escopo (v1):** contagem de cliques, agendar link (aparecer/sumir por data), imagem por botão, fonte própria,
várias páginas por estabelecimento, domínio próprio, sitemap, link da linktree no modal de compartilhar do cardápio, e
IA.

**Pedidos do dono depois da 1ª versão do plano:** escolher o ícone na mão, um modal para compartilhar e a linktree como
opção de "No Descobrir, abrir primeiro".

## Como está hoje (lido no código)
- **Cores do cardápio:** `menus.background_color`, `title_color` e `details_color`. Os tons derivados vêm do contraste
  com o fundo, em `src/app/menu/[slug]/useClientMenu.js:125`: `translucidToUse` (`#ffffff15`/`#00000015`),
  `grayToUse` (`#cccccc`/`#333333`) e `foregroundToUse` (`#fafafa`/`#171717`). Os helpers ficam em
  `src/utils/color.js` (`getContrastTextColor`, `contrastRatio`).
- **Editor de cores:** Configurações > Aparência (`src/app/dashboard/tabs/ConfigMenu.jsx:1517`) usa `HexColorPicker`
  e `HexColorInput` (`react-colorful`) e "Sugerir cores" com `COLOR_PALETTES` (`src/consts/colorPallets.jsx`).
- **Página pública parecida:** `/site/[slug]` (landing) redireciona para `/menu/[slug]` quando não há landing ou o dono
  saiu do plano. `/menu/[slug]/page.jsx` usa ISR (`revalidate = 300` e `generateStaticParams` vazio) e
  `getOwnerInfo` (`getMenuData.js`), que devolve `ownerRole` e `deletionRequested`.
- **Cache:** gravar em `menus` pelo client chama `/api/revalidate-menu` (`src/lib/supabaseClient.js:7`), que só faz
  `revalidatePath('/menu/<slug>')`.
- **Rate limit:** `src/proxy.js` põe `/menu/` e `/site/` no bucket `menu` (60/min por IP).
- **Abas do painel:** `navItems` em `src/app/dashboard/Dashboard.jsx:255`. As abas por plano são condicionais
  (`LANDING_ROLES.includes(profile?.role)`).
- **Modelo de aba com salvamento próprio:** `src/app/dashboard/tabs/Landing.jsx` guarda o rascunho num `kept` do
  módulo (sobrevive à troca de aba), grava com `updateMenuById` e atualiza o cache com `updateCachedMenu`.
- **Já instalado:** `@dnd-kit/sortable` (usado em `MenuItems.jsx`), `react-icons`, `react-colorful`, `QrCodeModal`
  (recebe `url`), `BannerImage`, `Select`.
- `useMenu` faz `select("*")`: a coluna nova chega sozinha no painel.
- Marcador `.public-menu` (`src/app/menu/[slug]/layout.jsx`) faz o `globals.css` manter fonte e fundos próprios.

## Decisões
- **Dados: 1 coluna `menus.linktree jsonb`**, `null` = nunca montou. O mesmo padrão de `loyalty` e `custom_layout`.
  Limite de tamanho no SQL: 50 mil caracteres (uma linktree cheia, com 30 links de URL de 500, passa de 20 mil). A gravação é feita pelo client do dono, com a policy de update de `menus` que já existe
  (nada de RLS novo). Formato:
  ```js
  {
    v: 1,
    links: [
      { id: "a1", kind: "menu", label: "Ver cardápio", icon: null, hidden: false },  // url resolvida: /menu/<slug>
      { id: "b2", kind: "url", label: "Instagram", url: "https://instagram.com/x", icon: null, hidden: false },
      // icon: null = automático pelo endereço; ou uma chave de ICONS (src/lib/linktree.js)
    ],
    style: {
      colors: null,                 // null = cores do cardápio; ou { bg, title, details } (hex)
      button: "fill",               // "fill" (cheio) | "outline" (contorno) | "soft" (translúcido)
      shape: "pill",                // "pill" | "rounded"
      showBanner: true, showLogo: true, showDescription: true,
    },
  }
  ```
- **Link "Ver cardápio" é `kind: "menu"`**, sem URL salva, e resolve para `/menu/<slug>` na hora de desenhar. Ele não
  quebra se o slug mudar. Vem como 1º item da linktree nova e pode ser renomeado, movido, escondido ou removido.
- **Cores:** `style.colors ?? cores do cardápio`. Com `null`, a linktree acompanha o cardápio quando ele muda de cor.
  Os tons derivados usam a mesma regra do `useClientMenu`. Botão cheio usa o fundo `details` e o texto
  `getContrastTextColor(details)`. Contorno e translúcido usam o texto `foregroundToUse`, e a borda fica em `details`
  quando `contrastRatio(bg, details) >= 3` (senão, em `foregroundToUse`).
- **Ícone automático pelo endereço, ou escolhido pelo dono** (`react-icons`). O automático reconhece Instagram,
  WhatsApp (`wa.me`, `whatsapp.com`), Facebook, TikTok, YouTube, X, Threads, iFood, Uber Eats, Google Maps/Waze,
  Spotify, Telegram, `tel:` (telefone), `mailto:` (e-mail) e `menu` (prato); o resto usa um ícone de link.
  No painel, o botão do ícone abre uma grade com "Automático" e a lista de `ICONS` (redes, delivery, mapa, telefone,
  e-mail, site, avaliações, reservas, presente, Wi-Fi…). Chave desconhecida volta a `null` (automático).
- **Validação (`cleanLinktree` em `src/lib/linktree.js`, sem imports de servidor: a aba também usa).** Ela roda no
  servidor antes de desenhar e na prévia:
  - URL só com `https:`, `http:`, `tel:` ou `mailto:`. Qualquer outra (`javascript:`, `data:`…) derruba o link.
    O editor completa `instagram.com/x` para `https://instagram.com/x`.
  - No máximo 30 links, rótulo com até 60 caracteres e URL com até 500. Rótulo vazio derruba o link.
  - `button`/`shape` fora da lista voltam ao padrão. Cores que não são hex (`/^#[0-9a-f]{3,8}$/i`) voltam a `null`.
  - O texto é escapado pelo React (nada de `dangerouslySetInnerHTML`).
  - Links externos abrem com `target="_blank" rel="noopener noreferrer nofollow"`. "Ver cardápio" abre na mesma aba.
  - Self-check em `scripts/linktree-check.mjs`, como `custom-layout-check.mjs`.
- **Página pública: `src/app/links/[slug]/page.jsx` (página React, não route handler)**, com ISR igual ao cardápio
  (`revalidate = 300` e `generateStaticParams` vazio).
  - Consulta própria e enxuta (`id, owner_id, slug, title, description, logo_url, banner_url, banner_mobile_url,
    background_color, title_color, details_color, linktree`), sem puxar categorias e itens. `getOwnerInfo` vem
    reaproveitado do cardápio.
  - Slug inexistente ou exclusão pedida → `NotFoundMenu`. Sem linktree, dono fora de `LINKTREE_ROLES` ou nenhum link
    visível → `redirect('/menu/<slug>')`. O JSON fica salvo e volta se o plano voltar.
  - `generateMetadata` com título `"<nome> | Links"`, descrição e imagem do cardápio.
  - Selo pequeno "Feito com Bite Menu" no rodapé, com a mesma regra de cor do `MenuFooter` (vermelho se
    `contrastRatio >= 3`, senão monocromático).
  - `layout.jsx` com o marcador `.public-menu`.
- **Visual: componente único `src/app/links/[slug]/LinktreeView.jsx`**, usado pela página e pela prévia do painel.
  - Coluna central (`max-w-[480px]`), banner `rounded-2xl` no topo, logo redondo sobreposto, nome em `title`,
    descrição em `grayToUse` e botões com largura total e `gap-3`.
  - Segue a marca (`tasks/identidade-visual/identidade-visual-resumo.md`): Plus Jakarta Sans, pílula ou
    `rounded-2xl`, linha fina, sem sombra e sem zoom no hover (no hover só o fundo fica translúcido).
  - Só estilo inline e classes Tailwind de forma. As cores vêm por props. Isso evita a interferência do tema do painel
    na prévia.
- **Painel: aba "Links"** (`src/app/dashboard/tabs/Linktree.jsx`, ícone `FaLink`), só para `LINKTREE_ROLES` e também
  no celular. No desktop o editor fica à esquerda e a prévia ao vivo (`LinktreeView` numa moldura de celular) à
  direita; no celular a prévia fica embaixo.
  - Links: adicionar, editar rótulo e URL, esconder, remover (`confirm`) e reordenar arrastando (`@dnd-kit/sortable`,
    como em `MenuItems.jsx`).
  - Aparência: "Usar cores do cardápio" (switch). Desligado, abre os 3 seletores de cor e "Sugerir cores", como em
    Configurações. Há também estilo e formato do botão (`OptionCard`/`Select`) e switches de banner, logo e descrição.
  - **Salvar próprio** (botão verde), fora do "Salvar tudo" do `StatesManager`, como na aba Landing. O rascunho fica
    num `kept` do módulo e some ao recarregar. Um aviso "alterações não salvas" aparece ao lado do botão.
  - **Modal de compartilhar** (botão azul "Compartilhar"): o `QrCodeModal` ganha a prop opcional `shareText`, que
    acrescenta "WhatsApp" (`wa.me/?text=`) e "Compartilhar" (`navigator.share`, só onde existe) aos botões Copiar,
    Abrir e Baixar. Sem a prop, os outros usos do modal não mudam. Há também "Ver página" (contorno).
- **Descobrir: "No Descobrir, abrir primeiro: Cardápio | Landing page | Links".** Uma coluna nova
  `menus.discover_links boolean not null default false`, no mesmo `linktree.sql`. A opção "Landing page" já existe
  (`discover_landing`) e ficou como estava, para não migrar dado.
  - `DiscoverOpenSelect` passa a devolver `{ discoverLanding, discoverLinks }`: escolher uma opção desliga a outra.
    Cada opção só aparece para o plano dela (`LANDING_ROLES` / `LINKTREE_ROLES`) e fica desabilitada sem página
    publicada.
  - `StatesManager` ganha o campo `discoverLinks`, igual ao `discoverLanding` (só vai no update quando mexido).
  - `/api/descobrir` lê `discover_links` e devolve `links: true` com o dono em `LINKTREE_ROLES`. Links tem prioridade
    sobre landing se as duas estiverem ligadas. O card do `/descobrir` aponta para `/links/<slug>` (`<Link>`: é página
    React). Sem linktree, `/links` cai no cardápio.
- **Cache:** `/api/revalidate-menu` ganha `revalidatePath('/links/<slug>')` (uma linha). A gravação em `menus` já
  dispara a rota.
- **Rate limit:** `/links/` entra no bucket `menu` e no `matcher` do `src/proxy.js`.

## Riscos
| Risco | Impacto | Mitigação |
|---|---|---|
| Coluna não criada em produção | Alto | `linktree`: só `/links` lê (consulta própria), o cardápio não quebra. `discover_links`: o select do `/api/descobrir` quebra o Descobrir inteiro. Rodar `linktree.sql` **antes do deploy** |
| Link malicioso (`javascript:`) ou phishing no domínio do Bite Menu | Alto | Lista branca de protocolos em `cleanLinktree`, com self-check; `rel="nofollow noopener"`; só admin por enquanto |
| Cores próprias ilegíveis | Médio | Texto sempre derivado do contraste com o fundo; borda cai para `foregroundToUse` com contraste < 3 |
| Prévia diferente da página pública | Médio | Mesmo `LinktreeView` e mesmo `cleanLinktree` nos dois |
| Cache de 5 min mostra versão antiga | Baixo | `revalidatePath('/links/<slug>')` na rota que já roda ao salvar |
| Dono perde o rascunho ao recarregar | Baixo | Aviso "alterações não salvas" (mesmo comportamento da aba Landing) |

## Perguntas em aberto
- Quando liberar para mais planos: Free com limite de links (ex.: 5) ou só Plus para cima?
- Pôr o link da linktree no modal de compartilhar do cardápio (menu lateral)? (fora da v1)
- Contagem de cliques numa v2? Exigiria tabela e rota de API próprias, com SQL manual.
