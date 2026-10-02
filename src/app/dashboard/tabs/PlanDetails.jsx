"use client";

import { useEffect, useState } from "react";
import {
  FaBarcode,
  FaBolt,
  FaCalendarAlt,
  FaCcAmex,
  FaCcMastercard,
  FaCcVisa,
  FaChevronLeft,
  FaCreditCard,
  FaSyncAlt,
} from "react-icons/fa";
import { FaPix } from "react-icons/fa6";
import Loading from "@/components/Loading";
import useUser, { updateCachedProfile } from "@/hooks/useUser";
import { useConfirm } from "@/providers/ConfirmProvider";
import { useAlert } from "@/providers/AlertProvider";
import { supabase } from "@/lib/supabaseClient";
import { brDate } from "@/lib/brDate";

const PAYMENT_METHODS = {
  CREDIT_CARD: { label: "Cartão de crédito", Icon: FaCreditCard },
  PIX: { label: "PIX", Icon: FaPix },
  PIX_AUTOMATICO: { label: "Pix Automático", Icon: FaPix },
  BOLETO: { label: "Boleto", Icon: FaBarcode },
};
const CARD_ICONS = { VISA: FaCcVisa, MASTERCARD: FaCcMastercard, MASTER: FaCcMastercard, AMEX: FaCcAmex };
const INTERVAL_LABELS = { MONTHLY: "Mensal", YEARLY: "Anual" };

const BillingRow = ({ Icon, label, children }) => (
  <div className="flex items-center gap-3 p-4">
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--translucid)] text-lg">
      <Icon />
    </span>
    <div className="min-w-0">
      <p className="text-xs color-gray">{label}</p>
      <div className="font-semibold">{children}</div>
    </div>
  </div>
);

const BillingCard = ({ billing, canCancel, canceling, onCancel }) => {
  if (billing === undefined) {
    return (
      <div className="mt-4 h-[236px] w-full max-w-[1024px] rounded-2xl bg-translucid border-2 border-[var(--translucid)] animate-pulse" />
    );
  }
  if (!billing) return null;

  const method = PAYMENT_METHODS[billing.paymentType];
  const CardIcon = CARD_ICONS[billing.card?.brand?.toUpperCase()] ?? FaCreditCard;
  const isYearly = billing.interval === "YEARLY";

  return (
    <div className="mt-4 w-full max-w-[1024px] rounded-2xl bg-translucid border-2 border-[var(--translucid)] overflow-hidden">
      <div className="flex items-center justify-between gap-3 p-4 border-b-2 border-[var(--translucid)]">
        <p className="font-semibold">Faturamento</p>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[var(--translucid)]">
          {INTERVAL_LABELS[billing.interval] ?? billing.interval}
        </span>
      </div>

      {billing.scheduledChange && !billing.cancelAtPeriodEnd && (
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm bg-amber-500/10 border-b-2 border-[var(--translucid)]">
          <span>
            Troca agendada: a partir de <strong>{formatDate(billing.scheduledChange.effectiveAt)}</strong> você passa
            para o plano <strong className="capitalize">{billing.scheduledChange.plan}</strong>.
          </span>
          <a href="/dashboard/pricing" className="underline">
            Desfazer
          </a>
        </div>
      )}

      <div className="grid sm:grid-cols-2 divide-y-2 sm:divide-y-0 sm:divide-x-2 divide-[var(--translucid)]">
        {billing.cancelAtPeriodEnd ? (
          <BillingRow Icon={FaCalendarAlt} label="Acesso até">
            {formatDate(billing.cancelEffectiveAt)}
            <p className="text-xs font-normal color-gray">Sem novas cobranças</p>
          </BillingRow>
        ) : (
          <BillingRow Icon={FaCalendarAlt} label="Próxima cobrança">
            <span className="text-lg">{formatDate(billing.nextChargeDate)}</span>
            <p className="text-sm font-normal color-gray">
              {formatBRL(billing.nextChargeAmount)}
              {isYearly ? " por ano" : " por mês"}
            </p>
          </BillingRow>
        )}

        {billing.card ? (
          <BillingRow Icon={CardIcon} label="Forma de pagamento">
            <span className="capitalize">{billing.card.brand?.toLowerCase()}</span>
            <span className="ml-2 font-mono tracking-wider">•••• {billing.card.lastFour}</span>
          </BillingRow>
        ) : (
          <BillingRow Icon={method?.Icon ?? FaSyncAlt} label="Forma de pagamento">
            {method?.label ?? "Escolhida a cada fatura"}
            {billing.paymentType !== "PIX_AUTOMATICO" && (
              <p className="text-xs font-normal color-gray">A fatura chega no seu e-mail antes do vencimento</p>
            )}
          </BillingRow>
        )}
      </div>

      {canCancel && (
        <div className="flex justify-between items-center gap-2 p-3 border-t-2 border-[var(--translucid)]">
          <a
            href="/dashboard/pricing"
            className="text-sm px-3 py-1.5 rounded-lg hover:bg-[var(--translucid)] transition"
          >
            Trocar de plano
          </a>
          <button
            onClick={onCancel}
            disabled={canceling}
            className="text-sm px-3 py-1.5 rounded-lg text-red-500 hover:bg-red-500/10 transition cursor-pointer disabled:opacity-50"
            type="button"
          >
            {canceling ? "Cancelando..." : "Cancelar assinatura"}
          </button>
        </div>
      )}
    </div>
  );
};

