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

const STATUS_LABELS = {
  active: "Ativa",
  trialing: "Teste grátis",
  past_due: "Vencida",
  unpaid: "Vencida",
  canceled: "Cancelada",
  incomplete: "Pendente",
  incomplete_expired: "Expirada",
};

// 🔹 Para cada customer, pega a assinatura mais recente e retorna um mapa
// customerId -> status (usa os mesmos dados já buscados acima, sem custo extra de API)
function buildSubscriberStatus(items) {
  const latestByCustomer = {};

  items.forEach((sub) => {
    if (!sub.customer) return;
    const existing = latestByCustomer[sub.customer];
    if (!existing || sub.created > existing.created) {
      latestByCustomer[sub.customer] = sub;
    }
  });

  const subscriberStatus = {};
  Object.entries(latestByCustomer).forEach(([customerId, sub]) => {
    subscriberStatus[customerId] = {
      status: sub.status,
      label: STATUS_LABELS[sub.status] || sub.status,
      cancelAtPeriodEnd: sub.cancel_at_period_end,
    };
  });

  return subscriberStatus;
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

const PLAN_PRICES = { plus: 24.9, pro: 44.9 };

// 🔹 Taxa aproximada que a Stripe costuma descontar no Brasil em cobranças
// recorrentes com cartão nacional (3,99% + R$0,39 por cobrança). É uma
// estimativa — boleto/pix têm taxas diferentes, mas cartão é o método mais comum.
const STRIPE_FEE_PERCENT = 0.0399;
const STRIPE_FEE_FIXED = 0.39;

function monthKeysBetween(startKey, endKey) {
  const [startYear, startMonth] = startKey.split("-").map(Number);
  const [endYear, endMonth] = endKey.split("-").map(Number);

  const keys = [];
  let year = startYear;
  let month = startMonth;

  while (year < endYear || (year === endYear && month <= endMonth)) {
    keys.push(`${year}-${String(month).padStart(2, "0")}`);
    month++;
    if (month > 12) {
      month = 1;
      year++;
    }
  }

  return keys;
}

// 🔹 Deltas de assinaturas ativas por mês (+1 quando criada, -1 quando cancelada)
function buildActiveDeltasByMonth(items) {
  const deltas = {};

  items.forEach(({ created, canceled_at, status }) => {
    const createdKey = monthKey(created);
    deltas[createdKey] = (deltas[createdKey] || 0) + 1;

    if (canceled_at && status !== "incomplete_expired") {
      const cancelKey = monthKey(canceled_at);
      deltas[cancelKey] = (deltas[cancelKey] || 0) - 1;
    }
  });

  return deltas;
}

// 🔹 Estimativa de faturamento bruto/líquido mensal, com base no número de
// assinaturas ativas de cada plano (mesmos dados já buscados acima, sem custo
// extra de API). Preenche meses sem eventos carregando o total anterior.
function buildRevenueTimeline(plusItems, proItems) {
  const plusDeltas = buildActiveDeltasByMonth(plusItems);
  const proDeltas = buildActiveDeltasByMonth(proItems);

  const allKeys = [...Object.keys(plusDeltas), ...Object.keys(proDeltas)];
  if (allKeys.length === 0) return [];

  const sortedKeys = [...new Set(allKeys)].sort();

  const now = new Date();
  const currentKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const lastKey = sortedKeys[sortedKeys.length - 1] > currentKey ? sortedKeys[sortedKeys.length - 1] : currentKey;

  const timelineKeys = monthKeysBetween(sortedKeys[0], lastKey);

  let plusActive = 0;
  let proActive = 0;

  return timelineKeys.map((key) => {
    plusActive += plusDeltas[key] || 0;
    proActive += proDeltas[key] || 0;

    const gross = plusActive * PLAN_PRICES.plus + proActive * PLAN_PRICES.pro;
    const totalActive = plusActive + proActive;
    const net = Math.max(gross - gross * STRIPE_FEE_PERCENT - totalActive * STRIPE_FEE_FIXED, 0);

    return {
      month: monthLabel(key),
      plusActive,
      proActive,
      gross: Number(gross.toFixed(2)),
      net: Number(net.toFixed(2)),
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
          customer: sub.customer,
          cancel_at_period_end: sub.cancel_at_period_end,
        }));
      }),
    );

    const allSubscriptions = results.flat();

    const plusItems = allSubscriptions.filter((s) => s.role === "plus");
    const proItems = allSubscriptions.filter((s) => s.role === "pro");

    return NextResponse.json({
      plus: buildMonthlyStats(plusItems),
      pro: buildMonthlyStats(proItems),
      subscriberStatus: buildSubscriberStatus(allSubscriptions),
      revenue: buildRevenueTimeline(plusItems, proItems),
    });
  } catch (err) {
    console.error("Erro ao buscar assinaturas Stripe:", err);
    return NextResponse.json({ error: "Erro ao buscar assinaturas do Stripe" }, { status: 500 });
  }
}
