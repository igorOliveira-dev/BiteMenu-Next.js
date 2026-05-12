"use client";

import Return from "@/components/Return";
import React, { useState } from "react";
import { FaPlus, FaMinus } from "react-icons/fa";

const faqs = [
  {
    q: "É realmente grátis?",
    a: "Sim. O plano Free não expira. Você pode usar o Bite Menu de graça para sempre, com cardápio digital, controle de pedidos e de vendas inclusos.",
  },
  {
    q: "Preciso de cartão de crédito para começar?",
    a: "Não. Você cria sua conta e seu cardápio sem informar nenhum dado de pagamento. Só pede cartão se você decidir assinar um plano pago.",
  },
  {
    q: "Como o cliente faz o pagamento?",
    a: "O Bite Menu monta e envia o pedido pelo WhatsApp. O pagamento é combinado direto entre você e o cliente — dinheiro, Pix, maquininha ou o que vocês preferirem. Você não paga taxa por venda para a gente.",
  },
  {
    q: "Como recebo o pedido na prática?",
    a: "O cliente escolhe os produtos no seu cardápio, preenche informações necessárias e finaliza. O WhatsApp dele abre com o pedido todo formatado e envia direto para o seu número. Você só confirma e prepara.",
  },
  {
    q: "Meus clientes precisam baixar algum aplicativo?",
    a: "Não. Seu cliente abre o cardápio direto no navegador, pelo link ou QR Code. Funciona em qualquer celular, sem instalação.",
  },
  {
    q: "Funciona pro meu tipo de negócio?",
    a: "Sim. Lanchonete, pizzaria, hamburgueria, açaiteria, restaurante, doceria, food truck, marmitaria — qualquer estabelecimento que vende comida ou bebida usa o Bite Menu. Você adapta categorias, produtos e visual ao seu negócio.",
  },
  {
    q: "Tem limite de pedidos?",
    a: "Não. Você pode receber quantos pedidos quiser, em qualquer plano. O que muda entre os planos é a quantidade de itens e categorias do cardápio e funcionalidades extra, não o volume de vendas.",
  },
  {
    q: "Quanto tempo leva para deixar o cardápio pronto?",
    a: "Menos de 5 minutos. Você cria a conta, responde algumas perguntas rápidas sobre o estabelecimento e já pode começar a adicionar produtos.",
  },
  {
    q: "Posso cancelar quando quiser?",
    a: "Sim. Não há fidelidade. Você pode cancelar a assinatura paga a qualquer momento direto no seu dashboard.",
  },
];

const page = () => {
  const [openFaq, setOpenFaq] = useState(null);

  return (
    <div className="flex flex-col items-center">
      <div className="fixed bg-translucid rounded-lg backdrop-blur-2xl top-2 left-2 z-50">
        <Return />
      </div>
      <section className="px-4 py-16 sm:py-20 w-full">
        <div className="mx-auto max-w-3xl">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-extrabold">Perguntas que todo dono de restaurante faz</h2>
          </div>

          <div className="flex flex-col gap-3">
            {faqs.map((item, i) => {
              const isOpen = openFaq === i;
              return (
                <div
                  key={item.q}
                  className="rounded-xl border border-[var(--translucid)] bg-[var(--translucid)] overflow-hidden"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : i)}
                    className="w-full flex items-center justify-between gap-4 p-4 sm:p-5 text-left cursor-pointer"
                  >
                    <span className="font-semibold text-base sm:text-lg">{item.q}</span>
                    <span className="text-[var(--red)] shrink-0">{isOpen ? <FaMinus /> : <FaPlus />}</span>
                  </button>
                  <div
                    className={`grid transition-all duration-300 ${
                      isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                    }`}
                  >
                    <div className="overflow-hidden">
                      <p className="px-4 sm:px-5 pb-5 text-sm sm:text-base text-[var(--gray)] leading-relaxed">{item.a}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
};

export default page;
