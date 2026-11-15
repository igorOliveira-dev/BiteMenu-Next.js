"use client";

// Lógica comum dos 3 layouts do cardápio (ClientMenu, ClientMenu2, ClientMenu3).
// Cada layout só desenha cabeçalho/lista; modais, carrinho e footer ficam em components/MenuShell.jsx.
import useDemoTheme from "./useDemoTheme";
import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useCartContext } from "@/contexts/CartContext";
import { stockError } from "@/lib/stock";
import { formatCurrency } from "@/lib/formatCurrency";
import { useAlert } from "@/providers/AlertProvider";
import { supabase } from "@/lib/supabaseClient";
import { getCombosByMenuId } from "@/lib/queries/combos";
import useModalBackHandler from "@/hooks/useModalBackHandler";
import useManualStore from "@/hooks/useManualStore";
import { useThemeColor } from "@/providers/ThemeColorProvider";
import { useCookieConsent } from "@/providers/CookieConsentProvider";
import { getClosingTime, getNextOpenInfo, isOpenNow, nowInZone, shiftTime, zoneOffset } from "@/utils/storeHours";
import { getContrastTextColor } from "@/utils/color";

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

// scroll com offset até a categoria
export function scrollToCategoryId(id, offset = 15) {
  const el = document.getElementById(id);
  if (!el) return false;

  const scrollable = findScrollParent(el);

  if (scrollable === window) {
    const elementTop = el.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: Math.max(0, elementTop - offset), behavior: "smooth" });
  } else {
    const parentRect = scrollable.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    const relativeTop = elRect.top - parentRect.top + scrollable.scrollTop;
    scrollable.scrollTo({ top: Math.max(0, relativeTop - offset), behavior: "smooth" });
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

export function describeCombos(combos, currency) {
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
      const trigger =
        type === "quantity" ? `${c.trigger_value}un+ ` : ` ${formatCurrency(c.trigger_value, currency)}+ `;
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

export function isSafeImageUrl(url) {
  return typeof url === "string" && url.length > 8 && (url.startsWith("http://") || url.startsWith("https://"));
}

export default function useClientMenu(rawMenu, ownerRole, demoTheme) {
  const menu = useDemoTheme(rawMenu, demoTheme);
  const cart = useCartContext();
  const alert = useAlert();

  const [imagePreviewOpen, setImagePreviewOpen] = useState(false);
  const [imagePreviewVisible, setImagePreviewVisible] = useState(false);
  const [animateCart, setAnimateCart] = useState(false);
  const [hoursModalOpen, setHoursModalOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutSignal, setCheckoutSignal] = useState(0); // atendente IA: +1 = fazer o "Continuar compra"

  const manualStore = useManualStore(menu.id);
  const open = useMemo(
    () => (manualStore.control ? manualStore.open : isOpenNow(menu.hours, menu.timezone)),
    [menu.hours, menu.timezone, manualStore],
  );
  const closingTime = useMemo(
    () => (manualStore.control ? null : getClosingTime(menu.hours, menu.timezone)),
    [menu.hours, menu.timezone, manualStore.control],
  );
  const nextOpenInfo = useMemo(
    () => (manualStore.control ? null : getNextOpenInfo(menu.hours, menu.timezone)),
    [menu.hours, menu.timezone, manualStore.control],
  );

  const contrast = useMemo(() => getContrastTextColor(menu.background_color), [menu.background_color]);
  const translucidToUse = contrast === "white" ? "#ffffff15" : "#00000015";
  const grayToUse = contrast === "white" ? "#cccccc" : "#333333";
  const foregroundToUse = contrast === "white" ? "#fafafa" : "#171717";

  const openColor = contrast === "white" ? "#4ade80" : "#15803d"; // verde claro / verde escuro
  const closedColor = contrast === "white" ? "#f87171" : "#b91c1c"; // vermelho claro / vermelho escuro

  const todayKey = nowInZone(menu.timezone).dayKey;

  // horários exibidos no fuso de quem abre; aberto/fechado segue no fuso da loja.
  // fuso do cliente lido só no cliente pra não divergir do SSR
  // ponytail: usa o offset de hoje pra semana toda, ignora horário de verão em outros dias
  const [viewerTz, setViewerTz] = useState(null);
  useEffect(() => setViewerTz(Intl.DateTimeFormat().resolvedOptions().timeZone), []);
  const viewerOffset = useMemo(() => (viewerTz ? zoneOffset(viewerTz) : null), [viewerTz]);
  const tzDiff = useMemo(
    () => (viewerOffset === null ? 0 : viewerOffset - zoneOffset(menu.timezone)),
    [viewerOffset, menu.timezone],
  );
  const toViewer = (time) => shiftTime(time, tzDiff);

  const statusText = open
    ? closingTime
      ? `Aberto até às ${toViewer(closingTime)}h`
      : "Aberto agora"
    : nextOpenInfo
      ? `Abre ${nextOpenInfo.label} às ${toViewer(nextOpenInfo.time)}h`
      : "Fechado";

  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState({});
  const [selectedVariation, setSelectedVariation] = useState(null);
  const [note, setNote] = useState("");
  const { bannerHeight } = useCookieConsent();

  const orderedCategories = useMemo(() => {
    return (menu?.categories || []).slice().sort((a, b) => Number(a.position ?? 0) - Number(b.position ?? 0));
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
    getCombosByMenuId(supabase, menu.id).then(({ data, error }) => {
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
    setSelectedVariation(null);
    setNote("");
  }, []);

  const alertColors = {
    backgroundColor: `${menu.details_color}90`,
    textColor: getContrastTextColor(menu.details_color),
  };

  const toggleOptionChoice = (group, choice) => {
    const groupId = group.id;
    const max = Number(group.max_choices ?? 0);
    const current = selectedOptions[groupId] || [];
    const isSelected = current.includes(choice.id);

    if (!isSelected && max > 0 && max !== 1 && current.length >= max) {
      alert?.(`Você pode escolher no máximo ${max} opç${max === 1 ? "ão" : "ões"} em "${group.name}".`, "error", alertColors);
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

  // fade da descrição rolável no modal do produto
  const [showFade, setShowFade] = useState(false);
  const descRef = useRef(null);

  useEffect(() => {
    const el = descRef.current;
    if (!el) return;
    const checkScroll = () => setShowFade(el.scrollTop + el.clientHeight < el.scrollHeight - 1);
    checkScroll();
    el.addEventListener("scroll", checkScroll);
    return () => el.removeEventListener("scroll", checkScroll);
  }, [selectedItem]);

  const hasPlusPermissions = ["plus", "pro", "business", "enterprise", "admin", "designer"].includes(ownerRole);
  const canShowPromoPrice = hasPlusPermissions;

  const totalPrice = useMemo(() => {
    if (!selectedItem) return 0;
    const chosen = selectedItem.variations?.options?.[selectedVariation];
    const base = chosen
      ? Number(chosen.price)
      : Number(selectedItem.promo_price && canShowPromoPrice ? selectedItem.promo_price : selectedItem.price || 0);

    const groups = selectedItem.option_groups || [];
    const optionsTotal = groups.reduce((acc, g) => {
      const selectedIds = selectedOptions[g.id] || [];
      const groupSum = (g.option_choices || []).reduce((s, c) => {
        return selectedIds.includes(c.id) ? s + Number(c.price || 0) : s;
      }, 0);
      return acc + groupSum;
    }, 0);

    return (base + optionsTotal) * quantity;
  }, [selectedItem, quantity, selectedOptions, selectedVariation, canShowPromoPrice]);

  const openImagePreview = () => setImagePreviewOpen(true);
  const closeImagePreview = () => {
    setImagePreviewVisible(false);
    setTimeout(() => setImagePreviewOpen(false), 220);
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

  const handleAddToCart = async () => {
    if (!selectedItem) return;

    const chosen = selectedItem.variations?.options?.[selectedVariation];
    if (selectedItem.variations?.options?.length > 0 && !chosen) {
      alert?.(`Escolha uma opção em "${selectedItem.variations.name}".`, "error", alertColors);
      return;
    }

    const groups = selectedItem.option_groups || [];

    for (const g of groups) {
      const selectedIds = selectedOptions[g.id] || [];
      const min = Number(g.min_choices ?? 0);
      const max = Number(g.max_choices ?? 0);

      if (min > 0 && selectedIds.length < min) {
        alert?.(`Escolha pelo menos ${min} opç${min === 1 ? "ão" : "ões"} em "${g.name}".`, "error", alertColors);
        return;
      }

      if (max > 0 && selectedIds.length > max) {
        alert?.(`Você pode escolher no máximo ${max} opç${max === 1 ? "ão" : "ões"} em "${g.name}".`, "error", alertColors);
        return;
      }
    }

    const selected = groups.flatMap((g) => {
      const selectedIds = selectedOptions[g.id] || [];
      return (g.option_choices || [])
        .filter((c) => selectedIds.includes(c.id))
        .map((c) => ({ id: c.id, group: g.name, name: c.name, price: Number(c.price) }));
    });

    const outOfStock = stockError(ownerRole, cart.getItems(menu.id), selectedItem, Number(quantity || 1), selected.map((s) => s.id));
    if (outOfStock) {
      alert?.(outOfStock, "error", alertColors);
      return;
    }

    cart.addItem(menu.id, {
      id: selectedItem.id,
      name: chosen ? `${selectedItem.name} (${chosen.name})` : selectedItem.name,
      image_url: selectedItem.image_url || null,
      price: chosen
        ? Number(chosen.price)
        : Number(selectedItem.promo_price && canShowPromoPrice ? selectedItem.promo_price : selectedItem.price || 0),
      qty: Number(quantity || 1),
      additionals: selected, // mantém o nome "additionals" para não quebrar CartDrawer/checkout, ou renomeie em conjunto
      note: note || "",
    });

    alert("Item adicionado ao carrinho!", "info", alertColors);

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

  const closeHoursModal = () => setHoursModalOpen(false);

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

  // botão do carrinho sobe quando o footer aparece
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

  const combosBy = (scope, key) => {
    if (!hasPlusPermissions) return {};
    const map = {};
    combos
      .filter((c) => c.scope === scope)
      .forEach((c) => {
        if (!map[c[key]]) map[c[key]] = [];
        map[c[key]].push(c);
      });
    return map;
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const itemCombos = useMemo(() => combosBy("item", "item_id"), [combos, hasPlusPermissions]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const categoryCombos = useMemo(() => combosBy("category", "category_id"), [combos, hasPlusPermissions]);

  return {
    menu,
    cart,
    combos,
    // cores
    translucidToUse,
    grayToUse,
    foregroundToUse,
    openColor,
    closedColor,
    // horários
    open,
    statusText,
    todayKey,
    tzDiff,
    viewerOffset,
    toViewer,
    hoursModalOpen,
    setHoursModalOpen,
    closeHoursModal,
    // lista
    searchTerm,
    setSearchTerm,
    filteredCategories,
    navCategories,
    totalVisibleItems,
    starredItems,
    hasStarred,
    hasPlusPermissions,
    canShowPromoPrice,
    itemCombos,
    categoryCombos,
    // modal do produto
    itemModalOpen,
    selectedItem,
    handleItemClick,
    closeItemModal,
    quantity,
    setQuantity,
    selectedOptions,
    toggleOptionChoice,
    selectedVariation,
    setSelectedVariation,
    note,
    setNote,
    totalPrice,
    handleAddToCart,
    descRef,
    showFade,
    imagePreviewOpen,
    imagePreviewVisible,
    openImagePreview,
    closeImagePreview,
    // carrinho
    cartOpen,
    setCartOpen,
    openCart,
    closeCartProgrammatically,
    animateCart,
    checkoutSignal,
    setCheckoutSignal,
  };
}
