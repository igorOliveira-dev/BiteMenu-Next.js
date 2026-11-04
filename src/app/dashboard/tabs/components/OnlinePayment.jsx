"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAlert } from "@/providers/AlertProvider";

// Pagamento online (Pix com split de 5% para o Bite Menu) via subconta ValidaPay.
// Planos Pro e Business. Estados: none (formulário) → pending (análise/documentos) → active.

const INPUT =
  "h-11 w-full rounded-xl border border-[var(--translucid)] bg-translucid px-3 text-[15px] outline-none transition focus:border-brand-select/70";
const BUTTON =
  "inline-flex h-11 cursor-pointer items-center justify-center rounded-xl bg-bite px-4 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50";
const ALLOWED = ["pro", "business", "admin"];

const INCOME = ["Até R$ 5.000", "R$ 5.001 a R$ 10.000", "R$ 10.001 a R$ 30.000", "R$ 30.001 a R$ 100.000", "Acima de R$ 100.000"];
const REVENUE = [
  "Até R$ 81.000 (MEI)",
  "R$ 81.001 a R$ 360.000 (Microempresa)",
  "R$ 360.001 a R$ 4,8 mi (EPP)",
  "R$ 4,8 mi a R$ 78 mi (Média)",
  "Acima de R$ 78 mi (Grande)",
];
const band = (i) => String(i + 1).padStart(2, "0");
const formatBRL = (v) => Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

