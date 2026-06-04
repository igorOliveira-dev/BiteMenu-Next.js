import { getStripeClient } from "@/lib/stripe";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function POST(req: Request) {
  try {
    const { userId } = await req.json();

    const { data: profile } = await supabase.from("profiles").select("stripe_connect_account_id").eq("id", userId).single();

    if (!profile?.stripe_connect_account_id) {
      return Response.json(
        {
          error: "Conta Stripe não encontrada",
        },
        {
          status: 400,
        },
      );
    }

    const stripe = getStripeClient("cnpj");

    const loginLink = await stripe.accounts.createLoginLink(profile.stripe_connect_account_id);

    return Response.json({
      url: loginLink.url,
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
