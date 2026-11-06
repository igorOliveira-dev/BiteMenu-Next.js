"use client";

import { useEffect, useState } from "react";
import GenericModal from "@/components/GenericModal";
import LoyaltyProgress from "@/components/LoyaltyProgress";
import SearchSelect from "@/components/SearchSelect";
import { supabase } from "@/lib/supabaseClient";
import { formatCurrency, getCurrencySymbol } from "@/lib/formatCurrency";
import { LOYALTY_MAX, LOYALTY_MIN } from "@/lib/loyalty";
import { useAlert } from "@/providers/AlertProvider";
import { useConfirm } from "@/providers/ConfirmProvider";
import UpdatePlanModal from "../UpdatePlanModal";

const inputClass = "input w-full rounded-xl bg-translucid p-2 text-sm";
const num = (v) => parseFloat(String(v ?? "").replace(",", "."));

const segClass = (active) =>
  `p-2 rounded-xl border border-[var(--translucid)] cursor-pointer text-xs sm:text-sm font-semibold transition ${active ? "bg-brand-select text-white" : "hover:bg-[var(--translucid)]"}`;

// Campo de dinheiro com o símbolo da moeda do cardápio à esquerda
function MoneyInput({ symbol, value, onChange, label }) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm opacity-60">{symbol}</span>
      <input
        type="text"
        inputMode="decimal"
        aria-label={label}
        className={`${inputClass} pl-10`}
        value={value}
        placeholder="0,00"
        onChange={(e) => onChange(e.target.value.replace(/[^\d.,]/g, ""))}
      />
    </div>
  );
}