async function api(method, body) {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const res = await fetch("/api/validapay/subaccount", {
    method,
    headers: { Authorization: `Bearer ${session?.access_token}`, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Erro inesperado");
  return data;
}

// FormData com nomes "owner.address.city" → objeto aninhado
function formToObject(form) {
  const out = {};
  for (const [key, value] of new FormData(form)) {
    const path = key.split(".");
    let node = out;
    path.slice(0, -1).forEach((p) => (node = node[p] ??= {}));
    node[path.at(-1)] = value;
  }
  return out;
}

const Input = ({ label, className = "", ...props }) => (
  <label className={`block space-y-1 text-xs ${className}`}>
    <span className="opacity-70">{label}</span>
    <input required className={INPUT} {...props} />
  </label>
);

const Select = ({ label, options, ...props }) => (
  <label className="block space-y-1 text-xs">
    <span className="opacity-70">{label}</span>
    <select required className={INPUT} {...props}>
      {options.map(([value, text]) => (
        <option key={value} value={value} className="text-black">
          {text}
        </option>
      ))}
    </select>
  </label>
);

function AddressInputs({ prefix }) {
  return (
    <div className="grid gap-2 sm:grid-cols-3">
      <Input label="CEP" name={`${prefix}.postalCode`} inputMode="numeric" />
      <Input label="Rua" name={`${prefix}.street`} className="sm:col-span-2" />
      <Input label="Número" name={`${prefix}.number`} />
      <Input label="Complemento" name={`${prefix}.addressComplement`} required={false} />
      <Input label="Bairro" name={`${prefix}.neighborhood`} />
      <Input label="Cidade" name={`${prefix}.city`} className="sm:col-span-2" />
      <Input label="UF" name={`${prefix}.state`} maxLength={2} />
    </div>
  );
}

export default function OnlinePayment({ role }) {
  const { customAlert } = useAlert();
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);
  const allowed = ALLOWED.includes(role);

  const load = () =>
    api("GET")
      .then(setStatus)
      .catch((err) => setStatus({ stage: "error", error: err.message }));

  useEffect(() => {
    if (allowed) load();
  }, [allowed]);

  const run = async (fn, success) => {
    setBusy(true);
    try {
      await fn();
      if (success) customAlert(success);
      await load();
    } catch (err) {
      customAlert(err.message, "error");
    } finally {
      setBusy(false);
    }
  };

  const wrap = (children) => (
    <div className="space-y-3 rounded-xl border border-[var(--translucid)] p-4">
      <div>
        <div className="text-sm font-semibold">Pix online</div>
        <p className="mt-0.5 text-xs opacity-60">
          O cliente paga pelo cardápio e o pedido chega já pago. Taxa de 5% por pedido pago online.
        </p>
      </div>
      {children}
    </div>
  );

  if (!allowed) {
    return wrap(
      <a href="/dashboard/pricing?plan=pro" className="text-sm font-semibold text-brand-red underline">
        Disponível nos planos Pro e Business
      </a>,
    );
  }
  if (!status) return wrap(<p className="text-xs opacity-60">Carregando...</p>);
  if (status.stage === "error") return wrap(<p className="text-xs text-red-500">{status.error}</p>);

  if (status.stage === "pending") {
    return wrap(
      <div className="space-y-2 text-sm">
        <p>
          Cadastro em análise pela ValidaPay (proposta: {status.proposal ?? "-"}, documentos: {status.documents ?? "-"}).
        </p>
        {status.documentsUrl && (
          <a href={status.documentsUrl} target="_blank" rel="noopener noreferrer" className={BUTTON}>
            Enviar documentos
          </a>
        )}
        <button type="button" onClick={() => run(async () => {})} disabled={busy} className="block text-xs underline">
          Atualizar status
        </button>
      </div>,
    );
  }

  if (status.stage === "active") {
    return wrap(
      <div className="space-y-4">
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={!!status.enabled}
            disabled={busy}
            onChange={(e) => run(() => api("PATCH", { enabled: e.target.checked }))}
          />
          Aceitar Pix online no cardápio
        </label>

        <div className="text-sm">
          Saldo disponível: <strong>{formatBRL(status.balance)}</strong>
        </div>

        <form
          className="grid gap-2 sm:grid-cols-3"
          onSubmit={(e) => {
            e.preventDefault();
            const data = formToObject(e.currentTarget);
            run(() => api("PUT", data), "Saque solicitado! Ele cai na sua conta em instantes.");
          }}
        >
          <Input label="Valor do saque" name="amount" type="number" step="0.01" min="0.01" max={status.balance} />
          <Select
            label="Tipo da chave"
            name="pixKeyType"
            options={[
              ["CNPJ", "CNPJ"],
              ["EMAIL", "E-mail"],
              ["PHONE", "Telefone"],
              ["EVP", "Aleatória"],
              ["CPF", "CPF"],
            ]}
          />
          <Input label="Chave Pix (do mesmo CNPJ)" name="pixKey" />
          <button type="submit" disabled={busy || !(status.balance > 0)} className={`${BUTTON} sm:col-span-3`}>
            Sacar
          </button>
        </form>
      </div>,
    );
  }

  // stage "none": cadastro da subconta (só CNPJ: PJ, MEI ou ME)
  return wrap(
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        const data = formToObject(e.currentTarget);
        data.owner.isPoliticallyExposedPerson = data.owner.isPoliticallyExposedPerson === "true";
        run(() => api("POST", data), "Cadastro enviado! Agora envie os documentos.");
      }}
    >
      <p className="text-xs opacity-60">Precisa de CNPJ (MEI, ME ou empresa). O valor das vendas fica na sua conta e você saca por Pix.</p>

      <div className="text-xs font-semibold uppercase opacity-60">Empresa</div>
      <div className="grid gap-2 sm:grid-cols-2">
        <Input label="CNPJ" name="documentNumber" inputMode="numeric" />
        <Select
          label="Tipo"
          name="companyType"
          options={[
            ["MEI", "MEI"],
            ["ME", "ME"],
            ["PJ", "Outra (LTDA, EPP...)"],
          ]}
        />
        <Input label="Razão social" name="businessName" />
        <Input label="Nome fantasia" name="tradingName" />
        <Input label="E-mail da empresa" name="businessEmail" type="email" />
        <Input label="Telefone da empresa" name="contactNumber" type="tel" />
        <Select label="Faturamento anual" name="revenueBand" options={REVENUE.map((t, i) => [band(i), t])} />
      </div>
      <AddressInputs prefix="businessAddress" />

      <div className="text-xs font-semibold uppercase opacity-60">Sócio responsável</div>
      <div className="grid gap-2 sm:grid-cols-2">
        <Input label="Nome completo" name="owner.fullName" />
        <Input label="CPF" name="owner.documentNumber" inputMode="numeric" />
        <Input label="Nome da mãe" name="owner.motherName" />
        <Input label="Data de nascimento" name="owner.birthDate" type="date" />
        <Input label="Celular" name="owner.phoneNumber" type="tel" />
        <Input label="E-mail" name="owner.email" type="email" />
        <Select label="Renda do sócio" name="owner.incomeBand" options={INCOME.map((t, i) => [band(i), t])} />
        <Select
          label="Pessoa politicamente exposta?"
          name="owner.isPoliticallyExposedPerson"
          options={[
            ["false", "Não"],
            ["true", "Sim"],
          ]}
        />
      </div>
      <AddressInputs prefix="owner.address" />

      <button type="submit" disabled={busy} className={BUTTON}>
        {busy ? "Enviando..." : "Ativar pagamento online"}
      </button>
    </form>,
  );
}
