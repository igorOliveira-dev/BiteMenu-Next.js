"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { FaMapMarkerAlt, FaMinus, FaPlus, FaShoppingCart, FaWhatsapp } from "react-icons/fa";
import Image from "next/image";
import GenericModal from "@/components/GenericModal";
import { useCartContext } from "@/contexts/CartContext";
import CartDrawer from "./components/CartDrawer";
import { formatCurrency } from "@/lib/formatCurrency";
import { useAlert } from "@/providers/AlertProvider";
import MenuFooter from "./components/MenuFooter";
import { supabaseImg } from "@/lib/imageUtils";
import { supabase } from "@/lib/supabaseClient";
import useModalBackHandler from "@/hooks/useModalBackHandler";
import XButton from "@/components/XButton";
import { useThemeColor } from "@/providers/ThemeColorProvider";
import { useCookieConsent } from "@/providers/CookieConsentProvider";

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

function describeCombos(combos, currency) {
  if (!combos || combos.length === 0) return [];

  const byType = { quantity: [], value: [] };
  combos.forEach((c) => {
    if (byType[c.trigger_type]) byType[c.trigger_type].push(c);
  });

  const lines = [];

  Object.entries(byType).forEach(([type, list]) => {
    if (list.length === 0) return;

    const sorted = [...list].sort((a, b) => Number(a.trigger_value) - Number(b.trigger_value));

    const parts = sorted.map((c) => {
      const trigger = type === "quantity" ? `${c.trigger_value}un+ ` : ` ${formatCurrency(c.trigger_value, currency)}+ `;
      const discount =
        c.discount_type === "percentage"
          ? ` ${c.discount_value}% OFF`
          : ` ${formatCurrency(c.discount_value, currency)} OFF`;
      return `${trigger}=${discount}`;
    });

    lines.push(parts.join(" | "));
  });

  return lines;
}

function isSafeImageUrl(url) {
  return typeof url === "string" && url.length > 8 && (url.startsWith("http://") || url.startsWith("https://"));
}

