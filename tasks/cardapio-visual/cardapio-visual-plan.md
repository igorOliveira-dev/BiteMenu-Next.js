# Plano: identidade visual nos elementos do cardápio público

## Visão geral
Os 3 layouts do cardápio (`/menu/[slug]`), o carrinho e os modais deles passam a usar os elementos visuais do
Bite Menu: Plus Jakarta Sans, cantos arredondados, botões em pílula, linhas finas e nada de brilho ou zoom em botão.

**Não muda:**
- A organização de cada layout: ordem, grade, posição, tamanhos de imagem e quantidade de colunas.
- As cores que o dono escolheu e as que derivam delas: `background_color`, `details_color`, `foregroundToUse`,
  `grayToUse` e `translucidToUse`.
- Textos, lógica do carrinho, pedidos, Pix e Supabase.

Isso substitui a decisão anterior (`tasks/identidade-visual/plan.md`) de manter Arial e o visual antigo no cardápio
público. A prévia no painel usa os mesmos componentes e acompanha a mudança.

## Como está hoje (lido no código)
- Layouts: `ClientMenu.jsx` (1), `ClientMenu2.jsx` (2) e `ClientMenu3.jsx` (3), com cerca de 1.200 linhas cada, mais
  `components/CartDrawer.jsx` (2.200), `MyOrdersModal.jsx` e `VariationPicker.jsx`.
- Fonte: `globals.css:213-222` força Arial em `body:has(.public-menu)` e `.menu-font`.
- Formas: quase tudo usa `rounded` ou `rounded-lg` (cards, botões e inputs). Há `border-2` na busca, `border-y-2` nas
  abas de categoria, `border-4` e `border-2` no logo dos layouts 2 e 3, e `shadow-[0_0_20px]` com `hover:scale-110` no
  botão flutuante do carrinho.
- Cores fixas que não são do dono: os botões − e + de quantidade (`bg-red-500` e `bg-green-500`) nos 3 layouts e o
  botão remover do carrinho (`bg-red-600`).

## Regras de troca (só `className`)
| Hoje | Vira |
|---|---|
| Arial no cardápio e na prévia | Jakarta (apagar a regra de `globals.css:213-222`) |
| Card de item ou destaque (`rounded-lg`, `rounded-xl`) | `rounded-2xl` |
| Imagem de item e logo quadrado (`rounded-lg`) | `rounded-xl` |
| Botões: adicionar, carrinho flutuante, finalizar, Pix, cupom, cancelar (`rounded`, `rounded-lg`) | `rounded-full` |
| Inputs, busca e textarea (`rounded`, `rounded-lg`) | `rounded-xl` |
| Modal do carrinho (`rounded-lg`) | `rounded-2xl` |
| `border-2`, `border-y-2`, `border-4` em busca, abas e logo | `border`, `border-y`, `border-2` |
| Carrinho flutuante com `shadow-[0_0_20px]` e `hover:scale-110` | sem sombra e sem escala no hover; o pulo ao adicionar item (`animateCart`) fica |
| − e + em vermelho e verde fixos | pílula com contorno (`border`), na cor de texto do dono |
| Remover item em `bg-red-600` | contorno; fica vermelho só no hover (regra "Excluir é cinza") |
| Nome da loja `font-bold` | `font-extrabold tracking-tight` (peso da marca), mesmo tamanho |

O que continua igual: os tamanhos de texto, os espaçamentos, as imagens de banner e foto, o zoom suave das fotos de
item (é foto, não botão) e o checkbox redondo do checkout.

## Tarefas
Detalhes em `tasks/cardapio-visual/cardapio-visual-todo.md`.

- [x] Task 1: Fonte do cardápio e da prévia
- [x] Task 2: Layout 1 (`ClientMenu.jsx`)
- [ ] **Checkpoint 1: sua revisão do layout 1 antes de repetir nos outros**
- [x] Task 3: Layout 2 (`ClientMenu2.jsx`)
- [x] Task 4: Layout 3 (`ClientMenu3.jsx`)
- [x] Task 5: Carrinho e checkout (`CartDrawer.jsx`)
- [x] Task 6: Modais menores e `.md`
- [ ] **Checkpoint 2: completo**

## Riscos
| Risco | Impacto | Mitigação |
|---|---|---|
| É a tela que o cliente final do dono vê | Alto | Checkpoint 1 antes de repetir nos outros layouts; o diff só pode ter `className` |
| Jakarta é mais larga que Arial: nome da loja e preços podem quebrar | Médio | Os `line-clamp` já existem; conferir em 320px e 390px |
| Pílula em botão de largura total parece estranha | Baixo | Mesmo padrão do `/login`, que já usa `w-full rounded-full` |
| − e + com contorno ficam menos visíveis que os botões cheios | Baixo | A borda usa a cor do texto do dono, que já tem contraste com o fundo |
| Arquivos grandes e três layouts quase iguais | Médio | A mesma tabela de troca nos três; conferir com `grep` no fim |

## Decisões tomadas depois
- Fonte trocada para Jakarta e − / + com contorno na cor do texto do dono (resposta sua).
- Fundo semitransparente atrás dos itens: testado em volta da lista e na largura do banner; removido a pedido.
- Barra de categorias no estilo da barra lateral do painel: itens `rounded-xl`, `gap-1`, vidro leve
  (tom do dono a ~5%, borda fina, `backdrop-blur-sm`) e hover no tom translúcido do dono; texto no tamanho de antes. Sem item ativo, porque a barra não acompanha a rolagem (exigiria lógica nova).
- O Checkpoint 1 foi pulado: você pediu para executar tudo de uma vez.
- O realce verde fixo (`#16a34a`) dos adicionais selecionados continua como está.
- Logo e nome do estabelecimento um degrau maiores nos 3 layouts (logo ~20%, nome +1 tamanho de texto); a imagem do
  logo passou a ser pedida em 200px para não perder nitidez.

## Perguntas em aberto (respondidas)
- **Fonte:** Jakarta no cardápio.
- **− e +:** contorno na cor do texto do dono.

O estado final está em `tasks/cardapio-visual/cardapio-visual-resumo.md`.
