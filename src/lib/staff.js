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
