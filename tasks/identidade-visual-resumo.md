# Nova identidade visual: o que foi feito

Aplicação no site e no painel do design definido no alinhamento visual da Duda Herber (novembro de 2026), usando a
`LandingPageV2` como referência. O plano original está em `tasks/plan.md` e o acompanhamento em `tasks/todo.md`.

## Commits (branch `dev`)

| Commit | Conteúdo |
|---|---|
| `ef09d92` | Fase 1: base visual e shell do painel |
| `019c277` | Fase 2: abas do painel |
| `42f38c9` | Fase 3: restante do site |
| `cdec097` | Plano, tarefas e arquivamento do plano da barra direita |

## Decisões de design

- **Paleta:** "granada e brasa" (creme `#FBF5EF`, grafite `#2A2220`, vermelho `#D42020`, granada `#7B1730`, brasa `#E35F25`).
- **Fonte:** Plus Jakarta Sans, sem itálico de destaque.
- **Modo escuro:** fundo `#1C1716`, texto vermelho `#F0605A`, botão `#D42020`.
- **Aplicação:** os valores dos tokens globais foram trocados em `globals.css`, em vez de envolver cada tela em
  `.brand-scope`. Assim a mudança também alcança modais em portal e providers do root.
- **Cores mantidas:** verde (WhatsApp e sucesso), âmbar (aviso), vermelho de erro e status, cores escolhidas pelo dono e
  CSS de impressão.
- **Cardápio público:** mantém fonte e cores atuais. Só o logo do rodapé mudou.

### Valores sem definição no PDF

| Token | Claro | Escuro |
|---|---|---|
| `--low-gray` | `#e8dfd8` | `#3a302d` |
| `--medium-gray` | `#b8aca5` | `#141010` |
| `--low-translucid` | `#2a22200a` | `#fbf5ef0a` |
| `--translucid` | `#2a22201a` | `#fbf5ef1a` |
| `--high-translucid` | `#2a222052` | `#fbf5ef52` |
| `--shadow` | `#2a222026` | `#00000066` |

## Fase 1: base e shell

- Tokens globais com a nova paleta, nos temas claro e escuro.
- Plus Jakarta Sans no `body`. O cardápio público mantém Arial com `body:has(.public-menu)`, e a prévia no painel com
  `.menu-font`. Modais abertos dentro da prévia usam a fonte do painel.
- `.bg-translucid` passou a usar a superfície da marca, exceto no cardápio público e na prévia.
- `.cta-button` em pílula, sem `scale` no hover. `.glow-red` removido.
- Switch e `.pulse-btn` no vermelho da marca. Modais, alertas e banner de cookies no novo padrão.
- `BrandLogo` extraído da landing para `src/components/BrandLogo.jsx`.
- Header do painel em pílula. Sidebar e barra mobile com linha fina.
- Item selecionado da barra lateral com o degradê da marca, a pedido. A apresentação reserva o degradê para elementos
  grandes, então este uso é uma exceção à regra.

## Fase 2: abas do painel

- Azul trocado pelo vermelho da marca em ações, filtros e seleções: Cardápio, Pedidos, Vendas, Mesas, Conta, modais e
  `/equipe`.
- Status "em preparo" e "a caminho" com borda brasa, para não se confundir com cancelado.
- Bordas finas e cinzas frios substituídos por tons quentes. Em `MenuItems.jsx`, a troca se limitou às cores azuis e aos
  botões Cancelar, para não alterar a prévia.
- Planos no padrão da landing, sem brilho e sem mudança na lógica de pagamento.
- Gráficos de vendas com `#d42020`, `#8c7566`, `#e0762f` e `#a8325a`.

## Fase 3: restante do site

- Login, cadastro, senha e onboarding sem azul.
- `/pricing`, `/about`, `/faqs`, `/support`, `/downloads`, páginas legais, `/docs` e admin com cores e bordas novas. Os
  textos legais não mudaram.
- `BrandLogo` em headers, login, cadastro, 404 e descadastro.
- Rodapé do cardápio com logo vermelho quando o contraste com o fundo é de pelo menos 3:1, ou monocromático caso
  contrário. A regra usa `contrastRatio`, adicionada a `src/utils/color.js`.
- Manifest do PWA com fundo `#fbf5ef` e tema `#d42020`.
- Removido o logo apagado atrás do card em `/support` e corrigida a sobreposição de "Bem vindo ao" no cadastro.

## Mudança desfeita

Foi feito um carrossel de planos na landing, com o plano central em destaque, setas e clique no card. Ele foi desfeito a
pedido e os planos voltaram à grade.

## Pendências

- **Sem commit:** a troca para `LandingPageV2` em `src/app/page.jsx`. Sem ela, a home continua na `LandingPageV1`.
- **Telas não abertas nos testes:** onboarding (`/getstart`), admin e `/downloads`.
- **Telas sem dados nos testes:** Pedidos com status, cozinha, entrega, badge de pedidos e gráficos preenchidos.
- **Fluxos não testados:** até o checkout e impressão de pedido.
- **Cobertura parcial:** modo escuro e mobile não foram vistos em todas as rotas. Faltam também os 3 layouts do cardápio
  em todos os fundos e o carrinho aberto.
- **Build:** só o resultado final foi compilado, antes dos commits. Os commits intermediários não foram compilados.

## Pontos em aberto

- Os gráficos não passam em todos os critérios do validador de cores: o marrom tem pouca saturação e, no modo escuro, o
  laranja fica claro demais e o vermelho e o vinho têm contraste abaixo de 3:1. As fatias continuam distinguíveis e os
  gráficos de pizza têm legenda.
- O gráfico de vendas já usava dois eixos, e isso não foi alterado.
- Ainda há azul em `CartDrawer.jsx`, no cardápio público, que ficou fora do escopo.
- O campo de telefone do cadastro fica mais cinza que os demais, por ter estilo próprio.
- `LandingPageV1.jsx` continua no projeto, com classes antigas.
- A apresentação ainda pedia feedback. A paleta e a fonte foram assumidas como aprovadas por já estarem na landing V2.
