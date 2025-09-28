"use client";
import React, { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { FaTimes } from "react-icons/fa";
import { useCartContext } from "@/contexts/CartContext";

export default function CartDrawer({ open, onClose, translucidToUse, grayToUse, foregroundToUse, bgColor }) {
  const cart = useCartContext();

  const DURATION = 300;
  const MOUNT_DELAY = 20;

  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);

  const [isMounted, setIsMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isDesktop, setIsDesktop] = useState(() => (typeof window === "undefined" ? false : window.innerWidth >= 640));

  const timeoutRef = useRef(null);
  const mountTimeoutRef = useRef(null);

  const panelRef = useRef(null);
  const startYRef = useRef(0);
  const draggingRef = useRef(false);
  const [dragOffset, setDragOffset] = useState(0);

  // resize
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onResize = () => setIsDesktop(window.innerWidth >= 640);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // mount/unmount
  useEffect(() => {
    if (open) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (mountTimeoutRef.current) clearTimeout(mountTimeoutRef.current);

      setIsMounted(true);
      setIsVisible(false);

      mountTimeoutRef.current = setTimeout(() => setIsVisible(true), MOUNT_DELAY);
      return;
    }

    if (!open && isMounted) {
      setIsVisible(false);
      timeoutRef.current = setTimeout(() => setIsMounted(false), DURATION);
    }
  }, [open, isMounted]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (mountTimeoutRef.current) clearTimeout(mountTimeoutRef.current);
    };
  }, []);

  // lock body scroll
  useEffect(() => {
    if (typeof window === "undefined") return;
    const docEl = document.documentElement;
    const body = document.body;
    const scrollY = window.scrollY || window.pageYOffset;

    if (open) {
      body.dataset.scrollY = scrollY;
      docEl.style.overscrollBehavior = "none";
      body.style.overscrollBehavior = "none";
      body.style.position = "fixed";
      body.style.top = `-${scrollY}px`;
      body.style.width = "100%";
    } else {
      docEl.style.overscrollBehavior = "";
      body.style.overscrollBehavior = "";
      body.style.position = "";
      body.style.top = "";
      body.style.width = "";
      const prevY = parseInt(body.dataset.scrollY || "0", 10);
      window.scrollTo(0, prevY);
      delete body.dataset.scrollY;
    }
  }, [open]);

  if (!isMounted) return null;

  // swipe handlers
  const handleTouchStart = (e) => {
    if (isDesktop) return;
    if (!e.touches?.length) return;

    // só ativa swipe se o toque começar fora da lista (header/footer/backdrop)
    if (e.target.closest(".cart-scrollable")) return;

    draggingRef.current = true;
    startYRef.current = e.touches[0].clientY;
    setDragOffset(0);
  };

  const handleTouchMove = (e) => {
    if (isDesktop || !draggingRef.current) return;
    const currentY = e.touches[0].clientY;
    const deltaY = currentY - startYRef.current;
    if (deltaY > 0) {
      const maxOffset = (panelRef.current?.clientHeight || window.innerHeight) * 0.9;
      setDragOffset(Math.min(deltaY, maxOffset));
    }
  };

  const handleTouchEnd = () => {
    if (isDesktop || !draggingRef.current) return;
    draggingRef.current = false;
    const panelHeight = panelRef.current?.clientHeight || window.innerHeight;
    const threshold = Math.min(120, panelHeight * 0.25);
    if (dragOffset >= threshold) {
      setDragOffset(0);
      onClose?.();
    } else {
      setDragOffset(0);
    }
  };

  const basePanelClasses =
    "ml-auto absolute bottom-0 sm:right-0 w-full h-[90dvh] rounded-t-3xl sm:rounded-none sm:h-full sm:w-[480px] flex flex-col z-60 transform transition-transform duration-300 ease-in-out";

  const transformClass = isDesktop
    ? isVisible
      ? "translate-x-0"
      : "translate-x-full"
    : isVisible
    ? "translate-y-0"
    : "translate-y-full";

  const backdropClasses = `absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
    isVisible ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
  }`;

  const panelStyle = {
    backgroundColor: bgColor,
    color: foregroundToUse,
    willChange: "transform, opacity",
    ...(dragOffset > 0 && draggingRef.current
      ? { transform: `translateY(${dragOffset}px)`, transition: "none" }
      : dragOffset > 0
      ? { transform: `translateY(0px)`, transition: `transform ${DURATION}ms ease-in-out` }
      : {}),
  };

  const continuePurchase = () => {
    setIsPurchaseModalOpen(true);
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex">
      {/* backdrop */}
      <div className={backdropClasses} onClick={() => onClose?.()} aria-hidden="true" />

      {/* drawer */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Carrinho"
        className={`${basePanelClasses} ${transformClass}`}
        style={panelStyle}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
      >
        {/* header fixo */}
        <div className="sticky top-0 bg-inherit z-10 flex items-center justify-between p-4">
          <h3 className="text-lg font-bold">
            Seu carrinho ({typeof cart.totalItems === "function" ? cart.totalItems() : cart.items?.length || 0})
          </h3>
          <button onClick={() => onClose?.()} className="cursor-pointer text-xl" aria-label="Fechar carrinho">
            <FaTimes />
          </button>
        </div>

        {/* scrollável só os itens */}
        <div className="overflow-y-auto cart-scrollable px-4 space-y-4 py-4 mb-[110px]">
          {cart.items.length === 0 ? (
            <div className="py-10 text-center" style={{ color: grayToUse }}>
              Carrinho vazio
            </div>
          ) : (
            cart.items.map((it, idx) => {
              const addonsTotal = (it.additionals || []).reduce((s, a) => s + Number(a.price || 0), 0);
              return (
                <div key={idx} className="p-3 rounded-xl flex flex-col" style={{ backgroundColor: translucidToUse }}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline">
                      <span className="truncate min-w-0 max-w-[280px]">{it.name}</span>
                      <span style={{ color: grayToUse }} className="ml-1">
                        {it.qty}x
                      </span>
                    </div>
                    {it.additionals?.length > 0 && (
                      <div className="text-sm line-clamp-2" style={{ color: grayToUse }}>
                        + {it.additionals.map((a) => a.name).join(", ")}
                      </div>
                    )}
                    {it.note && (
                      <div className="text-sm mt-1 line-clamp-2" style={{ color: grayToUse }}>
                        Obs: {it.note}
                      </div>
                    )}
                  </div>
                  <div className="flex items-end justify-between mt-4 gap-2">
                    <p className="font-bold text-xl">
                      {((it.price + addonsTotal) * it.qty).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </p>
                    <button
                      onClick={() => cart.remove(idx)}
                      className="cursor-pointer text-white bg-red-600 opacity-75 hover:opacity-100 py-1 px-2 text-sm flex items-center gap-2 rounded-lg"
                    >
                      Remover
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* footer fixo */}
        {cart.items.length > 0 && (
          <div className="fixed w-full bottom-0 bg-inherit z-10 p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold">Total</div>
              <div className="text-xl font-bold">
                {cart.totalPrice().toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => continuePurchase()}
                className="cursor-pointer flex-1 py-2 rounded bg-green-600 hover:bg-green-700 text-white font-bold transition"
              >
                Continuar compra
              </button>
              <button
                onClick={() => cart.clear()}
                className="cursor-pointer py-2 px-4 rounded border opacity-75 hover:opacity-100 transition"
              >
                Limpar
              </button>
            </div>
          </div>
        )}
      </div>

      {isPurchaseModalOpen && (
        <div className="fixed inset-0 z-65 flex items-center justify-center">
          {/* backdrop */}
          <div className={backdropClasses} aria-hidden="true" />

          <div className="rounded-lg p-6 w-[90%] max-w-md z-70" style={{ backgroundColor: bgColor }}>
            <h2 className="text-xl font-bold mb-4">Confirmar Compra</h2>
            <p>Deseja continuar com a compra?</p>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setIsPurchaseModalOpen(false)} className="px-4 py-2 rounded border">
                Cancelar
              </button>
              <button
                onClick={() => {
                  setIsPurchaseModalOpen(false);
                  console.log("Compra confirmada!");
                  // Aqui você pode adicionar a lógica de finalizar compra
                }}
                className="px-4 py-2 bg-green-600 text-white rounded"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>,

    document.body
  );
}
