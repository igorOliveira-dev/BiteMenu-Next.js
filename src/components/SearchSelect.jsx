"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { FaChevronDown } from "react-icons/fa";

// Select com pesquisa (mesmo visual do SearchableSelect dos itens do cardápio).
// Fundo e texto vêm de --background/--foreground: o <select> nativo deixava a lista branca com texto branco no tema escuro.
export default function SearchSelect({ value, onChange, options, placeholder = "Selecione...", className = "" }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const wrapperRef = useRef(null);

  const selected = options.find((o) => o.value === value);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, search]);

  const close = () => {
    setOpen(false);
    setSearch("");
  };

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) close();
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div ref={wrapperRef} className={`relative w-full ${className}`}>
      <button
        type="button"
        onClick={() => (open ? close() : setOpen(true))}
        className="w-full px-3 py-2 rounded-lg border border-translucid bg-translucid text-left text-sm flex items-center justify-between gap-2 cursor-pointer"
      >
        <span className="truncate">{selected ? selected.label : placeholder}</span>
        <FaChevronDown size={11} className="flex-shrink-0 opacity-60" />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-[var(--low-gray)] bg-[var(--background)] text-[var(--foreground)] shadow-lg overflow-hidden">
          <input
            type="text"
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquisar..."
            className="w-full px-3 py-2.5 text-sm border-b border-[var(--low-gray)] bg-[var(--background)] text-[var(--foreground)] outline-none"
          />
          <div className="overflow-y-auto" style={{ maxHeight: 240 }}>
            {filtered.length === 0 ? (
              <div className="p-3 text-sm color-gray text-center">Nenhum resultado</div>
            ) : (
              filtered.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => {
                    onChange(o.value);
                    close();
                  }}
                  className={`w-full text-left px-3 py-2 text-sm cursor-pointer transition ${
                    o.value === value ? "bg-[var(--translucid)] font-semibold" : "hover:bg-[var(--translucid)]"
                  }`}
                >
                  {o.label}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
