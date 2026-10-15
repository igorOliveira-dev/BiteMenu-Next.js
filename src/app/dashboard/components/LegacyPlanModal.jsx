"use client";

import { useEffect, useState } from "react";
import { FaBolt, FaCheck, FaCreditCard, FaBarcode } from "react-icons/fa";
import { MdPix } from "react-icons/md";
import GenericModal from "@/components/GenericModal";
import { legacyPlanInfo } from "@/lib/legacyPlan";
import { plans } from "@/consts/Plans";

const STORAGE_KEY = "bite_menu_legacy_plan_modal";

const business = plans.find((p) => p.id === "business");
const BUSINESS_HIGHLIGHTS = business.features.filter((f) => !f.startsWith("Inclui"));

// Tela de aviso pra quem tem plano com data de término (legacy_plan_until) e a continuação é pelo novo sistema.
// Aparece em todo acesso ao dashboard quando faltam 2 dias ou menos, até a pessoa pedir pra não ver mais.
export default function LegacyPlanModal({ profile }) {
  const [show, setShow] = useState(false);
  const info = legacyPlanInfo(profile); // usa profiles.legacy_plan_until
  const eligible = !!info?.canSubscribeNow;

  useEffect(() => {
    if (!eligible) return;
    try {
      if (window.localStorage.getItem(STORAGE_KEY) === "off") return;
    } catch {
      // sem localStorage: mostra mesmo assim
    }
    setShow(true);
  }, [eligible]);

  if (!show || !eligible) return null;

  const close = () => setShow(false);

  const stopNotices = () => {
    try {
      window.localStorage.setItem(STORAGE_KEY, "off");
    } catch {
      // ignora quota / privacidade do browser
    }
    setShow(false);
  };

  const when = info.daysLeft <= 0 ? "hoje" : info.daysLeft === 1 ? "amanhã" : `em ${info.daysLeft} dias`;

  return (
    <GenericModal title="Trocamos nosso sistema de pagamentos" onClose={close} zIndex={160} size="lg">
      <div className="space-y-4 text-sm">
        <div className="p-4 rounded-2xl border-2 border-amber-500/40 bg-amber-500/10">
          <p className="font-semibold mb-1">
            Seu plano <span className="capitalize">{info.plan}</span> termina {when} ({info.endLabel}).
          </p>
          <p>
            Fizemos uma transição para um novo sistema de pagamentos. Seu plano atual segue funcionando normalmente, sem
            nenhuma cobrança, até <strong>{info.endLabel}</strong>. Para continuar com as vantagens depois disso, é
            preciso assinar novamente pelo novo sistema.
          </p>
          <p className="mt-2 opacity-80">
            Recomendamos assinar entre <strong>{info.subscribeFromLabel}</strong> e <strong>{info.endLabel}</strong>:
            assim você aproveita o plano atual até o fim.
          </p>
        </div>

        <div className="p-4 rounded-2xl border-2 border-[var(--translucid)] bg-translucid">
          <p className="font-semibold mb-2 flex items-center gap-2">
            <FaBolt className="text-red-500" /> Novidade: plano {business.name}
          </p>
          <p className="mb-2 opacity-80">Tudo do Pro e mais:</p>
          <ul className="grid grid-cols-1 xs:grid-cols-2 gap-1">
            {BUSINESS_HIGHLIGHTS.map((f) => (
              <li key={f} className="flex items-center gap-2">
                <FaCheck className="text-green-500 shrink-0" /> {f}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="font-semibold mb-2">Agora você pode pagar de 3 formas:</p>
          <div className="flex flex-wrap gap-2">
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

        <div className="flex flex-col-reverse xs:flex-row gap-2 items-stretch xs:items-center justify-end pt-2">
          <button
            onClick={stopNotices}
            type="button"
            className="cursor-pointer px-4 py-2 text-xs opacity-70 hover:opacity-100 underline"
          >
            Não quero receber mais esse aviso
          </button>
          <a href="/dashboard/pricing" className="cta-button glow-red has-icon text-center">
            <FaBolt /> Ver planos e assinar
          </a>
        </div>
      </div>
    </GenericModal>
  );
}
