"use client";

import { useEffect } from "react";

export default function ConfirmModal({ message, onConfirm, onCancel }) {
  // Fecha com ESC
  useEffect(() => {
    const handleEsc = (e) => e.key === "Escape" && onCancel();
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onCancel]);

  return (
    <div className="fixed inset-0 bg-dark-gray-90 flex items-center justify-center z-50">
      <div className="bg-low-gray rounded shadow-lg p-6 w-80">
        <p>{message}</p>
        <div className="flex justify-start gap-3 mt-4">
          <button className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-all" onClick={onCancel}>
            Cancelar
          </button>
          <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-all" onClick={onConfirm}>
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}
