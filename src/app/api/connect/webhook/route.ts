import Stripe from "stripe";
import { headers } from "next/headers";
import { getStripeClient } from "@/lib/stripe";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const ZERO_DECIMAL_CURRENCIES = [
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
];

function calcNetTotal(balanceTransaction: Stripe.BalanceTransaction): number {
  const isZeroDecimal = balanceTransaction.currency
    ? ZERO_DECIMAL_CURRENCIES.includes(balanceTransaction.currency.toLowerCase())
    : false;

  return isZeroDecimal ? balanceTransaction.net : balanceTransaction.net / 100;
}

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

  // Log de auditoria: todo evento que passa na verificação de assinatura.
  // Isso garante visibilidade de TODOS os eventos recebidos neste endpoint,
  // independente de termos um case pra eles ou não. Ajuda a confirmar se um
  // tipo de evento (ex: charge.updated) está de fato configurado no Dashboard
  // e chegando até aqui.
  console.log(
    `[connect-webhook] Evento recebido: type=${event.type} id=${event.id} account=${event.account ?? "N/A"} livemode=${event.livemode}`,
  );

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

      // Responsável por marcar o pedido como pago assim que o checkout é concluído.
      // O valor líquido (net_total) é tratado separadamente no evento charge.updated,
      // pois a balance_transaction (que reflete as taxas já descontadas) pode não
      // estar disponível ainda neste momento — a application fee é criada de forma
      // assíncrona por padrão pelo Stripe.
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const orderId = session.metadata?.order_id;
        const connectedAccountId = event.account;

        console.log(
          `[checkout.session.completed] session=${session.id} order_id=${orderId ?? "AUSENTE"} payment_status=${session.payment_status} payment_intent=${session.payment_intent} account=${connectedAccountId ?? "AUSENTE"}`,
        );

        if (!orderId) {
          console.warn(
            `[checkout.session.completed] sem order_id no metadata. metadata bruto: ${JSON.stringify(session.metadata)}`,
          );
          break;
        }

        if (session.payment_status === "paid") {
          const { error } = await supabase
            .from("orders")
            .update({
              is_paid: true,
              stripe_payment_intent: session.payment_intent ?? null,
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
            `✅ Pedido ${orderId} marcado como pago. PaymentIntent: ${session.payment_intent}. Conta: ${connectedAccountId}`,
          );

          // Tentativa imediata: às vezes a balance_transaction já está disponível
          // neste momento, então tentamos buscar e salvar de uma vez. Se não
          // conseguirmos, o evento charge.updated cobre o caso.
          try {
            if (session.payment_intent && connectedAccountId) {
              const paymentIntent = await stripe.paymentIntents.retrieve(
                session.payment_intent as string,
                { expand: ["latest_charge.balance_transaction"] },
                { stripeAccount: connectedAccountId },
              );

              const charge = paymentIntent.latest_charge as Stripe.Charge | null;

              console.log(
                `[net_total][tentativa imediata] pedido=${orderId} charge_id=${charge?.id ?? "N/A"} charge.balance_transaction=${
                  charge?.balance_transaction ? JSON.stringify(charge.balance_transaction) : "null"
                }`,
              );

              const balanceTransaction = charge?.balance_transaction as Stripe.BalanceTransaction | null;

              if (balanceTransaction) {
                const netTotal = calcNetTotal(balanceTransaction);

                const { error: netError } = await supabase
                  .from("orders")
                  .update({ net_total: netTotal, updated_at: new Date().toISOString() })
                  .eq("id", orderId);

                if (netError) {
                  console.error(`Erro ao salvar net_total (via checkout.session.completed) do pedido ${orderId}:`, netError);
                } else {
                  console.log(`💰 net_total salvo imediatamente para pedido ${orderId}: ${netTotal}`);
                }
              } else {
                console.log(
                  `[net_total] balance_transaction ainda não disponível para pedido ${orderId}; aguardando evento charge.updated.`,
                );
              }
            } else {
              console.warn(
                `[net_total][tentativa imediata] pulado: session.payment_intent=${session.payment_intent} connectedAccountId=${connectedAccountId}`,
              );
            }
          } catch (netErr: any) {
            // IMPORTANTE: este erro NÃO bloqueia o fluxo (charge.updated cobre o caso),
            // mas logamos o stack completo para não mascarar problemas reais
            // (ex: parâmetro inválido, conta sem permissão, etc).
            console.error(
              `[net_total] Erro ao tentar buscar balance_transaction antecipadamente para pedido ${orderId} (não bloqueia; charge.updated cobre):`,
              netErr.message,
              netErr.stack,
            );
          }
        } else {
          console.log(
            `[checkout.session.completed] payment_status="${session.payment_status}" (não é "paid"); pedido ${orderId} não foi marcado como pago.`,
          );
        }

        break;
      }

      // Responsável por salvar o net_total assim que a balance_transaction do
      // charge estiver disponível. Isso cobre o caso em que checkout.session.completed
      // chega antes da application fee/balance_transaction serem calculadas.
      case "charge.updated": {
        const charge = event.data.object as Stripe.Charge;
        const orderId = charge.metadata?.order_id;
        const connectedAccountId = event.account;

        // Log bruto ANTES de qualquer lógica condicional — essencial pra saber
        // se o evento está chegando, se o metadata veio preenchido, e se a
        // balance_transaction já está presente neste momento.
        console.log(
          `[charge.updated] RAW charge_id=${charge.id} order_id=${orderId ?? "AUSENTE"} status=${charge.status} paid=${charge.paid} balance_transaction=${JSON.stringify(
            charge.balance_transaction,
          )} metadata=${JSON.stringify(charge.metadata)} account=${connectedAccountId ?? "AUSENTE"}`,
        );

        if (!orderId) {
          // Não é um charge relacionado a um pedido nosso (metadata vem do
          // payment_intent_data.metadata configurado na criação do checkout).
          console.log(
            `[charge.updated] Ignorado: sem order_id no metadata do charge ${charge.id}. Isso é esperado para charges fora do fluxo de pedidos.`,
          );
          break;
        }

        const balanceTransactionId =
          typeof charge.balance_transaction === "string" ? charge.balance_transaction : charge.balance_transaction?.id;

        if (!balanceTransactionId) {
          // balance_transaction ainda não foi atribuída a este charge; ignoramos
          // e aguardamos uma futura entrega de charge.updated.
          console.log(`[charge.updated] Pedido ${orderId} ainda sem balance_transaction; ignorando por enquanto.`);
          break;
        }

        try {
          if (!connectedAccountId) {
            console.warn(`[charge.updated] Evento sem event.account para pedido ${orderId}; não é possível buscar.`);
            break;
          }

          const balanceTransaction = await stripe.balanceTransactions.retrieve(balanceTransactionId, {
            stripeAccount: connectedAccountId,
          });

          console.log(
            `[charge.updated] balance_transaction recuperada: id=${balanceTransaction.id} net=${balanceTransaction.net} currency=${balanceTransaction.currency} fee=${balanceTransaction.fee}`,
          );

          const netTotal = calcNetTotal(balanceTransaction);

          const { error } = await supabase
            .from("orders")
            .update({ net_total: netTotal, updated_at: new Date().toISOString() })
            .eq("id", orderId);

          if (error) {
            console.error(`Erro ao salvar net_total (via charge.updated) do pedido ${orderId}:`, error);
            return new Response(JSON.stringify({ error: "DB update failed" }), {
              status: 500,
              headers: { "Content-Type": "application/json" },
            });
          }

          console.log(`💰 net_total salvo via charge.updated para pedido ${orderId}: ${netTotal}`);
        } catch (err: any) {
          console.error(`[charge.updated] Erro ao buscar balance_transaction do pedido ${orderId}:`, err.message, err.stack);
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
