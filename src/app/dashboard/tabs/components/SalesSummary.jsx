"use client";

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

      // Totais gerais
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

  if (loading || loadingSales) return <Loading />;

  if (ownerRole === "free") {
    return (
      <div className="mb-6 h-40 lg:w-[calc(70dvw-256px)] max-w-[768px] rounded-lg bg-translucid border-2 border-translucid flex flex-col justify-center items-center">
        <h4 className="color-gray mb-2">Seu plano não tem acesso ao dashboard de vendas</h4>
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
    <div className="p-6 mb-6 lg:w-[calc(80dvw-256px)] max-w-3xl rounded-xl bg-translucid border border-translucid shadow-md flex flex-col gap-3">
      <h3 className="text font-semibold text-center">Resumo das vendas</h3>
      {/* Totais */}
      <div className="flex flex-col xs:flex-row justify-around py-8 items-center gap-4 bg-translucid border-2 border-translucid rounded-xl">
        <div className="flex flex-col items-center">
          <span className="text-sm color-gray">Total de vendas</span>
          <span className="text-3xl font-bold">{salesCount}</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-sm color-gray">Total faturado</span>
          <span className="text-3xl font-bold">R$ {salesTotal.toFixed(2)}</span>
        </div>
      </div>

      {/* Botão */}
      <div className="flex justify-center mt-2">
        <button
          onClick={() => setSelectedTab("salesDashboard")}
          className="cursor-pointer px-5 py-2 font-bold bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white transition"
        >
          Ver dashboard completo
        </button>
      </div>
    </div>
  );
};

export default SalesSummary;
