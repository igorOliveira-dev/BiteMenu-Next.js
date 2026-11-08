"use client";

import { useEffect, useRef, useState } from "react";
import { FaCheck, FaChevronDown } from "react-icons/fa";

// "No Descobrir, abrir primeiro" (tasks/landing-ia/landing-descobrir-plan.md), usado em Configurações e no DiscoverStatus.
// Visual dos selects do painel. A lista abre no fluxo (não flutua) para não ser cortada pelo overflow do modal.
export default function DiscoverOpenSelect({ landing, hasLanding, onChange, disabled }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const value = landing && hasLanding ? "landing" : "menu";

  const options = [
    { value: "menu", label: "Cardápio", hint: "O cliente vai direto para os produtos" },
    {
      value: "landing",
      label: "Landing page",
      hint: hasLanding ? "O cliente vê primeiro a página de apresentação" : "Publique uma na aba Landing page",
      off: !hasLanding,
    },
  ];

  useEffect(() => {
    if (!open) return;
    const close = (e) => !ref.current?.contains(e.target) && setOpen(false);
    const esc = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  return (
    <div ref={ref}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`flex h-11 w-full cursor-pointer items-center justify-between rounded-xl border bg-translucid px-3 text-[15px] outline-none transition disabled:cursor-wait disabled:opacity-60 ${
          open ? "border-brand-select/70" : "border-[var(--translucid)]"
        }`}
      >
        <span className="truncate">{options.find((o) => o.value === value).label}</span>
        <FaChevronDown className={`text-xs opacity-60 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <ul
          role="listbox"
          className="mt-1.5 overflow-hidden rounded-xl border border-[var(--low-gray)] bg-[var(--background)] text-[var(--foreground)] shadow-xl"
        >
          {options.map((o) => (
            <li key={o.value}>
              <button
                type="button"
                role="option"
                aria-selected={o.value === value}
                disabled={o.off}
                onClick={() => {
                  setOpen(false);
                  if (o.value !== value) onChange(o.value === "landing");
                }}
                className={`flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-left transition hover:bg-[var(--translucid)] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent ${
                  o.value === value ? "bg-[var(--translucid)]" : ""
                }`}
              >
                <span className="min-w-0 flex-1">
                  <span className={`block text-[15px] ${o.value === value ? "font-semibold" : ""}`}>{o.label}</span>
                  <span className="block text-xs opacity-60">{o.hint}</span>
                </span>
                {o.value === value && <FaCheck className="shrink-0 text-xs text-brand-select" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
