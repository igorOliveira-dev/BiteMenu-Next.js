"use client";

import Script from "next/script";
import { Suspense, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useCookieConsent } from "@/providers/CookieConsentProvider";

function GATracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (typeof window.gtag !== "function") return;

    window.gtag("config", "G-8EMPPK3PCK", {
      page_path: pathname + (searchParams.toString() ? `?${searchParams.toString()}` : ""),
    });
  }, [pathname, searchParams]);

  return null;
}

export default function GA() {
  const { consent } = useCookieConsent();

  if (consent !== "granted") return null;

  return (
    <>
      <Script src="https://www.googletagmanager.com/gtag/js?id=G-8EMPPK3PCK" strategy="afterInteractive" />

      <Script
        id="google-analytics"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            window.gtag = gtag;

            gtag('js', new Date());
            gtag('config', 'G-8EMPPK3PCK', { send_page_view: false });
          `,
        }}
      />

      <Suspense fallback={null}>
        <GATracker />
      </Suspense>
    </>
  );
}
