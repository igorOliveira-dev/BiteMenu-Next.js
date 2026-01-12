"use client";
import React from "react";
import { FaCheck } from "react-icons/fa";
import { planClick } from "@/app/utils/planClick";
import { plans } from "@/consts/Plans";

const page = () => {
  return (
    <section className="py-12 px-6 min-h-[100vh] pt-30 flex flex-col items-center justify-center">
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
              <button onClick={() => planClick(plan.id)} className="cta-button w-full text-center">
                Selecionar
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default page;
