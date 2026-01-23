"use client";

import React, { useEffect, useState } from "react";
import useAllMenus from "@/hooks/useAllMenus";
import { supabase } from "@/lib/supabaseClient";
import Loading from "@/components/Loading";

const Admin = () => {
  const { menus, loading: menusLoading } = useAllMenus();
  const [fullMenus, setFullMenus] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showOnlyPaid, setShowOnlyPaid] = useState(false);
  const [search, setSearch] = useState("");
  const [avgPerWeekday, setAvgPerWeekday] = useState(null);

  const [sortByLastAccess, setSortByLastAccess] = useState(false);
  const [sortByItemsCount, setSortByItemsCount] = useState(false);
  const [onlyLast7Days, setOnlyLast7Days] = useState(false);

  const PAGE_SIZE = 15;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    const fetchOwnerProfiles = async () => {
      if (menusLoading) return;

      setLoading(true);

      if (!menus || menus.length === 0) {
        setFullMenus([]);
        setLoading(false);
        return;
      }

      const ownerIds = [...new Set(menus.map((menu) => menu.owner_id))];

      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("id, display_name, role, email, phone, stripe_customer_id")
        .in("id", ownerIds);

      if (error) {
        console.error("Erro ao buscar perfis:", error);
        setFullMenus(menus);
        setLoading(false);
        return;
      }

      const merged = menus.map((menu) => {
        const ownerProfile = profiles.find((p) => p.id === menu.owner_id);
        return {
          ...menu,
          owner_name: ownerProfile?.display_name || "Sem nome",
          owner_email: ownerProfile?.email || "Sem e-mail",
          owner_role: ownerProfile?.role || "desconhecido",
          owner_phone: ownerProfile?.phone || "Sem telefone",
          stripe_costumer_id: ownerProfile?.stripe_customer_id || null,
        };
      });

      setFullMenus(merged);
      setLoading(false);
    };

    fetchOwnerProfiles();
  }, [menus, menusLoading]);

  useEffect(() => {
    if (fullMenus.length === 0) return;

    const filteredMenus = fullMenus.filter((m) => m.id !== "3c3d7889-fa34-4bb3-a9c1-9950c76c6a81");

    const dates = filteredMenus.map((m) => new Date(m.created_at));
    const minDate = new Date(Math.min(...dates));
    const maxDate = new Date(Math.max(...dates));

    const diffMs = maxDate - minDate;
    const weeks = diffMs / (1000 * 60 * 60 * 24 * 7);
    const totalWeeks = Math.max(1, weeks);

    const counts = Array(7).fill(0);
    dates.forEach((d) => counts[d.getDay()]++);

    const averages = counts.map((c) => c / totalWeeks);
    setAvgPerWeekday(averages);
  }, [fullMenus]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [showOnlyPaid, search, sortByLastAccess, sortByItemsCount, onlyLast7Days]);

  if (loading || menusLoading) return <Loading />;

  // 🔹 FILTRAGEM + ORDENAÇÃO
  let visibleMenus = [...fullMenus];

  if (showOnlyPaid) {
    visibleMenus = visibleMenus.filter((m) => m.stripe_costumer_id != null);
  }

  if (search.trim() !== "") {
    const s = search.toLowerCase();
    visibleMenus = visibleMenus.filter((m) => m.title.toLowerCase().includes(s));
  }

  if (onlyLast7Days) {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    visibleMenus = visibleMenus.filter((m) => m.last_access_at && new Date(m.last_access_at) >= sevenDaysAgo);
  }

  // ⭐ ORDENAR POR QUANTIDADE DE ITENS (PRIORIDADE MÁXIMA)
  if (sortByItemsCount) {
    visibleMenus.sort((a, b) => {
      const diff = (b.items_count || 0) - (a.items_count || 0);
      if (diff !== 0) return diff;

      // desempate elegante
      return new Date(b.last_access_at || 0) - new Date(a.last_access_at || 0);
    });
  } else if (sortByLastAccess) {
    visibleMenus.sort((a, b) => new Date(b.last_access_at || 0) - new Date(a.last_access_at || 0));
  } else {
    // fallback natural: mais recentes primeiro
    visibleMenus.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }

  const paginatedMenus = visibleMenus.slice(0, visibleCount);
  const hasMore = visibleCount < visibleMenus.length;

  return (
    <div className="p-4">
      <h1 className="default-h1 mb-4 text-center">Admin dashboard</h1>

      {/* 🔹 Filtros */}
      <div className="flex flex-col items-center gap-4 mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Pesquisar..."
          className="px-3 py-1 w-full rounded bg-translucid border border-translucid text-sm max-w-lg"
        />

        <label className="flex items-center gap-2 text-sm text-gray-300">
          Somente com stripe
          <input
            type="checkbox"
            checked={showOnlyPaid}
            onChange={(e) => setShowOnlyPaid(e.target.checked)}
            className="toggle toggle-primary"
          />
        </label>

        <label className="flex items-center gap-2 text-sm text-gray-300">
          Ordenar por quantidade de itens
          <input
            type="checkbox"
            checked={sortByItemsCount}
            onChange={(e) => {
              setSortByItemsCount(e.target.checked);
              if (e.target.checked) setSortByLastAccess(false);
            }}
            className="toggle toggle-primary"
          />
        </label>

        <label className="flex items-center gap-2 text-sm text-gray-300">
          Ordenar por último acesso
          <input
            type="checkbox"
            checked={sortByLastAccess}
            onChange={(e) => {
              setSortByLastAccess(e.target.checked);
              if (e.target.checked) setSortByItemsCount(false);
            }}
            className="toggle toggle-primary"
          />
        </label>

        <label className="flex items-center gap-2 text-sm text-gray-300">
          Apenas acessados nos últimos 7 dias
          <input
            type="checkbox"
            checked={onlyLast7Days}
            onChange={(e) => setOnlyLast7Days(e.target.checked)}
            className="toggle toggle-primary"
          />
        </label>
      </div>

      <p className="my-28 text-3xl xs:text-5xl sm:text-7xl lg:text-9xl font-bold text-center">
        <span>{visibleMenus.length}</span> Registros
        <span className="text-[var(--gray)] text-xs ml-2">(de {fullMenus.length} no total)</span>
      </p>

      {paginatedMenus.length === 0 ? (
        <p className="text-[var(--gray)]">Nenhum cardápio encontrado.</p>
      ) : (
        <ul className="space-y-2">
          <h3>Lista de registros:</h3>
          {paginatedMenus.map((menu) => (
            <li
              key={menu.id}
              className={`p-4 bg-translucid border-2 ${
                menu.owner_role === "admin"
                  ? "border-red-500"
                  : menu.owner_role === "plus" || menu.owner_role === "pro"
                    ? "border-blue-500"
                    : "border-translucid"
              } rounded-lg flex flex-col gap-2`}
            >
              <div className="flex items-center gap-2">
                {menu.stripe_costumer_id != null && <span className="text-gray-400">!</span>}
                <h2 className="text-lg font-semibold">{menu.title}</h2>
                <span className="text-xs text-gray-400 ml-auto">{menu.items_count ?? 0} itens</span>
              </div>

              <p className="text-xs text-gray-400 font-mono">
                criado em {new Date(menu.created_at).toLocaleString("pt-BR")}
              </p>

              <p className="text-xs text-gray-400">
                último acesso:{" "}
                {menu.last_access_at ? (
                  <span className="font-mono">{new Date(menu.last_access_at).toLocaleString("pt-BR")}</span>
                ) : (
                  <span className="italic text-gray-500">sem dados</span>
                )}
              </p>

              <p className="text-xs text-gray-400">
                dono: <span className="font-semibold text-white">{menu.owner_name}</span> (
                <span className="font-mono">{menu.owner_role}</span>)
              </p>

              <p className="text-xs text-gray-400">
                email: <span className="font-semibold text-white">{menu.owner_email}</span>
              </p>

              <a href={`${window.location.origin}/menu/${menu.slug}`} target="_blank" className="underline text-blue-500">
                acessar
              </a>

              <a href={`https://wa.me/${menu.owner_phone}`} target="_blank" className="underline text-blue-500">
                whatsapp
              </a>
            </li>
          ))}
        </ul>
      )}

      {hasMore && (
        <div className="flex justify-center mt-6">
          <button
            onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
            className="px-6 py-2 rounded-lg border border-translucid bg-translucid hover:opacity-80 transition"
          >
            Ver mais
          </button>
        </div>
      )}
    </div>
  );
};

export default Admin;
