"use client";

import Image from "next/image";
import logoMark from "../../public/LogoMarca-sem-fundo.png";
import logoTip from "../../public/LogoTipo-sem-fundo.png";
import ThemeToggle from "@/components/ThemeToggle";
import menuCelular from "../../public/bitemenuCelular.png";
import crieerecebawhatsapp from "../../public/mockups/crieerecebawhatsapp.png";
import controlepedidosevendas from "../../public/mockups/controlepedidosevendas.png";
import Link from "next/link";
import useUser from "@/hooks/useUser";
import Loading from "@/components/Loading";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FaCheck, FaChevronLeft, FaChevronRight, FaWhatsapp } from "react-icons/fa";

import { planClick } from "./utils/planClick";

export default function Home() {
  const { user, loading } = useUser();
  const [dashboardPath, setDashboardPath] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      setDashboardPath(true);
    }
  }, [user, loading]);

  const callSupport = () => {
    const message = "Olá! Eu gostaria de falar com o suporte do Bite Menu!";

    const url = `https://wa.me/5514991085780?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

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
        "1000 Itens",
        "100 Categorias",
        "Controle de pedidos",
        "Controle de vendas",
        "Dashboard de vendas",
        "Prioridade de suporte",
      ],
      price: "R$27,90",
      id: "pro",
    },
  ];

  return (
    <main>
      {dashboardPath && (
        <button
          onClick={() => router.replace("/dashboard")}
          className="cursor-pointer font-bold p-2 px-4 bg-low-gray border-2 border-translucid rounded-lg z-10 backdrop-blur-sm fixed top-22 right-2 hover:opacity-80 transition"
        >
          Acessar meu cardápio
        </button>
      )}

      <section className="sm:h-[100dvh] mb-6" id="begin">
        <header className="fixed inset-x-0 flex items-center justify-between p-2 m-2 my-3 bg-translucid rounded-lg shadow-[0_0_10px_var(--shadow)] z-10 backdrop-blur-sm">
          <Image
            src={logoMark}
            height={50}
            width={180}
            alt="Bite Menu"
            onClick={() => (window.location.href = "/")}
            className="hidden xs:block"
          />
          <Image
            src={logoTip}
            height={50}
            width={50}
            alt="Bite Menu"
            onClick={() => (window.location.href = "/")}
            className="block xs:hidden"
          />
          <div className="flex">
            <Link className="cta-button small" href="register">
              Criar cardápio!
            </Link>
            <ThemeToggle />
          </div>
        </header>
        <div className="p-4 flex items-center justify-center md:justify-around h-full flex-col lg:flex-row">
          <div className="pt-40 lg:pt-0 text-center lg:text-start max-w-2xl">
            <h1 className="text-3xl lg:text-5xl font-bold text-[var(--red)]">
              Crie e gerencie seu cardápio digital de graça!
            </h1>
            <p className="leading-tight mt-3 mb-6 text-lg lg:text-xl">
              Com Bite Menu você constrói a presença online do seu estabelecimento em poucos minutos!
            </p>
            <Link className="cta-button" href="register">
              Comece grátis!
            </Link>
          </div>
          <div className="scale-70 lg:scale-100 transform-[translate(15%,-10%)] lg:transform-none">
            <Image src={logoTip} alt="Bite Menu" className="absolute opacity-20 -z-[1] transform-[translate(-30%,20%)]" />
            <Image
              src={menuCelular}
              alt="Cardápio do Bite Menu no celular"
              height={462}
              width={300}
              className="transform-[translate(0,10%)]"
            />
          </div>
        </div>
      </section>

      <section className="px-4 py-6 sd:py-20 bg-translucid">
        <div className="mb-12 sm:mb-0 flex items-center flex-col-reverse sm:flex-row justify-center gap-6 sm:gap-24">
          <div className="w-[184px] h-[228px] xs:w-[292px] xs:h-[365px] sm:w-[194px] sm:h-[243px] md:w-[292px] md:h-[365px] lg:w-[324px] lg:h-[405px] relative">
            <Image src={crieerecebawhatsapp} fill alt="Crie seu cardápio e receba pedidos pelo WhatsApp" />
          </div>
          <h1 className="text-center sm:text-start font-bold sm:max-w-[40%] text-xl xs:text-3xl">
            Crie seu cardápio digital e receba pedidos pelo WhatsApp.
          </h1>
        </div>
        <div className="flex items-center flex-col sm:flex-row justify-center sm:gap-24">
          <h1 className="text-center sm:text-start font-bold sm:max-w-[40%] text-xl xs:text-3xl">
            Controle completamente seus pedidos e suas vendas pelo site.
          </h1>

          <div className="w-[216px] h-[270px] xs:w-[324px] xs:h-[405px] sm:w-[216px] sm:h-[270px] md:w-[324px] md:h-[405px] lg:w-[360px] lg:h-[450px] relative">
            <Image src={controlepedidosevendas} fill alt="Controle pedidos e vendas" />
          </div>
        </div>
      </section>

      <section className="py-12 px-6 min-h-[70vh] flex flex-col items-center justify-center">
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
              <div className="w-full flex flex-col gap-2">
                <p className="text-4xl font-bold">
                  {plan.price}
                  <span className="text-base color-gray">/mês</span>
                </p>
                <button onClick={() => planClick(plan.id)} className="cta-button">
                  Selecionar
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <footer className="bg-low-gray p-6 border-t border-gray-300 dark:border-gray-700">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          {/* Logo */}
          <Link href="https://www.bitemenu.com.br" className="flex justify-center">
            <Image src={logoMark} height={40} width={140} alt="Bite Menu" />
          </Link>

          {/* Links */}
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex flex-col md:flex-row justify-center items-center gap-8 text-sm">
              <Link href="/about" className="hover:underline">
                Sobre
              </Link>
              <Link href="/faqs" className="hover:underline">
                Perguntas frequentes
              </Link>
            </div>
            <div className="flex flex-col md:flex-row justify-center items-center gap-2 gap-x-4 text-sm">
              <Link href="/politica-de-privacidade" className="hover:underline">
                Política de Privacidade
              </Link>
              <Link href="/support" className="hover:underline">
                Suporte
              </Link>
            </div>
          </div>

          {/* Direitos */}
          <div className="text-xs text-center md:text-right color-gray">
            © {new Date().getFullYear()} Bite Menu. <br /> Todos os direitos reservados.
          </div>
        </div>
      </footer>
    </main>
  );
}
