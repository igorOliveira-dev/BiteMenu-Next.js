import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getStripeClient } from "@/lib/stripe";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const ZERO_DECIMAL_CURRENCIES = [
  "bif",
  "clp",
  "djf",
  "gnf",
  "jpy",
  "kmf",
  "krw",
  "mga",
  "pyg",
  "rwf",
  "ugx",
  "vnd",
  "vuv",
  "xaf",
  "xof",
  "xpf",
];

export async function POST(request) {
  const stripe = getStripeClient("cnpj");

  try {
    const body = await request.json();
    const {
      menuId,
      menuTitle,
      menuSlug,
      ownerId,
      currency,
      items,
      subtotal,
      discount,
      deliveryFee,
      total,
      costumerName,
      costumerPhone,
      costumerAddress,
      costumerNeighborhood,
      paymentMethod,
      service,
      detailsColor,
    } = body;

    // 1. Buscar o stripe_account e stripe_fee_percentage do dono do menu
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("stripe_connect_account_id, stripe_fee_percentage")
      .eq("id", ownerId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: "Perfil do estabelecimento não encontrado." }, { status: 404 });
    }

    if (!profile.stripe_connect_account_id) {
      return NextResponse.json({ error: "Estabelecimento sem conta Stripe configurada." }, { status: 400 });
    }

    // 2. Converter total para a menor unidade da moeda
    const currencyLower = (currency || "brl").toLowerCase();
    const isZeroDecimal = ZERO_DECIMAL_CURRENCIES.includes(currencyLower);
    const totalInCents = isZeroDecimal ? Math.round(total) : Math.round(total * 100);

    // 3. Calcular application fee sobre o valor já em centavos
    const feePercentage = Number(profile.stripe_fee_percentage ?? 0);
    const applicationFeeAmount = Math.round((totalInCents * feePercentage) / 100);

    // 4. Salvar pedido pendente no Supabase
    const orderPayload = {
      menu_id: menuId,
      costumer_name: costumerName,
      costumer_phone: costumerPhone,
      payment_method: "stripe",
      service,
      items_list: items,
      neighborhood: costumerNeighborhood ?? null,
      address: costumerAddress ?? null,
      delivery_fee: deliveryFee,
      discount: discount ?? 0,
      total,
      is_paid: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: insertedOrder, error: insertError } = await supabase
      .from("orders")
      .insert([orderPayload])
      .select("id")
      .single();

    if (insertError) {
      console.error("Erro ao inserir pedido pendente:", insertError);
      return NextResponse.json({ error: "Erro ao registrar pedido." }, { status: 500 });
    }

    const orderId = insertedOrder.id;
    const shortOrderId = String(orderId).slice(0, 6);

    // 5. Montar line_items
    const lineItems = [
      {
        price_data: {
          currency: currencyLower,
          product_data: {
            name: `Pedido #${shortOrderId} - ${menuTitle}`,
            description: items
              .map(
                (it) =>
                  `${it.qty}x ${it.name}${
                    it.additionals?.length ? ` (+${it.additionals.map((a) => a.name).join(", ")})` : ""
                  }`,
              )
              .join(" | "),
          },
          unit_amount: totalInCents,
        },
        quantity: 1,
      },
    ];

    // 6. URLs de retorno
    const baseUrl = process.env.APP_URL || "https://bitemenu.com.br";
    const successUrl = `${baseUrl}/menu/${menuSlug}?order_success=true&order_id=${orderId}`;
    const cancelUrl = `${baseUrl}/menu/${menuSlug}?order_cancelled=true`;

    // 7. Criar Checkout Session no Stripe
    const session = await stripe.checkout.sessions.create(
      {
        payment_method_types: ["card"],
        mode: "payment",
        line_items: lineItems,
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          order_id: String(orderId),
        },
        payment_intent_data: {
          application_fee_amount: applicationFeeAmount,
          metadata: {
            order_id: String(orderId),
            menu_id: String(menuId),
            menu_slug: String(menuSlug),
          },
        },
        ...(costumerName && { customer_creation: "always" }),
        locale: "pt-BR",
      },
      {
        stripeAccount: profile.stripe_connect_account_id,
      },
    );

    return NextResponse.json({ url: session.url, orderId });
  } catch (err) {
    console.error("Stripe checkout error:", err);
    return NextResponse.json({ error: err.message || "Erro interno ao criar checkout." }, { status: 500 });
  }
}