export default function ClientMenu({ menu, ownerPhone, ownerRole, ownerStripeAccount }) {
  const cart = useCartContext();
  const alert = useAlert();

  const [imagePreviewOpen, setImagePreviewOpen] = useState(false);
  const [imagePreviewVisible, setImagePreviewVisible] = useState(false);

  const [animateCart, setAnimateCart] = useState(false);
  const [hoursModalOpen, setHoursModalOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const cartOpenRef = useRef(cartOpen);

  const establishmentPhone = ownerPhone ?? null;

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
  const [selectedOptions, setSelectedOptions] = useState({});
  const [note, setNote] = useState("");
  const { bannerHeight } = useCookieConsent();

  const orderedCategories = useMemo(() => {
    return (menu?.categories || []).slice().sort((a, b) => {
      return Number(a.position ?? 0) - Number(b.position ?? 0);
    });
  }, [menu?.categories]);

  const { setColors } = useThemeColor();

  useEffect(() => {
    setColors({
      background: menu.background_color,
      details: menu.details_color,
    });

    return () => setColors(null); // volta ao padrão ao sair da página
  }, [menu.background_color, menu.details_color, setColors]);

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

  const [combos, setCombos] = useState([]);

  useEffect(() => {
    if (!menu?.id) return;
    let mounted = true;
    supabase
      .from("combos")
      .select("*")
      .eq("menu_id", menu.id)
      .then(({ data, error }) => {
        if (!mounted) return;
        if (error) {
          console.error("Erro ao buscar combos:", error);
          return;
        }
        setCombos(data || []);
      });
    return () => {
      mounted = false;
    };
  }, [menu?.id]);

  const handleItemClick = useCallback((item) => {
    setSelectedItem(item);
    setItemModalOpen(true);
    setQuantity(1);
    setSelectedOptions({});
    setNote("");
  }, []);

  const toggleOptionChoice = (group, choice) => {
    const groupId = group.id;
    const max = Number(group.max_choices ?? 0);
    const current = selectedOptions[groupId] || [];
    const isSelected = current.includes(choice.id);

    if (!isSelected && max > 0 && max !== 1 && current.length >= max) {
      alert?.(`Você pode escolher no máximo ${max} opç${max === 1 ? "ão" : "ões"} em "${group.name}".`, "error", {
        backgroundColor: `${menu.details_color}90`,
        textColor: getContrastTextColor(menu.details_color),
      });
      return;
    }

    setSelectedOptions((prev) => {
      const current = prev[groupId] || [];
      const isSelected = current.includes(choice.id);

      if (isSelected) {
        return { ...prev, [groupId]: current.filter((id) => id !== choice.id) };
      }

      if (max === 1) {
        return { ...prev, [groupId]: [choice.id] };
      }

      return { ...prev, [groupId]: [...current, choice.id] };
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

  const [pendingStripeOrderId, setPendingStripeOrderId] = useState(null);

  // verifica se chegou com query de order_success e order_id para abrir o carrinho automaticamente
  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const orderSuccess = params.get("order_success");
    const orderId = params.get("order_id");

    console.log("🔍 ClientMenu params:", { orderSuccess, orderId });

    if (orderSuccess !== "true" || !orderId) return;

    const url = new URL(window.location.href);
    url.searchParams.delete("order_success");
    url.searchParams.delete("order_id");
    window.history.replaceState({}, "", url.toString());

    setCartOpen(true);
    setPendingStripeOrderId(orderId);
  }, []);

  const hasPlusPermissions = ownerRole === "plus" || ownerRole === "pro" || ownerRole === "admin";
  const canShowPromoPrice = hasPlusPermissions;

  const totalPrice = useMemo(() => {
    if (!selectedItem) return 0;
    const base = Number(selectedItem.promo_price && canShowPromoPrice ? selectedItem.promo_price : selectedItem.price || 0);

    const groups = selectedItem.option_groups || [];
    const optionsTotal = groups.reduce((acc, g) => {
      const selectedIds = selectedOptions[g.id] || [];
      const groupSum = (g.option_choices || []).reduce((s, c) => {
        return selectedIds.includes(c.id) ? s + Number(c.price || 0) : s;
      }, 0);
      return acc + groupSum;
    }, 0);

    return (base + optionsTotal) * quantity;
  }, [selectedItem, quantity, selectedOptions, canShowPromoPrice]);

  const openImagePreview = () => {
    setImagePreviewOpen(true);
  };

  const closeImagePreview = () => {
    setImagePreviewVisible(false);

    setTimeout(() => {
      setImagePreviewOpen(false);
    }, 220);
  };

  const handleAddToCart = async () => {
    if (!selectedItem) return;

    const groups = selectedItem.option_groups || [];

    for (const g of groups) {
      const selectedIds = selectedOptions[g.id] || [];
      const min = Number(g.min_choices ?? 0);
      const max = Number(g.max_choices ?? 0);

      if (min > 0 && selectedIds.length < min) {
        alert?.(`Escolha pelo menos ${min} opç${min === 1 ? "ão" : "ões"} em "${g.name}".`, "error", {
          backgroundColor: `${menu.details_color}90`,
          textColor: getContrastTextColor(menu.details_color),
        });
        return;
      }

      if (max > 0 && selectedIds.length > max) {
        alert?.(`Você pode escolher no máximo ${max} opç${max === 1 ? "ão" : "ões"} em "${g.name}".`, "error", {
          backgroundColor: `${menu.details_color}90`,
          textColor: getContrastTextColor(menu.details_color),
        });
        return;
      }
    }

    const selected = groups.flatMap((g) => {
      const selectedIds = selectedOptions[g.id] || [];
      return (g.option_choices || [])
        .filter((c) => selectedIds.includes(c.id))
        .map((c) => ({ group: g.name, name: c.name, price: Number(c.price) }));
    });

    cart.addItem(menu.id, {
      id: selectedItem.id,
      name: selectedItem.name,
      image_url: selectedItem.image_url || null,
      price: Number(selectedItem.promo_price && canShowPromoPrice ? selectedItem.promo_price : selectedItem.price || 0),
      qty: Number(quantity || 1),
      additionals: selected, // mantém o nome "additionals" para não quebrar CartDrawer/checkout, ou renomeie em conjunto
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
    setImagePreviewVisible(false);
    setImagePreviewOpen(false);
    setItemModalOpen(false);
    setSelectedItem(null);
    setQuantity(1);
    setSelectedOptions({});
    setNote("");
  };

  const closeHoursModal = () => setHoursModalOpen(false);

  useEffect(() => {
    cartOpenRef.current = cartOpen;
  }, [cartOpen]);

  // Fecha modais com botão voltar usando hook central
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

        if (footerRect.top < windowHeight) {
          cartButton.style.bottom = `${windowHeight - footerRect.top + 20}px`;
        } else {
          cartButton.style.bottom = `${20 + bannerHeight}px`;
        }
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [bannerHeight]);

  useEffect(() => {
    if (imagePreviewOpen) {
      const id = requestAnimationFrame(() => {
        setImagePreviewVisible(true);
      });
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
    return (filteredCategories || []).reduce((sum, cat) => {
      const count = (cat.menu_items || []).filter((it) => it.visible).length;
      return sum + count;
    }, 0);
  }, [filteredCategories]);

  const itemCombos = useMemo(() => {
    if (!hasPlusPermissions) {
      return {};
    }
    const map = {};
    combos
      .filter((c) => c.scope === "item")
      .forEach((c) => {
        if (!map[c.item_id]) map[c.item_id] = [];
        map[c.item_id].push(c);
      });
    return map;
  }, [combos, hasPlusPermissions]);

  const categoryCombos = useMemo(() => {
    if (!hasPlusPermissions) {
      return {};
    }
    const map = {};
    combos
      .filter((c) => c.scope === "category")
      .forEach((c) => {
        if (!map[c.category_id]) map[c.category_id] = [];
        map[c.category_id].push(c);
      });
    return map;
  }, [combos, hasPlusPermissions]);

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
              unoptimized // ao voltar a usar otimização, substituir 'unoptimized' por 'priority'
              alt="Banner do estabelecimento"
              src={supabaseImg(menu.banner_url, { quality: 70 })}
              fill
              className="object-cover"
              sizes="100vw"
            />
          </div>
        )}

        {/* Conteúdo */}
        <div className="py-4">
          <div className="flex items-center justify-between px-4">
            <div className="flex items-center min-w-full">
              {/* Logo (Next/Image em vez de <img>) */}
              {isSafeImageUrl(menu.logo_url) && (
                <div className="mr-2 sm:mr-4">
                  <Image
                    alt="Logo do estabelecimento"
                    src={supabaseImg(menu.logo_url, { width: 120, height: 120, quality: 80 })}
                    width={80}
                    height={80}
                    className="w-[45px] xxs:w-[55px] sm:w-[80px] aspect-square object-cover rounded-lg"
                    loading="lazy"
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

                {ownerRole === "free" ? (
                  <a
                    href="https://www.bitemenu.com.br"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] xs:text-xs mt-1 hover:underline"
                    style={{ color: grayToUse }}
                  >
                    Feito com Bite Menu ↗
                  </a>
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

          <p className="mt-1 px-4" style={{ color: grayToUse }}>
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

        {totalVisibleItems === 0 && (
          <div className="text-center py-8">
            <p style={{ color: grayToUse }}>Nenhum item encontrado.</p>
          </div>
        )}

        {/* Lista */}
        <div className="space-y-4 px-4">
          {/* Destaques */}
          {hasStarred && hasPlusPermissions && searchTerm === "" && (
            <div className="py-6 px-" id="starred-section">
              <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: grayToUse }}>
                Destaques
              </p>
              <div
                className="flex gap-4 overflow-x-auto pb-2 starred-scroll"
                style={{
                  scrollSnapType: "x mandatory",
                  "--scrollbar-color": menu.details_color,
                }}
              >
                {starredItems.map((it) => (
                  <div
                    key={it.id}
                    className="min-w-[220px] max-w-[220px] snap-start cursor-pointer rounded-xl overflow-hidden"
                    style={{ backgroundColor: translucidToUse }}
                    onClick={() => handleItemClick(it)}
                  >
                    {isSafeImageUrl(it.image_url) && (
                      <div className="w-full aspect-square overflow-hidden">
                        <Image
                          src={supabaseImg(it.image_url, { width: 400, height: 400, quality: 85 })}
                          alt={it.name}
                          width={220}
                          height={220}
                          className="w-full h-full object-cover"
                          loading="lazy"
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
                      {itemCombos[it.id]?.length > 0 && (
                        <div className="text-xs font-semibold mt-1 space-y-0.5" style={{ color: menu.details_color }}>
                          {describeCombos(itemCombos[it.id], menu?.currency).map((line, idx) => (
                            <div key={idx}>{line}</div>
                          ))}
                        </div>
                      )}
                      {it.promo_price && canShowPromoPrice ? (
                        <div className="mt-2">
                          <span className="text-xs line-through" style={{ color: grayToUse }}>
                            {formatCurrency(it.price, menu?.currency)}
                          </span>
                          <p className="font-bold text-base" style={{ color: foregroundToUse }}>
                            {formatCurrency(it.promo_price, menu?.currency)}
                          </p>
                        </div>
                      ) : (
                        <p className="font-bold text-base mt-2" style={{ color: foregroundToUse }}>
                          {formatCurrency(it.price, menu?.currency)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {filteredCategories.map((cat) => {
            const visibleItems = (cat.menu_items || []).filter((it) => it.visible);
            if (visibleItems.length === 0) return null;

            return (
              <div key={cat.id} id={cat.id.slice(0, 5)} className="rounded">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3 flex-wrap pt-6">
                    <strong style={{ color: foregroundToUse }}>{cat.name}</strong>
                    {categoryCombos[cat.id]?.length > 0 && (
                      <span className="text-xs font-semibold flex flex-wrap gap-x-2" style={{ color: menu.details_color }}>
                        {describeCombos(categoryCombos[cat.id], menu?.currency).map((line, idx) => (
                          <span key={idx}>{line}</span>
                        ))}
                      </span>
                    )}
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
                              className="w-[72px] h-[72px] shrink-0 overflow-hidden rounded-lg"
                              onClick={() => handleItemClick(it)}
                            >
                              <Image
                                unoptimized
                                src={supabaseImg(it.image_url, { width: 120, height: 120, quality: 80 })}
                                alt={it.name}
                                width={72}
                                height={72}
                                className="object-cover w-full h-full"
                                loading="lazy"
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

                            {itemCombos[it.id]?.length > 0 && (
                              <div className="text-xs font-semibold mt-1 space-y-0.5" style={{ color: menu.details_color }}>
                                {describeCombos(itemCombos[it.id], menu?.currency).map((line, idx) => (
                                  <div key={idx}>{line}</div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-end justify-between mt-2">
                          {/* preço */}
                          {it.promo_price && canShowPromoPrice ? (
                            <div>
                              <span className="text-xs xs:text-sm line-through" style={{ color: grayToUse }}>
                                {formatCurrency(it.price, menu?.currency)}
                              </span>
                              <div className="font-bold text-xl lg:text-2xl" style={{ color: foregroundToUse }}>
                                {formatCurrency(it.promo_price, menu?.currency)}
                              </div>
                            </div>
                          ) : (
                            <div className="font-bold text-2xl" style={{ color: foregroundToUse }}>
                              {formatCurrency(it.price, menu?.currency)}
                            </div>
                          )}

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
            setSelectedOptions({});
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
          <div className="flex flex-col gap-4 sm:min-w-[460px] max-h-[70dvh] overflow-auto scrollbar-none">
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
                    src={supabaseImg(selectedItem.image_url, { width: 160, height: 160, quality: 80 })}
                    alt={selectedItem.name}
                    width={120}
                    height={120}
                    className="object-cover w-full h-full"
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
                        className="min-h-[64px] max-h-[64px] sm:min-h-[80px] sm:max-h-[80px] overflow-auto text-sm pr-1"
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
                      {formatCurrency(selectedItem.price, menu?.currency)}
                    </span>
                    <span className="text-2xl font-semibold" style={{ color: foregroundToUse }}>
                      {formatCurrency(selectedItem.promo_price, menu?.currency)}
                    </span>
                  </div>
                ) : (
                  <>
                    {selectedItem.price ? (
                      <span className="text-3xl font-semibold" style={{ color: foregroundToUse }}>
                        {formatCurrency(selectedItem.price, menu?.currency)}
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

            {menu.orders === "none" && Array.isArray(selectedItem.option_groups) && selectedItem.option_groups.length > 0 ? (
              <div className="space-y-3">
                {selectedItem.option_groups.map((g) => (
                  <div key={g.id}>
                    <p className="font-bold">{g.name}:</p>
                    {(g.option_choices || [])
                      .filter((c) => !c.hidden)
                      .map((c, idx, arr) => (
                        <span key={c.id}>
                          {c.name}
                          {idx < arr.length - 1 && ", "}
                        </span>
                      ))}
                  </div>
                ))}
              </div>
            ) : null}

            {menu.orders !== "none" ? (
              <>
                {Array.isArray(selectedItem.option_groups) && selectedItem.option_groups.length > 0 && (
                  <div className="space-y-4 mb-2">
                    {selectedItem.option_groups.map((g) => {
                      const min = Number(g.min_choices ?? 0);
                      const max = Number(g.max_choices ?? 0);
                      const selectedIds = selectedOptions[g.id] || [];

                      return (
                        <div key={g.id} className="space-y-2">
                          <div className="font-semibold flex items-center gap-2" style={{ color: foregroundToUse }}>
                            <span>{g.name}</span>
                            <span className="text-xs font-normal" style={{ color: grayToUse }}>
                              {min > 0 ? `(obrigatório, mín. ${min})` : "(opcional)"}
                              {max > 0 ? ` · máx. ${max}` : ""}
                            </span>
                          </div>

                          <div className="flex flex-wrap gap-3">
                            {(g.option_choices || [])
                              .filter((c) => !c.hidden)
                              .map((c) => {
                                const isSelected = selectedIds.includes(c.id);
                                const boxBg = isSelected ? "#16a34a44" : translucidToUse;

                                return (
                                  <button
                                    key={c.id}
                                    type="button"
                                    onClick={() => toggleOptionChoice(g, c)}
                                    className="flex flex-col items-center justify-center rounded-lg cursor-pointer p-2 min-w-[120px] text-center"
                                    style={{
                                      backgroundColor: boxBg,
                                      color: foregroundToUse,
                                      border: isSelected ? `1px solid #16a34a88` : "1px solid transparent",
                                    }}
                                  >
                                    <div className="font-medium truncate">
                                      {c.name}{" "}
                                      {Number(c.price) !== 0 && (
                                        <span className="text-sm" style={{ color: grayToUse }}>
                                          {formatCurrency(c.price, menu?.currency)}
                                        </span>
                                      )}
                                    </div>
                                  </button>
                                );
                              })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            ) : null}
          </div>
          {menu.orders !== "none" && (
            <div className="flex items-center justify-between mt-4">
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
                <span style={{ color: grayToUse }}>({formatCurrency(totalPrice, menu?.currency)})</span>
              </div>

              <button
                onClick={handleAddToCart}
                className="cursor-pointer p-2 gap-2 font-bold flex items-center justify-center rounded hover:opacity-90 transition"
                style={{ backgroundColor: menu.details_color, color: getContrastTextColor(menu.details_color) }}
              >
                <span>Adicionar {quantity} ao carrinho</span>
                <FaShoppingCart />
              </button>
            </div>
          )}
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
                src={supabaseImg(selectedItem.image_url, { width: 900, height: 900, quality: 100 })}
                alt={selectedItem.name}
                width={900}
                height={900}
                className="w-full h-full object-cover"
                unoptimized
              />
            </button>
          </div>
        </div>
      )}

      {/* Carrinho */}
      <CartDrawer
        menu={menu}
        combos={combos}
        open={cartOpen}
        onOpen={() => setCartOpen(true)}
        bgColor={menu.background_color}
        translucidToUse={translucidToUse}
        grayToUse={grayToUse}
        foregroundToUse={foregroundToUse}
        onClose={closeCartProgrammatically}
        isOpen={open}
        ownerPhone={ownerPhone}
        ownerRole={ownerRole}
        ownerStripeAccount={ownerStripeAccount}
        pendingStripeOrderId={pendingStripeOrderId}
        onPendingStripeOrderResolved={() => setPendingStripeOrderId(null)}
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
