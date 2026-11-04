// src/contexts/CartContext.js
"use client";
import React, { createContext, useReducer, useContext, useEffect } from "react";

const CartContext = createContext(null);
const STORAGE_KEY = "bite_menu_cart_v1_multi";

function cartReducer(state, action) {
  switch (action.type) {
    // hydrated: o carrinho salvo já foi lido; antes disso não se grava nada (gravaria o vazio inicial por cima)
    case "SET":
      return { carts: action.payload?.carts || {}, hydrated: true };

    case "ADD_ITEM": {
      const { establishmentId, item } = action.payload;
      const prev = state.carts[establishmentId] || { items: [] };

      const equal = (a, b) =>
        a.id === b.id &&
        a.name === b.name && // variação vai no nome
        JSON.stringify(a.additionals || []) === JSON.stringify(b.additionals || []) &&
        (a.note || "") === (b.note || "");

      let found = false;
      const items = prev.items.map((it) => {
        if (equal(it, item)) {
          found = true;
          return { ...it, qty: it.qty + item.qty };
        }
        return it;
      });
      if (!found) items.push(item);

      return {
        ...state,
        carts: {
          ...state.carts,
          [establishmentId]: { items },
        },
      };
    }

    case "UPDATE_QTY": {
      // payload: { establishmentId, key, qty }
      const { establishmentId, key, qty } = action.payload;
      const prev = state.carts[establishmentId] || { items: [] };
      const items = prev.items.map((it, idx) => (idx === key ? { ...it, qty } : it)).filter((it) => it.qty > 0);

      const nextCarts = { ...state.carts };
      if (items.length === 0) {
        delete nextCarts[establishmentId];
      } else {
        nextCarts[establishmentId] = { items };
      }

      return { ...state, carts: nextCarts };
    }

    case "REMOVE": {
      // payload: { establishmentId, key }
      const { establishmentId, key } = action.payload;
      const prev = state.carts[establishmentId] || { items: [] };
      const items = prev.items.filter((_, idx) => idx !== key);

      const nextCarts = { ...state.carts };
      if (items.length === 0) {
        delete nextCarts[establishmentId];
      } else {
        nextCarts[establishmentId] = { items };
      }

      return { ...state, carts: nextCarts };
    }

    case "CLEAR": {
      // payload: { establishmentId }  // if no establishmentId -> clears all
      const { establishmentId } = action.payload || {};
      if (!establishmentId) {
        return { ...state, carts: {} };
      }
      const nextCarts = { ...state.carts };
      delete nextCarts[establishmentId];
      return { ...state, carts: nextCarts };
    }

    default:
      return state;
  }
}

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, { carts: {}, hydrated: false });

  useEffect(() => {
    let saved = null;
    try {
      saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    } catch (e) {
      console.warn("Cart load fail", e);
    }
    dispatch({ type: "SET", payload: saved }); // sempre, mesmo vazio: libera o salvamento
  }, []);

  // Outra aba mexeu no carrinho: puxa a versão dela (senão uma aba sobrescreve a outra)
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key !== STORAGE_KEY) return;
      try {
        dispatch({ type: "SET", payload: e.newValue ? JSON.parse(e.newValue) : null });
      } catch {}
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    if (!state.hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ carts: state.carts }));
    } catch (e) {
      console.warn("Cart save fail", e);
    }
  }, [state]);

  const getItems = (establishmentId) => {
    if (!establishmentId) return [];
    return (state.carts[establishmentId]?.items || []).slice();
  };

  const totalItems = (establishmentId) => (state.carts[establishmentId]?.items || []).reduce((s, it) => s + it.qty, 0);

  const totalPrice = (establishmentId) =>
    (state.carts[establishmentId]?.items || []).reduce(
      (s, it) => s + it.qty * (Number(it.price || 0) + (it.additionals || []).reduce((a, b) => a + Number(b.price || 0), 0)),
      0
    );

  const api = {
    raw: state,
    getItems,
    totalItems,
    totalPrice,
    addItem: (establishmentId, item) => {
      if (!establishmentId || !item) {
        console.error("addItem requires (establishmentId, item)");
        return;
      }
      const normalized = {
        id: item.id,
        name: item.name,
        image_url: item.image_url || null,
        price: Number(item.price || 0),
        qty: Number(item.qty || 1),
        additionals: item.additionals || [],
        note: item.note || "",
      };
      dispatch({ type: "ADD_ITEM", payload: { establishmentId, item: normalized } });
    },
    updateQty: (establishmentId, key, qty) => {
      if (!establishmentId) return;
      dispatch({ type: "UPDATE_QTY", payload: { establishmentId, key, qty: Math.max(0, qty) } });
    },
    remove: (establishmentId, key) => {
      if (!establishmentId) return;
      dispatch({ type: "REMOVE", payload: { establishmentId, key } });
    },
    clear: (establishmentId) => {
      dispatch({ type: "CLEAR", payload: establishmentId ? { establishmentId } : {} });
    },
    listEstablishments: () => Object.keys(state.carts),
  };

  return <CartContext.Provider value={api}>{children}</CartContext.Provider>;
}

export function useCartContext() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCartContext must be used inside CartProvider");
  return ctx;
}
