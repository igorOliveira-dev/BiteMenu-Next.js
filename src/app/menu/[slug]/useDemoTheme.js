"use client";

import { useEffect, useMemo, useState } from "react";

// Só o cardápio de exemplo da landing segue o tema claro/escuro do site, com as cores da identidade visual.
// A página é ISR (sem cookies/searchParams), então o tema é aplicado no cliente.
const DEMO_COLORS = {
  light: {
    background_color: "#fbf5ef",
    title_color: "#7b1730",
    details_color: "#d42020",
  },
  dark: {
    background_color: "#1c1716",
    title_color: "#f0605a",
    details_color: "#d42020",
  },
};

// mesma regra do site: escolha salva pelo ThemeToggle, senão o tema do sistema
const siteTheme = () => {
  try {
    const saved = localStorage.getItem("theme");
    if (saved === "light" || saved === "dark") return saved;
  } catch {}
  return matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

export default function useDemoTheme(menu, enabled) {
  const [theme, setTheme] = useState(null);

  useEffect(() => {
    if (!enabled) return;
    const update = () => {
      const t = siteTheme();
      setTheme(t);
      // variáveis do globals.css (translúcidos etc.) acompanham o mesmo tema
      document.documentElement.setAttribute("data-theme", t);
    };
    update();
    const mq = matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener("change", update);
    // "storage" dispara quando o tema muda em outra aba ou na landing que contém o iframe
    window.addEventListener("storage", update);
    return () => {
      mq.removeEventListener("change", update);
      window.removeEventListener("storage", update);
    };
  }, [enabled]);

  return useMemo(() => (enabled && theme ? { ...menu, ...DEMO_COLORS[theme] } : menu), [menu, enabled, theme]);
}
