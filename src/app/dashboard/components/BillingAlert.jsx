"use client";

import { useEffect, useState } from "react";
import { FaExclamationTriangle, FaBarcode } from "react-icons/fa";
import useUser from "@/hooks/useUser";
import { supabase } from "@/lib/supabaseClient";
import { brDate } from "@/lib/brDate";
import { useConfirm } from "@/providers/ConfirmProvider";
import { useAlert } from "@/providers/AlertProvider";

const formatDate = (iso) => brDate(iso);
const formatBRL = (value) =>
  Number(value ?? 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

// Aviso de boleto em aberto ou cobrança da assinatura vencida (espaço de banners do cardápio e Detalhes do Plano).
export default function BillingAlert({ setSelectedTab, className = "" }) {
  const { profile } = useUser();
  const [alert, setAlert] = useState(null);
  const [cancelingBoleto, setCancelingBoleto] = useState(false);
  const confirm = useConfirm();
  const showAlert = useAlert();
  const profileId = profile?.id;
  const subscriptionId = profile?.validapay_subscription_id;

  // Sem assinatura no profile também consulta: a primeira compra no boleto só entra no profile
  // quando compensa, e até lá o aviso mostra o boleto em aberto
  useEffect(() => {
    if (!profileId) return;
    let cancelled = false;

    supabase.auth
      .getSession()
      .then(({ data: { session } }) =>
        fetch("/api/validapay/subscription", {
          headers: { Authorization: `Bearer ${session?.access_token}` },
        }),
      )
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => !cancelled && setAlert(data?.alert ?? null))
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [profileId, subscriptionId]);

  if (!alert) return null;

  // Primeira compra no boleto: cancela pra poder assinar de novo com outra forma de pagamento
  const cancelBoleto = async () => {
    const ok = await confirm("Cancelar este boleto? Depois você pode assinar de novo escolhendo outra forma de pagamento.");
    if (!ok) return;

    setCancelingBoleto(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const res = await fetch("/api/validapay/cancel-boleto", {
        method: "POST",
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      window.location.href = "/dashboard/pricing";
    } catch (err) {
      showAlert(err.message || "Não foi possível cancelar o boleto. Tente novamente.");
      setCancelingBoleto(false);
    }
  };

  const plan = <span className="capitalize font-semibold">{alert.plan ?? profile.role}</span>;
  const deadline = alert.payUntil ? (
    <>
      {" "}
      Se não for pago até <strong>{formatDate(alert.payUntil)}</strong>, sua conta volta para o plano Free.
    </>
  ) : null;

  let message;
  if (alert.pending) {
    // Primeira compra: ainda não há plano pago pra perder, então sem o aviso de voltar pro Free
    message = (
      <>
        Seu boleto de <strong>{formatBRL(alert.amount)}</strong> do plano {plan} {alert.overdue ? "venceu" : "vence"} em{" "}
        <strong>{formatDate(alert.dueDate)}</strong>. Depois de pago, o plano é liberado em até 3 dias úteis.
      </>
    );
  } else if (!alert.overdue) {
    message = (
      <>
        Seu boleto de <strong>{formatBRL(alert.amount)}</strong> do plano {plan} vence em{" "}
        <strong>{formatDate(alert.dueDate)}</strong>.
      </>
    );
  } else if (alert.paymentType === "BOLETO") {
    message = (
      <>
        Seu boleto de <strong>{formatBRL(alert.amount)}</strong> venceu em <strong>{formatDate(alert.dueDate)}</strong>.
        {deadline}
      </>
    );
  } else {
    const how = alert.paymentType === "CREDIT_CARD" ? "no seu cartão" : "pelo Pix Automático";
    message = (
      <>
        Não conseguimos cobrar <strong>{formatBRL(alert.amount)}</strong> {how}. Vamos tentar de novo automaticamente;
        confira se há saldo ou limite disponível.{deadline}
      </>
    );
  }

  return (
    <div
      className={`${className} p-3 sm:p-4 rounded-2xl border-2 flex flex-wrap items-center gap-3 text-sm ${
        alert.overdue ? "border-red-500/30 bg-red-500/10" : "border-amber-500/40 bg-amber-500/10"
      }`}
    >
      <span className={`shrink-0 text-lg ${alert.overdue ? "text-red-500" : "text-amber-500"}`}>
        {alert.overdue ? <FaExclamationTriangle /> : <FaBarcode />}
      </span>
      <p className="flex-1 min-w-[200px]">{message}</p>

      {alert.pending && alert.boletoUrl && (
        <button
          onClick={cancelBoleto}
          disabled={cancelingBoleto}
          className="shrink-0 underline cursor-pointer disabled:opacity-50"
          type="button"
        >
          {cancelingBoleto ? "Cancelando..." : "Cancelar boleto"}
        </button>
      )}
      {alert.boletoUrl ? (
        <a href={alert.boletoUrl} target="_blank" rel="noopener noreferrer" className="cta-button small shrink-0">
          {alert.overdue ? "Pagar boleto" : "Abrir boleto"}
        </a>
      ) : (
        <button onClick={() => setSelectedTab("planDetails")} className="cta-button small shrink-0" type="button">
          Ver assinatura
        </button>
      )}
    </div>
  );
}
