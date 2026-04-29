"use client";

import React, { useEffect, useState } from "react";
import useMenu from "@/hooks/useMenu";
import { useAlert } from "@/providers/AlertProvider";
import Loading from "@/components/Loading";
import { supabase } from "@/lib/supabaseClient";
import { FaBolt } from "react-icons/fa";
import UpdatePlanModal from "../UpdatePlanModal";

const SalesSummary = ({ setSelectedTab, refreshSignal }) => {
  const alert = useAlert();
  const { menu, loading } = useMenu();
  const [ownerRole, setOwnerRole] = useState(null);
  const [salesCount, setSalesCount] = useState(0);
  const [salesTotal, setSalesTotal] = useState(0);
  const [loadingSales, setLoadingSales] = useState(true);
  const [averageTicket, setAverageTicket] = useState(0);
  const [showUpdatePlanModal, setShowUpdatePlanModal] = useState(false);

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

    const { data, error } = await supabase.from("sales").select("total").eq("menu_id", menu.id);

    if (error) {
      console.error("Erro ao buscar vendas:", error);
      setLoadingSales(false);
      return;
    }

    const total = data.reduce((sum, s) => sum + (Number(s.total) || 0), 0);

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
        onClick={() =>
          ownerRole === "free" || ownerRole === "plus" ? setShowUpdatePlanModal(true) : setSelectedTab("salesDashboard")
        }
        className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-blue-700"
      >
        Ver dashboard completo
      </button>

      {showUpdatePlanModal && (
        <UpdatePlanModal
          title="Veja o dashboard de vendas completo com o Bite Menu Pro"
          text="Analise detalhes de vendas, produtos mais vendidos, horários de pico, e muito mais para otimizar seu negócio."
          image="https://rfgkalwtrxbiqrqwxmxf.supabase.co/storage/v1/object/sign/utilImages/dash_vendas.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8xOTdiYmQzMC01Njg2LTQzNTQtOWE2ZS1iOTA4YjlmNGRhYjIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJ1dGlsSW1hZ2VzL2Rhc2hfdmVuZGFzLnBuZyIsImlhdCI6MTc3NzIzNTM5MiwiZXhwIjo4MDg0NDM1MzkyfQ.KqRDAMsYqM5yEu_eZGme_fdFwSsbcsoDnEBhB6L14_I"
          isOpen={showUpdatePlanModal}
          onClose={() => setShowUpdatePlanModal(false)}
          onCta={upgradePlan}
        />
      )}
    </div>
  );
};

export default SalesSummary;
