// Assistente de IA do dashboard: planos liberados e campos que ele pode alterar.
// As chaves são as mesmas do estado local do StatesManager.
export const AI_PLAN_ROLES = ["business", "admin"];

// Limite de uso por sessão: tokens (entrada + saída) numa janela que começa na 1ª mensagem.
// ~120 mil tokens ≈ 12–25 mensagens; pior caso no mês (todas as sessões no limite) ≈ US$ 2,80 por usuário.
export const AI_SESSION_TOKEN_LIMIT = 120_000;
export const AI_SESSION_HOURS = 5;

// mesmos limites de MenuItems.jsx (getItemLimitByRole / getCategoryLimitByRole)
export const ITEM_LIMITS = { free: 20, plus: 50, pro: 200, business: 500, admin: Infinity };
export const CATEGORY_LIMITS = { free: 4, plus: 10, pro: 20, business: 100, admin: Infinity };

// rascunho que o preview (/menu/[slug]/preview?ai_draft=1) lê do sessionStorage
export const AI_PREVIEW_KEY = "aiMenuPreview";

export const AI_FIELD_LABELS = {
  title: "Título",
  description: "Descrição",
  selectedServices: "Serviços",
  selectedPayments: "Formas de pagamento",
  deliveryFeeMode: "Modo do frete",
  deliveryFee: "Taxa de entrega",
  deliveryZones: "Bairros de entrega",
  minimumOrderValue: "Pedido mínimo",
  pixKey: "Chave PIX",
  hours: "Horário",
  timezone: "Fuso horário",
  backgroundColor: "Cor de fundo",
  titleColor: "Cor do título",
  detailsColor: "Cor dos detalhes",
};

export const AI_FIELDS = Object.keys(AI_FIELD_LABELS);

const SERVICE_LABELS = { delivery: "Entrega", pickup: "Retirada", dinein: "Comer no local", faceToFace: "Atendimento presencial" };
const PAYMENT_LABELS = { cash: "Dinheiro", debit: "Débito", credit: "Crédito", pix: "PIX" };
const DAY_LABELS = { mon: "Seg", tue: "Ter", wed: "Qua", thu: "Qui", fri: "Sex", sat: "Sáb", sun: "Dom" };

// Texto curto do valor, para mostrar o "antes → depois" no chat
export function formatAiValue(key, value) {
  if (value === null || value === undefined || value === "") return "—";
  if (key === "selectedServices") return value.map((s) => SERVICE_LABELS[s] ?? s).join(", ");
  if (key === "selectedPayments") return value.map((p) => PAYMENT_LABELS[p] ?? p).join(", ");
  if (key === "deliveryFeeMode") return value === "zones" ? "Por bairro" : "Fixo";
  if (key === "deliveryZones") return value.map((z) => `${z.name} (${z.shipping_fee || 0})`).join(", ") || "—";
  if (key === "hours") {
    return Object.keys(DAY_LABELS)
      .map((d) => `${DAY_LABELS[d]} ${value?.[d] ?? "fechado"}`)
      .join(" · ");
  }
  return String(value);
}
