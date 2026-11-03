"use client";

import Image from "next/image";
import Link from "next/link";
import { FaStar, FaWhatsapp } from "react-icons/fa";
import {
  LuArrowRight,
  LuChartLine,
  LuCheck,
  LuClipboardList,
  LuMessageCircle,
  LuPalette,
  LuPencilLine,
  LuPlus,
  LuSmartphone,
  LuWallet,
  LuZap,
} from "react-icons/lu";

import menuExemplo from "../../../public/LandingPageImgs/cardapio-exemplo.webp";

import BrandLogo from "@/components/BrandLogo";
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
    a: "O Bite Menu monta e envia o pedido pelo WhatsApp. O pagamento é combinado direto entre você e o cliente: dinheiro, Pix, maquininha ou o que vocês preferirem. Você não paga taxa por venda para a gente.",
  },
  {
    q: "Como recebo o pedido na prática?",
    a: "O cliente escolhe os produtos no seu cardápio, preenche as informações necessárias e finaliza. O WhatsApp dele abre com o pedido todo formatado e envia direto para o seu número. Você só confirma e prepara.",
  },
  {
    q: "Meus clientes precisam baixar algum aplicativo?",
    a: "Não. Seu cliente abre o cardápio direto no navegador, pelo link ou QR Code. Funciona em qualquer celular, sem instalação.",
  },
  {
    q: "Funciona para o meu tipo de negócio?",
    a: "Sim. Doceria, açaiteria, lanchonete, pizzaria, hamburgueria, restaurante, food truck, marmitaria: qualquer estabelecimento que vende comida ou bebida usa o Bite Menu. Você adapta categorias, produtos e visual ao seu negócio.",
  },
  {
    q: "Tem limite de pedidos?",
    a: "Não. Você pode receber quantos pedidos quiser, em qualquer plano. O que muda entre os planos é a quantidade de itens e categorias do cardápio e as funcionalidades extras, não o volume de vendas.",
  },
  {
    q: "Quanto tempo leva para deixar o cardápio pronto?",
    a: "Menos de 5 minutos. Você cria a conta, responde algumas perguntas rápidas sobre o estabelecimento e já pode começar a adicionar produtos.",
  },
  {
    q: "Posso cancelar quando quiser?",
    a: "Sim. Não há fidelidade. Você pode cancelar a assinatura paga a qualquer momento direto no seu painel.",
  },
];

const benefits = [
  { icon: LuMessageCircle, label: "Pedidos direto no WhatsApp" },
  { icon: LuZap, label: "Pronto em 5 minutos" },
  { icon: LuSmartphone, label: "Funciona em qualquer celular" },
  { icon: LuWallet, label: "Sem mensalidade para começar" },
];

const steps = [
  {
    title: "Crie sua conta grátis",
    desc: "Nome, email e senha. Sem cartão, sem burocracia.",
  },
  {
    title: "Monte seu cardápio",
    desc: "Adicione categorias, produtos e preços. Personalize cores, logo e banner com a sua cara.",
  },
  {
    title: "Compartilhe o link",
    desc: "Mande pelo WhatsApp, redes sociais ou imprima o QR Code no balcão.",
  },
];

const features = [
  {
    icon: LuClipboardList,
    title: "Pare de anotar pedido em papel",
    desc: "O cliente monta o pedido inteiro no cardápio e o WhatsApp chega pronto para você. Só confirmar e preparar.",
  },
  {
    icon: LuPencilLine,
    title: "Mudou o preço? Você mesmo atualiza",
    desc: "Troque preços, fotos e produtos sozinho, na hora, sem imprimir nada de novo.",
  },
  {
    icon: LuChartLine,
    title: "Saiba quanto vendeu hoje",
    desc: "Acompanhe pedidos e vendas em tempo real. No plano Pro, veja métricas avançadas e qual produto vende mais.",
  },
  {
    icon: LuPalette,
    title: "Com a cara do seu negócio",
    desc: "Logo, cores, banner e layout do jeito que você quer. Seu cliente vê o seu estabelecimento, não um modelo genérico.",
  },
];

