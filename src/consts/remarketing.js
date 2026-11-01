// Trilhas do remarketing por e-mail. Usado no painel (/admin/remarketing) e no servidor (src/lib/remarketing.js).
// Prioridade: cada pessoa entra só na primeira trilha em que se encaixa (A → B → C).

// admin: pra testar a trilha de verdade (marcar só admin = só admins recebem)
export const ROLE_OPTIONS = ["free", "plus", "pro", "business", "admin"];

export const TRACKS = [
  {
    id: "A",
    name: "Ativação",
    description: "Cadastrou e não montou o cardápio.",
    delayLabel: "dias de cadastro",
    fields: [
      { key: "signup_max_days", label: "Cadastro há até (dias)", type: "number" },
      { key: "include_no_menu", label: "Sem cardápio", type: "boolean" },
      { key: "include_empty_menu", label: "Cardápio vazio", type: "boolean" },
    ],
  },
  {
    id: "B",
    name: "Reativação",
    description: "Montou o cardápio e parou de usar.",
    delayLabel: "dias sem acessar",
    fields: [
      { key: "inactive_min_days", label: "Sem acessar a partir de (dias)", type: "number" },
      { key: "inactive_max_days", label: "Sem acessar até (dias)", type: "number" },
      { key: "no_orders_days", label: "Sem pedidos há (dias)", type: "number" },
      { key: "min_items", label: "Mínimo de itens", type: "number" },
    ],
  },
  {
    id: "C",
    name: "Reapresentação",
    description: "Inativos há muito tempo. Uma mensagem por vez, na ordem.",
    delayLabel: null,
    fields: [
      { key: "inactive_min_days", label: "Inativo a partir de (dias)", type: "number" },
      { key: "no_orders_days", label: "Sem pedidos há (dias)", type: "number" },
      { key: "interval_days", label: "Dias entre mensagens", type: "number" },
      { key: "max_unopened", label: "Parar após N sem abrir", type: "number" },
    ],
  },
];

export const VARIABLES = [
  { key: "nome", help: "primeiro nome (vazio se não tiver)" },
  { key: "restaurante", help: "nome do cardápio (ou “seu restaurante”)" },
  { key: "link_cardapio", help: "link público do cardápio (ou do painel)" },
  { key: "itens", help: "quantidade de itens" },
  { key: "dias_sem_acessar", help: "dias desde o último acesso" },
  { key: "mes_cadastro", help: "ex.: março de 2026" },
];
