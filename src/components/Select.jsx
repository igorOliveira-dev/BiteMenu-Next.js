"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FaCheck, FaChevronDown } from "react-icons/fa";

// Dropdown do Bite Menu no lugar do <select> nativo (a lista nativa ficava branca no tema escuro e fora do visual).
// options: [{ value, label, hint?, disabled? }]; hint é a descrição opcional embaixo do nome.
// onChange recebe o value (não o evento). className vai no botão: cada uso mantém o próprio tamanho.
// Com `name`, manda o valor num <input hidden> (formulários lidos por FormData).
// A lista abre num portal (position fixed): não é cortada pelo overflow de modais.
export default function Select({
  value,
  defaultValue,
  onChange,
  options,
  name,
  className = "",
  disabled,
  placeholder = "Selecione...",
  "aria-label": ariaLabel,
}) {
  const controlled = value !== undefined;
  const [inner, setInner] = useState(defaultValue ?? options[0]?.value);
  const current = controlled ? value : inner;
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [pos, setPos] = useState(null);
  const btnRef = useRef(null);
  const listRef = useRef(null);

  const selected = options.find((o) => String(o.value) === String(current));

  const place = () => {
    const r = btnRef.current?.getBoundingClientRect();
    if (!r) return;
    const below = window.innerHeight - r.bottom;
    const up = below < 240 && r.top > below; // pouco espaço embaixo: abre para cima
    const width = Math.min(Math.max(r.width, 180), window.innerWidth - 16);
    setPos({
      left: Math.max(8, Math.min(r.left, window.innerWidth - width - 8)),
      width,
      maxHeight: Math.min(300, (up ? r.top : below) - 14),
      ...(up ? { bottom: window.innerHeight - r.top + 6 } : { top: r.bottom + 6 }),
    });
  };

  const openList = () => {
    if (disabled) return;
    place();
    setActive(Math.max(0, options.indexOf(selected)));
    setOpen(true);
  };

  const pick = (o) => {
    if (!o || o.disabled) return;
    setOpen(false);
    btnRef.current?.focus();
    if (String(o.value) === String(current)) return;
    if (!controlled) setInner(o.value);
    onChange?.(o.value);
  };

  useEffect(() => {
    if (!open) return;
    const outside = (e) => {
      if (!btnRef.current?.contains(e.target) && !listRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", outside);
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      document.removeEventListener("mousedown", outside);
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open]);

  useEffect(() => {
    if (open) listRef.current?.children[active]?.scrollIntoView({ block: "nearest" });
  }, [open, active]);

  // setas andam pelas opções habilitadas; Enter/Espaço escolhe; Esc/Tab fecha
  const onKeyDown = (e) => {
    if (e.key === "Tab") return setOpen(false);
    if (e.key === "Escape" && open) {
      e.preventDefault();
      e.stopPropagation();
      return setOpen(false);
    }
    if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) e.preventDefault();
    else return;
    if (!open) return openList();
    if (e.key === "Enter" || e.key === " ") return pick(options[active]);
    const step = e.key === "ArrowDown" ? 1 : -1;
    for (let i = active + step; i >= 0 && i < options.length; i += step) {
      if (!options[i].disabled) return setActive(i);
    }
  };

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={onKeyDown}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        className={`flex cursor-pointer items-center justify-between gap-2 text-left disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
      >
        {/* todas as opções empilhadas e invisíveis: a largura fica a da maior, como no <select> nativo */}
        <span className="grid min-w-0">
          {[selected?.label ?? placeholder, ...options.map((o) => o.label)].map((label, i) => (
            <span
              key={i}
              aria-hidden={i > 0 || undefined}
              className={`col-start-1 row-start-1 truncate ${i > 0 ? "invisible h-0" : ""}`}
            >
              {label}
            </span>
          ))}
        </span>
        <FaChevronDown className={`shrink-0 text-[0.7em] opacity-60 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {name && <input type="hidden" name={name} value={current ?? ""} />}

      {open &&
        pos &&
        createPortal(
          <ul
            ref={listRef}
            role="listbox"
            style={pos}
            className="fixed z-[999] overflow-y-auto rounded-xl border border-[var(--low-gray)] bg-[var(--background)] py-1 text-[var(--foreground)] shadow-xl"
          >
            {options.map((o, i) => {
              const isSel = String(o.value) === String(current);
              return (
                <li
                  key={String(o.value)}
                  role="option"
                  aria-selected={isSel}
                  aria-disabled={o.disabled || undefined}
                  onMouseEnter={() => !o.disabled && setActive(i)}
                  onClick={() => pick(o)}
                  className={`flex items-center gap-3 px-4 py-2.5 text-sm transition ${
                    o.disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
                  } ${i === active && !o.disabled ? "bg-[var(--translucid)]" : ""}`}
                >
                  <span className="min-w-0 flex-1">
                    <span className={`block ${isSel ? "font-semibold" : ""}`}>{o.label}</span>
                    {o.hint && <span className="block text-xs opacity-60">{o.hint}</span>}
                  </span>
                  {isSel && <FaCheck className="shrink-0 text-xs text-brand-select" />}
                </li>
              );
            })}
          </ul>,
          document.body,
        )}
    </>
  );
}
