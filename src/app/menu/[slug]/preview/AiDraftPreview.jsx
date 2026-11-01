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

  if (draft.layout?.after) next.layout = draft.layout.after;

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

  // ocultar/exibir: categoria vale pra todos os produtos dela; grupo some do produto
  const vis = draft.visibility || [];
  const catVisible = Object.fromEntries(vis.filter((v) => v.kind === "category").map((v) => [v.id, v.visible]));
  const itemVisible = Object.fromEntries(vis.filter((v) => v.kind === "item").map((v) => [v.id, v.visible]));
  const hiddenGroups = new Set(vis.filter((v) => v.kind === "group" && !v.visible).flatMap((v) => v.groupIds));
  // nome/descrição/preço/promoção editados
  const edits = Object.fromEntries((draft.itemEdits || []).map((e) => [e.itemId, e.fields || {}]));
  const applyFields = (it) => {
    const f = edits[it.id];
    if (!f) return it;
    return {
      ...it,
      ...(f.name && { name: f.name.after }),
      ...(f.description && { description: f.description.after }),
      ...(f.price && { price: f.price.after }),
      ...(f.promoPrice && { promo_price: f.promoPrice.after }),
      ...(f.starred && { starred: f.starred.after }),
    };
  };

  const categories = (menu.categories || []).map((c) => {
    const added = (draft.newItems || []).find((g) => g.id === c.id)?.items || [];
    return {
      ...c,
      menu_items: [
        ...(c.menu_items || []).map((it) => {
          let next = it.id in stockById ? { ...it, stock: stockById[it.id], visible: it.visible && stockById[it.id] !== 0 } : it;
          if (c.id in catVisible) next = { ...next, visible: catVisible[c.id] };
          if (it.id in itemVisible) next = { ...next, visible: itemVisible[it.id] };
          next = applyFields(next);
          if (hiddenGroups.size) {
            next = { ...next, option_groups: (next.option_groups || []).filter((g) => !hiddenGroups.has(g.id)) };
          }
          return next;
        }),
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

  // renomear categorias, mover produtos e nova ordem
  const renames = Object.fromEntries((draft.categoryEdits || []).map((c) => [c.id, c.after]));
  const moves = Object.fromEntries(
    (draft.itemEdits || []).filter((e) => e.fields?.category).map((e) => [e.itemId, e.fields.category]),
  );
  const catPos = Object.fromEntries((draft.order?.categories || []).map((c) => [c.id, c.position]));
  const itemPos = Object.fromEntries((draft.order?.items || []).map((it) => [it.id, it.position]));
  const moved = [];
  let result = categories.map((c) => ({
    ...c,
    name: renames[c.id] ?? c.name,
    position: catPos[c.id] ?? c.position,
    menu_items: c.menu_items.filter((it) => {
      if (moves[it.id] && moves[it.id].categoryId !== c.id) {
        moved.push({ ...it, position: moves[it.id].position, _to: moves[it.id].categoryId });
        return false;
      }
      return true;
    }),
  }));
  result = result.map((c) => {
    const items = [...c.menu_items, ...moved.filter((it) => it._to === c.id)].map((it) =>
      it.id in itemPos ? { ...it, position: itemPos[it.id] } : it,
    );
    return { ...c, menu_items: items.sort((a, b) => (a.position ?? 0) - (b.position ?? 0)) };
  });

  next.categories = result;
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
