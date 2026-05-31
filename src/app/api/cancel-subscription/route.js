import { getStripeClient } from "@/lib/stripe";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

export async function POST(req) {
  try {
    const { subscriptionId, userId } = await req.json();

    if (!subscriptionId || !userId) {
      return new Response(JSON.stringify({ error: "subscriptionId e userId são obrigatórios" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Busca stripe_account do perfil
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("stripe_account")
      .eq("id", userId)
      .single();

    if (profileError) throw profileError;

    const stripe = getStripeClient(profile?.stripe_account ?? "cpf");

    // Cancela no Stripe
    const deleted = await stripe.subscriptions.cancel(subscriptionId);

    // Atualiza perfil no Supabase para plano Free
    await supabase
      .from("profiles")
      .update({ stripe_subscription_id: null, stripe_price_id: null, role: "free" })
      .eq("id", userId);

    return new Response(JSON.stringify({ deleted }), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (error) {
    console.error("[Stripe Cancel] Erro:", error);
    return new Response(JSON.stringify({ error: error.message || "Erro interno" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
