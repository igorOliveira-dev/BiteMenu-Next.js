"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { FaBolt, FaCheck, FaCreditCard, FaBarcode, FaRegCopy, FaExchangeAlt, FaShieldAlt, FaTimes } from "react-icons/fa";
import { MdPix } from "react-icons/md";
import LogoTip from "../../../../public/LogoTipo-sem-fundo.png";
import { legacyNotice, LEGACY_COUPONS } from "@/lib/legacyPlan";
import { plans } from "@/consts/Plans";

const business = plans.find((p) => p.id === "business");
const highlights = (planId) => (plans.find((p) => p.id === planId)?.features ?? []).filter((f) => !f.startsWith("Inclui"));
const planName = (planId) => plans.find((p) => p.id === planId)?.name ?? "";

// Conteúdo de cada dia (mesmo dia e mesma mensagem dos e-mails de legacyPlanEmails.js)
function content(n) {
  const name = planName(n.plan);
  switch (n.stage) {
    case "d5":
      return {
        tag: "Oferta especial",
        title: `Continue no ${name} com 25% de desconto`,
        text: `Seu plano ${name} atual vale até ${n.lastDayLabel}. Para continuar, é só reassinar pelo novo sistema, e separamos um desconto para você.`,
        coupon: LEGACY_COUPONS.early,
        couponUntil: n.endLabel,
        showNews: true,
        cta: "Reassinar com 25% off",
      };
    case "d2":
      return {
        tag: "Faltam 2 dias",
        title: "Faltam 2 dias para reassinar",
        text: `Seu plano ${name} vale até ${n.lastDayLabel}. Reassine pelo novo sistema para não ficar nenhum dia sem os recursos.`,
        coupon: LEGACY_COUPONS.early,
        couponUntil: n.endLabel,
        cta: `Reassinar o ${name}`,
      };
    case "d1":
      return {
        tag: "Último dia",
        title: `Último dia para manter seu plano ${name}`,
        text: `Hoje é o último dia do seu plano ${name}. Amanhã (${n.endLabel}) sua conta passa para o Free. Reassinando hoje, você continua com tudo o que já usa:`,
        benefits: highlights(n.plan),
        coupon: LEGACY_COUPONS.early,
        couponUntil: n.endLabel,
        cta: "Manter meu plano",
      };
    default:
      return {
        tag: "Plano Free",
        title: "Seu plano voltou ao Free",
        text: "Sua conta está no plano Free a partir de hoje. Seu cardápio, pedidos e dados continuam salvos: reassine quando quiser para voltar a ter todos os recursos.",
        coupon: LEGACY_COUPONS.comeback,
        couponUntil: n.comebackUntilLabel,
        cta: "Reativar meu plano",
      };
  }
}

