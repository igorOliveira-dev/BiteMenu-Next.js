"use client";

import { useEffect, useState } from "react";
import ClientMenu from "../ClientMenu";
import ClientMenu2 from "../ClientMenu2";
import ClientMenu3 from "../ClientMenu3";
import { AI_PREVIEW_KEY } from "@/lib/assistant";

// estado local do dashboard -> colunas de menus
const CONFIG_COLUMNS = {
  title: "title",
  description: "description",
  selectedServices: "services",
  selectedPayments: "payments",
  deliveryFeeMode: "delivery_fee_mode",
  pixKey: "pix_key",
  hours: "hours",
  timezone: "timezone",
  backgroundColor: "background_color",
  titleColor: "title_color",
  detailsColor: "details_color",
};

const toNumberOrNull = (v) => (v === "" || v === null || v === undefined ? null : Number(v));

// Aplica a proposta do assistente sobre o cardápio salvo, só na tela (nada vai pro banco)
function applyDraft(menu, draft) {
  const next = { ...menu };

  for (const [key, column] of Object.entries(CONFIG_COLUMNS)) {
    if (key in (draft.changes || {})) next[column] = draft.changes[key];
  }
  if ("deliveryFee" in (draft.changes || {})) next.delivery_fee = toNumberOrNull(draft.changes.deliveryFee);
  if ("minimumOrderValue" in (draft.changes || {})) {
    next.minimum_order_value = toNumberOrNull(draft.changes.minimumOrderValue);
  }

  const stockById = Object.fromEntries((draft.stock || []).map((s) => [s.id, s.after]));
  const toItem = (it, i) => ({
    id: `ai-${Date.now()}-${i}-${it.name}`,
    name: it.name,
    description: it.description || "",
    price: it.price,
    promo_price: null,
    variations: it.variations ?? null,
    image_url: null,
    thumb_url: null,
    additionals: null,
    starred: false,
    mandatory_additional: false,
    additionals_limit: null,
    visible: true,
    stock: null,
    option_groups: [],
  });

  const categories = (menu.categories || []).map((c) => {
    const added = (draft.newItems || []).find((g) => g.id === c.id)?.items || [];
    return {
      ...c,
      menu_items: [
        ...(c.menu_items || []).map((it) => (it.id in stockById ? { ...it, stock: stockById[it.id] } : it)),
        ...added.map(toItem),
      ],
    };
  });

  const maxPos = categories.reduce((max, c) => Math.max(max, c.position ?? -1), -1);
  (draft.newItems || [])
    .filter((g) => !g.id)
    .forEach((g, i) => {
      categories.push({ id: `ai-cat-${i}`, name: g.name, position: g.position ?? maxPos + 1 + i, menu_items: g.items.map(toItem) });
    });

  next.categories = categories;
  return next;
}

export default function AiDraftPreview({ menu, ownerPhone, ownerRole }) {
  const [draftMenu, setDraftMenu] = useState(null);

  useEffect(() => {
    let draft = null;
    try {
      draft = JSON.parse(sessionStorage.getItem(AI_PREVIEW_KEY) || "null");
    } catch {}
    setDraftMenu(draft ? applyDraft(menu, draft) : menu);
  }, [menu]);

  if (!draftMenu) return null;

  const props = { menu: draftMenu, ownerPhone, ownerRole };
  if (draftMenu.layout === "list") return <ClientMenu2 {...props} />;
  if (draftMenu.layout === "grid") return <ClientMenu3 {...props} />;
  return <ClientMenu {...props} />;
}
