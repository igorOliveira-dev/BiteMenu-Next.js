"use client";

import { useEffect, useMemo, useState } from "react";
import useMenu from "@/hooks/useMenu";
import useOwnerRole from "@/hooks/useOwnerRole";
import { supabase } from "@/lib/supabaseClient";
import { useAlert } from "@/providers/AlertProvider";
import { useConfirm } from "@/providers/ConfirmProvider";
import PlanLockNotice from "@/app/dashboard/components/PlanLockNotice";
import Loading from "@/components/Loading";
import { STOCK_ROLES, optionKey } from "@/lib/stock";
import { FaBoxes, FaChevronLeft, FaSearch, FaSyncAlt } from "react-icons/fa";

// Campo de estoque: vazio = sem controle. Só edita o rascunho; grava no "Confirmar estoque".
function StockInput({ stock, value, onChange }) {
  return (
    <div className="flex items-center gap-2 shrink-0">
      {stock === 0 && <span className="text-xs font-semibold text-red-500">Esgotado</span>}
      <input
        type="number"
        min={0}
        inputMode="numeric"
        value={value}
        placeholder="Sem controle"
        onChange={(e) => onChange(e.target.value)}
        className="w-28 xs:w-32 p-2 rounded-lg bg-translucid border-2 border-[var(--translucid)] text-sm"
      />
    </div>
  );
}

// "" = sem controle (null); NaN = inválido
const toStock = (v) => (v === "" ? null : Math.max(0, Math.floor(Number(v))));

const STATUS = {
  all: { label: "Todos", test: () => true },
  tracked: { label: "Com controle", test: (s) => s != null },
  soldOut: { label: "Esgotados", test: (s) => s === 0 },
  untracked: { label: "Sem controle", test: (s) => s == null },
};

const rowClass =
  "rounded-xl border border-translucid bg-[var(--low-translucid)] p-3 flex items-center justify-between gap-3";
const fieldClass = "p-2 rounded-lg bg-translucid border-2 border-[var(--translucid)] text-sm";

