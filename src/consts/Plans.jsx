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
      "Taxa por bairro e por raio",
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
      "Cupons de desconto",
      "Programa de fidelidade",
      "Pix online",
    ],
    price: "49,90",
    yearlyPrice: "499,00",
    yearlyAnchor: "598,80",
    id: "pro",
  },
  {
    name: "Business",
    features: [
      "Inclui tudo do Pro",
      "Sem limites",
      "Bite Menu IA",
      "Controle de estoque",
      "WhatsApp personalizado",
      "Impressão personalizada",
      "Logins para a equipe",
      "Tela de cozinha",
      "Tela de entregas",
    ],
    price: "69,90",
    yearlyPrice: "699,00",
    yearlyAnchor: "838,80",
    id: "business",
  },
  // Fora da grade de planos: aparece numa faixa própria no PlansSection.
  {
    name: "Enterprise",
    tagline: "Para estabelecimentos que querem uma presença mais profissional: atendimento, página e cardápio com a sua cara.",
    features: [
      "Inclui tudo do Business",
      "Atendente IA no cardápio",
      "Landing page criada com IA",
      "Layout personalizado do cardápio",
      "Página de links",
      "Insights de vendas com IA",
    ],
    price: "149,90",
    yearlyPrice: "1499,00",
    yearlyAnchor: "1798,80",
    id: "enterprise",
  },
];

// Contratação em manutenção para todos, exceto estes e-mails (teste da assinatura real em produção).
// Pra liberar geral: PLANS_MAINTENANCE = false.
export const PLANS_MAINTENANCE = false;
export const PLANS_TESTERS = ["igorventuradeoliveira@gmail.com"];

export const plansBlockedFor = (email) =>
  PLANS_MAINTENANCE && !PLANS_TESTERS.includes(String(email ?? "").toLowerCase());
