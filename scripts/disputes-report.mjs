// Diagnóstico (somente leitura) de cobranças contestadas / reembolsadas
// e de clientes com assinatura viva em mais de uma conta Stripe (cobrança dupla).
//
// Uso:
//   node --env-file=.env.local scripts/disputes-report.mjs [dias]
//   dias = janela analisada (padrão 90)

import Stripe from "stripe";

const days = Number(process.argv[2]) || 90;
const since = Math.floor(Date.now() / 1000) - days * 24 * 60 * 60;

const keys = {
  main: process.env.STRIPE_SECRET_KEY_MAIN,
  cpf: process.env.STRIPE_SECRET_KEY_CPF,
  cnpj: process.env.STRIPE_SECRET_KEY_CNPJ,
};

const LIVE = ["active", "trialing", "past_due", "unpaid"];
const byEmail = new Map(); // email -> [{ conta, sub, status }]

for (const [account, key] of Object.entries(keys)) {
  if (!key) continue;
  const stripe = new Stripe(key);

  console.log(`\n=== Conta: ${account} (últimos ${days} dias) ===`);

  // 1. Contestações (chargebacks)
  const disputes = [];
  for await (const d of stripe.disputes.list({ created: { gte: since }, limit: 100 })) {
    disputes.push(d);
  }
  const porMotivo = {};
  for (const d of disputes) {
    porMotivo[d.reason] ??= { qtd: 0, valor: 0 };
    porMotivo[d.reason].qtd++;
    porMotivo[d.reason].valor += d.amount / 100;
  }
  console.log(`Contestações: ${disputes.length}`);
  if (disputes.length) console.table(porMotivo);

  // 2. Cobranças e taxa de contestação
  let charges = 0;
  let refunded = 0;
  for await (const c of stripe.charges.list({ created: { gte: since }, limit: 100 })) {
    if (c.status !== "succeeded") continue;
    charges++;
    if (c.refunded || c.amount_refunded > 0) refunded++;
  }
  const taxa = charges ? ((disputes.length / charges) * 100).toFixed(2) : "0.00";
  console.log(`Cobranças bem-sucedidas: ${charges} | reembolsadas: ${refunded} | taxa de contestação: ${taxa}%`);

  // 3. Nome que aparece na fatura do cartão do cliente
  const { settings } = await stripe.accounts.retrieve();
  console.log(`Nome na fatura do cartão: ${settings?.payments?.statement_descriptor ?? "(não definido)"}`);

  // 4. Coleta assinaturas vivas pra cruzar entre contas
  for await (const sub of stripe.subscriptions.list({ status: "all", limit: 100, expand: ["data.customer"] })) {
    if (!LIVE.includes(sub.status)) continue;
    const email = sub.customer?.email;
    if (!email) continue;
    byEmail.set(email, [...(byEmail.get(email) ?? []), { conta: account, sub: sub.id, status: sub.status }]);
  }
}

// 5. Mesmo email com assinatura viva em mais de uma conta = cobrança dupla
const duplicados = [...byEmail.entries()].filter(([, subs]) => new Set(subs.map((s) => s.conta)).size > 1);

console.log(`\n=== Clientes com assinatura viva em mais de uma conta: ${duplicados.length} ===`);
for (const [email, subs] of duplicados) {
  console.log(`${email}: ${subs.map((s) => `${s.conta}/${s.sub} (${s.status})`).join("  +  ")}`);
}
