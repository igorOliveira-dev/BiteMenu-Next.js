import useMenu from "@/hooks/useMenu";
import { supabase } from "@/lib/supabaseClient";
import React, { useEffect, useState } from "react";
import { FaChevronLeft } from "react-icons/fa";

const SalesDashboard = ({ setSelectedTab }) => {
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
    <div className="m-2">
      <div className="flex items-center mb-4 gap-2">
        <div className="cursor-pointer" onClick={() => setSelectedTab("sales")}>
          <FaChevronLeft />
        </div>
        <h2 className="xs:font-semibold">Dashboard de vendas</h2>
      </div>
      <p className="m-4 color-gray">Em desenvolvimento</p>
    </div>
  );
};

export default SalesDashboard;
