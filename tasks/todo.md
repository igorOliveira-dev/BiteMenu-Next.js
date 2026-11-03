# Todo: nova identidade visual no painel e no resto do site

Decisões, tokens e regras de troca estão em `tasks/plan.md`.

O projeto não tem testes automatizados e o lint está quebrado no Next 16. Em toda task, a verificação é:
- `npm run build` passa
- Screenshots com a skill `run-bitemenu` em 1440px e 390px, nos temas claro e escuro
- `git diff` só mostra `className` e cor em `style`, sem lógica ou texto
- `graphify update .` no fim

Cada task lista só a checagem manual específica. Critério comum a partir da Task 4: nenhum `blue-*` ou `#155dfc`
restante nos arquivos da task.

## Fase 1: Base e shell

### Task 1: Tokens e fonte globais
**Descrição:** Trocar os valores em `:root`, no bloco `prefers-color-scheme` e em `[data-theme]` pela tabela do plano.
`.bg-translucid` usa `--brand-surface`. Jakarta no `body`; `body:has(.public-menu)` mantém Arial. Adicionar `.public-menu`
em `menu/[slug]/page.jsx` e na prévia. Atualizar o comentário da fonte em `layout.js`.

**Critérios de aceite:**
- [x] Painel, login e modais em portal usam fundo creme e Jakarta nos dois temas
- [x] Landing V2 sem diferença visual, exceto 3px de largura útil no mobile (2 quebras de linha) e o banner de cookies
- [ ] `/menu/[slug]` igual no layout padrão, fonte Arial confirmada no body; faltam os outros 2 layouts e abrir o carrinho

**Verificação manual:** comparar antes e depois de landing e cardápio público; procurar `.bg-translucid` sobre imagem.

**Dependências:** nenhuma
**Arquivos:** `src/app/globals.css`, `src/app/layout.js`, `src/app/menu/[slug]/page.jsx`, `src/app/menu/[slug]/preview/page.jsx`, `src/app/dashboard/tabs/Menu.jsx`
**Tamanho:** M

### Task 2: Botões, controles e modais globais
**Descrição:** `.cta-button` em pílula e sem `scale` no hover em todo o site. Remover o brilho de `.glow-red`. Ajustar
`.custom-gray-button`, `.switch` (`#de4a4a` → vermelho da marca), `.pulse-btn` (azul → vermelho), `.default-h1` (peso 800
e tracking da marca) e `.bg-translucid-50`. Azul de `ConfirmModal` → `cta-button`; `GenericModal` com `rounded-2xl`.

**Critérios de aceite:**
- [x] Nenhum glow ou azul nos componentes globais
- [x] Branco sobre vermelho em botões; vermelho legível nos dois temas
- [ ] Tela de impressão de pedido inalterada (CSS de impressão não foi alterado; não testado na prática)

**Verificação manual:** abrir modal de confirmação, alerta, banner de cookies e switch; gerar uma impressão de pedido.

**Dependências:** Task 1
**Arquivos:** `src/app/globals.css`, `src/components/ConfirmModal.jsx`, `src/components/GenericModal.jsx`, `src/components/CookieBanner.jsx`, `src/providers/AlertProvider.jsx`
**Tamanho:** M

### Task 3: BrandLogo e shell do painel
**Descrição:** Extrair `BrandLogo` da landing para `src/components/`. Header do painel em pílula igual ao da landing
(`bg-brand-surface/85`, linha fina), com o `BrandLogo`. Sidebar e barra inferior em `bg-brand-surface` com linha fina, sem
sombra. Item ativo com o vermelho da marca. Badge de pedidos em `bg-bite`. `Dashboard.jsx` ajusta só classes.

**Critérios de aceite:**
- [x] Header, sidebar expandida, sidebar recolhida e barra mobile no novo visual
- [x] Logo sempre legível, nos dois temas
- [ ] Recolher funciona e sem overflow em 1280px; falta ver o badge de pedidos (fake sem pedidos)

