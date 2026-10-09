# Plano: horários convertidos pro fuso do cliente

## Visão geral
Quando o cliente abre `/menu/[slug]` num fuso diferente do da loja (`menus.timezone`), os horários
exibidos (texto "Aberto até às Xh" / "Abre amanhã às Xh" no topo e o modal de horários) aparecem
convertidos pro fuso do cliente, com um aviso curto dizendo isso.

A lógica de aberto/fechado NÃO muda: continua calculada no fuso da loja (já funciona). Só a exibição converte.

## Onde mexe (confirmado via graphify + grep)
- `src/utils/storeHours.js` — único lugar com a lógica de horário
- `src/app/menu/[slug]/ClientMenu.jsx`, `ClientMenu2.jsx`, `ClientMenu3.jsx` — cada um tem
  seu `formatHours`, o texto do topo e o modal de horários (código duplicado, padrão do projeto)

Nada de Supabase, banco ou dashboard.

## Decisões
- **"Outro fuso" = offset diferente agora**, não nome diferente. `America/Bahia` e `America/Sao_Paulo`
  têm o mesmo offset → nada muda nem aparece aviso.
- **Conversão por offset atual** (`offsetLoja - offsetCliente` em minutos, via `Intl`).
  Ignora horário de verão em dias futuros da semana. Brasil não tem DST hoje, então o teto é aceitável;
  marcar com `ponytail:` no código.
- **Fuso do cliente lido no cliente** (`useEffect`), igual ao `TimezoneSelect`. No SSR e no 1º render
  mostra o horário da loja (sem divergência de hidratação); depois troca pro convertido.
- **Virada de dia**: se o horário convertido passar da meia-noite, mostra a hora normal
  (ex: "Segunda: 22:00 às 01:00"). O dia continua sendo o dia da loja.
- **Aviso** no modal de horários: "Horários no seu fuso (UTC-4)". Topo fica só com o horário convertido.
- Helper puro em `storeHours.js` (sem hook novo): `zoneOffset(tz)` e `shiftTime("HH:MM", diffMin)`.
  Cada ClientMenu guarda o fuso do cliente num `useState` + `useEffect` de 3 linhas.

## Tarefas
Veja `tasks/todo.md`.

## Riscos
| Risco | Impacto | Mitigação |
|---|---|---|
| "Abre amanhã" ficar errado pro cliente quando a conversão cruza a meia-noite | Baixo | Só acontece perto da meia-noite com fusos bem diferentes; aceitar e documentar |
| Erro de hidratação | Médio | Fuso do cliente só depois do mount (useEffect) |
| Fuso inválido no banco | Baixo | `nowInZone` já cai no `DEFAULT_TIMEZONE`; `zoneOffset` faz o mesmo |
| Esquecer um dos 3 ClientMenu | Médio | Tarefa 3 cobre os outros dois; checkpoint confere os 3 |

## Perguntas em aberto
1. Mostrar **também** o horário da loja (ex: "18h (19h no horário da loja)") ou só o convertido? Plano assume só o convertido + aviso no modal.
2. Texto do aviso: "Horários no seu fuso (UTC-4)" está bom?
