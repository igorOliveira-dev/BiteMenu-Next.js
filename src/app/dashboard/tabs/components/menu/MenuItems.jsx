"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  FaBullhorn,
  FaChevronLeft,
  FaCog,
  FaCopy,
  FaEye,
  FaEyeSlash,
  FaMinus,
  FaPlus,
  FaShoppingCart,
  FaStar,
} from "react-icons/fa";
import { DndContext, closestCenter, PointerSensor, TouchSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { FaGripVertical } from "react-icons/fa";
import Image from "next/image";
import GenericModal from "@/components/GenericModal";
import { useCartContext } from "@/contexts/CartContext";
import { supabase } from "@/lib/supabaseClient";
import useMenu from "@/hooks/useMenu";
import { formatCurrency, getCurrencySymbol } from "@/lib/formatCurrency";
import { FaPen, FaTrash, FaChevronRight, FaChevronUp, FaChevronDown } from "react-icons/fa";
import { useAlert } from "@/providers/AlertProvider";
import { useConfirm } from "@/providers/ConfirmProvider";
import { uploadItemImage } from "@/lib/uploadImage";
import UpdatePlanModal from "../UpdatePlanModal";
import { fileToWebp } from "@/app/utils/imageToWebp";
import { trackAction } from "@/utils/userActions";
import { FaEllipsisVertical } from "react-icons/fa6";
import { createPortal } from "react-dom";
import { useLayoutEffect } from "react";

function getContrastTextColor(hex) {
  const cleanHex = (hex || "").replace("#", "");
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? "black" : "white";
}

function buildCopyName(originalName, existingNames = []) {
  // remove sufixo "(cópia)" ou "(cópia N)" já existente no final do nome
  const baseName = String(originalName || "")
    .replace(/\s*\(cópia(?:\s+\d+)?\)\s*$/i, "")
    .trim();

  // gera "Nome (cópia)", e se já existir, "Nome (cópia 2)", "Nome (cópia 3)"...
  let candidate = `${baseName} (cópia)`;
  let counter = 2;

  while (existingNames.includes(candidate)) {
    candidate = `${baseName} (cópia ${counter})`;
    counter++;
  }

  return candidate.slice(0, 25); // respeita o maxLength do campo nome
}

const uid = () => (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `tmp-${Date.now()}`);

function findScrollParent(el) {
  let parent = el?.parentElement;
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

function ItemActionsMenu({ anchorRef, onClose, children, menuBg, borderColor }) {
  const menuRef = useRef(null);
  const [pos, setPos] = useState(null);
  const [ready, setReady] = useState(false);

  useLayoutEffect(() => {
    function updatePosition() {
      if (!anchorRef.current || !menuRef.current) return;

      const margin = 8;
      const gap = 6;

      const anchorRect = anchorRef.current.getBoundingClientRect();
      const menuRect = menuRef.current.getBoundingClientRect();

      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      const spaceBelow = viewportHeight - anchorRect.bottom;
      const spaceAbove = anchorRect.top;

      let top;
      if (spaceBelow >= menuRect.height + gap || spaceBelow >= spaceAbove) {
        top = anchorRect.bottom + gap;
      } else {
        top = anchorRect.top - menuRect.height - gap;
      }
      top = Math.min(Math.max(top, margin), viewportHeight - menuRect.height - margin);

      const spaceRightAligned = anchorRect.right - menuRect.width;
      const spaceLeftAligned = viewportWidth - (anchorRect.left + menuRect.width);

      let left;
      if (spaceRightAligned < margin && spaceLeftAligned >= margin) {
        left = anchorRect.left;
      } else {
        left = anchorRect.right - menuRect.width;
      }
      left = Math.min(Math.max(left, margin), viewportWidth - menuRect.width - margin);

      setPos({ top, left });
      setReady(true);
    }

    updatePosition();
  }, [anchorRef]);

  useEffect(() => {
    if (!anchorRef.current) return;

    const scrollParent = findScrollParent(anchorRef.current);
    const target = scrollParent === window ? window : scrollParent;

    const initialTop = scrollParent === window ? window.scrollY : scrollParent.scrollTop;
    const initialLeft = scrollParent === window ? window.scrollX : scrollParent.scrollLeft;

    function handleScroll() {
      const currentTop = scrollParent === window ? window.scrollY : scrollParent.scrollTop;
      const currentLeft = scrollParent === window ? window.scrollX : scrollParent.scrollLeft;

      const dy = Math.abs(currentTop - initialTop);
      const dx = Math.abs(currentLeft - initialLeft);

      if (dy > 4 || dx > 4) {
        onClose();
      }
    }

    target.addEventListener("scroll", handleScroll);
    return () => target.removeEventListener("scroll", handleScroll);
  }, [anchorRef, onClose]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target) &&
        anchorRef.current &&
        !anchorRef.current.contains(e.target)
      ) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [anchorRef, onClose]);

  return createPortal(
    <div
      ref={menuRef}
      style={{
        position: "fixed",
        top: pos ? pos.top : -9999,
        left: pos ? pos.left : -9999,
        visibility: ready ? "visible" : "hidden",
        backgroundColor: menuBg,
        border: `1px solid ${borderColor}`,
        borderRadius: 8,
        overflow: "hidden",
        boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
        zIndex: 9999,
        minWidth: 170,
      }}
    >
      {children}
    </div>,
    document.body,
  );
}

