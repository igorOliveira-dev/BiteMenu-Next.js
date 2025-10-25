import React, { useEffect, useState } from "react";
import useMenu from "@/hooks/useMenu";
import { useAlert } from "@/providers/AlertProvider";
import Loading from "@/components/Loading";
import { supabase } from "@/lib/supabaseClient";

const SalesSummary = ({ setSelectedTab }) => {
  const alert = useAlert();
  const { menu, loading } = useMenu();
  const [ownerRole, setOwnerRole] = useState(null);
  const [salesCount, setSalesCount] = useState(0);
  const [salesTotal, setSalesTotal] = useState(0);
  const [loadingSales, setLoadingSales] = useState(true);

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

  useEffect(() => {
    if (!menu?.id) return;

    const fetchSalesSummary = async () => {
      setLoadingSales(true);
      const { data, error } = await supabase.from("sales").select("items_list").eq("menu_id", menu.id);

      if (error) {
        console.error("Erro ao buscar vendas:", error);
        setLoadingSales(false);
        return;
      }

      const count = data.length;
      let total = 0;
      data.forEach((sale) => {
        const items = sale.items_list || [];
        total += items.reduce((acc, it) => {
          const qty = Number(it.qty) || 0;
          const itemBase = (Number(it.price) || 0) * qty;
          const adds = (it.additionals || []).reduce((sa, a) => sa + (Number(a.price) || 0), 0) * qty;
          return acc + itemBase + adds;
        }, 0);
      });

      setSalesCount(count);
      setSalesTotal(total);
      setLoadingSales(false);
    };

    fetchSalesSummary();
  }, [menu?.id]);

  const upgradePlan = () => {
    alert("Entre em contato com o suporte solicitando seu plano Plus!");
  };

  if (loading || loadingSales) {
    return <Loading />;
  }

  if (ownerRole === "free") {
    return (
      <div className="mb-6 h-40 lg:w-[calc(70dvw-256px)] max-w-[768px] rounded-lg bg-translucid border-2 border-translucid flex flex-col justify-center items-center">
        <h4 className="color-gray mb-2">Seu plano não tem acesso ao dashboard</h4>
        <button
          onClick={() => upgradePlan()}
          className="cursor-pointer font-bold p-2 px-4 rounded-xl bg-[#3131ff90] border-2 border-translucid hover:bg-[#4040ff] transition"
        >
          Melhorar plano!
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 mb-6 lg:w-[calc(70dvw-256px)] max-w-[768px] rounded-lg bg-translucid border-2 border-translucid flex flex-col justify-center items-center p-4">
      <h3 className="text-lg font-semibold mb-2">Resumo das vendas</h3>

      <div className="flex gap-6 mb-4">
        <div className="flex flex-col items-center">
          <span className="color-gray text-sm">Total de vendas</span>
          <span className="text-xl font-bold">{salesCount}</span>
        </div>

        <div className="flex flex-col items-center">
          <span className="color-gray text-sm">Total faturado</span>
          <span className="text-xl font-bold">R$ {salesTotal.toFixed(2)}</span>
        </div>
      </div>
      <button
        onClick={() => {
          setSelectedTab("salesDashboard");
        }}
        className="cursor-pointer mb-1 font-bold px-4 py-2 bg-[#3131ff90] rounded-xl border-2 border-translucid hover:bg-[#4040ff] transition"
      >
        Ver dashboard completo
      </button>
    </div>
  );
};

export default SalesSummary;
