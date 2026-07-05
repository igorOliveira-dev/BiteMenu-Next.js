import { NextResponse } from "next/server";
import Stripe from "stripe";
import { supabase } from "@/lib/supabaseClient";

// 🔹 Um client Stripe para cada conta (CPF e CNPJ)
const stripeClients = {
  cpf: process.env.STRIPE_SECRET_KEY_CPF ? new Stripe(process.env.STRIPE_SECRET_KEY_CPF) : null,
  cnpj: process.env.STRIPE_SECRET_KEY_CNPJ ? new Stripe(process.env.STRIPE_SECRET_KEY_CNPJ) : null,
};

// 🔹 Busca TODAS as assinaturas de um price_id, paginando
async function fetchAllSubscriptionsForPrice(stripe, priceId) {
  const all = [];
  let startingAfter;
  let hasMore = true;

  while (hasMore) {
    const page = await stripe.subscriptions.list({
      price: priceId,
      status: "all", // inclui active, trialing, canceled, past_due, etc.
      limit: 100,
      starting_after: startingAfter,
    });

    all.push(...page.data);
    hasMore = page.has_more;
    startingAfter = page.data.length ? page.data[page.data.length - 1].id : undefined;
  }

  return all;
}

// 🔹 Agrega uma lista de { created } em contagem mensal cumulativa
function buildMonthlyGrowth(items) {
  const sorted = [...items].sort((a, b) => a.created - b.created);

  const monthlyCounts = {};
  sorted.forEach(({ created }) => {
    const date = new Date(created * 1000);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    monthlyCounts[key] = (monthlyCounts[key] || 0) + 1;
  });

  const sortedKeys = Object.keys(monthlyCounts).sort();
  let cumulative = 0;

  return sortedKeys.map((key) => {
    cumulative += monthlyCounts[key];
    const [year, month] = key.split("-");
    const label = new Date(Number(year), Number(month) - 1).toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
    return { month: label, total: cumulative };
  });
}

export async function GET() {
  try {
    // 1. Buscar mapeamento de planos (price_id -> role / conta) no Supabase
    const { data: plans, error: plansError } = await supabase.from("plans").select("stripe_price_id, role, stripe_account");

    if (plansError) throw plansError;
    if (!plans || plans.length === 0) {
      return NextResponse.json({ plus: [], pro: [] });
    }

    const roleByPriceId = {};
    plans.forEach((p) => {
      roleByPriceId[p.stripe_price_id] = p.role;
    });

    // 2. Buscar assinaturas de cada price_id, na conta Stripe correta
    const results = await Promise.all(
      plans.map(async (plan) => {
        const stripe = stripeClients[plan.stripe_account];
        if (!stripe) {
          console.warn(`Nenhuma chave Stripe configurada para a conta "${plan.stripe_account}"`);
          return [];
        }

        const subs = await fetchAllSubscriptionsForPrice(stripe, plan.stripe_price_id);

        return subs.map((sub) => ({
          role: roleByPriceId[plan.stripe_price_id],
          created: sub.created,
        }));
      }),
    );

    const allSubscriptions = results.flat();

    // 3. Separar por role e agregar mês a mês
    const plusItems = allSubscriptions.filter((s) => s.role === "plus");
    const proItems = allSubscriptions.filter((s) => s.role === "pro");

    return NextResponse.json({
      plus: buildMonthlyGrowth(plusItems),
      pro: buildMonthlyGrowth(proItems),
    });
  } catch (err) {
    console.error("Erro ao buscar assinaturas Stripe:", err);
    return NextResponse.json({ error: "Erro ao buscar assinaturas do Stripe" }, { status: 500 });
  }
}