// Fonte dos percentuais: pesquisa de perfil do painel (281 estabelecimentos), slide 04 do alinhamento visual
const numbers = [
  { value: "88%", label: "administram uma unidade só" },
  { value: "59%", label: "usavam cardápio de papel ou nada antes" },
  { value: "82%", label: "usam para receber pedido no WhatsApp" },
];

// FICTÍCIOS: só para ver o visual. Trocar por depoimentos verdadeiros e remover a trava showTestimonials
const testimonials = [
  {
    quote: "Antes eu anotava tudo em papel e sempre perdia algum pedido. Agora chega tudo certinho no WhatsApp.",
    name: "Marina Souza",
    business: "Doce Marina, doceria",
  },
  {
    quote: "Montei o cardápio no celular, entre uma entrega e outra. Quando o preço muda, eu mesmo atualizo na hora.",
    name: "Rafael Lima",
    business: "Açaí do Rafa, açaiteria",
  },
  {
    quote: "Meus clientes pedem sozinhos pelo link e eu só confirmo. A rotina da lanchonete ficou bem mais calma.",
    name: "Paula Mendes",
    business: "Lanches da Paula, lanchonete",
  },
];

// Depoimento fictício não pode ir ao ar: a seção só aparece em desenvolvimento
const showTestimonials = process.env.NODE_ENV !== "production";

// Print do cardápio real (ClientMenu) com dados fictícios
const PhoneMock = () => (
  <div className="relative w-[250px] sm:w-[280px] shrink-0 self-start overflow-hidden rounded-t-[2.5rem] border-[7px] border-b-0 border-grafite bg-white">
    <div aria-hidden="true" className="absolute left-1/2 top-2 z-10 h-4 w-20 -translate-x-1/2 rounded-full bg-grafite" />
    <Image
      src={menuExemplo}
      alt="Cardápio digital no celular, com açaí, lanches e doces"
      sizes="280px"
      priority
      className="h-auto w-full"
    />
  </div>
);

