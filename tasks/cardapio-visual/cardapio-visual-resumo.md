# Cardápio público e landing: o que foi feito

Identidade visual do Bite Menu aplicada aos elementos do cardápio público (`/menu/[slug]`) e o botão "Entrar" no navbar
da landing. Planos: `tasks/cardapio-visual/cardapio-visual-plan.md` e `tasks/landing-login/landing-login-plan.md`.

**Regra geral:** a organização de cada layout (ordem, grade, colunas) e as cores escolhidas pelo dono
(`background_color`, `title_color`, `details_color` e os tons derivados `foregroundToUse`, `grayToUse`,
`translucidToUse`) não mudaram. Só os elementos seguem a marca.

## Landing (`LandingPageV2.jsx`)
- Navbar: o visitante vê "Entrar" (pílula `bg-verde`, ícone `FaUser`, vai para `/login`) no lugar de "Criar cardápio
  grátis". O CTA de criar continua no hero e no fim da página. Dono logado segue com "Acessar cardápio"; cliente
  logado, com `CustomerMenu`.

## Cardápio público (3 layouts, carrinho e modais)
| Elemento | Agora |
|---|---|
| Fonte | Plus Jakarta Sans (a regra que forçava Arial saiu de `globals.css`); vale também para a prévia no painel |
| Logo e nome do estabelecimento | um degrau maiores (logo ~20%, nome +1 tamanho de texto, `font-extrabold tracking-tight`); logo pedido em 200px |
| Títulos de categoria | `text-lg font-extrabold tracking-tight` |
| Barra de categorias | estilo da barra lateral do painel: itens `rounded-xl` com `gap-1`, vidro leve (`--nav-glass`: tom do dono a ~5%, borda fina, `backdrop-blur-sm`) e hover em `--nav-hover` (`translucidToUse`); linha fina (`border-y`) |
| Cards de item e destaques | `rounded-2xl`; fotos `rounded-xl` |
| Busca e campos | busca em pílula; inputs e textarea `rounded-xl` |
| Botões (Adicionar, Carrinho, Finalizar, Pix, cupom, Cancelar) | pílula (`rounded-full`) |
| Botão flutuante do carrinho | sem sombra e sem zoom no hover; o pulo ao adicionar item continua |
| − e + de quantidade | contorno na cor de texto do dono, no lugar de vermelho e verde fixos |
| Remover item do carrinho | contorno; vermelho só no hover |
| Modal do carrinho, lista de endereços, QR do Pix | `rounded-2xl` / `rounded-xl`, linha fina no lugar de sombra |
| Foco do telefone no carrinho | `focus:ring-current` (cor do texto do dono) no lugar de azul |
| `VariationPicker`, `MyOrdersModal` | raios maiores; borda de 2px virou 1px |

## Testado e descartado
- Fundo semitransparente envolvendo a lista de itens e, depois, na largura do banner do topo ao fim. Removido a pedido.

## Não feito / pendente
- Item ativo na barra de categorias: a barra não acompanha a rolagem; precisaria de lógica nova (preencheria com o
  `details_color` do dono).
- O desfoque do vidro quase não aparece, porque a barra tem fundo sólido do dono.
- O realce verde fixo (`#16a34a`) dos adicionais selecionados continua.
- Não conferido no navegador: os 3 layouts em 320px, 390px e 1440px, com cardápio claro e escuro e o carrinho aberto;
  a prévia no painel; o navbar da landing nos três estados de login. Só o `npm run build` foi verificado.
- `graphify update .` não rodou (comando não instalado nesta máquina).
