import Stripe from "stripe";
import { headers } from "next/headers";
import { getStripeClient } from "@/lib/stripe";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function POST(req: Request) {
  const stripe = getStripeClient("cnpj");
  const body = await req.text();

  const signature = (await headers()).get("stripe-signature");

  if (!signature) {
    return new Response("Missing signature", {
      status: 400,
    });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_CONNECT_WEBHOOK_SECRET!);
  } catch (err: any) {
    console.error("Webhook signature failed:", err.message);

    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  try {
    switch (event.type) {
      case "account.updated": {
        const account = event.data.object as Stripe.Account;

        const ready = account.charges_enabled && account.payouts_enabled;

        const { error } = await supabase
          .from("profiles")
          .update({
            stripe_connect_ready: ready,
          })
          .eq("stripe_connect_account_id", account.id);

        if (error) {
          console.error(error);
        }

        console.log(`Conta ${account.id} atualizada. Ready: ${ready}`);

        break;
      }

      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const orderId = session.metadata?.order_id;
        const connectedAccountId = event.account; // conta conectada que gerou o evento

        if (!orderId) {
          console.warn("checkout.session.completed sem order_id no metadata.");
          break;
        }

        if (session.payment_status === "paid") {
          let netTotal: number | null = null;

          try {
            if (session.payment_intent && connectedAccountId) {
              const paymentIntent = await stripe.paymentIntents.retrieve(
                session.payment_intent as string,
                { expand: ["latest_charge.balance_transaction"] },
                { stripeAccount: connectedAccountId },
              );

              const charge = paymentIntent.latest_charge as Stripe.Charge | null;
              const balanceTransaction = charge?.balance_transaction as Stripe.BalanceTransaction | null;

              if (balanceTransaction) {
                const isZeroDecimal = balanceTransaction.currency
                  ? [
                      "bif",
                      "clp",
                      "djf",
                      "gnf",
                      "jpy",
                      "kmf",
                      "krw",
                      "mga",
                      "pyg",
                      "rwf",
                      "ugx",
                      "vnd",
                      "vuv",
                      "xaf",
                      "xof",
                      "xpf",
                    ].includes(balanceTransaction.currency.toLowerCase())
                  : false;

                netTotal = isZeroDecimal ? balanceTransaction.net : balanceTransaction.net / 100;
              }
            }
          } catch (netErr: any) {
            // não bloqueia o fluxo principal se a busca do valor líquido falhar
            console.error(`Erro ao buscar balance_transaction do pedido ${orderId}:`, netErr.message);
          }

          const { error } = await supabase
            .from("orders")
            .update({
              is_paid: true,
              stripe_payment_intent: session.payment_intent ?? null,
              net_total: netTotal,
              updated_at: new Date().toISOString(),
            })
            .eq("id", orderId);

          if (error) {
            console.error(`Erro ao atualizar pedido ${orderId} como pago:`, error);
            return new Response(JSON.stringify({ error: "DB update failed" }), {
              status: 500,
              headers: { "Content-Type": "application/json" },
            });
          }

          console.log(
            `✅ Pedido ${orderId} marcado como pago. PaymentIntent: ${session.payment_intent}. Líquido: ${netTotal}`,
          );
        }

        break;
      }

      default:
        console.log(`Evento ignorado: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error: any) {
    console.error(error);

    return new Response(
      JSON.stringify({
        error: error.message,
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }
}
