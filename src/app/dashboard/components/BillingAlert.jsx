"use client";

import { useEffect, useState } from "react";
import { FaExclamationTriangle, FaBarcode } from "react-icons/fa";
import useUser from "@/hooks/useUser";
import { supabase } from "@/lib/supabaseClient";
import { brDate } from "@/lib/brDate";

const formatDate = (iso) => brDate(iso);
const formatBRL = (value) =>
  Number(value ?? 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

// Aviso no topo do dashboard: boleto em aberto ou cobrança da assinatura vencida.
export default function BillingAlert({ setSelectedTab }) {
  const { profile } = useUser();
  const [alert, setAlert] = useState(null);
  const subscriptionId = profile?.validapay_subscription_id;

  useEffect(() => {
    if (!subscriptionId) return;
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
  }, [subscriptionId]);

  if (!alert) return null;

  const plan = <span className="capitalize font-semibold">{profile.role}</span>;
  const deadline = alert.payUntil ? (
    <>
      {" "}
      Se não for pago até <strong>{formatDate(alert.payUntil)}</strong>, sua conta volta para o plano Free.
    </>
  ) : null;

  let message;
  if (!alert.overdue) {
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
      className={`m-2 mb-0 p-3 sm:p-4 rounded-2xl border-2 flex flex-wrap items-center gap-3 text-sm ${
        alert.overdue ? "border-red-500/30 bg-red-500/10" : "border-amber-500/40 bg-amber-500/10"
      }`}
    >
      <span className={`shrink-0 text-lg ${alert.overdue ? "text-red-500" : "text-amber-500"}`}>
        {alert.overdue ? <FaExclamationTriangle /> : <FaBarcode />}
      </span>
      <p className="flex-1 min-w-[200px]">{message}</p>

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
