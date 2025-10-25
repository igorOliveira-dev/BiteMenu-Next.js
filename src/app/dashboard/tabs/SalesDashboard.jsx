import useMenu from "@/hooks/useMenu";
import { supabase } from "@/lib/supabaseClient";
import React, { useEffect, useState } from "react";

const SalesDashboard = (setSelectedTab) => {
  const { menu, loading } = useMenu();
  const [ownerRole, setOwnerRole] = useState(null);

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
  }, []);

  if (ownerRole === "free") {
    return (
      <div className="p-2">
        <p className="font-bold">Você não tem permissão para acessar essa área</p>
        <a href="dashboard" className="py-2 underline color-gray">
          Voltar
        </a>
      </div>
    );
  }

  return (
    <div>
      <h1>Dashboard de vendas</h1>
    </div>
  );
};

export default SalesDashboard;
