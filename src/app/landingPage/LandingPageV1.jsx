"use client";

import Image from "next/image";
import logoMark from "../../../public/LogoMarca-sem-fundo.png";
import logoTip from "../../../public/LogoTipo-sem-fundo.png";
import ThemeToggle from "@/components/ThemeToggle";
import menuCelular from "../../../public/bitemenuCelular.png";
import Link from "next/link";
import useUser from "@/hooks/useUser";
import { useEffect, useState } from "react";
import { FaCheck, FaClipboardCheck, FaShoppingCart, FaWhatsappSquare } from "react-icons/fa";

import BlogSection from "../blog/BlogSection";
import PlansSection from "@/components/PlansSection";

export default function LandingPageV1() {
  const { user, loading } = useUser();
  const [dashboardPath, setDashboardPath] = useState(false);

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
              <Link className="cta-button small" href="/register">
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
              <Link className="cta-button glow-red lg:text-2xl" href="/register">
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

      <section className="py-6 px-2 sd:py-20 bg-degraded-t-speckled w-full">
        <h1 className="default-h1 text-center">Com tudo que você precisa</h1>
        <h2 className="default-h2 text-center">para o seu negócio</h2>
        <div className="flex items-center justify-center w-full mt-8 gap-8 flex-wrap">
          <div className="p-3 bg-translucid border-b-4 border-[var(--red)] min-w-[300px] sm:min-w-xs max-w-xs flex flex-col items-center text-center rounded-lg shadow-[0_0_10px_var(--shadow)]">
            <FaWhatsappSquare color="var(--red)" size={100} />
            <h2 className="default-h2 font-semibold mt-3">Pedidos via WhatsApp</h2>
            <p className="text-[var(--gray)]">
              Receba pedidos direto no WhatsApp, sem intermediários e sem confusão. O cliente escolhe, envia e você responde
              rápido, com tudo organizado desde o primeiro contato.
            </p>
          </div>
          <div className="p-3 bg-translucid border-b-4 border-[var(--red)] min-w-[300px] sm:min-w-xs max-w-xs flex flex-col items-center text-center rounded-lg shadow-[0_0_10px_var(--shadow)]">
            <FaClipboardCheck color="var(--red)" size={100} />
            <h2 className="default-h2 font-semibold mt-3">Registro de vendas</h2>
            <p className="text-[var(--gray)]">
              Acompanhe suas vendas em tempo real e saiba exatamente o que está funcionando. Tenha controle, histórico e
              clareza para decidir melhor e crescer com segurança.
            </p>
          </div>
          <div className="p-3 bg-translucid border-b-4 border-[var(--red)] min-w-[300px] sm:min-w-xs max-w-xs flex flex-col items-center text-center rounded-lg shadow-[0_0_10px_var(--shadow)]">
            <FaShoppingCart color="var(--red)" size={100} />
            <h2 className="default-h2 font-semibold mt-3">Cardápio personalizado</h2>
            <p className="text-[var(--gray)]">
              Crie um cardápio com a identidade do seu negócio, fácil de atualizar e simples para o cliente usar. Seu produto
              apresentado do jeito certo, em qualquer dispositivo.
            </p>
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
