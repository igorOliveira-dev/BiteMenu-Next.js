"use client";

import ThemeToggle from "@/components/ThemeToggle";
import Image from "next/image";
import React from "react";
import { FaCheck } from "react-icons/fa";
import logoMark from "../../../public/LogoMarca-sem-fundo.png";
import { planClick } from "../utils/planClick";

const plans = [
  {
    name: "Free",
    features: ["Cardápio digital", "30 Itens", "5 Categorias", "Controle de pedidos", "Controle de vendas"],
    price: "R$00,00",
    id: "free",
  },
  {
    name: "Plus",
    features: [
      "Cardápio digital",
      "200 Itens",
      "20 Categorias",
      "Controle de pedidos",
      "Controle de vendas",
      "Dashboard de vendas",
    ],
    price: "R$15,90",
    id: "plus",
  },
  {
    name: "Pro",
    features: [
      "Cardápio digital",
      "Itens ilimitados",
      "Categorias ilimitadas",
      "Controle de pedidos",
      "Controle de vendas",
      "Dashboard de vendas",
      "Prioridade de suporte",
    ],
    price: "R$27,90",
    id: "pro",
  },
];

const page = () => {
  return (
    <section className="py-12 px-6 min-h-[100vh] pt-30 flex flex-col items-center justify-center">
      <header className="fixed top-0 inset-x-0 flex items-center justify-between p-2 m-2 my-3 bg-translucid rounded-lg shadow-[0_0_10px_var(--shadow)] z-10 backdrop-blur-sm">
        <Image src={logoMark} height={50} width={180} alt="Bite Menu" onClick={() => (window.location.href = "/")} />
        <ThemeToggle />
      </header>

      <h2 className="font-bold scale-130 xxs:scale-150 mb-8 text-center">Planos disponíveis:</h2>
      <div className="w-full max-w-[1248px] flex justify-around flex-wrap gap-6 lg:gap-12">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className="p-4 px-6 bg-translucid border-2 border-translucid rounded-xl w-64 h-100 flex flex-col gap-6 justify-between"
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
            <div className="w-full flex flex-col">
              <p className="text-4xl font-bold">
                {plan.price}
                <span className="text-base color-gray">/mes</span>
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
