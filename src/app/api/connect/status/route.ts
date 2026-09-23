import { getStripeClient } from "@/lib/stripe";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function POST(req: Request) {
  try {
    const { userId } = await req.json();

    const { data: profile } = await supabase.from("profiles").select("stripe_connect_account_id").eq("id", userId).single();

    if (!profile?.stripe_connect_account_id) {
      return Response.json({
        connected: false,
      });
    }

    const stripe = getStripeClient("cnpj");

    const account = await stripe.accounts.retrieve(profile.stripe_connect_account_id);

    const connected = account.details_submitted && account.charges_enabled && account.payouts_enabled;

    if (connected) {
      await supabase
        .from("profiles")
        .update({
          stripe_connect_ready: true,
        })
        .eq("id", userId);
    }

    return Response.json({
      connected,
      details_submitted: account.details_submitted,
      charges_enabled: account.charges_enabled,
      payouts_enabled: account.payouts_enabled,
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
