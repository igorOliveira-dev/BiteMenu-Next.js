import { getStripeClient } from "@/lib/stripe";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function POST(req: Request) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return Response.json(
        {
          error: "userId não informado",
        },
        {
          status: 400,
        },
      );
    }

    const stripe = getStripeClient("cnpj");

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("stripe_connect_account_id")
      .eq("id", userId)
      .single();

    if (profileError) {
      throw profileError;
    }

    let accountId = profile?.stripe_connect_account_id;

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

      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          stripe_connect_account_id: account.id,
        })
        .eq("id", userId);

      if (updateError) {
        throw updateError;
      }
    }

    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      type: "account_onboarding",
      refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?tab=biteMenuPayments`,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?tab=biteMenuPayments&connect=success`,
    });

    return Response.json({
      url: accountLink.url,
    });
  } catch (error: any) {
    console.error("CONNECT ERROR:", error);

    return Response.json(
      {
        error: error?.message ?? "Erro desconhecido",
      },
      {
        status: 500,
      },
    );
  }
}
