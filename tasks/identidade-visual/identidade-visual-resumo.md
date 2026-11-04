# Nova identidade visual: o que foi feito

Aplicação no site e no painel do design definido no alinhamento visual da Duda Herber (novembro de 2026), usando a
`LandingPageV2` como referência. O plano original está em `tasks/identidade-visual/plan.md` e o acompanhamento em `tasks/identidade-visual/todo.md`.

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

### Papel de cada cor no painel

| Cor | Papel | Exemplos |
|---|---|---|
| Vermelho `bite` | Assinar plano e o que pede atenção agora | Assinar/melhorar plano (`cta-button`), Fechar loja, badge de pedidos novos, erro |
| Granada (`brand-select`, `brand-eyebrow`) | O que está escolhido e a estrutura | Seleções, filtros ativos, foco de campo, títulos de seção, tags de plano, links |
| Brasa | Calor e IA (só ícone) | Ícone da varinha do Bite Menu IA |
| Azul `info` (`#2C64A5` claro, `#8DB7F0` escuro) | Informação e andamento, onde vermelho/laranja pareceria alerta | Status em andamento, horário de pico, novidade, aviso de assinatura cancelada, barra de uso da IA |
| Verde `verde` `#2F7D4E` | Confirmar e concluir | Salvar, Confirmar, Aplicar, Imprimir, Finalizar, Pronto, Entregue, Abrir loja |
| Azul `azul` `#2C64A5` | Criar, compartilhar, avançar etapa e visualizar | Todo botão com "+" (cheio na tela, contorno azul dentro de modal), Opções de compartilhamento, Copiar link, Começar preparo, Saí para entrega, Novo pedido, Ver preview |
| Mostarda `mostarda` `#E3A41F` (texto grafite) | Resolver algo pendente | Pagar |
| Degradê | Só em faixas e destaques grandes | Item ativo da barra lateral (a pedido), faixa do Assistente de IA |
| Grafite e creme | Base neutra | Texto, superfícies, botões secundários com contorno |

- Um bloco tem no máximo um botão vermelho. Os demais ficam com contorno (`border-brand-line`).
- Ação que se repete em cada cartão nunca é vermelha: numa lista de 20 pedidos, viraria um mar de vermelho. Ela usa a
  cor do que faz (verde conclui, azul avança, mostarda resolve pendência).
- Ações auxiliares dentro de um modal (+ Opção, + Grupo, + Adicionar item) ficam com contorno, ao lado do Salvar verde.
- Verde, azul e mostarda são fixos nos dois temas porque são fundos de botão com texto; todos passam de 4,5:1.
- Excluir é cinza e só fica vermelho no hover.
- Botão de confirmar/salvar/enviar nunca é vermelho: verde. O modal `confirm()` é vermelho por padrão (remoções) e
  verde com `confirm(msg, { tone: "confirm" })`, usado em finalizar pedido, salvar alterações, criar cardápio, trocar
  forma de pagamento, ocultar/exibir opção, descartar alterações não salvas e desistir da exclusão. Vermelho só
  em confirmação destrutiva (remover, excluir, cancelar assinatura ou boleto, sair).
- Botão secundário é sempre contorno fino (`border-brand-line`, fundo transparente), em pílula. Nada de fundo bege
  (`bg-low-gray`); `.custom-gray-button` segue esse padrão.
- Botão sobre foto (câmera no banner e no logo) é vidro escuro: `bg-black/55 backdrop-blur-sm`, igual ao selo "Loja aberta".
- Títulos de aba são `h2` sem classe de tamanho (26px). Títulos de cartão usam `h3` com `text-base`, que agora vale porque
  o tamanho global de `h2`/`h3` está em `@layer base`.
- Títulos de seção em texto normal com ícone em granada; caixa alta só em rótulos pequenos de dado (`text-xs`).
- Controles do painel dentro da prévia levam `panel-font`, pra não herdar a Arial do cardápio.
- `brand-select` é `#7b1730` no claro e `#a3243f` no escuro, onde o granada puro some. Em texto pequeno, use
  `text-brand-eyebrow`.
- Brasa entra em ícones e texto grande; em texto pequeno sobre creme o contraste fica abaixo de 4,5:1.
- No `/admin`, a borda do cartão de cada cardápio mostra o plano do dono: plus `border-2 border-verde`, pro
  `border-4 border-azul`, business `border-6 border-brasa`. Admin continua vermelho, free sem destaque.

### Cores de estado (fora da identidade, de propósito)

A identidade veste a interface; a situação do pedido e do pagamento usa cores que o cliente já entende. Tokens
`st-*` em `globals.css`, com tom próprio no claro e no escuro (texto acima de 4,5:1 nos dois). Status de pedido em
`ORDER_STATUS_STYLE` e pago/pendente em `paidPillClass`, ambos em `src/lib/staff.js`.

| Token | Significado | Uso |
|---|---|---|
| `info` (azul) | Em andamento | Preparando, Saiu para entrega |
| `st-done` (verde) | Concluído, dinheiro entrou | Pronto, Pago, Total pago, botão Pagar |
| `st-wait` (âmbar) | Aguardando | Recebido, Pendente, Não pago, avisos |
| cinza | Finalizado | Entregue |

Botões verdes cheios (Pronto, Entregue, Abrir loja) seguem em `green-600`, porque o verde claro do tema escuro não
comporta texto branco.

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

### Gráficos

- Paleta `--chart-1..5` em `globals.css`, em ordem fixa e com tons próprios no claro e no escuro, validada pelo
  `validate_palette.js` da skill de dataviz (faixa de luminosidade, saturação, daltonismo e contraste): laranja,
  verde-azulado, mostarda, azul, vinho. O hook `useChartColors` lê as variáveis e redesenha ao trocar de tema.
- A cor segue a categoria, não a posição: Pix, Crédito, Dinheiro, Débito, Stripe; Entrega, Retirada, Comer no local,
  Atendimento presencial.
- Faturamento e produtos mais vendidos usam `--chart-4` (azul). Laranja e vermelho não entram em série única: leem como alerta. Um eixo só por gráfico; a quantidade de vendas
  aparece no tooltip.
- Números de cartões (total, quantidade, ticket) usam a cor de texto; a cor fica só na variação (↑ verde, ↓ vermelho).