**Verificação manual:** navegar por todas as abas com a sidebar nos dois estados.

**Dependências:** Task 2
**Arquivos:** `src/components/BrandLogo.jsx` (novo), `src/app/landingPage/LandingPageV2.jsx`, `src/app/dashboard/DashboardLayoutClient.js`, `src/app/dashboard/Dashboard.jsx`, `src/components/ThemeToggle.jsx`
**Tamanho:** M

### Checkpoint 1: revisão visual
- [x] `npm run build` limpo
- [ ] Screenshots de todas as abas, nos dois temas (feitos: Cardápio, Pedidos, Vendas, Mesas, Conta, configuração, sem cobertura completa do escuro)
- [ ] Valores derivados ajustados, se preciso
- [ ] **Sua aprovação antes da Fase 2**

## Fase 2: Abas do painel

### Task 4: Aba Cardápio
**Descrição:** Aplicar as regras de troca na UI do painel: barra direita, modais de item e categoria, QR Code e banner.
Não mexer em nada que use as cores do dono na prévia. Trocar o `bg-translucid-50` e o `pulse-btn` onde houver.

**Critérios de aceite:**
- [x] Controles do painel no novo visual; prévia com as mesmas cores e fonte do cardápio real
- [ ] Barra direita continua recolhendo, com popover de cores funcionando
- [ ] Criar, editar e salvar item continuam funcionando

**Verificação manual:** prévia e `/menu/[slug]` lado a lado, com um cardápio de fundo claro e outro escuro.

**Dependências:** Checkpoint 1
**Arquivos:** `src/app/dashboard/tabs/Menu.jsx`, `src/app/dashboard/tabs/components/menu/MenuItems.jsx`, `src/app/dashboard/tabs/components/menu/QrCodeModal.jsx`, `src/app/dashboard/tabs/components/menu/BannerCropper.jsx`
**Tamanho:** M

### Task 5: Configurar cardápio
**Descrição:** Aplicar as regras de troca em `ConfigMenu.jsx` e nos estados de edição do `StatesManager.jsx`.

**Critérios de aceite:**
- [x] Formulários e seções no novo visual
- [ ] `HexColorPicker` e cores do dono inalterados; salvar funciona

**Verificação manual:** alterar uma configuração, salvar e recarregar.

**Dependências:** Checkpoint 1
**Arquivos:** `src/app/dashboard/tabs/ConfigMenu.jsx`, `src/app/dashboard/StatesManager.jsx`
**Tamanho:** S

### Task 6: Pedidos, cozinha e entrega
**Descrição:** Aplicar as regras de troca em Orders, filtros, cozinha e entrega, incluindo `/equipe`. Cores de status
continuam distintas e legíveis.

**Critérios de aceite:**
- [ ] Status de pedido reconhecíveis de relance, nos dois temas (azul trocado; não visto, ambiente de teste sem pedidos)
- [x] Filtro ativo e ações principais no vermelho da marca
- [ ] Impressão de pedido inalterada

**Verificação manual:** passar um pedido por todos os status; abrir cozinha e entrega no painel e em `/equipe`.

**Dependências:** Checkpoint 1
**Arquivos:** `src/app/dashboard/tabs/Orders.jsx`, `src/app/dashboard/tabs/components/orders/OrdersFilter.jsx`, `src/app/equipe/page.jsx`, `src/app/equipe/Kitchen.jsx`, `src/app/equipe/Delivery.jsx`
**Tamanho:** M

### Task 7: Vendas e gráficos
**Descrição:** Aplicar as regras de troca em Sales e SalesDashboard. Trocar as cores dos gráficos por uma sequência da
paleta (vermelho, granada, brasa e neutros), carregando a skill `dataviz` antes.

**Critérios de aceite:**
- [x] Sem azul, roxo ou índigo nos gráficos
- [ ] Séries distinguíveis, com legenda legível nos dois temas
- [ ] Gráficos redimensionam com a sidebar nos dois estados

