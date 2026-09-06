"use client";

import { useState } from "react";
import GenericModal from "@/components/GenericModal";
import { ACQUISITION_SOURCE_OPTIONS } from "@/lib/acquisitionSourceOptions";

function RadioCard({ label, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-2xl border-2 px-4 py-3 text-left text-sm transition cursor-pointer"
      style={{
        borderColor: selected ? "rgb(239 68 68 / 0.7)" : "var(--translucid)",
        backgroundColor: selected ? "rgb(239 68 68 / 0.1)" : "transparent",
      }}
    >
      {label}
    </button>
  );
}

export default function AcquisitionSourceModal({ onClose, onSubmit }) {
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!selected || saving) return;
    setSaving(true);
    await onSubmit(selected);
    setSaving(false);
  };

  return (
    <GenericModal title="Como você conheceu o Bite Menu?" onClose={onClose} zIndex={160} size="md">
      <div className="space-y-3">
        <div className="space-y-2">
          {ACQUISITION_SOURCE_OPTIONS.map((option) => (
            <RadioCard
              key={option.value}
              label={option.label}
              selected={selected === option.value}
              onClick={() => setSelected(option.value)}
            />
          ))}
        </div>

        <div className="flex gap-2 items-end justify-end pt-2">
          <button
            onClick={onClose}
            type="button"
            className="cursor-pointer px-4 py-2 bg-translucid border-2 border-[var(--translucid)] hover:opacity-80 rounded"
          >
            Agora não
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selected || saving}
            type="button"
            className="cta-button glow-red disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Enviando..." : "Enviar"}
          </button>
        </div>
      </div>
    </GenericModal>
  );
}
