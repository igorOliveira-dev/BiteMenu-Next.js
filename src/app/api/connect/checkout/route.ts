import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getStripeClient } from "@/lib/stripe";

const stripe = getStripeClient("cnpj");

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY, // service role para leitura de profiles
);

export async function POST(request) {
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
      deliveryFee,
      total,
      costumerName,
      costumerPhone,
      costumerAddress,
      costumerNeighborhood,
      paymentMethod,
      service,
      detailsColor,
      // metadados extras para reconstruir o pedido no webhook
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

    // 2. Calcular application fee (taxa do Bite Menu)
    // stripe_fee_percentage é ex: 5 para 5%, armazenado como numeric
    const feePercentage = Number(profile.stripe_fee_percentage ?? 0);
    const applicationFeeAmount = Math.round((total * feePercentage) / 100); // em centavos

    // 3. Converter total para centavos (Stripe usa a menor unidade)
    const totalInCents = Math.round(total * 100);

    // 4. Montar line_items — um item consolidado com o nome do pedido
    //    (opcionalmente pode expandir por item, mas um item único é mais limpo no checkout)
    const lineItems = [
      {
        price_data: {
          currency: (currency || "brl").toLowerCase(),
          product_data: {
            name: `Pedido em ${menuTitle}`,
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

    // 5. Serializar metadados do pedido para uso no webhook
    //    Stripe metadata é key-value string, limite de 500 chars por value
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
      total,
      is_paid: false, // será atualizado para true via webhook
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Salvar pedido pendente no Supabase agora e guardar o ID
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

    // 6. URLs de retorno
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://bitemenu.com.br";
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
        payment_intent_data: {
          application_fee_amount: applicationFeeAmount,
          // transfer_destination é implícito via on_behalf_of no Connect Express
        },
        metadata: {
          order_id: orderId,
          menu_id: menuId,
          menu_slug: menuSlug,
        },
        // Exibir nome do cliente pré-preenchido (se disponível)
        ...(costumerName && {
          customer_creation: "always",
        }),
        locale: "pt-BR",
      },
      {
        // Executar em nome da conta conectada (Stripe Connect Express)
        stripeAccount: profile.stripe_connect_account_id,
      },
    );

    return NextResponse.json({ url: session.url, orderId });
  } catch (err) {
    console.error("Stripe checkout error:", err);
    console.error("Erro interno na checkout route:", err);
    return NextResponse.json({ error: err.message || "Erro interno ao criar checkout." }, { status: 500 });
  }
}
