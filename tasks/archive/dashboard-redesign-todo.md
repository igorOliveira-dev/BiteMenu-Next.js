# Todo: redesign do dashboard + sidebar recolhível

Sem testes automatizados no projeto: verificação = `npm run lint` + `npm run build` + checagem manual
com a skill `run-bitemenu` (screenshots desktop 1440px e mobile 390px, temas claro e escuro).

## Fase 1: Sidebar recolhível

### Task 1: Recolher/expandir a sidebar no desktop
**Descrição:** Adicionar estado `collapsed` no `Dashboard.jsx` e um botão (`FaChevronLeft`) no topo da sidebar.
Recolhida: `aside` estreito (~`w-16`), rótulos escondidos, só ícones centralizados, clicáveis. `<main>` vira
`flex-1 min-w-0` pra ocupar o espaço liberado.

**Critérios de aceite:**
- [x] Desktop: clicar no botão alterna entre sidebar larga (ícone + texto) e estreita (só ícones), e dá pra trocar de aba recolhida
- [ ] Recolhida: item ativo destacado (ok) e badge de pedidos pendentes visível sobre o ícone (não testado: fake sem pedidos)
- [x] Mobile (< lg) idêntico ao atual (barra inferior + hambúrguer)

**Verificação:**
- [x] `npm run build` passa (`npm run lint` está quebrado no Next 16, problema que já existia)
- [x] Manual: screenshot das abas Cardápio, Pedidos e Vendas com a sidebar nos dois estados; sem scroll horizontal

**Dependências:** nenhuma
**Arquivos:** `src/app/dashboard/Dashboard.jsx` (+ `tabs/Menu.jsx`, `tabs/Orders.jsx`: largura fixa `70dvw-256px` virou relativa)
**Tamanho:** S

### Task 2: Lembrar o estado + acessibilidade
**Descrição:** Salvar `collapsed` em `localStorage` (leitura em `useEffect`, try/catch). Itens recolhidos com
`title` e `aria-label`; botão de recolher com `aria-expanded` e `aria-label`. Transição de largura curta.

**Critérios de aceite:**
- [x] Recarregar a página mantém a sidebar recolhida/expandida
- [x] Sem warning de hidratação no console; `localStorage` em try/catch (bloqueado não testado)
- [x] Passar o mouse num ícone recolhido mostra o nome da aba

**Verificação:**
- [x] `npm run build` passa
- [x] Manual: recolher, recarregar, conferir; console limpo

**Dependências:** Task 1
**Arquivos:** `src/app/dashboard/Dashboard.jsx`
**Tamanho:** XS

### Checkpoint: Fase 1
- [x] Build limpo
- [x] Navegação por todas as abas com a sidebar recolhida, claro e escuro
- [x] Revisão com você antes de seguir pro polimento

## Fase 2: Base visual

### Task 3: Classes globais consistentes (sem mudar cor)
**Descrição:** Em `globals.css`, ajustar só propriedades não-cor de `cta-button`, `custom-gray-button`,
`hover-bg-translucid`: raio padrão, `focus-visible` com outline, transição suave, estado `disabled`.
Nenhum valor de cor novo nem alterado.

**Critérios de aceite:**
- [x] `git diff src/app/globals.css` não altera nenhuma cor (exceto a mudança do `--background` que já existe)
- [x] Botões mostram foco visível ao navegar com Tab
- [x] Nenhuma tela do dashboard muda de layout

**Verificação:**
- [x] `npm run build` passa
- [x] Manual: screenshot de todas as abas antes/depois

**Dependências:** Checkpoint Fase 1
**Arquivos:** `src/app/globals.css`
**Tamanho:** XS

### Task 4: Header do dashboard
**Descrição:** Alinhar o header com a sidebar (mesmo raio, borda, sombra e margens), logo e botões
alinhados verticalmente, espaçamento entre "Melhorar plano" e o ThemeToggle.

**Critérios de aceite:**
- [x] Header e sidebar com mesmo raio/borda/sombra
- [x] Mobile 360px: logo, botão de plano e toggle cabem sem quebrar

