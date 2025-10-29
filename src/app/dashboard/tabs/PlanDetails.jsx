"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { FaChevronLeft } from "react-icons/fa";
import Loading from "@/components/Loading";
import { useConfirm } from "@/providers/ConfirmProvider";

const PlanoFree = () => {
  return (
    <div>
      <p className="mb-4">Você está no plano Free!</p>
      <a href="/dashboard/pricing" className="plan-button">
        Melhorar plano
      </a>
    </div>
  );
};

export default function PlanDetails({ setSelectedTab }) {
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const confirm = useConfirm();

  useEffect(() => {
    const fetchSubscription = async () => {
      setLoading(true);

      // 1️⃣ Pegar usuário logado
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // 2️⃣ Pegar profile com stripe_subscription_id
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("stripe_subscription_id, stripe_price_id")
        .eq("id", user.id)
        .single();

      if (profileError) {
        console.error("Erro ao buscar profile:", profileError);
        setLoading(false);
        return;
      }

      // Se não houver subscription, usuário está no plano free
      if (!profile?.stripe_subscription_id) {
        setSubscription({ plan_name: "Free", status: "active", current_period_end: null });
        setLoading(false);
        return;
      }

      // 3️⃣ Buscar detalhes da assinatura via API Route
      try {
        const res = await fetch(`/api/stripe-subscription?subscriptionId=${profile.stripe_subscription_id}`);
        if (!res.ok) throw new Error("Erro ao buscar assinatura");

        const data = await res.json();
        setSubscription(data);
      } catch (err) {
        console.error("Erro ao buscar assinatura no Stripe:", err);
        setSubscription({ plan_name: "Free", status: "active", current_period_end: null });
      } finally {
        setLoading(false);
      }
    };

    fetchSubscription();
  }, []);

  if (loading) return <Loading />;

  const formatDate = (timestamp) => {
    if (!timestamp) return null;
    return new Date(timestamp * 1000).toLocaleDateString("pt-BR");
  };

  return (
    <div className="p-2">
      <div className="flex items-center mb-4 gap-2">
        <div onClick={() => setSelectedTab("account")}>
          <FaChevronLeft className="cursor-pointer" />
        </div>
        <h2 className="xs:font-semibold">Detalhes do Plano</h2>
      </div>

      {subscription ? (
        <>
          <p className="capitalize">
            Plano: {subscription.plan_name}{" "}
            {subscription.plan_price && `(R$ ${Number(subscription.plan_price).toFixed(2).replace(".", ",")})`}
          </p>

          {subscription.current_period_end ? (
            <p>Próxima cobrança: {formatDate(subscription.current_period_end)}</p>
          ) : (
            <p>Sem data de cobrança disponível</p>
          )}

          {subscription.id && (
            <button
              onClick={async () => {
                const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();

                const ok = await confirm(
                  `Tem certeza que quer cancelar o plano? Se confirmar, você perderá os benefícios do Bite Menu ${capitalize(
                    subscription.plan_name
                  )} no dia ${formatDate(subscription.current_period_end)}`
                );
                if (!ok) return;

                cancelSubscription(subscription.id);
              }}
              className="mt-2 cursor-pointer text-white bg-red-700 hover:bg-red-800 px-2 py-1 rounded-lg transition"
            >
              Cancelar Plano
            </button>
          )}
        </>
      ) : (
        <PlanoFree />
      )}
    </div>
  );
}

async function cancelSubscription(subscriptionId) {
  try {
    const res = await fetch("/api/cancel-subscription", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subscriptionId }),
    });

    const data = await res.json();
    console.log("Resposta do cancelamento:", data);

    if (!res.ok) throw new Error(data.error || "Falha ao cancelar assinatura");

    alert("Assinatura cancelada com sucesso!");
    window.location.reload();
  } catch (err) {
    console.error(err);
    alert("Erro ao cancelar assinatura: " + err.message);
  }
}
