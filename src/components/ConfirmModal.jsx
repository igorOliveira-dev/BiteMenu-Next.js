"use client";

import { useEffect } from "react";
import GenericModal from "./GenericModal";
import useModalBackHandler from "@/hooks/useModalBackHandler";

export default function ConfirmModal({ message, onConfirm, onCancel }) {
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
            className="cursor-pointer px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-all"
            onClick={onCancel}
            type="button"
          >
            Cancelar
          </button>
          <button
            className="cursor-pointer px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-all"
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
