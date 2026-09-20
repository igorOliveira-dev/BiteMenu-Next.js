import Stripe from "stripe";

// Uma conta por chave. "main" é a conta nova, pra onde todo mundo está migrando.
// cpf/cnpj continuam ativas enquanto houver assinatura viva nelas.
// dev_tests é a chave sk_test_, usada só por perfis de teste.
const clientFor = (key?: string) => (key ? new Stripe(key) : null);

export const stripeClients = {
  cpf: clientFor(process.env.STRIPE_SECRET_KEY_CPF),
  cnpj: clientFor(process.env.STRIPE_SECRET_KEY_CNPJ),
  main: clientFor(process.env.STRIPE_SECRET_KEY_MAIN),
  dev_tests: clientFor(process.env.STRIPE_SECRET_KEY_DEV_TESTS),
};

/**
 * Retorna o client Stripe correto com base no stripe_account do perfil.
 * @param {"cpf" | "cnpj" | "main" | "dev_tests"} account
 */
export function getStripeClient(account = "main") {
  return stripeClients[account as keyof typeof stripeClients] ?? stripeClients.main;
}
