"use client";

import { useEffect, useRef, useState } from "react";
import { FaCalendarAlt, FaPen, FaTrash } from "react-icons/fa";
import GenericModal from "@/components/GenericModal";
import { supabase } from "@/lib/supabaseClient";
import { formatCurrency, getCurrencySymbol } from "@/lib/formatCurrency";
import { useAlert } from "@/providers/AlertProvider";
import { useConfirm } from "@/providers/ConfirmProvider";

const num = (v) => parseFloat(String(v ?? "").replace(",", "."));

// Datas em dd/mm/aaaa (o input nativo segue o idioma do navegador, então usamos texto com máscara)
const toBR = (iso) => new Date(iso).toLocaleDateString("pt-BR");

const maskDate = (v) =>
  v
    .replace(/\D/g, "")
    .slice(0, 8)
    .replace(/^(\d{2})(\d)/, "$1/$2")
    .replace(/^(\d{2}\/\d{2})(\d)/, "$1/$2");

// "dd/mm/aaaa" -> Date (início do dia, ou 23:59:59 no fim); null se a data não existir
const parseBR = (s, endOfDay) => {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(s);
  if (!m) return null;
  const [, dd, mm, yyyy] = m.map(Number);
  const d = endOfDay ? new Date(yyyy, mm - 1, dd, 23, 59, 59) : new Date(yyyy, mm - 1, dd);
  return d.getMonth() === mm - 1 && d.getDate() === dd ? d : null;
};

const emptyDraft = () => ({
  code: "",
  type: "percentage",
  discount_percent: "",
  discount_amount: "",
  max_discount: "",
  min_order: "",
  starts_at: toBR(new Date()),
  ends_at: "",
  max_uses: "",
});

const inputClass = "input w-full rounded bg-translucid p-2 text-sm";

// Campo dd/mm/aaaa: dá para digitar (com máscara) ou escolher no calendário nativo
function DateField({ value, onChange }) {
  const pickerRef = useRef(null);
  const parsed = parseBR(value, false);
  const iso = parsed
    ? `${value.slice(6, 10)}-${value.slice(3, 5)}-${value.slice(0, 2)}`
    : "";

  const openPicker = () => {
    const el = pickerRef.current;
    if (!el) return;
    if (el.showPicker) el.showPicker();
    else el.click();
  };

  return (
    <div className="relative">
      <input
        className={`${inputClass} pr-9`}
        inputMode="numeric"
        maxLength={10}
        placeholder="dd/mm/aaaa"
        value={value}
        onChange={(e) => onChange(maskDate(e.target.value))}
      />
      <button
        type="button"
        onClick={openPicker}
        aria-label="Escolher data no calendário"
        className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer opacity-70 hover:opacity-100"
      >
        <FaCalendarAlt size={14} />
      </button>
      <input
        ref={pickerRef}
        type="date"
        tabIndex={-1}
        aria-hidden="true"
        value={iso}
        onChange={(e) => {
          const [y, m, d] = e.target.value.split("-");
          if (y && m && d) onChange(`${d}/${m}/${y}`);
        }}
        className="pointer-events-none absolute bottom-0 right-0 h-0 w-0 opacity-0"
      />
    </div>
  );
}

// Campo de valor com o símbolo da moeda do cardápio
function MoneyField({ symbol, ...props }) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-sm color-gray">
        {symbol}
      </span>
      <input
        className={inputClass}
        inputMode="decimal"
        style={{ paddingLeft: `${symbol.length * 0.55 + 1.25}rem` }}
        {...props}
      />
    </div>
  );
}

