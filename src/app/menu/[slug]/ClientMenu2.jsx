"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { FaMapMarkerAlt, FaMinus, FaPlus, FaShoppingCart, FaWhatsapp } from "react-icons/fa";
import Image from "next/image";
import GenericModal from "@/components/GenericModal";
import { useCartContext } from "@/contexts/CartContext";
import CartDrawer from "./components/CartDrawer";
import { useAlert } from "@/providers/AlertProvider";
import MenuFooter from "./components/MenuFooter";
import { supabase } from "@/lib/supabaseClient";
import Loading from "@/components/Loading";
import useModalBackHandler from "@/hooks/useModalBackHandler";
import XButton from "@/components/XButton";

function getContrastTextColor(hex) {
  const DEFAULT_BACKGROUND = "#ffffff";
  const cleanHex = (hex || DEFAULT_BACKGROUND).replace("#", "");
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? "black" : "white";
}

function toMinutes(str) {
  const [h, m] = str.split(":").map(Number);
  return h * 60 + m;
}

function findScrollParent(el) {
  let parent = el.parentElement;
  while (parent) {
    const style = getComputedStyle(parent);
    const overflowY = style.overflowY;
    if ((overflowY === "auto" || overflowY === "scroll") && parent.scrollHeight > parent.clientHeight) {
      return parent;
    }
    parent = parent.parentElement;
  }
  return window;
}

function scrollToCategoryId(id, offset = 15) {
  const el = document.getElementById(id);
  if (!el) return false;
  const scrollable = findScrollParent(el);
  if (scrollable === window) {
    const elementTop = el.getBoundingClientRect().top + window.scrollY;
    const targetY = Math.max(0, elementTop - offset);
    window.scrollTo({ top: targetY, behavior: "smooth" });
  } else {
    const parentRect = scrollable.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    const relativeTop = elRect.top - parentRect.top + scrollable.scrollTop;
    const target = Math.max(0, relativeTop - offset);
    scrollable.scrollTo({ top: target, behavior: "smooth" });
  }
  try {
    history.replaceState(null, "", `#${id}`);
  } catch (e) {}
  try {
    el.setAttribute("tabindex", "-1");
    el.focus({ preventScroll: true });
  } catch (e) {}
  return true;
}

function isOpenNow(hours) {
  const now = new Date();
  const timeString = now.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" });
  const localNow = new Date(timeString);
  const day = localNow.toLocaleString("en-US", { weekday: "short" }).toLowerCase();
  const todayHours = hours?.[day] || null;
  if (!todayHours) return false;
  const [openStr, closeStr] = todayHours.split("-");
  const openMins = toMinutes(openStr);
  const closeMins = toMinutes(closeStr);
  const nowMins = localNow.getHours() * 60 + localNow.getMinutes();
  return nowMins >= openMins && nowMins <= closeMins;
}

const dayNames = {
  mon: "Segunda-feira",
  tue: "Terça-feira",
  wed: "Quarta-feira",
  thu: "Quinta-feira",
  fri: "Sexta-feira",
  sat: "Sábado",
  sun: "Domingo",
};

function formatHours(hours) {
  if (!hours) return [];
  return Object.entries(dayNames).map(([key, label]) => {
    const range = hours[key];
    if (!range) return { day: label, hours: "Fechado" };
    const [open, close] = range.split("-");
    return { day: label, hours: `${open} às ${close}` };
  });
}

function isSafeImageUrl(url) {
  return typeof url === "string" && url.length > 8 && (url.startsWith("http://") || url.startsWith("https://"));
}