// Programa de fidelidade do cardápio: grava menus.loyalty direto (tasks/fidelidade/fidelidade-plan.md).
// Recompensa = item grátis ou desconto, os dois aplicados sozinhos no carrinho na compra do prêmio.
// O texto que o cliente vê (`reward`) é gerado ao salvar. ponytail: renomear o item depois não atualiza o texto,
// é só salvar de novo aqui.
export default function LoyaltyModal({ menuId, canSave, items = [], currency, onClose }) {
  const alert = useAlert();
  const confirm = useConfirm();
  const symbol = getCurrencySymbol(currency);
  const [saved, setSaved] = useState(undefined); // undefined = carregando
  const [enabled, setEnabled] = useState(true);
  const [goal, setGoal] = useState("5");
  const [type, setType] = useState("item");
  const [itemId, setItemId] = useState("");
  const [discountType, setDiscountType] = useState("percentage");
  const [discountValue, setDiscountValue] = useState("");
  const [hasMin, setHasMin] = useState(false);
  const [minOrder, setMinOrder] = useState("");
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);

  useEffect(() => {
    if (!menuId) return;
    supabase
      .from("menus")
      .select("loyalty")
      .eq("id", menuId)
      .single()
      .then(({ data, error }) => {
        if (error) console.warn("[fidelidade] config indisponível:", error.message);
        const l = data?.loyalty ?? null;
        setSaved(l);
        if (!l) return;
        setEnabled(!!l.enabled);
        setGoal(String(l.goal || 5));
        setType(l.type === "discount" ? "discount" : "item");
        setItemId(l.item_id != null ? String(l.item_id) : "");
        setDiscountType(l.discount_type === "fixed" ? "fixed" : "percentage");
        setDiscountValue(l.discount_value != null ? String(l.discount_value).replace(".", ",") : "");
        setHasMin(Number(l.min_order) > 0);
        setMinOrder(Number(l.min_order) > 0 ? String(l.min_order).replace(".", ",") : "");
      });
  }, [menuId]);

  const goalNum = Number(goal);
  const goalOk = Number.isInteger(goalNum) && goalNum >= LOYALTY_MIN && goalNum <= LOYALTY_MAX;

  const item = items.find((it) => String(it.id) === itemId);
  const value = num(discountValue);
  const valueOk = value > 0 && (discountType === "fixed" || value <= 100);
  const min = num(minOrder);
  const minOk = !hasMin || min > 0;

  const rewardText =
    type === "item"
      ? item
        ? `1 ${item.name} grátis`
        : ""
      : valueOk && minOk
        ? `${discountType === "fixed" ? formatCurrency(value, currency) : `${value.toLocaleString("pt-BR")}%`} de desconto` +
          (hasMin ? ` em compras a partir de ${formatCurrency(min, currency)}` : "")
        : "";

  const save = async () => {
    if (!canSave) return setShowPlanModal(true);
    if (enabled) {
      if (type === "item" && !item) return setError("item");
      if (type === "discount" && !valueOk) return setError("value");
      if (type === "discount" && !minOk) return setError("min");
    }
    if (!goalOk) return setError("goal");
    setError(null);

    // mudar o número recalcula o progresso de quem já está juntando
    if (saved?.enabled && enabled && saved.goal !== goalNum) {
      const ok = await confirm(
        "Mudar o número de compras recalcula o progresso dos clientes que já estão juntando. Continuar?",
        { tone: "confirm" },
      );
      if (!ok) return;
    }

    setSaving(true);
    const loyalty = {
      enabled,
      goal: goalNum,
      type,
      reward: rewardText,
      ...(type === "item" && item && { item_id: item.id }),
      ...(type === "discount" && {
        discount_type: discountType,
        discount_value: value,
        min_order: hasMin ? min : null,
      }),
    };
    const { error: dbError } = await supabase.from("menus").update({ loyalty }).eq("id", menuId);
    setSaving(false);
    if (dbError) {
      console.error("[fidelidade] erro ao salvar:", dbError.message);
      return alert("Erro ao salvar a fidelidade.", "error");
    }
    setSaved(loyalty);
    alert(enabled ? "Fidelidade salva" : "Fidelidade desligada", "success");
    onClose();
  };

  const errorText = (msg) => <p className="mt-1 text-xs text-red-500">{msg}</p>;

  return (
    <GenericModal wfull maxWidth={"420px"} py={"24px"} title="Fidelidade" onClose={onClose}>
      {showPlanModal && (
        <UpdatePlanModal
          plan="plus"
          title="Programa de fidelidade"
          text="Assine o plano Plus para ativar a fidelidade. Seus clientes juntam compras e ganham um prêmio: um motivo a mais para voltar."
          onClose={() => setShowPlanModal(false)}
        />
      )}
      {saved === undefined ? (
        <p className="text-sm color-gray">Carregando…</p>
      ) : (
        <div className="space-y-4">
          <p className="text-sm color-gray">
            Depois de {goalOk ? goalNum : "N"} compras, a próxima sai com o prêmio. A compra conta quando você
            finaliza o pedido de um cliente logado.
          </p>

          <label className="flex cursor-pointer items-center gap-3">
            <span className="switch shrink-0">
              <input
                type="checkbox"
                className="hidden"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
              />
              <span className="slider"></span>
            </span>
            <span className="text-sm font-medium">Programa ativo</span>
          </label>

          <div>
            <div className="text-sm color-gray mb-1">Recompensa</div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: "item", label: "Item do cardápio" },
                { value: "discount", label: "Desconto" },
              ].map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => {
                    setType(t.value);
                    setError(null);
                  }}
                  className={segClass(type === t.value)}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {type === "item" && (
              <div className="mt-2">
                {items.length === 0 ? (
                  <p className="text-sm color-gray">Seu cardápio ainda não tem itens.</p>
                ) : (
                  <SearchSelect
                    value={itemId}
                    placeholder="Escolha um item"
                    options={items.map((it) => ({
                      value: String(it.id),
                      label: it.name,
                      group: it.categoryName || "Sem categoria",
                    }))}
                    onChange={(v) => {
                      setItemId(v);
                      setError(null);
                    }}
                  />
                )}
                {error === "item" && errorText("Escolha um item.")}
                <p className="mt-1 text-xs color-gray">Na compra do prêmio, 1 unidade do item sai de graça quando o cliente coloca no carrinho.</p>
              </div>
            )}

            {type === "discount" && (
              <div className="mt-2 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: "percentage", label: "Porcentagem" },
                    { value: "fixed", label: "Valor fixo" },
                  ].map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => {
                        setDiscountType(t.value);
                        setError(null);
                      }}
                      className={segClass(discountType === t.value)}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                <label className="block">
                  <div className="text-sm color-gray mb-1">
                    {discountType === "fixed" ? "Valor do desconto" : "Desconto (%)"}
                  </div>
                  {discountType === "fixed" ? (
                    <MoneyInput
                      symbol={symbol}
                      label="Valor do desconto"
                      value={discountValue}
                      onChange={(v) => {
                        setDiscountValue(v);
                        setError(null);
                      }}
                    />
                  ) : (
                    <div className="relative">
                      <input
                        type="text"
                        inputMode="decimal"
                        aria-label="Desconto em porcentagem"
                        className={`${inputClass} pr-8`}
                        value={discountValue}
                        placeholder="10"
                        onChange={(e) => {
                          setDiscountValue(e.target.value.replace(/[^\d.,]/g, ""));
                          setError(null);
                        }}
                      />
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm opacity-60">
                        %
                      </span>
                    </div>
                  )}
                  {error === "value" &&
                    errorText(discountType === "fixed" ? "Informe o valor do desconto." : "Use de 1 a 100%.")}
                </label>

                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="h-4 w-4 cursor-pointer accent-[var(--brand-select)]"
                    checked={hasMin}
                    onChange={(e) => {
                      setHasMin(e.target.checked);
                      setError(null);
                    }}
                  />
                  Exigir valor mínimo de compra
                </label>

                {hasMin && (
                  <label className="block">
                    <div className="text-sm color-gray mb-1">Valor mínimo da compra</div>
                    <MoneyInput
                      symbol={symbol}
                      label="Valor mínimo da compra"
                      value={minOrder}
                      onChange={(v) => {
                        setMinOrder(v);
                        setError(null);
                      }}
                    />
                    {error === "min" && errorText("Informe o valor mínimo.")}
                  </label>
                )}

                <p className="text-xs color-gray">
                  O desconto entra sozinho no carrinho do cliente na compra do prêmio.
                </p>
              </div>
            )}
          </div>

          <label className="block">
            <div className="text-sm color-gray mb-1">Compras necessárias</div>
            <input
              type="number"
              inputMode="numeric"
              min={LOYALTY_MIN}
              max={LOYALTY_MAX}
              className={inputClass}
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
            />
            {error === "goal" && errorText(`Use um número de ${LOYALTY_MIN} a ${LOYALTY_MAX}.`)}
          </label>

          {goalOk && rewardText && (
            <div className="rounded-2xl border border-brand-line p-3">
              <p className="mb-2 text-xs font-semibold uppercase color-gray">Como o cliente vê</p>
              <LoyaltyProgress count={Math.min(2, goalNum - 1)} goal={goalNum} reward={rewardText} />
            </div>
          )}

          <div className="grid gap-2 pt-1">
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="cursor-pointer p-2 bg-verde text-white font-semibold rounded-full hover:opacity-90 transition disabled:opacity-60"
            >
              {saving ? "Salvando…" : "Salvar"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer p-2 font-semibold rounded-full hover:bg-[var(--translucid)] border border-[var(--translucid)] transition"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </GenericModal>
  );
}
