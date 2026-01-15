"use client";

import Image from "next/image";
import logoMark from "../../../public/LogoMarca-sem-fundo.png";
import logoTip from "../../../public/LogoTipo-sem-fundo.png";
import ThemeToggle from "@/components/ThemeToggle";
import menuCelular from "../../../public/bitemenuCelular.png";
import crieerecebawhatsapp from "../../../public/mockups/crieerecebawhatsapp.png";
import controlepedidosevendas from "../../../public/mockups/controlepedidosevendas.png";
import Link from "next/link";
import useUser from "@/hooks/useUser";
import Loading from "@/components/Loading";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FaCheck, FaChevronLeft, FaChevronRight, FaWhatsapp } from "react-icons/fa";
import { plans } from "@/consts/Plans";

import { planClick } from "../utils/planClick";
import BlogSection from "../blog/BlogSection";
import PlansSection from "@/components/PlansSection";

export default function LandingPageV1() {
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

  return (
    <main>
      <section className="sm:h-[100dvh] bg-degraded-b border-b-3 border-red-500/50" id="begin">
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
            {dashboardPath ? (
              <Link className="cta-button small" href="/dashboard">
                Acessar cardápio!
              </Link>
            ) : (
              <Link className="cta-button small" href="register">
                Criar cardápio!
              </Link>
            )}
            <ThemeToggle />
          </div>
        </header>
        <section className="flex flex-col items-center">
          <div className="pt-26 flex flex-col items-center max-w-2xl xxs:mx-4">
            <h1 className="text-2xl xs:text-3xl sm:text-4xl lg:text-5xl font-bold text-center">
              Crie e gerencie seu <br /> <span className="text-[var(--red)]">cardápio digital de graça!</span>
            </h1>
            <p className="leading-tight mt-3 mb-6 text-sm xs:text-base sm:text-lg text-center">
              Receba pedidos pelo WhatsApp e aumente suas vendas online
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center">
            <Image
              src={logoTip}
              alt="Bite Menu"
              className="absolute opacity-20 scale-60 lg:scale-80 transform-[translate(30%,0)] lg:transform-[translate(-30%,-10%)]"
            />
            <div className="my-16 sm:my-0">
              <Link className="cta-button glow-red lg:text-2xl" href="register">
                Comece gratuitamente!
              </Link>
              <ul className="mt-8 font-semibold">
                <li className="flex items-center mt-1 gap-2 border-b border-translucid sm:text-xl">
                  <FaCheck color="var(--red)" />
                  Cardápio digital fácil e rápido
                </li>
                <li className="flex items-center mt-1 gap-2 border-b border-translucid sm:text-xl">
                  <FaCheck color="var(--red)" />
                  Pedidos pelo WhatsApp
                </li>
                <li className="flex items-center mt-1 gap-2 border-b border-translucid sm:text-xl">
                  <FaCheck color="var(--red)" />
                  Controle de pedidos e vendas
                </li>
              </ul>
            </div>
            <div className="h-[370px] w-[240px] lg:h-[462px] lg:w-[300px] lg:scale-100 ml-8 lg:ml-[15dvw] z-1 right-2 hidden sm:block">
              <Image src={menuCelular} alt="Cardápio do Bite Menu no celular" />
            </div>
          </div>
        </section>
      </section>

      <section className="px-4 py-6 sd:py-20 bg-degraded-t-speckled">
        <div className="mb-12 sm:mb-0 flex items-center flex-col-reverse sm:flex-row justify-center gap-6 sm:gap-24 z-2">
          <div className="w-[184px] h-[228px] xs:w-[292px] xs:h-[365px] sm:w-[194px] sm:h-[243px] md:w-[292px] md:h-[365px] lg:w-[324px] lg:h-[405px] relative">
            <Image src={crieerecebawhatsapp} fill alt="Crie seu cardápio e receba pedidos pelo WhatsApp" />
          </div>
          <h1 className="text-center sm:text-start font-bold sm:max-w-[40%] text-xl xs:text-3xl">
            Crie seu cardápio digital e receba pedidos pelo WhatsApp.
          </h1>
        </div>
        <div className="flex items-center flex-col sm:flex-row justify-center sm:gap-24 z-2">
          <h1 className="text-center sm:text-start font-bold sm:max-w-[40%] text-xl xs:text-3xl">
            Controle completamente seus pedidos e suas vendas pelo site.
          </h1>

          <div className="w-[216px] h-[270px] xs:w-[324px] xs:h-[405px] sm:w-[216px] sm:h-[270px] md:w-[324px] md:h-[405px] lg:w-[360px] lg:h-[450px] relative">
            <Image src={controlepedidosevendas} fill alt="Controle pedidos e vendas" />
          </div>
        </div>
      </section>

      <PlansSection />

      {/* <div id="blog" className="pt-8">
        <div className="bg-translucid py-12 px-4 sm:px-8">
          <BlogSection />
        </div>
      </div> */}

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
