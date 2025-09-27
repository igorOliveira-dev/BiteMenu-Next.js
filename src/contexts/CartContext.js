"use client";
import React, { createContext, useReducer, useContext, useEffect } from "react";
import { useConfirm } from "@/providers/ConfirmProvider";

const CartContext = createContext(null);
const STORAGE_KEY = "bite_menu_cart_v1";

function cartReducer(state, action) {
  switch (action.type) {
    case "SET":
      return action.payload;
    case "ADD_ITEM": {
      const incoming = action.payload;
      // tenta achar item igual (mesmo id + mesmos adicionais + mesma nota)
      const equal = (a, b) =>
        a.id === b.id &&
        JSON.stringify(a.additionals || []) === JSON.stringify(b.additionals || []) &&
        (a.note || "") === (b.note || "");
      let found = false;
      const items = state.items.map((it) => {
        if (equal(it, incoming)) {
          found = true;
          return { ...it, qty: it.qty + incoming.qty };
        }
        return it;
      });
      if (!found) items.push(incoming);
      return { ...state, items };
    }
    case "UPDATE_QTY": {
      const { key, qty } = action.payload; // key = index or unique id
      const items = state.items.map((it, idx) => (idx === key ? { ...it, qty } : it)).filter((it) => it.qty > 0);
      return { ...state, items };
    }
    case "REMOVE": {
      const key = action.payload;
      const items = state.items.filter((_, idx) => idx !== key);
      return { ...state, items };
    }
    case "CLEAR":
      return { items: [] };
    default:
      return state;
  }
}

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [] });

  // carregar do localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        dispatch({ type: "SET", payload: JSON.parse(raw) });
      }
    } catch (e) {
      console.warn("Cart load fail", e);
    }
  }, []);

  // salvar no localStorage sempre que muda
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn("Cart save fail", e);
    }
  }, [state]);

  const api = {
    items: state.items,
    addItem: (item) => {
      // garantia: normalize item
      const normalized = {
        id: item.id,
        name: item.name,
        price: Number(item.price || 0),
        qty: Number(item.qty || 1),
        additionals: item.additionals || [],
        note: item.note || "",
      };
      dispatch({ type: "ADD_ITEM", payload: normalized });
    },
    updateQty: (key, qty) => dispatch({ type: "UPDATE_QTY", payload: { key, qty: Math.max(0, qty) } }),
    remove: (key) => dispatch({ type: "REMOVE", payload: key }),
    clear: () => dispatch({ type: "CLEAR" }),
    totalItems: () => state.items.reduce((s, it) => s + it.qty, 0),
    totalPrice: () =>
      state.items.reduce(
        (s, it) =>
          s + it.qty * (Number(it.price || 0) + (it.additionals || []).reduce((a, b) => a + Number(b.price || 0), 0)),
        0
      ),
  };

  return <CartContext.Provider value={api}>{children}</CartContext.Provider>;
}

export function useCartContext() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCartContext must be used inside CartProvider");
  return ctx;
}
