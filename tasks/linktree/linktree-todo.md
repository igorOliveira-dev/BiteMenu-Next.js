# Tarefas: linktree do estabelecimento

**Status (2026-11-08):** tarefas 1–6 implementadas e commitadas na `dev`. O que foi verificado e o que falta está em
`tasks/linktree/linktree-resumo.md`.

Plano: `tasks/linktree/linktree-plan.md`. O projeto não tem testes automatizados: a verificação é o self-check, o
`npm run build` e o teste manual (fake-supabase pela skill `run-bitemenu`, ou conta admin real).

## Fase 1: base e página pública

### Tarefa 1: coluna e regras da linktree
**Descrição:** criar o SQL da coluna `menus.linktree` e `src/lib/linktree.js` com `LINKTREE_ROLES`,
`defaultLinktree()` (começa com o link "Ver cardápio"), `cleanLinktree(raw)` (lista branca de protocolos,
limites, enums, ícone e cores hex), `normalizeUrl` (completa `https://`), `linkHref(link, slug)`, `ICONS`,
`iconFor(link)` (escolhido pelo dono ou automático pelo endereço) e
`linktreeColors(style, menu)` (cores próprias ou do cardápio + tons derivados).

**Critérios de aceite:**
- [x] `cleanLinktree` derruba `javascript:`, `data:`, `vbscript:` (inclusive com maiúsculas e espaços), rótulo vazio
      e itens além do 30º; mantém `https:`, `http:`, `tel:`, `mailto:` e `kind: "menu"`
- [x] Entrada `null`, malformada ou com `style` inválido devolve um objeto válido (padrões), sem lançar erro
- [x] `linktreeColors` com `colors: null` usa as cores do cardápio; com cores próprias, as usa

**Verificação:**
- [x] `node scripts/linktree-check.mjs` imprime `ok`
- [ ] SQL `tasks/linktree/linktree.sql` rodado no Supabase (manual, pelo dono)

**Dependências:** nenhuma
**Arquivos:** `tasks/linktree/linktree.sql` (pronto), `src/lib/linktree.js`, `scripts/linktree-check.mjs`
**Tamanho:** S

### Tarefa 2: página pública `/links/[slug]`
**Descrição:** página com ISR que lê o cardápio (consulta enxuta + `getOwnerInfo`), aplica `cleanLinktree` e desenha
`LinktreeView` (cabeçalho, botões e selo do Bite Menu). Também entram o marcador `.public-menu` no `layout.jsx`,
`/links/` no rate limit do `proxy.js` e `revalidatePath('/links/<slug>')` em `/api/revalidate-menu`.

**Critérios de aceite:**
- [x] Com uma linktree gravada à mão (SQL abaixo), a página mostra banner, logo, nome, descrição e os botões na
      ordem; os externos abrem em nova aba e "Ver cardápio" vai para `/menu/<slug>`
- [x] Slug inexistente → página de não encontrado; sem linktree, sem link visível ou dono fora de `LINKTREE_ROLES` →
      redireciona para `/menu/<slug>`
- [ ] Os 3 estilos e os 2 formatos de botão legíveis num fundo claro e num escuro

**Verificação:**
- [x] `npm run build`
- [ ] Manual em 390px e 1440px; um link `javascript:alert(1)` gravado à mão não aparece
- [ ] Cardápio `/menu/<slug>` continua igual

```sql
update public.menus set linktree = '{"v":1,"links":[
  {"id":"a","kind":"menu","label":"Ver cardápio"},
  {"id":"b","kind":"url","label":"Instagram","url":"https://instagram.com/bitemenu"},
  {"id":"c","kind":"url","label":"WhatsApp","url":"https://wa.me/5511999999999"},
  {"id":"d","kind":"url","label":"Malicioso","url":"javascript:alert(1)"}
],"style":{"colors":null,"button":"fill","shape":"pill","showBanner":true,"showLogo":true,"showDescription":true}}'
where slug = 'SEU_SLUG';
```

**Dependências:** Tarefa 1
**Arquivos:** `src/app/links/[slug]/page.jsx`, `src/app/links/[slug]/layout.jsx`,
`src/app/links/[slug]/LinktreeView.jsx`, `src/proxy.js`, `src/app/api/revalidate-menu/route.js`
**Tamanho:** M

### Checkpoint: fase 1
- [x] Self-check e `npm run build` ok
- [x] Página pública conferida com o JSON de teste; cardápio e landing sem mudança
- [ ] Revisão com o dono antes de seguir

## Fase 2: painel

### Tarefa 3: aba "Links" com a lista de links
**Descrição:** item "Links" (`FaLink`) no `navItems` só para `LINKTREE_ROLES`, com aba `Linktree.jsx`. A lista começa
pelo `menu.linktree` ou por `defaultLinktree`. O dono adiciona, edita rótulo e URL, esconde, remove (`confirm`) e
reordena arrastando (`@dnd-kit/sortable`). O botão do ícone abre uma grade: "Automático" + `ICONS`. A prévia ao vivo usa `LinktreeView` com `cleanLinktree(rascunho)`. O botão
verde "Salvar" grava com `updateMenuById` + `updateCachedMenu`. O rascunho fica num `kept` do módulo, com aviso de
alterações não salvas.

