import React, { useEffect, useState } from "react";
import useMenu from "@/hooks/useMenu";
import { useAlert } from "@/providers/AlertProvider";
import Loading from "@/components/Loading";
import { supabase } from "@/lib/supabaseClient";

const SalesDashboard = () => {
  const alert = useAlert();
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
  }, [menu?.owner_id]);

  const upgradePlan = () => {
    alert("Entre em contato com o suporte solicitando seu plano Plus!");
  };

  if (loading) {
    return <Loading />;
  }

  if (ownerRole === "free") {
    return (
      <div className="mb-6 h-40 lg:w-[calc(70dvw-256px)] max-w-[768px] rounded-lg bg-translucid border-2 border-translucid flex flex-col justify-center items-center">
        <h4 className="color-gray mb-2">Seu plano não tem acesso ao dashboard</h4>
        <button
          onClick={() => upgradePlan()}
          className="cursor-pointer p-2 px-4 rounded-xl bg-[#3131ff90] border-2 border-translucid"
        >
          Melhorar plano!
        </button>
      </div>
    );
  }

  return (
    <div className="mb-6 h-40 lg:w-[calc(70dvw-256px)] max-w-[768px] rounded-lg bg-translucid border-2 border-translucid flex flex-col justify-center items-center"></div>
  );
};

export default SalesDashboard;
