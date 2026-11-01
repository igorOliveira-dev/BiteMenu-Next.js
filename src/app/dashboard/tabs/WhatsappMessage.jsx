"use client";

import { useRef, useState } from "react";
import { FaChevronLeft } from "react-icons/fa";
import useMenu from "@/hooks/useMenu";
import Loading from "@/components/Loading";
import useUser from "@/hooks/useUser";
import UpdatePlanModal from "./components/UpdatePlanModal";
import { supabase } from "@/lib/supabaseClient";
import { updateMenuById } from "@/lib/queries/menus";
import { useAlert } from "@/providers/AlertProvider";
import {
  DEFAULT_WHATSAPP_TEMPLATE,
  WHATSAPP_TAGS,
  missingWhatsappTags,
  renderWhatsappMessage,
} from "@/lib/whatsappMessage";

const sampleValues = (menuTitle) => ({
  estabelecimento: menuTitle || "Seu estabelecimento",
  itens: "• 2x X-Burger\n   + Bacon\n\n• 1x Refrigerante",
  subtotal: "R$ 42,00",
  desconto: "",
  cupom: "",
  frete: "R$ 5,00",
  total: "R$ 47,00",
  nome: "Maria",
  telefone: "11999999999",
  bairro: "Centro",
  endereco: "Rua Exemplo, 123",
  pagamento: "Pix",
  troco: "",
  servico: "Entrega",
});

const TAG_GROUPS = [
  { title: "Pedido", tags: ["{estabelecimento}", "{itens}", "{servico}"] },
  {
    title: "Valores",
    tags: [
      "{subtotal}",
      "{desconto}",
      "{cupom}",
      "{frete}",
      "{total}",
      "{pagamento}",
      "{troco}",
    ],
  },
  {
    title: "Cliente",
    tags: ["{nome}", "{telefone}", "{bairro}", "{endereco}"],
  },
];

