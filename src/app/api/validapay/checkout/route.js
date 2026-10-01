import { validapay, getUserFromRequest, PRICE_IDS, findLiveSubscription } from "@/lib/validapay";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { plansBlockedFor } from "@/consts/Plans";

const json = (body, status = 200) => Response.json(body, { status });

export async function POST(req) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return json({ error: "Não autenticado" }, 401);
    if (plansBlockedFor(user.email)) return json({ error: "Contratação temporariamente indisponível." }, 503);

    const { planId, cycle } = await req.json();
    const priceId = PRICE_IDS[planId]?.[cycle === "yearly" ? "yearly" : "monthly"];
    if (!priceId) return json({ error: "Plano inválido" }, 400);

    const { data: profile, error } = await supabaseAdmin
      .from("profiles")
      .select("display_name, validapay_subscription_id")
      .eq("id", user.id)
      .single();
    if (error) throw error;

    if (profile.validapay_subscription_id) {
      return json({ error: "Você já possui uma assinatura. Para mudar de plano, use a opção Trocar de plano." }, 400);
    }

    if (await findLiveSubscription(user.email)) {
      return json(
        {
          error:
            "Você já tem uma assinatura ativa. Se acabou de pagar, aguarde alguns minutos e atualize a página de Detalhes do Plano.",
        },
        400,
      );
    }

    const baseUrl = process.env.APP_URL || "https://bitemenu.com.br";

    // CPF/CNPJ e forma de pagamento são preenchidos pelo cliente na página da ValidaPay.
    // O role só muda quando a assinatura é ativada (webhook).
    const session = await validapay("/v1/checkout-sessions", {
      method: "POST",
      body: {
        priceId,
        // Sem isso a ValidaPay usa o padrão da conta (só PIX). Pix Automático no lugar do PIX comum:
        // o cliente autoriza uma vez no banco e as renovações são debitadas sozinhas.
        allowedPaymentMethods: ["pix_automatico", "creditcard", "boleto"],
        subscriptionAllowedPaymentMethods: ["pix_automatico", "creditcard", "boleto"],
        customer: { name: profile.display_name || undefined, email: user.email },
        companyName: "Bite Menu",
        successUrl: `${baseUrl}/dashboard?tab=planDetails`,
        failureUrl: `${baseUrl}/dashboard/pricing`,
        termsOfServiceUrl: `${baseUrl}/termos-de-uso`,
        privacyPolicyUrl: `${baseUrl}/politica-de-privacidade`,
        metadata: { userId: user.id, plan: planId, cycle: cycle === "yearly" ? "yearly" : "monthly" },
      },
    });

    return json({ url: session.url });
  } catch (err) {
    console.error("[ValidaPay Checkout] Erro:", err);
    return json({ error: err.message || "Erro interno" }, 500);
  }
}
