"use client";

import React, { useEffect, useState } from "react";
import useAllMenus from "@/hooks/useAllMenus";
import { supabase } from "@/lib/supabaseClient";
import Loading from "@/components/Loading";

const Admin = () => {
  const { menus, loading: menusLoading } = useAllMenus();
  const [fullMenus, setFullMenus] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOwnerProfiles = async () => {
      if (menusLoading) return;

      setLoading(true);

      if (!menus || menus.length === 0) {
        setFullMenus([]);
        setLoading(false);
        return;
      }

      // 🔹 1. Coleta todos os owner_ids únicos
      const ownerIds = [...new Set(menus.map((menu) => menu.owner_id))];

      // 🔹 2. Busca os profiles dos donos (id, display_name, role, email)
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("id, display_name, role, email")
        .in("id", ownerIds);

      if (error) {
        console.error("Erro ao buscar perfis:", error);
        setFullMenus(menus);
        setLoading(false);
        return;
      }

      // 🔹 3. Faz o merge entre menus e perfis correspondentes
      const merged = menus
        .map((menu) => {
          const ownerProfile = profiles.find((p) => p.id === menu.owner_id);
          return {
            ...menu,
            owner_name: ownerProfile?.display_name || "Sem nome",
            owner_email: ownerProfile?.email || "Sem e-mail",
            owner_role: ownerProfile?.role || "desconhecido",
          };
        })
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      setFullMenus(merged);
      setLoading(false);
    };

    fetchOwnerProfiles();
  }, [menus, menusLoading]);

  useEffect(() => {
    console.log("Menus com dados completos:", fullMenus);
  }, [fullMenus]);

  if (loading || menusLoading) return <Loading />;

  return (
    <div className="p-4">
      <h1 className="default-h1 mb-4">Admin dashboard</h1>

      {fullMenus.length === 0 ? (
        <p className="text-gray-400">Nenhum cardápio encontrado.</p>
      ) : (
        <ul className="space-y-2">
          {fullMenus.map((menu) => (
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
              <h2 className="text-lg font-semibold">{menu.title}</h2>

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
