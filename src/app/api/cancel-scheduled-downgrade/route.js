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

    const subscription = await stripe.subscriptions.retrieve(subscriptionId);

    if (subscription.schedule) {
      await stripe.subscriptionSchedules.release(subscription.schedule);
    }

    await supabase.from("profiles").update({ scheduled_downgrade_price_id: null }).eq("id", userId);

    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (error) {
    console.error("[Cancel Scheduled Downgrade] Erro:", error);
    return new Response(JSON.stringify({ error: error.message || "Erro interno" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