export default function CouponsModal({ menuId, currency, canCreate, onClose }) {
  const alert = useAlert();
  const symbol = getCurrencySymbol(currency);
  const confirm = useConfirm();
  const [coupons, setCoupons] = useState(null);
  const [draft, setDraft] = useState(null);

  useEffect(() => {
    if (!menuId || !canCreate) return;
    supabase
      .from("coupons")
      .select("*")
      .eq("menu_id", menuId)
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) console.error("fetch coupons error:", error);
        setCoupons(data || []);
      });
  }, [menuId, canCreate]);

  const describe = (c) => {
    const main =
      c.type === "free_shipping"
        ? "Frete grátis"
        : c.type === "fixed"
          ? `${formatCurrency(c.discount_amount, currency)} de desconto`
          : `${c.discount_percent}% de desconto${c.max_discount ? ` (até ${formatCurrency(c.max_discount, currency)})` : ""}`;
    const min = Number(c.min_order) > 0 ? ` · mín. ${formatCurrency(c.min_order, currency)}` : "";
    return main + min;
  };

  const status = (c) => {
    const now = Date.now();
    if (now < new Date(c.starts_at)) return "Agendado";
    if (c.ends_at && now > new Date(c.ends_at)) return "Expirado";
    if (c.max_uses && c.uses >= c.max_uses) return "Esgotado";
    return "Ativo";
  };

  const openForm = (c = null) =>
    setDraft(
      c
        ? {
            ...c,
            discount_percent: c.discount_percent ?? "",
            discount_amount: c.discount_amount ?? "",
            max_discount: c.max_discount ?? "",
            min_order: Number(c.min_order) > 0 ? String(c.min_order) : "",
            starts_at: toBR(c.starts_at),
            ends_at: c.ends_at ? toBR(c.ends_at) : "",
            max_uses: c.max_uses ?? "",
          }
        : emptyDraft(),
    );

  const save = async () => {
    const code = draft.code.trim().toUpperCase();
    if (!/^[A-Z0-9_-]{3,20}$/.test(code)) return alert("Código: de 3 a 20 letras ou números, sem espaços.", "error");

    const pct = num(draft.discount_percent);
    const amount = num(draft.discount_amount);
    if (draft.type === "percentage" && !(pct > 0 && pct <= 100)) {
      return alert("Informe uma porcentagem entre 1 e 100.", "error");
    }
    if (draft.type === "fixed" && !(amount > 0)) {
      return alert("Informe o valor do desconto.", "error");
    }

    // data de fim e limite de usos são opcionais (podem ser usados juntos)
    const starts = parseBR(draft.starts_at, false);
    const ends = draft.ends_at ? parseBR(draft.ends_at, true) : null;
    if (!starts || (draft.ends_at && !ends)) return alert("Informe as datas no formato dd/mm/aaaa.", "error");
    if (ends && ends <= starts) return alert("O fim precisa ser depois do início.", "error");

    const maxUses = String(draft.max_uses).trim() === "" ? null : Number(draft.max_uses);
    if (maxUses !== null && !(Number.isInteger(maxUses) && maxUses > 0)) {
      return alert("Limite de usos: informe um número inteiro maior que zero.", "error");
    }

    const isPct = draft.type === "percentage";
    const payload = {
      menu_id: menuId,
      code,
      type: draft.type,
      discount_percent: isPct ? pct : null,
      discount_amount: draft.type === "fixed" ? amount : null,
      max_discount: isPct && num(draft.max_discount) > 0 ? num(draft.max_discount) : null,
      min_order: num(draft.min_order) > 0 ? num(draft.min_order) : 0,
      starts_at: starts.toISOString(),
      ends_at: ends ? ends.toISOString() : null,
      max_uses: maxUses,
    };

    const query = draft.id
      ? supabase.from("coupons").update(payload).eq("id", draft.id)
      : supabase.from("coupons").insert(payload);
    const { data, error } = await query.select().single();

    if (error) {
      return alert(error.code === "23505" ? "Já existe um cupom com esse código." : "Erro ao salvar cupom.", "error");
    }

    setCoupons((prev) => (draft.id ? prev.map((c) => (c.id === data.id ? data : c)) : [data, ...(prev || [])]));
    setDraft(null);
    alert("Cupom salvo", "success");
  };

  const remove = async (id) => {
    const ok = await confirm("Remover este cupom?");
    if (!ok) return;
    const { error } = await supabase.from("coupons").delete().eq("id", id);
    if (error) return alert("Erro ao remover cupom", "error");
    setCoupons((prev) => prev.filter((c) => c.id !== id));
    alert("Cupom removido", "success");
  };

  const set = (field) => (e) => setDraft((d) => ({ ...d, [field]: e.target.value }));

  return (
    <GenericModal
      wfull
      maxWidth={"420px"}
      py={"24px"}
      title={draft ? (draft.id ? "Editar cupom" : "Novo cupom") : "Cupons"}
      onClose={draft ? () => setDraft(null) : onClose}
    >
      {!canCreate ? (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/20 p-4 text-sm">
          Criar cupons é uma função exclusiva do Bite Menu Pro. Faça upgrade para criar os seus!
        </div>
      ) : draft ? (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: "percentage", label: "Porcentagem" },
              { value: "fixed", label: "Valor fixo" },
              { value: "free_shipping", label: "Frete grátis" },
            ].map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setDraft((d) => ({ ...d, type: opt.value }))}
                className={`p-2 rounded-lg border-2 border-[var(--translucid)] cursor-pointer text-xs sm:text-sm font-semibold transition ${draft.type === opt.value ? "bg-green-600/80 text-white" : "hover:bg-[var(--translucid)]"}`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <label className="block">
            <div className="text-sm color-gray mb-1">Código do cupom</div>
            <input
              className={`${inputClass} uppercase`}
              value={draft.code}
              onChange={set("code")}
              placeholder="EX: BEMVINDO10"
              maxLength={20}
            />
          </label>

          {draft.type === "percentage" && (
            <div className="grid grid-cols-2 gap-2">
              <label className="block">
                <div className="text-sm color-gray mb-1">Desconto (%)</div>
                <input
                  className={inputClass}
                  inputMode="decimal"
                  value={draft.discount_percent}
                  onChange={set("discount_percent")}
                  placeholder="10"
                />
              </label>
              <label className="block">
                <div className="text-sm color-gray mb-1">Desconto máximo</div>
                <MoneyField
                  symbol={symbol}
                  value={draft.max_discount}
                  onChange={set("max_discount")}
                  placeholder="Sem limite"
                />
              </label>
            </div>
          )}

          {draft.type === "fixed" && (
            <label className="block">
              <div className="text-sm color-gray mb-1">Valor do desconto</div>
              <MoneyField
                symbol={symbol}
                value={draft.discount_amount}
                onChange={set("discount_amount")}
                placeholder="10,00"
              />
            </label>
          )}

          <label className="block">
            <div className="text-sm color-gray mb-1">Valor mínimo do pedido</div>
            <MoneyField
              symbol={symbol}
              value={draft.min_order}
              onChange={set("min_order")}
              placeholder="Sem mínimo"
            />
          </label>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <label className="block">
              <div className="text-sm color-gray mb-1">Início</div>
              <DateField value={draft.starts_at} onChange={(v) => setDraft((d) => ({ ...d, starts_at: v }))} />
            </label>
            <label className="block">
              <div className="text-sm color-gray mb-1">Válido até (opcional)</div>
              <DateField value={draft.ends_at} onChange={(v) => setDraft((d) => ({ ...d, ends_at: v }))} />
            </label>
          </div>

          <label className="block">
            <div className="text-sm color-gray mb-1">Limite de usos (opcional)</div>
            <input
              className={inputClass}
              inputMode="numeric"
              value={draft.max_uses}
              onChange={(e) => setDraft((d) => ({ ...d, max_uses: e.target.value.replace(/\D/g, "") }))}
              placeholder="Sem limite"
            />
          </label>

          <div className="rounded-lg border border-amber-500/20 bg-amber-500/20 p-3 text-xs">
            <strong>Atenção:</strong> o cupom só vale enquanto a sua loja estiver no plano Pro. Se o plano deixar de ser
            Pro antes da data de validade, o cupom fica inválido automaticamente e deixa de funcionar no cardápio.
          </div>

          <div className="grid gap-2 pt-3">
            <button
              type="button"
              onClick={save}
              className="cursor-pointer p-2 bg-green-600/80 text-white font-semibold rounded-lg hover:bg-green-700/80 border-2 border-[var(--translucid)] transition"
            >
              Salvar
            </button>
            <button
              type="button"
              onClick={() => setDraft(null)}
              className="cursor-pointer p-2 font-semibold rounded-lg hover:bg-[var(--translucid)] border-2 border-[var(--translucid)] transition"
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <>
          <p className="text-sm color-gray mb-3">
            Crie códigos que o cliente digita no carrinho para ganhar desconto ou frete grátis.
          </p>

          <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
            {coupons && coupons.length === 0 && (
              <p className="text-sm color-gray text-center py-4">Nenhum cupom criado ainda.</p>
            )}
            {(coupons || []).map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between p-2 rounded border border-translucid bg-translucid"
              >
                <div className="min-w-0">
                  <div className="text-sm font-semibold line-clamp-1">
                    {c.code} <span className="text-xs font-normal color-gray">· {status(c)}</span>
                  </div>
                  <div className="text-xs color-gray">{describe(c)}</div>
                  <div className="text-xs color-gray">
                    {toBR(c.starts_at)} → {c.ends_at ? toBR(c.ends_at) : "sem data de fim"}
                    {" · "}
                    {c.uses || 0}
                    {c.max_uses ? `/${c.max_uses}` : ""} uso(s)
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => openForm(c)} className="p-2 cursor-pointer">
                    <FaPen size={13} />
                  </button>
                  <button onClick={() => remove(c.id)} className="p-2 cursor-pointer text-red-500">
                    <FaTrash size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => openForm()}
            className="w-full mt-4 cursor-pointer p-2 bg-green-600/80 text-white font-semibold rounded-lg hover:bg-green-700/80 border-2 border-[var(--translucid)] transition"
          >
            + Novo cupom
          </button>
        </>
      )}
    </GenericModal>
  );
}
