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

// util para contraste de cor
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

// util: encontra o primeiro ancestor rolável (ou retorna window)
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

// função robusta de scroll com offset
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

export default function ClientMenu({ menu }) {
  const cart = useCartContext();
  const alert = useAlert();

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
    return (menu?.categories || []).slice().sort((a, b) => {
      return Number(a.position ?? 0) - Number(b.position ?? 0);
    });
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

  // scroll modal desc view
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
      if (!(window.history.state && window.history.state.ui === "cart")) {
        window.history.pushState({ ui: "cart" }, "");
      }
    } catch (e) {}
    setCartOpen(true);
  };

  const closeCartProgrammatically = () => {
    if (typeof window !== "undefined") {
      try {
        if (window.history.state && window.history.state.ui === "cart") {
          window.history.replaceState(null, "");
        }
      } catch (e) {}
    }
    setCartOpen(false);
  };

  const closeItemModal = () => {
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

  // Fecha modais com botão voltar
  useEffect(() => {
    const onPopState = () => {
      if (cartOpenRef.current) setCartOpen(false);
      if (itemModalOpen) closeItemModal();
      if (hoursModalOpen) closeHoursModal();
    };

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [itemModalOpen, hoursModalOpen]);

  useEffect(() => {
    if (!itemModalOpen) return;
    try {
      if (!(window.history.state && window.history.state.ui === "productModal")) {
        window.history.pushState({ ui: "productModal" }, "");
      }
    } catch (e) {}
  }, [itemModalOpen]);

  useEffect(() => {
    if (!hoursModalOpen) return;
    try {
      if (!(window.history.state && window.history.state.ui === "hoursModal")) {
        window.history.pushState({ ui: "hoursModal" }, "");
      }
    } catch (e) {}
  }, [hoursModalOpen]);

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

        if (footerRect.top < windowHeight) {
          cartButton.style.bottom = `${windowHeight - footerRect.top + 20}px`;
        } else {
          cartButton.style.bottom = "20px";
        }
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

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
    return (filteredCategories || []).reduce((sum, cat) => {
      const count = (cat.menu_items || []).filter((it) => it.visible).length;
      return sum + count;
    }, 0);
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
      <div
        className="min-h-screen w-full lg:px-20 xl:px-32 relative pb-18"
        style={{ backgroundColor: menu.background_color }}
      >
        {/* Indicador de status no topo */}
        {menu.banner_url ? (
          <div
            className="cursor-pointer absolute mt-2 flex items-center h-[35px] top-[calc(18dvh-50px)] sm:top-[calc(25dvh-50px)] right-2 lg:right-20 xl:right-32 px-3 py-1 mr-2 rounded-lg font-bold text-sm z-2"
            style={{ backgroundColor: open ? "#16a34a" : "#dc2626", color: "white" }}
            onClick={() => setHoursModalOpen(true)}
          >
            {open ? "Aberto agora" : "Fechado"}
          </div>
        ) : null}

        {/* Banner (Next/Image com sizes) */}
        {isSafeImageUrl(menu.banner_url) && (
          <div className="relative w-full h-[18dvh] sm:h-[25dvh]">
            <Image
              alt="Banner do estabelecimento"
              src={menu.banner_url}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 640px) 100vw, (max-width: 1280px) 80vw, 60vw"
              quality={55}
            />
          </div>
        )}

        {/* Conteúdo */}
        <div className="py-4">
          <div className="flex items-center justify-between px-4">
            <div className="flex items-center min-w-full">
              {/* Logo (Next/Image em vez de <img>) */}
              {isSafeImageUrl(menu.logo_url) && (
                <div className="relative w-full max-w-[45px] xxs:max-w-[55px] sm:max-w-[80px] aspect-[1/1] rounded-lg mr-2 sm:mr-4 overflow-hidden">
                  <Image
                    alt="Logo do estabelecimento"
                    src={menu.logo_url}
                    fill
                    className="object-cover"
                    quality={55}
                    sizes="(max-width: 480px) 55px, (max-width: 640px) 80px, 80px"
                  />
                </div>
              )}

              <div className="flex flex-col items-start">
                <h1
                  className="text-lg xs:text-xl md:text-2xl font-bold line-clamp-2 pr-8"
                  style={{ color: menu.title_color }}
                >
                  {menu.title}
                </h1>

                {!menu.banner_url ? (
                  <div
                    className="cursor-pointer flex items-center h-[30px] px-2 mr-2 rounded-lg font-bold text-sm z-2"
                    style={{ backgroundColor: open ? "#16a34a" : "#dc2626", color: "white" }}
                    onClick={() => setHoursModalOpen(true)}
                  >
                    {open ? "Aberto agora" : "Fechado"}
                  </div>
                ) : null}
              </div>
            </div>

            <div
              className="cursor-pointer hover:scale-[1.1] transition transform-[translatex(-100%)]"
              onClick={() => {
                const url = `https://wa.me/${establishmentPhone}`;
                window.open(url, "_blank");
              }}
            >
              <FaWhatsapp style={{ color: foregroundToUse }} size={28} />
            </div>
          </div>

          {menu.address && (
            <p className="px-4 flex items-center my-2" style={{ color: grayToUse }}>
              <FaMapMarkerAlt className="inline mr-2" />
              {menu.address}
            </p>
          )}

          <p className="mt-1 px-4" style={{ color: getContrastTextColor(menu.background_color) }}>
            {menu.description}
          </p>
        </div>

        <div className="px-4 mb-4">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar item do cardápio..."
            className="w-full py-1 px-3 rounded-lg border-2 outline-none"
            style={{
              backgroundColor: translucidToUse,
              color: foregroundToUse,
              borderColor: translucidToUse,
            }}
          />
        </div>

        {navCategories.length > 0 && (
          <div
            className="flex sticky -top-1 border-y-2 overflow-x-auto whitespace-nowrap scrollbar-none z-10"
            style={{
              backgroundColor: menu.background_color,
              borderColor: translucidToUse,
              color: foregroundToUse,
            }}
          >
            <>
              {hasStarred && hasPlusPermissions && (
                <button
                  className="cursor-pointer p-4 font-semibold"
                  onClick={(e) => {
                    e.preventDefault();
                    scrollToCategoryId("starred-section", 40);
                  }}
                >
                  Destaques
                </button>
              )}

              {navCategories.map((cat) => (
                <div key={cat.id}>
                  <button
                    className="cursor-pointer p-4"
                    onClick={(e) => {
                      e.preventDefault();
                      scrollToCategoryId(cat.id.slice(0, 5), 40);
                    }}
                  >
                    {cat.name}
                  </button>
                </div>
              ))}
            </>
          </div>
        )}

        {/* Destaques */}
        {hasStarred && hasPlusPermissions && searchTerm === "" && (
          <div className="rounded py-3 px-4" id="starred-section">
            <div className="flex items-center gap-2 mb-2 pt-4">
              <strong style={{ color: foregroundToUse }}>Destaques</strong>
            </div>

            <div
              className="flex gap-3 overflow-x-auto starred-scroll"
              style={{
                scrollSnapType: "x mandatory",
                "--scrollbar-color": menu.details_color,
              }}
            >
              {starredItems.map((it) => (
                <div
                  key={it.id}
                  className="min-w-[65%] max-w-[65%] 
                     xxs:min-w-[55%] xxs:max-w-[55%] 
                     xs:min-w-[40%] xs:max-w-[40%] 
                     sm:min-w-[30%] sm:max-w-[30%] 
                     lg:min-w-[28%] lg:max-w-[28%] 
                     xl:min-w-[24%] xl:max-w-[24%] 
                     snap-start rounded-lg p-2 cursor-pointer mb-2"
                  style={{ backgroundColor: translucidToUse }}
                  onClick={() => handleItemClick(it)}
                >
                  <div className="flex flex-col justify-between h-full">
                    <div>
                      {isSafeImageUrl(it.image_url) && (
                        <div className="relative w-full aspect-square rounded-md mb-2 overflow-hidden">
                          <Image
                            src={it.image_url}
                            alt={it.name}
                            fill
                            className="object-cover"
                            quality={55}
                            sizes="(max-width: 640px) 60vw, (max-width: 1024px) 30vw, 24vw"
                          />
                        </div>
                      )}

                      <div className="text-lg font-semibold line-clamp-1" style={{ color: foregroundToUse }}>
                        {it.name}
                      </div>
                      <div className="text-sm line-clamp-2 mb-1" style={{ color: grayToUse }}>
                        {it.description}
                      </div>
                    </div>

                    {it.promo_price && canShowPromoPrice ? (
                      <div>
                        <span className="text-xs xs:text-sm line-through" style={{ color: grayToUse }}>
                          {Number(it.price).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                        </span>
                        <div className="font-bold text-xl lg:text-2xl" style={{ color: foregroundToUse }}>
                          {Number(it.promo_price).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                        </div>
                      </div>
                    ) : (
                      <div className="font-bold text-2xl" style={{ color: foregroundToUse }}>
                        {Number(it.price).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                      </div>
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

        {/* Lista */}
        <div className="space-y-4 px-4">
          {filteredCategories.map((cat) => {
            const visibleItems = (cat.menu_items || []).filter((it) => it.visible);
            if (visibleItems.length === 0) return null;

            return (
              <div key={cat.id} id={cat.id.slice(0, 5)} className="rounded py-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <strong style={{ color: foregroundToUse }}>{cat.name}</strong>
                    <span className="text-sm" style={{ color: grayToUse }}>
                      ({visibleItems.length} itens)
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {visibleItems.map((it) => (
                    <div key={it.id} className="flex items-stretch">
                      <div
                        className="flex-1 min-h-[130px] rounded-lg p-2 flex flex-col justify-between cursor-pointer"
                        style={{ backgroundColor: translucidToUse }}
                        onClick={() => handleItemClick(it)}
                      >
                        <div className="flex gap-2">
                          {isSafeImageUrl(it.image_url) && (
                            <div
                              className="relative w-[72px] h-[72px] shrink-0 overflow-hidden rounded-lg"
                              onClick={() => handleItemClick(it)}
                            >
                              <Image
                                src={it.image_url}
                                alt={it.name}
                                fill
                                className="object-cover"
                                quality={55}
                                sizes="(max-width: 640px) 72px, 130px"
                              />
                            </div>
                          )}
                          <div>
                            <div className="text-xl line-clamp-1" style={{ color: foregroundToUse }}>
                              {it.name}
                            </div>

                            <div
                              className="text-sm line-clamp-2"
                              style={{ color: grayToUse, wordBreak: "normal", overflowWrap: "anywhere" }}
                            >
                              {it.description?.replace(/,\s*/g, ", ")}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-end justify-between mt-2">
                          {/* preço */}
                          <div className="text-2xl font-bold" style={{ color: foregroundToUse }}>
                            {Number(it.promo_price && canShowPromoPrice ? it.promo_price : it.price).toLocaleString(
                              "pt-BR",
                              {
                                style: "currency",
                                currency: "BRL",
                              },
                            )}
                          </div>

                          <div className="px-6 py-2 rounded" style={{ backgroundColor: menu.details_color }}>
                            <FaShoppingCart style={{ color: getContrastTextColor(menu.details_color) }} />
                          </div>
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

      {/* Botão Carrinho */}
      {menu.orders === "whatsapp" || menu.orders === "site_whatsapp" ? (
        <div
          id="cart-button-wrapper"
          style={{ position: "fixed", right: "20px", bottom: "20px", zIndex: 40, transition: "bottom 0.2s ease-in-out" }}
        >
          <button
            onClick={openCart}
            className={`cursor-pointer flex items-center gap-2 px-4 py-2 rounded-lg shadow-[0_0_20px_var(--shadow)] font-bold transition-transform duration-200 hover:opacity-90 hover:scale-110 ${
              animateCart ? "scale-110" : "scale-100"
            }`}
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
                <div className="relative h-26 w-26 sm:h-30 sm:w-30 overflow-hidden rounded-lg" style={{ flexShrink: 0 }}>
                  <Image
                    src={selectedItem.image_url}
                    alt={selectedItem.name}
                    fill
                    className="object-cover"
                    quality={60}
                    sizes="120px"
                  />
                </div>
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
                        style={{
                          color: grayToUse,
                          wordBreak: "normal",
                          overflowWrap: "anywhere",
                        }}
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
                        const boxBg = isSelected ? "#16a34a44" : translucidToUse;

                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => toggleAddon(idx)}
                            className="flex flex-col items-center justify-center rounded-lg cursor-pointer p-2 min-w-[120px] text-center"
                            style={{
                              backgroundColor: boxBg,
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

      {/* Carrinho */}
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

      {/* Footer */}
      <MenuFooter
        bgColor={menu.background_color}
        translucidToUse={translucidToUse}
        grayToUse={grayToUse}
        foregroundToUse={foregroundToUse}
      />
    </>
  );
}
