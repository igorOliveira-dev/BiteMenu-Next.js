"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { supabase } from "@/lib/supabaseClient";
import { useAlert } from "@/providers/AlertProvider";

// Pagamento online (Pix com split de 5% para o Bite Menu) via subconta ValidaPay.
// Planos Pro e Business. Estados: none (formulário) → pending (análise/documentos) → active.

const INPUT =
  "h-11 w-full rounded-xl border border-[var(--translucid)] bg-translucid px-3 text-[15px] outline-none transition focus:border-brand-select/70";
const BUTTON =
  "inline-flex h-11 cursor-pointer items-center justify-center rounded-xl bg-bite px-4 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50";
const ALLOWED = ["admin"]; // em teste: só admin (ver ONLINE_PAYMENT_ROLES)

const INCOME = [
  "Até R$ 5.000",
  "R$ 5.001 a R$ 10.000",
  "R$ 10.001 a R$ 30.000",
  "R$ 30.001 a R$ 100.000",
  "Acima de R$ 100.000",
];
const REVENUE = [
  "Até R$ 81.000 (MEI)",
  "R$ 81.001 a R$ 360.000 (Microempresa)",
  "R$ 360.001 a R$ 4,8 mi (EPP)",
  "R$ 4,8 mi a R$ 78 mi (Média)",
  "Acima de R$ 78 mi (Grande)",
];
const band = (i) => String(i + 1).padStart(2, "0");
const formatBRL = (v) =>
  Number(v || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

async function api(method, body, query = "") {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const res = await fetch(`/api/validapay/subaccount${query}`, {
    method,
    headers: {
      Authorization: `Bearer ${session?.access_token}`,
      "Content-Type": "application/json",
    },
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

// Máscara por padrão: cada "#" recebe um dígito, o resto é fixo
const pattern = (p) => (v) => {
  const d = v.replace(/\D/g, "");
  let i = 0;
  let out = "";
  for (const c of p) {
    if (i >= d.length) break;
    out += c === "#" ? d[i++] : c;
  }
  return out;
};

// [formatar, regex de valor completo (validação nativa do navegador), dica]
const MASKS = {
  cnpj: [pattern("##.###.###/####-##"), "\\d{2}\\.\\d{3}\\.\\d{3}/\\d{4}-\\d{2}", "00.000.000/0000-00"],
  cpf: [pattern("###.###.###-##"), "\\d{3}\\.\\d{3}\\.\\d{3}-\\d{2}", "000.000.000-00"],
  phone: [
    (v) => pattern(v.replace(/\D/g, "").length > 10 ? "(##) #####-####" : "(##) ####-####")(v),
    "\\(\\d{2}\\) \\d{4,5}-\\d{4}",
    "(00) 00000-0000",
  ],
  cep: [pattern("#####-###"), "\\d{5}-\\d{3}", "00000-000"],
  uf: [
    (v) =>
      v
        .replace(/[^a-z]/gi, "")
        .slice(0, 2)
        .toUpperCase(),
    "[A-Z]{2}",
    "SP",
  ],
};

const Input = ({ label, className = "", mask, onInput, ...props }) => {
  const [format, regex, hint] = MASKS[mask] ?? [];
  return (
    <label className={`block space-y-1 text-xs ${className}`}>
      <span className="opacity-70">{label}</span>
      <input
        required
        className={INPUT}
        {...(mask && {
          pattern: regex,
          placeholder: hint,
          title: `Formato: ${hint}`,
          inputMode: mask === "uf" ? "text" : "numeric",
          maxLength: hint.length,
        })}
        {...props}
        onInput={(e) => {
          if (format) e.target.value = format(e.target.value);
          onInput?.(e);
        }}
      />
    </label>
  );
};

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
      <Input
        label="CEP (preenche o endereço)"
        name={`${prefix}.postalCode`}
        mask="cep"
        onInput={async (e) => {
          const cep = e.target.value.replace(/\D/g, "");
          if (cep.length !== 8) return;
          const fields = e.target.form.elements;
          const data = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
            .then((r) => r.json())
            .catch(() => null);
          if (!data || data.erro) return;
          const fill = { street: data.logradouro, neighborhood: data.bairro, city: data.localidade, state: data.uf };
          for (const [key, value] of Object.entries(fill)) {
            if (value) fields.namedItem(`${prefix}.${key}`).value = value;
          }
        }}
      />
      <Input label="Rua" name={`${prefix}.street`} className="sm:col-span-2" />
      <Input label="Número" name={`${prefix}.number`} />
      <Input label="Complemento" name={`${prefix}.addressComplement`} required={false} />
      <Input label="Bairro" name={`${prefix}.neighborhood`} />
      <Input label="Cidade" name={`${prefix}.city`} className="sm:col-span-2" />
      <Input label="UF" name={`${prefix}.state`} mask="uf" />
    </div>
  );
}

const formatDate = (iso) =>
  iso ? new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }) : "-";
