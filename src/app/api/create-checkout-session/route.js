import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

export async function POST(req) {
  try {
    const { userId, priceId } = await req.json();

    if (!userId || !priceId) {
      return new Response(JSON.stringify({ error: "userId ou priceId ausente" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 🔹 Buscar perfil do usuário
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("stripe_customer_id, stripe_subscription_id, role")
      .eq("id", userId)
      .maybeSingle();

    if (profileError) throw profileError;

    let customerId = profile?.stripe_customer_id;

    // 🔹 Criar cliente no Stripe se ainda não existir
    if (!customerId) {
      const customer = await stripe.customers.create({
        metadata: { supabase_user_id: userId },
      });
      customerId = customer.id;

      await supabase.from("profiles").update({ stripe_customer_id: customerId }).eq("id", userId);
    }

    // 🔹 NOVO TRECHO: impedir compra se já tiver assinatura ativa
    if (profile?.stripe_subscription_id || profile?.role !== "free") {
      return new Response(
        JSON.stringify({
          error: "Você já possui um plano ativo. Cancele o atual antes de assinar outro.",
          existing_subscription: true,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // 🔹 Caso não tenha assinatura ainda → criar sessão de checkout normal
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: { supabase_user_id: userId },
      success_url: `${process.env.APP_URL}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.APP_URL}/billing/cancel`,
    });

    return new Response(JSON.stringify({ url: session.url }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[Checkout] Erro:", error);
    return new Response(JSON.stringify({ error: error.message || "Erro interno" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
