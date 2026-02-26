"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function PWAGuard() {
  const pathname = usePathname();

  useEffect(() => {
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone === true;

    if (isStandalone && pathname.startsWith("/menu")) {
      window.open(window.location.origin + pathname, "_blank");
    }
  }, [pathname]);

  return null;
}
