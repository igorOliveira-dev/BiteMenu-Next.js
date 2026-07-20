import { getStripeClient } from "@/lib/stripe";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const subscriptionId = searchParams.get("subscriptionId");
    const userId = searchParams.get("userId");

    if (!subscriptionId) {
      return new Response(
        JSON.stringify({
          id: null,
          status: "active",
          plan_name: "Free",
          plan_price: 0,
          current_period_end: null,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }

    // Busca stripe_account do perfil
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("stripe_account")
      .eq("id", userId)
      .single();

    if (profileError) throw profileError;

    const stripe = getStripeClient(profile?.stripe_account ?? "cpf");

    // 1️⃣ Buscar a assinatura completa
    const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
      expand: [
        "items.data.price",
        "latest_invoice",
        "latest_invoice.payment_intent",
        "latest_invoice.payment_intent.payment_method",
      ],
    });

    const invoice = subscription.latest_invoice;
    const paymentIntent = invoice?.payment_intent ?? null;

    // 2️⃣ Determinar data de cobrança
    let currentPeriodEnd = subscription.current_period_end || null;

    // 🔁 Fallback 1: próxima fatura agendada
    if (!currentPeriodEnd) {
      try {
        const upcoming = await stripe.invoices.retrieveUpcoming({
          subscription: subscriptionId,
        });
        if (upcoming.next_payment_attempt) {
          currentPeriodEnd = Math.floor(upcoming.next_payment_attempt);
        }
      } catch {
        // Sem próxima cobrança agendada
      }
    }

    // 🔁 Fallback 2: period_end do último item
    if (!currentPeriodEnd && subscription.items?.data?.length > 0) {
      const lastItem = subscription.items.data[0];
      if (lastItem?.period?.end) {
        currentPeriodEnd = Math.floor(lastItem.period.end);
      }
    }

    // 🔁 Fallback 3: fatura associada
    if (!currentPeriodEnd && subscription.latest_invoice) {
      const inv = await stripe.invoices.retrieve(subscription.latest_invoice.id);
      if (inv.lines?.data?.length > 0) {
        const lastLine = inv.lines.data[inv.lines.data.length - 1];
        if (lastLine.period?.end) {
          currentPeriodEnd = Math.floor(lastLine.period.end);
        }
      }
    }

    // 3️⃣ Buscar nome e preço do plano no Supabase
    const stripePriceId = subscription.items?.data?.[0]?.price?.id;
    let planName = "Plano Desconhecido";
    let planPrice = null;

    if (stripePriceId) {
      const { data: plan } = await supabase
        .from("plans")
        .select("role, price")
        .eq("stripe_price_id", stripePriceId)
        .maybeSingle();

      if (plan) {
        planName = plan.role;
        planPrice = plan.price;
      }
    }

    // 4️⃣ Buscar método de pagamento usado na ÚLTIMA cobrança (não qualquer cartão salvo)
    const paymentMethodType = paymentIntent?.payment_method?.type ?? null;

    let cardInfo = null;
    if (paymentMethodType === "card" && paymentIntent?.payment_method?.card) {
      const card = paymentIntent.payment_method.card;
      cardInfo = {
        brand: card.brand,
        last4: card.last4,
        exp_month: card.exp_month,
        exp_year: card.exp_year,
      };
    }

    // 5️⃣ Detectar boleto pendente (fatura aberta, aguardando compensação)
    const boletoUrl =
      paymentIntent?.next_action?.boleto_display_details?.hosted_voucher_url ?? invoice?.hosted_invoice_url ?? null;

    // 6️⃣ Retornar tudo pro frontend
    return new Response(
      JSON.stringify({
        id: subscription.id,
        status: subscription.status,
        plan_name: planName,
        plan_price: planPrice,
        current_period_end: currentPeriodEnd,
        card_info: cardInfo,
        latest_invoice_status: invoice?.status ?? null,
        latest_invoice_url: invoice?.hosted_invoice_url ?? null,
        payment_method_type: paymentMethodType,
        boleto_url: paymentMethodType === "boleto" ? boletoUrl : null,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("[Stripe Subscription] Erro:", error);
    return new Response(JSON.stringify({ error: error.message || "Erro interno ao buscar assinatura" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
