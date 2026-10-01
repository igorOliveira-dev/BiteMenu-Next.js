"use client";

import React, { useEffect, useState } from "react";
import { plans, plansBlockedFor } from "@/consts/Plans";
import { FaCheck } from "react-icons/fa";
import useUser from "@/hooks/useUser";
import { useAlert } from "@/providers/AlertProvider";
import { supabase } from "@/lib/supabaseClient";
import GenericModal from "./GenericModal";

const CYCLE_LABEL = { monthly: "mensal", yearly: "anual" };
const PER_CYCLE = { monthly: "por mês", yearly: "por ano" };

const formatDate = (iso) => (iso ? new Date(iso).toLocaleDateString("pt-BR", { timeZone: "UTC" }) : "-");
const formatBRL = (value) => Number(value ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

async function authFetch(url, options = {}) {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session?.access_token}`,
      ...options.headers,
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || "Erro inesperado. Tente novamente.");
  return data;
}

// Troca de plano de quem já assina: mostra a simulação da ValidaPay e, ao confirmar, executa.
const ChangePlanModal = ({ plan, cycle, currentPlanName, onClose }) => {
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    authFetch("/api/validapay/change-plan", { method: "POST", body: JSON.stringify({ planId: plan.id, cycle }) })
      .then(setPreview)
      .catch((err) => setError(err.message));
  }, [plan.id, cycle]);

  const confirmChange = async () => {
    setConfirming(true);
    setError(null);
    try {
      const data = await authFetch("/api/validapay/change-plan", {
        method: "POST",
        body: JSON.stringify({ planId: plan.id, cycle, confirm: true }),
      });
      if (data.awaitingPayment) setResult(data);
      else window.location.href = "/dashboard?tab=planDetails"; // recarrega o profile já com o plano novo
    } catch (err) {
      setError(err.message);
      setConfirming(false);
    }
  };

  const copyPix = async () => {
    try {
      await navigator.clipboard.writeText(result.pix.emv);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  const target = `${plan.name} ${CYCLE_LABEL[cycle]}`;

  return (
    <GenericModal
      title="Trocar de plano"
      onClose={confirming ? () => {} : onClose}
      wfull
      maxWidth="480px"
      margin="12px"
    >
      {result ? (
        <div className="flex flex-col items-center text-center gap-3">
          <p className="text-sm">
            Pague <strong>{formatBRL(result.amountNow)}</strong> para liberar o plano <strong>{target}</strong>
            {result.dueDate ? ` (vence em ${formatDate(result.dueDate)})` : ""}. O plano muda assim que o pagamento for
            confirmado.
          </p>

          {result.pix && (
            <>
              <img src={result.pix.qrCode} alt="QR Code PIX" className="w-52 h-52 rounded-xl bg-white p-2" />
              <button onClick={copyPix} className="cta-button small" type="button">
                {copied ? "Código copiado!" : "Copiar código PIX"}
              </button>
            </>
          )}

          {result.boletoUrl && (
            <a href={result.boletoUrl} target="_blank" rel="noopener noreferrer" className="cta-button small">
              Abrir boleto
            </a>
          )}

          <a href="/dashboard?tab=planDetails" className="text-sm underline color-gray mt-2">
            Já paguei, ver meu plano
          </a>
        </div>
      ) : (
        <div className="text-sm">
          <p>
            De <strong className="capitalize">{currentPlanName}</strong> para <strong>{target}</strong>
          </p>

          {!preview && !error && <div className="mt-4 h-24 rounded-xl bg-translucid animate-pulse" />}

          {preview?.kind === "charge_now" && (
            <div className="mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
              <p>
                Você paga <strong>{formatBRL(preview.amountNow)} agora</strong>: só a diferença proporcional aos dias
                que faltam no seu ciclo atual.
              </p>
              <p className="mt-2">
                {preview.paymentType === "CREDIT_CARD"
                  ? "O valor é cobrado no seu cartão e o plano novo vale na hora."
                  : "Vamos gerar a cobrança da diferença; o plano novo vale assim que ela for paga."}
              </p>
              <p className="mt-2 color-gray">
                Depois, {formatBRL(preview.nextChargeAmount)} {PER_CYCLE[cycle]} a partir de{" "}
                {formatDate(preview.nextChargeDate)}.
              </p>
            </div>
          )}

          {preview?.kind === "next_cycle" && (
            <div className="mt-4 p-3 rounded-xl bg-translucid border border-[var(--translucid)]">
              <p>
                <strong>Nada é cobrado agora.</strong> Você continua com o plano{" "}
                <span className="capitalize">{currentPlanName}</span> até {formatDate(preview.effectiveAt)}.
              </p>
              <p className="mt-2 color-gray">
                A partir daí, passa para o {target} por {formatBRL(preview.nextChargeAmount)} {PER_CYCLE[cycle]}.
              </p>
            </div>
          )}

          {preview?.kind === "reschedule" && (
            <div className="mt-4 p-3 rounded-xl bg-translucid border border-[var(--translucid)]">
              <p>
                <strong>Nada é cobrado agora.</strong> O plano {target} começa hoje, e o valor que você já pagou vira
                dias de uso dele.
              </p>
              <p className="mt-2 color-gray">
                A primeira cobrança {CYCLE_LABEL[cycle]} será em {formatDate(preview.nextChargeDate)}, no valor de{" "}
                {formatBRL(preview.nextChargeAmount)}.
              </p>
            </div>
          )}

          {error && <p className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30">{error}</p>}

          <div className="flex gap-2 justify-end mt-6">
            <button
              onClick={onClose}
              disabled={confirming}
              className="cursor-pointer px-4 py-2 bg-translucid border-2 border-[var(--translucid)] hover:opacity-80 rounded disabled:opacity-50"
              type="button"
            >
              Voltar
            </button>
            <button
              onClick={confirmChange}
              disabled={!preview || confirming}
              className="cta-button glow-red disabled:opacity-50 disabled:cursor-not-allowed"
              type="button"
            >
              {confirming ? "Processando..." : "Confirmar troca"}
            </button>
          </div>
        </div>
      )}
    </GenericModal>
  );
};

const PlansSection = () => {
  const [loadingPlan, setLoadingPlan] = useState(null);
  const [cycle, setCycle] = useState("monthly"); // "monthly" | "yearly"
  const [billing, setBilling] = useState(null); // assinatura atual (quem já assina)
  const [changeTarget, setChangeTarget] = useState(null);
  const { user, profile } = useUser();
  const alert = useAlert();

  const subscriptionId = profile?.validapay_subscription_id;
  const maintenance = plansBlockedFor(user?.email);

  useEffect(() => {
    if (!subscriptionId) return;
    authFetch("/api/validapay/subscription")
      .then((data) => {
        setBilling(data);
        if (data?.cycle) setCycle(data.cycle);
      })
      .catch(() => {});
  }, [subscriptionId]);

  const isCurrentCard = (plan) => billing && plan.id === profile?.role && cycle === billing.cycle;
  // Com downgrade agendado, o card do plano atual serve pra desfazer o agendamento
  const isCurrent = (plan) => isCurrentCard(plan) && !billing.scheduledChange;

  const handleSelect = async (plan) => {
    if (!user) {
      window.location.href = "/register";
      return;
    }
    if (!profile || loadingPlan) return;
    if (profile.validapay_subscription_id) {
      if (profile.cancel_at_period_end) {
        alert("Sua assinatura está com cancelamento agendado. Restaure-a em Detalhes do Plano para trocar de plano.");
        return;
      }
      if (!billing) return; // ainda carregando a assinatura atual
      setChangeTarget(plan);
      return;
    }

    setLoadingPlan(plan.id);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const res = await fetch("/api/validapay/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ planId: plan.id, cycle }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      window.location.href = data.url;
    } catch (err) {
      alert(err.message || "Não foi possível iniciar o pagamento. Tente novamente.");
      setLoadingPlan(null);
    }
  };

  return (
    <section className="py-3 px-6 flex flex-col items-center justify-center min-h-[calc(100dvh-100px)]">
      <h2 className="font-bold scale-130 xxs:scale-150 mt-4 lg:mt-0 mb-8 text-center">Planos disponíveis:</h2>

      {maintenance && (
        <div className="w-full max-w-[700px] mb-8 p-4 rounded-xl bg-amber-500/10 border-2 border-amber-500/40 text-sm text-center">
          <strong>Contratação temporariamente indisponível.</strong>
          <br />
          Estamos trocando nosso sistema de pagamentos. Em breve você poderá assinar normalmente.
          Se você já é assinante, seu plano atual continua ativo até 28/10/2026.
        </div>
      )}

      {!maintenance && profile?.legacy_plan_until && (
        <div className="w-full max-w-[700px] mb-8 p-4 rounded-xl bg-amber-500/10 border-2 border-amber-500/40 text-sm text-center">
          <strong>Trocamos nosso sistema de pagamentos.</strong>
          <br />
          Sua assinatura antiga termina em 28/10/2026. Assine novamente aqui para manter seu plano sem interrupção.
        </div>
      )}

      <div className="flex p-1 mb-8 rounded-full bg-translucid border-2 border-[var(--translucid)] text-sm">
        {[
          ["monthly", "Mensal"],
          ["yearly", "Anual (2 meses grátis)"],
        ].map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setCycle(value)}
            className={`px-4 py-1.5 rounded-full cursor-pointer transition ${
              cycle === value ? "bg-[var(--red)] text-white font-semibold" : "opacity-70 hover:opacity-100"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="w-full max-w-[1248px] flex justify-around flex-wrap gap-6 lg:gap-12">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className="p-4 px-6 bg-degraded-t-speckled border-2 border-[var(--translucid)] rounded-xl w-64 flex flex-col gap-6 justify-between transition"
          >
            <div>
              <h2 className="font-bold mb-2 text-center">{plan.name}</h2>
              <hr className="border-translucid mb-4" />
              {cycle === "yearly" && plan.yearlyPrice ? (
                <div className="text-center mb-4">
                  <p className="text-sm color-gray line-through">R$ {plan.yearlyAnchor}/ano</p>
                  <p className="text-4xl font-bold">
                    <span className="text-base color-gray mr-1">R$</span>
                    {plan.yearlyPrice}
                    <span className="text-base color-gray">/ano</span>
                  </p>
                </div>
              ) : (
                <p className="text-4xl font-bold text-center mb-4">
                  <span className="text-base color-gray mr-1">R$</span>
                  {plan.price}
                  <span className="text-base color-gray">/mês</span>
                </p>
              )}
              <ul className="mt-2">
                {plan.features.map((feature, index) => (
                  <div key={index}>
                    <li className="flex items-center gap-2 mt-1">
                      <FaCheck className="text-[var(--red)]" />
                      {feature}
                    </li>
                    <hr className="border border-translucid" />
                  </div>
                ))}
              </ul>
            </div>

            {plan.id !== "free" && (
              <div className="w-full flex flex-col gap-2">
                <button
                  className="cta-button glow-red disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={maintenance || !!loadingPlan || isCurrent(plan)}
                  onClick={() => handleSelect(plan)}
                >
                  {maintenance
                    ? "Indisponível"
                    : isCurrent(plan)
                    ? "Plano atual"
                    : isCurrentCard(plan)
                      ? "Manter este plano"
                      : loadingPlan === plan.id
                        ? "Processando..."
                        : subscriptionId
                          ? "Trocar para este"
                          : "Selecionar"}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {changeTarget && (
        <ChangePlanModal
          plan={changeTarget}
          cycle={cycle}
          currentPlanName={profile?.role}
          onClose={() => setChangeTarget(null)}
        />
      )}
    </section>
  );
};

export default PlansSection;