**Verificação manual:** ver os gráficos com dados e sem dados.

**Dependências:** Checkpoint 1
**Arquivos:** `src/app/dashboard/tabs/Sales.jsx`, `src/app/dashboard/tabs/SalesDashboard.jsx`, `src/app/dashboard/tabs/components/sales/SalesCharts.jsx`, `src/app/dashboard/tabs/components/sales/SalesSummary.jsx`
**Tamanho:** M

### Task 8: Mesas, Estoque, Equipe, WhatsApp e Conta
**Descrição:** Aplicar as regras de troca nas abas menores.

**Critérios de aceite:**
- [x] As 5 abas no novo visual
- [ ] Ações principais de cada aba continuam funcionando

**Verificação manual:** abrir cada aba e executar uma ação em cada.

**Dependências:** Checkpoint 1
**Arquivos:** `src/app/dashboard/tabs/Tables.jsx`, `src/app/dashboard/tabs/Stock.jsx`, `src/app/dashboard/tabs/Team.jsx`, `src/app/dashboard/tabs/WhatsappMessage.jsx`, `src/app/dashboard/tabs/Account.jsx`
**Tamanho:** M

### Task 9: Planos e avisos de upgrade
**Descrição:** Aplicar as regras de troca e remover o `glow-red` dos avisos de plano. Só visual: **nada de checkout,
assinatura ou lógica da ValidaPay**. Incluir `dashboard/pricing` e os modais do `PlanDetails`.

**Critérios de aceite:**
- [x] Planos no mesmo padrão da landing, sem glow
- [x] `git diff` sem alteração em chamadas de pagamento, valores ou condições
- [ ] Fluxo até o checkout abre igual a antes

**Verificação manual:** clicar em assinar até a tela do checkout, sem concluir.

**Dependências:** Checkpoint 1
**Arquivos:** `src/app/dashboard/tabs/PlanDetails.jsx`, `src/components/PlansSection.jsx`, `src/app/dashboard/components/UpsellBanner.jsx`, `src/app/dashboard/components/PlanLockNotice.jsx`, `src/app/dashboard/tabs/components/UpdatePlanModal.jsx`
**Tamanho:** M

### Checkpoint 2: painel completo
- [x] `npm run build` limpo
- [x] `grep -rE 'blue-[0-9]|#155dfc' src/app/dashboard` só retorna exceções justificadas
- [ ] Modais restantes do painel conferidos (`AcquisitionSourceModal`, `LegacyPlanModal`, `PrivacyAcceptModal`, `AiAssistant`)
- [ ] Sua revisão

## Fase 3: Resto do site

### Task 10: Login, cadastro e senha
**Descrição:** Tela em `brand-card` sobre o creme, com `BrandLogo` e `cta-button`. Só classes: **nada de autenticação**.

**Critérios de aceite:**
- [x] As 4 telas no novo visual; logo legível
- [ ] Login, cadastro e recuperação funcionam como antes
- [ ] Mensagens de erro continuam legíveis

**Verificação manual:** login válido e inválido; abrir as telas de cadastro e de recuperação.

**Dependências:** Task 3
**Arquivos:** `src/app/login/page.jsx`, `src/app/register/page.jsx`, `src/app/recuperar-senha/page.tsx`, `src/app/update-password/page.tsx`
**Tamanho:** S

### Task 11: Onboarding e pesquisa de perfil
**Descrição:** Trocar `#155dfc` e `bg-blue-*` pelo vermelho em `getstart`: etapas, seleção e botões. Verde de etapa
concluída continua. Aplicar o mesmo à pesquisa de perfil.

**Critérios de aceite:**
- [ ] Todas as etapas sem azul (código conferido; tela não vista, o usuário de teste é redirecionado)
- [ ] Criar um cardápio do início ao fim funciona

**Verificação manual:** percorrer todas as etapas nos dois temas, em 390px.

