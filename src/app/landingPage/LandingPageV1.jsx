"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  FaCheck,
  FaWhatsapp,
  FaBolt,
  FaMobileAlt,
  FaMoneyBillWave,
  FaChartLine,
  FaPalette,
  FaPlus,
  FaMinus,
  FaUtensils,
  FaArrowRight,
} from "react-icons/fa";

import logoMark from "../../../public/LogoMarca-sem-fundo.png";
import logoTip from "../../../public/LogoTipo-sem-fundo.png";
import menuCelular from "../../../public/LandingPageImgs/bitemenuCelular.png";
import menuCelularFrontal from "../../../public/LandingPageImgs/bitemenuCelular-frontal.png";

import ThemeToggle from "@/components/ThemeToggle";
import PlansSection from "@/components/PlansSection";
import useUser from "@/hooks/useUser";

const DEMO_URL = "https://www.bitemenu.com.br/menu/bite-menu";

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

const benefits = [
  { icon: <FaWhatsapp size={26} />, label: "Pedidos direto no WhatsApp" },
  { icon: <FaBolt size={26} />, label: "Pronto em 5 minutos" },
  { icon: <FaMobileAlt size={26} />, label: "Funciona em qualquer celular" },
  { icon: <FaMoneyBillWave size={26} />, label: "Sem mensalidade para começar" },
];

const steps = [
  {
    n: 1,
    title: "Crie sua conta grátis",
    desc: "Nome, email e senha. Sem cartão, sem burocracia.",
  },
  {
    n: 2,
    title: "Monte seu cardápio em 5 minutos",
    desc: "Adicione categorias, produtos e preços. Personalize cores, logo e banner com a sua cara.",
  },
  {
    n: 3,
    title: "Compartilhe o link e venda",
    desc: "Mande pelo WhatsApp, redes sociais ou imprima o QR Code no balcão.",
  },
];

const features = [
  {
    icon: <FaWhatsapp size={36} className="text-[var(--red)]" />,
    title: "Pare de anotar pedido em papel",
    desc: "O cliente monta o pedido inteiro no cardápio e o WhatsApp chega pronto pra você. Só confirmar e preparar.",
  },
  {
    icon: <FaChartLine size={36} className="text-[var(--red)]" />,
    title: "Saiba quanto vendeu hoje",
    desc: "Acompanhe pedidos e vendas em tempo real. No plano Pro, veja métricas avançadas e qual produto puxa mais venda.",
  },
  {
    icon: <FaPalette size={36} className="text-[var(--red)]" />,
    title: "Com a cara do seu negócio",
    desc: "Logo, cores, banner e layout do jeito que você quer. Seu cliente vê o seu restaurante, não um template genérico.",
  },
];

