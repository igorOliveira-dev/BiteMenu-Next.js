import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
  } catch (err) {
    console.error("[Webhook] Assinatura inválida:", err.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  try {
    switch (event.type) {
      // Quando usuário conclui checkout
      case "checkout.session.completed": {
        const session = await stripe.checkout.sessions.retrieve(event.data.object.id, { expand: ["line_items"] });
        const userId = session.metadata?.supabase_user_id;
        const subscriptionId = session.subscription;
        const priceId = session.line_items.data[0].price.id;

        if (!userId || !priceId) throw new Error("Dados insuficientes");

        const { data: planData } = await supabase.from("plans").select("role").eq("stripe_price_id", priceId).maybeSingle();

        if (!planData) throw new Error("Plano não encontrado");

        await supabase
          .from("profiles")
          .update({ role: planData.role, stripe_subscription_id: subscriptionId, stripe_price_id: priceId })
          .eq("id", userId);

        console.log("[Webhook] Role atualizado para:", planData.role);
        break;
      }

      // Quando assinatura é cancelada ou expira
      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        const customerId = subscription.customer;

        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("stripe_customer_id", customerId)
          .maybeSingle();

        if (!profile) throw new Error("Usuário não encontrado para cancelamento");

        await supabase
          .from("profiles")
          .update({ role: "free", stripe_subscription_id: null, stripe_price_id: null })
          .eq("id", profile.id);

        console.log("[Webhook] Assinatura cancelada, role revertido para free");
        break;
      }

      // Opcional: quando pagamento falha
      case "invoice.payment_failed": {
        const invoice = event.data.object;
        const customerId = invoice.customer;

        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("stripe_customer_id", customerId)
          .maybeSingle();

        if (!profile) break; // se não achar, apenas ignore

        await supabase.from("profiles").update({ role: "free" }).eq("id", profile.id);

        console.log("[Webhook] Pagamento falhou, role revertido para free");
        break;
      }

      default:
        console.log(`[Webhook] Evento não tratado: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 });
  } catch (err) {
    console.error("[Webhook] Erro inesperado:", err);
    return new Response("Erro interno", { status: 500 });
  }
}
