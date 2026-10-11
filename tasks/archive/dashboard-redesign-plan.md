# Plano: redesign do dashboard + sidebar recolhível

## Visão geral
Dar uma cara mais polida ao dashboard **sem mudar o layout de forma drástica e sem mudar cores**.
A peça principal: o menu lateral (desktop) ganha um botão de recolher; recolhido, vira uma
coluna estreita só com ícones, e dá pra navegar entre as abas sem abrir o menu de novo
(igual ao drawer do print de referência, mas em modo "rail").

Fora do escopo: landing, login/register, cardápio público (`/menu/[slug]`), qualquer coisa de
Supabase/pagamento.

## Como está hoje (lido no código)
- `src/app/dashboard/Dashboard.jsx` — sidebar é um `<aside>` fixo `lg:w-60`; no mobile vira barra
  inferior só com ícones + botão hambúrguer (modal). **Não existe recolher no desktop.**
- `<main>` usa largura fixa `lg:w-[calc(100dvw-256px)]` → precisa acompanhar a largura da sidebar.
- `FaChevronLeft` já está importado e sem uso.
- Badge de pedidos pendentes (`pendingOrdersCount`) é `absolute` dentro do botão "Pedidos".
- Visual vem de classes globais em `src/app/globals.css` (`bg-translucid`, `border-translucid`,
  `hover-bg-translucid`, `cta-button`, `custom-gray-button`) + Tailwind inline nas abas
  (muita variação: `rounded`, `rounded-lg`, `rounded-xl`, `rounded-2xl`, `p-2`/`p-3`, `border`/`border-2`).
- Header: `src/app/dashboard/DashboardLayoutClient.js`.

## Decisões
- **Sidebar recolhida só no desktop (`lg+`)**. Mobile continua com a barra inferior de ícones (já resolve).
- Recolhida: largura ~`w-16`, só ícones centralizados, `title`/`aria-label` com o nome da aba,
  item ativo continua destacado, badge de pedidos continua visível (vira bolinha no canto do ícone).
- Botão de recolher/expandir no topo da sidebar (`FaChevronLeft`, gira 180° quando recolhida).
- Estado salvo em `localStorage` (`dashboard-sidebar-collapsed`), lido em `useEffect` com try/catch
  → sem erro de hidratação; primeiro render é expandido.
- `<main>` passa a ser `flex-1 min-w-0` em vez do `calc` fixo — acompanha qualquer largura da sidebar.
- **Cores não mudam.** Nada de valor de cor novo em `:root`/`[data-theme]`. A mudança no
  `--background` dark (`#252323`) que está não commitada é tratada como a cor atual.
- Polimento = consistência: um raio padrão (`rounded-xl` cards / `rounded-lg` botões e inputs),
  `focus-visible` visível, transições suaves, espaçamentos uniformes. Feito por classes globais
  primeiro (muda tudo de uma vez), depois troca pontual nas abas. Sem componente novo genérico.

## Tarefas
Veja `tasks/todo.md`. Ordem: sidebar (o pedido explícito, maior risco de layout) → base global →
header → abas, uma ou duas por tarefa.

## Riscos
| Risco | Impacto | Mitigação |
|---|---|---|
| `<main>` com largura errada ao recolher (overflow horizontal, gráficos do Sales não redimensionam) | Alto | `flex-1 min-w-0`; checar Sales/SalesDashboard com a sidebar nos dois estados |
| Badge de pedidos some/fica mal posicionado recolhido | Médio | Critério de aceite explícito na Task 1 |
| Mudar classe global quebra tela que eu não olhei | Médio | Só ajustar propriedades não-cor; screenshot de todas as abas no checkpoint |
| Diffs enormes em `Orders.jsx`/`Sales.jsx` (1400–1800 linhas) | Médio | Só trocar classes, nunca lógica; uma aba por tarefa |
| Mudar cor sem querer (ex: trocar `bg-gray-600` por outra) | Médio | Regra: classes de cor ficam como estão |

## Perguntas em aberto
1. A mudança do `--background` dark para `#252323` (não commitada) é a cor final? O plano assume que sim.
2. Quer animação na transição recolher/expandir (largura ~200ms) ou troca seca? Plano assume animação curta.
