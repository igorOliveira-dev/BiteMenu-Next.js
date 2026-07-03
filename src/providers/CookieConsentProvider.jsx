"use client";

import { createContext, useContext, useEffect, useState } from "react";

const CookieConsentContext = createContext(null);

export function CookieConsentProvider({ children }) {
  const [consent, setConsentState] = useState(null);
  const [bannerHeight, setBannerHeight] = useState(0);

  useEffect(() => {
    const saved = localStorage.getItem("cookie-consent");
    if (saved === "granted" || saved === "denied") {
      setConsentState(saved);
    }
  }, []);

  function setConsent(value) {
    if (value !== null) {
      localStorage.setItem("cookie-consent", value);
    } else {
      localStorage.removeItem("cookie-consent");
    }
    setConsentState(value);
  }

  return (
    <CookieConsentContext.Provider value={{ consent, setConsent, bannerHeight, setBannerHeight }}>
      {children}
    </CookieConsentContext.Provider>
  );
}

export function useCookieConsent() {
  const ctx = useContext(CookieConsentContext);
  if (!ctx) throw new Error("useCookieConsent precisa estar dentro de CookieConsentProvider");
  return ctx;
}
