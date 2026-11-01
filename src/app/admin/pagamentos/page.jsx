"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Loading from "@/components/Loading";
import Return from "@/components/Return";
import SearchSelect from "@/components/SearchSelect";
import { ACQUISITION_SOURCE_LABELS } from "@/lib/acquisitionSourceOptions";

const PAYMENT_LABELS = { PIX_AUTOMATICO: "Pix Automático", PIX: "Pix", CREDIT_CARD: "Cartão", BOLETO: "Boleto" };

const formatBRL = (value) =>
  value != null ? Number(value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "-";

const sourceLabel = (src) => (src ? ACQUISITION_SOURCE_LABELS[src] || src : "Sem origem");

export default function AdminPagamentosPage() {
  const [payments, setPayments] = useState(null);
  const [error, setError] = useState(null);
  const [source, setSource] = useState("");

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data }) =>
        fetch("/api/validapay/admin-payments", {
          headers: { Authorization: `Bearer ${data.session?.access_token}` },
        }),
      )
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) throw new Error(body.error || "Erro ao carregar");
        setPayments(body.payments);
      })
      .catch((err) => setError(err.message));
  }, []);

  if (error) {
    return (
      <p className="p-6 text-center text-sm text-red-500">
        {error}
      </p>
    );
  }
  if (!payments) return <Loading />;

  const sources = [...new Set(payments.map((p) => p.source).filter(Boolean))].sort();
  const visible = source ? payments.filter((p) => (p.source || "none") === source) : payments;
  const total = visible.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-2">
        <Return />
        <div>
          <h1 className="text-xl font-bold">Pagamentos ValidaPay</h1>
          <p className="text-sm" style={{ color: "var(--gray)" }}>
            {visible.length} {visible.length === 1 ? "pagamento" : "pagamentos"} · {formatBRL(total)}
          </p>
        </div>
      </div>

      {payments.length === 0 ? (
        <p className="text-sm" style={{ color: "var(--gray)" }}>
          Nenhum pagamento ainda.
        </p>
      ) : (
        <>
          <SearchSelect
            value={source}
            onChange={setSource}
            options={[
              { value: "", label: "Todas as origens (utm_source)" },
              { value: "none", label: "Sem origem" },
              ...sources.map((src) => ({ value: src, label: sourceLabel(src) })),
            ]}
          />

          <ul className="space-y-2">
            {visible.map((p, i) => (
              <li
                key={`${p.subscriptionId}-${p.paidAt}-${i}`}
                className="p-4 rounded-2xl bg-translucid border-2 border-[var(--translucid)] text-sm"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold">{p.name || p.email || "Cliente não encontrado"}</span>
                  {p.plan && (
                    <span className="text-xs font-mono">
                      ({p.plan}
                      {p.cycle === "yearly" ? " anual" : ""})
                    </span>
                  )}
                  <span className="ml-auto font-semibold">{formatBRL(p.amount)}</span>
                </div>
                <div className="flex flex-wrap gap-x-3 text-xs mt-1" style={{ color: "var(--gray)" }}>
                  {p.email && <span>{p.email}</span>}
                  <span>{sourceLabel(p.source)}</span>
                  <span>{PAYMENT_LABELS[p.paymentType] || p.paymentType || "-"}</span>
                  <span className="ml-auto font-mono">{new Date(p.paidAt).toLocaleString("pt-BR")}</span>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