const Stock = ({ setSelectedTab }) => {
  const { menu, loading: menuLoading } = useMenu();
  const ownerRole = useOwnerRole(menu?.owner_id);
  const customAlert = useAlert();
  const confirm = useConfirm();

  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [optionStock, setOptionStock] = useState({});
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  // Edições ainda não salvas: { "item:<id>" | "opt:<key>": valor do campo }
  const [drafts, setDrafts] = useState({});
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [view, setView] = useState("items");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [categoryId, setCategoryId] = useState("all");

  const allowed = STOCK_ROLES.includes(ownerRole);

  // Busca itens/opções e o estoque atual do banco. quiet = sem a tela de loading (botão Atualizar)
  const load = async (quiet = false) => {
    if (quiet) setRefreshing(true);
    else setLoading(true);
    const [{ data, error }, { data: stockRows, error: stockError }] = await Promise.all([
      supabase
        .from("categories")
        .select("id, name, position, menu_items ( id, name, position, stock, option_groups ( option_choices ( name ) ) )")
        .eq("menu_id", menu.id)
        .order("position", { ascending: true })
        .order("position", { foreignTable: "menu_items", ascending: true }),
      supabase.from("option_stock").select("name_key, stock").eq("menu_id", menu.id),
    ]);

    if (error || stockError) {
      console.error("Erro ao buscar estoque:", error || stockError);
      customAlert("Erro ao carregar estoque.", "error");
    }

    const cats = data || [];
    setCategories(cats.filter((c) => (c.menu_items || []).length > 0).map((c) => ({ id: c.id, name: c.name })));
    setItems(
      cats.flatMap((c) =>
        (c.menu_items || []).map((it) => ({ id: it.id, name: it.name, stock: it.stock, categoryId: c.id })),
      ),
    );

    // Opções únicas por nome (o estoque é compartilhado entre itens), contando em quantos itens aparecem
    const byKey = {};
    cats.forEach((c) =>
      (c.menu_items || []).forEach((it) => {
        const names = (it.option_groups || []).flatMap((g) => (g.option_choices || []).map((ch) => ch.name));
        new Set(names.filter((n) => optionKey(n))).forEach((name) => {
          const key = optionKey(name);
          byKey[key] ??= { key, name, count: 0 };
          byKey[key].count++;
        });
      }),
    );
    setOptions(Object.values(byKey).sort((a, b) => a.name.localeCompare(b.name, "pt-BR")));
    setOptionStock(Object.fromEntries((stockRows || []).map((r) => [r.name_key, r.stock])));
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    if (menu?.id && allowed) load();
  }, [menu?.id, allowed]);

  const refresh = async () => {
    if (changes.length && !(await confirm("Descartar as alterações não salvas e atualizar o estoque?"))) return;
    setDrafts({});
    load(true);
  };

  const saveItemStock = async (id, stock) => {
    const { error } = await supabase.from("menu_items").update({ stock }).eq("id", id);
    if (!error) setItems((prev) => prev.map((it) => (it.id === id ? { ...it, stock } : it)));
    return { error };
  };

  // option_stock: sem controle = sem linha; senão atualiza ou cria
  const saveOptionStock = async (key, stock) => {
    let error;
    if (stock === null) {
      ({ error } = await supabase.from("option_stock").delete().eq("menu_id", menu.id).eq("name_key", key));
    } else {
      const res = await supabase
        .from("option_stock")
        .update({ stock })
        .eq("menu_id", menu.id)
        .eq("name_key", key)
        .select("name_key");
      error = res.error;
      if (!error && res.data.length === 0) {
        ({ error } = await supabase.from("option_stock").insert({ menu_id: menu.id, name_key: key, stock }));
      }
    }
    if (!error) setOptionStock((prev) => ({ ...prev, [key]: stock }));
    return { error };
  };

  const savedStock = (draftKey) => {
    const [type, id] = [draftKey.slice(0, draftKey.indexOf(":")), draftKey.slice(draftKey.indexOf(":") + 1)];
    return type === "item" ? (items.find((it) => it.id === id)?.stock ?? null) : (optionStock[id] ?? null);
  };

  // Só o que mudou de verdade e é válido
  const changes = Object.entries(drafts)
    .map(([draftKey, value]) => ({ draftKey, stock: toStock(value) }))
    .filter(({ draftKey, stock }) => !Number.isNaN(stock) && stock !== savedStock(draftKey));

  const confirmStock = async () => {
    setSaving(true);
    const results = await Promise.all(
      changes.map(async ({ draftKey, stock }) => {
        const id = draftKey.slice(draftKey.indexOf(":") + 1);
        const { error } = draftKey.startsWith("item:") ? await saveItemStock(id, stock) : await saveOptionStock(id, stock);
        if (error) console.error("Erro ao salvar estoque:", error);
        return { draftKey, error };
      }),
    );
    setSaving(false);

    // Tira do rascunho o que salvou; o que falhou fica para tentar de novo
    const failed = results.filter((r) => r.error).map((r) => r.draftKey);
    setDrafts((prev) => Object.fromEntries(Object.entries(prev).filter(([k]) => failed.includes(k))));
    if (failed.length) customAlert(`Erro ao salvar ${failed.length} item(ns) do estoque. Tente de novo.`, "error");
    else customAlert("Estoque salvo!", "success");
  };

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    const source =
      view === "items"
        ? items.filter((it) => categoryId === "all" || it.categoryId === categoryId)
        : options.map((o) => ({ ...o, stock: optionStock[o.key] ?? null }));
    return source.filter((r) => STATUS[status].test(r.stock) && (!term || r.name.toLowerCase().includes(term)));
  }, [view, items, options, optionStock, search, status, categoryId]);

  const soldOutCount = (view === "items" ? items.map((i) => i.stock) : options.map((o) => optionStock[o.key])).filter(
    (s) => s === 0,
  ).length;

  const header = (
    <div className="flex items-center gap-2">
      <button
        type="button"
        className="p-2 rounded-lg hover:bg-[var(--translucid)] transition cursor-pointer"
        onClick={() => setSelectedTab("menu")}
        aria-label="Voltar ao cardápio"
      >
        <FaChevronLeft />
      </button>
      <div>
        <h2 className="text-lg font-semibold leading-tight">Estoque</h2>
        <p className="text-xs color-gray">Deixe vazio para não controlar. O que esgotar some do cardápio.</p>
      </div>
      {allowed && !loading && (
        <button
          type="button"
          disabled={refreshing || saving}
          onClick={refresh}
          className="ml-auto shrink-0 cursor-pointer flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-[var(--translucid)] transition disabled:opacity-50"
        >
          <FaSyncAlt className={refreshing ? "animate-spin" : ""} />
          <span className="hidden xs:inline">Atualizar</span>
        </button>
      )}
    </div>
  );

  if (menuLoading || !ownerRole) return <Loading />;

  if (!allowed) {
    return (
      <div className="p-4 sm:p-6 flex flex-col gap-4 max-w-[1024px]">
        {header}
        <PlanLockNotice
          plan="business"
          text="Controle a quantidade disponível de cada item e opção. Quando acabar, o cliente não consegue pedir mais do que há."
        />
      </div>
    );
  }

  if (loading) return <Loading />;

  if (items.length === 0) {
    return (
      <div className="p-4 sm:p-6 flex flex-col gap-4 max-w-[1024px]">
        {header}
        <div className="rounded-2xl border border-translucid bg-[var(--low-translucid)] p-8 flex flex-col items-center gap-2 text-center">
          <FaBoxes className="text-2xl opacity-60" />
          <p className="text-sm opacity-80">Nenhum item cadastrado ainda.</p>
        </div>
      </div>
    );
  }

  const categoryName = Object.fromEntries(categories.map((c) => [c.id, c.name]));

  return (
    <div className="p-4 sm:p-6 flex flex-col gap-4 max-w-[1024px]">
      {header}

      {/* filtros fixos no topo enquanto rola a lista */}
      <div className="sticky top-0 z-[1] -mx-1 px-1 py-2 backdrop-blur-2xl flex flex-col gap-2">
        <div className="flex gap-1 p-1 rounded-lg bg-translucid w-fit">
          {[
            ["items", `Itens (${items.length})`],
            ["options", `Opções (${options.length})`],
          ].map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setView(id)}
              className={`cursor-pointer px-3 py-1 rounded-md text-sm transition ${
                view === id ? "bg-[var(--background)] font-semibold shadow" : "opacity-70 hover:opacity-100"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          <label className={`${fieldClass} flex items-center gap-2 flex-1 min-w-[180px]`}>
            <FaSearch className="opacity-60 shrink-0" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={view === "items" ? "Buscar item" : "Buscar opção"}
              className="bg-transparent outline-none w-full"
            />
          </label>

          {view === "items" && categories.length > 1 && (
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={fieldClass}>
              <option value="all">Todas as categorias</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}

          <select value={status} onChange={(e) => setStatus(e.target.value)} className={fieldClass}>
            {Object.entries(STATUS).map(([id, s]) => (
              <option key={id} value={id}>
                {id === "soldOut" ? `${s.label} (${soldOutCount})` : s.label}
              </option>
            ))}
          </select>
        </div>

        {view === "options" && (
          <p className="text-xs color-gray">Opções com o mesmo nome dividem o mesmo estoque em todos os itens.</p>
        )}
      </div>

      {rows.length === 0 ? (
        <p className="text-sm color-gray text-center py-8">Nada encontrado com esses filtros.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {rows.map((r, i) => (
            <div key={r.id ?? r.key} className="flex flex-col gap-2">
              {/* cabeçalho de categoria quando a lista mostra todas */}
              {view === "items" && categoryId === "all" && rows[i - 1]?.categoryId !== r.categoryId && (
                <h3 className="font-semibold mt-2">{categoryName[r.categoryId]}</h3>
              )}
              <div className={rowClass}>
                <div className="min-w-0">
                  <p className="font-medium truncate">{r.name}</p>
                  {view === "options" && (
                    <p className="text-xs color-gray">
                      em {r.count} {r.count === 1 ? "item" : "itens"}
                    </p>
                  )}
                </div>
                {(() => {
                  const draftKey = view === "items" ? `item:${r.id}` : `opt:${r.key}`;
                  return (
                    <StockInput
                      stock={r.stock}
                      value={drafts[draftKey] ?? r.stock ?? ""}
                      onChange={(v) => setDrafts((prev) => ({ ...prev, [draftKey]: v }))}
                    />
                  );
                })()}
              </div>
            </div>
          ))}
        </div>
      )}

      {changes.length > 0 && (
        <div className="sticky bottom-0 z-[1] -mx-1 px-1 py-3 backdrop-blur-2xl flex items-center justify-end gap-2">
          <button
            type="button"
            disabled={saving}
            onClick={() => setDrafts({})}
            className="cursor-pointer px-4 py-2 rounded-lg text-sm hover:bg-[var(--translucid)] transition disabled:opacity-50"
          >
            Descartar
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={confirmStock}
            className="cursor-pointer px-4 py-2 rounded-lg text-sm font-semibold bg-[var(--foreground)] text-[var(--background)] transition disabled:opacity-50"
          >
            {saving ? "Salvando..." : `Confirmar estoque (${changes.length})`}
          </button>
        </div>
      )}
    </div>
  );
};

export default Stock;
