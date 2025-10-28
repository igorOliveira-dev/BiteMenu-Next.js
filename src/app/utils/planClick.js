import { supabase } from "@/lib/supabaseClient";

export const planClick = async (plan) => {
  if (plan === "free") {
    window.location.href = "/dashboard";
    return;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    alert("Você precisa estar logado para assinar um plano.");
    window.location.href = `/login?redirect=/dashboard/pricing`;
    return;
  }

  const { data: planData, error } = await supabase.from("plans").select("stripe_price_id").eq("role", plan).single();

  if (error || !planData) {
    console.error("Erro ao buscar plano:", error);
    alert("Não foi possível iniciar a assinatura. Tente novamente.");
    return;
  }

  const res = await fetch("/api/create-checkout-session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId: user.id,
      priceId: planData.stripe_price_id,
    }),
  });

  if (!res.ok) {
    alert("Erro ao iniciar o pagamento. Tente novamente.");
    return;
  }

  const { url } = await res.json();
  window.location.href = url;
};
