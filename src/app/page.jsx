"use client";

import Image from "next/image";
import logoMark from "../../public/LogoMarca-sem-fundo.png";
import logoTip from "../../public/LogoTipo-sem-fundo.png";
import ThemeToggle from "@/components/ThemeToggle";
import menuCelular from "../../public/bitemenuCelular.png";
import Link from "next/link";
import useUser from "@/hooks/useUser";
import Loading from "@/components/Loading";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FaCheck, FaChevronLeft, FaChevronRight, FaWhatsapp } from "react-icons/fa";

import CrieCardapio from "../../public/carousel/CrieSeuCardapio.jpg";
import RecebaWhatsapp from "../../public/carousel/RecebaPedidosNoWhatsapp.jpg";
import ControlePedidos from "../../public/carousel/ControleSeusPedidos.jpg";
import AcompanheSuasVendas from "../../public/carousel/AcompanheSuasVendas.jpg";
import EncontreDadosVendas from "../../public/carousel/EncontreDadosSobreSuasVendas.jpg";
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

  if (loading) {
    return <Loading />;
  }

  return (
    <main>
      {dashboardPath && (
        <button
          onClick={() => router.replace("/dashboard")}
          className="cursor-pointer font-bold p-2 px-4 bg-low-gray rounded-lg shadow-[0_0_10px_var(--shadow)] z-10 backdrop-blur-sm fixed top-22 right-2"
        >
          Acessar meu cardápio
        </button>
      )}

      <section className="sm:h-[100dvh] mb-6" id="begin">
        <header className="fixed inset-x-0 flex items-center justify-between p-2 m-2 my-3 bg-translucid rounded-lg shadow-[0_0_10px_var(--shadow)] z-10 backdrop-blur-sm">
          <Image src={logoMark} height={50} width={180} alt="Bite Menu" onClick={() => (window.location.href = "/")} />
          <ThemeToggle />
        </header>
        <div className="p-2 flex items-center justify-center md:justify-around h-full flex-col md:flex-row">
          <div className="pt-40 md:pt-0 text-center sm:text-start">
            <h1 className="text-5xl lg:text-6xl xl:text-7xl font-bold text-[var(--red)]">Bite Menu</h1>
            <h2>Crie e gerencie seu cardápio digital!</h2>
            <p className="color-gray mb-6 max-w-[400px]">
              Com Bite Menu você constrói a presença online do seu estabelecimento em poucos minutos!
            </p>
            <Link className="plan-button" href="register">
              Comece grátis!
            </Link>
          </div>
          <div className="scale-70 md:scale-90 lg:scale-100 transform-[translate(15%,-10%)] md:transform-none">
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

      <section className="bg-translucid flex flex-col items-center">
        <div className="p-4 relative overflow-hidden w-[96vw] flex justify-center">
          <div
            id="carousel"
            className=" flex gap-6 overflow-x-auto snap-x snap-mandatory scroll-smooth scrollbar-none px-[calc(50vw-180px)] sm:px-[calc(50vw-210px)] lg:px-[calc(50vw-240px)] xl:px-0"
          >
            {[
              { src: CrieCardapio, title: "Crie seu cardápio" },
              { src: RecebaWhatsapp, title: "Receba pedidos pelo WhatsApp" },
              { src: ControlePedidos, title: "Controle seus pedidos" },
              { src: AcompanheSuasVendas, title: "Acompanhe suas vendas" },
              { src: EncontreDadosVendas, title: "Receba insights relevantes" },
            ].map((item, i) => (
              <div
                key={i}
                className="min-w-[280px] lg:min-w-[350px] rounded-xl snap-center flex-shrink-0 flex flex-col items-center justify-center text-center"
              >
                <h3 className="text-medium font-semibold mt-4">{item.title}</h3>
                <Image
                  src={item.src}
                  alt={item.title}
                  width={240}
                  height={240}
                  className="rounded-lg mb-3 object-cover"
                  style={{ transform: "scaleY(0.9)" }}
                />
              </div>
            ))}
          </div>

          <button
            onClick={() => document.getElementById("carousel").scrollBy({ left: -400, behavior: "smooth" })}
            className="cursor-pointer absolute left-1 top-1/2 -translate-y-1/2 bg-translucid backdrop-blur-sm p-2 rounded-full shadow-md hover:scale-110 transition"
          >
            <FaChevronLeft />
          </button>

          <button
            onClick={() => document.getElementById("carousel").scrollBy({ left: 400, behavior: "smooth" })}
            className="cursor-pointer absolute right-1 top-1/2 -translate-y-1/2 bg-translucid backdrop-blur-sm p-2 rounded-full shadow-md hover:scale-110 transition"
          >
            <FaChevronRight />
          </button>
        </div>
      </section>

      <section className="p-6 py-12 flex-col sm:flex-row flex items-center justify-center gap-[8vw] scrollbar-none">
        <iframe
          src="https://www.bitemenu.com.br/menu/bite-menu"
          className="hidden sm:block"
          height={500}
          width={320}
        ></iframe>
        <div className="sm:w-[320px]">
          <h2 className="mb-6">
            Teste um cardápio feito no <strong>Bite Menu!</strong>
          </h2>
          <a href="https://www.bitemenu.com.br/menu/bite-menu" target="_blank" className="plan-button">
            Acesse o cardápio teste
          </a>
        </div>
      </section>

      <section className="py-12 px-6 min-h-[70vh] flex flex-col items-center justify-center bg-translucid">
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
                <button onClick={() => planClick(plan.id)} className="plan-button w-full text-center">
                  Selecionar
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="flex p-4 flex-col items-center justify-center h-[70dvh]">
        <h2 className="font-bold text-2xl mb-12">Alguma dúvida?</h2>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 flex-wrap relative">
          {/* Botão Sobre */}
          <a
            href="/about"
            className="cursor-pointer text-white flex items-center justify-center gap-2 rounded-lg w-full sm:w-auto p-3 bg-blue-600 hover:bg-blue-700 transition font-bold"
          >
            Sobre o Bite Menu
          </a>

          {/* Botão FAQs */}
          <a
            href="/faqs"
            className="cursor-pointer flex items-center justify-center gap-2 rounded-lg w-full sm:w-auto p-3 bg-translucid border-2 border-translucid hover:opacity-80 transition font-bold"
          >
            Perguntas Frequentes
          </a>

          {/* Botão WhatsApp */}
          <button
            onClick={() => callSupport()}
            className="cursor-pointer text-white flex items-center justify-center gap-2 rounded-lg w-full sm:w-auto p-3 bg-green-500 hover:bg-green-600 transition font-bold"
          >
            <FaWhatsapp fontSize={22} />
            Envie uma mensagem!
          </button>
        </div>
      </section>

      <footer className="bg-low-gray p-6 border-t border-gray-300 dark:border-gray-700">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          {/* Logo */}
          <Link href="https://www.bitemenu.com.br" className="w-[220px] flex justify-center">
            <Image src={logoMark} height={40} width={140} alt="Bite Menu" />
          </Link>

          {/* Links */}
          <div className="flex flex-col md:flex-row justify-center items-center gap-2 gap-x-4 text-sm w-[220px]">
            <Link href="/politica-de-privacidade" className="hover:underline">
              Política de Privacidade
            </Link>
            <Link href="/support" className="hover:underline">
              Suporte
            </Link>
          </div>

          {/* Direitos */}
          <div className="text-xs text-center md:text-right w-[220px] color-gray">
            © {new Date().getFullYear()} Bite Menu. <br /> Todos os direitos reservados.
          </div>
        </div>
      </footer>
    </main>
  );
}
