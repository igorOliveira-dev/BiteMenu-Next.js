"use client";

import { FaExclamationTriangle } from "react-icons/fa";
import useUser from "@/hooks/useUser";
import { legacyPlanInfo } from "@/lib/legacyPlan";

// Aviso pra plano com data de término (assinantes da Stripe e testes grátis): vale até a data,
// sem cobrança, e sugere assinar pelo sistema novo 2 dias antes pra não pagar em dobro.
// `info` vem de legacyPlanInfo().
export default function LegacyPlanNotice({ info, showPlansLink = true, className = "" }) {
  if (!info) return null;

  return (
    <div className={`p-4 rounded-2xl border-2 border-amber-500/40 bg-amber-500/10 text-sm ${className}`}>
      <p className="font-semibold mb-1">Trocamos nosso sistema de pagamentos.</p>
      <p>
        Seu plano <span className="capitalize font-semibold">{info.plan}</span> continua funcionando normalmente, sem
        nenhuma cobrança, e termina em <strong>{info.endLabel}</strong>.{" "}
        Para continuar, recomendamos assinar pelo novo sistema entre <strong>{info.subscribeFromLabel}</strong> e{" "}
        <strong>{info.endLabel}</strong>, perto do fim do plano atual. Assim você não paga em dobro e não fica nenhum dia
        sem os recursos.
        {showPlansLink && (
          <>
            {" "}
            <a href="/dashboard/pricing" className="underline font-semibold whitespace-nowrap">
              Ver planos
            </a>
          </>
        )}
      </p>
    </div>
  );
}

// Banner da aba de menu (mesmo lugar e estilo do SurveyBanner): aparece nos dias de reassinar,
// a partir de 2 dias antes de o plano terminar.
export function LegacyPlanEndingBanner() {
  const { profile } = useUser();
  const info = legacyPlanInfo(profile);
  if (!info?.canSubscribeNow) return null;

  const when = info.daysLeft <= 0 ? "hoje" : info.daysLeft === 1 ? "amanhã" : `em ${info.daysLeft} dias`;
  return (
    <a
      href="/dashboard/pricing"
      className="max-w-[100%] flex flex-col xs:flex-row items-center gap-3 px-2 sm:px-4 py-2 my-2 max-w-3xl bg-amber-500/10 border-2 border-amber-500/40 rounded-2xl hover:opacity-90 transition"
    >
      <FaExclamationTriangle className="text-lg shrink-0 hidden xs:block text-amber-500" />
      <span className="text-xs flex-1">
        Seu plano <span className="capitalize font-semibold">{info.plan}</span> termina {when} ({info.endLabel}). Assine
        pelo novo sistema de pagamentos para não perder os recursos.
      </span>
      <span className="w-full xs:w-auto text-center text-xs px-4 py-1.5 rounded-lg border-2 border-[var(--translucid)] bg-translucid hover:opacity-80 text-sm shrink-0">
        Ver planos
      </span>
    </a>
  );
}
