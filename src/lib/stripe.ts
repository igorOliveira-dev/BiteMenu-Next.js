import Stripe from "stripe";

// Uma conta por chave. "main" é a conta nova, pra onde todo mundo está migrando.
// cpf/cnpj continuam ativas enquanto houver assinatura viva nelas.
const clientFor = (key?: string) => (key ? new Stripe(key) : null);

export const stripeClients = {
  cpf: clientFor(process.env.STRIPE_SECRET_KEY_CPF),
  cnpj: clientFor(process.env.STRIPE_SECRET_KEY_CNPJ),
  main: clientFor(process.env.STRIPE_SECRET_KEY_MAIN),
};

/**
 * Retorna o client Stripe correto com base no stripe_account do perfil.
 * @param {"cpf" | "cnpj" | "main" | "dev_tests"} account
 */
export function getStripeClient(account = "main") {
  // dev_tests roda na chave sk_test_ da conta CNPJ
  const key = account === "dev_tests" ? "cnpj" : account;
  return stripeClients[key as keyof typeof stripeClients] ?? stripeClients.main;
}