**Verificação:**
- [x] `npm run build` passa
- [x] Manual: screenshot desktop e 360px

**Dependências:** Task 3
**Arquivos:** `src/app/dashboard/DashboardLayoutClient.js`
**Tamanho:** XS

### Checkpoint: Fase 2
- [x] Build limpo, todas as abas abrem, cores iguais às de antes

## Fase 3: Abas (só classes de raio/espaçamento/borda; cores e lógica intocadas)

> **Feito (2026-10-09):** `rounded` (4px) → `rounded-lg` em todas as abas (Tasks 5–9 de uma vez,
> 72 trocas, diff só de raio). Build ok; modal de categoria e abas conferidos no app.
> **Não feito:** padronizar padding/borda — as abas já estão próximas entre si; só vale se aparecer algo concreto.

### Task 5: Aba Cardápio
**Descrição:** Uniformizar cards, inputs e botões de `Menu.jsx` e `MenuItems.jsx` (raio, padding, borda).

**Critérios de aceite:**
- [x] Cards e inputs com o mesmo raio (padding não mexido)
- [ ] Criar/editar/excluir item continua funcionando

**Verificação:** `npm run build`; manual: CRUD de um item + screenshot claro/escuro
**Dependências:** Checkpoint Fase 2
**Arquivos:** `src/app/dashboard/tabs/Menu.jsx`, `src/app/dashboard/tabs/components/menu/MenuItems.jsx`
**Tamanho:** S

### Task 6: Aba Pedidos
**Descrição:** Mesmo tratamento em `Orders.jsx` e `OrdersFilter.jsx`.

**Critérios de aceite:**
- [ ] Cards de pedido e filtros consistentes com a aba Cardápio
- [ ] Mudar status de pedido e filtrar continuam funcionando

**Verificação:** `npm run build`; manual: filtrar e mudar status de um pedido
**Dependências:** Task 5
**Arquivos:** `src/app/dashboard/tabs/Orders.jsx`, `src/app/dashboard/tabs/components/orders/OrdersFilter.jsx`
**Tamanho:** S

### Task 7: Abas Vendas
**Descrição:** Mesmo tratamento em `Sales.jsx`, `SalesDashboard.jsx` e componentes de `sales/`.

**Critérios de aceite:**
- [ ] Cards de resumo e gráficos consistentes; gráficos redimensionam com a sidebar recolhida/expandida

**Verificação:** `npm run build`; manual: screenshot com a sidebar nos dois estados
**Dependências:** Task 5
**Arquivos:** `src/app/dashboard/tabs/Sales.jsx`, `src/app/dashboard/tabs/SalesDashboard.jsx`, `src/app/dashboard/tabs/components/sales/*`
**Tamanho:** M

### Task 8: Configurações do cardápio
**Descrição:** Mesmo tratamento em `ConfigMenu.jsx`.

**Critérios de aceite:**
- [ ] Seções e inputs consistentes; salvar configurações continua funcionando

**Verificação:** `npm run build`; manual: alterar e salvar um campo
**Dependências:** Task 5
**Arquivos:** `src/app/dashboard/tabs/ConfigMenu.jsx`
**Tamanho:** S

### Task 9: Mesas, Conta e Plano
**Descrição:** Mesmo tratamento em `Tables.jsx`, `Account.jsx`, `PlanDetails.jsx`.

**Critérios de aceite:**
- [ ] Visual consistente com as outras abas; ações de cada aba funcionando

**Verificação:** `npm run build`; manual: screenshot das 3 abas
**Dependências:** Task 5
**Arquivos:** `src/app/dashboard/tabs/Tables.jsx`, `src/app/dashboard/tabs/Account.jsx`, `src/app/dashboard/tabs/PlanDetails.jsx`
**Tamanho:** S

### Checkpoint: Completo
- [x] `npm run build` limpo (lint quebrado no Next 16)
- [ ] Todas as abas: desktop/mobile, claro/escuro, sidebar recolhida/expandida
- [ ] Nenhuma cor alterada (`git diff | grep -E '#[0-9a-fA-F]{3,8}|bg-|text-'` revisado)
- [x] `graphify update .`
- [ ] Pronto pra revisão
