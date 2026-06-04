import { getStripeClient } from "@/lib/stripe";
import { supabase } from "@/lib/supabaseClient";

export async function POST(req: Request) {
  try {
    const { userId } = await req.json();

    const stripe = getStripeClient("cnpj");

    const { data: profile } = await supabase.from("profiles").select("stripe_connect_account_id").eq("id", userId).single();

    let accountId = profile?.stripe_connect_account_id;

    // Cria conta Connect caso ainda não exista
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "express",
        country: "BR",
        capabilities: {
          card_payments: {
            requested: true,
          },
          transfers: {
            requested: true,
          },
        },
      });

      accountId = account.id;

      await supabase
        .from("profiles")
        .update({
          stripe_connect_account_id: account.id,
        })
        .eq("id", userId);
    }

    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      type: "account_onboarding",
      refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/payments`,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/payments`,
    });

    return Response.json({
      url: accountLink.url,
    });
  } catch (error: any) {
    return Response.json(
      {
        error: error.message,
      },
      {
        status: 500,
      },
    );
  }
}