const formatDate = (iso) => brDate(iso) || "-";
const formatBRL = (value) =>
  value != null ? Number(value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "-";

async function authHeaders() {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return { Authorization: `Bearer ${session?.access_token}` };
}

export default function PlanDetails({ setSelectedTab }) {
  const { profile, loading } = useUser();
  const [patch, setPatch] = useState({});
  const [canceling, setCanceling] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [billing, setBilling] = useState(undefined); // undefined = carregando
  const confirm = useConfirm();
  const alert = useAlert();

  const subscriptionId = profile?.validapay_subscription_id;
  const canceledAt = patch.cancel_at_period_end;

  // Recarrega também depois de cancelar/restaurar, pra mostrar a data em que o acesso termina
  useEffect(() => {
    if (!subscriptionId) return;
    let cancelled = false;

    authHeaders()
      .then((headers) => fetch("/api/validapay/subscription", { headers }))
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => !cancelled && setBilling(data))
      .catch(() => !cancelled && setBilling(null));

    return () => {
      cancelled = true;
    };
  }, [subscriptionId, canceledAt]);

  if (loading || !profile) return <Loading />;

  const p = { ...profile, ...patch };

  const legacyUntil = p.legacy_plan_until
    ? new Date(`${p.legacy_plan_until}T00:00:00`).toLocaleDateString("pt-BR")
    : null;
  const accessUntil = p.plan_until ? brDate(p.plan_until) : null;

  const cancelSubscription = async () => {
    const ok = await confirm("Cancelar a assinatura? Você continua com o plano até o fim do período já pago.");
    if (!ok) return;

    setCanceling(true);
    try {
      const res = await fetch("/api/validapay/cancel", { method: "POST", headers: await authHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      updateCachedProfile(data);
      setPatch((prev) => ({ ...prev, ...data }));
      alert("Assinatura cancelada.");
    } catch (err) {
      alert(err.message || "Não foi possível cancelar. Tente novamente.");
    } finally {
      setCanceling(false);
    }
  };

  const restoreSubscription = async () => {
    setRestoring(true);
    try {
      const res = await fetch("/api/validapay/reactivate", { method: "POST", headers: await authHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      updateCachedProfile(data);
      setPatch((prev) => ({ ...prev, ...data }));
      alert("Assinatura restaurada! As cobranças seguem normalmente.");
    } catch (err) {
      alert(err.message || "Não foi possível restaurar. Tente novamente.");
    } finally {
      setRestoring(false);
    }
  };

  return (
    <div className="p-2">
      <div className="flex items-center mb-4 gap-2">
        <div onClick={() => setSelectedTab("account")}>
          <FaChevronLeft className="cursor-pointer" />
        </div>
        <h2 className="xs:font-semibold">Detalhes do Plano</h2>
      </div>

      {legacyUntil && ["plus", "pro"].includes(p.role) && (
        <div className="p-4 mb-4 border border-amber-500/30 bg-amber-500/10 rounded max-w-[1024px] flex flex-col gap-2">
          <p className="font-semibold">Aviso importante sobre sua assinatura</p>
          <p>
            Trocamos o sistema de pagamentos do Bite Menu. Por isso, sua assinatura antiga será encerrada em{" "}
            <strong>{legacyUntil}</strong>, e nenhuma nova cobrança será feita nela.
          </p>
          <p>
            Até lá, seu plano <span className="capitalize font-semibold">{p.role}</span> continua funcionando
            normalmente. Para não voltar ao plano Free, assine novamente pelo novo sistema de pagamentos.
          </p>
          <a href="/dashboard/pricing" className="cta-button small self-start mt-1">
            Assinar novamente
          </a>
        </div>
      )}

      {p.validapay_subscription_id && p.cancel_at_period_end && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 mb-4 rounded-2xl border-2 border-red-500/30 bg-red-500/10 max-w-[1024px]">
          <p>
            Assinatura cancelada. Você mantém acesso ao plano <span className="capitalize">{p.role}</span>
            {accessUntil ? ` até ${accessUntil}` : " até o fim do período já pago"}. Depois disso seu plano volta pra
            Free.
          </p>
          <button
            onClick={restoreSubscription}
            disabled={restoring}
            className="cursor-pointer underline shrink-0 disabled:opacity-50"
            type="button"
          >
            {restoring ? "Restaurando..." : "Restaurar assinatura"}
          </button>
        </div>
      )}

      <div className="flex flex-col justify-center p-4 bg-translucid border-2 border-[var(--translucid)] rounded-2xl text-center w-full max-w-[1024px]">
        <p className="text-sm color-gray">Plano atual:</p>
        <p className="capitalize default-h1 mb-2">{p.role}</p>

        {p.role !== "pro" && p.role !== "admin" && !p.validapay_subscription_id && (
          <div className="flex flex-col items-center">
            <a href="/dashboard/pricing" className="cta-button has-icon small mt-2">
              <FaBolt /> Melhorar plano!
            </a>
          </div>
        )}

        {p.role === "free" && (
          <p className="text-sm color-gray mt-4">
            Acabou de assinar? A liberação do plano leva alguns minutos (boleto: até 3 dias úteis).{" "}
            <button onClick={() => window.location.reload()} className="underline cursor-pointer" type="button">
              Atualizar
            </button>
          </p>
        )}
      </div>

      {p.validapay_subscription_id && (
        <BillingCard
          billing={billing}
          canCancel={!p.cancel_at_period_end}
          canceling={canceling}
          onCancel={cancelSubscription}
        />
      )}
    </div>
  );
}
