"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { FaBullhorn, FaChevronLeft, FaEye, FaEyeSlash, FaMinus, FaPlus, FaShoppingCart, FaStar } from "react-icons/fa";
import Image from "next/image";
import GenericModal from "@/components/GenericModal";
import { useCartContext } from "@/contexts/CartContext";
import { supabase } from "@/lib/supabaseClient";
import useMenu from "@/hooks/useMenu";
import { FaPen, FaTrash, FaChevronRight, FaChevronUp, FaChevronDown } from "react-icons/fa";
import { useAlert } from "@/providers/AlertProvider";
import { useConfirm } from "@/providers/ConfirmProvider";
import { uploadItemImage } from "@/lib/uploadImage";

function getContrastTextColor(hex) {
  const cleanHex = (hex || "").replace("#", "");
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? "black" : "white";
}

const uid = () => (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `tmp-${Date.now()}`);

// ------------------------------------------------------------------------------

export default function MenuItems({ backgroundColor, detailsColor, changedFields }) {
  const { menu, loading: menuLoading } = useMenu();
  const [ownerRole, setOwnerRole] = useState(null);

  const closingFromPopState = useRef(false);

  const alert = useAlert();
  const confirm = useConfirm();

  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState(null);

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
          menu_items (*)
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

  // fechar modal com botão voltar do navegador
  useEffect(() => {
    const handlePopState = () => {
      if (modalOpen) {
        closingFromPopState.current = true;
        setModalOpen(false);
        setModalPayload({
          type: null,
          mode: null,
          categoryId: null,
          itemId: null,
          data: {},
        });
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [modalOpen]);

  const closeModal = () => {
    setModalOpen(false);
    setModalPayload({
      type: null,
      mode: null,
      categoryId: null,
      itemId: null,
      data: {},
    });

    if (history.state?.modal && !closingFromPopState.current) {
      history.back();
    }

    closingFromPopState.current = false;
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
    if (ownerRole === "free" && categories.length >= 4) {
      alert?.("Limite de 5 categorias atingido no plano gratuito.", "error");
      return;
    }

    if (ownerRole === "plus" && categories.length >= 20) {
      alert?.("Limite de 20 categorias atingido no plano Plus.", "error");
      return;
    }

    if (ownerRole === "pro" && categories.length >= 100) {
      alert?.("Limite de 100 categorias atingido no plano Pro.", "error");
      return;
    }

    if (!menu?.id) return null;
    const tempId = uid();
    const temp = { id: tempId, name, menu_items: [] };
    setCategories((prev = []) => [...prev, temp]);

    try {
      const { data, error } = await supabase.from("categories").insert({ menu_id: menu.id, name }).select().single();
      if (error) throw error;
      setCategories((prev = []) => prev.map((c) => (c.id === tempId ? { ...data, menu_items: [] } : c)));
      alert?.("Categoria criada", "success");
      return data;
    } catch (err) {
      console.error("createCategory error:", err);
      setCategories((prev = []) => prev.filter((c) => c.id !== tempId));
      alert?.("Erro ao criar categoria", "error");
      return null;
    }
  };

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
    { name = "Novo item", price = "", description = "", additionals = [], image_url = "" } = {}
  ) => {
    const totalItems = categories.reduce((sum, c) => sum + (c.menu_items?.length || 0), 0);

    if (ownerRole === "free" && totalItems >= 30) {
      alert?.("Limite de 30 itens atingido no plano gratuito.", "error");
      return;
    }

    if (ownerRole === "plus" && totalItems >= 200) {
      alert?.("Limite de 200 itens atingido no plano Plus.", "error");
      return;
    }

    if (ownerRole === "pro" && totalItems >= 1000) {
      alert?.("Limite de 1000 itens atingido no plano Pro.", "error");
      return;
    }

    const tempId = uid();
    setCategories((prev = []) =>
      prev.map((c) =>
        c.id === categoryId
          ? {
              ...c,
              menu_items: [...(c.menu_items || []), { id: tempId, name, price, description, additionals, image_url }],
            }
          : c
      )
    );

    try {
      const { data, error } = await supabase
        .from("menu_items")
        .insert({ category_id: categoryId, name, price, description, additionals, image_url })
        .select()
        .single();
      if (error) throw error;
      setCategories((prev = []) =>
        prev.map((c) =>
          c.id === categoryId
            ? {
                ...c,
                menu_items: (c.menu_items || []).map((it) => (it.id === tempId ? data : it)),
              }
            : c
        )
      );
      alert?.("Item criado", "success");
      return data;
    } catch (err) {
      console.error("createItem error:", err);
      setCategories((prev = []) =>
        prev.map((c) =>
          c.id === categoryId ? { ...c, menu_items: (c.menu_items || []).filter((it) => it.id !== tempId) } : c
        )
      );
      alert?.("Erro ao criar item", "error");
      return null;
    }
  };

  const updateItem = async (itemId, patch) => {
    const before = categories;
    setCategories((prev = []) =>
      prev.map((c) => ({
        ...c,
        menu_items: (c.menu_items || []).map((it) => (it.id === itemId ? { ...it, ...patch } : it)),
      }))
    );
    try {
      const { data, error } = await supabase.from("menu_items").update(patch).eq("id", itemId).select().single();
      if (error) throw error;
      setCategories((prev = []) =>
        prev.map((c) => ({
          ...c,
          menu_items: (c.menu_items || []).map((it) => (it.id === itemId ? { ...it, ...data } : it)),
        }))
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
        c.id === categoryId ? { ...c, menu_items: (c.menu_items || []).filter((it) => it.id !== itemId) } : c
      )
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
      }))
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
        }))
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
        }))
      );
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

  const openItemModal = (mode = "create", categoryId = null, item = null) => {
    setModalPayload({
      type: "item",
      mode,
      categoryId,
      itemId: item?.id ?? null,
      data: {
        name: item?.name ?? "Novo item",
        price: item?.price ?? "",
        description: item?.description ?? "",
        image_url: item?.image_url ?? "",
        additionals: Array.isArray(item?.additionals) ? item.additionals.map((a) => ({ ...a, id: uid() })) : [],
      },
    });
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
        return;
      }
    } else if (t === "item") {
      if (!data.name.trim()) {
        alert?.("O nome do item não pode estar vazio.", "error");
        return;
      }

      const priceNum = parseFloat(String(data.price).replace(",", "."));
      if (isNaN(priceNum)) {
        alert?.("O preço deve ser um número válido.", "error");
        return;
      }
      data.price = priceNum;

      // === Adicionais validation & normalize ===
      const additionals = Array.isArray(data.additionals) ? data.additionals : [];
      for (let i = 0; i < additionals.length; i++) {
        const a = additionals[i];
        if (!String(a.name || "").trim()) {
          alert?.(`O nome do adicional #${i + 1} não pode ficar vazio.`, "error");
          return;
        }
        const p = parseFloat(String(a.price).replace(",", "."));
        if (isNaN(p)) {
          alert?.(`O preço do adicional "${a.name || `#${i + 1}`}" não é válido.`, "error");
          return;
        }
        additionals[i] = { name: String(a.name).trim(), price: p };
      }
      data.additionals = additionals;
    }

    if (t === "category") {
      if (mode === "create") {
        await createCategory({ name: data.name });
      } else if (mode === "edit" && categoryId) {
        await updateCategory(categoryId, { name: data.name });
      }
    } else if (t === "item") {
      if (mode === "create") {
        // inclui image_url
        await createItem(categoryId, {
          name: data.name,
          price: data.price,
          description: data.description,
          additionals: data.additionals,
          image_url: data.image_url ?? "",
        });
      } else if (mode === "edit" && itemId) {
        await updateItem(itemId, {
          name: data.name,
          price: data.price,
          description: data.description,
          additionals: data.additionals,
          image_url: data.image_url ?? "",
        });
      }
    }

    closeModal();
  };

  const verifyPlan = (button) => {
    if (ownerRole === "admin" || ownerRole === "plus" || ownerRole === "pro") {
      if (button === "starredItem") {
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
      }
    } else {
      alert?.("Desbloqueie essa função com o plano Plus ou Pro!");
    }
  };

  const toggleItemStarred = async (itemId, currentStarred) => {
    const newStarred = !currentStarred;

    // optimistic update
    setCategories((prev) =>
      prev.map((c) => ({
        ...c,
        menu_items: c.menu_items.map((it) => (it.id === itemId ? { ...it, starred: newStarred } : it)),
      }))
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
        }))
      );

      alert?.(newStarred ? "Item destacado no seu menu!" : "Destaque removido", "success");
    } catch (err) {
      console.error(err);
      alert("Erro ao destacar item", "error");
    }
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

  const hasStarred = starredItems.length > 0 && (ownerRole === "admin" || ownerRole === "plus" || ownerRole === "pro");

  const translucidToUse = getContrastTextColor(backgroundColor) === "white" ? "#ffffff15" : "#00000015";
  const grayToUse = getContrastTextColor(backgroundColor) === "white" ? "#cccccc" : "#333333";
  const foregroundToUse = getContrastTextColor(backgroundColor) === "white" ? "#fafafa" : "#171717";

  if (menuLoading || loading || categories === null) return <div className="p-4">Carregando categorias...</div>;
  if (!menu) return <div className="p-4">Você ainda não criou um menu.</div>;

  return (
    <div className={`p-4 ${changedFields.length > 0 ? "pb-48 lg:pb-34" : "pb-12 lg:pb-0"}`}>
      <div className="mb-4">
        <div className="flex gap-2">
          <button
            onClick={() => openCategoryModal("create")}
            className="cursor-pointer px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded"
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
        <div className="mb-4 text-sm" style={{ color: grayToUse }}>
          Nenhuma categoria ainda.
        </div>
      )}

      {categories.length > 0 && (
        <div
          className="flex sticky -top-1 border-y-2 overflow-x-auto whitespace-nowrap scrollbar-none z-50"
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
            <div className="flex items-center gap-2 mb-2 pt-4">
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
                  className="min-w-[65%] max-w-[65%] xxs:min-w-[55%] xxs:max-w-[55%] xs:min-w-[40%] xs:max-w-[40%] sm:min-w-[30%] sm:max-w-[30%] lg:min-w-[40%] lg:max-w-[40%] xl:min-w-[30%] xl:max-w-[30%] snap-start rounded-lg p-2 mb-2"
                  style={{ backgroundColor: translucidToUse }}
                >
                  {it.image_url && (
                    <img src={it.image_url} alt={it.name} className="w-full aspect-square object-cover rounded-md mb-2" />
                  )}

                  <div className="text-lg font-semibold line-clamp-1" style={{ color: foregroundToUse }}>
                    {it.name}
                  </div>

                  <div className="text-sm line-clamp-2 mb-1" style={{ color: grayToUse }}>
                    {it.description}
                  </div>

                  <div className="font-bold text-2xl" style={{ color: foregroundToUse }}>
                    {Number(it.price).toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </div>
                  <button
                    onClick={() => toggleItemStarred(it.id, true)}
                    className="mt-2 py-2 rounded text-sm transition hover:opacity-80 w-full cursor-pointer"
                    style={{ backgroundColor: detailsColor, color: getContrastTextColor(detailsColor) }}
                  >
                    Remover dos destaques
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {categories.map((cat) => (
          <div key={cat.id} className="rounded py-3" id={cat.id.slice(0, 5)}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <button
                  title="Editar categoria"
                  onClick={() => openCategoryModal("edit", cat)}
                  className="cursor-pointer p-2 rounded"
                  style={{ color: foregroundToUse }}
                >
                  <FaPen />
                </button>
                <div className="flex items-center flex-wrap gap-x-2">
                  <strong style={{ color: foregroundToUse }}>{cat.name}</strong>
                  <span className="text-sm" style={{ color: grayToUse }}>
                    ({cat.menu_items?.length ?? 0} itens)
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => openItemModal("create", cat.id)}
                  className="min-w-[32px] cursor-pointer px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded"
                >
                  + <span className="hidden sm:inline">Item</span>
                </button>
                <button
                  onClick={() => deleteCategory(cat.id)}
                  className="cursor-pointer p-2 bg-red-600 hover:bg-red-700 text-white rounded"
                >
                  <FaTrash />
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {(cat.menu_items || []).map((it) => (
                <div key={it.id} className={`flex items-stretch justify-between ${it.visible ? "" : "opacity-50"}`}>
                  <div className="flex items-stretch flex-1">
                    {it.image_url ? (
                      <img
                        src={it.image_url}
                        alt={it.name}
                        className="hidden sm:block w-[124px] h-[124px] object-cover rounded-l-lg"
                        style={{ flexShrink: 0 }}
                      />
                    ) : null}

                    <div
                      className={`h-[124px] flex-1 flex flex-col items-start justify-between gap-2 p-2 ${
                        !it.image_url && "rounded-l-lg"
                      }`}
                      style={{ backgroundColor: translucidToUse }}
                    >
                      <div className="flex items-center gap-2">
                        {it.image_url ? (
                          <img
                            src={it.image_url}
                            alt={it.name}
                            className="block sm:hidden w-[68px] h-[68px] object-cover rounded-lg"
                            style={{ flexShrink: 0 }}
                          />
                        ) : null}
                        <div>
                          <div className="text-xl line-clamp-1" style={{ color: foregroundToUse }}>
                            {it.name}
                          </div>

                          <div className="text-sm line-clamp-2" style={{ color: grayToUse }}>
                            {it.description}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between w-full">
                        <div className="text-2xl font-bold" style={{ color: foregroundToUse }}>
                          {it.price
                            ? `${Number(it.price).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`
                            : "-"}
                        </div>
                        <button
                          onClick={() => toggleItemVisibility(it.id, it.visible)}
                          className="cursor-pointer mr-2 px-6 py-2 rounded"
                          style={{ backgroundColor: detailsColor }}
                        >
                          {it.visible ? (
                            <FaEyeSlash style={{ color: getContrastTextColor(detailsColor) }} />
                          ) : (
                            <FaEye style={{ color: getContrastTextColor(detailsColor) }} />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col self-stretch w-14">
                    <button
                      title="Editar item"
                      onClick={() => openItemModal("edit", cat.id, it)}
                      className="flex-1 flex items-center justify-center cursor-pointer p-2 rounded-tr-lg"
                      style={{
                        color: foregroundToUse,
                        backgroundColor: getContrastTextColor(backgroundColor) === "white" ? "#ffffff25" : "#00000025",
                      }}
                    >
                      <FaPen />
                    </button>

                    <button
                      onClick={() => deleteItem(cat.id, it.id)}
                      className="flex-1 flex items-center justify-center cursor-pointer p-2 bg-red-600 hover:bg-red-700 text-white rounded-br-lg"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {modalOpen && (
        <GenericModal onClose={closeModal}>
          <div className="flex items-center gap-4 mb-4 w-[380px]">
            <h3 className="font-bold">
              {modalPayload.type === "sort"
                ? "Ordenar itens"
                : modalPayload.type === "category"
                ? modalPayload.mode === "create"
                  ? "Criar categoria"
                  : "Editar categoria"
                : modalPayload.type === "item"
                ? modalPayload.mode === "create"
                  ? "Criar item"
                  : "Editar item"
                : ""}
            </h3>
          </div>

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
                      <img src={modalPayload.data.image_url} alt="Prévia" className="object-cover w-full h-full" />
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
                          const url = await uploadItemImage(file, menu?.owner_id, modalPayload.data.image_url);
                          setModalPayload((p) => ({ ...p, data: { ...p.data, image_url: url } }));
                        } catch (err) {
                          console.error("upload image error:", err);
                          alert?.("Erro ao enviar imagem (ver console)", "error");
                        } finally {
                          setUploadingImage(false);
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

                  <label className="block mb-2 w-[100px]">
                    <div className="text-sm color-gray">Preço:</div>
                    <div className="flex items-center mb-2">
                      <span className="absolute p-2">R$</span>
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
                        className="w-full p-2 pl-7.5 rounded border border-translucid bg-translucid"
                        placeholder="00.00"
                      />
                    </div>
                  </label>
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

              {/* Adicionais */}
              <div className="mb-2">
                <div className="flex items-center justify-between">
                  <div className="text-sm color-gray">Adicionais (nome + preço)</div>
                  <button
                    onClick={() =>
                      setModalPayload((p) => ({
                        ...p,
                        data: {
                          ...p.data,
                          additionals: [...(p.data.additionals || []), { id: uid(), name: "", price: "" }],
                        },
                      }))
                    }
                    className="cursor-pointer px-2 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white transition"
                    type="button"
                  >
                    + Adicional
                  </button>
                </div>

                <div className="space-y-2 mt-2 max-h-[120px] overflow-y-auto">
                  {(modalPayload.data.additionals || []).map((add, idx) => (
                    <div key={add.id ?? idx} className="flex flex-wrap items-center gap-2 w-full">
                      <input
                        type="text"
                        value={add.name}
                        onChange={(e) =>
                          setModalPayload((p) => {
                            const next = [...(p.data.additionals || [])];
                            next[idx] = { ...next[idx], name: e.target.value };
                            return { ...p, data: { ...p.data, additionals: next } };
                          })
                        }
                        className="flex-1 min-w-0 p-2 rounded border border-translucid bg-translucid"
                        placeholder="Nome do adicional"
                      />

                      <input
                        type="text"
                        value={String(add.price)}
                        onChange={(e) => {
                          let value = e.target.value;
                          value = value.replace(/[^0-9.,-]/g, "");
                          value = value.replace(",", ".");
                          setModalPayload((p) => {
                            const next = [...(p.data.additionals || [])];
                            next[idx] = { ...next[idx], price: value };
                            return { ...p, data: { ...p.data, additionals: next } };
                          });
                        }}
                        maxLength={10}
                        className="w-16 flex-none p-2 rounded border border-translucid bg-translucid"
                        placeholder="0.00"
                      />

                      <button
                        onClick={() =>
                          setModalPayload((p) => {
                            const next = [...(p.data.additionals || [])];
                            next.splice(idx, 1);
                            return { ...p, data: { ...p.data, additionals: next } };
                          })
                        }
                        className="p-2 rounded bg-red-600 text-white mr-2"
                        type="button"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* botões plus || pro */}
              <div className="flex h-[40px] items-end justify-end mt-4 gap-4 w-full ">
                {/* <button
                  className={`p-2 text-[var(--theme-red)] border-2 border-[var(--theme-red)] hover:opacity-80 rounded flex items-center justify-center gap-2 font-semibold w-[50%] cursor-pointer transition`}
                  onClick={() => verifyPlan("promotionalPrice")}
                >
                  <FaBullhorn />
                  <span className="hide-on-400px">Criar promoção</span>
                  <span className="show-on-400px">Promoção</span>
                </button> */}
                <button
                  onClick={() => verifyPlan("starredItem")}
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
            <div className="w-[50%] flex gap-2">
              <button onClick={closeModal} className="cursor-pointer px-4 py-2 bg-gray-600 text-white rounded w-[50%]">
                Cancelar
              </button>
              <button onClick={handleModalSave} className="cursor-pointer px-4 py-2 bg-green-600 text-white rounded w-[50%]">
                Salvar
              </button>
            </div>
          </div>
        </GenericModal>
      )}
    </div>
  );
}
