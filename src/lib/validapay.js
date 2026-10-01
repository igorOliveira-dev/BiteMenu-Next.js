import crypto from "crypto";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// VALIDAPAY_API_URL / VALIDAPAY_OAUTH_URL: sandbox ou produção (ver .env)
const SCOPES = "checkouts/write subscriptions/write subscriptions/read customers/read";

let cachedToken = null; // { value, expiresAt }

async function getToken() {
  if (cachedToken && Date.now() < cachedToken.expiresAt) return cachedToken.value;

  const res = await fetch(process.env.VALIDAPAY_OAUTH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: process.env.VALIDAPAY_CLIENT_ID,
      client_secret: process.env.VALIDAPAY_CLIENT_SECRET,
      scope: SCOPES,
    }),
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`ValidaPay OAuth: ${data?.error || res.status}`);

  // expires_in não é fixo (o servidor reaproveita tokens); margem de 60s
  cachedToken = { value: data.access_token, expiresAt: Date.now() + (data.expires_in - 60) * 1000 };
  return cachedToken.value;
}

export async function validapay(path, { method = "GET", body } = {}) {
  const res = await fetch(`${process.env.VALIDAPAY_API_URL}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${await getToken()}`,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401) cachedToken = null;
    const err = new Error(data?.error?.message || data?.message || `ValidaPay ${res.status}`);
    err.code = data?.error?.code || data?.code;
    throw err;
  }
  return data;
}

// Preços cadastrados na ValidaPay: um produto por plano, com preço mensal e anual
export const PRICE_IDS = {
  plus: { monthly: process.env.VALIDAPAY_PRICE_PLUS_MONTHLY, yearly: process.env.VALIDAPAY_PRICE_PLUS_YEARLY },
  pro: { monthly: process.env.VALIDAPAY_PRICE_PRO_MONTHLY, yearly: process.env.VALIDAPAY_PRICE_PRO_YEARLY },
};

export const TIER = { plus: 1, pro: 2 };

// { plan: "plus" | "pro", cycle: "monthly" | "yearly" } de um priceId nosso
export function priceInfo(priceId) {
  for (const plan of Object.keys(PRICE_IDS)) {
    for (const cycle of Object.keys(PRICE_IDS[plan])) {
      if (priceId && PRICE_IDS[plan][cycle] === priceId) return { plan, cycle };
    }
  }
  return null;
}

export function planFromPriceId(priceId) {
  return priceInfo(priceId)?.plan ?? null;
}

// Depois de uma troca a assinatura guarda os itens antigos (CANCELED) e o novo;
// o plano vigente é o item recorrente ativo.
export function activePriceId(items = []) {
  const recurring = items.filter((i) => i.type === "RECURRING" && !["CANCELED", "PENDING_UPGRADE"].includes(i.status));
  const item = recurring.find((i) => i.status === "ACTIVE") ?? recurring[0];
  return item?.price?.priceId ?? item?.priceId ?? null;
}

// Assinatura em vigor de um e-mail direto na ValidaPay. Não depende do webhook já ter chegado:
// evita o cliente assinar duas vezes enquanto o primeiro pagamento ainda não foi processado.
// Ficam de fora PENDING (PIX gerado e não pago não pode bloquear uma nova tentativa) e as
// com cancelamento agendado (não cobram mais nada).
export async function findLiveSubscription(email) {
  const { items = [] } = await validapay(`/v1/customers?search=${encodeURIComponent(email)}`);
  const customers = items.filter((c) => c.email?.toLowerCase() === email.toLowerCase());

  for (const customer of customers) {
    const detail = await validapay(`/v1/customers/${customer.customerId}`);
    const live = detail.subscriptions?.find(
      (s) => ["ACTIVE", "TRIALING", "PAST_DUE", "DEFAULT"].includes(s.status) && !s.cancelAtPeriodEnd,
    );
    if (live) return live.subscriptionId;
  }
  return null;
}

// Usuário autenticado a partir do header "Authorization: Bearer <access_token>" do Supabase.
export async function getUserFromRequest(req) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return null;
  const { data } = await supabaseAdmin.auth.getUser(token);
  return data?.user ?? null;
}

// X-Webhook-Signature: t=<ms>,v1=<hex>  ->  v1 = HMAC_SHA256(secret, "<t>.<corpo bruto>")
export function isValidSignature(header, rawBody, secret, now = Date.now()) {
  if (!header || !secret) return false;
  const { t, v1 } = Object.fromEntries(header.split(",").map((part) => part.trim().split("=")));
  if (!t || !v1) return false;

  const expected = crypto.createHmac("sha256", secret).update(`${t}.${rawBody}`).digest("hex");
  if (v1.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(v1), Buffer.from(expected))) return false;

  return Math.abs(now - Number(t)) <= 5 * 60 * 1000; // assinatura capturada não vale pra sempre
}
