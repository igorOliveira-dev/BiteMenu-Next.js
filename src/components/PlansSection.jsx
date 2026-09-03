"use client";

import React, { useState, useEffect } from "react";
import { planClick } from "@/app/utils/planClick";
import { plans } from "@/consts/Plans";
import { FaCheck } from "react-icons/fa";
import GenericModal from "./GenericModal";
import { useAlert } from "@/providers/AlertProvider";
import useUser from "@/hooks/useUser";
import { supabase } from "@/lib/supabaseClient";

const TIER_RANK = { free: 0, plus: 1, pro: 2 };

const ChangePlanModal = ({ open, currentPlan, targetPlan, isUpgrade, periodEnd, onClose, onConfirm, loading }) => {
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e) => {
      if (e.key === "Escape" && !loading) onClose();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose, loading]);

  if (!open) return null;

  const formattedDate = periodEnd ? new Date(periodEnd * 1000).toLocaleDateString("pt-BR") : null;

  return (
    <GenericModal
      title="Confirmar troca de plano"
      onClose={loading ? () => {} : onClose}
      wfull
      maxWidth={"480px"}
      margin={"12px"}
    >
      <div className="rounded-2xl text-[var(--foreground)]">
        <p className="text-sm">
          Trocar do plano <span className="font-semibold">{currentPlan?.name}</span> para o plano{" "}
          <span className="font-semibold">{targetPlan?.name}</span>?
        </p>

        {isUpgrade ? (
          <div className="mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-sm">
            <strong>Isso gera uma cobrança agora:</strong> a diferença proporcional aos dias restantes do ciclo atual é
            cobrada imediatamente no seu cartão cadastrado, e o acesso ao plano {targetPlan?.name} passa a valer na
            hora.
            <br />
            <br />
            Se você paga por <strong>boleto</strong>, o acesso ao {targetPlan?.name} só libera depois que esse boleto
            for compensado (pode levar alguns dias) - o boleto será gerado assim que você confirmar.
          </div>
        ) : (
          <div className="mt-4 p-3 rounded-lg bg-translucid border border-[var(--translucid)] text-sm">
            <strong>Nenhuma cobrança agora.</strong> Você continua com os recursos do plano {currentPlan?.name} até{" "}
            {formattedDate ?? "o fim do período já pago"}. A troca pro plano {targetPlan?.name} só entra em vigor na
            próxima renovação.
          </div>
        )}

        <div className="flex gap-2 items-center justify-end mt-6">
          <button
            onClick={onClose}
            disabled={loading}
            className="cursor-pointer px-4 py-2 bg-translucid border-2 border-[var(--translucid)] hover:opacity-80 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            type="button"
          >
            Cancelar
          </button>
          <button onClick={onConfirm} disabled={loading} className="cta-button glow-red" type="button">
            {loading ? "Processando..." : "Confirmar troca"}
          </button>
        </div>
      </div>
    </GenericModal>
  );
};

export const PaymentMethodModal = ({ open, plan, selectedPlanTrial, onClose, onCredit, stripeLoading }) => {
  const trialEndDate = new Date();
  trialEndDate.setDate(trialEndDate.getDate() + 7);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <GenericModal title="Pagamento" onClose={onClose} wfull maxWidth={"480px"} margin={"12px"}>
      <div className="rounded-2xl text-[var(--foreground)]">
        <p className="mt-1 text-sm">
          {selectedPlanTrial ? (
            <>
              Teste grátis do plano: <span className="font-semibold">{plan?.name}</span>
            </>
          ) : (
            <>
              Plano: <span className="font-semibold">{plan?.name}</span>
            </>
          )}
        </p>

        <div className="mt-6 flex flex-col gap-3">
          <button
            onClick={onCredit}
            disabled={stripeLoading}
            className="w-full rounded-xl py-3 font-semibold bg-[var(--foreground)] text-[var(--background)] opacity-80 hover:opacity-100 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {stripeLoading ? "Processando..." : selectedPlanTrial ? "Iniciar teste grátis" : "Assinar agora"}
          </button>
        </div>
        {selectedPlanTrial ? (
          <p className="mt-4 text-sm text-center">
            <span className="font-bold text-lg">7 dias grátis</span> <br /> Depois, R$ {plan?.price} por mês (cobrança
            automática), começando em {trialEndDate.toLocaleDateString("pt-BR")} <br />
          </p>
        ) : (
          <p className="mt-4 text-sm text-center">
            R$ {plan?.price}/mês (cobrança recorrente) Cancele quando quiser no seu Dashboard.
          </p>
        )}
      </div>
    </GenericModal>
  );
};

