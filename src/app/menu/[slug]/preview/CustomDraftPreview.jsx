"use client";

import { useEffect, useState } from "react";
import ClientMenuCustom from "../ClientMenuCustom";
import { cleanLayout } from "@/lib/customLayout";

// Prévia ao vivo do layout personalizado: a aba do dashboard (CustomLayout.jsx) manda o rascunho por postMessage.
// Só aceita mensagem da mesma origem, e o rascunho passa pelo mesmo cleanLayout do cardápio público.
export default function CustomDraftPreview({ menu, ownerPhone, ownerRole }) {
  const [layout, setLayout] = useState(null);

  useEffect(() => {
    const onMessage = (e) => {
      if (e.origin !== window.location.origin || e.data?.type !== "bm-layout-draft") return;
      setLayout(cleanLayout(e.data.layout));
    };
    window.addEventListener("message", onMessage);
    window.parent?.postMessage({ type: "bm-layout-ready" }, window.location.origin);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  if (!layout) return null;
  return <ClientMenuCustom menu={{ ...menu, custom_layout: layout }} ownerPhone={ownerPhone} ownerRole={ownerRole} />;
}
