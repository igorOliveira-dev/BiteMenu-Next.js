"use client";

import React, { useEffect, useState } from "react";
import useMenu from "@/hooks/useMenu";
import { useAlert } from "@/providers/AlertProvider";
import Loading from "@/components/Loading";
import { supabase } from "@/lib/supabaseClient";
import { FaBolt } from "react-icons/fa";

const SalesSummary = ({ setSelectedTab, refreshSignal }) => {
  const alert = useAlert();
  const { menu, loading } = useMenu();
  const [ownerRole, setOwnerRole] = useState(null);
  const [salesCount, setSalesCount] = useState(0);
  const [salesTotal, setSalesTotal] = useState(0);
  const [loadingSales, setLoadingSales] = useState(true);
  const [averageTicket, setAverageTicket] = useState(0);

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

  const fetchSalesSummary = async () => {
    if (!menu?.id) return;
    setLoadingSales(true);

    const { data, error } = await supabase.from("sales").select("items_list").eq("menu_id", menu.id);

    if (error) {
      console.error("Erro ao buscar vendas:", error);
      setLoadingSales(false);
      return;
    }

    let total = 0;
    data.forEach((sale) => {
      let items = [];
      try {
        items = typeof sale.items_list === "string" ? JSON.parse(sale.items_list) : sale.items_list || [];
      } catch {
        items = [];
      }

      total += items.reduce((acc, it) => {
        const qty = Number(it.qty) || 0;
        const itemBase = (Number(it.price) || 0) * qty;
        const adds = (it.additionals || []).reduce((sa, a) => sa + (Number(a.price) || 0), 0) * qty;
        return acc + itemBase + adds;
      }, 0);
    });

    setSalesCount(data.length);
    setSalesTotal(total);
    setLoadingSales(false);
    const avg = data.length > 0 ? total / data.length : 0;
    setAverageTicket(avg);
  };

  useEffect(() => {
    fetchSalesSummary();
  }, [menu?.id, refreshSignal]);

  const upgradePlan = () => {
    window.location.href = "/dashboard/pricing";
  };

  if (loading || loadingSales) return <Loading />;

  if (ownerRole === "free" || ownerRole === "plus") {
    return (
      <div className="mb-6 h-40 lg:w-[calc(80dvw-256px)] max-w-[1024px] rounded-2xl bg-translucid border border-translucid flex flex-col justify-center items-center">
        <h4 className="color-gray mb-2 text-center mx-2">Seu plano não tem acesso ao dashboard de vendas</h4>
        <button onClick={() => upgradePlan()} className="cta-button flex has-icon">
          <FaBolt /> Melhorar plano!
        </button>
      </div>
    );
  }

  return (
    <div className="sm:p-4 p-3 mb-6 lg:w-[calc(80dvw-256px)] max-w-[1024px] rounded-2xl bg-translucid border border-translucid shadow-sm flex flex-col gap-4">
      <h3 className="text-base font-semibold">Resumo das vendas</h3>

      <div className="grid text-center sm:grid-cols-3 gap-3">
        <div className="rounded-2xl border border-translucid bg-translucid p-3">
          <p className="text-xs uppercase tracking-wide color-gray">Total de vendas</p>
          <p className="text-2xl font-bold mt-1">{salesCount}</p>
        </div>
        <div className="rounded-2xl border border-translucid bg-translucid p-3">
          <p className="text-xs uppercase tracking-wide color-gray">Total faturado</p>
          <p className="text-2xl font-bold mt-1">R$ {salesTotal.toFixed(2)}</p>
        </div>
        <div className="rounded-2xl border border-translucid bg-translucid p-3">
          <p className="text-xs uppercase tracking-wide color-gray">Ticket médio</p>
          <p className="text-2xl font-bold mt-1">R$ {averageTicket.toFixed(2)}</p>
        </div>
      </div>

      <button
        onClick={() => setSelectedTab("salesDashboard")}
        className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-blue-700"
      >
        Ver dashboard completo
      </button>
    </div>
  );
};

export default SalesSummary;