export default function ClientMenu2({ menu }) {
  const cart = useCartContext();
  const alert = useAlert();

  const [imagePreviewOpen, setImagePreviewOpen] = useState(false);
  const [imagePreviewVisible, setImagePreviewVisible] = useState(false);
  const [animateCart, setAnimateCart] = useState(false);
  const [hoursModalOpen, setHoursModalOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const cartOpenRef = useRef(cartOpen);

  const [establishmentPhone, setEstablishmentPhone] = useState(null);
  const [ownerRole, setOwnerRole] = useState(null);

  const open = useMemo(() => isOpenNow(menu.hours), [menu.hours]);
  const contrast = useMemo(() => getContrastTextColor(menu.background_color), [menu.background_color]);
  const translucidToUse = contrast === "white" ? "#ffffff15" : "#00000015";
  const grayToUse = contrast === "white" ? "#cccccc" : "#333333";
  const foregroundToUse = contrast === "white" ? "#fafafa" : "#171717";

  const now = new Date();
  const timeString = now.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" });
  const localNow = new Date(timeString);
  const todayKey = localNow.toLocaleString("en-US", { weekday: "short" }).toLowerCase();

  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedAddons, setSelectedAddons] = useState({});
  const [note, setNote] = useState("");

  const orderedCategories = useMemo(() => {
    return (menu?.categories || []).slice().sort((a, b) => Number(a.position ?? 0) - Number(b.position ?? 0));
  }, [menu?.categories]);

  const [searchTerm, setSearchTerm] = useState("");
  const [filteredCategories, setFilteredCategories] = useState(orderedCategories);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredCategories(orderedCategories);
      return;
    }
    const lower = searchTerm.toLowerCase();
    const filtered = orderedCategories
      .map((cat) => {
        const filteredItems = (cat.menu_items || []).filter(
          (it) =>
            it.visible &&
            (it.name.toLowerCase().includes(lower) || (it.description && it.description.toLowerCase().includes(lower))),
        );
        return { ...cat, menu_items: filteredItems };
      })
      .filter((cat) => cat.menu_items.length > 0);
    setFilteredCategories(filtered);
  }, [searchTerm, orderedCategories]);

  const handleItemClick = useCallback((item) => {
    setSelectedItem(item);
    setItemModalOpen(true);
    setQuantity(1);
    setSelectedAddons({});
    setNote("");
  }, []);

  const toggleAddon = (idx) => {
    if (!selectedItem) return;
    const key = String(idx);
    const limit = Number(selectedItem.additionals_limit ?? 0);
    const currentCount = Object.values(selectedAddons).filter(Boolean).length;
    const isSelected = !!selectedAddons[key];
    if (!isSelected && limit > 0 && currentCount >= limit) {
      alert?.(`Você pode escolher no máximo ${limit} adicional${limit === 1 ? "" : "is"}.`, "error", {
        backgroundColor: `${menu.details_color}90`,
        textColor: getContrastTextColor(menu.details_color),
      });
      return;
    }
    setSelectedAddons((prev) => {
      const next = { ...prev };
      if (next[key]) delete next[key];
      else next[key] = true;
      return next;
    });
  };

  const [showFade, setShowFade] = useState(false);
  const descRef = useRef(null);

  useEffect(() => {
    const el = descRef.current;
    if (!el) return;
    const checkScroll = () => {
      const hasMore = el.scrollTop + el.clientHeight < el.scrollHeight - 1;
      setShowFade(hasMore);
    };
    checkScroll();
    el.addEventListener("scroll", checkScroll);
    return () => el.removeEventListener("scroll", checkScroll);
  }, [selectedItem]);

  const hasPlusPermissions = ownerRole === "plus" || ownerRole === "pro" || ownerRole === "admin";
  const canShowPromoPrice = hasPlusPermissions;

  const totalPrice = useMemo(() => {
    if (!selectedItem) return 0;
    const base = Number(selectedItem.promo_price && canShowPromoPrice ? selectedItem.promo_price : selectedItem.price || 0);
    const addonsPerUnit = (selectedItem.additionals || []).reduce((acc, a, idx) => {
      if (selectedAddons[String(idx)]) return acc + Number(a.price || 0);
      return acc;
    }, 0);
    return (base + addonsPerUnit) * quantity;
  }, [selectedItem, quantity, selectedAddons, canShowPromoPrice]);

  const openImagePreview = () => setImagePreviewOpen(true);
  const closeImagePreview = () => {
    setImagePreviewVisible(false);
    setTimeout(() => setImagePreviewOpen(false), 220);
  };

  const handleAddToCart = async () => {
    if (!selectedItem) return;
    const selectedCount = Object.values(selectedAddons).filter(Boolean).length;
    const mandatory = !!selectedItem.mandatory_additional;
    const limit = Number(selectedItem.additionals_limit ?? 0);
    if (mandatory && selectedCount < 1) {
      alert?.("Escolha pelo menos 1 adicional para continuar.", "error", {
        backgroundColor: `${menu.details_color}90`,
        textColor: getContrastTextColor(menu.details_color),
      });
      return;
    }
    if (limit > 0 && selectedCount > limit) {
      alert?.(`Você pode escolher no máximo ${limit} adicional${limit === 1 ? "" : "is"}.`, "error", {
        backgroundColor: `${menu.details_color}90`,
        textColor: getContrastTextColor(menu.details_color),
      });
      return;
    }
    const selected = (selectedItem.additionals || [])
      .map((a, idx) => (selectedAddons[String(idx)] ? { name: a.name, price: Number(a.price) } : null))
      .filter(Boolean);
    cart.addItem(menu.id, {
      id: selectedItem.id,
      name: selectedItem.name,
      image_url: selectedItem.image_url || null,
      price: Number(selectedItem.promo_price && canShowPromoPrice ? selectedItem.promo_price : selectedItem.price || 0),
      qty: Number(quantity || 1),
      additionals: selected,
      note: note || "",
    });
    alert("Item adicionado ao carrinho!", "info", {
      backgroundColor: `${menu.details_color}90`,
      textColor: getContrastTextColor(menu.details_color),
    });
    closeItemModal();
  };

  const openCart = () => {
    if (typeof window === "undefined") {
      setCartOpen(true);
      return;
    }
    try {
      if (!(window.history.state && window.history.state.ui === "cart")) window.history.pushState({ ui: "cart" }, "");
    } catch (e) {}
    setCartOpen(true);
  };

  const closeCartProgrammatically = () => {
    if (typeof window !== "undefined") {
      try {
        if (window.history.state && window.history.state.ui === "cart") window.history.replaceState(null, "");
      } catch (e) {}
    }
    setCartOpen(false);
  };

  const closeItemModal = () => {
    setImagePreviewVisible(false);
    setImagePreviewOpen(false);
    setItemModalOpen(false);
    setSelectedItem(null);
    setQuantity(1);
    setSelectedAddons({});
    setNote("");
  };

  const closeHoursModal = () => setHoursModalOpen(false);

  useEffect(() => {
    const fetchOwnerData = async () => {
      let phone = null;
      let role = null;
      if (menu?.owner_id) {
        const { data, error } = await supabase.from("profiles").select("phone, role").eq("id", menu.owner_id).maybeSingle();
        if (!error && data) {
          phone = data.phone || null;
          role = data.role || null;
        }
      }
      phone = phone || menu?.owner_phone || menu?.phone || null;
      role = role || menu?.owner_role || menu?.role || null;
      setEstablishmentPhone(phone);
      setOwnerRole(role || "free");
    };
    fetchOwnerData();
  }, [menu?.owner_id, menu?.owner_phone, menu?.phone, menu?.owner_role, menu?.role]);

  useEffect(() => {
    cartOpenRef.current = cartOpen;
  }, [cartOpen]);

  useModalBackHandler(cartOpen, () => setCartOpen(false));
  useModalBackHandler(itemModalOpen, closeItemModal);
  useModalBackHandler(hoursModalOpen, closeHoursModal);

  const cartCount = typeof cart.totalItems === "function" ? cart.totalItems(menu?.id) : 0;

  useEffect(() => {
    if (!cartCount) return;
    setAnimateCart(true);
    const timer = setTimeout(() => setAnimateCart(false), 600);
    return () => clearTimeout(timer);
  }, [cartCount]);

  useEffect(() => {
    const cartButton = document.getElementById("cart-button-wrapper");
    const footer = document.querySelector("footer");
    if (!cartButton || !footer) return;
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const footerRect = footer.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        if (footerRect.top < windowHeight) cartButton.style.bottom = `${windowHeight - footerRect.top + 20}px`;
        else cartButton.style.bottom = "20px";
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  useEffect(() => {
    if (imagePreviewOpen) {
      const id = requestAnimationFrame(() => setImagePreviewVisible(true));
      return () => cancelAnimationFrame(id);
    } else {
      setImagePreviewVisible(false);
    }
  }, [imagePreviewOpen]);

  const starredItems = useMemo(() => {
    return (menu?.categories || [])
      .flatMap((cat) => cat.menu_items || [])
      .filter((it) => it.visible && it.starred && it.image_url);
  }, [menu]);

  const hasStarred = starredItems.length > 0;

  const navCategories = useMemo(() => {
    return orderedCategories.filter((cat) => (cat.menu_items || []).some((it) => it.visible));
  }, [orderedCategories]);

  const totalVisibleItems = useMemo(() => {
    return (filteredCategories || []).reduce(
      (sum, cat) => sum + (cat.menu_items || []).filter((it) => it.visible).length,
      0,
    );
  }, [filteredCategories]);

  if (ownerRole === null) {
    return (
      <div className="flex items-center justify-center h-[100dvh] w-[100dvw]">
        <Loading />
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen w-full relative pb-18" style={{ backgroundColor: menu.background_color }}>
        {/* Banner */}
        {isSafeImageUrl(menu.banner_url) && (
          <div className="relative w-full h-[22dvh] sm:h-[30dvh]">
            <Image
              alt="Banner do estabelecimento"
              src={menu.banner_url}
              fill
              className="object-cover"
              priority
              sizes="100vw"
              quality={55}
              unoptimized
            />
            <div
              className="absolute inset-0"
              style={{ background: "linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.55) 100%)" }}
            />
          </div>
        )}

        {/* Cabeçalho centralizado — estilo bistrô */}
        <div
          className="flex flex-col items-center text-center pt-6 pb-4 px-4 border-b"
          style={{ borderColor: translucidToUse }}
        >
          {isSafeImageUrl(menu.logo_url) && (
            <div className="mb-3 -mt-10 relative z-10">
              <Image
                alt="Logo do estabelecimento"
                src={menu.logo_url}
                width={90}
                height={90}
                className="w-[70px] h-[70px] sm:w-[90px] sm:h-[90px] object-cover rounded-full border-4"
                style={{ borderColor: menu.background_color }}
                quality={55}
                unoptimized
              />
            </div>
          )}

          <h1 className="text-2xl sm:text-3xl font-bold tracking-wide" style={{ color: menu.title_color }}>
            {menu.title}
          </h1>

          {menu.description && (
            <p className="mt-1 text-sm max-w-md" style={{ color: grayToUse }}>
              {menu.description}
            </p>
          )}

          {menu.address && (
            <p className="flex items-center gap-1 mt-1 text-xs" style={{ color: grayToUse }}>
              <FaMapMarkerAlt size={11} /> {menu.address}
            </p>
          )}

          <div className="flex items-center gap-3 mt-3">
            <button
              className="text-xs font-semibold px-3 py-1 rounded-full"
              style={{ backgroundColor: open ? "#16a34a" : "#dc2626", color: "white" }}
              onClick={() => setHoursModalOpen(true)}
            >
              {open ? "Aberto agora" : "Fechado"}
            </button>

            <button
              className="flex items-center gap-1 text-xs px-3 py-1 rounded-full border"
              style={{ borderColor: translucidToUse, color: foregroundToUse }}
              onClick={() => window.open(`https://wa.me/${establishmentPhone}`, "_blank")}
            >
              <FaWhatsapp size={13} /> WhatsApp
            </button>
          </div>

          <a
            href="https://www.bitemenu.com.br"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] mt-2 hover:underline"
            style={{ color: grayToUse }}
          >
            Feito com Bite Menu ↗
          </a>
        </div>

        {/* Busca */}
        <div className="px-4 sm:px-8 lg:px-20 xl:px-32 mt-4 mb-2">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar item do cardápio..."
            className="w-full py-2 px-4 rounded-full border outline-none text-sm"
            style={{ backgroundColor: translucidToUse, color: foregroundToUse, borderColor: translucidToUse }}
          />
        </div>

        {/* Nav de categorias — linha de texto simples */}
        {navCategories.length > 0 && (
          <div
            className="flex sticky -top-1 overflow-x-auto whitespace-nowrap scrollbar-none z-10 px-4 sm:px-8 lg:px-20 xl:px-32 border-b"
            style={{ backgroundColor: menu.background_color, borderColor: translucidToUse }}
          >
            {hasStarred && hasPlusPermissions && (
              <button
                className="cursor-pointer px-4 py-3 text-sm font-semibold border-b-2"
                style={{ borderColor: menu.details_color, color: foregroundToUse }}
                onClick={(e) => {
                  e.preventDefault();
                  scrollToCategoryId("starred-section", 40);
                }}
              >
                Destaques
              </button>
            )}
            {navCategories.map((cat) => (
              <button
                key={cat.id}
                className="cursor-pointer px-4 py-3 text-sm border-b-2"
                style={{ borderColor: "transparent", color: grayToUse }}
                onClick={(e) => {
                  e.preventDefault();
                  scrollToCategoryId(cat.id.slice(0, 5), 40);
                }}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}

        <div className="px-4 sm:px-8 lg:px-20 xl:px-32">
          {/* Destaques — carrossel horizontal */}
          {hasStarred && hasPlusPermissions && searchTerm === "" && (
            <div className="py-6" id="starred-section">
              <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: grayToUse }}>
                Destaques
              </p>
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none" style={{ scrollSnapType: "x mandatory" }}>
                {starredItems.map((it) => (
                  <div
                    key={it.id}
                    className="min-w-[220px] max-w-[220px] snap-start cursor-pointer rounded-xl overflow-hidden"
                    style={{ backgroundColor: translucidToUse }}
                    onClick={() => handleItemClick(it)}
                  >
                    {isSafeImageUrl(it.image_url) && (
                      <div className="w-full h-[140px] overflow-hidden">
                        <Image
                          src={it.image_url}
                          alt={it.name}
                          width={220}
                          height={140}
                          className="w-full h-full object-cover"
                          quality={55}
                          unoptimized
                        />
                      </div>
                    )}
                    <div className="p-3">
                      <p className="font-semibold text-sm line-clamp-1" style={{ color: foregroundToUse }}>
                        {it.name}
                      </p>
                      <p className="text-xs line-clamp-2 mt-0.5" style={{ color: grayToUse }}>
                        {it.description}
                      </p>
                      {it.promo_price && canShowPromoPrice ? (
                        <div className="mt-2">
                          <span className="text-xs line-through" style={{ color: grayToUse }}>
                            {Number(it.price).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                          </span>
                          <p className="font-bold text-base" style={{ color: foregroundToUse }}>
                            {Number(it.promo_price).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                          </p>
                        </div>
                      ) : (
                        <p className="font-bold text-base mt-2" style={{ color: foregroundToUse }}>
                          {Number(it.price).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {totalVisibleItems === 0 && (
            <div className="text-center py-8">
              <p style={{ color: grayToUse }}>Nenhum item encontrado.</p>
            </div>
          )}

          {/* Lista estilo bistrô — sem grid, linha por item com separador */}
          <div className="space-y-8 pb-6">
            {filteredCategories.map((cat) => {
              const visibleItems = (cat.menu_items || []).filter((it) => it.visible);
              if (visibleItems.length === 0) return null;

              return (
                <div key={cat.id} id={cat.id.slice(0, 5)}>
                  {/* Título de categoria com ornamento */}
                  <div className="flex items-center gap-3 mb-4 pt-4">
                    <div className="flex-1 h-px" style={{ backgroundColor: translucidToUse }} />
                    <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: grayToUse }}>
                      {cat.name}
                    </p>
                    <div className="flex-1 h-px" style={{ backgroundColor: translucidToUse }} />
                  </div>

                  <div className="divide-y" style={{ borderColor: translucidToUse }}>
                    {visibleItems.map((it) => (
                      <div
                        key={it.id}
                        className="flex items-center justify-between gap-4 py-4 cursor-pointer group"
                        onClick={() => handleItemClick(it)}
                      >
                        {/* Texto à esquerda */}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-base leading-snug" style={{ color: foregroundToUse }}>
                            {it.name}
                          </p>
                          {it.description && (
                            <p
                              className="text-sm mt-0.5 line-clamp-2 leading-relaxed"
                              style={{ color: grayToUse, wordBreak: "normal", overflowWrap: "anywhere" }}
                            >
                              {it.description?.replace(/,\s*/g, ", ")}
                            </p>
                          )}
                          {/* Preço abaixo da descrição */}
                          <div className="mt-2">
                            {it.promo_price && canShowPromoPrice ? (
                              <div className="flex items-baseline gap-2">
                                <span className="text-xs line-through" style={{ color: grayToUse }}>
                                  {Number(it.price).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                                </span>
                                <span className="font-bold text-lg" style={{ color: foregroundToUse }}>
                                  {Number(it.promo_price).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                                </span>
                              </div>
                            ) : (
                              <span className="font-bold text-lg" style={{ color: foregroundToUse }}>
                                {Number(it.price).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Imagem + botão à direita */}
                        <div className="flex flex-col items-center gap-2 shrink-0">
                          {isSafeImageUrl(it.image_url) && (
                            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden">
                              <Image
                                src={it.image_url}
                                alt={it.name}
                                width={96}
                                height={96}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                quality={55}
                                unoptimized
                              />
                            </div>
                          )}
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: menu.details_color }}
                          >
                            <FaShoppingCart size={13} style={{ color: getContrastTextColor(menu.details_color) }} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Botão Carrinho */}
      {menu.orders === "whatsapp" || menu.orders === "site_whatsapp" ? (
        <div
          id="cart-button-wrapper"
          style={{ position: "fixed", right: "20px", bottom: "20px", zIndex: 40, transition: "bottom 0.2s ease-in-out" }}
        >
          <button
            onClick={openCart}
            className={`cursor-pointer flex items-center gap-2 px-4 py-2 rounded-full shadow-lg font-bold transition-transform duration-200 hover:opacity-90 hover:scale-110 ${animateCart ? "scale-110" : "scale-100"}`}
            style={{ backgroundColor: menu.details_color, color: getContrastTextColor(menu.details_color) }}
            aria-label="Abrir carrinho"
          >
            <span>Carrinho</span>
            <FaShoppingCart />
            <span>{typeof cart.totalItems === "function" ? cart.totalItems(menu?.id) : 0}</span>
          </button>
        </div>
      ) : null}

      {/* Modal Horários */}
      {hoursModalOpen && (
        <GenericModal
          title="Horários de funcionamento:"
          titleColor={foregroundToUse}
          hoverXButtonColor={translucidToUse}
          wfull
          maxWidth={"480px"}
          bgColor={menu.background_color}
          onClose={closeHoursModal}
        >
          <div className="space-y-2" style={{ color: foregroundToUse }}>
            {formatHours(menu.hours).map(({ day, hours }, idx) => {
              const dayKey = Object.keys(dayNames)[idx];
              const isToday = dayKey === todayKey;
              return (
                <div
                  key={day}
                  className="flex justify-between px-2 py-1 rounded"
                  style={{ backgroundColor: isToday ? translucidToUse : "transparent" }}
                >
                  <span>{day}:</span>
                  <span>{hours}</span>
                </div>
              );
            })}
          </div>
        </GenericModal>
      )}

      {/* Modal Produto */}
      {itemModalOpen && selectedItem && (
        <GenericModal
          onClose={() => {
            setItemModalOpen(false);
            setSelectedItem(null);
            setQuantity(1);
            setSelectedAddons({});
            setNote("");
          }}
          title={selectedItem.name}
          titleColor={foregroundToUse}
          hoverXButtonColor={translucidToUse}
          bgColor={menu.background_color}
          maxWidth={"580px"}
          margin={"12px"}
          wfull
        >
          <div className="flex flex-col gap-4 sm:min-w-[460px]">
            <div className="flex flex-row gap-4 mb-2">
              {isSafeImageUrl(selectedItem.image_url) && (
                <button
                  type="button"
                  onClick={openImagePreview}
                  className="h-26 w-26 sm:h-30 sm:w-30 overflow-hidden rounded-lg cursor-zoom-in hover:opacity-95 transition"
                  style={{ flexShrink: 0 }}
                  aria-label="Ampliar imagem do produto"
                >
                  <Image
                    src={selectedItem.image_url}
                    alt={selectedItem.name}
                    width={120}
                    height={120}
                    className="object-cover w-full h-full"
                    quality={60}
                    unoptimized
                  />
                </button>
              )}
              <div
                className={`flex flex-col gap-2 justify-between ${selectedItem.image_url ? "w-[calc(100%-120px)]" : "w-[100%]"}`}
              >
                <div className="relative">
                  {selectedItem.description && (
                    <>
                      <p
                        ref={descRef}
                        className="min-h-[64px] max-h-[64px] sm:min-h-[80px] sm:max-h-[80px] overflow-auto text-sm pr-1 scrollbar-none"
                        style={{ color: grayToUse, wordBreak: "normal", overflowWrap: "anywhere" }}
                      >
                        {selectedItem.description?.replace(/,\s*/g, ", ")}
                      </p>
                      <div
                        className="pointer-events-none absolute bottom-0 left-0 w-full h-6 transition-opacity duration-200"
                        style={{
                          opacity: showFade ? 1 : 0,
                          background: `linear-gradient(to top, ${menu.background_color}, ${menu.background_color}00)`,
                        }}
                      />
                    </>
                  )}
                </div>
                {selectedItem.promo_price && canShowPromoPrice ? (
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold line-through" style={{ color: grayToUse }}>
                      {Number(selectedItem.price).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </span>
                    <span className="text-2xl font-semibold" style={{ color: foregroundToUse }}>
                      {Number(selectedItem.promo_price).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </span>
                  </div>
                ) : (
                  <>
                    {selectedItem.price ? (
                      <span className="text-3xl font-semibold" style={{ color: foregroundToUse }}>
                        {Number(selectedItem.price).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                      </span>
                    ) : null}
                  </>
                )}
              </div>
            </div>

            {menu.orders !== "none" ? (
              <div className="max-w-full">
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-[100%] h-full p-2 border"
                  style={{ backgroundColor: translucidToUse, color: foregroundToUse, borderColor: grayToUse }}
                  placeholder="Comentário (opicional)"
                />
              </div>
            ) : null}

            {menu.orders === "none" && Array.isArray(selectedItem.additionals) && selectedItem.additionals.length > 0 ? (
              <div>
                <p className="font-bold">Adicionais disponíveis:</p>
                {selectedItem.additionals.map((a, idx) => (
                  <span key={idx}>
                    {a.name}
                    {idx < selectedItem.additionals.length - 1 && ", "}
                  </span>
                ))}
              </div>
            ) : null}

            {menu.orders !== "none" ? (
              <>
                {Array.isArray(selectedItem.additionals) && selectedItem.additionals.length > 0 && (
                  <div className="space-y-2">
                    <div className="font-semibold" style={{ color: foregroundToUse }}>
                      Selecione adicionais:
                    </div>
                    <div className="flex flex-wrap gap-3 max-h-[120px] overflow-auto">
                      {(selectedItem.additionals || []).map((a, idx) => {
                        const isSelected = !!selectedAddons[String(idx)];
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => toggleAddon(idx)}
                            className="flex flex-col items-center justify-center rounded-lg cursor-pointer p-2 min-w-[120px] text-center"
                            style={{
                              backgroundColor: isSelected ? "#16a34a44" : translucidToUse,
                              color: foregroundToUse,
                              border: isSelected ? `1px solid #16a34a88` : "1px solid transparent",
                            }}
                          >
                            <div className="font-medium truncate">
                              {a.name}{" "}
                              <span className="text-sm" style={{ color: grayToUse }}>
                                {Number(a.price).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="cursor-pointer p-2 rounded bg-red-500 hover:bg-red-600 font-bold transition"
                  >
                    <FaMinus />
                  </button>
                  <span className="text-xl font-semibold" style={{ color: foregroundToUse }}>
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity((q) => q + 1)}
                    className="cursor-pointer p-2 rounded bg-green-500 hover:bg-green-600 font-bold transition"
                  >
                    <FaPlus />
                  </button>
                  <span style={{ color: grayToUse }}>
                    ({totalPrice.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })})
                  </span>
                </div>
                <button
                  onClick={handleAddToCart}
                  className="cursor-pointer p-2 gap-2 font-bold flex items-center justify-center rounded hover:opacity-90 transition"
                  style={{ backgroundColor: menu.details_color, color: getContrastTextColor(menu.details_color) }}
                >
                  <span>Adicionar {quantity} ao carrinho</span>
                  <FaShoppingCart />
                </button>
              </>
            ) : null}
          </div>
        </GenericModal>
      )}

      {imagePreviewOpen && selectedItem?.image_url && (
        <div
          onClick={closeImagePreview}
          className="fixed inset-0 z-[200] flex items-center justify-center"
          style={{
            backgroundColor: imagePreviewVisible ? "rgba(0,0,0,0.82)" : "rgba(0,0,0,0)",
            transition: "background-color 220ms ease",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "fixed",
              top: "50%",
              left: "50%",
              width: "min(88vw, 420px)",
              height: "min(88vw, 420px)",
              transform: imagePreviewVisible ? "translate(-50%, -50%) scale(1)" : "translate(-50%, -50%) scale(0.85)",
              opacity: imagePreviewVisible ? 1 : 0,
              transition: "transform 220ms ease, opacity 220ms ease",
            }}
          >
            <div
              onClick={closeImagePreview}
              className="absolute top-2 right-2 z-10 w-10 h-10 rounded-full bg-black/70 text-white text-xl flex items-center justify-center cursor-pointer"
              aria-label="Fechar imagem ampliada"
            >
              <XButton />
            </div>
            <button
              type="button"
              onClick={closeImagePreview}
              className="w-full h-full block rounded-2xl overflow-hidden shadow-2xl cursor-zoom-out"
            >
              <Image
                src={selectedItem.image_url}
                alt={selectedItem.name}
                width={900}
                height={900}
                className="w-full h-full object-cover"
                quality={85}
                unoptimized
              />
            </button>
          </div>
        </div>
      )}

      <CartDrawer
        menu={menu}
        open={cartOpen}
        bgColor={menu.background_color}
        translucidToUse={translucidToUse}
        grayToUse={grayToUse}
        foregroundToUse={foregroundToUse}
        onClose={closeCartProgrammatically}
        isOpen={open}
      />

      <MenuFooter
        bgColor={menu.background_color}
        translucidToUse={translucidToUse}
        grayToUse={grayToUse}
        foregroundToUse={foregroundToUse}
      />
    </>
  );
}