**Dependências:** Task 3
**Arquivos:** `src/app/getstart/page.jsx`, `src/app/dashboard/pesquisa-de-perfil/` (página)
**Tamanho:** S

### Task 12: Páginas institucionais
**Descrição:** Usar `BrandLogo`, `brand-eyebrow`, `brand-title` e `brand-card` da landing nas páginas públicas.

**Critérios de aceite:**
- [ ] As 5 páginas no padrão da landing (só cores, raio e logo; /downloads não vista)
- [x] Sem degradê ou glow fora de faixas grandes

**Verificação manual:** abrir cada página.

**Dependências:** Task 3
**Arquivos:** `src/app/about/page.jsx`, `src/app/faqs/page.jsx`, `src/app/support/page.jsx`, `src/app/pricing/page.jsx`, `src/app/downloads/page.tsx`
**Tamanho:** M

### Task 13: Páginas legais e de erro
**Descrição:** Aplicar logo, tipografia e links na cor da marca, mantendo os textos intactos.

**Critérios de aceite:**
- [x] Termos, privacidade, descadastro e 404 no novo visual
- [x] Textos legais sem nenhuma alteração

**Verificação manual:** abrir as 5 telas; `git diff` não toca no texto legal.

**Dependências:** Task 3
**Arquivos:** `src/app/termos-de-uso/page.jsx`, `src/app/politica-de-privacidade/page.jsx`, `src/app/descadastro/page.jsx`, `src/app/not-found.jsx`, `src/app/menu/NotFoundMenu.jsx`
**Tamanho:** S

### Task 14: Documentação
**Descrição:** Aplicar o novo visual no layout e nas páginas de `/docs`. O layout tem toggle de tema próprio: manter a
lógica, ajustar só o visual.

**Critérios de aceite:**
- [x] Layout e páginas sem azul; links legíveis nos dois temas
- [ ] Navegação da documentação funciona em desktop e mobile

**Verificação manual:** navegar por todas as seções.

**Dependências:** Task 3
**Arquivos:** `src/app/docs/layout.tsx`, `src/app/docs/page.tsx`, `src/app/docs/*/page.tsx`
**Tamanho:** M

### Task 15: Admin
**Descrição:** Tela interna: trocar só azul, hex soltos e bordas. Sem polimento além disso.

**Critérios de aceite:**
- [ ] Admin sem azul no código; tela não vista (usuário de teste sem acesso)
- [ ] Filtros e ações continuam funcionando

**Verificação manual:** abrir cada subpágina do admin.

**Dependências:** Task 3
**Arquivos:** `src/app/admin/page.jsx`, subpáginas em `src/app/admin/`
**Tamanho:** S

### Task 16: Rodapé do cardápio e manifest do PWA
**Descrição:** Em `MenuFooter`, usar o logo em vermelho sólido, ou monocromático quando o fundo não der contraste. No
manifest, `background_color` e `theme_color` passam para a paleta (`#fbf5ef` e `#d42020`). O ícone só muda se o arquivo
atual não seguir a logo aprovada.

**Critérios de aceite:**
- [x] Logo legível em cardápio de fundo claro, escuro e vermelho
- [ ] Resto do cardápio público idêntico, nos 3 layouts
- [ ] PWA abre com as cores novas

**Verificação manual:** rodapé com 3 fundos diferentes; conferir o manifest servido.

**Dependências:** Task 1
**Arquivos:** `src/app/menu/[slug]/components/MenuFooter.jsx`, `src/app/manifest.ts`
**Tamanho:** XS

### Checkpoint 3: completo
- [x] `npm run build` limpo
- [x] Busca final por `blue-[0-9]`, `#155dfc`, `glow-red` e `#060606` em `src`, fora de `LandingPageV1`
- [ ] Todas as rotas com screenshot em 1440px e 390px, nos dois temas
- [ ] `graphify update .`
- [ ] Sua revisão final
