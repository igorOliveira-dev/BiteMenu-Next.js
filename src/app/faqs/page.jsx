"use client";

import ReturnLandingPage from "@/components/ReturnLandingPage";
import React, { useState } from "react";

const faqs = [
  {
    question: "O que é o Bite Menu?",
    answer: (
      <>
        O <strong>Bite Menu</strong> é uma plataforma para criar, gerenciar e compartilhar cardápios digitais de forma
        simples e gratuita. Ideal para restaurantes, bares, lanchonetes e qualquer estabelecimento que queira modernizar sua
        experiência de atendimento.
      </>
    ),
  },
  {
    question: "O Bite Menu é realmente gratuito?",
    answer: (
      <>
        Sim! Existe um plano totalmente gratuito com recursos essenciais para criar, customizar e compartilhar seu cardápio
        digital. No plano gratuito você também pode receber pedidos pelo WhatsApp e gerenciar pedidos e vendas pelo site.
        Também oferecemos planos pagos (<strong>Plus</strong> e <strong>Pro</strong>) com funcionalidades extras como
        dashboard de vendas e limite maior de categorias e itens. <br />
        <a
          href="https://www.bitemenu.com.br/pricing"
          target="_blank"
          className="underline text-blue-500 hover:text-blue-700"
        >
          Veja os planos disponíveis aqui.
        </a>
      </>
    ),
  },
  {
    question: "Preciso baixar algum aplicativo?",
    answer:
      "Não! O Bite Menu funciona 100% online. Você pode acessar seu painel pelo navegador de qualquer celular, tablet ou computador, sem precisar instalar nada.",
  },
  {
    question: "Como compartilho meu cardápio?",
    answer:
      "Cada cardápio criado no Bite Menu gera automaticamente um link único. Você pode copiar esse link e divulgar nas redes sociais, no WhatsApp ou até imprimir um QR Code para deixar nas mesas do seu estabelecimento.",
  },
  {
    question: "Como recebo os pedidos dos meus clientes?",
    answer:
      "Você pode configurar o recebimento de pedidos pelo WhatsApp, direto do seu link do Bite Menu. Também é possível receber e gerenciar pedidos pelo site.",
  },
  {
    question: "Posso personalizar o visual do meu cardápio?",
    answer:
      "Sim! Você pode escolher cores, enviar logotipo, banners e imagens de produtos para deixar seu cardápio com a identidade do seu negócio.",
  },
  {
    question: "Como faço para alterar ou cancelar meu plano?",
    answer: (
      <>
        Se você estiver no plano gratuito, basta acessar o{" "}
        <a
          href="https://www.bitemenu.com.br/pricing"
          target="_blank"
          className="underline text-blue-500 hover:text-blue-700"
        >
          painel de planos
        </a>{" "}
        e escolher o plano desejado. Se você estiver usando outro plano e quiser trocar, primeiro cancele o plano atual e
        depois faça a troca de plano .Você pode cancelar quando quiser — sua conta volta automaticamente ao plano gratuito e
        seus dados permanecem salvos.
      </>
    ),
  },
  {
    question: "Como entro em contato com o suporte?",
    answer: (
      <>
        Caso precise de ajuda, entre em contato pela{" "}
        <a href="https://www.bitemenu.com.br/support" className="underline text-blue-500 hover:text-blue-700">
          página de suporte
        </a>
        .
      </>
    ),
  },
];

const page = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="flex flex-col items-center">
      <div className="max-w-3xl flex flex-col gap-4 p-4 w-full">
        <div className="flex items-center gap-4">
          <ReturnLandingPage />
          <h1 className="default-h1">Perguntas Frequentes (FAQ)</h1>
        </div>

        <div className="divide-y divide-gray-200">
          {faqs.map((faq, index) => (
            <div key={index} className="py-3">
              <button className="flex justify-between items-center w-full text-left" onClick={() => toggleFAQ(index)}>
                <span className="font-medium">{faq.question}</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`h-5 w-5 transition-transform duration-300 ${openIndex === index ? "rotate-180" : "rotate-0"}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              <div
                className={`overflow-hidden transition-all duration-300 ${
                  openIndex === index ? "max-h-96 mt-2" : "max-h-0"
                }`}
              >
                <p className="color-gray text-sm leading-relaxed">{faq.answer}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="text-sm color-gray mt-6 text-center">Última atualização: 29/10/2025</p>
      </div>
    </div>
  );
};

export default page;
