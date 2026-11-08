# Tarefas: Descobrir abre a landing ou o cardápio

## Tarefa 1: Coluna no banco (manual)
**Descrição:** rodar `tasks/landing-ia/landing-descobrir.sql` no SQL Editor **antes do deploy** (sem a coluna, a
consulta de `/api/descobrir` falha e o Descobrir sai do ar para todos).
- [ ] `menus.discover_landing` existe, `false` em todas as linhas
- [ ] Dono consegue fazer update da coluna pelo client (policy atual)

## Tarefa 2: Descobrir respeita a opção ✅
- [x] Opção desligada (padrão): card abre o cardápio, igual a hoje
- [x] Opção ligada e dono em `LANDING_ROLES`: card vai para `/site/[slug]` com `<a>` (fake-supabase: abre a landing)
- [x] Dono fora de `LANDING_ROLES`: a rota devolve `landing: false` e o card abre o cardápio direto
- [ ] Opção ligada sem landing publicada: card cai no cardápio (redirect do `/site`, código já existente)

**Arquivos:** `src/app/api/descobrir/route.js`, `src/app/descobrir/page.jsx`

## Tarefa 3: Seletor em Configurações e no status do Descobrir ✅
- [x] Configurações > Informações básicas: "No Descobrir, abrir primeiro", abaixo de "Aparecer em Descobrir",
  salvo pelo "Salvar tudo" (fake-supabase: landing → cardápio, `discover_landing: false` gravado)
- [x] Modal do status do Descobrir (banner da aba Cardápio): mesmo seletor, salvo na hora pelo `saveAll`
  (fake-supabase: cardápio → landing, `discover_landing: true` gravado)
- [x] Só aparece para `LANDING_ROLES`; "Landing page" desabilitada sem landing publicada
- [x] Dropdown no visual do Bite Menu (`DiscoverOpenSelect` → `Select` comum, `tasks/dropdown/`), com descrição em cada opção

**Arquivos:** `src/app/dashboard/StatesManager.jsx`, `src/app/dashboard/tabs/ConfigMenu.jsx`,
`src/app/dashboard/tabs/components/menu/DiscoverStatus.jsx`, `src/app/dashboard/tabs/components/menu/DiscoverOpenSelect.jsx`,
`src/app/dashboard/tabs/Menu.jsx`

## Tarefa 4: Busca de Configurações acha as opções do Descobrir ✅
- [x] "descobrir" acha "Aparecer em Descobrir" (para todos)
- [x] "landing", "abrir primeiro", "página inicial" acham o seletor só para `LANDING_ROLES`

**Arquivos:** `src/app/dashboard/tabs/ConfigMenu.jsx` (`SECTION_SEARCH` + `LANDING_SEARCH`)

## Verificação
- [x] `npm run build`
- [ ] Manual: busca em Configurações com conta admin e com conta sem landing
- [ ] Manual em produção depois do SQL: ligar, esperar até 10 min (cache), abrir pelo Descobrir
