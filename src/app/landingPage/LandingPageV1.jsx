"use client";

import Image from "next/image";
import logoMark from "../../../public/LogoMarca-sem-fundo.png";
import logoTip from "../../../public/LogoTipo-sem-fundo.png";
import ThemeToggle from "@/components/ThemeToggle";
import menuCelular from "../../../public/bitemenuCelular.png";
import menuCelularFrontal from "../../../public/bitemenuCelular-frontal.png";
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
    <main className="hide-overflow">
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
            <div className="relative my-16 sm:my-0">
              <Image
                src={logoTip}
                alt="Bite Menu"
                className="absolute opacity-20 scale-80 transform-[translate(50%,-30%)] lg:transform-[translate(50%,-40%)] z-0"
              />

              <Link href="register" className="relative z-10 cta-button glow-red lg:text-2xl">
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

      <section className="sm:py-10 py-6 px-2 xs:px-6 sm:px-8 border-t-2 border-[var(--translucid)] flex flex-col-reverse xs:flex-row items-center justify-between md:justify-center gap-4 md:gap-12 text-center xs:text-left">
        <div className="mt-4 xs:mt-0">
          <Image src={menuCelularFrontal} height={300} width={200} />
        </div>
        <div className="mx-2">
          <h2 className="default-h2 font-semibold mb-4">Teste agora um cardápio do Bite Menu!</h2>
          <a href="https://www.bitemenu.com.br/menu/bite-menu" target="_blank" className="cta-button">
            Veja o cardápio de exemplo
          </a>
        </div>
      </section>

      <section className="py-6 px-2 sm:px-4 bg-translucid">
        <h1 className="default-h1 text-center">Como criar seu o cardápio digital</h1>
        <h2 className="default-h2 text-center text-gray font-thin">(Demora menos de 5 minutos)</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full mt-8">
          <div className="bg-degraded-l-speckled flex flex-col border border-[var(--red)] rounded-xl p-4 gap-4">
            <div className="font-bold bg-[var(--red)] text-xl rounded-full glow-bg text-white w-10 h-10 flex items-center justify-center">
              1
            </div>
            <p>
              Clique no botão "Criar cardápio" no cabeçalho desse site e crie a sua conta com nome, email, senha e telefone.
            </p>
          </div>

          <div className="bg-degraded-l-speckled flex flex-col border border-[var(--red)] rounded-xl p-4 gap-4">
            <div className="font-bold bg-[var(--red)] text-xl rounded-full glow-bg text-white w-10 h-10 flex items-center justify-center">
              2
            </div>
            <p>
              Responda as perguntas iniciais na tela de criação de cardápio, como nome do estabelecimento, imagens e cores do
              cardápio.
            </p>
          </div>

          <div className="bg-degraded-l-speckled flex flex-col border border-[var(--red)] rounded-xl p-4 gap-4">
            <div className="font-bold bg-[var(--red)] text-xl rounded-full glow-bg text-white w-10 h-10 flex items-center justify-center">
              3
            </div>
            <p>
              Agora seu cardápio está criado, use o botão "+ categoria" para criar categorias de produtos e use o botão "+
              item" para adicionar produtos dentro de cada categoria.
            </p>
          </div>
          <div className="bg-degraded-l-speckled flex flex-col border border-[var(--red)] rounded-xl p-4 gap-4">
            <div className="font-bold bg-[var(--red)] text-xl rounded-full glow-bg text-white w-10 h-10 flex items-center justify-center">
              4
            </div>
            <p>
              Pronto! Agora você pode compartilhar o link do seu cardápio digital clicando no botão "Copiar link" (para ver
              esse botão no celular, abra o menu no canto inferior direito da tela).
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
