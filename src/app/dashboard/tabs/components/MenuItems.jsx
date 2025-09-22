"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import useMenu from "@/hooks/useMenu";
import GenericModal from "@/components/GenericModal";
import { FaPen, FaTrash, FaShoppingCart } from "react-icons/fa";
import { useAlert } from "@/providers/AlertProvider";
import { useConfirm } from "@/providers/ConfirmProvider";

function getContrastTextColor(hex) {
  const cleanHex = (hex || "").replace("#", "");
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? "black" : "white";
}

const uid = () => (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `tmp-${Date.now()}`);

export default function MenuItems({ backgroundColor, detailsColor }) {
  const { menu, loading: menuLoading } = useMenu();
  const alert = useAlert();
  confirm = useConfirm();

  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState(null); // null = ainda não buscou
  // modal state (reused para create/edit category/item)
  const [modalOpen, setModalOpen] = useState(false);
  const [modalPayload, setModalPayload] = useState({
    type: null, // 'category' | 'item'
    mode: null, // 'create' | 'edit'
    categoryId: null,
    itemId: null,
    data: {},
  });

  // Fetch categories with nested items using menu_items(*)
  useEffect(() => {
    if (menuLoading) return;

    if (!menu?.id) {
      setCategories([]); // sem menu -> sem categorias
      return;
    }

    let mounted = true;
    const fetchCats = async () => {
      setLoading(true);
      try {
        // use menu_items(*) para não depender de nome de coluna específico
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

        // garante ordenação interna dos items por 'position' se existir
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
        if (mounted) setCategories([]); // fallback
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchCats();
    return () => {
      mounted = false;
    };
  }, [menuLoading, menu?.id]);

  // ---------- CRUD helpers (optimistic UI) ----------
  const createCategory = async ({ name = "Nova categoria" } = {}) => {
    if (!menu?.id) return null;
    const tempId = uid();
    const temp = { id: tempId, name, menu_items: [] };
    setCategories((prev = []) => [...prev, temp]);

    try {
      const { data, error } = await supabase.from("categories").insert({ menu_id: menu.id, name }).select().single();
      if (error) throw error;
      // replace temp with real
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
    // optimistic
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
      setCategories(before); // rollback
      alert?.("Erro ao atualizar categoria", "error");
      return null;
    }
  };

  const deleteCategory = async (categoryId) => {
    const ok = await confirm("Remover categoria? Essa ação removerá os itens também.");
    if (!ok) {
      console.log("[submit] usuário cancelou");
      return;
    }
    const before = categories;
    setCategories((prev = []) => prev.filter((c) => c.id !== categoryId));
    try {
      // se não tiver cascade, remova items primeiro (opcional). Aqui apenas tenta remover categoria.
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

  const createItem = async (categoryId, { name = "Novo item", price = "", description = "" } = {}) => {
    const tempId = uid();
    setCategories((prev = []) =>
      prev.map((c) =>
        c.id === categoryId ? { ...c, menu_items: [...(c.menu_items || []), { id: tempId, name, price, description }] } : c
      )
    );

    try {
      const { data, error } = await supabase
        .from("menu_items")
        .insert({ category_id: categoryId, name, price, description })
        .select()
        .single();
      if (error) throw error;
      // replace temp
      setCategories((prev = []) =>
        prev.map((c) =>
          c.id === categoryId ? { ...c, menu_items: (c.menu_items || []).map((it) => (it.id === tempId ? data : it)) } : c
        )
      );
      alert?.("Item criado", "success");
      return data;
    } catch (err) {
      console.error("createItem error:", err);
      // rollback remove temp
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
    if (!ok) {
      console.log("[submit] usuário cancelou");
      return;
    }
    const before = categories;
    setCategories((prev = []) =>
      prev.map((c) =>
        c.id === categoryId ? { ...c, menu_items: (c.menu_items || []).filter((it) => it.id !== itemId) } : c
      )
    );
    try {
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
      },
    });
    setModalOpen(true);
  };

  const handleModalSave = async () => {
    const { type, mode, categoryId, itemId, data } = modalPayload;

    if (type === "category") {
      if (!data.name.trim()) {
        alert?.("O nome da categoria não pode estar vazio.", "error");
        return;
      }
    } else if (type === "item") {
      if (!data.name.trim()) {
        alert?.("O nome do item não pode estar vazio.", "error");
        return;
      }

      const priceNum = parseFloat(data.price);
      if (isNaN(priceNum)) {
        alert?.("O preço deve ser um número válido.", "error");
        return;
      }

      data.price = priceNum; // Normaliza para número antes de salvar
    }

    if (type === "category") {
      if (mode === "create") {
        await createCategory({ name: data.name });
      } else if (mode === "edit" && categoryId) {
        await updateCategory(categoryId, { name: data.name });
      }
    } else if (type === "item") {
      if (mode === "create") {
        await createItem(categoryId, { name: data.name, price: data.price, description: data.description });
      } else if (mode === "edit" && itemId) {
        await updateItem(itemId, { name: data.name, price: data.price, description: data.description });
      }
    }

    setModalOpen(false);
  };

  const translucidToUse = getContrastTextColor(backgroundColor) === "white" ? "#ffffff15" : "#00000015";
  const grayToUse = getContrastTextColor(backgroundColor) === "white" ? "#cccccc" : "#333333";
  const foregroundToUse = getContrastTextColor(backgroundColor) === "white" ? "#fafafa" : "#171717";

  // ---------- render ----------
  if (menuLoading || loading || categories === null) return <div className="p-4">Carregando categorias...</div>;
  if (!menu) return <div className="p-4">Você ainda não criou um menu.</div>;

  return (
    <div className="p-4 sm:pb-0 pb-38">
      <div className="mb-4">
        <div className="flex gap-2">
          <button
            onClick={() => openCategoryModal("create")}
            className="cursor-pointer px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded"
          >
            + Categoria
          </button>
        </div>
      </div>

      {categories.length === 0 && (
        <div className="mb-4 text-sm" style={{ color: grayToUse }}>
          Nenhuma categoria ainda.
        </div>
      )}

      <div className="space-y-4">
        {categories.map((cat) => (
          <div key={cat.id} className="rounded py-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <button
                  title="Editar categoria"
                  onClick={() => openCategoryModal("edit", cat)}
                  className="cursor-pointer p-2 rounded"
                  style={{ color: foregroundToUse }}
                >
                  <FaPen />
                </button>
                <strong style={{ color: foregroundToUse }}>{cat.name}</strong>
                <span className="text-sm" style={{ color: grayToUse }}>
                  ({cat.menu_items?.length ?? 0} itens)
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => openItemModal("create", cat.id)}
                  className="cursor-pointer px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded"
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
                <div key={it.id} className="flex items-stretch justify-between">
                  {/* LEFT: ocupa o espaço restante */}
                  <div
                    className="flex-1 flex flex-col items-start gap-2 p-2 rounded-l-lg"
                    style={{ backgroundColor: translucidToUse }}
                  >
                    <div>
                      <div className="text-xl font-bold" style={{ color: foregroundToUse }}>
                        {it.name}
                      </div>
                    </div>

                    <div>
                      <div className="text-sm line-clamp-2" style={{ color: grayToUse }}>
                        {it.description}
                      </div>
                    </div>

                    <div className="flex items-center justify-between w-full">
                      <div className="text-2xl font-medium" style={{ color: foregroundToUse }}>
                        {it.price ? `R$ ${Number(it.price).toFixed(2)}` : "-"}
                      </div>
                      <div className="mr-2 px-6 py-2 rounded" style={{ backgroundColor: detailsColor }}>
                        <FaShoppingCart style={{ color: getContrastTextColor(detailsColor) }} />
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
        <GenericModal onClose={() => setModalOpen(false)}>
          <div className="flex items-center gap-4 mb-4">
            <h3 className="font-bold">
              {modalPayload.mode === "create" ? "Criar " : "Editar "}
              {modalPayload.type === "category" ? "categoria" : "item"}
            </h3>
          </div>

          {modalPayload.type === "category" ? (
            <>
              <label className="block mb-2">
                <div className="text-sm color-gray">Nome da categoria</div>
                <input
                  type="text"
                  value={modalPayload.data.name}
                  onChange={(e) => setModalPayload((p) => ({ ...p, data: { ...p.data, name: e.target.value } }))}
                  className="w-full p-2 rounded border bg-translucid mb-2"
                  placeholder="Item"
                />
              </label>
            </>
          ) : (
            <>
              <label className="block mb-2">
                <div className="text-sm color-gray">Nome</div>
                <input
                  type="text"
                  value={modalPayload.data.name}
                  onChange={(e) => setModalPayload((p) => ({ ...p, data: { ...p.data, name: e.target.value } }))}
                  className="w-full p-2 rounded border bg-translucid mb-2"
                />
              </label>

              <label className="block mb-2">
                <div className="text-sm color-gray">Preço</div>
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
                  className="w-full p-2 rounded border bg-translucid mb-2"
                  placeholder="00.00"
                />
              </label>

              <label className="block mb-2">
                <div className="text-sm color-gray">Descrição</div>
                <textarea
                  value={modalPayload.data.description}
                  onChange={(e) => setModalPayload((p) => ({ ...p, data: { ...p.data, description: e.target.value } }))}
                  className="w-full p-2 rounded border bg-translucid mb-2"
                  placeholder="Escreva a descrição (opcional)"
                />
              </label>
            </>
          )}

          <div className="flex justify-end gap-2 mt-4">
            <button onClick={() => setModalOpen(false)} className="cursor-pointer px-4 py-2 bg-gray-600 text-white rounded">
              Cancelar
            </button>
            <button onClick={handleModalSave} className="cursor-pointer px-4 py-2 bg-green-600 text-white rounded">
              {modalPayload.mode === "create" ? "Criar" : "Salvar"}
            </button>
          </div>
        </GenericModal>
      )}
    </div>
  );
}
