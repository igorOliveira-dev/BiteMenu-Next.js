// Logins da equipe (caixa, cozinha e entregador; plano Business). O funcionário entra com "usuário" + senha;
// por baixo é um usuário do Supabase Auth com e-mail interno nesse domínio (nunca recebe e-mail).
// O acesso aos pedidos é liberado pelo RLS via staff_menu_id(), que já exige o Business do dono.
export const STAFF_EMAIL_DOMAIN = "equipe.bitemenu.com.br";
export const STAFF_PLAN_ROLES = ["business", "admin", "designer"];
export const STAFF_ROLES = { caixa: "Caixa", cozinha: "Cozinha", entregador: "Entregador" };

export const staffEmail = (login) => `${login}@${STAFF_EMAIL_DOMAIN}`;

// "João Silva" + "pizzaria-x" -> "joaosilva.pizzaria-x"
export const staffLogin = (name, slug) =>
  `${String(name)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 20)}.${slug}`;

export const getStaff = (supabase, userId) =>
  supabase.from("menu_staff").select("menu_id, role, name, login").eq("user_id", userId).maybeSingle();

// Etapas do pedido (orders.status): cozinha até "ready", entregador daí em diante
export const ORDER_STATUS = {
  received: "Recebido",
  preparing: "Preparando",
  ready: "Pronto",
  out_for_delivery: "Saiu para entrega",
  delivered: "Entregue",
};

// Cor de cada etapa: âmbar aguardando, azul em andamento, verde pronto e cinza já finalizado.
// Classes escritas por extenso pro Tailwind encontrar.
const PROGRESS = { pill: "bg-info/12 text-info", dot: "bg-info", ring: "ring-info/25", border: "border-info/50" };
export const ORDER_STATUS_STYLE = {
  received: { pill: "bg-st-wait/12 text-st-wait", dot: "bg-st-wait", ring: "ring-st-wait/25", border: "border-st-wait/50" },
  preparing: PROGRESS,
  ready: { pill: "bg-st-done/12 text-st-done", dot: "bg-st-done", ring: "ring-st-done/25", border: "border-st-done/50" },
  out_for_delivery: PROGRESS,
  delivered: { pill: "bg-[var(--translucid)] color-gray", dot: "bg-st-done", ring: "ring-st-done/25", border: "border-translucid" },
};

// Pago / pendente, o mesmo nos cards de pedidos e de entregas
export const paidPillClass = (isPaid) =>
  `inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${isPaid ? "bg-st-done/12 text-st-done" : "bg-st-wait/12 text-st-wait"}`;