// Tela cheia de aviso pra quem tem plano com data de término (legacy_plan_until): aparece nos dias dos
// e-mails (D-5, D-2, D-1 e D). Fecha com X, "Fechar" ou voltar do navegador; marcando "Não ver mais",
// esconde só o aviso daquele dia.
export default function LegacyPlanModal({ profile }) {
  const pathname = usePathname();
  // na tela de planos (destino do CTA) não cobre a página
  const notice = pathname?.startsWith("/dashboard/pricing") ? null : legacyNotice(profile);
  const storageKey = notice ? `bite_menu_legacy_notice_${notice.stage}_${notice.end}` : null;
  const [show, setShow] = useState(false);
  const [copied, setCopied] = useState(false);
  const [dontShow, setDontShow] = useState(false);
  const pushedRef = useRef(false);

  useEffect(() => {
    if (!storageKey) return;
    try {
      if (window.localStorage.getItem(storageKey) === "off") return;
    } catch {
      // sem localStorage: mostra mesmo assim
    }
    setShow(true);
  }, [storageKey]);

  // trava o scroll da página por trás
  useEffect(() => {
    if (!show) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [show]);

  // voltar do navegador/celular fecha o aviso: empilha uma entrada no histórico enquanto ele está aberto
  useEffect(() => {
    if (!show) return;
    if (!pushedRef.current) {
      window.history.pushState(window.history.state, "");
      pushedRef.current = true;
    }
    const onPop = () => {
      pushedRef.current = false;
      setShow(false);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [show]);

  if (!show || !notice) return null;

  const c = content(notice);

  // X e botão "Fechar": desfaz a entrada empilhada (o popstate fecha o aviso)
  const close = () => {
    if (pushedRef.current) window.history.back();
    else setShow(false);
  };

  const toggleDontShow = (checked) => {
    setDontShow(checked);
    try {
      if (checked) window.localStorage.setItem(storageKey, "off");
      else window.localStorage.removeItem(storageKey);
    } catch {
      // ignora quota / privacidade do browser
    }
  };

  const copyCoupon = async () => {
    try {
      await navigator.clipboard.writeText(c.coupon.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // sem clipboard: o código continua visível na tela
    }
  };

  return (
    <div className="fixed inset-0 z-[160] bg-[var(--background)] overflow-y-auto" role="dialog" aria-modal="true">
      <button
        type="button"
        onClick={close}
        aria-label="Fechar"
        className="cursor-pointer fixed top-4 right-4 z-10 p-2 rounded-full hover:opacity-80"
      >
        <FaTimes />
      </button>
      <div className="min-h-full flex flex-col items-center justify-center px-4 py-10">
        <div className="w-full max-w-2xl space-y-6">
          <Image src={LogoTip} alt="Bite Menu" height={36} className="h-9 w-auto mx-auto" />

          <div className="text-center space-y-3">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide bg-[var(--red)] text-white">
              {c.tag}
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold">{c.title}</h1>
            <p className="opacity-80 max-w-xl mx-auto">{c.text}</p>
          </div>

          {c.benefits?.length > 0 && (
            <ul className="grid grid-cols-1 xs:grid-cols-2 gap-2 max-w-md mx-auto text-sm">
              {c.benefits.map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <FaCheck className="text-green-500 shrink-0" /> {f}
                </li>
              ))}
            </ul>
          )}

          <div className="p-5 rounded-2xl border-2 border-dashed border-[var(--red)] bg-[var(--translucid)] text-center">
            <p className="text-sm opacity-80 mb-2">Use o cupom no checkout:</p>
            <button
              type="button"
              onClick={copyCoupon}
              className="cursor-pointer inline-flex items-center gap-3 text-2xl sm:text-3xl font-bold tracking-widest text-[var(--red)] hover:opacity-80"
            >
              {c.coupon.code} <FaRegCopy className="text-base opacity-70" />
            </button>
            <p className="text-sm mt-2">
              {copied ? (
                "Cupom copiado!"
              ) : (
                <>
                  <strong>{c.coupon.percent}% de desconto</strong>, válido até <strong>{c.couponUntil}</strong>
                </>
              )}
            </p>
          </div>

          {c.showNews && (
            <div className="p-4 rounded-2xl border-2 border-[var(--translucid)] bg-translucid text-sm">
              <p className="font-semibold mb-2 flex items-center gap-2">
                <FaBolt className="text-red-500" /> Novidade: plano {business.name}
              </p>
              <p className="mb-2 opacity-80">Tudo do Pro e mais:</p>
              <ul className="grid grid-cols-1 xs:grid-cols-2 gap-1">
                {highlights("business").map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <FaCheck className="text-green-500 shrink-0" /> {f}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="text-sm">
            <p className="font-semibold mb-2 text-center">Agora você pode pagar de 3 formas:</p>
            <div className="flex flex-wrap justify-center gap-2">
              <span className="flex items-center gap-2 px-3 py-1.5 rounded-lg border-2 border-[var(--translucid)]">
                <MdPix className="text-teal-500" /> Pix <span className="text-xs opacity-70">(novo)</span>
              </span>
              <span className="flex items-center gap-2 px-3 py-1.5 rounded-lg border-2 border-[var(--translucid)]">
                <FaCreditCard /> Cartão de crédito
              </span>
              <span className="flex items-center gap-2 px-3 py-1.5 rounded-lg border-2 border-[var(--translucid)]">
                <FaBarcode /> Boleto
              </span>
            </div>
          </div>

          <div className="flex gap-3 p-4 rounded-2xl border-2 border-amber-500/40 bg-amber-500/10 text-sm">
            <FaExchangeAlt className="text-amber-500 shrink-0 mt-1" />
            <p>
              <strong>Por que preciso reassinar?</strong> Trocamos o sistema de pagamentos do Bite Menu. As assinaturas
              do sistema antigo não passam automaticamente para o novo, então é preciso assinar de novo, uma única vez.
            </p>
          </div>

          <p className="flex items-center justify-center gap-2 text-xs opacity-70">
            <FaShieldAlt /> Seu cardápio, pedidos e dados continuam salvos.
          </p>

          <div className="flex flex-col items-center gap-3 pt-2">
            <a href="/dashboard/pricing" className="cta-button glow-red has-icon text-center w-full xs:w-auto">
              <FaBolt /> {c.cta}
            </a>
            <button
              onClick={close}
              type="button"
              className="cursor-pointer w-full xs:w-64 px-4 py-3 font-semibold bg-translucid border-2 border-[var(--translucid)] hover:opacity-80 rounded-lg"
            >
              Fechar
            </button>
            <label className="flex items-center gap-2 text-sm opacity-80 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={dontShow}
                onChange={(e) => toggleDontShow(e.target.checked)}
                className="w-4 h-4 cursor-pointer accent-[var(--red)]"
              />
              Não ver mais esse aviso
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
