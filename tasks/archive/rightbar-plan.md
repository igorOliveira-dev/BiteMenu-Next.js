# Plano: barra lateral direita recolhível (aba Cardápio)

## Visão geral
Aplicar na barra direita da aba Cardápio a mesma ideia da sidebar esquerda: um botão de recolher e,
recolhida, uma coluna estreita só com ícones. Recolhida, ela mostra de cima pra baixo:
1. botão de compartilhar → só o ícone (`FaQrcode`, o mesmo de hoje), abre o `QrCodeModal`
2. as 3 cores → só os quadrados; clicar abre um **popover** com o seletor ao lado (à esquerda), sem expandir a barra
3. no fim, configurações → só o ícone (`FiSettings`), vai pra `configMenu`

Só desktop (`lg+`); no mobile a barra direita já não aparece. Fora do escopo: Supabase, pagamento, outras abas.

## Como está hoje (lido no código)
- `src/app/dashboard/tabs/Menu.jsx:511` — `<aside>` `fixed right-0`, largura `w-[calc(30dvw-36px)]`,
  com três blocos: Compartilhar (`section`), Cores (`section` com lista que abre `HexColorPicker` inline,
  controlada por `openColorIdx` + `colorListRef` com clique-fora já pronto) e o botão "Configurar cardápio" (`mt-auto`).
- O preview do cardápio ao lado usa `lg:w-[calc(100%-30dvw+16px)]` (`Menu.jsx:394`) → precisa acompanhar a largura recolhida.
- `FaChevronLeft` já está importado em `Menu.jsx`.
- Sidebar esquerda (`src/app/dashboard/Dashboard.jsx`) é a referência de estilo: `collapsed` em
  `localStorage` lido num `useEffect` com try/catch, botão chevron no topo (`h-10 rounded-lg hover-bg-translucid color-gray`),
  largura `lg:w-16` com `lg:transition-[width] lg:duration-200`, itens com `title`/`aria-label`, `aria-expanded` no botão.

## Decisões
- Estado `collapsed` local em `Menu.jsx` (só ele usa), chave `dashboard-rightbar-collapsed`, mesmo padrão
  de leitura/escrita da esquerda. Primeiro render expandido → sem erro de hidratação.
- Recolhida: `w-16`, `p-2`, ícones centralizados; seções perdem título/descrição/borda interna e o "Sugerir cores" some.
- Chevron no topo: `FaChevronLeft` girado 180° quando expandida (aponta pra direita = "recolher pra direita"),
  normal quando recolhida (aponta pra esquerda = "expandir").
- Popover das cores: `absolute right-full mr-2` relativo ao quadrado, com o mesmo `HexColorPicker` + `HexColorInput`
  de hoje. Reaproveita `openColorIdx` e o clique-fora do `colorListRef` (o popover fica dentro dele).
  **Atenção:** o `<aside>` tem `overflow-y-auto`, que corta o popover → recolhida, trocar por `overflow-visible`
  (cabe sem scroll: 3 quadrados + 2 ícones).
- Preview: largura condicional — `calc(100%-30dvw+16px)` expandida, `calc(100%-64px-16px)` (ajustar na tela) recolhida.
- Nenhuma cor nova; só classes já usadas no projeto.

## Tarefas
Ver `tasks/todo.md`.

## Riscos
| Risco | Impacto | Mitigação |
|---|---|---|
| Popover cortado pelo `overflow-y-auto` / `rounded` do aside | Médio | `overflow-visible` quando recolhida; conferir no screenshot |
| Popover sai da tela em telas baixas (3º quadrado + picker de 140px) | Baixo | Alinhar topo do popover ao quadrado; se cortar, `bottom-0` no último |
| Preview com largura errada → espaço vazio ou sobreposição | Médio | Medir em 1440px e 1024px nos dois estados |
| Barra recolhida em telas estreitas da esquerda + direita juntas | Baixo | Testar com as duas recolhidas/expandidas |

## Perguntas em aberto
- Nenhuma (decidido: arquivar plano antigo; popover ao lado no clique da cor).
