"use client";

import React from "react";
import { plans } from "@/consts/Plans";
import { FaCheck } from "react-icons/fa";

// Contratação desativada até a integração com o novo meio de pagamento.
const MAINTENANCE = true;

const PlansSection = () => {
  return (
    <section className="py-3 px-6 flex flex-col items-center justify-center min-h-[calc(100dvh-100px)]">
      <h2 className="font-bold scale-130 xxs:scale-150 mt-4 lg:mt-0 mb-8 text-center">Planos disponíveis:</h2>

      {MAINTENANCE && (
        <div className="w-full max-w-[700px] mb-8 p-4 rounded-xl bg-amber-500/10 border-2 border-amber-500/40 text-sm text-center">
          <strong>Contratação temporariamente indisponível.</strong>
          <br />
          Estamos trocando nosso sistema de pagamentos. Em breve você poderá assinar normalmente.
          Se você já é assinante, seu plano atual continua ativo até 28/10/2026.
        </div>
      )}

      <div className="w-full max-w-[1248px] flex justify-around flex-wrap gap-6 lg:gap-12">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`p-4 px-6 bg-degraded-t-speckled border-2 border-[var(--translucid)] rounded-xl w-64 flex flex-col gap-6 justify-between transition ${
              MAINTENANCE ? "opacity-60" : ""
            }`}
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
              <button
                className="cta-button glow-red disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={MAINTENANCE}
              >
                {MAINTENANCE ? "Indisponível" : "Selecionar"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default PlansSection;
