"use client";

import Select from "@/components/Select";

// "No Descobrir, abrir primeiro" (tasks/landing-ia/landing-descobrir-plan.md e tasks/linktree/), usado em Configurações
// e no DiscoverStatus. Cada opção só aparece para o plano dela (showLanding/showLinks) e fica desabilitada sem página.
// onChange recebe { discoverLanding, discoverLinks }: escolher uma desliga a outra.
export default function DiscoverOpenSelect({ landing, links, hasLanding, hasLinks, showLanding, showLinks, onChange, disabled }) {
  const value = links && hasLinks && showLinks ? "links" : landing && hasLanding && showLanding ? "landing" : "menu";
  return (
    <Select
      value={value}
      onChange={(v) => onChange({ discoverLanding: v === "landing", discoverLinks: v === "links" })}
      disabled={disabled}
      className="h-11 w-full rounded-xl border border-[var(--translucid)] bg-translucid px-3 text-[15px] outline-none transition focus:border-brand-select/70"
      options={[
        { value: "menu", label: "Cardápio", hint: "O cliente vai direto para os produtos" },
        ...(showLanding
          ? [
              {
                value: "landing",
                label: "Landing page",
                hint: hasLanding ? "O cliente vê primeiro a página de apresentação" : "Publique uma na aba Landing page",
                disabled: !hasLanding,
              },
            ]
          : []),
        ...(showLinks
          ? [
              {
                value: "links",
                label: "Links",
                hint: hasLinks ? "O cliente vê primeiro a sua página de links" : "Salve os seus links na aba Links",
                disabled: !hasLinks,
              },
            ]
          : []),
      ]}
    />
  );
}
