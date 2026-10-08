import { validapay, getUserFromRequest } from "@/lib/validapay";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { brDate } from "@/lib/brDate";

// Mesmas formas aceitas no checkout
const METHODS = ["creditcard", "pix_automatico", "boleto"];
const OPEN_INVOICE = ["PENDING", "AWAITING_PAYMENT", "OVERDUE"];

// Troca a forma de pagamento da assinatura.
// Com fatura em aberto ela é reemitida na forma nova e o boleto em aberto é cancelado
// (senão o cliente podia pagar os dois); sem fatura em aberto vale a partir da próxima cobrança.
export async function POST(req) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return Response.json({ error: "Não autenticado" }, { status: 401 });

    const { method } = await req.json();
    if (!METHODS.includes(method)) return Response.json({ error: "Forma de pagamento inválida" }, { status: 400 });

    const { data: profile, error } = await supabaseAdmin
      .from("profiles")
      .select("validapay_subscription_id")
      .eq("id", user.id)
      .single();
    if (error) throw error;
    if (!profile.validapay_subscription_id) {
      return Response.json({ error: "Nenhuma assinatura ativa" }, { status: 400 });
    }

    const subId = profile.validapay_subscription_id;
    const sub = await validapay(`/v1/subscriptions/${subId}`);
    const hasOpenInvoice = (sub.billingCycles ?? [])
      .flatMap((c) => c.invoices ?? [])
      .some((i) => OPEN_INVOICE.includes(i.status));

    // Cartão sem fatura em aberto exige o cartão tokenizado (SDK no navegador), que não usamos.
    // Com fatura em aberto a ValidaPay devolve o link da fatura pro cliente informar o cartão lá.
    if (method === "creditcard" && !hasOpenInvoice) {
      return Response.json(
        {
          error: `A troca para cartão fica disponível quando a próxima cobrança for gerada, perto do vencimento${
            sub.nextCycleChargeDate ? ` (${brDate(sub.nextCycleChargeDate)})` : ""
          }. Volte aqui nessa data.`,
        },
        { status: 400 },
      );
    }

    const result = await validapay(`/v1/subscriptions/${subId}/payment-method`, {
      method: "PUT",
      body: {
        paymentMethod: method,
        ...(hasOpenInvoice ? { applyTo: "CURRENT_CYCLE", cancelOpenBoleto: true } : { applyTo: "NEXT_CYCLE" }),
      },
    });

    // Cartão e Pix Automático terminam na ValidaPay (informar o cartão / autorizar o débito no banco).
    // ponytail: a doc não nomeia o campo do link do Pix Automático; pega a primeira URL da resposta
    const url =
      method !== "boleto" ? (result.checkoutUrl ?? JSON.stringify(result).match(/"(https:\/\/[^"]+)"/)?.[1]) : null;

    return Response.json({ type: result.type, url: url ?? null });
  } catch (err) {
    console.error("[ValidaPay Payment Method] Erro:", err);
    return Response.json({ error: err.message || "Erro interno" }, { status: 500 });
  }
}
