"use client";
import React, { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { FaTimes } from "react-icons/fa";
import { useCartContext } from "@/contexts/CartContext";

/**
 * CartDrawer with swipe-to-close on mobile and slide-from-right on desktop.
 */
export default function CartDrawer({ open, onClose, translucidToUse, grayToUse, foregroundToUse, bgColor }) {
  const cart = useCartContext();

  const DURATION = 300; // ms (sincronizar com duration-300)
  const MOUNT_DELAY = 20; // ms

  // montagem/visibilidade para controlar animação
  const [isMounted, setIsMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  // isDesktop inicial síncrono para evitar jump
  const [isDesktop, setIsDesktop] = useState(() => (typeof window === "undefined" ? false : window.innerWidth >= 640));

  const timeoutRef = useRef(null);
  const mountTimeoutRef = useRef(null);

  // touch/drag refs & state (mobile)
  const panelRef = useRef(null);
  const startYRef = useRef(0);
  const draggingRef = useRef(false);
  const [dragOffset, setDragOffset] = useState(0);

  // resize listener
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onResize = () => setIsDesktop(window.innerWidth >= 640);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // mount/visibility logic
  useEffect(() => {
    if (open) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (mountTimeoutRef.current) {
        clearTimeout(mountTimeoutRef.current);
        mountTimeoutRef.current = null;
      }

      setIsMounted(true);
      setIsVisible(false);

      mountTimeoutRef.current = setTimeout(() => {
        setIsVisible(true);
        mountTimeoutRef.current = null;
      }, MOUNT_DELAY);

      return;
    }

    if (!open && isMounted) {
      setIsVisible(false);
      timeoutRef.current = setTimeout(() => {
        setIsMounted(false);
        timeoutRef.current = null;
      }, DURATION);
    }
  }, [open, isMounted]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (mountTimeoutRef.current) clearTimeout(mountTimeoutRef.current);
    };
  }, []);

  if (!isMounted) return null;

  // base classes
  const basePanelClasses =
    "ml-auto absolute bottom-0 sm:right-0 w-full h-[90dvh] rounded-t-3xl sm:rounded-none sm:h-full sm:w-[480px] p-4 overflow-auto scrollbar-none z-60 transform transition-transform duration-300 ease-in-out";

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

  const panelBaseStyle = {
    backgroundColor: bgColor,
    color: foregroundToUse,
    willChange: "transform, opacity",
  };

  // --- TOUCH HANDLERS (mobile swipe down) ---
  const handleTouchStart = (e) => {
    if (isDesktop) return;
    if (!e.touches || e.touches.length === 0) return;
    draggingRef.current = true;
    startYRef.current = e.touches[0].clientY;
    setDragOffset(0);
  };

  const handleTouchMove = (e) => {
    if (isDesktop) return;
    if (!draggingRef.current) return;
    if (!e.touches || e.touches.length === 0) return;

    const currentY = e.touches[0].clientY;
    const deltaY = currentY - startYRef.current;

    // só considerar arrasto para baixo
    if (deltaY > 0) {
      // limita para não extrapolar demais (opcional)
      const maxOffset = (panelRef.current?.clientHeight || window.innerHeight) * 0.9;
      const offset = Math.min(deltaY, maxOffset);
      setDragOffset(offset);
    } else {
      setDragOffset(0);
    }
  };

  const handleTouchEnd = () => {
    if (isDesktop) return;
    if (!draggingRef.current) return;
    draggingRef.current = false;

    const panelHeight = panelRef.current?.clientHeight || window.innerHeight;
    const threshold = Math.min(120, panelHeight * 0.25); // 25% ou 120px

    if (dragOffset >= threshold) {
      // fecha
      setDragOffset(0);
      if (typeof onClose === "function") onClose();
    } else {
      // anima de volta: set dragOffset=0; CSS transition fará o retorno suave
      setDragOffset(0);
    }
  };

  // compute inline style for panel when mobile dragging
  const mobileTransformStyle = (() => {
    if (isDesktop) return {};
    // if dragging (dragOffset > 0) -> inline transform follows finger (disable transition)
    if (dragOffset > 0 && draggingRef.current) {
      return {
        transform: `translateY(${dragOffset}px)`,
        transition: "none",
      };
    }
    // if dragOffset > 0 but not dragging (release) -> animate back using CSS transition
    if (dragOffset > 0 && !draggingRef.current) {
      return {
        transform: `translateY(0px)`,
        transition: `transform ${DURATION}ms ease-in-out`,
      };
    }
    // otherwise, let tailwind classes control transform (enter/exit)
    return {};
  })();

  return createPortal(
    <div className="fixed inset-0 z-50 flex">
      {/* backdrop */}
      <div
        className={backdropClasses}
        onClick={() => {
          if (typeof onClose === "function") onClose();
        }}
        aria-hidden="true"
      />

      {/* drawer */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Carrinho"
        className={`${basePanelClasses} ${transformClass}`}
        style={{
          ...panelBaseStyle,
          ...(isDesktop ? {} : mobileTransformStyle),
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">
            Seu carrinho ({typeof cart.totalItems === "function" ? cart.totalItems() : cart.items?.length || 0})
          </h3>
          <button
            onClick={() => {
              if (typeof onClose === "function") onClose();
            }}
            className="cursor-pointer text-xl"
            aria-label="Fechar carrinho"
          >
            <FaTimes />
          </button>
        </div>

        {cart.items.length === 0 ? (
          <div className="py-10 text-center" style={{ color: grayToUse }}>
            Carrinho vazio
          </div>
        ) : (
          <div className="space-y-4">
            {cart.items.map((it, idx) => {
              const addonsTotal = (it.additionals || []).reduce((s, a) => s + Number(a.price || 0), 0);
              return (
                <div key={idx} className="p-3 border rounded flex flex-col">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <div>
                        <span className="truncate min-w-0 max-w-[280px]">{it.name}</span>
                        <span style={{ color: grayToUse, fontWeight: 400 }} className="ml-2">
                          {it.qty}x
                        </span>
                      </div>
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
                    <p className="font-bold text-xl">R${((it.price + addonsTotal) * it.qty).toFixed(2)}</p>
                    <button
                      onClick={() => cart.remove(idx)}
                      className="cursor-pointer text-white bg-red-600 opacity-75 hover:opacity-100 py-1 px-2 text-sm flex items-center gap-2 rounded-lg"
                    >
                      Remover
                    </button>
                  </div>
                </div>
              );
            })}

            <div className="pt-4 border-t flex items-center justify-between">
              <div className="font-semibold">Total</div>
              <div className="text-xl font-bold">R$ {cart.totalPrice().toFixed(2)}</div>
            </div>

            <div className="pt-4 flex gap-2">
              <button
                onClick={() => {
                  /* integrar checkout aqui */
                }}
                className="flex-1 py-2 rounded bg-green-600 text-white font-bold"
              >
                Finalizar compra
              </button>
              <button onClick={() => cart.clear()} className="py-2 px-4 rounded border">
                Limpar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
