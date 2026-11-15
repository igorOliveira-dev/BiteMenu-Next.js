"use client";

import { useEffect, useState } from "react";
import { FaQuoteLeft, FaHeart } from "react-icons/fa";
import GenericModal from "@/components/GenericModal";
import { supabase } from "@/lib/supabaseClient";
import { useAlert } from "@/providers/AlertProvider";

// Pedido de autorização de depoimento. A linha em testimonial_consents é criada pelo admin
// (tasks/sql/testimonial-consents.sql); o dono responde uma vez e o trigger trava hora/email.
// Fechar no X só adia: volta na próxima visita até responder.
const OPTIONS = [
  { value: "com_nome", title: "Pode publicar com meu nome e do meu negócio", hint: "Seu estabelecimento ganha divulgação" },
  { value: "anonimo", title: "Pode publicar, mas sem me identificar", hint: 'Aparece como "Cliente Bite Menu"' },
  { value: "nao_autorizado", title: "Prefiro que não publiquem", hint: "Tudo bem, sua mensagem fica só com a gente" },
];

const consentText = (choice, name, establishment) =>
  ({
    com_nome: `Autorizo a Bite Menu a publicar o depoimento acima, sem alterações, em suas redes sociais, site e materiais de divulgação, identificado como "${name}" do estabelecimento "${establishment}", sem qualquer remuneração. Posso pedir a remoção a qualquer momento pelo suporte.`,
    anonimo: `Autorizo a Bite Menu a publicar o depoimento acima, sem alterações, em suas redes sociais, site e materiais de divulgação, de forma anônima (como "Cliente Bite Menu"), sem qualquer remuneração. Posso pedir a remoção a qualquer momento pelo suporte.`,
    nao_autorizado: "Não autorizo a publicação do depoimento acima.",
  })[choice];

export default function TestimonialConsentModal({ userId, defaultName, defaultEstablishment }) {
  const { showAlert } = useAlert();
  const [request, setRequest] = useState(null);
  const [show, setShow] = useState(true);
  const [choice, setChoice] = useState("");
  const [name, setName] = useState("");
  const [establishment, setEstablishment] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!userId) return;
    supabase
      .from("testimonial_consents")
      .select("id, quote")
      .eq("user_id", userId)
      .is("choice", null)
      .limit(1)
      .maybeSingle()
      .then(({ data }) => setRequest(data));
  }, [userId]);

  useEffect(() => {
    setName((n) => n || defaultName || "");
    setEstablishment((e) => e || defaultEstablishment || "");
  }, [defaultName, defaultEstablishment]);

  if (!request || !show) return null;

  const needsNames = choice === "com_nome";
  const valid = choice && (!needsNames || (name.trim() && establishment.trim()));

  async function submit() {
    if (!valid || saving) return;
    setSaving(true);
    const { error } = await supabase
      .from("testimonial_consents")
      .update({
        choice,
        display_name: needsNames ? name.trim() : null,
        establishment_name: needsNames ? establishment.trim() : null,
        consent_text: consentText(choice, name.trim(), establishment.trim()),
        user_agent: navigator.userAgent,
      })
      .eq("id", request.id);
    setSaving(false);
    if (error) return showAlert("Não foi possível salvar. Tente novamente.", "error");
    showAlert(choice === "nao_autorizado" ? "Resposta salva. Obrigado!" : "Obrigado! Sua mensagem vai inspirar muita gente 💛", "success");
    setRequest(null);
  }

  return (
    <GenericModal title="Sua mensagem marcou a gente" size="md" onClose={() => setShow(false)} backdropDontClose>
      <div className="flex flex-col gap-4">
        <p className="text-sm text-[var(--gray)]">
          Você deixou essa mensagem na nossa pesquisa e ela emocionou o time. Podemos compartilhar no Instagram e no site
          da Bite Menu pra inspirar outros donos de negócio?
        </p>

        <blockquote className="relative rounded-2xl bg-[var(--red)]/10 p-4 pl-11">
          <FaQuoteLeft className="absolute left-4 top-4 text-[var(--red)]" />
          <p className="italic">{request.quote}</p>
        </blockquote>

        <div className="flex flex-col gap-2">
          {OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setChoice(opt.value)}
              className="w-full rounded-2xl border px-4 py-3 text-left transition cursor-pointer"
              style={{
                borderColor: choice === opt.value ? "rgb(239 68 68 / 0.7)" : "var(--translucid)",
                backgroundColor: choice === opt.value ? "rgb(239 68 68 / 0.1)" : "transparent",
              }}
            >
              <span className="block text-sm font-semibold">{opt.title}</span>
              <span className="block text-xs text-[var(--gray)]">{opt.hint}</span>
            </button>
          ))}
        </div>

        {needsNames && (
          <div className="flex flex-col gap-2">
            <input
              type="text"
              placeholder="Seu nome (como deve aparecer)"
              maxLength={60}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-11 w-full rounded-2xl border bg-translucid border-[var(--translucid)] px-4 text-sm outline-none"
            />
            <input
              type="text"
              placeholder="Nome do estabelecimento"
              maxLength={80}
              value={establishment}
              onChange={(e) => setEstablishment(e.target.value)}
              className="h-11 w-full rounded-2xl border bg-translucid border-[var(--translucid)] px-4 text-sm outline-none"
            />
          </div>
        )}

        {choice && <p className="text-xs text-[var(--gray)]">{consentText(choice, name.trim(), establishment.trim())}</p>}

        <button
          type="button"
          disabled={!valid || saving}
          onClick={submit}
          className="cursor-pointer flex items-center justify-center gap-2 px-4 py-2 bg-bite text-white rounded-full hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <FaHeart /> {saving ? "Salvando..." : "Confirmar resposta"}
        </button>
      </div>
    </GenericModal>
  );
}
