export const plans = [
  {
    name: "Free",
    features: ["Cardápio digital", "20 Itens", "4 Categorias", "5 Mesas", "Controle de pedidos", "Controle de vendas"],
    price: "00,00",
    id: "free",
  },
  {
    name: "Plus",
    features: [
      "Inclui tudo do Free",
      "50 Itens",
      "10 Categorias",
      "15 Mesas",
      "Maior personalização",
      "Taxa por bairro",
      "Criação de combos",
    ],
    price: "29,90",
    yearlyPrice: "299,00",
    yearlyAnchor: "358,80",
    id: "plus",
  },
  {
    name: "Pro",
    features: [
      "Inclui tudo do Plus",
      "200 Itens",
      "20 Categorias",
      "100 Mesas",
      "Impressão de pedidos",
      "Dashboard de vendas",
      "Relatório de vendas",
    ],
    price: "49,90",
    yearlyPrice: "499,00",
    yearlyAnchor: "598,80",
    id: "pro",
  },
];

// Contratação em manutenção para todos, exceto estes e-mails (teste da assinatura real em produção).
// Pra liberar geral: PLANS_MAINTENANCE = false.
export const PLANS_MAINTENANCE = true;
export const PLANS_TESTERS = ["igorventuradeoliveira@gmail.com"];

export const plansBlockedFor = (email) =>
  PLANS_MAINTENANCE && !PLANS_TESTERS.includes(String(email ?? "").toLowerCase());
