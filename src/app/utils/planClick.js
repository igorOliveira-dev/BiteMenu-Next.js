import { supabase } from "@/lib/supabaseClient";

export const planClick = async (plan, withTrial = false) => {
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

  // Busca o stripe_account do perfil do usuário
  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .select("stripe_account")
    .eq("id", user.id)
    .single();

  if (profileError || !profileData?.stripe_account) {
    console.error("Erro ao buscar perfil:", profileError);
    alert("Não foi possível identificar o tipo de conta. Tente novamente.");
    return;
  }

  // Busca o plano filtrando também pelo stripe_account do perfil
  const { data: planData, error } = await supabase
    .from("plans")
    .select("stripe_price_id")
    .eq("role", plan)
    .eq("active", true)
    .eq("stripe_account", profileData.stripe_account)
    .maybeSingle();

  console.log(planData, error);

  if (error || !planData?.stripe_price_id) {
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
      withTrial,
    }),
  });

  const result = await res.json();

  if (!res.ok) {
    if (result.existing_subscription) {
      alert("Você já possui um plano ativo. Cancele o atual antes de assinar outro.");
      window.location.href = "/dashboard";
    } else {
      alert(result.error || "Erro ao iniciar o pagamento. Tente novamente.");
    }
    return;
  }

  if (result.url) window.location.href = result.url;
  else alert("Nenhuma URL de pagamento retornada. Tente novamente mais tarde.");
};