**Critérios de aceite:**
- [x] Adicionar, editar, esconder, remover e reordenar aparecem na prévia na hora e, depois de Salvar, em `/links/<slug>`
- [x] URL sem protocolo vira `https://`; URL inválida mostra erro no campo e não salva
- [x] Ícone escolhido na mão aparece na prévia e na página; "Automático" volta ao ícone pelo endereço
- [x] Usuário fora de `LINKTREE_ROLES` não vê a aba

**Verificação:**
- [x] `npm run build`
- [ ] Manual no desktop e no celular (390px): arrastar funciona no toque; recarregar após salvar mantém os dados

**Dependências:** Tarefa 2
**Arquivos:** `src/app/dashboard/Dashboard.jsx`, `src/app/dashboard/tabs/Linktree.jsx`
**Tamanho:** M

### Tarefa 4: aparência da linktree
**Descrição:** seção "Aparência" na aba, com o switch "Usar cores do cardápio". Desligado, ele mostra os 3 seletores
(Fundo, Título, Detalhes) com `HexColorPicker`/`HexColorInput` e "Sugerir cores" (`COLOR_PALETTES`), partindo das
cores atuais do cardápio. A seção tem ainda estilo do botão (Cheio, Contorno, Translúcido), formato (Pílula,
Arredondado) e switches de banner, logo e descrição.

**Critérios de aceite:**
- [x] Cada opção muda a prévia na hora e é salva junto com os links
- [x] Religar "Usar cores do cardápio" grava `colors: null`, e a linktree passa a acompanhar o cardápio
- [ ] Com cores próprias extremas (ex.: fundo `#ffff00` e detalhes `#ffffff`), texto e borda continuam legíveis

**Verificação:**
- [x] `npm run build`
- [ ] Manual: as combinações de estilo e formato com o cardápio claro e o escuro; painel no tema claro e no escuro

**Dependências:** Tarefa 3
**Arquivos:** `src/app/dashboard/tabs/Linktree.jsx`
**Tamanho:** S

### Tarefa 5: modal de compartilhar
**Descrição:** botão azul "Compartilhar" no topo da aba abre o `QrCodeModal` com `/links/<slug>`. O modal ganha a
prop opcional `shareText`, que acrescenta "WhatsApp" e "Compartilhar" (`navigator.share`, só onde existe). Também há
"Ver página" (contorno). Antes de salvar a 1ª vez, os dois avisam para salvar primeiro.

**Critérios de aceite:**
- [ ] Copiar, Abrir, Baixar (`linktree-<slug>.png`), WhatsApp e Compartilhar levam a `/links/<slug>`
- [ ] Os outros usos do `QrCodeModal` (compartilhar cardápio, landing) continuam iguais

**Verificação:**
- [ ] Manual: ler o QR com o celular; WhatsApp abre com o texto e o link

**Dependências:** Tarefa 3
**Arquivos:** `src/app/dashboard/tabs/Linktree.jsx`, `src/app/dashboard/tabs/components/menu/QrCodeModal.jsx`
**Tamanho:** S

### Tarefa 6: Descobrir abre a linktree
**Descrição:** opção "Links" em "No Descobrir, abrir primeiro" (Configurações e status do Descobrir). Coluna
`discover_links` (em `linktree.sql`), campo `discoverLinks` no `StatesManager`, `links` no `/api/descobrir` e card
do `/descobrir` apontando para `/links/<slug>`.

**Critérios de aceite:**
- [x] O seletor mostra Cardápio, Landing page (só `LANDING_ROLES`) e Links (só `LINKTREE_ROLES`); sem página
      publicada, a opção fica desabilitada
- [ ] Escolher Links desliga Landing e vice-versa; o card do Descobrir abre `/links/<slug>`
- [ ] Quem só tem landing (ou nenhum dos dois) vê o seletor como antes

**Verificação:**
- [ ] `npm run build`; SQL rodado antes do deploy
- [ ] Manual: trocar a opção nos dois lugares e abrir o card no `/descobrir`

**Dependências:** Tarefa 2
**Arquivos:** `DiscoverOpenSelect.jsx`, `DiscoverStatus.jsx`, `ConfigMenu.jsx`, `StatesManager.jsx`, `Menu.jsx`,
`src/app/api/descobrir/route.js`, `src/app/descobrir/page.jsx`
**Tamanho:** M

### Checkpoint: completo
- [x] `node scripts/linktree-check.mjs` e `npm run build` ok
- [ ] Fluxo completo: o dono admin monta a linktree, salva, compartilha, e o cliente abre e clica em cada botão
- [ ] Mobile (320px, 390px) e desktop; cardápio claro e escuro; cores próprias
- [x] `tasks/linktree/linktree-resumo.md` escrito e linha da pasta em `tasks/README.md`
- [x] `graphify update .`
- [ ] Revisão com o dono antes do commit
