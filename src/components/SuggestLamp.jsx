import React, { useState } from "react";
import { FaLightbulb } from "react-icons/fa";
import GenericModal from "./GenericModal";
import { supabase } from "@/lib/supabaseClient";

const SuggestLamp = ({ lampColor, userEmail }) => {
  const [showSuggestionModal, setShowSuggestionModal] = useState(false);
  const [suggestion, setSuggestion] = useState("");
  const [sending, setSending] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState("");

  const handleSendSuggestion = async () => {
    const trimmedSuggestion = suggestion.trim();

    if (!trimmedSuggestion) {
      setFeedbackMessage("Digite uma sugestão antes de enviar.");
      return;
    }

    try {
      setSending(true);
      setFeedbackMessage("");

      const { error } = await supabase.from("suggestions").insert([
        {
          email: userEmail || null,
          message: trimmedSuggestion,
        },
      ]);

      if (error) {
        console.error("Erro ao enviar sugestão:", error);
        setFeedbackMessage("Não foi possível enviar sua sugestão.");
        return;
      }

      setFeedbackMessage("Sugestão enviada com sucesso!");
      setSuggestion("");

      setTimeout(() => {
        setShowSuggestionModal(false);
        setFeedbackMessage("");
      }, 2000);
    } catch (err) {
      console.error("Erro inesperado ao enviar sugestão:", err);
      setFeedbackMessage("Ocorreu um erro ao enviar sua sugestão.");
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowSuggestionModal(!showSuggestionModal)}
        className="rounded-full border border-amber-500/40 bg-amber-500/40 p-3 text-sm hover:opacity-80 transition cursor-pointer backdrop-blur-xs"
        style={{ color: lampColor || undefined }}
      >
        <FaLightbulb />
      </button>

      {showSuggestionModal && (
        <GenericModal
          title="Sugestão de recurso"
          onClose={() => setShowSuggestionModal(false)}
          wfull
          maxWidth={"480px"}
          margin={"12px"}
        >
          {feedbackMessage.includes("sucesso") ? (
            <p className="text-green-600 font-bold">{feedbackMessage}</p>
          ) : (
            <>
              <p className="text-sm">Tem alguma ideia de recurso que gostaria de ver no Bite Menu?</p>

              <textarea
                value={suggestion}
                onChange={(e) => setSuggestion(e.target.value)}
                className="w-full rounded-2xl border bg-translucid border-[var(--translucid)] px-4 py-3 text-[15px] outline-none transition focus:border-red-500/70 my-2 min-h-[140px]"
                placeholder="Digite aqui e sua ideia será considerada para melhorar o Bite Menu!"
                disabled={sending}
              />

              {feedbackMessage && <p className="text-sm mb-2 text-red-500 font-bold">{feedbackMessage}</p>}

              <div className="flex justify-end">
                <button
                  onClick={handleSendSuggestion}
                  disabled={sending}
                  className="cursor-pointer px-3 py-1 bg-blue-600/80 border-2 border-[var(--translucid)] hover:bg-blue-700/80 text-white rounded transition disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {sending ? "Enviando..." : "Enviar sugestão"}
                </button>
              </div>
            </>
          )}
        </GenericModal>
      )}
    </>
  );
};

export default SuggestLamp;
