import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // chave de serviço
);

export async function POST(req) {
  try {
    const { subscriptionId } = await req.json();

    if (!subscriptionId) {
      return new Response(JSON.stringify({ error: "subscriptionId ausente" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Cancela no Stripe
    const deleted = await stripe.subscriptions.cancel(subscriptionId);

    // Atualiza profile no Supabase para plano Free
    await supabase
      .from("profiles")
      .update({ stripe_subscription_id: null, stripe_price_id: null, role: "free" })
      .eq("stripe_subscription_id", subscriptionId);

    return new Response(JSON.stringify({ deleted }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[Stripe Cancel] Erro:", error);
    return new Response(JSON.stringify({ error: error.message || "Erro interno" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
