"use client";

import { useEffect, useState } from "react";
import { FaBolt, FaChevronLeft } from "react-icons/fa";
import Loading from "@/components/Loading";
import { useConfirm } from "@/providers/ConfirmProvider";
import useUser from "@/hooks/useUser";

// Cache em módulo (mesmo padrão de useMenu.js/useUser.js) para evitar refazer a chamada
// (Stripe + Supabase) a cada vez que a aba PlanDetails remonta.
const SUBSCRIPTION_CACHE_TTL = 5 * 60 * 1000; // 5 minutos
let subscriptionCache = null; // { key, data, fetchedAt }
let pendingSubscriptionFetch = null; // { key, promise }

function fetchSubscriptionDetails(subscriptionId, userId) {
  const key = `${subscriptionId}:${userId}`;

  if (subscriptionCache?.key === key && Date.now() - subscriptionCache.fetchedAt < SUBSCRIPTION_CACHE_TTL) {
    return Promise.resolve(subscriptionCache.data);
  }

  if (pendingSubscriptionFetch?.key === key) {
    return pendingSubscriptionFetch.promise;
  }

  const promise = fetch(`/api/stripe-subscription?subscriptionId=${subscriptionId}&userId=${userId}`)
    .then((res) => {
      if (!res.ok) throw new Error("Erro ao buscar assinatura");
      return res.json();
    })
    .then((data) => {
      subscriptionCache = { key, data, fetchedAt: Date.now() };
      return data;
    })
    .finally(() => {
      pendingSubscriptionFetch = null;
    });

  pendingSubscriptionFetch = { key, promise };
  return promise;
}

export default function PlanDetails({ setSelectedTab }) {
  const { user, profile, loading: userLoading } = useUser();
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const confirm = useConfirm();

  useEffect(() => {
    if (userLoading) return;

    if (!user || !profile) {
      setLoading(false);
      return;
    }

    // Sem subscription, usuário está no plano free
    if (!profile.stripe_subscription_id) {
      setSubscription({ plan_name: profile.role, status: "active", current_period_end: null, noCard: true });
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    fetchSubscriptionDetails(profile.stripe_subscription_id, user.id)
      .then((data) => {
        if (!cancelled) setSubscription(data);
      })
      .catch((err) => {
        console.error("Erro ao buscar assinatura no Stripe:", err);
        if (!cancelled) setSubscription({ plan_name: "Free", status: "active", current_period_end: null });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [userLoading, user, profile]);

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
        <h2 className="xs:font-semibold" onClick={() => setSubscription(null)}>
          Detalhes do Plano
        </h2>
      </div>

      {subscription ? (
        <>
          {["past_due", "unpaid"].includes(subscription.status) && subscription.latest_invoice_url && (
            <div className="p-4 mb-4 bg-red-300 border border-red-400 text-red-700 rounded max-w-[1024px]">
              <span>Você tem uma cobrança pendente, isso pode ter removido seu acesso ao plano.</span>
              <a
                href={subscription.latest_invoice_url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-blue-500 hover:text-blue-700 underline transition inline-block"
              >
                Regularizar pagamento
              </a>
            </div>
          )}

          {subscription.status === "incomplete" && (subscription.boleto_url || subscription.latest_invoice_url) && (
            <div className="text-center rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3 w-full max-w-[1024px] mb-4">
              <span>
                {subscription.payment_method_type === "boleto"
                  ? "Seu boleto ainda não foi confirmado. O acesso ao plano será liberado assim que o pagamento for compensado."
                  : "Sua assinatura está com o pagamento pendente. O acesso ao plano será liberado assim que o pagamento for confirmado."}
              </span>
              <br />
              <a
                href={subscription.boleto_url || subscription.latest_invoice_url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-blue-500 hover:text-blue-700 underline transition inline-block"
              >
                {subscription.payment_method_type === "boleto" ? "Visualizar boleto" : "Finalizar pagamento"}
              </a>
            </div>
          )}

          <div className="flex flex-col xs:flex-row gap-4 max-w-[1024px]">
            <div className="flex flex-col justify-center p-4 bg-translucid border-2 border-[var(--translucid)] rounded-lg text-center w-full">
              <p className="text-sm color-gray">Plano atual:</p>
              <p className="capitalize default-h1 mb-2">{subscription.plan_name}</p>
              {subscription.noCard ? (
                <div className="flex flex-col items-center">
                  <p className="color-gray text-sm sm:text-base">Sem dados de cobrança</p>
                  {subscription.plan_name !== "pro" && (
                    <a href="/dashboard/pricing" className="cta-button has-icon small mt-2">
                      <FaBolt /> Melhorar plano!
                    </a>
                  )}
                </div>
              ) : (
                <p className="text-sm color-gray">
                  {subscription.plan_price && `R$ ${Number(subscription.plan_price).toFixed(2).replace(".", ",")}/mês`}
                </p>
              )}
            </div>

            {subscription.current_period_end ? (
              <div className="flex flex-col justify-center p-4 bg-translucid border-2 border-[var(--translucid)] rounded-lg text-center w-full">
                <p className="color-gray text-sm sm:text-base">Próxima cobrança:</p>
                <p className="default-h1 mb-2">{formatDate(subscription.current_period_end)}</p>
              </div>
            ) : null}
          </div>

          {subscription.payment_method_type === "card" && subscription.card_info && (
            <div className="mt-4 p-4 flex items-center justify-between flex-col xs:flex-row bg-translucid border-2 border-[var(--translucid)] rounded-lg w-full max-w-[1024px]">
              <div>
                <p className="text-sm color-gray text-center">Forma de pagamento:</p>
                <p className="p-2 my-2 bg-translucid rounded-lg text-center">
                  {subscription.card_info.brand.toUpperCase()} **** **** **** {subscription.card_info.last4} <br />
                </p>
              </div>
              <p className="font-semibold text-lg">
                {subscription.plan_price && `R$ ${Number(subscription.plan_price).toFixed(2).replace(".", ",")}/mês`}
              </p>
            </div>
          )}

          {subscription.id && (
            <button
              onClick={async () => {
                const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();

                const ok = await confirm(
                  `Tem certeza que quer cancelar o plano? Se quiser mesmo cancelar, clique em "confirmar" e você perderá os benefícios do Bite Menu ${capitalize(
                    subscription.plan_name,
                  )} imediatamente, se quiser continuar com o plano, clique em "cancelar".`,
                );
                if (!ok) return;

                cancelSubscription(subscription.id, user.id);
              }}
              className="mt-4 text-white cursor-pointer bg-red-600/70 hover:bg-red-600/90 border-2 border-[var(--translucid)] rounded-lg p-2 transition"
            >
              Cancelar Plano
            </button>
          )}
        </>
      ) : (
        <Loading />
      )}
    </div>
  );
}

async function cancelSubscription(subscriptionId, userId) {
  try {
    const res = await fetch("/api/cancel-subscription", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subscriptionId, userId }),
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
