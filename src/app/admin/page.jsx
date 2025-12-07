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
      <h1 className="default-h1 mb-4">Admin dashboard</h1>

      {/* 🔹 Filtros */}
      <div className="flex flex-col gap-4 mb-4">
        {/* Pesquisa */}
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Pesquisar..."
          className="px-3 py-1 rounded bg-translucid border border-translucid text-sm max-w-80"
        />
        {/* Toggle Stripe */}
        <label className="flex items-center gap-2 text-sm text-gray-300">
          Só quem quase me deu lucro (ou me deu lucro)
          <input
            type="checkbox"
            checked={showOnlyPaid}
            onChange={(e) => setShowOnlyPaid(e.target.checked)}
            className="toggle toggle-primary"
          />
        </label>
      </div>

      <p className="text-gray-400 mb-4">
        <span className="font-semibold text-white text-8xl">{visibleMenus.length}</span> cardápios
        <span className="text-gray-500 text-xs ml-2">(de {fullMenus.length} no total)</span>
      </p>

      {visibleMenus.length === 0 ? (
        <p className="text-gray-400">Nenhum cardápio encontrado.</p>
      ) : (
        <ul className="space-y-2">
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
