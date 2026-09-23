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

    const stripe = getStripeClient(profile?.stripe_account ?? "cnpj");

    const current = await stripe.subscriptions.retrieve(subscriptionId);

    // Uma subscription presa a um Subscription Schedule (downgrade agendado)
    // não aceita cancel_at_period_end direto — a Stripe exige mexer no
    // schedule. Cancelar tem prioridade sobre o downgrade pendente: libera
    // o schedule (a subscription fica no price/fase atual) e cancela normal.
    if (current.schedule) {
      await stripe.subscriptionSchedules.release(current.schedule);
    }

    // Agenda o cancelamento pro fim do período já pago. O acesso continua
    // liberado até lá — o corte real (role -> free) acontece no webhook
    // customer.subscription.deleted, quando o período efetivamente termina.
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });

    await supabase
      .from("profiles")
      .update({ cancel_at_period_end: true, scheduled_downgrade_price_id: null })
      .eq("id", userId);

    return new Response(JSON.stringify({ subscription }), {
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
