"use client";

import { useEffect, useState } from "react";

// Lê as cores dos gráficos das variáveis CSS do tema atual (o Chart.js não entende var()).
// Relê quando o tema muda pelo botão (data-theme) ou pelo sistema.
const read = () => {
  const s = getComputedStyle(document.documentElement);
  const v = (name) => s.getPropertyValue(name).trim();
  return {
    series: [1, 2, 3, 4, 5].map((i) => v(`--chart-${i}`)),
    ink: v("--gray"),
    grid: v("--translucid"),
    surface: v("--brand-surface"),
  };
};

export default function useChartColors() {
  const [colors, setColors] = useState(null);

  useEffect(() => {
    const update = () => setColors(read());
    update();
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    media.addEventListener("change", update);
    return () => {
      observer.disconnect();
      media.removeEventListener("change", update);
    };
  }, []);

  return colors;
}