const PlansSection = ({ canShowFreeTrialBtn }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [selectedPlanTrial, setSelectedPlanTrial] = useState(false);
  const [stripeLoading, setStripeLoading] = useState(false);
  const [showFreeTrialBtn, setShowFreeTrialBtn] = useState(false);

  const { profile, loading } = useUser();

  const alert = useAlert();

  const [changePlanTarget, setChangePlanTarget] = useState(null); // { plan, isUpgrade, priceId, periodEnd }

  // Já tem assinatura paga ativa: clicar num plano diferente é troca de
  // plano (upgrade/downgrade), não um checkout novo. Só valida e abre o
  // modal de confirmação — a troca em si só acontece se o usuário confirmar.
  const handlePlanChange = async (plan) => {
    if (plan.id === profile.role) {
      alert("Você já está nesse plano.");
      return;
    }

    try {
      setStripeLoading(true);

      const statusRes = await fetch(
        `/api/stripe-subscription?subscriptionId=${profile.stripe_subscription_id}&userId=${profile.id}`,
      );
      const statusData = await statusRes.json();

      if (statusData.cancel_at_period_end) {
        alert("Sua assinatura está cancelada. Reative-a no Dashboard antes de trocar de plano.");
        return;
      }

      if (!["active", "trialing"].includes(statusData.status)) {
        alert(
          statusData.status === "past_due"
            ? "Você tem uma cobrança pendente. Regularize o pagamento antes de trocar de plano."
            : "Você possui uma assinatura pendente. Finalize ou cancele antes de trocar de plano.",
        );
        return;
      }

      const { data: planRow, error: planError } = await supabase
        .from("plans")
        .select("stripe_price_id")
        .eq("role", plan.id)
        .eq("active", true)
        .eq("stripe_account", profile.stripe_account)
        .maybeSingle();

      if (planError || !planRow?.stripe_price_id) {
        alert("Não foi possível localizar esse plano. Tente novamente.");
        return;
      }

      setChangePlanTarget({
        plan,
        priceId: planRow.stripe_price_id,
        isUpgrade: TIER_RANK[plan.id] > TIER_RANK[profile.role],
        periodEnd: statusData.current_period_end,
      });
    } catch (e) {
      console.error(e);
      alert("Não foi possível verificar sua assinatura. Tente novamente.");
    } finally {
      setStripeLoading(false);
    }
  };

  const confirmPlanChange = async () => {
    if (!changePlanTarget) return;

    try {
      setStripeLoading(true);

      const changeRes = await fetch("/api/change-subscription-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: profile.id, newPriceId: changePlanTarget.priceId }),
      });
      const changeData = await changeRes.json();

      if (!changeRes.ok) throw new Error(changeData.error || "Falha ao trocar de plano");

      const successParams = new URLSearchParams({ type: changeData.type, plan: changePlanTarget.plan.name });

      if (changeData.type === "downgrade_scheduled" && changeData.effective_at) {
        successParams.set("date", changeData.effective_at);
      }

      if (changeData.type === "upgrade_pending") {
        if (changeData.payment_method_type) successParams.set("payment_method", changeData.payment_method_type);
        if (changeData.invoice_url) successParams.set("invoice_url", changeData.invoice_url);
      }

      window.location.href = `/billing/plan-change-success?${successParams.toString()}`;
    } catch (e) {
      console.error(e);
      alert("Não foi possível trocar de plano. Tente novamente.");
      setStripeLoading(false);
    }
  };

  const openModal = (plan, withTrial = false) => {
    if (plan.id === "free") {
      planClick("free");
      return;
    }

    if (profile?.stripe_subscription_id && profile?.role !== "free") {
      handlePlanChange(plan);
      return;
    }

    setSelectedPlan(plan);
    setSelectedPlanTrial(withTrial);
    setModalOpen(true);
  };

  const closeModal = () => {
    if (stripeLoading) return;
    setModalOpen(false);
    setSelectedPlan(null);
    setSelectedPlanTrial(false);
  };

  const handleCredit = async () => {
    if (!selectedPlan) return;

    try {
      setStripeLoading(true);

      // Verifica se já tem assinatura ativa no Stripe antes de prosseguir
      if (profile?.stripe_subscription_id) {
        const res = await fetch(
          `/api/stripe-subscription?subscriptionId=${profile.stripe_subscription_id}&userId=${profile.id}`,
        );
        const data = await res.json();

        const activeStatuses = ["active", "trialing", "past_due"];
        const pendingStatus = ["incomplete"];
        if (activeStatuses.includes(data.status)) {
          alert("Você já possui uma assinatura ativa. Cancele o plano atual antes de assinar outro.");
          return;
        }
        if (pendingStatus.includes(data.status)) {
          alert(
            "Você possui uma assinatura pendente. Finalize a assinatura para obter acesso ao plano ou cancele a assinatura para assinar outro plano.",
          );
          return;
        }
      }

      await planClick(selectedPlan.id, selectedPlanTrial);
    } catch (e) {
      console.error(e);
      alert("Não foi possível iniciar o pagamento. Tente novamente.");
    } finally {
      setStripeLoading(false);
    }
  };

  useEffect(() => {
    if (profile?.role === "free" && profile?.has_used_trial !== true && canShowFreeTrialBtn) {
      setShowFreeTrialBtn(true);
    }
  }, [profile, loading]);

  return (
    <section className="py-3 px-6 flex flex-col items-center justify-center min-h-[calc(100dvh-100px)]">
      <h2 className="font-bold scale-130 xxs:scale-150 mt-4 lg:mt-0 mb-8 text-center">Planos disponíveis:</h2>

      {showFreeTrialBtn && (
        <button
          className="cta-button glow-red w-full mb-6 py-4 text-lg font-bold"
          onClick={() =>
            openModal(
              plans.find((p) => p.id === "pro"),
              true,
            )
          }
        >
          🚀 Teste o Pro grátis por 7 dias
        </button>
      )}

      <div className="w-full max-w-[1248px] flex justify-around flex-wrap gap-6 lg:gap-12">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className="p-4 px-6 bg-degraded-t-speckled border-2 border-[var(--translucid)] rounded-xl w-64 flex flex-col gap-6 justify-between cursor-pointer hover:border-[var(--red)] hover:scale-102 hover:shadow-[0_0_25px_rgba(255,0,0,0.4)] transition"
            onClick={() => openModal(plan)}
          >
            <div>
              <h2 className="font-bold mb-2 text-center">{plan.name}</h2>
              <hr className="border-translucid mb-4" />
              <p className="text-4xl font-bold text-center mb-4">
                <span className="text-base color-gray mr-1">R$</span>
                {plan.price}
                <span className="text-base color-gray">/mês</span>
              </p>
              <ul className="mt-2">
                {plan.features.map((feature, index) => (
                  <div key={index}>
                    <li className="flex items-center gap-2 mt-1">
                      <FaCheck className="text-[var(--red)]" />
                      {feature}
                    </li>
                    <hr className="border border-translucid" />
                  </div>
                ))}
              </ul>
            </div>

            <div className="w-full flex flex-col gap-2">
              <button className="cta-button glow-red">Selecionar</button>
            </div>
          </div>
        ))}
      </div>

      <PaymentMethodModal
        open={modalOpen}
        plan={selectedPlan}
        selectedPlanTrial={selectedPlanTrial}
        onClose={closeModal}
        onCredit={handleCredit}
        stripeLoading={stripeLoading}
      />

      <ChangePlanModal
        open={!!changePlanTarget}
        currentPlan={plans.find((p) => p.id === profile?.role)}
        targetPlan={changePlanTarget?.plan}
        isUpgrade={changePlanTarget?.isUpgrade}
        periodEnd={changePlanTarget?.periodEnd}
        onClose={() => setChangePlanTarget(null)}
        onConfirm={confirmPlanChange}
        loading={stripeLoading}
      />
    </section>
  );
};

export default PlansSection;