const formatDoc = (d = "") => (d.length === 14 ? MASKS.cnpj[0](d) : d.length === 11 ? MASKS.cpf[0](d) : d);
const WITHDRAWAL_STATUS = { PROCESSING: "Processando", CONFIRMED: "Concluído", ERROR: "Falhou" };
const PIX_KEY_TYPES = [
  ["CNPJ", "CNPJ"],
  ["EMAIL", "E-mail"],
  ["PHONE", "Telefone"],
  ["EVP", "Aleatória"],
  ["CPF", "CPF"],
];

// Tela cheia por cima do painel (cadastro e "Minha conta de recebimentos")
function FullScreen({ title, onClose, children }) {
  return createPortal(
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[var(--background)]">
      <div className="mx-auto max-w-2xl px-4 py-6">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-lg font-bold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-xl border border-[var(--translucid)] px-3 py-2 text-sm font-semibold"
          >
            Voltar
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}

const Row = ({ left, sub, right, rightSub, rightClass = "" }) => (
  <div className="flex justify-between gap-2 border-b border-[var(--translucid)] py-2">
    <div>
      <div>{left}</div>
      <div className="text-xs opacity-60">{sub}</div>
    </div>
    <div className="text-right">
      <div className={rightClass}>{right}</div>
      {rightSub && <div className="text-xs opacity-60">{rightSub}</div>}
    </div>
  </div>
);

function AccountDetails({ details, busy, onWithdraw }) {
  if (!details.account) return <p className="text-sm opacity-60">Carregando...</p>;
  const { account } = details;

  return (
    <div className="space-y-6 text-sm">
      <section className="grid gap-1 rounded-xl border border-[var(--translucid)] p-4">
        <div className="text-xs font-semibold uppercase opacity-60">Conta</div>
        <strong>{account.name ?? "-"}</strong>
        <div>CNPJ: {formatDoc(account.documentNumber ?? "")}</div>
        <div>Número da conta: {account.number}</div>
        <div>Situação: {account.status === "CONFIRMED" ? "Ativa" : (account.status ?? "-")}</div>
        <div>Criada em: {formatDate(account.createdAt)}</div>
        {account.dailyWithdrawalLimit != null && (
          <div>Limite de saque por dia: {formatBRL(account.dailyWithdrawalLimit)}</div>
        )}
        <div>Pix online no cardápio: {details.enabled ? "ligado" : "desligado"}</div>
        <div className="mt-2 text-base">
          Saldo disponível: <strong>{formatBRL(details.balance)}</strong>
        </div>
      </section>

      <section className="space-y-2">
        <div className="text-xs font-semibold uppercase opacity-60">Sacar</div>
        <form
          className="grid gap-2 sm:grid-cols-3"
          onSubmit={(e) => {
            e.preventDefault();
            onWithdraw(formToObject(e.currentTarget));
          }}
        >
          <Input label="Valor" name="amount" type="number" step="0.01" min="0.01" max={details.balance} />
          <Select label="Tipo da chave" name="pixKeyType" options={PIX_KEY_TYPES} />
          <Input label="Chave Pix (do mesmo CNPJ)" name="pixKey" />
          <button type="submit" disabled={busy || !(details.balance > 0)} className={`${BUTTON} sm:col-span-3`}>
            Sacar
          </button>
        </form>
      </section>

      <section className="space-y-2">
        <div className="text-xs font-semibold uppercase opacity-60">Saques</div>
        {details.withdrawals.length === 0 ? (
          <p className="opacity-60">Nenhum saque ainda.</p>
        ) : (
          details.withdrawals.map((w) => (
            <Row
              key={w.id}
              left={formatBRL(w.amount)}
              sub={`${formatDate(w.createdAt)} · ${w.pixKey ?? ""}${w.fee ? ` · tarifa ${formatBRL(w.fee)}` : ""}`}
              right={WITHDRAWAL_STATUS[w.status] ?? w.status}
              rightClass="text-xs font-semibold"
            />
          ))
        )}
      </section>

      <section className="space-y-2">
        <div className="text-xs font-semibold uppercase opacity-60">Extrato (últimas 50 movimentações)</div>
        {details.transactions.length === 0 ? (
          <p className="opacity-60">Nenhuma movimentação ainda.</p>
        ) : (
          details.transactions.map((t) => (
            <Row
              key={t.id}
              left={t.title}
              sub={formatDate(t.createdAt)}
              right={`${t.type === "DEBIT" ? "-" : "+"}${formatBRL(t.amount)}`}
              rightClass={t.type === "DEBIT" ? "text-red-500" : "text-green-600"}
              rightSub={t.balanceAfter != null ? `saldo ${formatBRL(t.balanceAfter)}` : null}
            />
          ))
        )}
      </section>
    </div>
  );
}

export default function OnlinePayment({ role }) {
  const customAlert = useAlert();
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [details, setDetails] = useState(null); // tela "Minha conta": null fechada, {} carregando
  const allowed = ALLOWED.includes(role);

  const load = () =>
    api("GET")
      .then(setStatus)
      .catch((err) => setStatus({ stage: "error", error: err.message }));

  const openDetails = () => {
    setDetails((d) => d ?? {});
    return api("GET", undefined, "?details=1")
      .then(setDetails)
      .catch((err) => {
        setDetails(null);
        customAlert(err.message, "error");
      });
  };

  useEffect(() => {
    if (allowed) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allowed]);

  const run = async (fn, success) => {
    setBusy(true);
    try {
      await fn();
      if (success) customAlert(success);
      await load();
      if (details) await openDetails();
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

  if (!allowed) return null; // fora do admin não aparece nada enquanto está em teste
  if (!status) return wrap(<p className="text-xs opacity-60">Carregando...</p>);

  if (status.stage === "error") {
    return wrap(
      <div className="space-y-2">
        <p className="text-xs text-red-500">Não foi possível carregar o pagamento online: {status.error}</p>
        <button
          type="button"
          onClick={() => {
            setStatus(null);
            load();
          }}
          className={BUTTON}
        >
          Tentar novamente
        </button>
      </div>,
    );
  }

  if (status.stage === "pending") {
    return wrap(
      <div className="space-y-2 text-sm">
        <p>
          Cadastro em análise pela ValidaPay (proposta: {status.proposal ?? "-"}, documentos: {status.documents ?? "-"}
          ).
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
      <div className="space-y-3">
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

        <button type="button" onClick={openDetails} className={BUTTON}>
          Minha conta de recebimentos
        </button>

        {details && (
          <FullScreen title="Minha conta de recebimentos" onClose={() => setDetails(null)}>
            <AccountDetails
              details={details}
              busy={busy}
              onWithdraw={(data) => run(() => api("PUT", data), "Saque solicitado! Ele cai na sua conta em instantes.")}
            />
          </FullScreen>
        )}
      </div>,
    );
  }

  // stage "none": botão; o formulário (grande) abre em tela cheia por cima do painel
  if (!showForm) {
    return wrap(
      <button type="button" onClick={() => setShowForm(true)} className={BUTTON}>
        Cadastrar pagamento online
      </button>,
    );
  }

  return (
    <FullScreen title="Cadastro do pagamento online" onClose={() => setShowForm(false)}>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          const data = formToObject(e.currentTarget);
          data.owner.isPoliticallyExposedPerson = data.owner.isPoliticallyExposedPerson === "true";
          run(() => api("POST", data), "Cadastro enviado! Agora envie os documentos.");
        }}
      >
        <p className="text-xs opacity-60">
          Precisa de CNPJ (MEI, ME ou empresa). O valor das vendas fica na sua conta e você saca por Pix.
        </p>

        <div className="text-xs font-semibold uppercase opacity-60">Empresa</div>
        <div className="grid gap-2 sm:grid-cols-2">
          <Input label="CNPJ" name="documentNumber" mask="cnpj" />
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
          <Input label="Telefone da empresa" name="contactNumber" type="tel" mask="phone" />
          <Select label="Faturamento anual" name="revenueBand" options={REVENUE.map((t, i) => [band(i), t])} />
        </div>
        <AddressInputs prefix="businessAddress" />

        <div className="text-xs font-semibold uppercase opacity-60">Sócio responsável</div>
        <div className="grid gap-2 sm:grid-cols-2">
          <Input label="Nome completo" name="owner.fullName" />
          <Input label="CPF" name="owner.documentNumber" mask="cpf" />
          <Input label="Nome da mãe" name="owner.motherName" />
          <Input label="Data de nascimento" name="owner.birthDate" type="date" />
          <Input label="Celular" name="owner.phoneNumber" type="tel" mask="phone" />
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
      </form>
    </FullScreen>
  );
}
