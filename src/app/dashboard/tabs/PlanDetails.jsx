"use client";

import { FaBolt, FaChevronLeft } from "react-icons/fa";
import Loading from "@/components/Loading";
import useUser from "@/hooks/useUser";

export default function PlanDetails({ setSelectedTab }) {
  const { profile, loading } = useUser();

  if (loading || !profile) return <Loading />;

  const legacyUntil = profile.legacy_plan_until
    ? new Date(`${profile.legacy_plan_until}T00:00:00`).toLocaleDateString("pt-BR")
    : null;

  return (
    <div className="p-2">
      <div className="flex items-center mb-4 gap-2">
        <div onClick={() => setSelectedTab("account")}>
          <FaChevronLeft className="cursor-pointer" />
        </div>
        <h2 className="xs:font-semibold">Detalhes do Plano</h2>
      </div>

      {legacyUntil && ["plus", "pro"].includes(profile.role) && (
        <div className="p-4 mb-4 border border-amber-500/30 bg-amber-500/10 rounded max-w-[1024px] flex flex-col gap-2">
          <p className="font-semibold">Aviso importante sobre sua assinatura</p>
          <p>
            Estamos trocando o sistema de pagamentos do Bite Menu. Por isso, sua assinatura atual será encerrada em{" "}
            <strong>{legacyUntil}</strong>, e nenhuma nova cobrança será feita nela.
          </p>
          <p>
            Até lá, seu plano <span className="capitalize font-semibold">{profile.role}</span> continua funcionando
            normalmente. A partir de {legacyUntil}, sua conta passa para o plano Free e você poderá assinar novamente
            pelo novo sistema de pagamentos para voltar ao seu plano.
          </p>
        </div>
      )}

      <div className="flex flex-col justify-center p-4 bg-translucid border-2 border-[var(--translucid)] rounded-lg text-center w-full max-w-[1024px]">
        <p className="text-sm color-gray">Plano atual:</p>
        <p className="capitalize default-h1 mb-2">{profile.role}</p>
        {profile.role !== "pro" && profile.role !== "admin" && (
          <div className="flex flex-col items-center">
            <a href="/dashboard/pricing" className="cta-button has-icon small mt-2">
              <FaBolt /> Melhorar plano!
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
