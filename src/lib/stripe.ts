import Stripe from "stripe";

// Por enquanto as duas variáveis apontam pra mesma conta CPF.
// Quando o CNPJ estiver pronto, basta trocar STRIPE_SECRET_KEY_CNPJ no .env.
export const stripeCPF = new Stripe(process.env.STRIPE_SECRET_KEY_CPF);
export const stripeCNPJ = new Stripe(process.env.STRIPE_SECRET_KEY_CNPJ);

/**
 * Retorna o client Stripe correto com base no stripe_account do perfil.
 * @param {"cpf" | "cnpj"} account
 */
export function getStripeClient(account = "cpf") {
  return account === "cnpj" ? stripeCNPJ : stripeCPF;
}