function SortableMenuItem({
  item,
  cat,
  openItemModal,
  deleteItem,
  duplicateItem,
  toggleItemVisibility,
  detailsColor,
  backgroundColor,
  foregroundToUse,
  grayToUse,
  canShowPromoPrice,
  getContrastTextColor,
  currency,
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });

  const [menuOpen, setMenuOpen] = useState(false);
  const menuBtnRef = useRef(null);

  const isLightBg = getContrastTextColor(backgroundColor) === "white";
  const menuBg = isLightBg ? "#2b2b2b" : "#ffffff";
  const menuBorder = isLightBg ? "#ffffff20" : "#00000015";
  const menuHover = isLightBg ? "#ffffff10" : "#00000008";
  const menuText = isLightBg ? "#eaeaea" : "#171717";

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.75 : 1,
  };

  const dragHandleProps = {
    ...attributes,
    ...listeners,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex gap-2 items-stretch">
      <div
        className="flex-1 flex rounded-lg overflow-hidden transition-opacity"
        style={{
          opacity: item.visible === false ? 0.5 : 1,
        }}
      >
        <div
          className="flex-1 min-w-0 p-2 sm:p-3 min-h-[100px] flex flex-col justify-between relative"
          style={{
            backgroundColor: isLightBg ? "#ffffff10" : "#00000010",
          }}
        >
          {/* Botão de ações, flutuante, fora do fluxo do layout */}
          <button
            ref={menuBtnRef}
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => setMenuOpen((prev) => !prev)}
            className="cursor-pointer absolute top-2 right-2 p-2 rounded"
            style={{
              backgroundColor: getContrastTextColor(backgroundColor) === "white" ? "#ffffff25" : "#00000025",
              color: foregroundToUse,
            }}
          >
            <FaEllipsisVertical />
          </button>

          {menuOpen && (
            <ItemActionsMenu
              anchorRef={menuBtnRef}
              onClose={() => setMenuOpen(false)}
              menuBg={menuBg}
              borderColor={menuBorder}
            >
              <button
                type="button"
                onClick={() => {
                  toggleItemVisibility(item.id, item.visible);
                  setMenuOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-3 text-sm text-left cursor-pointer transition"
                style={{ color: menuText }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = menuHover)}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
              >
                {item.visible === false ? <FaEye size={13} /> : <FaEyeSlash size={13} />}
                {item.visible === false ? "Exibir item" : "Ocultar item"}
              </button>

              <button
                type="button"
                onClick={() => {
                  openItemModal("edit", cat.id, item);
                  setMenuOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-3 text-sm text-left cursor-pointer transition"
                style={{ color: menuText }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = menuHover)}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
              >
                <FaPen size={13} />
                Editar item
              </button>

              <button
                type="button"
                onClick={() => {
                  duplicateItem(cat.id, item);
                  setMenuOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-3 text-sm text-left cursor-pointer transition"
                style={{ color: menuText }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = menuHover)}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
              >
                <FaCopy size={13} />
                Duplicar item
              </button>

              <button
                type="button"
                onClick={() => {
                  deleteItem(cat.id, item.id);
                  setMenuOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-left cursor-pointer transition text-red-500"
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = menuHover)}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
              >
                <FaTrash size={13} />
                Excluir item
              </button>
            </ItemActionsMenu>
          )}

          <div className="flex items-start gap-3 min-w-0 pr-8">
            {item.image_url && (
              <div
                {...dragHandleProps}
                className="cursor-grab active:cursor-grabbing"
                style={{ touchAction: "none", flexShrink: 0 }}
              >
                <img
                  src={item.image_url}
                  alt={item.name}
                  loading="lazy"
                  decoding="async"
                  draggable={false}
                  className="w-[54px] h-[54px] object-cover rounded-lg sm:rounded-l-lg"
                />
              </div>
            )}

            <div className="min-w-0">
              <div className="text-xl line-clamp-1" style={{ color: foregroundToUse }}>
                {item.name}
              </div>
              <div className="text-sm line-clamp-1" style={{ color: grayToUse }}>
                {item.description}
              </div>
            </div>
          </div>

          <div className="mt-2">
            {item.promo_price && canShowPromoPrice ? (
              <div className="flex items-baseline gap-2">
                <div className="text-2xl font-bold" style={{ color: foregroundToUse }}>
                  {formatCurrency(item.promo_price, currency)}
                </div>
                <span className="text-sm line-through" style={{ color: grayToUse }}>
                  {formatCurrency(item.price, currency)}
                </span>
              </div>
            ) : (
              <div className="text-2xl font-bold" style={{ color: foregroundToUse }}>
                {item.price ? formatCurrency(item.price, currency) : "-"}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------------------

export default function MenuItems({ backgroundColor, detailsColor, changedFields }) {
  const { menu, loading: menuLoading } = useMenu();
  const [ownerRole, setOwnerRole] = useState(null);

  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [planModalFeature, setPlanModalFeature] = useState(null);

  const [additionalsCfgOpen, setAdditionalsCfgOpen] = useState(false);
  const [additionalsCfgDraft, setAdditionalsCfgDraft] = useState(null);
  const [cfgGroupIdx, setCfgGroupIdx] = useState(null);
  const [optionGroupsModalOpen, setOptionGroupsModalOpen] = useState(false);

  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importableGroups, setImportableGroups] = useState([]);
  const [selectedImportIds, setSelectedImportIds] = useState(new Set());
  const [expandedImportItemId, setExpandedImportItemId] = useState(null);

  const [categoryMenuOpenId, setCategoryMenuOpenId] = useState(null);
  const categoryMenuBtnRefs = useRef({});

  const [starredMenuOpenId, setStarredMenuOpenId] = useState(null);
  const starredMenuBtnRefs = useRef({});

  const [collapsedCategories, setCollapsedCategories] = useState({});
  const toggleCategoryCollapse = (catId) => {
    setCollapsedCategories((prev) => ({ ...prev, [catId]: !prev[catId] }));
  };

  const menuBg = getContrastTextColor(backgroundColor) === "white" ? "#2b2b2b" : "#ffffff";
  const menuBorder = getContrastTextColor(backgroundColor) === "white" ? "#ffffff20" : "#00000015";
  const menuHover = getContrastTextColor(backgroundColor) === "white" ? "#ffffff10" : "#00000008";
  const menuText = getContrastTextColor(backgroundColor) === "white" ? "#eaeaea" : "#171717";

  const closingAdditionalsCfgFromPop = useRef(false);
  const closingOptionGroupsFromPop = useRef(false);
  const closingImportFromPop = useRef(false);
  const closingCrudFromPop = useRef(false);
  const closingPlanFromPop = useRef(false);
  const ignoreNextPop = useRef(false);

  const alert = useAlert();
  const confirm = useConfirm();

  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState(null);

  const hasPlusPermissions = ownerRole === "admin" || ownerRole === "plus" || ownerRole === "pro";

  const [showCatIndicator, setShowCatIndicator] = useState(false);

  const [showUpgradePlanModal, setShowUpgradePlanModal] = useState(false);

  const canShowPromoPrice = hasPlusPermissions;
  const canHighlightItems = hasPlusPermissions;

  const [saving, setSaving] = useState(false);

  // modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalPayload, setModalPayload] = useState({
    type: null,
    mode: null,
    categoryId: null,
    itemId: null,
    data: {},
  });

  // upload state
  const [uploadingImage, setUploadingImage] = useState(false);

  // collapse map for sort modal
  const [sortCollapsed, setSortCollapsed] = useState({});
  // refs to DOM nodes (used for FLIP)
  const domRefs = useRef({});

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 180,
        tolerance: 8,
      },
    }),
  );

  // fetch categories/items
  useEffect(() => {
    if (menuLoading) return;
    if (!menu?.id) {
      setCategories([]);
      return;
    }
    let mounted = true;
    const fetchCats = async () => {
      setLoading(true);
      try {
        const selectStr = `
          id,
          name,
          position,
          menu_items (
            id,
            category_id,
            name,
            price,
            promo_price,
            description,
            additionals,
            image_url,
            position,
            visible,
            starred,
            mandatory_additional,
            additionals_limit
          )
        `;

        const { data, error } = await supabase
          .from("categories")
          .select(selectStr)
          .eq("menu_id", menu.id)
          .order("position", { ascending: true });

        if (error) throw error;

        if (!mounted) return;

        const mapped = (data || []).map((c) => {
          const items = Array.isArray(c.menu_items)
            ? [...c.menu_items].sort((a, b) => Number(a.position ?? 0) - Number(b.position ?? 0))
            : [];
          return { ...c, menu_items: items };
        });

        setCategories(mapped);
      } catch (err) {
        console.error("Erro ao buscar categories/menu_items:", err);
        alert?.("Erro ao carregar categorias (ver console)", "error");
        if (mounted) setCategories([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchCats();
    return () => {
      mounted = false;
    };
  }, [menuLoading, menu?.id]);

  useEffect(() => {
    if (!menu?.owner_id) return;

    const fetchOwnerRole = async () => {
      const { data, error } = await supabase.from("profiles").select("role").eq("id", menu.owner_id).single();

      if (error) {
        console.error("Erro ao buscar role do dono:", error);
        return;
      }

      setOwnerRole(data.role);
    };
    fetchOwnerRole();
  }, [menu?.owner_id]);

  useEffect(() => {
    console.log("Owner role atualizado:", ownerRole);
  }, [ownerRole]);

  useEffect(() => {
    if (modalOpen) {
      history.pushState({ modal: true }, "");
    }
  }, [modalOpen]);

  useEffect(() => {
    if (planModalOpen) {
      history.pushState({ planModal: true }, "");
    }
  }, [planModalOpen]);

  useEffect(() => {
    if (optionGroupsModalOpen) {
      history.pushState({ optionGroupsModal: true }, "");
    }
  }, [optionGroupsModalOpen]);

  useEffect(() => {
    if (importModalOpen) {
      history.pushState({ importModal: true }, "");
    }
  }, [importModalOpen]);

  useEffect(() => {
    if (additionalsCfgOpen) {
      history.pushState({ additionalsCfgModal: true }, "");
    }
  }, [additionalsCfgOpen]);

  // fechar modal com botão voltar do navegador
  useEffect(() => {
    const handlePopState = () => {
      if (ignoreNextPop.current) {
        ignoreNextPop.current = false;
        return;
      }

      if (additionalsCfgOpen) {
        closingAdditionalsCfgFromPop.current = true;
        setAdditionalsCfgOpen(false);
        setAdditionalsCfgDraft(null);
        setCfgGroupIdx(null);
        queueMicrotask(() => (closingAdditionalsCfgFromPop.current = false));
        return;
      }

      if (importModalOpen) {
        closingImportFromPop.current = true;
        setImportModalOpen(false);
        queueMicrotask(() => (closingImportFromPop.current = false));
        return;
      }

      if (optionGroupsModalOpen) {
        closingOptionGroupsFromPop.current = true;
        setOptionGroupsModalOpen(false);
        queueMicrotask(() => (closingOptionGroupsFromPop.current = false));
        return;
      }

      if (planModalOpen) {
        closingPlanFromPop.current = true;
        setPlanModalOpen(false);
        setPlanModalFeature(null);
        queueMicrotask(() => (closingPlanFromPop.current = false));
        return;
      }

      if (modalOpen) {
        closingCrudFromPop.current = true;
        setModalOpen(false);
        setModalPayload({ type: null, mode: null, categoryId: null, itemId: null, data: {} });
        queueMicrotask(() => (closingCrudFromPop.current = false));
        return;
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [modalOpen, planModalOpen, additionalsCfgOpen, additionalsCfgDraft, optionGroupsModalOpen, importModalOpen]);

  // verifica se existe alguma categoria criada
  useEffect(() => {
    if (!loading && categories?.length === 0) {
      console.log("Sem categorias encontradas");
      alert("Clique no botão '+ categoria' para começar a adicionar seus itens!", "slow");
      setShowCatIndicator(true);
    }
  }, [loading]);

  const closePlanModal = () => {
    setPlanModalOpen(false);
    setPlanModalFeature(null);

    if (history.state?.planModal && !closingPlanFromPop.current) {
      ignoreNextPop.current = true; // <- chave do rolê
      history.back();
    }

    closingPlanFromPop.current = false;
  };

  const closeModal = () => {
    setSaving(false);
    setAdditionalsCfgDraft(null);
    setAdditionalsCfgOpen(false);
    setCfgGroupIdx(null);
    setOptionGroupsModalOpen(false);
    setModalOpen(false);
    setModalPayload({ type: null, mode: null, categoryId: null, itemId: null, data: {} });

    if (history.state?.modal && !closingCrudFromPop.current) {
      ignoreNextPop.current = true;
      history.back();
    }

    closingCrudFromPop.current = false;
  };

  // Fechar modal de grupos de opções
  const closeOptionGroupsModal = () => {
    setOptionGroupsModalOpen(false);
    if (history.state?.optionGroupsModal && !closingOptionGroupsFromPop.current) {
      ignoreNextPop.current = true;
      history.back();
    }
    closingOptionGroupsFromPop.current = false;
  };

  // Fechar modal de importação
  const closeImportModal = () => {
    setImportModalOpen(false);
    if (history.state?.importModal && !closingImportFromPop.current) {
      ignoreNextPop.current = true;
      history.back();
    }
    closingImportFromPop.current = false;
  };

  // fechar modal de configuração de adicionais
  const closeAdditionalsCfgModal = () => {
    setAdditionalsCfgOpen(false);
    setAdditionalsCfgDraft(null);
    setCfgGroupIdx(null);
    if (history.state?.additionalsCfgModal && !closingAdditionalsCfgFromPop.current) {
      ignoreNextPop.current = true;
      history.back();
    }
    closingAdditionalsCfgFromPop.current = false;
  };

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
      // calcula posição relativa ao scrollable
      const relativeTop = elRect.top - parentRect.top + scrollable.scrollTop;
      const target = Math.max(0, relativeTop - offset);
      scrollable.scrollTo({ top: target, behavior: "smooth" });
    }

    // atualiza hash sem recarregar a página
    try {
      history.replaceState(null, "", `#${id}`);
    } catch (e) {
      // fallback silencioso
    }

    // foco acessível sem scrollear de novo
    try {
      el.setAttribute("tabindex", "-1");
      el.focus({ preventScroll: true });
    } catch (e) {}

    return true;
  }

  // CRUD helpers
  const createCategory = async ({ name = "Nova categoria" } = {}) => {
    const catCount = categories?.length ?? 0;
    const categoryLimit = getCategoryLimitByRole(ownerRole);

    if (catCount >= categoryLimit) {
      openCategoriesLimitModal();
      return null;
    }

    if (!menu?.id) return null;

    const newPos = (categories?.reduce((max, c) => Math.max(max, c.position ?? -1), -1) ?? -1) + 1;

    const tempId = uid();
    const temp = { id: tempId, name, position: newPos, menu_items: [] };

    setCategories((prev = []) => [...prev, temp]);

    try {
      const { data, error } = await supabase
        .from("categories")
        .insert({ menu_id: menu.id, name, position: newPos })
        .select()
        .single();

      if (error) throw error;

      setCategories((prev = []) =>
        prev.map((c) => (c.id === tempId ? { ...data, menu_items: [], position: data.position ?? newPos } : c)),
      );

      alert?.("Categoria criada", "success");
      setShowCatIndicator(false);

      requestAnimationFrame(() => {
        scrollToCategoryId(data.id.slice(0, 5), 50);
      });

      return data;
    } catch (err) {
      console.error("createCategory error:", err);
      setCategories((prev = []) => prev.filter((c) => c.id !== tempId));
      alert?.("Erro ao criar categoria", "error");
      return null;
    }
  };

  const deleteCategory = async (categoryId) => {
    const ok = await confirm("Remover categoria? Essa ação removerá os itens também.");
    if (!ok) return;
    const before = categories;
    setCategories((prev = []) => prev.filter((c) => c.id !== categoryId));
    try {
      const { error } = await supabase.from("categories").delete().eq("id", categoryId);
      if (error) throw error;
      alert?.("Categoria removida", "success");
      return true;
    } catch (err) {
      console.error("deleteCategory error:", err);
      setCategories(before);
      alert?.("Erro ao remover categoria", "error");
      return false;
    }
  };

  // -------------------------------------------------------
  // createItem atualizado para suportar image_url
  const createItem = async (
    categoryId,
    { name = "Novo item", price = "", promo_price = null, description = "", image_url = "" } = {},
  ) => {
    const safeCategories = Array.isArray(categories) ? categories : [];
    const totalItems = safeCategories.reduce((sum, c) => sum + (c.menu_items?.length || 0), 0);

    const itemLimit = getItemLimitByRole(ownerRole);

    if (totalItems >= itemLimit) {
      openItemsLimitModal();
      return null;
    }

    const targetCat = safeCategories.find((c) => c.id === categoryId);
    if (!targetCat) {
      alert?.("Categoria não encontrada.", "error");
      return null;
    }

    const newPos = (targetCat.menu_items || []).reduce((max, it) => Math.max(max, it.position ?? -1), -1) + 1;

    const tempId = uid();

    const tempItem = {
      id: tempId,
      category_id: categoryId,
      name,
      price,
      promo_price,
      description,
      image_url,
      position: newPos,
      visible: true,
      starred: false,
    };

    setCategories((prev = []) =>
      (Array.isArray(prev) ? prev : []).map((c) =>
        c.id === categoryId ? { ...c, menu_items: [...(c.menu_items || []), tempItem] } : c,
      ),
    );

    try {
      const { data, error } = await supabase
        .from("menu_items")
        .insert({
          category_id: categoryId,
          name,
          price,
          promo_price,
          description,
          image_url,
          position: newPos,
        })
        .select()
        .single();

      if (error) throw error;

      setCategories((prev = []) =>
        (Array.isArray(prev) ? prev : []).map((c) =>
          c.id === categoryId
            ? {
                ...c,
                menu_items: (c.menu_items || []).map((it) =>
                  it.id === tempId ? { ...data, position: data.position ?? newPos } : it,
                ),
              }
            : c,
        ),
      );

      alert?.("Item criado", "success");
      return data;
    } catch (err) {
      console.error("createItem error:", err);

      setCategories((prev = []) =>
        (Array.isArray(prev) ? prev : []).map((c) =>
          c.id === categoryId ? { ...c, menu_items: (c.menu_items || []).filter((it) => it.id !== tempId) } : c,
        ),
      );

      alert?.("Erro ao criar item", "error");
      return null;
    }
  };

  const updateItem = async (itemId, patch) => {
    const safeCategories = Array.isArray(categories) ? categories : [];
    const totalItems = safeCategories.reduce((sum, c) => sum + (c.menu_items?.length || 0), 0);

    const itemLimit = getItemLimitByRole(ownerRole);

    if (totalItems > itemLimit) {
      openItemsLimitModal();
      return null;
    }

    const before = categories;

    setCategories((prev = []) =>
      prev.map((c) => ({
        ...c,
        menu_items: (c.menu_items || []).map((it) => (it.id === itemId ? { ...it, ...patch } : it)),
      })),
    );

    try {
      const { data, error } = await supabase.from("menu_items").update(patch).eq("id", itemId).select().single();

      if (error) throw error;

      setCategories((prev = []) =>
        prev.map((c) => ({
          ...c,
          menu_items: (c.menu_items || []).map((it) => (it.id === itemId ? { ...it, ...data } : it)),
        })),
      );

      alert?.("Item atualizado", "success");
      return data;
    } catch (err) {
      console.error("updateItem error:", err);
      setCategories(before);
      alert?.("Erro ao atualizar item", "error");
      return null;
    }
  };

  const deleteItem = async (categoryId, itemId) => {
    const ok = await confirm("Remover item?");
    if (!ok) return;
    const before = categories;
    const itemToDelete = categories.find((c) => c.id === categoryId)?.menu_items?.find((it) => it.id === itemId);

    setCategories((prev = []) =>
      prev.map((c) =>
        c.id === categoryId ? { ...c, menu_items: (c.menu_items || []).filter((it) => it.id !== itemId) } : c,
      ),
    );

    try {
      // se o item tiver imagem, remove também do bucket
      if (itemToDelete?.image_url) {
        const pathStart = itemToDelete.image_url.indexOf("/object/public/product-images/");
        if (pathStart !== -1) {
          const path = itemToDelete.image_url.substring(pathStart + "/object/public/product-images/".length);
          await supabase.storage.from("product-images").remove([path]);
        }
      }

      const { error } = await supabase.from("menu_items").delete().eq("id", itemId);
      if (error) throw error;

      alert?.("Item removido", "success");
      return true;
    } catch (err) {
      console.error("deleteItem error:", err);
      setCategories(before);
      alert?.("Erro ao remover item", "error");
      return false;
    }
  };

  const duplicateItem = async (categoryId, item) => {
    const safeCategories = Array.isArray(categories) ? categories : [];
    const totalItems = safeCategories.reduce((sum, c) => sum + (c.menu_items?.length || 0), 0);
    const itemLimit = getItemLimitByRole(ownerRole);

    if (totalItems >= itemLimit) {
      openItemsLimitModal();
      return null;
    }

    const targetCat = safeCategories.find((c) => c.id === categoryId);
    const existingNames = (targetCat?.menu_items || []).map((it) => it.name);

    const newName = buildCopyName(item.name, existingNames);

    const newItem = await createItem(categoryId, {
      name: newName,
      price: item.price,
      promo_price: item.promo_price,
      description: item.description,
      image_url: item.image_url,
    });

    if (!newItem?.id) return null;

    // busca os option_groups do item original e duplica também
    try {
      const { data: groups, error } = await supabase
        .from("option_groups")
        .select(
          `id, name, min_choices, max_choices, position,
               option_choices ( id, name, price, hidden, position )`,
        )
        .eq("item_id", item.id)
        .order("position", { ascending: true });

      if (error) throw error;

      if (groups?.length > 0) {
        const clonedGroups = groups.map((g) => ({
          id: `tmp-${uid()}`,
          name: g.name,
          min_choices: g.min_choices,
          max_choices: g.max_choices,
          option_choices: (g.option_choices || []).map((c) => ({
            id: `tmp-${uid()}`,
            name: c.name,
            price: c.price,
            hidden: c.hidden,
          })),
        }));

        await saveOptionGroups(newItem.id, clonedGroups);

        // atualiza o estado local pra refletir os grupos duplicados sem precisar refetch
        setCategories((prev = []) =>
          prev.map((c) =>
            c.id === categoryId
              ? {
                  ...c,
                  menu_items: (c.menu_items || []).map((it) => (it.id === newItem.id ? { ...it } : it)),
                }
              : c,
          ),
        );
      }
    } catch (err) {
      console.error("Erro ao duplicar grupos de opções:", err);
    }

    alert?.("Item duplicado", "success");
    return newItem;
  };

  const toggleItemVisibility = async (itemId, currentVisible) => {
    let newVisible = !currentVisible;

    if (currentVisible === null) {
      newVisible = true; // se null, muda pra true
    }

    // Atualiza otimisticamente o estado local
    setCategories((prev = []) =>
      prev.map((c) => ({
        ...c,
        menu_items: (c.menu_items || []).map((it) => (it.id === itemId ? { ...it, visible: newVisible } : it)),
      })),
    );

    try {
      const { data, error } = await supabase
        .from("menu_items")
        .update({ visible: newVisible })
        .eq("id", itemId)
        .select()
        .single();

      if (error) throw error;

      // Garante sincronização com o retorno do Supabase
      setCategories((prev = []) =>
        prev.map((c) => ({
          ...c,
          menu_items: (c.menu_items || []).map((it) => (it.id === itemId ? { ...it, ...data } : it)),
        })),
      );

      alert?.(newVisible ? "Item visível no menu" : "Item ocultado", "success");
    } catch (err) {
      console.error("toggleItemVisibility error:", err);
      alert?.("Erro ao alterar visibilidade do item", "error");

      // Reverte se deu erro
      setCategories((prev = []) =>
        prev.map((c) => ({
          ...c,
          menu_items: (c.menu_items || []).map((it) => (it.id === itemId ? { ...it, visible: currentVisible } : it)),
        })),
      );
    }
  };

  const categoryHasVisibleItems = (cat) => (cat.menu_items || []).some((it) => it.visible !== false);

  const toggleCategoryVisibility = async (categoryId, makeVisible) => {
    const cat = categories.find((c) => c.id === categoryId);
    if (!cat || (cat.menu_items || []).length === 0) return;

    const itemIds = (cat.menu_items || [])
      .map((it) => it.id)
      .filter((id) => typeof id === "string" && !id.startsWith("tmp-"));

    if (itemIds.length === 0) return;

    const before = categories;

    // Atualização otimista
    setCategories((prev = []) =>
      prev.map((c) =>
        c.id === categoryId ? { ...c, menu_items: (c.menu_items || []).map((it) => ({ ...it, visible: makeVisible })) } : c,
      ),
    );

    try {
      const { error } = await supabase.from("menu_items").update({ visible: makeVisible }).in("id", itemIds);

      if (error) throw error;

      alert?.(makeVisible ? "Todos os itens foram exibidos" : "Todos os itens foram ocultados", "success");
    } catch (err) {
      console.error("toggleCategoryVisibility error:", err);
      setCategories(before);
      alert?.("Erro ao alterar visibilidade dos itens", "error");
    }
  };

  // ---------- helpers FLIP ----------
  const captureRects = () => {
    const map = {};
    Object.keys(domRefs.current).forEach((key) => {
      const el = domRefs.current[key];
      if (el && el.getBoundingClientRect) map[key] = el.getBoundingClientRect();
    });
    return map;
  };

  const runFlip = (beforeRects = {}) => {
    requestAnimationFrame(() => {
      const afterRects = captureRects();
      Object.keys(beforeRects).forEach((key) => {
        const before = beforeRects[key];
        const after = afterRects[key];
        const el = domRefs.current[key];
        if (!before || !after || !el) return;
        const dx = before.left - after.left;
        const dy = before.top - after.top;
        if (dx === 0 && dy === 0) return;
        el.style.transform = `translate(${dx}px, ${dy}px)`;
        el.style.transition = "transform 0s";
        // force reflow
        // eslint-disable-next-line no-unused-expressions
        el.offsetHeight;
        requestAnimationFrame(() => {
          el.style.transition = "transform 240ms cubic-bezier(.2,.9,.2,1)";
          el.style.transform = "";
          const cleanup = () => {
            el.style.transition = "";
            el.style.transform = "";
            el.removeEventListener("transitionend", cleanup);
          };
          el.addEventListener("transitionend", cleanup);
        });
      });
    });
  };

  // ---------- modal helpers ----------
  const openCategoryModal = (mode = "create", category = null) => {
    setModalPayload({
      type: "category",
      mode,
      categoryId: category?.id ?? null,
      itemId: null,
      data: {
        name: category?.name ?? "Nova categoria",
      },
    });
    setModalOpen(true);
  };

  const openItemModal = async (mode = "create", categoryId = null, item = null) => {
    let optionGroups = [];

    if (mode === "edit" && item?.id) {
      try {
        const { data: groups, error: gErr } = await supabase
          .from("option_groups")
          .select(
            `id, name, min_choices, max_choices, position,
                 option_choices ( id, name, price, hidden, position )`,
          )
          .eq("item_id", item.id)
          .order("position", { ascending: true });

        if (gErr) throw gErr;

        optionGroups = (groups || []).map((g) => ({
          ...g,
          // garante que choices vêm ordenadas por position
          option_choices: [...(g.option_choices || [])].sort((a, b) => a.position - b.position),
        }));
      } catch (err) {
        console.error("Erro ao buscar option_groups:", err);
        alert?.("Erro ao carregar grupos de opções", "error");
      }
    }

    setModalPayload({
      type: "item",
      mode,
      categoryId,
      itemId: item?.id ?? null,
      data: {
        name: item?.name ?? "Novo item",
        price: item?.price ?? "",
        promo_price: item?.promo_price ?? "",
        description: item?.description ?? "",
        image_url: item?.image_url ?? "",
        // option_groups substitui additionals/mandatory_additional/additionals_limit
        option_groups: optionGroups,
      },
    });
    setAdditionalsCfgOpen(false);
    setAdditionalsCfgDraft(null);
    setCfgGroupIdx(null);
    setModalOpen(true);
  };

  const openSortModal = () => {
    const ordering = JSON.parse(JSON.stringify(categories || []));
    const collapsedMap = {};
    ordering.forEach((c) => {
      collapsedMap[c.id] = false;
    });
    domRefs.current = {};
    setSortCollapsed(collapsedMap);
    setModalPayload({
      type: "sort",
      mode: "sort",
      data: { ordering },
    });
    setModalOpen(true);
    setTimeout(() => setModalPayload((p) => ({ ...p })), 10);
  };

  // swap util
  const swap = (arr, i, j) => {
    const next = [...arr];
    const tmp = next[i];
    next[i] = next[j];
    next[j] = tmp;
    return next;
  };

  const persistCategoryItemsOrder = async (categoryId, orderedItems) => {
    const updates = orderedItems.map((it, index) =>
      supabase.from("menu_items").update({ position: index, category_id: categoryId }).eq("id", it.id),
    );

    const results = await Promise.all(updates);
    const errored = results.find((r) => r?.error);

    if (errored) {
      throw errored.error || new Error("Erro ao salvar ordenação.");
    }
  };

  const handleItemsDragEnd = async (categoryId, event) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const before = categories;

    let reorderedItems = null;

    setCategories((prev = []) =>
      prev.map((cat) => {
        if (cat.id !== categoryId) return cat;

        const oldIndex = (cat.menu_items || []).findIndex((it) => it.id === active.id);
        const newIndex = (cat.menu_items || []).findIndex((it) => it.id === over.id);

        if (oldIndex === -1 || newIndex === -1) return cat;

        reorderedItems = arrayMove(cat.menu_items || [], oldIndex, newIndex).map((it, index) => ({
          ...it,
          position: index,
        }));

        return {
          ...cat,
          menu_items: reorderedItems,
        };
      }),
    );

    if (!reorderedItems) return;

    try {
      await persistCategoryItemsOrder(categoryId, reorderedItems);
    } catch (err) {
      console.error("Erro ao salvar ordem dos itens:", err);
      setCategories(before);
      alert?.("Erro ao salvar a nova ordem dos itens.", "error");
    }
  };

  // MOVES com FLIP
  const moveCategory = (index, direction) => {
    const before = captureRects();
    setModalPayload((p) => {
      const ordering = p.data?.ordering ?? [];
      const to = index + direction;
      if (to < 0 || to >= ordering.length) return p;
      const nextOrdering = swap(ordering, index, to);
      return { ...p, data: { ...p.data, ordering: nextOrdering } };
    });
    requestAnimationFrame(() => runFlip(before));
  };

  const moveItem = (catIndex, itemIndex, direction) => {
    const before = captureRects();
    setModalPayload((p) => {
      const ordering = p.data?.ordering ?? [];
      const cat = ordering[catIndex];
      if (!cat) return p;
      const items = cat.menu_items || [];
      const to = itemIndex + direction;
      if (to < 0 || to >= items.length) return p;
      const newItems = swap(items, itemIndex, to);
      const newOrdering = [...ordering];
      newOrdering[catIndex] = { ...cat, menu_items: newItems };
      return { ...p, data: { ...p.data, ordering: newOrdering } };
    });
    requestAnimationFrame(() => runFlip(before));
  };

  const toggleCollapse = (catId) => {
    setSortCollapsed((prev) => ({ ...prev, [catId]: !prev[catId] }));
  };

  // ---------- handleModalSave (reaproveitado para sort) ----------
  const handleModalSave = async () => {
    setSaving(true);

    const type = modalPayload.type;

    // --- Caso: salvar ordenação (sort) ---
    if (type === "sort") {
      const ordering = modalPayload.data?.ordering ?? [];

      // otimistic update local
      setCategories(ordering);

      // monta promessas de update
      const categoryUpdates = ordering.map((cat, idx) => {
        // pula temporários
        if (typeof cat.id === "string" && cat.id.startsWith("tmp-")) return Promise.resolve(null);
        // atualiza position
        return supabase.from("categories").update({ position: idx }).eq("id", cat.id);
      });

      const itemUpdates = [];
      ordering.forEach((cat, catIdx) => {
        (cat.menu_items || []).forEach((it, itemIdx) => {
          if (typeof it.id === "string" && it.id.startsWith("tmp-")) return;
          // atualiza position e category_id (caso o item tenha sido movido entre categorias no futuro)
          itemUpdates.push(supabase.from("menu_items").update({ position: itemIdx, category_id: cat.id }).eq("id", it.id));
        });
      });

      try {
        // executa em paralelo
        const results = await Promise.all([...categoryUpdates, ...itemUpdates]);
        const errored = results.find((r) => r && r.error);
        if (errored) {
          console.error("Erro ao salvar ordenação:", errored);
          alert?.("Algumas posições podem não ter sido salvas. Veja o console.", "error");
        } else {
          alert?.("Ordenação salva", "success");
        }
      } catch (err) {
        console.error("save order error:", err);
        alert?.("Erro ao salvar ordenação (ver console)", "error");
      } finally {
        // fecha modal e limpa payload
        closeModal();
      }

      return; // retorna cedo — restante do handler é para category/item
    }

    // --- Caso: criar/editar category/item (fluxo original) ---
    const { type: t, mode, categoryId, itemId, data } = modalPayload;

    if (t === "category") {
      if (!data.name.trim()) {
        alert?.("O nome da categoria não pode estar vazio.", "error");
        setSaving(false);
        return;
      }
    } else if (t === "item") {
      if (!data.name.trim()) {
        alert?.("O nome do item não pode estar vazio.", "error");
        setSaving(false);
        return;
      }

      const priceNum = parseFloat(String(data.price).replace(",", "."));
      if (isNaN(priceNum)) {
        alert?.("O preço deve ser um número válido.", "error");
        setSaving(false);
        return;
      }
      data.price = priceNum;

      let promoNum = null;
      if (String(data.promo_price ?? "").trim() !== "") {
        promoNum = parseFloat(String(data.promo_price).replace(",", "."));
        if (isNaN(promoNum)) {
          alert?.("O preço promocional deve ser um número válido.", "error");
          return;
        }
        if (promoNum >= priceNum) {
          alert?.("O preço promocional precisa ser menor que o preço normal.", "error");
          return;
        }
      }
      data.promo_price = promoNum;

      // === Validação dos option_groups ===
      const groups = Array.isArray(data.option_groups) ? data.option_groups : [];
      for (let gi = 0; gi < groups.length; gi++) {
        const g = groups[gi];
        if (!String(g.name || "").trim()) {
          alert?.(`O nome do grupo #${gi + 1} não pode ficar vazio.`, "error");
          return;
        }
        const minC = Number(g.min_choices ?? 0);
        const maxC = Number(g.max_choices ?? 0);
        if (minC > 0 && maxC > 0 && minC > maxC) {
          alert?.(`No grupo "${g.name}": mínimo não pode ser maior que o máximo.`, "error");
          return;
        }
        const choices = Array.isArray(g.option_choices) ? g.option_choices : [];
        for (let ci = 0; ci < choices.length; ci++) {
          const c = choices[ci];
          if (!String(c.name || "").trim()) {
            alert?.(`No grupo "${g.name}", opção #${ci + 1}: nome não pode ficar vazio.`, "error");
            return;
          }
          const p = parseFloat(String(c.price).replace(",", "."));
          choices[ci] = { ...c, name: String(c.name).trim(), price: isNaN(p) ? 0 : p };
        }
        groups[gi] = { ...g, min_choices: minC, max_choices: maxC, option_choices: choices };
      }
      data.option_groups = groups;
    }

    const updateCategory = async (categoryId, patch) => {
      const before = categories;
      setCategories((prev = []) => prev.map((c) => (c.id === categoryId ? { ...c, ...patch } : c)));

      try {
        const { data, error } = await supabase.from("categories").update(patch).eq("id", categoryId).select().single();
        if (error) throw error;

        setCategories((prev = []) => prev.map((c) => (c.id === categoryId ? { ...c, ...data } : c)));
        alert?.("Categoria atualizada", "success");
        return data;
      } catch (err) {
        console.error("updateCategory error:", err);
        setCategories(before);
        alert?.("Erro ao atualizar categoria", "error");
        return null;
      }
    };

    if (t === "category") {
      if (mode === "create") {
        await createCategory({ name: data.name });
      } else if (mode === "edit" && categoryId) {
        await updateCategory(categoryId, { name: data.name });
      }
    } else if (t === "item") {
      if (mode === "create") {
        const newItem = await createItem(categoryId, {
          name: data.name,
          price: data.price,
          promo_price: data.promo_price,
          description: data.description,
          image_url: data.image_url ?? "",
        });
        if (newItem?.id && data.option_groups?.length > 0) {
          await saveOptionGroups(newItem.id, data.option_groups);
        }
      } else if (mode === "edit" && itemId) {
        await updateItem(itemId, {
          name: data.name,
          price: data.price,
          promo_price: data.promo_price,
          description: data.description,
          image_url: data.image_url ?? "",
        });
        await saveOptionGroups(itemId, data.option_groups ?? []);
      }
    }

    closeModal();
  };

  const highlightItem = () => {
    if (canHighlightItems) {
      if (!modalPayload.itemId) {
        alert("Salve o item antes de destacar", "error");
        return;
      }

      const item = categories.flatMap((c) => c.menu_items || []).find((it) => it.id === modalPayload.itemId);

      if (!item.image_url) {
        alert("Você só pode destacar itens com imagem.", "error");
        return;
      }

      toggleItemStarred(item.id, item.starred);
    } else {
      alert?.("Assine o plano Plus ou Pro para destacar itens!");
      if (!planModalOpen) {
        trackAction("triedHighlight");
        setPlanModalFeature("highlight_items");
        setPlanModalOpen(true);
      }
    }
  };

  const toggleItemStarred = async (itemId, currentStarred) => {
    const newStarred = !currentStarred;

    // optimistic update
    setCategories((prev) =>
      prev.map((c) => ({
        ...c,
        menu_items: c.menu_items.map((it) => (it.id === itemId ? { ...it, starred: newStarred } : it)),
      })),
    );

    try {
      const { data, error } = await supabase
        .from("menu_items")
        .update({ starred: newStarred })
        .eq("id", itemId)
        .select()
        .single();

      if (error) throw error;

      setCategories((prev) =>
        prev.map((c) => ({
          ...c,
          menu_items: c.menu_items.map((it) => (it.id === itemId ? { ...it, ...data } : it)),
        })),
      );

      alert?.(newStarred ? "Item destacado no seu menu!" : "Destaque removido", "success");
    } catch (err) {
      console.error(err);
      alert("Erro ao destacar item", "error");
    }
  };

  // ---------- option groups ----------
  const saveOptionGroups = async (itemId, groups) => {
    // 1. Busca grupos existentes para saber quais deletar
    const { data: existing } = await supabase.from("option_groups").select("id").eq("item_id", itemId);

    const existingIds = new Set((existing || []).map((g) => g.id));
    const incomingIds = new Set(groups.filter((g) => g.id && !g.id.startsWith("tmp-")).map((g) => g.id));

    // Ids que não vieram mais → deletar (cascade apaga as choices)
    const toDelete = [...existingIds].filter((id) => !incomingIds.has(id));
    if (toDelete.length > 0) {
      await supabase.from("option_groups").delete().in("id", toDelete);
    }

    for (let gi = 0; gi < groups.length; gi++) {
      const g = groups[gi];
      const isNew = !g.id || g.id.startsWith("tmp-");

      let groupId;

      if (isNew) {
        const { data: inserted, error } = await supabase
          .from("option_groups")
          .insert({
            item_id: itemId,
            name: g.name,
            min_choices: g.min_choices ?? 0,
            max_choices: g.max_choices ?? 0,
            position: gi,
          })
          .select("id")
          .single();

        if (error) {
          console.error("Erro ao inserir grupo:", error);
          continue;
        }
        groupId = inserted.id;
      } else {
        await supabase
          .from("option_groups")
          .update({ name: g.name, min_choices: g.min_choices ?? 0, max_choices: g.max_choices ?? 0, position: gi })
          .eq("id", g.id);
        groupId = g.id;
      }

      // Choices
      const choices = Array.isArray(g.option_choices) ? g.option_choices : [];
      const { data: existingChoices } = await supabase.from("option_choices").select("id").eq("group_id", groupId);

      const existingChoiceIds = new Set((existingChoices || []).map((c) => c.id));
      const incomingChoiceIds = new Set(choices.filter((c) => c.id && !c.id.startsWith("tmp-")).map((c) => c.id));

      const choicesToDelete = [...existingChoiceIds].filter((id) => !incomingChoiceIds.has(id));
      if (choicesToDelete.length > 0) {
        await supabase.from("option_choices").delete().in("id", choicesToDelete);
      }

      for (let ci = 0; ci < choices.length; ci++) {
        const c = choices[ci];
        const isNewChoice = !c.id || c.id.startsWith("tmp-");

        if (isNewChoice) {
          await supabase.from("option_choices").insert({
            group_id: groupId,
            name: c.name,
            price: c.price,
            hidden: !!c.hidden,
            position: ci,
          });
        } else {
          await supabase
            .from("option_choices")
            .update({
              name: c.name,
              price: c.price,
              hidden: !!c.hidden,
              position: ci,
            })
            .eq("id", c.id);
        }
      }
    }
  };

  const fetchAllOptionGroups = async () => {
    const allItems = categories.flatMap((c) => c.menu_items || []).filter((it) => it.id !== modalPayload.itemId);

    if (allItems.length === 0) return [];

    const allItemIds = allItems.map((it) => it.id);

    const { data } = await supabase
      .from("option_groups")
      .select(
        `id, name, min_choices, max_choices, position, item_id,
       option_choices ( id, name, price, hidden, position )`,
      )
      .in("item_id", allItemIds)
      .order("position", { ascending: true });

    if (!data?.length) return [];

    // agrupa por item, preservando o nome do item
    return allItems
      .map((it) => ({
        itemId: it.id,
        itemName: it.name,
        groups: (data || [])
          .filter((g) => g.item_id === it.id)
          .map((g) => ({
            ...g,
            option_choices: [...(g.option_choices || [])].sort((a, b) => a.position - b.position),
          })),
      }))
      .filter((entry) => entry.groups.length > 0); // omite itens sem grupos
  };

  const getItemLimitByRole = (role) => {
    if (role === "free") return 20;
    if (role === "plus") return 50;
    if (role === "pro") return 200;
    if (role === "admin") return Infinity;
    return 20;
  };

  const openItemsLimitModal = () => {
    trackAction("triedItemLimit");
    setPlanModalFeature("items_limit");
    setPlanModalOpen(true);
  };

  const getCategoryLimitByRole = (role) => {
    if (role === "free") return 4;
    if (role === "plus") return 10;
    if (role === "pro") return 50;
    if (role === "admin") return Infinity;
    return 4;
  };

  const openCategoriesLimitModal = () => {
    trackAction("triedCategoryLimit");
    setPlanModalFeature("categories_limit");
    setPlanModalOpen(true);
  };

  // verificar se o item do modal é starred
  const modalItem = useMemo(() => {
    if (!modalPayload.itemId || !categories) return null;

    return categories.flatMap((c) => c.menu_items || []).find((it) => it.id === modalPayload.itemId);
  }, [modalPayload.itemId, categories]);

  const isStarred = !!modalItem?.starred;

  const starredItems = useMemo(() => {
    if (!categories) return [];
    return categories.flatMap((c) => c.menu_items || []).filter((it) => it.starred && it.visible !== false);
  }, [categories]);

  const hasStarred = starredItems.length > 0 && canHighlightItems;

  const translucidToUse = getContrastTextColor(backgroundColor) === "white" ? "#ffffff15" : "#00000015";
  const grayToUse = getContrastTextColor(backgroundColor) === "white" ? "#cccccc" : "#333333";
  const foregroundToUse = getContrastTextColor(backgroundColor) === "white" ? "#fafafa" : "#171717";

  const commitAdditionalsCfg = () => {
    if (!additionalsCfgDraft) return;

    setModalPayload((p) => ({
      ...p,
      data: {
        ...p.data,
        mandatory_additional: additionalsCfgDraft.mandatory_additional,
        additionals_limit: additionalsCfgDraft.additionals_limit,
      },
    }));
  };

  if (menuLoading || loading || categories === null || ownerRole === null)
    return <div className="p-4">Carregando categorias...</div>;
  if (!menu) return <div className="p-4">Você ainda não criou um menu.</div>;

  return (
    <div className={`p-4 ${changedFields.length > 0 ? "pb-48 lg:pb-34" : "pb-12 lg:pb-0"}`}>
      <div className="mb-4">
        <div className="flex gap-2">
          <button
            onClick={() => openCategoryModal("create")}
            className={`cursor-pointer px-3 py-1 bg-blue-600/80 border-2 border-[var(--translucid)] hover:bg-blue-700/80 text-white rounded ${showCatIndicator ? "pulse-btn" : ""}`}
          >
            + Categoria
          </button>
          {categories.length > 0 && (
            <button
              onClick={openSortModal}
              className="cursor-pointer px-3 py-1 opacity-75 hover:opacity-100 rounded"
              style={{
                backgroundColor: translucidToUse,
                color: foregroundToUse,
                border: "2px solid",
                borderColor: translucidToUse,
              }}
            >
              Ordenar itens
            </button>
          )}
        </div>
      </div>

      {categories.length === 0 && (
        <div
          className="mb-6 flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center"
          style={{
            borderColor: translucidToUse,
            backgroundColor: translucidToUse,
          }}
        >
          <div className="mb-2 text-lg font-semibold" style={{ color: foregroundToUse }}>
            Nenhuma categoria criada
          </div>

          <p className="mb-5 max-w-md text-sm leading-relaxed" style={{ color: grayToUse }}>
            Organize seu cardápio criando categorias como <span style={{ color: foregroundToUse }}>Lanches</span>,{" "}
            <span style={{ color: foregroundToUse }}>Bebidas</span> ou{" "}
            <span style={{ color: foregroundToUse }}>Sobremesas</span>.
          </p>

          <button
            onClick={() => openCategoryModal("create")}
            className={`cursor-pointer px-4 py-2 bg-blue-600/80 border-2 border-[var(--translucid)] hover:bg-blue-700/80 text-white rounded-lg font-medium transition-all ${
              showCatIndicator ? "pulse-btn" : ""
            }`}
          >
            + Criar primeira categoria
          </button>
        </div>
      )}

      {categories.length > 0 && (
        <div
          className="flex sticky -top-1 border-y-2 overflow-x-auto whitespace-nowrap scrollbar-none z-50 mb-2"
          style={{ backgroundColor: backgroundColor, borderColor: translucidToUse, color: foregroundToUse }}
        >
          {hasStarred && (
            <button
              className="cursor-pointer p-4 font-semibold"
              onClick={() => {
                scrollToCategoryId("starred-section", 40);
              }}
            >
              Destaques
            </button>
          )}

          {categories.map((cat) => (
            <div key={cat.id}>
              <button
                className="cursor-pointer p-4"
                onClick={(e) => {
                  e.preventDefault();
                  scrollToCategoryId(cat.id.slice(0, 5), 50);
                }}
              >
                {cat.name}
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-4">
        {hasStarred && (
          <div className="rounded py-3" id="starred-section">
            <div className="flex items-center gap-2 mb-2">
              <strong style={{ color: foregroundToUse }}>Destaques</strong>
            </div>

            <div
              className="flex gap-3 overflow-x-auto starred-scroll"
              style={{
                scrollSnapType: "x mandatory",
                "--scrollbar-color": detailsColor,
              }}
            >
              {starredItems.map((it) => (
                <div
                  key={it.id}
                  className="min-w-[55%] max-w-[55%] xxs:min-w-[45%] xxs:max-w-[45%] xs:min-w-[35%] xs:max-w-[35%] sm:min-w-[30%] sm:max-w-[30%] lg:min-w-[35%] lg:max-w-[35%] xl:min-w-[25%] xl:max-w-[25%] snap-start rounded-lg p-2 mb-2"
                  style={{ backgroundColor: translucidToUse }}
                >
                  <div className="flex flex-col justify-between h-full">
                    <div>
                      {it.image_url && (
                        <div className="relative mb-2">
                          <img
                            src={it.image_url}
                            alt={it.name}
                            loading="lazy"
                            decoding="async"
                            className="w-full aspect-square object-cover rounded-md"
                          />

                          <button
                            ref={(el) => (starredMenuBtnRefs.current[it.id] = el)}
                            type="button"
                            onClick={() => setStarredMenuOpenId((prev) => (prev === it.id ? null : it.id))}
                            className="cursor-pointer absolute top-2 right-2 p-2 rounded"
                            style={{
                              backgroundColor: "#00000055",
                              color: "white",
                            }}
                          >
                            <FaEllipsisVertical size={13} />
                          </button>

                          {starredMenuOpenId === it.id && (
                            <ItemActionsMenu
                              anchorRef={{ current: starredMenuBtnRefs.current[it.id] }}
                              onClose={() => setStarredMenuOpenId(null)}
                              menuBg={menuBg}
                              borderColor={menuBorder}
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  openItemModal("edit", it.category_id, it);
                                  setStarredMenuOpenId(null);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-3 text-sm text-left cursor-pointer transition"
                                style={{ color: menuText }}
                                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = menuHover)}
                                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                              >
                                <FaPen size={13} />
                                Editar item
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  toggleItemStarred(it.id, true);
                                  setStarredMenuOpenId(null);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-3 text-sm text-left cursor-pointer transition"
                                style={{ color: menuText }}
                                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = menuHover)}
                                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                              >
                                <FaStar size={13} />
                                Remover destaque
                              </button>
                            </ItemActionsMenu>
                          )}
                        </div>
                      )}
                      <div className="text-lg font-semibold line-clamp-1" style={{ color: foregroundToUse }}>
                        {it.name}
                      </div>
                      <div className="text-sm line-clamp-1 mb-1" style={{ color: grayToUse }}>
                        {it.description}
                      </div>
                    </div>
                    <div>
                      {it.promo_price && canShowPromoPrice ? (
                        <div>
                          <span className="text-sm line-through" style={{ color: grayToUse }}>
                            {formatCurrency(it.price, menu?.currency)}
                          </span>
                          <div className="font-bold text-2xl" style={{ color: foregroundToUse }}>
                            {formatCurrency(it.promo_price, menu?.currency)}
                          </div>
                        </div>
                      ) : (
                        <div className="font-bold text-2xl" style={{ color: foregroundToUse }}>
                          {formatCurrency(it.price, menu?.currency)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {categories.map((cat) => (
          <div
            key={cat.id}
            id={cat.id.slice(0, 5)}
            className="mb-6 bg-translucid p-2 rounded-lg"
            style={{ backgroundColor: translucidToUse }}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 min-w-0 cursor-pointer" onClick={() => toggleCategoryCollapse(cat.id)}>
                <button
                  type="button"
                  className="cursor-pointer p-1 flex-shrink-0"
                  style={{ color: foregroundToUse }}
                  title={collapsedCategories[cat.id] ? "Expandir categoria" : "Recolher categoria"}
                >
                  {collapsedCategories[cat.id] ? <FaChevronRight size={14} /> : <FaChevronDown size={14} />}
                </button>

                <div className="flex items-center flex-wrap gap-x-2 min-w-0">
                  <strong style={{ color: foregroundToUse }} className="line-clamp-1">
                    {cat.name}
                  </strong>
                  <span className="text-sm" style={{ color: grayToUse }}>
                    ({cat.menu_items?.length ?? 0} itens)
                  </span>
                </div>
              </div>

              <button
                ref={(el) => (categoryMenuBtnRefs.current[cat.id] = el)}
                type="button"
                onClick={() => setCategoryMenuOpenId((prev) => (prev === cat.id ? null : cat.id))}
                className="cursor-pointer p-2 mr-2 rounded flex-shrink-0"
                style={{
                  backgroundColor: getContrastTextColor(backgroundColor) === "white" ? "#ffffff25" : "#00000025",
                  color: foregroundToUse,
                }}
              >
                <FaEllipsisVertical />
              </button>

              {categoryMenuOpenId === cat.id && (
                <ItemActionsMenu
                  anchorRef={{ current: categoryMenuBtnRefs.current[cat.id] }}
                  onClose={() => setCategoryMenuOpenId(null)}
                  menuBg={menuBg}
                  borderColor={menuBorder}
                >
                  <button
                    type="button"
                    onClick={() => {
                      const makeVisible = !categoryHasVisibleItems(cat);
                      toggleCategoryVisibility(cat.id, makeVisible);
                      setCategoryMenuOpenId(null);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-3 text-sm text-left cursor-pointer transition"
                    style={{ color: menuText }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = menuHover)}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    {categoryHasVisibleItems(cat) ? <FaEyeSlash size={13} /> : <FaEye size={13} />}
                    {categoryHasVisibleItems(cat) ? "Ocultar todos os itens" : "Exibir todos os itens"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      openCategoryModal("edit", cat);
                      setCategoryMenuOpenId(null);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-3 text-sm text-left cursor-pointer transition"
                    style={{ color: menuText }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = menuHover)}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    <FaPen size={13} />
                    Editar categoria
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      openItemModal("create", cat.id);
                      setCategoryMenuOpenId(null);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-3 text-sm text-left cursor-pointer transition"
                    style={{ color: menuText }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = menuHover)}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    <FaPlus size={12} />
                    Adicionar item
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      deleteCategory(cat.id);
                      setCategoryMenuOpenId(null);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-left cursor-pointer transition text-red-500"
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = menuHover)}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    <FaTrash size={13} />
                    Excluir categoria
                  </button>
                </ItemActionsMenu>
              )}
            </div>

            {!collapsedCategories[cat.id] && (
              <>
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={(event) => handleItemsDragEnd(cat.id, event)}
                >
                  <SortableContext items={(cat.menu_items || []).map((it) => it.id)} strategy={verticalListSortingStrategy}>
                    {(cat.menu_items || []).length === 0 ? (
                      <div
                        className="mt-3 flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center"
                        style={{
                          borderColor: translucidToUse,
                          backgroundColor: translucidToUse,
                        }}
                      >
                        <div className="mb-2 text-base font-semibold" style={{ color: foregroundToUse }}>
                          Essa categoria está vazia
                        </div>

                        <p className="mb-4 max-w-sm text-sm leading-relaxed" style={{ color: grayToUse }}>
                          Adicione itens para que eles apareçam no cardápio dos clientes.
                        </p>

                        <button
                          onClick={() => openItemModal("create", cat.id)}
                          className={`cursor-pointer px-4 py-2 bg-blue-600/80 hover:bg-blue-700/80 border-2 border-[var(--translucid)] text-white rounded-lg font-medium transition-all ${
                            cat.menu_items?.length === 0 ? "pulse-btn" : ""
                          }`}
                        >
                          + Criar primeiro item
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {(cat.menu_items || []).map((it) => (
                          <SortableMenuItem
                            key={it.id}
                            item={it}
                            cat={cat}
                            openItemModal={openItemModal}
                            deleteItem={deleteItem}
                            duplicateItem={duplicateItem}
                            toggleItemVisibility={toggleItemVisibility}
                            detailsColor={detailsColor}
                            backgroundColor={backgroundColor}
                            foregroundToUse={foregroundToUse}
                            grayToUse={grayToUse}
                            canShowPromoPrice={canShowPromoPrice}
                            getContrastTextColor={getContrastTextColor}
                            currency={menu?.currency}
                          />
                        ))}
                      </div>
                    )}
                  </SortableContext>
                </DndContext>
                {cat.menu_items?.length > 0 && (
                  <button
                    onClick={() => openItemModal("create", cat.id)}
                    className={`cursor-pointer px-4 py-2 mt-2 w-full border-2 border-dotted ${getContrastTextColor(backgroundColor) === "white" ? "border-[#ffffff40] text-[#ffffff]" : "border-[#00000040] text-[#000000]"} rounded-lg font-medium transition-all hover:opacity-80 transition-opacity`}
                  >
                    + Adicionar item
                  </button>
                )}
              </>
            )}
          </div>
        ))}
      </div>

      {/* Modal */}
      {modalOpen && (
        <GenericModal
          wfull
          maxWidth={"480px"}
          title={
            modalPayload.type === "sort"
              ? "Ordenar itens"
              : modalPayload.type === "category"
                ? modalPayload.mode === "create"
                  ? "Criar categoria"
                  : "Editar categoria"
                : modalPayload.type === "item"
                  ? modalPayload.mode === "create"
                    ? "Criar item"
                    : "Editar item"
                  : ""
          }
          onClose={closeModal}
        >
          {/* Categoria */}
          {modalPayload.type === "category" && (
            <label className="block mb-2">
              <div className="text-sm color-gray">Nome da categoria</div>
              <input
                type="text"
                value={modalPayload.data.name}
                onChange={(e) => {
                  const v = e.target.value.slice(0, 20);
                  setModalPayload((p) => ({ ...p, data: { ...p.data, name: v } }));
                }}
                maxLength={20}
                className="w-full p-2 rounded border border-translucid bg-translucid mb-2"
                placeholder="Item"
              />
            </label>
          )}

          {/* Item */}
          {modalPayload.type === "item" && (
            <>
              <div className="flex gap-2  sm:gap-4">
                <div className="mb-2">
                  <div className="text-sm color-gray mb-1">Imagem do item:</div>

                  <label className="text-center flex flex-col items-center justify-center w-30 h-30 border-2 border-dashed border-translucid rounded-lg cursor-pointer hover:scale-[1.01] transition-all overflow-hidden">
                    {modalPayload.data.image_url ? (
                      <img
                        src={modalPayload.data.image_url}
                        alt="Prévia"
                        className="object-cover w-full h-full"
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <span className="color-gray m-4 text-sm">Clique aqui para inserir uma imagem</span>
                    )}

                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;

                        try {
                          setUploadingImage(true);

                          const webpFile = await fileToWebp(file, {
                            maxBytes: 250 * 1024,
                            maxDimension: 720,
                            minDimension: 520,
                            startQuality: 0.9,
                            minQuality: 0.75,
                          });

                          const url = await uploadItemImage(webpFile, menu?.owner_id, modalPayload.data.image_url);

                          setModalPayload((p) => ({ ...p, data: { ...p.data, image_url: url } }));
                        } catch (err) {
                          console.error("upload image error:", err);
                          const msg = String(err?.message || "");
                          if (msg.includes("Não foi possível comprimir")) {
                            alert?.("Essa imagem é pesada demais. Tente recortar ou escolher outra.", "error");
                          } else {
                            alert?.("Tipo de imagem não suportado.", "error");
                          }
                        } finally {
                          setUploadingImage(false);
                          e.currentTarget.value = "";
                        }
                      }}
                    />
                  </label>

                  {modalPayload.data.image_url && (
                    <button
                      onClick={() => setModalPayload((p) => ({ ...p, data: { ...p.data, image_url: "" } }))}
                      className="mt-1 text-sm text-red-500 hover:underline"
                      type="button"
                    >
                      Remover imagem
                    </button>
                  )}
                </div>

                <div className="flex flex-col w-full gap-2">
                  <label className="block mb-2 w-full">
                    <div className="text-sm color-gray">Nome:</div>
                    <input
                      type="text"
                      value={modalPayload.data.name}
                      onChange={(e) => {
                        const v = e.target.value.slice(0, 25);
                        setModalPayload((p) => ({ ...p, data: { ...p.data, name: v } }));
                      }}
                      maxLength={25}
                      className="w-full p-2 rounded border border-translucid bg-translucid mb-2"
                    />
                  </label>

                  <div className="flex gap-2">
                    <label className="block mb-2 w-[75px] xs:w-[100px]">
                      <div className="text-sm color-gray">Preço:</div>
                      <div className="flex items-center mb-2">
                        <span className="absolute text-sm p-1 xs:text-base xs:p-2">{getCurrencySymbol(menu?.currency)}</span>
                        <input
                          type="text"
                          value={modalPayload.data.price}
                          onChange={(e) => {
                            let value = e.target.value;
                            value = value.replace(/[^0-9.,]/g, "");
                            value = value.replace(",", ".");
                            const parts = value.split(".");
                            if (parts.length > 2) value = parts[0] + "." + parts.slice(1).join("");
                            setModalPayload((p) => ({ ...p, data: { ...p.data, price: value } }));
                          }}
                          maxLength={10}
                          className="w-full p-2 pl-6 xs:pl-7.5 rounded border border-translucid bg-translucid"
                          placeholder="00.00"
                        />
                      </div>
                    </label>
                    <label className="block mb-2 w-[75px] xs:w-[100px]">
                      <div className="text-sm color-gray">Promoção:</div>
                      <div className="flex items-center mb-2">
                        <span className="absolute text-sm p-1 xs:text-base xs:p-2">{getCurrencySymbol(menu?.currency)}</span>
                        <input
                          type="text"
                          value={canShowPromoPrice ? (modalPayload.data.promo_price ?? "") : ""}
                          onChange={(e) => {
                            if (!canShowPromoPrice) {
                              if (!planModalOpen) {
                                alert("Assine o plano Plus ou Pro para criar promoções!");
                                trackAction("triedPromotion");
                                setPlanModalFeature("promo_price");
                                setPlanModalOpen(true);
                              }
                              return;
                            }

                            let value = e.target.value;
                            value = value.replace(/[^0-9.,]/g, "");
                            value = value.replace(",", ".");
                            const parts = value.split(".");
                            if (parts.length > 2) value = parts[0] + "." + parts.slice(1).join("");

                            const num = Number(value);
                            if (value !== "" && !isNaN(num) && num === 0) {
                              value = "";
                            }

                            setModalPayload((p) => ({
                              ...p,
                              data: { ...p.data, promo_price: value },
                            }));
                          }}
                          maxLength={10}
                          className="w-full p-2 pl-6 xs:pl-7.5 rounded border border-translucid bg-translucid"
                          placeholder="00.00"
                        />
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              <label className="block mb-2">
                <div className="text-sm color-gray">Descrição:</div>
                <textarea
                  value={modalPayload.data.description}
                  onChange={(e) => setModalPayload((p) => ({ ...p, data: { ...p.data, description: e.target.value } }))}
                  className="w-full p-2 rounded border border-translucid bg-translucid mb-2"
                  placeholder="Escreva a descrição (opcional)"
                />
              </label>

              {/* Option Groups — botão de atalho */}
              <button
                type="button"
                onClick={() => setOptionGroupsModalOpen(true)}
                className="w-full mb-2 cursor-pointer px-3 py-2 rounded border border-translucid bg-translucid hover:opacity-80 transition flex items-center justify-between"
              >
                <span className="text-sm">Grupos de opções</span>
                <span className="flex items-center gap-2 text-sm color-gray">
                  {(modalPayload.data.option_groups || []).length > 0
                    ? `${(modalPayload.data.option_groups || []).length} grupo(s) configurado(s)`
                    : "Nenhum grupo"}
                  <FaChevronRight size={11} />
                </span>
              </button>

              {/* botões plus || pro */}
              <div className="flex h-[40px] items-end justify-end mt-4 gap-4 w-full ">
                <button
                  onClick={() => highlightItem()}
                  className="p-2 rounded flex items-center justify-center gap-2 font-semibold w-[50%] cursor-pointer transition"
                  style={{
                    backgroundColor: isStarred ? "var(--theme-yellow)" : "transparent",
                    color: isStarred ? "var(--low-gray)" : "var(--theme-yellow)",
                    border: "2px solid",
                    borderColor: "var(--theme-yellow)",
                  }}
                >
                  <FaStar />
                  <span className="hide-on-400px">{isStarred ? "Item destacado" : "Destacar item"}</span>
                  <span className="show-on-400px">{isStarred ? "Destacado" : "Destacar"}</span>
                </button>
              </div>
            </>
          )}

          {/* Ordenação (com FLIP + colapso) */}
          {modalPayload.type === "sort" && (
            <>
              <div className="space-y-3 max-h-[60vh] overflow-auto pr-2">
                {(modalPayload.data?.ordering || []).map((cat, catIdx) => {
                  const collapsed = !!sortCollapsed[cat.id];
                  return (
                    <div
                      key={cat.id ?? `cat-${catIdx}`}
                      ref={(el) => {
                        if (el) domRefs.current[`cat-${cat.id ?? catIdx}`] = el;
                        else delete domRefs.current[`cat-${cat.id ?? catIdx}`];
                        if (el && cat.id != null) domRefs.current[`cat-${cat.id}`] = el;
                      }}
                      className="p-2 rounded bg-translucid"
                      style={{ transition: "transform 200ms ease, box-shadow 200ms ease" }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <button
                            className="cursor-pointer"
                            onClick={() => toggleCollapse(cat.id)}
                            title={collapsed ? "Mostrar itens" : "Recolher itens"}
                          >
                            {collapsed ? <FaChevronRight /> : <FaChevronDown />}
                          </button>
                          <div className="flex flex-col">
                            <strong>{cat.name}</strong>
                            <span className="text-sm color-gray">({(cat.menu_items || []).length} itens)</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => moveCategory(catIdx, -1)}
                            disabled={catIdx === 0}
                            className="disabled:opacity-50 p-1 cursor-pointer"
                            title="Mover categoria para cima"
                          >
                            <FaChevronUp />
                          </button>
                          <button
                            onClick={() => moveCategory(catIdx, 1)}
                            disabled={catIdx === (modalPayload.data?.ordering?.length ?? 1) - 1}
                            className="disabled:opacity-50 p-1 cursor-pointer"
                            title="Mover categoria para baixo"
                          >
                            <FaChevronDown />
                          </button>
                        </div>
                      </div>

                      <div
                        className="overflow-hidden"
                        style={{
                          maxHeight: collapsed ? 0 : undefined,
                          transition: "max-height 200ms ease, opacity 180ms ease, transform 180ms ease",
                          opacity: collapsed ? 0 : 1,
                          transform: collapsed ? "translateY(-6px)" : "translateY(0)",
                        }}
                      >
                        <div className="space-y-2 pt-1 pb-1">
                          {(cat.menu_items || []).map((it, itIdx) => (
                            <div
                              key={it.id ?? `it-${itIdx}`}
                              ref={(el) => {
                                if (el) domRefs.current[`it-${it.id ?? `${catIdx}-${itIdx}`}`] = el;
                                else delete domRefs.current[`it-${it.id ?? `${catIdx}-${itIdx}`}`];
                                if (el && it.id != null) domRefs.current[`it-${it.id}`] = el;
                              }}
                              className="flex items-center justify-between bg-transparent px-2 py-1 rounded bg-translucid"
                            >
                              <div className="truncate">{it.name}</div>
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => moveItem(catIdx, itIdx, -1)}
                                  disabled={itIdx === 0}
                                  className="disabled:opacity-50 p-1 cursor-pointer"
                                  title="Mover item para cima"
                                >
                                  <FaChevronUp />
                                </button>
                                <button
                                  onClick={() => moveItem(catIdx, itIdx, 1)}
                                  disabled={itIdx === (cat.menu_items?.length ?? 1) - 1}
                                  className="disabled:opacity-50 p-1 cursor-pointer"
                                  title="Mover item para baixo"
                                >
                                  <FaChevronDown />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          <div className="flex justify-end gap-2 mt-4">
            <div className="w-[70%] xs:w-[50%] flex gap-2">
              <button
                onClick={closeModal}
                disabled={saving}
                className="cursor-pointer px-4 py-2 bg-gray-600 text-white rounded w-[50%] disabled:opacity-60"
              >
                Cancelar
              </button>
              <button
                onClick={handleModalSave}
                disabled={saving || uploadingImage}
                className="cursor-pointer px-4 py-2 bg-green-600 text-white rounded w-[50%] disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <svg
                      className="animate-spin h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Salvando...
                  </>
                ) : (
                  "Salvar"
                )}
              </button>
            </div>
          </div>
        </GenericModal>
      )}

      {modalOpen && optionGroupsModalOpen && modalPayload.type === "item" && (
        <GenericModal wfull maxWidth={"500px"} title="Grupos de opções" onClose={closeOptionGroupsModal}>
          <div className="space-y-3 max-h-[65vh] overflow-y-auto pr-1">
            {(modalPayload.data.option_groups || []).length === 0 && (
              <p className="text-sm color-gray text-center py-4">Nenhum grupo criado. Clique em "+ Grupo" para começar.</p>
            )}

            {(modalPayload.data.option_groups || []).map((group, gi) => (
              <div key={group.id ?? gi} className="rounded-lg border border-translucid p-2 space-y-2">
                {/* Cabeçalho do grupo */}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={group.name}
                    onChange={(e) =>
                      setModalPayload((p) => {
                        const next = [...(p.data.option_groups || [])];
                        next[gi] = { ...next[gi], name: e.target.value };
                        return { ...p, data: { ...p.data, option_groups: next } };
                      })
                    }
                    className="flex-1 p-1.5 text-sm rounded border border-translucid bg-translucid font-semibold"
                    placeholder="Nome do grupo (ex: Borda da pizza)"
                  />

                  <button
                    type="button"
                    title="Configurar obrigatoriedade"
                    onClick={() => {
                      setAdditionalsCfgDraft({
                        min_choices: String(group.min_choices ?? 0),
                        max_choices: String(group.max_choices ?? 0),
                      });
                      setCfgGroupIdx(gi);
                      setAdditionalsCfgOpen(true);
                    }}
                    className="cursor-pointer p-1.5 rounded bg-blue-600/80 hover:bg-blue-700/80 border-2 border-[var(--translucid)] text-white"
                  >
                    <FaCog size={12} />
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setModalPayload((p) => {
                        const next = [...(p.data.option_groups || [])];
                        next.splice(gi, 1);
                        return { ...p, data: { ...p.data, option_groups: next } };
                      })
                    }
                    className="p-1.5 rounded bg-red-600 hover:bg-red-700 text-white"
                  >
                    <FaTrash size={12} />
                  </button>
                </div>

                {/* Badge min/max */}
                <div className="text-xs color-gray">
                  {group.min_choices > 0 ? `Obrigatório (mín. ${group.min_choices})` : "Opcional"}
                  {group.max_choices > 0 ? ` · máx. ${group.max_choices}` : " · sem limite"}
                </div>

                {/* Choices */}
                <div className="space-y-1.5">
                  {(group.option_choices || []).map((choice, ci) => (
                    <div key={choice.id ?? ci} className={`flex items-center gap-1.5 ${choice.hidden ? "opacity-50" : ""}`}>
                      <input
                        type="text"
                        value={choice.name}
                        onChange={(e) =>
                          setModalPayload((p) => {
                            const groups = [...(p.data.option_groups || [])];
                            const choices = [...(groups[gi].option_choices || [])];
                            choices[ci] = { ...choices[ci], name: e.target.value };
                            groups[gi] = { ...groups[gi], option_choices: choices };
                            return { ...p, data: { ...p.data, option_groups: groups } };
                          })
                        }
                        className="flex-1 min-w-0 p-1.5 text-sm rounded border border-translucid bg-translucid"
                        placeholder="Nome da opção"
                      />
                      <input
                        type="text"
                        value={String(choice.price)}
                        onChange={(e) => {
                          let value = e.target.value.replace(/[^0-9.,-]/g, "").replace(",", ".");
                          setModalPayload((p) => {
                            const groups = [...(p.data.option_groups || [])];
                            const choices = [...(groups[gi].option_choices || [])];
                            choices[ci] = { ...choices[ci], price: value };
                            groups[gi] = { ...groups[gi], option_choices: choices };
                            return { ...p, data: { ...p.data, option_groups: groups } };
                          });
                        }}
                        className="w-16 flex-none p-1.5 text-sm rounded border border-translucid bg-translucid"
                        placeholder="0.00"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setModalPayload((p) => {
                            const groups = [...(p.data.option_groups || [])];
                            const choices = [...(groups[gi].option_choices || [])];
                            choices[ci] = { ...choices[ci], hidden: !choices[ci].hidden };
                            groups[gi] = { ...groups[gi], option_choices: choices };
                            return { ...p, data: { ...p.data, option_groups: groups } };
                          })
                        }
                        className={`p-1.5 rounded text-white ${choice.hidden ? "bg-yellow-600 hover:bg-yellow-700" : "bg-green-600 hover:bg-green-700"}`}
                      >
                        {choice.hidden ? <FaEyeSlash size={12} /> : <FaEye size={12} />}
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setModalPayload((p) => {
                            const groups = [...(p.data.option_groups || [])];
                            const choices = [...(groups[gi].option_choices || [])];
                            choices.splice(ci, 1);
                            groups[gi] = { ...groups[gi], option_choices: choices };
                            return { ...p, data: { ...p.data, option_groups: groups } };
                          })
                        }
                        className="p-1.5 rounded bg-red-600 text-white"
                      >
                        <FaTrash size={12} />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Adicionar opção */}
                <button
                  type="button"
                  onClick={() =>
                    setModalPayload((p) => {
                      const groups = [...(p.data.option_groups || [])];
                      const choices = [...(groups[gi].option_choices || [])];
                      choices.push({
                        id: `tmp-${uid()}`,
                        name: "",
                        price: "",
                        hidden: false,
                        position: choices.length,
                      });
                      groups[gi] = { ...groups[gi], option_choices: choices };
                      return { ...p, data: { ...p.data, option_groups: groups } };
                    })
                  }
                  className="w-full text-sm cursor-pointer px-2 py-1 rounded border border-dashed border-translucid color-gray hover:opacity-80 transition"
                >
                  + Opção
                </button>
              </div>
            ))}
          </div>

          {/* Rodapé do modal de grupos */}
          <div className="flex justify-between items-center mt-4 gap-2">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() =>
                  setModalPayload((p) => ({
                    ...p,
                    data: {
                      ...p.data,
                      option_groups: [
                        ...(p.data.option_groups || []),
                        {
                          id: `tmp-${uid()}`,
                          name: "Novo grupo",
                          min_choices: 0,
                          max_choices: 0,
                          position: (p.data.option_groups || []).length,
                          option_choices: [],
                        },
                      ],
                    },
                  }))
                }
                className="cursor-pointer px-3 py-2 rounded bg-blue-600/80 hover:bg-blue-700/80 border-2 border-[var(--translucid)] text-white text-sm transition"
              >
                + Grupo
              </button>

              <button
                type="button"
                onClick={async () => {
                  const grouped = await fetchAllOptionGroups();
                  setImportableGroups(grouped);
                  setSelectedImportIds(new Set());
                  setExpandedImportItemId(null); // <- reset
                  setImportModalOpen(true);
                }}
                className="cursor-pointer px-3 py-2 rounded border border-translucid bg-translucid text-sm"
              >
                Importar grupos
              </button>
            </div>

            <button
              type="button"
              onClick={closeOptionGroupsModal}
              className="cursor-pointer px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-sm"
            >
              Confirmar
            </button>
          </div>
        </GenericModal>
      )}

      {modalOpen && additionalsCfgOpen && modalPayload.type === "item" && cfgGroupIdx !== null && (
        <GenericModal backdropDontClose wfull maxWidth={"420px"} title="Configurar grupo" onClose={closeAdditionalsCfgModal}>
          <div className="space-y-4">
            <label className="block">
              <div className="text-sm color-gray mb-1">Mínimo de escolhas</div>
              <input
                type="text"
                inputMode="numeric"
                placeholder="0"
                value={additionalsCfgDraft?.min_choices ?? ""}
                onChange={(e) => {
                  const raw = e.target.value.replace(/[^0-9]/g, "");
                  setAdditionalsCfgDraft((d) => ({ ...d, min_choices: raw }));
                }}
                className="w-full p-2 rounded border border-translucid bg-translucid"
              />
              <div className="text-xs mt-1 color-gray">0 = opcional; 1 ou mais = obrigatório</div>
            </label>

            <label className="block">
              <div className="text-sm color-gray mb-1">Máximo de escolhas</div>
              <input
                type="text"
                inputMode="numeric"
                placeholder="0"
                value={additionalsCfgDraft?.max_choices ?? ""}
                onChange={(e) => {
                  const raw = e.target.value.replace(/[^0-9]/g, "");
                  setAdditionalsCfgDraft((d) => ({ ...d, max_choices: raw }));
                }}
                className="w-full p-2 rounded border border-translucid bg-translucid"
              />
              <div className="text-xs mt-1 color-gray">0 = sem limite</div>
            </label>

            <div className="flex justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={closeAdditionalsCfgModal}
                className="cursor-pointer px-4 py-2 bg-gray-600 text-white rounded"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  const minC = Number(additionalsCfgDraft?.min_choices ?? 0);
                  const maxC = Number(additionalsCfgDraft?.max_choices ?? 0);

                  if (minC > 0 && maxC > 0 && minC > maxC) {
                    alert?.("Mínimo não pode ser maior que o máximo.", "error");
                    return;
                  }

                  setModalPayload((p) => {
                    const groups = [...(p.data.option_groups || [])];
                    groups[cfgGroupIdx] = {
                      ...groups[cfgGroupIdx],
                      min_choices: minC,
                      max_choices: maxC,
                    };
                    return { ...p, data: { ...p.data, option_groups: groups } };
                  });

                  closeAdditionalsCfgModal();
                }}
                className="cursor-pointer px-4 py-2 bg-green-600 text-white rounded"
              >
                Confirmar
              </button>
            </div>
          </div>
        </GenericModal>
      )}

      {/* modal de importação */}
      {modalOpen && importModalOpen && (
        <GenericModal wfull maxWidth={"420px"} title="Importar grupos de opções" onClose={closeImportModal}>
          {importableGroups.length === 0 ? (
            <p className="text-sm color-gray text-center py-4">Nenhum grupo encontrado em outros itens.</p>
          ) : (
            <div className="space-y-2 max-h-[55vh] overflow-y-auto pr-1">
              {importableGroups.map((entry) => {
                const isExpanded = expandedImportItemId === entry.itemId;
                return (
                  <div key={entry.itemId} className="rounded border border-translucid overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setExpandedImportItemId(isExpanded ? null : entry.itemId)}
                      className="w-full flex items-center justify-between px-3 py-2 bg-translucid hover:opacity-80 transition cursor-pointer"
                    >
                      <span className="text-sm font-semibold">{entry.itemName}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs color-gray">{entry.groups.length} grupo(s)</span>
                        {isExpanded ? <FaChevronUp size={11} /> : <FaChevronDown size={11} />}
                      </div>
                    </button>

                    <div
                      className="overflow-hidden transition-all duration-300 ease-in-out"
                      style={{
                        maxHeight: isExpanded ? "500px" : "0px",
                        opacity: isExpanded ? 1 : 0,
                      }}
                    >
                      {entry.groups.map((g) => (
                        <label
                          key={g.id}
                          className={`flex items-start gap-3 p-2 rounded border cursor-pointer transition
                        ${selectedImportIds.has(g.id) ? "border-blue-500 bg-blue-500/10" : "border-translucid bg-translucid"}`}
                        >
                          <input
                            type="checkbox"
                            className="mt-1 flex-shrink-0"
                            checked={selectedImportIds.has(g.id)}
                            onChange={() => {
                              setSelectedImportIds((prev) => {
                                const next = new Set(prev);
                                next.has(g.id) ? next.delete(g.id) : next.add(g.id);
                                return next;
                              });
                            }}
                          />
                          <div className="min-w-0">
                            <div className="font-semibold text-sm">{g.name}</div>
                            <div className="text-xs color-gray">
                              {g.min_choices > 0 ? `Obrigatório (mín. ${g.min_choices})` : "Opcional"}
                              {g.max_choices > 0 ? ` · máx. ${g.max_choices}` : " · sem limite"}
                            </div>
                            {(g.option_choices || []).length > 0 && (
                              <div className="text-xs color-gray mt-0.5 truncate">
                                {g.option_choices.map((c) => c.name).join(", ")}
                              </div>
                            )}
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex justify-end gap-2 mt-4">
            <button onClick={closeImportModal} className="cursor-pointer px-4 py-2 bg-gray-600 text-white rounded">
              Cancelar
            </button>
            <button
              disabled={selectedImportIds.size === 0}
              onClick={() => {
                const toImport = importableGroups
                  .flatMap((e) => e.groups)
                  .filter((g) => selectedImportIds.has(g.id))
                  .map((g) => ({
                    ...g,
                    id: `tmp-${uid()}`,
                    option_choices: (g.option_choices || []).map((c) => ({ ...c, id: `tmp-${uid()}` })),
                  }));

                setModalPayload((p) => ({
                  ...p,
                  data: {
                    ...p.data,
                    option_groups: [...(p.data.option_groups || []), ...toImport],
                  },
                }));

                closeImportModal();
              }}
              className="cursor-pointer px-4 py-2 bg-green-600 disabled:opacity-50 text-white rounded"
            >
              Importar ({selectedImportIds.size})
            </button>
          </div>
        </GenericModal>
      )}

      {planModalOpen && planModalFeature && (
        <UpdatePlanModal
          onClose={closePlanModal}
          title={
            planModalFeature === "promo_price"
              ? "Preços promocionais são vantagens exclusivas do Plus"
              : planModalFeature === "highlight_items"
                ? "Itens em destaque são vantagens exclusivas do Plus"
                : planModalFeature === "items_limit"
                  ? "Você atingiu o limite de itens do seu plano"
                  : planModalFeature === "categories_limit"
                    ? "Você atingiu o limite de categorias do seu plano"
                    : ""
          }
          text={
            planModalFeature === "promo_price"
              ? "Crie preços promocionais que chamam atenção e incentivam a decisão de compra no seu menu."
              : planModalFeature === "highlight_items"
                ? "Destaque os itens mais estratégicos do seu menu e guie o olhar dos clientes para o que mais vende."
                : planModalFeature === "items_limit"
                  ? "Faça upgrade para continuar adicionando/editando  produtos ao seu cardápio."
                  : planModalFeature === "categories_limit"
                    ? ownerRole === "free"
                      ? "Seu plano gratuito permite até 4 categorias. Faça upgrade para organizar melhor seu cardápio com mais categorias."
                      : ownerRole === "plus"
                        ? "Seu plano Plus permite até 10 categorias. Faça upgrade para continuar organizando seu cardápio."
                        : "Seu plano atual atingiu o limite de categorias."
                    : ""
          }
          image={
            planModalFeature === "promo_price"
              ? "https://rfgkalwtrxbiqrqwxmxf.supabase.co/storage/v1/object/sign/utilImages/promo_price.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8xOTdiYmQzMC01Njg2LTQzNTQtOWE2ZS1iOTA4YjlmNGRhYjIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJ1dGlsSW1hZ2VzL3Byb21vX3ByaWNlLnBuZyIsImlhdCI6MTc2ODU3MDk3NiwiZXhwIjo4MDc1NzcwOTc2fQ.LDuJ92gP47FRUDqCT2Jikc9SISU2IyNdhAetQ8KlU3U"
              : planModalFeature === "highlight_items"
                ? "https://rfgkalwtrxbiqrqwxmxf.supabase.co/storage/v1/object/sign/utilImages/starred_items.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8xOTdiYmQzMC01Njg2LTQzNTQtOWE2ZS1iOTA4YjlmNGRhYjIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJ1dGlsSW1hZ2VzL3N0YXJyZWRfaXRlbXMucG5nIiwiaWF0IjoxNzY4NTcxMTY5LCJleHAiOjgwNzU3NzExNjl9.v7wkyYJZ8fMn1b34AdPUEzBvz1_AtBtHQeI_tq5s1n8"
                : null
          }
          onCta={() => {
            window.location.href = "/dashboard/pricing";
          }}
        />
      )}
    </div>
  );
}
