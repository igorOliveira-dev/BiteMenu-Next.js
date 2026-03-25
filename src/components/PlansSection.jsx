"use client";

import React, { useState, useEffect } from "react";
import { planClick } from "@/app/utils/planClick";
import { plans } from "@/consts/Plans";
import { FaCheck } from "react-icons/fa";
import GenericModal from "./GenericModal";
import { useAlert } from "@/providers/AlertProvider";
import useUser from "@/hooks/useUser";

const PaymentMethodModal = ({ open, plan, selectedPlanTrial, onClose, onCredit, stripeLoading }) => {
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
            Cancele antes da data para não ser cobrado.
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

  const openModal = (plan, withTrial = false) => {
    if (plan.id === "free") {
      planClick("free");
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
    </section>
  );
};

export default PlansSection;