const SocialProofChip = ({ className = "" }) => (
  <div
    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--translucid)] border border-[var(--translucid)] text-xs sm:text-sm ${className}`}
  >
    <FaUtensils className="text-[var(--red)]" />
    <span>
      <strong>+300 estabelecimentos</strong> já usam o Bite Menu
    </span>
  </div>
);

export default function LandingPageV1() {
  const { user, loading } = useUser();
  const [isLogged, setIsLogged] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

  useEffect(() => {
    if (!loading && user) setIsLogged(true);
  }, [user, loading]);

  const headerCta = isLogged
    ? { href: "/dashboard", label: "Acessar cardápio" }
    : { href: "/register", label: "Criar cardápio grátis" };

  return (
    <main className="hide-overflow">
      {/* HEADER */}
      <header className="fixed inset-x-0 top-0 z-50 px-2 pt-3">
        <div className="mx-auto flex items-center justify-between p-2 bg-translucid rounded-lg shadow-[0_0_10px_var(--shadow)] backdrop-blur-2xl">
          <Link href="/" className="flex items-center">
            <Image src={logoMark} height={50} width={170} alt="Bite Menu" className="hidden xs:block" />
            <Image src={logoTip} height={44} width={44} alt="Bite Menu" className="block xs:hidden" />
          </Link>
          <div className="flex items-center gap-1">
            <Link className="cta-button small" href={headerCta.href}>
              {headerCta.label}
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative bg-degraded-b border-b border-[var(--translucid)] pt-32 pb-16 sm:pt-36 sm:pb-24 px-4">
        <div className="mx-auto max-w-6xl grid lg:grid-cols-2 gap-12 items-center">
          <div className="text-center lg:text-left">
            <span className="inline-block text-xs sm:text-sm tracking-wider uppercase text-[var(--red)] font-semibold mb-4">
              Cardápio digital para restaurantes
            </span>
            <h1 className="text-3xl xs:text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.05] tracking-tight">
              Venda mais pelo WhatsApp com um<span className="text-[var(--red)]"> cardápio digital grátis</span>.
            </h1>
            <p className="mt-5 text-base sm:text-lg text-[var(--gray)] max-w-xl mx-auto lg:mx-0">
              Seu cliente escolhe os produtos no cardápio e o pedido chega prontinho no seu <strong>WhatsApp</strong>.
              Grátis, para sempre.
            </p>

            <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 justify-center lg:justify-start text-sm sm:text-base">
              <li className="flex items-center gap-2">
                <FaCheck className="text-[var(--red)]" /> Grátis para sempre
              </li>
              <li className="flex items-center gap-2">
                <FaCheck className="text-[var(--red)]" /> Sem cartão de crédito
              </li>
              <li className="flex items-center gap-2">
                <FaCheck className="text-[var(--red)]" /> Pronto em 5 minutos
              </li>
            </ul>

            <div className="mt-8 flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
              <Link
                href={isLogged ? "/dashboard" : "/register"}
                className="cta-button glow-red text-base sm:text-lg flex items-center gap-2"
              >
                {isLogged ? "Ir para meu cardápio" : "Criar cardápio grátis"}
                <FaArrowRight />
              </Link>
              <a
                href={DEMO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm sm:text-base underline underline-offset-4 hover:text-[var(--red)] transition"
              >
                Ver cardápio de exemplo →
              </a>
            </div>

            <div className="mt-6 flex justify-center lg:justify-start">
              <SocialProofChip />
            </div>
          </div>

          <div className="relative flex justify-center lg:justify-end">
            <div
              className="absolute inset-0 -z-10 blur-3xl opacity-30"
              style={{
                background: "radial-gradient(circle at 60% 40%, var(--red), transparent 60%)",
              }}
            />
            <Image
              src={menuCelular}
              alt="Cardápio digital do Bite Menu no celular"
              priority
              className="w-[240px] sm:w-[280px] lg:w-[340px] h-auto drop-shadow-[0_20px_40px_var(--shadow)]"
            />
          </div>
        </div>
      </section>

      {/* BENEFITS STRIP — wavy red */}
      <section className="relative bg-[var(--red)] text-white py-16 sm:py-20 px-4">
        <svg
          className="absolute left-0 right-0 top-0 w-full h-10 sm:h-14 -translate-y-[99%] pointer-events-none"
          viewBox="0 0 1440 80"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path fill="var(--red)" d="M0,40 Q360,0 720,40 T1440,40 L1440,80 L0,80 Z" />
        </svg>

        <div className="relative mx-auto max-w-6xl grid grid-cols-2 md:grid-cols-4 gap-6">
          {benefits.map((b) => (
            <div key={b.label} className="flex items-center gap-3 justify-center md:justify-start">
              <span className="shrink-0">{b.icon}</span>
              <span className="text-sm sm:text-base font-semibold leading-tight">{b.label}</span>
            </div>
          ))}
        </div>

        <svg
          className="absolute left-0 right-0 bottom-0 w-full h-10 sm:h-14 translate-y-[99%] pointer-events-none"
          viewBox="0 0 1440 80"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path fill="var(--red)" d="M0,40 Q360,80 720,40 T1440,40 L1440,0 L0,0 Z" />
        </svg>
      </section>

      {/* HOW IT WORKS */}
      <section className="px-4 py-16 sm:py-24 bg-degraded-t-speckled">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-extrabold">Em 3 passos seu cardápio está no ar</h2>
            <p className="mt-3 text-[var(--gray)] text-base sm:text-lg">Sem instalação, sem técnico, sem complicação.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {steps.map((s, idx) => (
              <div
                key={s.n}
                className="relative p-6 rounded-2xl border border-[var(--translucid)] bg-[var(--translucid)] shadow-[0_0_30px_var(--shadow)] hover:border-[var(--red)] transition"
              >
                <div className="absolute -top-5 left-6 w-12 h-12 rounded-full bg-[var(--red)] text-white text-xl font-bold flex items-center justify-center glow-red">
                  {s.n}
                </div>
                <h3 className="mt-6 text-lg sm:text-xl font-bold">{s.title}</h3>
                <p className="mt-2 text-sm sm:text-base text-[var(--gray)]">{s.desc}</p>
                {idx < steps.length - 1 && (
                  <FaArrowRight className="hidden md:block absolute -right-5 top-1/2 -translate-y-1/2 text-[var(--red)]" />
                )}
              </div>
            ))}
          </div>

          <div className="mt-12 flex justify-center">
            <Link
              href={isLogged ? "/dashboard" : "/register"}
              className="cta-button glow-red text-base sm:text-lg flex items-center gap-2"
            >
              Começar agora — é grátis <FaArrowRight />
            </Link>
          </div>
        </div>
      </section>

      {/* LIVE DEMO */}
      <section className="px-4 py-16 sm:py-20 bg-speckled border-y border-[var(--translucid)]">
        <div className="mx-auto max-w-6xl flex flex-col-reverse md:flex-row items-center justify-between gap-10">
          <div className="md:max-w-md text-center md:text-left">
            <h2 className="text-2xl sm:text-3xl font-extrabold">Veja como seu cliente vai ver</h2>
            <p className="mt-3 text-[var(--gray)] text-base sm:text-lg">
              Um cardápio do Bite Menu de verdade, aberto no celular. Navegue pelas categorias, adicione itens e veja como o
              pedido sai pronto pro WhatsApp.
            </p>
            <a
              href={DEMO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="cta-button mt-6 inline-flex items-center gap-2"
            >
              Abrir cardápio de exemplo <FaArrowRight />
            </a>
          </div>
          <div className="relative">
            <div
              className="absolute inset-0 -z-10 blur-3xl opacity-25"
              style={{
                background: "radial-gradient(circle at 50% 50%, var(--red), transparent 60%)",
              }}
            />
            <Image
              src={menuCelularFrontal}
              alt="Cardápio do Bite Menu visto pelo cliente"
              className="w-[200px] sm:w-[240px] h-auto drop-shadow-[0_20px_40px_var(--shadow)]"
            />
          </div>
        </div>
      </section>

      {/* FEATURES (BENEFIT-DRIVEN) */}
      <section className="px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-extrabold">Tudo o que um restaurante precisa</h2>
            <p className="mt-3 text-[var(--gray)] text-base sm:text-lg">Nada de funcionalidade que você nunca vai usar.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {features.map((f) => (
              <div
                key={f.title}
                className="p-6 rounded-2xl border border-[var(--translucid)] bg-[var(--translucid)] hover:border-[var(--red)] hover:shadow-[0_0_25px_rgba(212,16,16,0.25)] transition flex flex-col gap-3"
              >
                <div>{f.icon}</div>
                <h3 className="text-lg sm:text-xl font-bold">{f.title}</h3>
                <p className="text-sm sm:text-base text-[var(--gray)]">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MID-FUNNEL CTA + SOCIAL PROOF */}
      <section className="relative px-4 py-16 sm:py-20 overflow-hidden">
        <div
          className="absolute inset-0 -z-10 opacity-90"
          style={{
            background: "linear-gradient(135deg, rgba(212,16,16,0.85), rgba(150,0,0,0.95))",
          }}
        />
        <div className="absolute inset-0 -z-10 bg-speckled opacity-30" />

        <div className="mx-auto max-w-4xl text-center text-white">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight">
            Pronto para parar de perder pedido?
          </h2>
          <p className="mt-4 text-lg sm:text-xl opacity-95">
            <strong>+300 estabelecimentos</strong> já estão recebendo pedidos pelo Bite Menu agora mesmo.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href={isLogged ? "/dashboard" : "/register"}
              className="bg-white text-[var(--red)] font-extrabold py-3.5 px-7 rounded-lg text-base sm:text-lg hover:scale-105 transition shadow-[0_10px_30px_rgba(0,0,0,0.35)] flex items-center gap-2"
            >
              {isLogged ? "Ir para meu cardápio" : "Criar meu cardápio grátis"}
              <FaArrowRight />
            </Link>
            <span className="text-sm opacity-90">Grátis · Sem cartão · 5 minutos</span>
          </div>
        </div>
      </section>

      {/* MINI FAQ */}
      <section className="px-4 py-16 sm:py-20">
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

      {/* PLANS */}
      <section className="px-4 pt-8 pb-4">
        <div className="mx-auto max-w-6xl text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold">Comece grátis. Atualize quando crescer.</h2>
          <p className="mt-3 text-[var(--gray)] text-base sm:text-lg">
            Você pode usar o plano Free para sempre. Mude de plano só quando fizer sentido.
          </p>
        </div>
      </section>
      <div className="flex justify-center items-center">
        <PlansSection />
      </div>

      {/* FINAL CTA */}
      <section className="px-4 py-20 sm:py-24 bg-degraded-b-speckled">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl sm:text-5xl font-extrabold leading-tight">
            Seu cardápio digital <span className="text-[var(--red)]">pronto hoje</span>.
          </h2>
          <p className="mt-4 text-base sm:text-lg text-[var(--gray)]">
            Crie sua conta agora e comece a receber pedidos pelo WhatsApp ainda hoje.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3">
            <Link
              href={isLogged ? "/dashboard" : "/register"}
              className="cta-button glow-red text-base sm:text-lg flex items-center gap-2"
            >
              {isLogged ? "Ir para meu cardápio" : "Criar cardápio grátis"}
              <FaArrowRight />
            </Link>
            <span className="text-xs sm:text-sm text-[var(--gray)]">
              Grátis para sempre · Sem cartão · Cancele quando quiser
            </span>
            <SocialProofChip className="mt-2" />
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-low-gray p-6 border-t border-[var(--translucid)]">
        <div className="mx-auto max-w-6xl flex flex-col md:flex-row justify-between items-center gap-4">
          <Link href="https://www.bitemenu.com.br" className="flex justify-center">
            <Image src={logoMark} height={40} width={140} alt="Bite Menu" />
          </Link>

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

          <div className="text-xs text-center md:text-right color-gray">
            © {new Date().getFullYear()} Bite Menu. <br /> Todos os direitos reservados.
          </div>
        </div>
      </footer>
    </main>
  );
}
