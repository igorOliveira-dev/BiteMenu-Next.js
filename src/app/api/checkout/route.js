// // pages/api/create-checkout-session.js
// import Stripe from "stripe";
// import { createClient } from "@supabase/supabase-js";

// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
// const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// export default async function handler(req, res) {
//   const { userId, priceId } = req.body; // userId do Supabase (server-side)
//   if (req.method !== "POST") return res.status(405).end();

//   // 1) ensure customer exists in Stripe
//   const { data: profile } = await supabase.from("profiles").select("stripe_customer_id").eq("id", userId).single();

//   let customerId = profile?.stripe_customer_id;
//   if (!customerId) {
//     const customer = await stripe.customers.create({
//       metadata: { supabase_user_id: userId },
//     });
//     customerId = customer.id;
//     await supabase.from("profiles").update({ stripe_customer_id: customerId }).eq("id", userId);
//   }

//   // 2) create checkout session
//   const session = await stripe.checkout.sessions.create({
//     mode: "subscription",
//     payment_method_types: ["card"],
//     customer: customerId,
//     line_items: [{ price: priceId, quantity: 1 }],
//     success_url: `${process.env.APP_URL}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
//     cancel_url: `${process.env.APP_URL}/billing/cancel`,
//   });

//   return res.json({ url: session.url });
// }
