"use client";

import { useState } from "react";
import GenericModal from "./GenericModal";
import { supabase } from "@/lib/supabaseClient";
import { useAlert } from "@/providers/AlertProvider";
import { CURRENT_PRIVACY_VERSION } from "@/lib/privacy";

export default function PrivacyAcceptModal({ userId, onAccepted, onClose }) {
  const [submitting, setSubmitting] = useState(false);
  const customAlert = useAlert();

  const handleAccept = async () => {
    if (submitting) return;
    setSubmitting(true);

    const { error: auditError } = await supabase
      .from("privacy_acceptances")
      .insert({ user_id: userId, policy_version: CURRENT_PRIVACY_VERSION });

    if (auditError) {
      console.error("privacy_acceptances insert failed:", auditError);
      customAlert("Não foi possível registrar o aceite. Tente novamente.", "error");
      setSubmitting(false);
      return;
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        privacy_accepted_at: new Date().toISOString(),
        privacy_policy_version: CURRENT_PRIVACY_VERSION,
      })
      .eq("id", userId);

    if (profileError) {
      console.error("profiles update failed:", profileError);
      customAlert("Não foi possível registrar o aceite. Tente novamente.", "error");
      setSubmitting(false);
      return;
    }

    onAccepted();
  };

  return (
    <GenericModal title="Atualização da Política de Privacidade e Termos de Uso" size="md" zIndex={200} onClose={onClose}>
      <div className="flex flex-col gap-4">
        <p>
          Para usar o Bite Menu, pedimos que leia e aceite nossa Política de Privacidade e Termos de Uso, conforme a LGPD
          (Lei nº 13.709/2018).
        </p>
        <p>
          <a
            href="/politica-de-privacidade#coleta-de-dados"
            target="_blank"
            rel="noopener noreferrer"
            className="underline text-blue-500 hover:text-blue-700"
          >
            Ler Política de Privacidade
          </a>
          <br />
          <a
            href="/termos-de-uso"
            target="_blank"
            rel="noopener noreferrer"
            className="underline text-blue-500 hover:text-blue-700"
          >
            Ler Termos de Uso
          </a>
        </p>
        <button
          className="cursor-pointer px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-all disabled:opacity-50 mt-2"
          onClick={handleAccept}
          disabled={submitting}
          type="button"
        >
          {submitting ? "Registrando..." : "Li e aceito"}
        </button>
      </div>
    </GenericModal>
  );
}
