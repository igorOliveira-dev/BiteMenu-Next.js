import Stripe from "stripe";
import { headers } from "next/headers";
import { supabase } from "@/lib/supabaseClient";
import { getStripeClient } from "@/lib/stripe";

const stripe = getStripeClient("cnpj");

export async function POST(req: Request) {
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
