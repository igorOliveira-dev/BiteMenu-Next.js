"use client";

import React, { useEffect } from "react";
import useAllMenus from "@/hooks/useAllMenus";
import Loading from "@/components/Loading"; // caso já tenha um loader

const Admin = () => {
  const { menus, loading } = useAllMenus();

  useEffect(() => {
    console.log("Menus carregados:", menus);
  }, [menus]);

  if (loading) return <Loading />;

  return (
    <div className="p-4">
      <h1 className="default-h1 mb-4">Admin dashboard</h1>

      {menus.length === 0 ? (
        <p className="text-gray-400">Nenhum cardápio encontrado.</p>
      ) : (
        <ul className="space-y-2">
          {menus.map((menu) => (
            <li key={menu.id} className="p-4 bg-translucid border border-translucid rounded-lg">
              <h2 className="text-lg font-semibold">{menu.title}</h2>
              <p className="text-sm text-gray-500">{menu.description}</p>
              <p className="text-xs text-gray-400 mt-1">
                slug: <span className="font-mono">{menu.slug}</span>
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Admin;
