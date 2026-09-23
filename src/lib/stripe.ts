import Stripe from "stripe";

// Uma conta por chave. "cnpj" é a conta padrão (a "main" está sendo encerrada).
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
export function getStripeClient(account = "cnpj") {
  return stripeClients[account as keyof typeof stripeClients] ?? stripeClients.cnpj;
}
