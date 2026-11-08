"use client";

import Select from "@/components/Select";

// "No Descobrir, abrir primeiro" (tasks/landing-ia/landing-descobrir-plan.md), usado em Configurações e no DiscoverStatus.
export default function DiscoverOpenSelect({ landing, hasLanding, onChange, disabled }) {
  return (
    <Select
      value={landing && hasLanding ? "landing" : "menu"}
      onChange={(v) => onChange(v === "landing")}
      disabled={disabled}
      className="h-11 w-full rounded-xl border border-[var(--translucid)] bg-translucid px-3 text-[15px] outline-none transition focus:border-brand-select/70"
      options={[
        { value: "menu", label: "Cardápio", hint: "O cliente vai direto para os produtos" },
        {
          value: "landing",
          label: "Landing page",
          hint: hasLanding ? "O cliente vê primeiro a página de apresentação" : "Publique uma na aba Landing page",
          disabled: !hasLanding,
        },
      ]}
    />
  );
}