export default function WhatsappMessage({ setSelectedTab }) {
  const { menu, loading } = useMenu();
  const { profile, loading: userLoading } = useUser();
  const customAlert = useAlert();
  const [template, setTemplate] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const textareaRef = useRef(null);

  // useMenu pode chegar depois do primeiro render
  const text = template ?? menu?.whatsapp_template ?? DEFAULT_WHATSAPP_TEMPLATE;
  const missing = missingWhatsappTags(text);
  const goBack = () => setSelectedTab("orders");

  const insertTag = (tag) => {
    const el = textareaRef.current;
    const start = el?.selectionStart ?? text.length;
    const end = el?.selectionEnd ?? text.length;
    setTemplate(text.slice(0, start) + tag + text.slice(end));
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(start + tag.length, start + tag.length);
    });
  };

  const handleSave = async () => {
    // fora do Business dá pra montar a mensagem, mas só salva assinando
    if (!["business", "admin", "designer"].includes(profile?.role))
      return setShowPlanModal(true);
    setSaving(true);
    // padrão salvo como null: continua acompanhando o texto padrão do sistema
    const value =
      text.trim() && text !== DEFAULT_WHATSAPP_TEMPLATE ? text : null;
    const { error } = await updateMenuById(supabase, menu.id, {
      whatsapp_template: value,
    });
    setSaving(false);

    if (error)
      return customAlert("Erro ao salvar mensagem do WhatsApp.", "error");

    // atualiza o cache do useMenu
    menu.whatsapp_template = value;
    customAlert("Mensagem do WhatsApp atualizada!", "success");
    goBack();
  };

  const tagButton = (t) => (
    <button
      key={t.tag}
      type="button"
      title={`Inserir ${t.tag}`}
      onClick={() => insertTag(t.tag)}
      className="cursor-pointer rounded-full border border-translucid bg-translucid px-3 py-1 text-xs transition hover:opacity-80"
    >
      {t.label}
      {!t.optional && <span className="text-red-500"> *</span>}
    </button>
  );

  const tabClass = (active) =>
    `flex-1 cursor-pointer rounded-lg py-1.5 text-sm transition ${active ? "bg-[var(--translucid)] font-medium" : "color-gray"}`;

  if (loading || userLoading) return <Loading />;
  if (!menu) return <p>Você ainda não criou seu cardápio.</p>;

  return (
    <div className="max-w-[1200px] px-4 sm:px-2 pt-2">
      <div className="mb-6 flex items-center gap-2 lg:mb-8">
        <button
          type="button"
          className="p-2 rounded-lg hover:bg-[var(--translucid)] transition cursor-pointer"
          onClick={goBack}
          aria-label="Voltar aos pedidos"
        >
          <FaChevronLeft />
        </button>
        <div>
          <h2 className="text-lg font-semibold leading-tight">
            Mensagem do WhatsApp
          </h2>
          <p className="text-xs color-gray">
            A mensagem que o cliente envia para confirmar o pedido.
          </p>
        </div>
      </div>

      {showPlanModal && (
        <UpdatePlanModal
          plan="business"
          title="Mensagem do WhatsApp personalizada"
          text="Assine o plano Business para salvar sua mensagem personalizada. Até lá, seus pedidos usam a mensagem padrão."
          onClose={() => setShowPlanModal(false)}
        />
      )}

      <>
        {/* celular: alterna entre editar e prévia; computador: lado a lado */}
        <div className="mb-3 flex gap-1 rounded-xl border border-translucid p-1 lg:hidden">
          <button
            type="button"
            onClick={() => setShowPreview(false)}
            className={tabClass(!showPreview)}
          >
            Editar
          </button>
          <button
            type="button"
            onClick={() => setShowPreview(true)}
            className={tabClass(showPreview)}
          >
            Prévia
          </button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-0">
          <div
            className={`space-y-4 lg:pr-10 ${showPreview ? "hidden lg:block" : ""}`}
          >
            {TAG_GROUPS.map((group) => (
              <div key={group.title}>
                <p className="mb-1.5 text-xs font-medium color-gray">
                  {group.title}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {WHATSAPP_TAGS.filter((t) =>
                    group.tags.includes(t.tag),
                  ).map(tagButton)}
                </div>
              </div>
            ))}

            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => setTemplate(e.target.value)}
              rows={18}
              className="input w-full resize-y rounded-xl bg-translucid p-3 font-mono text-sm"
            />

            <p className="text-xs color-gray">
              <span className="text-red-500">*</span> Obrigatória: se ficar
              fora do texto, entra no final da mensagem.
            </p>

            {missing.length > 0 && (
              <div className="rounded-xl border border-yellow-500/40 bg-yellow-500/10 p-3 text-xs">
                <p className="mb-2 text-yellow-500">
                  Faltando no texto (serão adicionadas ao final). Toque para
                  inserir:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {missing.map(tagButton)}
                </div>
              </div>
            )}
          </div>

          <div
            className={`lg:border-l lg:border-[var(--translucid)] lg:pl-10 ${showPreview ? "" : "hidden lg:block"}`}
          >
            <div className="lg:sticky lg:top-4">
              <p className="mb-3 hidden text-sm font-medium lg:block">
                Prévia
              </p>
              <div className="rounded-xl bg-[#0b141a] p-3">
                <pre className="ml-auto w-fit max-w-[95%] whitespace-pre-wrap break-words rounded-lg rounded-tr-none bg-[#005c4b] px-3 py-2 font-sans text-sm text-[#e9edef] shadow">
                  {renderWhatsappMessage(text, sampleValues(menu?.title))}
                </pre>
              </div>
              <p className="mt-2 text-xs color-gray">
                Exemplo de um pedido para entrega pago no Pix.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col-reverse gap-2 border-t border-translucid pt-4 sm:flex-row sm:justify-between">
          <button
            type="button"
            onClick={() => setTemplate(DEFAULT_WHATSAPP_TEMPLATE)}
            className="cursor-pointer rounded-xl px-4 py-2 text-sm color-gray transition hover:opacity-80"
          >
            Restaurar padrão
          </button>
          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            <button
              type="button"
              onClick={goBack}
              className="cursor-pointer rounded-xl border border-translucid bg-[var(--translucid)] px-6 py-2 transition hover:opacity-80"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="cursor-pointer rounded-xl bg-green-600 px-6 py-2 text-white transition hover:bg-green-700 disabled:opacity-60"
            >
              {saving ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </div>
      </>
    </div>
  );
}
