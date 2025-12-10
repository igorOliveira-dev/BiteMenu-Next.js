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
  const [search, setSearch] = useState(""); // 🔍 pesquisa por nome
  const [avgPerWeekday, setAvgPerWeekday] = useState(null);

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
        .select("id, display_name, role, email, stripe_customer_id")
        .in("id", ownerIds);

      if (error) {
        console.error("Erro ao buscar perfis:", error);
        setFullMenus(menus);
        setLoading(false);
        return;
      }

      const merged = menus
        .map((menu) => {
          const ownerProfile = profiles.find((p) => p.id === menu.owner_id);
          return {
            ...menu,
            owner_name: ownerProfile?.display_name || "Sem nome",
            owner_email: ownerProfile?.email || "Sem e-mail",
            owner_role: ownerProfile?.role || "desconhecido",
            stripe_costumer_id: ownerProfile?.stripe_customer_id || null,
          };
        })
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      setFullMenus(merged);
      setLoading(false);
    };

    fetchOwnerProfiles();
  }, [menus, menusLoading]);

  useEffect(() => {
    if (fullMenus.length === 0) return;

    // 🧹 Remover um cardápio específico (exemplo: pelo ID)
    const filteredMenus = fullMenus.filter((m) => m.id !== "3c3d7889-fa34-4bb3-a9c1-9950c76c6a81");

    // Agora sim, pega as datas válidas
    const dates = filteredMenus.map((m) => new Date(m.created_at));

    // encontra a menor e a maior data
    const minDate = new Date(Math.min(...dates));
    const maxDate = new Date(Math.max(...dates));

    // quantas semanas existem entre essas datas?
    const diffMs = maxDate - minDate;
    const weeks = diffMs / (1000 * 60 * 60 * 24 * 7);
    const totalWeeks = Math.max(1, weeks); // evitar divisão por zero

    // contador por dia da semana
    const counts = Array(7).fill(0); // 0=Domingo ... 6=Sábado

    dates.forEach((d) => {
      counts[d.getDay()]++;
    });

    // média por semana
    const averages = counts.map((c) => c / totalWeeks);

    setAvgPerWeekday(averages);
  }, [fullMenus]);

  if (loading || menusLoading) return <Loading />;

  // 🔹 Filtragem combinada
  let visibleMenus = [...fullMenus];

  if (showOnlyPaid) {
    visibleMenus = visibleMenus.filter((m) => m.stripe_costumer_id != null);
  }

  if (search.trim() !== "") {
    const s = search.toLowerCase();
    visibleMenus = visibleMenus.filter((m) => m.title.toLowerCase().includes(s));
  }

  return (
    <div className="p-4">
      <h1 className="default-h1 mb-4 text-center">Admin dashboard</h1>

      {/* 🔹 Filtros */}
      <div className="flex flex-col items-center gap-4 mb-4">
        {/* Pesquisa */}
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Pesquisar..."
          className="px-3 py-1 w-full rounded bg-translucid border border-translucid text-sm max-w-lg"
        />
        {/* Toggle Stripe */}
        <label className="flex items-center gap-2 text-sm text-gray-300">
          Somente com stripe_costumer_id
          <input
            type="checkbox"
            checked={showOnlyPaid}
            onChange={(e) => setShowOnlyPaid(e.target.checked)}
            className="toggle toggle-primary"
          />
        </label>
      </div>

      <p className="my-28 text-3xl xs:text-5xl sm:text-7xl lg:text-9xl font-bold text-center">
        <span>{visibleMenus.length}</span> Registros
        <span className="text-[var(--gray)] text-xs ml-2">(de {fullMenus.length} no total)</span>
      </p>

      {avgPerWeekday && (
        <div className="my-6">
          <h3 className="mb-2">Média de registros por dia da semana</h3>

          <div className="grid grid-cols-4 sm:grid-cols-7 gap-1 sm:gap-4 text-center text-[var(--gray)]">
            {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((day, i) => (
              <div key={day} className="py-3 bg-translucid rounded-lg border border-translucid">
                <p className="text-xs sm:text-lg font-semibold">{day}</p>
                <p className="text-xs sm:text-2xl font-bold text-white">{avgPerWeekday[i].toFixed(2)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {visibleMenus.length === 0 ? (
        <p className="text-[var(--gray)]">Nenhum cardápio encontrado.</p>
      ) : (
        <ul className="space-y-2">
          <h3>Lista de registros:</h3>
          {visibleMenus.map((menu) => (
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
                {menu.stripe_costumer_id != null ? <span className="text-gray-400">!</span> : ""}
                <h2 className="text-lg font-semibold">{menu.title}</h2>
              </div>

              <p className="text-xs text-gray-400 font-mono">
                {new Date(menu.created_at).toLocaleString("pt-BR", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>

              <p className="text-xs text-gray-400">
                slug: <span className="font-mono">{menu.slug}</span>
              </p>

              <div className="text-xs text-gray-400">
                dono: <span className="font-semibold text-white">{menu.owner_name}</span> (
                <span className="font-mono">{menu.owner_role}</span>)
              </div>

              <p className="text-xs text-gray-400">
                email: <span className="font-mono">{menu.owner_email}</span>
              </p>

              <a href={`${window.location.origin}/menu/${menu.slug}`} target="_blank" className="underline text-blue-500">
                acessar
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Admin;
