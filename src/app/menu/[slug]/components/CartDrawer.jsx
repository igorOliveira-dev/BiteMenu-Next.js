"use client";
import React, { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { FaChevronLeft, FaTimes } from "react-icons/fa";
import { useCartContext } from "@/contexts/CartContext";
import { useConfirm } from "@/providers/ConfirmProvider";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import { supabase } from "@/lib/supabaseClient";
import { useAlert } from "@/providers/AlertProvider";

function getContrastTextColor(hex) {
  const cleanHex = (hex || "#ffffff").replace("#", "");
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? "black" : "white";
}

export default function CartDrawer({ menu, open, onClose, translucidToUse, grayToUse, foregroundToUse, bgColor, isOpen }) {
  const cart = useCartContext();
  const confirm = useConfirm();
  const customAlert = useAlert();

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

  const [purchaseStage, setPurchaseStage] = useState("services");

  const [selectedService, setSelectedService] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [costumerName, setCostumerName] = useState("");
  const [costumerAddress, setCostumerAddress] = useState("");

  const [phone, setPhone] = useState("");

  const [originalPhone, setOriginalPhone] = useState("");
  const [saving, setSaving] = useState(false);

  const serviceOptions = [
    { id: "delivery", label: "Entrega" },
    { id: "pickup", label: "Retirada" },
    { id: "dinein", label: "Comer no local" },
    { id: "faceToFace", label: "Atendimento presencial" },
  ];

  const availableServiceOptions = serviceOptions.filter((option) => menu.services.includes(option.id));

  const paymentOptions = [
    { id: "cash", label: "Dinheiro" },
    { id: "debit", label: "Débito" },
    { id: "credit", label: "Crédito" },
    { id: "pix", label: "PIX" },
  ];

  const availablePaymentsOptions = paymentOptions.filter((option) => menu.payments.includes(option.id));

  useEffect(() => {
    if (availableServiceOptions.length < 2) {
      setSelectedService(availableServiceOptions[0]?.id || null);
    }
  }, [menu]);

  useEffect(() => {
    if (selectedService != null) {
      setPurchaseStage("costumerInfos");
    }
  }, [selectedService]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onResize = () => setIsDesktop(window.innerWidth >= 640);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

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

  const handleTouchStart = (e) => {
    if (isDesktop) return;
    if (!e.touches?.length) return;
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

  const resetPurchase = () => {
    setIsPurchaseModalOpen(false);
    setPurchaseStage("services");
    setSelectedService(null);
    setPhone("");
    setOriginalPhone("");
  };

  const handleServiceSelect = (id) => {
    setSelectedService(id);
  };

  const handleSavePhone = async () => {
    try {
      const rawValue = `+${phone}`;
      const phoneNumber = parsePhoneNumberFromString(rawValue);
      if (!phoneNumber || !phoneNumber.isValid()) {
        customAlert("Telefone inválido.", "error");
        return;
      }
      const fullPhone = phoneNumber.number.replace(/^\+/, "");
      setSaving(true);
      const { error } = await supabase.from("profiles").update({ phone: fullPhone }).eq("id", supabase.auth.getUser()?.id);
      if (error) {
        console.error(error.message);
        customAlert("Não foi possível atualizar o telefone.", "error");
      } else {
        customAlert("Telefone atualizado com sucesso!", "success");
        setOriginalPhone(phone);
      }
    } catch (err) {
      console.error(err);
      customAlert("Erro inesperado ao salvar telefone.", "error");
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex">
      <div className={backdropClasses} onClick={() => onClose?.()} aria-hidden="true" />

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
        {/* HEADER */}
        <div className="sticky top-0 bg-inherit z-10 flex items-center justify-between p-4">
          <h3 className="text-lg font-bold">
            Seu carrinho ({typeof cart.totalItems === "function" ? cart.totalItems() : cart.items?.length || 0})
          </h3>
          <button onClick={() => onClose?.()} className="cursor-pointer text-xl" aria-label="Fechar carrinho">
            <FaTimes />
          </button>
        </div>

        {/* ITENS */}
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

        {/* FOOTER */}
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
                onClick={() => {
                  if (!isOpen) {
                    customAlert(`${menu.title} está fechado no momento!`);
                    return;
                  }
                  setIsPurchaseModalOpen(true);
                }}
                className="cursor-pointer flex-1 py-2 rounded hover:opacity-90 text-white font-bold transition"
                style={{ backgroundColor: menu.details_color, color: getContrastTextColor(menu.details_color) }}
              >
                Continuar compra
              </button>
              <button
                onClick={async () => {
                  const ok = await confirm("Quer mesmo limpar o carrinho?");
                  if (!ok) return;
                  cart.clear();
                }}
                className="cursor-pointer py-2 px-4 rounded border opacity-75 hover:opacity-100 transition"
              >
                Limpar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL DE COMPRA */}
      {isPurchaseModalOpen && (
        <div className="fixed inset-0 z-65 flex items-center justify-center" style={{ color: foregroundToUse }}>
          <div className={backdropClasses} aria-hidden="true" onClick={() => resetPurchase()} />
          <div
            className="rounded-lg p-6 w-[90%] max-w-md z-70"
            onClick={(e) => e.stopPropagation()}
            style={{ backgroundColor: bgColor }}
          >
            <div className="flex items-center gap-4 mb-4">
              <FaChevronLeft onClick={() => resetPurchase()} />
              <h3 className="font-bold">
                {purchaseStage === "services"
                  ? "Como deseja realizar o pedido?"
                  : purchaseStage === "costumerInfos"
                  ? "Confirmar compra"
                  : null}
              </h3>
            </div>

            {/* ETAPAS */}
            {purchaseStage === "services" ? (
              <div className="flex flex-col gap-2">
                {availableServiceOptions.map((option) => (
                  <button
                    key={option.id}
                    className="cursor-pointer p-2 hover:opacity-90 transition rounded-lg font-semibold"
                    style={{ backgroundColor: menu.details_color, color: getContrastTextColor(menu.details_color) }}
                    onClick={() => handleServiceSelect(option.id)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            ) : purchaseStage === "costumerInfos" ? (
              <div className="flex flex-col gap-2">
                <div>
                  <label className="block text-sm font-medium">Digite seu nome:</label>
                  <input
                    type="text"
                    placeholder="Nome"
                    value={costumerName}
                    onChange={(e) => {
                      setCostumerName(e.target.value);
                    }}
                    maxLength={40}
                    className="w-full p-2 rounded mb-2"
                    style={{ backgroundColor: translucidToUse }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">Digite seu número para contato:</label>
                  <PhoneInput
                    country="br"
                    value={phone}
                    onChange={(value) => setPhone(value)}
                    inputProps={{ required: true }}
                    inputClass="!w-full !px-3 !py-2 !border !rounded !focus:outline-none !focus:ring-2 !focus:ring-blue-400 !pl-14"
                    buttonClass="!border-r !bg-transparent !rounded-l"
                    containerClass="!flex !items-center !mb-2"
                    inputStyle={{
                      backgroundColor: translucidToUse,
                    }}
                  />
                </div>
                {selectedService === "delivery" && (
                  <div>
                    <label className="block text-sm font-medium">Digite seu endereço:</label>
                    <input
                      type="text"
                      placeholder="Endereço"
                      value={costumerAddress}
                      onChange={(e) => {
                        setCostumerAddress(e.target.value);
                      }}
                      maxLength={40}
                      className="w-full p-2 rounded mb-2"
                      style={{ backgroundColor: translucidToUse }}
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium">Forma de pagamento:</label>
                  <div className="flex flex-wrap gap-4 mt-1">
                    {availablePaymentsOptions.map((option) => (
                      <label key={option.id} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          name="payment"
                          value={option.id}
                          checked={selectedPayment === option.id}
                          onChange={() => setSelectedPayment(option.id)}
                          className="peer appearance-none w-6 h-6 border-2 rounded-full transition-all duration-150 flex items-center justify-center relative"
                          style={{
                            borderColor: menu.details_color,
                            backgroundColor: selectedPayment === option.id ? menu.details_color : "transparent",
                          }}
                        />
                        <span
                          className="relative after:content-['✓'] after:absolute after:text-white after:text-sm after:font-bold after:top-[3px] after:left-[-25px] peer-checked:after:opacity-100 after:opacity-0 transition-opacity duration-150"
                          style={{ color: "var(--gray)" }}
                        >
                          {option.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
                <button
                  className="p-2 font-bold"
                  style={{ backgroundColor: menu.details_color, color: getContrastTextColor(menu.details_color) }}
                >
                  Confirmar
                </button>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>,
    document.body
  );
}
