# Layout personalizado do cardápio (Enterprise)

O dono monta o cardápio bloco por bloco, em vez de escolher um dos 3 layouts fixos. Cada bloco tem ordem,
visibilidade, estilo pelo painel (cores, espaçamento, disposição) e, no avançado, template HTML + CSS. A IA cria ou
ajusta o cardápio todo ou um bloco, sempre no mesmo padrão. Só `admin` por enquanto (`CUSTOM_LAYOUT_ROLES`).

## Como funciona
- **Dados:** `menus.custom_layout jsonb` (`{ v, font, css, blocks: [...] }`) + `menus.layout = 'custom'` para ativar.
  SQL: `layout-personalizado.sql`.
- **Blocos:** banner, cabeçalho, busca, fidelidade, barra de categorias, destaques, produtos, bloco livre
  (`BLOCK_TYPES` em `src/lib/customLayout.js`). Carrinho, modais e pedido continuam os do `MenuShell`.
- **Padrão dos templates (o que a IA segue):** `{{campo}}` (`FIELDS`), `data-if="campo"` some quando o campo está
  vazio, `data-action="hours" | "cart"` para cliques sem JS, classes `bm-*`, cores por `var(--bm-*)`. Grade/carrossel
  pelos campos `display/columns`, não por CSS.
- **Renderização:** `src/app/menu/[slug]/ClientMenuCustom.jsx`. `page.jsx` lê o layout com `getCustomLayout` só quando
  `layout = 'custom'`; dono fora do plano ou layout inválido → layout padrão (o JSON fica salvo).
- **Painel:** aba "Layout personalizado" (`src/app/dashboard/tabs/CustomLayout.jsx`), prévia ao vivo em iframe
  (`/menu/[slug]/preview?custom_draft=1`, rascunho por `postMessage` da mesma origem).
- **IA:** `src/app/api/assistant/layout/route.js`, ferramentas `update_block` (um bloco) e `set_layout` (tudo). Mesmo
  saldo de sessão (`ai_usage`) e teto mensal do Enterprise (`reserveBudget`) da landing.

## Organização e legibilidade (garantidas pelo sistema, não só pelo prompt)
- **Coluna única** (`BASE_CSS`): todo bloco, menos o banner (`.bm-full`), tem a largura da página (`pageWidth`, padrão
  1100), centralizado, com a mesma margem lateral; `!important` + seletor mais forte, então o CSS da IA não desalinha.
  O que passa da borda é cortado; a barra de categorias (`.bm-nav`) rola de lado. Cada produto fica na própria célula.
- **Cores** (`layout.colors` = fundo, texto, destaque): `layoutPalette` deriva texto secundário, linhas, fundo suave e
  texto sobre o destaque. Texto vazio = automático legível. Fundo de seção sem cor de texto também fica legível.
- **Contraste da IA** (`fixContrast`, só no que a IA gera): texto abaixo de 4,5:1 vira preto/branco (variáveis, fundo
  das seções e regras CSS com background + color). Só cores sólidas.
- **Produto em destaque** (`featured`, só na grade): 2x2 com 3+ colunas, linha inteira com 2, normal com 1. A IA não
  pode posicionar na grade pelo CSS (`grid-column/row` removidos), porque isso deixava cartões vizinhos inflados.

## Painel (aba Layout personalizado)
Modelo de editor de tema (Shopify/Wix): lista à esquerda (Tema + seções: ordem, esconder, remover, adicionar) e
painel do item à direita com **Configurações | Código** (HTML/CSS sempre disponível) e um campo de IA no topo.
Barra superior: status, Visualizar, Publicar e menu "⋯" (abrir cardápio, descartar, recomeçar, tirar do cardápio).
Prévia só ao clicar em Visualizar. No celular, lista e painel se alternam (botão voltar).

## Segurança
O cardápio roda na origem do bitemenu, com a sessão dos clientes (a landing usa CSP sandbox; aqui não dá, o cardápio
precisa de JS). A barreira é `cleanLayout`, aplicado no servidor (page.jsx) e na prévia:
- HTML por lista branca **reconstruído** (tags/atributos da lista, valores sempre entre aspas e escapados, tags
  balanceadas para não vazar do bloco). `src`/`href` só `https:`, `tel:`, `mailto:`, `#` ou campo de URL.
- Valores dos `{{campos}}` escapados no `fill`, depois da limpeza.
- CSS sem `<`, `\`, `@import`, `expression`; `url()` só https/data:image; cada bloco aninhado no próprio seletor.
- Self-check: `node scripts/custom-layout-check.mjs` (vetores de XSS conhecidos).

## Fora do escopo / depois
- Enterprise: `"enterprise"` já está em `CUSTOM_LAYOUT_ROLES`; libera sozinho quando o plano existir.
- Arrastar seções (hoje ▲▼), clicar na prévia para selecionar a seção, histórico de versões, mais tipos de seção.
- Última linha da grade incompleta deixa célula vazia (esticar o último cartão incharia os vizinhos da linha).
