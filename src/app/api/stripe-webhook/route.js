import { stripeCPF, stripeCNPJ } from "@/lib/stripe";
import { createClient } from "@supabase/supabase-js";
import { plans } from "@/consts/Plans";
import { sendUpcomingRenewalEmail, sendBoletoReadyEmail } from "@/lib/emails/subscriptionEmails";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const webhookSecretCPF = process.env.STRIPE_WEBHOOK_SECRET_CPF;
const webhookSecretCNPJ = process.env.STRIPE_WEBHOOK_SECRET_CNPJ;

function planNameFromRole(role) {
  return plans.find((p) => p.id === role)?.name ?? role ?? null;
}

// Customer do Stripe às vezes não tem email salvo (checkout criado sem coletar);
// nesse caso cai pro email do usuário no Supabase Auth.
async function getCustomerEmail(stripe, customerId) {
  const customer = await stripe.customers.retrieve(customerId);
  if (customer && !customer.deleted && customer.email) return customer.email;

  const { data: profile } = await supabase.from("profiles").select("id").eq("stripe_customer_id", customerId).maybeSingle();

  if (!profile) return null;

  const { data: authUser } = await supabase.auth.admin.getUserById(profile.id);
  return authUser?.user?.email ?? null;
}

export async function POST(req) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  // Auto-detecta qual conta originou o evento tentando validar nas duas
  let event;
  let stripe;

  try {
    event = stripeCPF.webhooks.constructEvent(body, sig, webhookSecretCPF);
    stripe = stripeCPF;
  } catch {
    try {
      event = stripeCNPJ.webhooks.constructEvent(body, sig, webhookSecretCNPJ);
      stripe = stripeCNPJ;
    } catch (err) {
      console.error("[Webhook] Assinatura inválida:", err.message);
      return new Response(`Webhook Error: ${err.message}`, { status: 400 });
    }
  }

  try {
    switch (event.type) {
      // Quando usuário conclui checkout
      case "checkout.session.completed": {
        const session = event.data.object;

        // ── Pedido via Stripe Connect ──────────────────────────
        if (session.mode === "payment" && session.metadata?.order_id) {
          console.log(
            `[Webhook] Pedido ${session.metadata.order_id} via Connect ignorado neste endpoint (tratado no webhook Connect).`,
          );
          break;
        }

        // ── Assinatura ─────────────────────────────────────────
        const userId = session.metadata?.supabase_user_id;
        const subscriptionId = session.subscription;
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const isTrial = subscription.status === "trialing";

        const retrievedSession = await stripe.checkout.sessions.retrieve(session.id, {
          expand: ["line_items"],
        });
        const priceId = retrievedSession.line_items.data[0].price.id;

        if (!userId || !priceId) throw new Error("Dados insuficientes");

        const { data: planData } = await supabase.from("plans").select("role").eq("stripe_price_id", priceId).maybeSingle();

        if (!planData) throw new Error("Plano não encontrado");

        // Métodos assíncronos (boleto, pix) podem completar o Checkout
        // antes do pagamento em si ser confirmado. Nesses casos a assinatura
        // fica "incomplete" até o invoice.paid chegar — só liberamos o role
        // quando a assinatura já está ativa (cartão) ou em trial.
        const isPaymentConfirmed = ["active", "trialing"].includes(subscription.status);

        await supabase
          .from("profiles")
          .update({
            stripe_subscription_id: subscriptionId,
            stripe_price_id: priceId,
            ...(isPaymentConfirmed && { role: planData.role }),
            ...(isTrial && { has_used_trial: true }),
          })
          .eq("id", userId);

        console.log(
          isPaymentConfirmed
            ? `[Webhook] Role atualizado para: ${planData.role}`
            : `[Webhook] Checkout completo, aguardando confirmação de pagamento (status: ${subscription.status})`,
        );
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
          .update({
            role: "free",
            stripe_subscription_id: null,
            stripe_price_id: null,
            cancel_at_period_end: false,
            scheduled_downgrade_price_id: null,
          })
          .eq("id", profile.id);

        console.log("[Webhook] Assinatura cancelada, role revertido para free");
        break;
      }

      // Quando pagamento é bem-sucedido
      case "invoice.paid":
      case "invoice.payment_succeeded":
      case "invoice_payment.paid": {
        let invoiceObj = event.data.object;

        if (event.type === "invoice_payment.paid") {
          const invoiceId = typeof invoiceObj.invoice === "string" ? invoiceObj.invoice : invoiceObj.invoice?.id;

          if (!invoiceId) {
            console.log("[Webhook] invoice_payment.paid sem invoice id; ignorando");
            break;
          }

          invoiceObj = await stripe.invoices.retrieve(invoiceId);
        }

        const customerId = invoiceObj.customer;
        const subscriptionId = invoiceObj.subscription ?? invoiceObj.parent?.subscription_details?.subscription ?? null;

        if (!customerId || !subscriptionId) {
          console.log("[Webhook] paid sem customer/subscription; ignorando");
          break;
        }

        const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
          expand: ["items.data.price"],
        });

        const priceId = subscription.items?.data?.[0]?.price?.id;
        if (!priceId) throw new Error("Não consegui obter priceId da assinatura");

        const { data: planData, error: planErr } = await supabase
          .from("plans")
          .select("role")
          .eq("stripe_price_id", priceId)
          .maybeSingle();

        if (planErr) throw planErr;
        if (!planData) throw new Error("Plano não encontrado para esse priceId");

        const { data: profile, error: profErr } = await supabase
          .from("profiles")
          .select("id, scheduled_downgrade_price_id")
          .eq("stripe_customer_id", customerId)
          .maybeSingle();

        if (profErr) throw profErr;
        if (!profile) throw new Error("Usuário não encontrado para esse customer");

        // Se o price atual bate com o downgrade que estava agendado, a fase
        // do Subscription Schedule já entrou em vigor: limpa o agendamento.
        const downgradeApplied = profile.scheduled_downgrade_price_id === priceId;

        const { error: upErr } = await supabase
          .from("profiles")
          .update({
            role: planData.role,
            stripe_subscription_id: subscriptionId,
            stripe_price_id: priceId,
            ...(downgradeApplied && { scheduled_downgrade_price_id: null }),
          })
          .eq("id", profile.id);

        if (upErr) throw upErr;

        console.log("[Webhook] Pagou de novo; role restaurado para:", planData.role);
        break;
      }

      // Quando pagamento falha
      case "invoice.payment_failed": {
        console.log("[Webhook] Pagamento falhou, mantendo role até esgotar tentativas/cancelamento");
        break;
      }

      // sincroniza estado da assinatura (cancelamento agendado, boleto expirado, etc)
      case "customer.subscription.updated": {
        const subscription = event.data.object;
        const customerId = subscription.customer;

        const { data: profile } = await supabase
          .from("profiles")
          .select("id, stripe_subscription_id")
          .eq("stripe_customer_id", customerId)
          .maybeSingle();

        // só mexe se for realmente essa a assinatura salva no profile
        if (!profile || profile.stripe_subscription_id !== subscription.id) break;

        if (subscription.status === "incomplete_expired") {
          await supabase
            .from("profiles")
            .update({ stripe_subscription_id: null, stripe_price_id: null })
            .eq("id", profile.id);

          console.log("[Webhook] Boleto expirado sem pagamento, assinatura limpa do profile");
          break;
        }

        // Mantém o "cancelou, mas ainda tem acesso até X" sincronizado —
        // cobre tanto o cancel-subscription quanto uma reativação/edição
        // feita direto no Dashboard da Stripe.
        await supabase
          .from("profiles")
          .update({ cancel_at_period_end: subscription.cancel_at_period_end ?? false })
          .eq("id", profile.id);

        break;
      }

      // Aviso de renovação próxima (cartão e boleto)
      case "invoice.upcoming": {
        const invoiceObj = event.data.object;
        const customerId = invoiceObj.customer;
        const subscriptionId = invoiceObj.subscription ?? invoiceObj.parent?.subscription_details?.subscription ?? null;

        if (!customerId || !subscriptionId) {
          console.log("[Webhook] invoice.upcoming sem customer/subscription; ignorando");
          break;
        }

        const priceId = invoiceObj.lines?.data?.[0]?.price?.id;
        const { data: planData } = priceId
          ? await supabase.from("plans").select("role").eq("stripe_price_id", priceId).maybeSingle()
          : { data: null };

        const email = await getCustomerEmail(stripe, customerId);

        if (email) {
          await sendUpcomingRenewalEmail({
            to: email,
            planName: planNameFromRole(planData?.role),
            amountCents: invoiceObj.amount_due,
            renewalDate: new Date(invoiceObj.period_end * 1000),
          });
          console.log("[Webhook] Email de renovação próxima enviado para", email);
        } else {
          console.log("[Webhook] invoice.upcoming sem email disponível para customer", customerId);
        }

        break;
      }

      // Boleto disponível para pagamento — reage direto no payment_intent
      // (que já traz o boleto_display_details no próprio payload) em vez de
      // invoice.finalized + retrieve, porque no modo teste o Stripe simula o
      // pagamento do boleto poucos segundos depois e o retrieve chega tarde,
      // com o payment_intent já "succeeded" e sem next_action.
      case "payment_intent.requires_action": {
        const paymentIntent = event.data.object;
        const boletoDetails = paymentIntent.next_action?.boleto_display_details;

        // Não é boleto (ex: cartão pedindo 3D Secure) — nada a avisar aqui.
        if (!boletoDetails?.hosted_voucher_url) break;

        const customerId = paymentIntent.customer;

        if (!customerId) {
          console.log("[Webhook] payment_intent.requires_action (boleto) sem customer; ignorando");
          break;
        }

        // Essa versão da API não traz mais o id da invoice no payment_intent;
        // buscamos a invoice em aberto mais recente do customer.
        const openInvoices = await stripe.invoices.list({ customer: customerId, status: "open", limit: 1 });
        const invoiceObj = openInvoices.data[0];

        if (!invoiceObj) {
          console.log("[Webhook] payment_intent.requires_action (boleto) sem invoice em aberto para", customerId);
          break;
        }

        const priceId = invoiceObj.lines?.data?.[0]?.price?.id;
        const { data: planData } = priceId
          ? await supabase.from("plans").select("role").eq("stripe_price_id", priceId).maybeSingle()
          : { data: null };

        const email = await getCustomerEmail(stripe, customerId);

        if (email) {
          await sendBoletoReadyEmail({
            to: email,
            planName: planNameFromRole(planData?.role),
            amountCents: invoiceObj.amount_due,
            dueDate: boletoDetails.expires_at ? new Date(boletoDetails.expires_at * 1000) : new Date(),
            boletoUrl: boletoDetails.hosted_voucher_url,
          });
          console.log("[Webhook] Email de boleto disponível enviado para", email);
        } else {
          console.log("[Webhook] payment_intent.requires_action (boleto) sem email disponível para customer", customerId);
        }

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
