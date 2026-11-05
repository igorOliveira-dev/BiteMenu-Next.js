import { isValidSignature } from "@/lib/validapay";
import { finalizeOnlineOrder } from "@/lib/onlineOrders";

// Webhook separado do de assinaturas (cadastrado à parte no painel ValidaPay): só registra os
// pedidos pagos por Pix online, mesmo se o cliente fechou a página antes da confirmação.
export async function POST(req) {
  const rawBody = await req.text();

  if (
    !isValidSignature(req.headers.get("x-webhook-signature"), rawBody, process.env.VALIDAPAY_ORDERS_WEBHOOK_SECRET)
  ) {
    return new Response("Unauthorized", { status: 401 });
  }

  const evt = JSON.parse(rawBody);
  if (evt.event !== "payment.success" || evt.subscriptionId || !evt.chargeId) return new Response("ok");

  try {
    await finalizeOnlineOrder(evt.chargeId);
    return new Response("ok");
  } catch (err) {
    // 5xx faz a ValidaPay tentar de novo
    console.error("[ValidaPay Orders Webhook] Erro:", err);
    return new Response("error", { status: 500 });
  }
}
