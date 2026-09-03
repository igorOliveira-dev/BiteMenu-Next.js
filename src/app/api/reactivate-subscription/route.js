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

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("stripe_account")
      .eq("id", userId)
      .single();

    if (profileError) throw profileError;

    const stripe = getStripeClient(profile?.stripe_account ?? "cpf");

    // Desfaz o cancelamento agendado — a assinatura volta a renovar normalmente.
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: false,
    });

    await supabase.from("profiles").update({ cancel_at_period_end: false }).eq("id", userId);

    return new Response(JSON.stringify({ subscription }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[Stripe Reactivate] Erro:", error);
    return new Response(JSON.stringify({ error: error.message || "Erro interno" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
