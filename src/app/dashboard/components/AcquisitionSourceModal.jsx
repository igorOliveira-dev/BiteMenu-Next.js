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
  const [otherText, setOtherText] = useState("");
  const [saving, setSaving] = useState(false);

  const isOther = selected === "other";
  const canSubmit = selected && (!isOther || otherText.trim().length > 0);

  const handleSelect = (value) => {
    setSelected(value);
    if (value !== "other") setOtherText("");
  };

  const handleSubmit = async () => {
    if (!canSubmit || saving) return;
    setSaving(true);
    await onSubmit(isOther ? otherText.trim() : selected);
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
              onClick={() => handleSelect(option.value)}
            />
          ))}
        </div>

        {isOther && (
          <input
            type="text"
            autoFocus
            maxLength={60}
            value={otherText}
            onChange={(e) => setOtherText(e.target.value)}
            placeholder="De onde você veio?"
            className="input w-full bg-translucid border border-translucid p-3 rounded-xl outline-none"
          />
        )}

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
            disabled={!canSubmit || saving}
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
