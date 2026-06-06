import Stripe from "stripe";

let _stripeCPF: Stripe | null = null;
let _stripeCNPJ: Stripe | null = null;

export function getStripeClient(account: "cpf" | "cnpj" = "cpf"): Stripe {
  if (account === "cnpj") {
    if (!_stripeCNPJ) {
      const key = process.env.STRIPE_SECRET_KEY_CNPJ;
      if (!key) throw new Error("STRIPE_SECRET_KEY_CNPJ não definida.");
      _stripeCNPJ = new Stripe(key);
    }
    return _stripeCNPJ;
  }

  if (!_stripeCPF) {
    const key = process.env.STRIPE_SECRET_KEY_CPF;
    if (!key) throw new Error("STRIPE_SECRET_KEY_CPF não definida.");
    _stripeCPF = new Stripe(key);
  }
  return _stripeCPF;
}
