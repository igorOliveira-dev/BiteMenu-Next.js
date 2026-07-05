import { NextResponse } from "next/server";
import Stripe from "stripe";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const stripeClients = {
  cpf: process.env.STRIPE_SECRET_KEY_CPF ? new Stripe(process.env.STRIPE_SECRET_KEY_CPF) : null,
  cnpj: process.env.STRIPE_SECRET_KEY_CNPJ ? new Stripe(process.env.STRIPE_SECRET_KEY_CNPJ) : null,
};

async function fetchAllSubscriptionsForPrice(stripe, priceId) {
  const all = [];
  let startingAfter;
  let hasMore = true;

  while (hasMore) {
    const page = await stripe.subscriptions.list({
      price: priceId,
      status: "all",
      limit: 100,
      starting_after: startingAfter,
    });

    all.push(...page.data);
    hasMore = page.has_more;
    startingAfter = page.data.length ? page.data[page.data.length - 1].id : undefined;
  }

  return all;
}

function monthKey(unixSeconds) {
  const date = new Date(unixSeconds * 1000);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(key) {
  const [year, month] = key.split("-");
  return new Date(Number(year), Number(month) - 1).toLocaleDateString("pt-BR", {
    month: "short",
    year: "2-digit",
  });
}

// 🔹 Agora calcula: novos, cancelados, e ativos líquidos acumulados por mês
function buildMonthlyStats(items) {
  const newByMonth = {};
  const canceledByMonth = {};

  items.forEach(({ created, canceled_at, status }) => {
    const createdKey = monthKey(created);
    newByMonth[createdKey] = (newByMonth[createdKey] || 0) + 1;

    // Considera cancelado apenas se realmente tem canceled_at
    // (cobre canceled, e status incomplete_expired não conta como churn real)
    if (canceled_at && status !== "incomplete_expired") {
      const cancelKey = monthKey(canceled_at);
      canceledByMonth[cancelKey] = (canceledByMonth[cancelKey] || 0) + 1;
    }
  });

  const allKeys = new Set([...Object.keys(newByMonth), ...Object.keys(canceledByMonth)]);
  const sortedKeys = [...allKeys].sort();

  let cumulativeActive = 0;

  return sortedKeys.map((key) => {
    const novos = newByMonth[key] || 0;
    const cancelados = canceledByMonth[key] || 0;
    cumulativeActive += novos - cancelados;

    return {
      month: monthLabel(key),
      novos,
      cancelados,
      saldo: novos - cancelados,
      total: cumulativeActive, // 🔹 agora é o total LÍQUIDO de ativos, não bruto
    };
  });
}

export async function GET() {
  try {
    const { data: plans, error: plansError } = await supabaseAdmin
      .from("plans")
      .select("stripe_price_id, role, stripe_account");

    if (plansError) throw plansError;
    if (!plans || plans.length === 0) {
      return NextResponse.json({ plus: [], pro: [] });
    }

    const roleByPriceId = {};
    plans.forEach((p) => {
      roleByPriceId[p.stripe_price_id] = p.role;
    });

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
          canceled_at: sub.canceled_at, // 🔹 novo campo capturado
          status: sub.status,
        }));
      }),
    );

    const allSubscriptions = results.flat();

    const plusItems = allSubscriptions.filter((s) => s.role === "plus");
    const proItems = allSubscriptions.filter((s) => s.role === "pro");

    return NextResponse.json({
      plus: buildMonthlyStats(plusItems),
      pro: buildMonthlyStats(proItems),
    });
  } catch (err) {
    console.error("Erro ao buscar assinaturas Stripe:", err);
    return NextResponse.json({ error: "Erro ao buscar assinaturas do Stripe" }, { status: 500 });
  }
}
