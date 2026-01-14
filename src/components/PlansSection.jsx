"use client";

import React, { useState, useEffect } from "react";
import { planClick } from "@/app/utils/planClick";
import { plans } from "@/consts/Plans";
import { FaCheck } from "react-icons/fa";
import GenericModal from "./GenericModal";
import { useAlert } from "@/providers/AlertProvider";

const PaymentMethodModal = ({ open, plan, onClose, onCredit, onPix }) => {
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
    <GenericModal onClose={onClose} wfull maxWidth={"480px"} margin={"6px"}>
      {/* modal */}
      <div className="rounded-2xl text-[var(--foreground)]">
        <div className="flex items-start justify-between gap-4 w-full">
          <div>
            <h3 className="text-xl font-bold">Escolha o pagamento</h3>
            <p className="mt-1 text-sm">
              Plano: <span className="font-semibold">{plan?.name}</span>
            </p>
          </div>

          <button
            className="rounded-lg px-2 py-1 hover:bg-[var(--translucid)] cursor-pointer"
            onClick={onClose}
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>

        <div className="mt-6 flex flex-col gap-3">
          <button
            onClick={onCredit}
            className="w-full rounded-xl px-4 py-3 font-semibold cursor-pointer bg-[var(--foreground)] text-[var(--background)] opacity-80 hover:opacity-100 transition"
          >
            Cartão de crédito
          </button>

          <button
            onClick={onPix}
            className="w-full rounded-xl border border-2 border-translucid px-4 py-3 font-semibold hover:opacity-80 transition cursor-pointer"
          >
            Pix (em breve)
          </button>
        </div>
      </div>
    </GenericModal>
  );
};

const PlansSection = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const alert = useAlert();

  const openModal = (plan) => {
    // Se for free, pode ir direto, sem modal (igual seu comportamento atual)
    if (plan.id === "free") {
      planClick("free");
      return;
    }

    setSelectedPlan(plan);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedPlan(null);
  };

  const handleCredit = async () => {
    if (!selectedPlan) return;
    setModalOpen(false);
    await planClick(selectedPlan.id); // chama Stripe
  };

  const handlePix = () => {
    alert("Pix ainda não está disponível. Em breve!");
    // não faz nada por enquanto
  };

  return (
    <section className="py-12 px-6 flex flex-col items-center justify-center">
      <h2 className="font-bold scale-130 xxs:scale-150 mb-8 text-center">Planos disponíveis:</h2>

      <div className="w-full max-w-[1248px] flex justify-around flex-wrap gap-6 lg:gap-12">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className="p-4 px-6 bg-translucid border-2 border-translucid rounded-xl w-64 flex flex-col gap-6 justify-between"
          >
            <div>
              <h2 className="font-bold mb-2">{plan.name}</h2>
              <ul className="mt-2">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2 mb-1">
                    <FaCheck className="text-green-500" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            <div className="w-full flex flex-col gap-2">
              <p className="text-4xl font-bold">
                {plan.price}
                <span className="text-base color-gray">/mês</span>
              </p>

              <button onClick={() => openModal(plan)} className="cta-button">
                Selecionar
              </button>
            </div>
          </div>
        ))}
      </div>

      <PaymentMethodModal
        open={modalOpen}
        plan={selectedPlan}
        onClose={closeModal}
        onCredit={handleCredit}
        onPix={handlePix}
      />
    </section>
  );
};

export default PlansSection;
