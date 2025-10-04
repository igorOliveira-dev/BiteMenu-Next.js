"use client";

import Script from "next/script";
import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export default function GA() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (typeof window.gtag !== "function") return;
    window.gtag("config", "G-8EMPPK3PCK", {
      page_path: pathname + (searchParams.toString() ? `?${searchParams.toString()}` : ""),
    });
  }, [pathname, searchParams]);

  return (
    <>
      <Script strategy="afterInteractive" src="https://www.googletagmanager.com/gtag/js?id=G-8EMPPK3PCK" />
      <Script
        id="google-analytics"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-8EMPPK3PCK', {
              page_path: window.location.pathname,
            });
          `,
        }}
      />
    </>
  );
}