export default function LandingPageV2() {
  const { user, loading } = useUser();
  const isLogged = !loading && !!user;
  const ctaHref = isLogged ? "/dashboard" : "/register";

  return (
    <main className="brand-scope hide-overflow">
      {/* HEADER */}
      <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3">
        <div className="mx-auto flex max-w-6xl items-center justify-between rounded-full border border-brand-line bg-brand-surface/85 py-1.5 pl-4 pr-1.5 backdrop-blur-xl">
          <div className="hidden xs:block">
            <BrandLogo />
          </div>
          <div className="block xs:hidden">
            <BrandLogo showName={false} />
          </div>
          <div className="flex items-center gap-1">
            <Link className="cta-button small" href={ctaHref}>
              {isLogged ? "Acessar cardápio" : "Criar cardápio grátis"}
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="px-4 pt-28 pb-12 sm:pt-32 sm:pb-16">
        <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
          <div>
            <p className="brand-eyebrow">Cardápio digital para pequenos negócios</p>
            <h1 className="brand-display mt-4">
              Seu cardápio digital pronto em <span className="whitespace-nowrap text-brand-red">5 minutos</span>
            </h1>
            <p className="mt-5 max-w-xl text-base text-brand-muted sm:text-lg">
              O cliente escolhe no celular e o pedido chega pronto no seu <strong>WhatsApp</strong>. Mudou o preço? Você
              mesmo atualiza, na hora.
            </p>

            <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium sm:text-base">
              {["Grátis para sempre", "Sem cartão de crédito", "Sem taxa por venda"].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <LuCheck className="text-brand-red" /> {item}
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-col items-start gap-3 xs:flex-row xs:items-center">
              <Link href={ctaHref} className="cta-button has-icon">
                {isLogged ? "Ir para meu cardápio" : "Criar cardápio grátis"}
                <LuArrowRight />
              </Link>
              <a href={DEMO_URL} target="_blank" rel="noopener noreferrer" className="brand-line-button">
                Ver cardápio de exemplo
              </a>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-md lg:max-w-none">
            <div className="relative flex h-[440px] justify-center overflow-hidden rounded-card bg-brand-gradient px-4 pt-10 sm:h-[540px]">
              <div aria-hidden="true" className="absolute inset-3 rounded-[1.25rem] border border-white/50" />
              <PhoneMock />
            </div>

            <div
              aria-hidden="true"
              className="absolute left-6 top-16 hidden max-w-44 rounded-2xl rounded-bl-sm border border-grafite/15 bg-white p-3 text-xs font-medium text-grafite shadow-lg sm:block lg:-left-6"
            >
              Preço do açaí atualizado. Seu cliente já vê o novo valor.
            </div>
            <div
              aria-hidden="true"
              className="absolute bottom-6 right-2 w-52 rounded-2xl rounded-br-sm border border-grafite/15 bg-[#dcf8c6] p-3 text-xs text-grafite shadow-lg sm:right-4 lg:-right-4"
            >
              <p className="flex items-center gap-1.5 font-bold">
                <FaWhatsapp className="text-green-800" size={14} /> Novo pedido
              </p>
              <p className="mt-1">1x X-burguer</p>
              <p>1x Açaí 500 ml</p>
              <p className="mt-1 font-bold">Total: R$ 39,90</p>
            </div>
          </div>
        </div>
      </section>

      {/* BENEFÍCIOS */}
      <section className="px-4">
        <ul className="mx-auto grid max-w-6xl grid-cols-1 gap-5 border-y border-brand-line py-6 xs:grid-cols-2 lg:grid-cols-4">
          {benefits.map((b) => (
            <li key={b.label} className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-brand-line text-brand-red">
                <b.icon size={20} />
              </span>
              <span className="text-sm font-semibold leading-tight sm:text-base">{b.label}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* COMO FUNCIONA */}
      <section className="px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <p className="brand-eyebrow">Como funciona</p>
          <h2 className="brand-title mt-3">Em 3 passos seu cardápio está no ar</h2>
          <p className="mt-3 text-base text-brand-muted sm:text-lg">Sem instalação, sem técnico, sem complicação.</p>

          <ol className="relative mt-12 grid gap-10 md:grid-cols-3 md:gap-8">
            <span
              aria-hidden="true"
              className="absolute bottom-0 left-6 top-0 border-l border-brand-line md:bottom-auto md:left-0 md:right-6 md:top-6 md:border-l-0 md:border-t"
            />
            <span
              aria-hidden="true"
              className="absolute right-0 top-0 hidden h-12 w-12 items-center justify-center rounded-full border border-brand-line bg-brand-bg text-brand-red md:flex"
            >
              <LuArrowRight size={20} />
            </span>
            {steps.map((s, idx) => (
              <li key={s.title} className="relative pl-16 md:pl-0">
                <span className="absolute left-0 top-0 flex h-12 w-12 items-center justify-center rounded-full bg-bite text-lg font-bold text-white md:static">
                  {idx + 1}
                </span>
                <h3 className="brand-card-title md:mt-5">{s.title}</h3>
                <p className="mt-2 text-sm text-brand-muted sm:text-base">{s.desc}</p>
              </li>
            ))}
          </ol>

          <div className="mt-12">
            <Link href={ctaHref} className="cta-button has-icon w-fit">
              Começar agora, é grátis <LuArrowRight />
            </Link>
          </div>
        </div>
      </section>

      {/* DEMO */}
      <section className="px-4">
        <div className="brand-card mx-auto grid max-w-6xl items-center gap-8 overflow-hidden px-6 pt-10 sm:px-12 md:grid-cols-2 md:pt-0">
          <div className="md:py-12">
            <p className="brand-eyebrow">Na prática</p>
            <h2 className="brand-title mt-3">Veja como seu cliente vai ver</h2>
            <p className="mt-4 text-base text-brand-muted sm:text-lg">
              Um cardápio do Bite Menu de verdade, aberto no celular. Navegue pelas categorias, adicione itens e veja
              como o pedido sai pronto para o WhatsApp.
            </p>
            <a
              href={DEMO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="cta-button has-icon mt-6 w-fit"
            >
              Abrir cardápio de exemplo <LuArrowRight />
            </a>
          </div>
          <div className="flex h-[360px] justify-center overflow-hidden md:mt-10 md:h-[420px]">
            {/* cardápio de exemplo ao vivo, cortado embaixo pela borda do card; segue o tema claro/escuro
                do site (useDemoTheme). Renderizado ~470px de largura e reduzido a 58%: texto menor e mais fotos */}
            <div className="h-[580px] w-[280px] shrink-0 self-start overflow-hidden rounded-[2.6rem] border-[4px] border-[var(--foreground)]/80 bg-[var(--foreground)]/80 shadow-[0_20px_50px_var(--shadow)]">
              <div className="h-full w-full overflow-hidden rounded-[2.35rem] bg-brand-bg">
                <iframe
                  src="/menu/bite-menu"
                  title="Cardápio de exemplo do Bite Menu"
                  loading="lazy"
                  // tamanho = área interna ÷ 0.58, então preenche o celular com qualquer espessura de borda
                  className="h-[calc(100%/0.58)] w-[calc(100%/0.58)] max-w-none origin-top-left scale-[0.58]"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ROTINA */}
      <section className="px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <p className="brand-eyebrow">Sua rotina</p>
          <h2 className="brand-title mt-3">Mais organização, menos papel</h2>
          <p className="mt-3 text-base text-brand-muted sm:text-lg">Nada de funcionalidade que você nunca vai usar.</p>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => (
              <div key={f.title} className="brand-card flex flex-col gap-3 p-6">
                <f.icon size={28} className="text-brand-red" />
                <h3 className="brand-card-title">{f.title}</h3>
                <p className="text-sm text-brand-muted sm:text-base">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* NÚMEROS */}
      <section className="px-4 pb-16 sm:pb-24">
        <div className="mx-auto max-w-6xl">
          <p className="brand-eyebrow">Quem usa</p>
          <h2 className="brand-title mt-3">Feito para quem está começando</h2>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-card bg-bite p-6 text-white">
              <p className="text-5xl font-extrabold tracking-tighter">2000+</p>
              <p className="mt-3 text-sm sm:text-base">estabelecimentos cadastrados</p>
            </div>
            {numbers.map((n) => (
              <div key={n.value} className="brand-card p-6">
                <p className="text-5xl font-extrabold tracking-tighter text-brand-red">{n.value}</p>
                <p className="mt-3 text-sm text-brand-muted sm:text-base">{n.label}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-brand-muted sm:text-sm">
            Percentuais da pesquisa de perfil com 281 estabelecimentos do Bite Menu.
          </p>
        </div>
      </section>

      {/* DEPOIMENTOS */}
      {/*
      {showTestimonials && (
        <section className="px-4 pb-16 sm:pb-24">
          <div className="mx-auto max-w-6xl">
            <p className="brand-eyebrow">Depoimentos</p>
            <h2 className="brand-title mt-3">Quem usa, conta como ficou</h2>

            <ul className="mt-10 grid gap-8 md:grid-cols-3 md:gap-4">
              {testimonials.map((t, idx) => {
                const highlighted = idx === 1;
                return (
                  <li key={t.name} className="flex flex-col gap-4">
                    <figure className="contents">
                      <blockquote
                        className={`flex flex-1 flex-col gap-4 rounded-card rounded-bl-sm p-6 ${
                          highlighted ? "bg-bite text-white" : "border border-brand-line bg-brand-surface"
                        }`}
                      >
                        <span role="img" aria-label="5 de 5 estrelas" className="flex gap-1 text-amber-400">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <FaStar key={star} size={16} />
                          ))}
                        </span>
                        <p className="text-base font-medium leading-relaxed sm:text-lg">“{t.quote}”</p>
                      </blockquote>
                      <figcaption className="flex items-center gap-3">
                        <span
                          aria-hidden="true"
                          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-brand-line text-sm font-bold text-brand-red"
                        >
                          {t.name
                            .split(" ")
                            .map((part) => part[0])
                            .join("")}
                        </span>
                        <span>
                          <span className="block text-sm font-bold">{t.name}</span>
                          <span className="block text-xs text-brand-muted sm:text-sm">{t.business}</span>
                        </span>
                      </figcaption>
                    </figure>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      )}
      */}

      {/* FRASE + CTA */}
      <section className="bg-brand-gradient px-4 py-16 text-white sm:py-24">
        <div className="mx-auto max-w-6xl">
          <p className="max-w-4xl text-3xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
            "O Bite Menu é para quem está começando pequeno, mas sonhando grande”
          </p>
          <p className="mt-4 text-sm">Inspirada em uma resposta da pesquisa de perfil</p>
          <Link
            href={ctaHref}
            className="mt-8 flex w-fit items-center gap-2 rounded-full bg-white px-6 py-3 font-bold text-bite transition hover:opacity-90"
          >
            {isLogged ? "Ir para meu cardápio" : "Criar meu cardápio grátis"}
            <LuArrowRight />
          </Link>
        </div>
      </section>

      {/* PERGUNTAS */}
      <section className="px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-3xl">
          <p className="brand-eyebrow">Perguntas</p>
          <h2 className="brand-title mt-3">O que todo dono de negócio pergunta</h2>

          <div className="mt-10 flex flex-col border-t border-brand-line">
            {faqs.map((item) => (
              <details key={item.q} name="faq" className="group border-b border-brand-line">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 font-semibold sm:text-lg [&::-webkit-details-marker]:hidden">
                  {item.q}
                  <LuPlus className="shrink-0 text-brand-red transition group-open:rotate-45" size={20} />
                </summary>
                <p className="pb-5 text-sm leading-relaxed text-brand-muted sm:text-base">{item.a}</p>
              </details>
            ))}
          </div>
          <p className="mt-6 text-sm text-brand-muted sm:text-base">
            Quer entender cada detalhe?{" "}
            <Link href="/docs" className="underline hover:text-brand-fg">
              Veja a documentação
            </Link>
          </p>
        </div>
      </section>

      {/* PLANOS */}
      <section className="px-4 pb-4">
        <div className="mx-auto max-w-6xl text-center">
          <p className="brand-eyebrow">Planos</p>
          <h2 className="brand-title mt-3">Comece grátis. Atualize quando crescer.</h2>
          <p className="mt-3 text-base text-brand-muted sm:text-lg">
            Você pode usar o plano Free para sempre. Mude de plano só quando fizer sentido.
          </p>
        </div>
      </section>
      <div className="flex items-center justify-center">
        <PlansSection showFree />
      </div>

      {/* CTA FINAL */}
      <section className="px-4 py-20 sm:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="brand-title" style={{ lineHeight: 1.3 }}>
            Seu cardápio digital <span className="brand-highlight">pronto hoje</span>
          </h2>
          <p className="mt-5 text-base text-brand-muted sm:text-lg">
            Crie sua conta agora e comece a receber pedidos pelo WhatsApp ainda hoje.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3">
            <Link href={ctaHref} className="cta-button has-icon">
              {isLogged ? "Ir para meu cardápio" : "Criar cardápio grátis"}
              <LuArrowRight />
            </Link>
            <span className="text-xs text-brand-muted sm:text-sm">
              Grátis para sempre · Sem cartão · Cancele quando quiser
            </span>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-brand-line p-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 md:flex-row">
          <BrandLogo />

          <div className="flex flex-col gap-4 lg:flex-row">
            <div className="flex flex-col items-center justify-center gap-8 text-sm md:flex-row">
              <Link href="/about" className="hover:underline">
                Sobre
              </Link>
              <Link href="/faqs" className="hover:underline">
                Perguntas frequentes
              </Link>
              <Link href="/docs" className="hover:underline">
                Documentação
              </Link>
            </div>
            <div className="flex flex-col items-center justify-center gap-2 gap-x-4 text-sm md:flex-row">
              <Link href="/politica-de-privacidade" className="hover:underline">
                Política de Privacidade
              </Link>
              <Link href="/support" className="hover:underline">
                Suporte
              </Link>
            </div>
          </div>

          <div className="text-center text-xs text-brand-muted md:text-right">
            © {new Date().getFullYear()} Bite Menu. <br /> Todos os direitos reservados.
            <br /> 67.096.848 IGOR VENTURA DE OLIVEIRA
            <br /> CNPJ 67.096.848/0001-37
          </div>
        </div>
      </footer>
    </main>
  );
}
