import { getStripeClient } from "@/lib/stripe";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// Sem plano anual por enquanto: a única variável é o tier.
const TIER_RANK = { free: 0, plus: 1, pro: 2 };

export async function POST(req) {
  try {
    const { userId, newPriceId } = await req.json();

    if (!userId || !newPriceId) {
      return new Response(JSON.stringify({ error: "userId e newPriceId são obrigatórios" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("stripe_account, stripe_subscription_id, stripe_price_id, role, cancel_at_period_end")
      .eq("id", userId)
      .single();

    if (profileError) throw profileError;

    if (!profile?.stripe_subscription_id) {
      return new Response(JSON.stringify({ error: "Você não possui uma assinatura ativa para trocar de plano." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (profile.cancel_at_period_end) {
      return new Response(
        JSON.stringify({ error: "Sua assinatura está cancelada. Reative-a antes de trocar de plano." }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    if (newPriceId === profile.stripe_price_id) {
      return new Response(JSON.stringify({ error: "Você já está nesse plano." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { data: plansData, error: plansError } = await supabase
      .from("plans")
      .select("role, stripe_price_id")
      .in("stripe_price_id", [profile.stripe_price_id, newPriceId]);

    if (plansError) throw plansError;

    const currentPlan = plansData?.find((p) => p.stripe_price_id === profile.stripe_price_id);
    const newPlan = plansData?.find((p) => p.stripe_price_id === newPriceId);

    if (!newPlan) {
      return new Response(JSON.stringify({ error: "Plano de destino não encontrado." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const currentRank = TIER_RANK[currentPlan?.role] ?? TIER_RANK[profile.role] ?? 0;
    const newRank = TIER_RANK[newPlan.role];
    const isUpgrade = newRank > currentRank;

    const stripe = getStripeClient(profile.stripe_account ?? "cpf");
    const subscriptionId = profile.stripe_subscription_id;

    if (isUpgrade) {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
        expand: ["default_payment_method"],
      });

      // Se havia um downgrade agendado, ele perde o sentido: um upgrade
      // imediato substitui a intenção anterior do usuário.
      if (subscription.schedule) {
        await stripe.subscriptionSchedules.release(subscription.schedule);
      }

      const itemId = subscription.items.data[0].id;

      await stripe.subscriptions.update(subscriptionId, {
        items: [{ id: itemId, price: newPriceId }],
        proration_behavior: "create_prorations",
      });

      // proration_behavior só calcula a diferença e deixa como item pendente
      // pra próxima fatura — sem isso, a cobrança do upgrade só aconteceria
      // na renovação, e o cliente ficaria um ciclo inteiro no plano maior
      // pagando o preço do menor. Criamos e cobramos a fatura na hora.
      const invoice = await stripe.invoices.create({
        customer: subscription.customer,
        subscription: subscriptionId,
        auto_advance: false,
      });

      // O price da subscription já mudou na Stripe de qualquer forma — isso
      // sempre reflete a cobrança em andamento (igual ao checkout inicial).
      const baseUpdate = { stripe_price_id: newPriceId, scheduled_downgrade_price_id: null };

      let paidInvoice;

      try {
        // Pra boleto (e cartão com 3D Secure), é a PRÓPRIA finalização que já
        // tenta cobrar automaticamente e pode lançar erro — não só o pay()
        // logo depois. As duas chamadas precisam estar no mesmo try.
        const finalizedInvoice = await stripe.invoices.finalizeInvoice(invoice.id);
        paidInvoice = await stripe.invoices.pay(finalizedInvoice.id);
      } catch (payError) {
        // Esse código específico é como a Stripe sinaliza "precisa de ação
        // do cliente" (boleto gerado, 3D Secure pendente) — não é uma falha
        // real de pagamento. Nessa conta a Invoice não expõe payment_intent
        // direto (API de Invoice Payments mais nova), então confiamos no
        // `code` documentado em vez de tentar inspecionar o payment_intent.
        if (payError.code !== "invoice_payment_intent_requires_action") throw payError;

        paidInvoice = await stripe.invoices.retrieve(invoice.id);
      }

      // Só liberamos o acesso ao plano novo se a fatura realmente já foi paga
      // — do contrário o webhook invoice.paid libera quando compensar, igual
      // já acontece na assinatura inicial via boleto.
      if (paidInvoice.status === "paid") {
        await supabase
          .from("profiles")
          .update({ ...baseUpdate, role: newPlan.role })
          .eq("id", userId);

        return new Response(JSON.stringify({ type: "upgrade", role: newPlan.role }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      await supabase.from("profiles").update(baseUpdate).eq("id", userId);

      return new Response(
        JSON.stringify({
          type: "upgrade_pending",
          role: newPlan.role,
          payment_method_type: subscription.default_payment_method?.type ?? null,
          invoice_url: paidInvoice.hosted_invoice_url ?? null,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }

    // Downgrade: não aplica agora, não prorrata. Agenda a troca de price
    // pra data de renovação via Subscription Schedule.
    let subscription = await stripe.subscriptions.retrieve(subscriptionId);

    if (subscription.schedule) {
      await stripe.subscriptionSchedules.release(subscription.schedule);
      subscription = await stripe.subscriptions.retrieve(subscriptionId);
    }

    const schedule = await stripe.subscriptionSchedules.create({ from_subscription: subscriptionId });
    const currentPhase = schedule.phases[0];

    await stripe.subscriptionSchedules.update(schedule.id, {
      phases: [
        {
          items: currentPhase.items.map((item) => ({ price: item.price, quantity: item.quantity })),
          start_date: currentPhase.start_date,
          end_date: currentPhase.end_date,
          proration_behavior: "none",
        },
        {
          items: [{ price: newPriceId }],
          proration_behavior: "none",
        },
      ],
    });

    await supabase.from("profiles").update({ scheduled_downgrade_price_id: newPriceId }).eq("id", userId);

    return new Response(
      JSON.stringify({ type: "downgrade_scheduled", role: newPlan.role, effective_at: currentPhase.end_date }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("[Change Subscription Plan] Erro:", error);
    return new Response(JSON.stringify({ error: error.message || "Erro interno" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
