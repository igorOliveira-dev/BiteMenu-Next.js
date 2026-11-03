"use client";

import { useEffect } from "react";
import GenericModal from "./GenericModal";
import useModalBackHandler from "@/hooks/useModalBackHandler";

export default function ConfirmModal({ message, tone, onConfirm, onCancel }) {
  // Fecha com ESC
  useEffect(() => {
    const handleEsc = (e) => e.key === "Escape" && onCancel();
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onCancel]);

  // Fecha com botão "Voltar" do navegador / sistema
  useModalBackHandler(true, onCancel);

  return (
    <GenericModal title="Confirmação" onClose={onCancel} size="sm">
      <div>
        <p>{message}</p>
        <div className="flex justify-start gap-3 mt-4">
          <button
            className="brand-line-button cursor-pointer"
            onClick={onCancel}
            type="button"
          >
            Cancelar
          </button>
          <button
            className={
              tone === "confirm"
                ? "cursor-pointer rounded-full bg-verde px-[22px] py-3 font-bold text-white transition hover:opacity-90"
                : "cta-button"
            }
            onClick={onConfirm}
            type="button"
          >
            Confirmar
          </button>
        </div>
      </div>
    </GenericModal>
  );
}
