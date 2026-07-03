"use client";

import { useEffect, useRef } from "react";
import { useCookieConsent } from "@/providers/CookieConsentProvider";
import { useThemeColor } from "@/providers/ThemeColorProvider";

function getContrastTextColor(hex) {
  const clean = (hex || "#171717").replace("#", "");
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? "#171717" : "#fafafa";
}

export default function CookieBanner() {
  const { consent, setConsent, setBannerHeight } = useCookieConsent();
  const { colors } = useThemeColor();
  const bannerRef = useRef(null);

  useEffect(() => {
    if (consent !== null) {
      setBannerHeight(0);
      document.body.style.paddingBottom = "";
      return;
    }

    const el = bannerRef.current;
    if (!el) return;

    const update = () => {
      const height = el.offsetHeight;
      setBannerHeight(height);
      document.body.style.paddingBottom = `${height}px`;
    };

    update();

    const observer = new ResizeObserver(update);
    observer.observe(el);

    return () => {
      observer.disconnect();
    };
  }, [consent, setBannerHeight]);

  // garante que o padding some se o componente for desmontado com banner visível
  useEffect(() => {
    return () => {
      document.body.style.paddingBottom = "";
    };
  }, []);

  if (consent !== null) return null;

  const bg = colors?.background || "#171717";
  const accent = colors?.details || "#ffffff";
  const textColor = getContrastTextColor(bg);
  const accentTextColor = getContrastTextColor(accent);

  return (
    <div
      ref={bannerRef}
      className="fixed bottom-0 left-0 right-0 z-150 p-4 flex flex-col sm:flex-row items-center gap-3 justify-between shadow-[0_-2px_10px_rgba(0,0,0,0.15)]"
      style={{ backgroundColor: bg, color: textColor, transition: "opacity 0.15s ease" }}
    >
      <p className="text-sm text-center sm:text-left">
        Usamos cookies para entender como você usa o cardápio e melhorar sua experiência.{" "}
        <a href="/politica-de-privacidade" className="underline">
          Saiba mais
        </a>
        .
      </p>
      <div className="flex gap-2 shrink-0">
        <button
          onClick={() => setConsent("denied")}
          className="cursor-pointer hover:opacity-80 transition-opacity px-4 py-2 rounded-md border text-sm"
          style={{ borderColor: `${textColor}55` }}
        >
          Recusar
        </button>
        <button
          onClick={() => setConsent("granted")}
          className="cursor-pointer hover:opacity-80 transition-opacity px-4 py-2 rounded-md text-sm font-medium"
          style={{ backgroundColor: accent, color: accentTextColor }}
        >
          Aceitar
        </button>
      </div>
    </div>
  );
}
