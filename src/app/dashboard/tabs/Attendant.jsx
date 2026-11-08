"use client";
// Aba "Atendente IA": liga/desliga, informações extras para a IA e gasto do dia (tasks/atendente-ia/).
// Salva com o client do dono + RLS (o supabaseClient já derruba o cache do cardápio público ao gravar em menus).
import { useEffect, useState } from "react";
import { FaMagic } from "react-icons/fa";
import { supabase } from "@/lib/supabaseClient";
import useMenu, { updateCachedMenu } from "@/hooks/useMenu";
import { updateMenuById } from "@/lib/queries/menus";
import { useAlert } from "@/providers/AlertProvider";
import { ATTENDANT_INFO_MAX } from "@/lib/attendant";

const PLACEHOLDER = `Ex.:
- Entregamos em até 40 min no centro; bairros afastados até 1h.
- O hambúrguer da casa é o mais pedido; sugira batata de acompanhamento.
- Temos opções sem glúten: pão sem glúten por +R$ 4 (avise no campo de observação).
- Às terças, chopp em dobro no local.`;

export default function Attendant() {
  const { menu } = useMenu();
  const customAlert = useAlert();
  const [enabled, setEnabled] = useState(true);
  const [info, setInfo] = useState("");
  const [savedInfo, setSavedInfo] = useState("");
  const [saving, setSaving] = useState(false);
  const [usage, setUsage] = useState(null);

  useEffect(() => {
    if (!menu) return;
    setEnabled(menu.attendant_enabled !== false);
    setInfo(menu.attendant_info ?? "");
    setSavedInfo(menu.attendant_info ?? "");
  }, [menu?.id]);

  useEffect(() => {
    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const res = await fetch("/api/attendant/usage", { headers: { Authorization: `Bearer ${session?.access_token}` } }).catch(() => null);
      const data = await res?.json().catch(() => null);
      setUsage(res?.ok && data ? data : false);
    })();
  }, []);

  const save = async (patch, okMessage) => {
    setSaving(true);
    const { error } = await updateMenuById(supabase, menu.id, patch);
    setSaving(false);
    if (error) {
      console.error("[Attendant] erro ao salvar:", error);
      customAlert("Não foi possível salvar.", "error");
      return false;
    }
    updateCachedMenu(patch);
    customAlert(okMessage);
    return true;
  };

  const toggle = async () => {
    const next = !enabled;
    setEnabled(next);
    const ok = await save({ attendant_enabled: next }, next ? "Atendente ativado no cardápio." : "Atendente desativado.");
    if (!ok) setEnabled(!next);
  };

  const saveInfo = async () => {
    const value = info.trim() || null;
    if (await save({ attendant_info: value }, "Informações salvas.")) setSavedInfo(value ?? "");
  };

  const percent = usage?.percent ?? 0;

  return (
    <div className="pt-2 px-4 pb-4 flex flex-col gap-4 max-w-[760px]">
      <div>
        <h2 className="font-semibold flex items-center gap-2">
          <FaMagic className="text-brasa" /> Atendente IA
        </h2>
        <p className="text-sm color-gray mt-1">
          Seus clientes conversam com o atendente no cardápio: ele mostra as opções, monta o carrinho e leva para a
          finalização do pedido, que sai como qualquer outro pedido.
        </p>
      </div>

      {/* Liga/desliga */}
      <div className="rounded-2xl border border-[var(--translucid)] bg-translucid p-4 flex items-center justify-between gap-4">
        <div>
          <p className="font-semibold">{enabled ? "Atendente ativado" : "Atendente desativado"}</p>
          <p className="text-sm color-gray">
            {enabled ? "O botão “Atendente” aparece no seu cardápio, ao lado do carrinho." : "O botão não aparece para os clientes."}
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          aria-label="Ativar atendente"
          onClick={toggle}
          disabled={saving || !menu}
          className={`cursor-pointer relative shrink-0 w-12 h-7 rounded-full transition-colors disabled:opacity-50 ${
            enabled ? "bg-brand-select" : "bg-[var(--translucid)] border border-[var(--translucid)]"
          }`}
        >
          <span className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white shadow transition-transform ${enabled ? "translate-x-5" : ""}`} />
        </button>
      </div>

      {/* Informações para a IA */}
      <div className="rounded-2xl border border-[var(--translucid)] bg-translucid p-4 flex flex-col gap-2">
        <div>
          <p className="font-semibold">Informações para o atendente</p>
          <p className="text-sm color-gray">
            O que o atendente deve saber além do cardápio: prazos, recomendações, promoções do dia, restrições, regras da casa.
            Os preços e itens continuam vindo do cardápio.
          </p>
        </div>
        <textarea
          value={info}
          onChange={(e) => setInfo(e.target.value)}
          maxLength={ATTENDANT_INFO_MAX}
          rows={7}
          placeholder={PLACEHOLDER}
          aria-label="Informações para o atendente"
          className="w-full rounded-xl border border-[var(--translucid)] bg-transparent p-3 text-sm outline-none resize-y"
        />
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs color-gray">
            {info.length}/{ATTENDANT_INFO_MAX}
          </span>
          <button
            type="button"
            onClick={saveInfo}
            disabled={saving || !menu || info.trim() === savedInfo.trim()}
            className="cursor-pointer rounded-full bg-brand-select px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {saving ? "Salvando…" : "Salvar"}
          </button>
        </div>
      </div>

      {/* Gasto do dia */}
      <div className="rounded-2xl border border-[var(--translucid)] bg-translucid p-4 flex flex-col gap-2">
        <p className="font-semibold">Uso de hoje</p>
        {usage === false ? (
          <p className="text-sm color-gray">Não foi possível carregar o uso agora.</p>
        ) : usage ? (
          <>
            <div className="flex items-baseline justify-between gap-2 text-sm">
              <span>
                <strong>{usage.messages}</strong> {usage.messages === 1 ? "mensagem respondida" : "mensagens respondidas"}
              </span>
              <span className="color-gray">{percent}% do limite diário</span>
            </div>
            <div className="h-2.5 rounded-full bg-[var(--translucid)] overflow-hidden" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
              <div className="h-full rounded-full bg-brand-select" style={{ width: `${Math.max(percent, usage.messages ? 2 : 0)}%` }} />
            </div>
            <div className="flex items-baseline justify-between gap-2 text-sm mt-2">
              <span>Este mês</span>
              <span className="color-gray">{usage.monthPercent ?? 0}% do limite mensal</span>
            </div>
            <div className="h-2.5 rounded-full bg-[var(--translucid)] overflow-hidden" role="progressbar" aria-valuenow={usage.monthPercent ?? 0} aria-valuemin={0} aria-valuemax={100}>
              <div className="h-full rounded-full bg-brand-select" style={{ width: `${usage.monthPercent ?? 0}%` }} />
            </div>
            <p className="text-xs color-gray">
              O limite mensal inclui o atendente e a landing page com IA. O limite diário cobre com folga um dia cheio de vendas; se algum limite for
              atingido, o atendente pausa (até a meia-noite UTC ou o próximo mês) e os clientes continuam pedindo pelo
              cardápio normalmente.
            </p>
          </>
        ) : (
          <p className="text-sm color-gray">Carregando…</p>
        )}
      </div>
    </div>
  );
}
