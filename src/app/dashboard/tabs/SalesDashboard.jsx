"use client";

import React, { useEffect, useState, useMemo } from "react";
import { FaChevronLeft, FaSyncAlt } from "react-icons/fa";
import { Line } from "react-chartjs-2";
import { Chart as ChartJS, LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend } from "chart.js";
import useMenu from "@/hooks/useMenu";
import { supabase } from "@/lib/supabaseClient";
import Loading from "@/components/Loading";
import { useAlert } from "@/providers/AlertProvider";
import SalesCharts from "./components/SalesCharts";

ChartJS.register(LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend);

const SalesDashboard = ({ setSelectedTab }) => {
  const { menu, loading } = useMenu();
  const customAlert = useAlert();

  const [ownerRole, setOwnerRole] = useState(null);
  const [rawSales, setRawSales] = useState([]);
  const [salesData, setSalesData] = useState([]);
  const [loadingSales, setLoadingSales] = useState(false);

  // Datas "oficiais" que disparam a atualização do gráfico
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split("T")[0]);

  // Datas temporárias dos inputs, para evitar atualização imediata
  const [pendingStartDate, setPendingStartDate] = useState(startDate);
  const [pendingEndDate, setPendingEndDate] = useState(endDate);

  const [singleDate, setSingleDate] = useState("");

  useEffect(() => {
    if (!menu?.owner_id) return;
    const fetchOwnerRole = async () => {
      const { data, error } = await supabase.from("profiles").select("role").eq("id", menu.owner_id).single();
      if (error) return console.error("Erro ao buscar role:", error);
      setOwnerRole(data?.role);
    };
    fetchOwnerRole();
  }, [menu?.owner_id]);

  const fetchSalesInPeriod = async () => {
    if (!menu?.id) return;
    setLoadingSales(true);

    let start, end;

    if (singleDate) {
      const parts = singleDate.split("-");
      start = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]), 0, 0, 0, 0);
      end = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]), 23, 59, 59, 999);
    } else {
      const sParts = startDate.split("-");
      const eParts = endDate.split("-");
      start = new Date(Number(sParts[0]), Number(sParts[1]) - 1, Number(sParts[2]), 0, 0, 0, 0);
      end = new Date(Number(eParts[0]), Number(eParts[1]) - 1, Number(eParts[2]), 23, 59, 59, 999);
    }

    const { data, error } = await supabase
      .from("sales")
      .select("created_at, items_list, total, payment_method, service")
      .eq("menu_id", menu.id)
      .gte("created_at", start.toISOString())
      .lte("created_at", end.toISOString())
      .order("created_at", { ascending: true });

    if (error) {
      console.error(error);
      customAlert("Erro ao carregar vendas.", "error");
      setLoadingSales(false);
      return;
    }

    const isSameDay =
      start.getFullYear() === end.getFullYear() && start.getMonth() === end.getMonth() && start.getDate() === end.getDate();

    const map = {};
    data.forEach((s) => {
      const d = new Date(s.created_at);
      const key = isSameDay
        ? `${d.getHours().toString().padStart(2, "0")}:00`
        : `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}-${d.getDate().toString().padStart(2, "0")}`;

      const computeTotal = (sale) => {
        const items = sale.items_list || [];
        return items.reduce((acc, it) => {
          const qty = Number(it.qty) || 0;
          const base = (Number(it.price) || 0) * qty;
          const adds = (it.additionals || []).reduce((sa, a) => sa + (Number(a.price) || 0), 0) * qty;
          return acc + base + adds;
        }, 0);
      };

      const total = s.total ?? computeTotal(s);

      if (!map[key]) map[key] = { total: 0, count: 0 };
      map[key].total += total;
      map[key].count += 1;
    });

    const entries = [];
    if (isSameDay) {
      for (let h = 0; h < 24; h++) {
        const key = `${h.toString().padStart(2, "0")}:00`;
        entries.push({
          label: key,
          total: map[key]?.total || 0,
          count: map[key]?.count || 0,
        });
      }
    } else {
      const cursor = new Date(start);
      while (cursor <= end) {
        const key = `${cursor.getFullYear()}-${(cursor.getMonth() + 1).toString().padStart(2, "0")}-${cursor
          .getDate()
          .toString()
          .padStart(2, "0")}`;
        entries.push({
          label: `${cursor.getDate().toString().padStart(2, "0")}/${(cursor.getMonth() + 1).toString().padStart(2, "0")}`,
          total: map[key]?.total || 0,
          count: map[key]?.count || 0,
        });
        cursor.setDate(cursor.getDate() + 1);
      }
    }

    setSalesData(entries);
    setRawSales(data);
    setLoadingSales(false);
  };

  const formatLabelDate = (dateStr) => {
    const [y, m, d] = dateStr.split("-");
    return `${d}/${m}`;
  };

  useEffect(() => {
    if (menu?.id) fetchSalesInPeriod();
  }, [menu?.id, startDate, endDate, singleDate]);

  const totalPeriod = useMemo(() => salesData.reduce((sum, d) => sum + d.total, 0), [salesData]);
  const totalSalesCount = useMemo(() => salesData.reduce((sum, d) => sum + d.count, 0), [salesData]);

  const averageTicket = useMemo(() => {
    if (totalSalesCount === 0) return 0;
    return totalPeriod / totalSalesCount;
  }, [totalPeriod, totalSalesCount]);

  if (loading || ownerRole === null || loadingSales) return <Loading />;

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

  const chartData = {
    labels: salesData.map((d) => d.label),
    datasets: [
      {
        label: "Vendas (R$)",
        data: salesData.map((d) => d.total.toFixed(2)),
        borderColor: "#4f46e5",
        backgroundColor: "rgba(79, 70, 229, 0.15)",
        tension: 0.15,
        fill: true,
        pointRadius: 2,
        borderWidth: 1.2,
        yAxisID: "y",
      },
      {
        label: "Qtd. de vendas",
        data: salesData.map((d) => d.count),
        borderColor: "#22c55e",
        backgroundColor: "rgba(34, 197, 94, 0.15)",
        tension: 0.15,
        fill: false,
        pointRadius: 1,
        borderWidth: 1.2,
        yAxisID: "y1",
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    interaction: { mode: "index", intersect: false },
    plugins: {
      legend: {
        display: true,
        position: "top",
        labels: {
          usePointStyle: true,
          pointStyle: "rect",
          boxWidth: 10,
          boxHeight: 10,
          padding: 15,
        },
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            if (context.dataset.label.includes("R$")) {
              return `R$ ${Number(context.parsed.y).toFixed(2)}`;
            }
            return `${context.parsed.y} vendas`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        position: "left",
        ticks: { callback: (v) => `R$ ${v}` },
      },
      y1: {
        beginAtZero: true,
        position: "right",
        grid: { drawOnChartArea: false },
        ticks: { callback: (v) => `${v}x` },
        suggestedMax: Math.max(...salesData.map((d) => d.count)) * 2 || 5,
      },
    },
  };

  return (
    <div className="px-4 sm:px-2 lg:grid">
      <div className="md:m-auto lg:m-2 lg:w-[calc(80dvw-256px)] max-w-[1024px] min-h-[calc(100dvh-110px)] rounded-lg overflow-y-auto scrollbar-none">
        {/* Cabeçalho */}
        <div className="flex items-center gap-2 mb-4">
          <div className="cursor-pointer" onClick={() => setSelectedTab("sales")}>
            <FaChevronLeft />
          </div>
          <h2 className="xs:font-semibold">Dashboard de vendas</h2>
          <FaSyncAlt
            className="cursor-pointer opacity-80 hover:opacity-100 transition"
            onClick={() => fetchSalesInPeriod()}
          />
        </div>

        {/* Filtros */}
        <div className="flex flex-col gap-3 mb-4">
          <div className="flex flex-col sm:flex-row gap-4 mt-2">
            <div className="flex flex-row gap-2 items-center">
              <label className="text-sm font-semibold">Início:</label>
              <input
                type="date"
                value={pendingStartDate}
                onChange={(e) => {
                  setPendingStartDate(e.target.value);
                  setSingleDate("");
                }}
                className="input bg-translucid p-2 rounded w-full sm:w-auto"
              />
            </div>

            <div className="flex flex-row gap-2 items-center">
              <label className="text-sm font-semibold">Fim:</label>
              <input
                type="date"
                value={pendingEndDate}
                onChange={(e) => {
                  setPendingEndDate(e.target.value);
                  setSingleDate("");
                }}
                className="input bg-translucid p-2 rounded w-full sm:w-auto"
              />
            </div>

            <button
              className="cursor-pointer py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded transition"
              onClick={() => {
                setStartDate(pendingStartDate);
                setEndDate(pendingEndDate);
              }}
            >
              Aplicar filtros
            </button>
          </div>
        </div>

        {/* Totais */}
        <div className="bg-translucid p-4 border border-translucid rounded-lg py-6 shadow-sm mb-4 flex flex-col items-center justify-between">
          <div className="flex flex-wrap justify-around w-full gap-6 text-center items-center mb-4">
            <div className=" sm:w-[180px]">
              <p className="text-sm sm:text-base">Total no período:</p>
              <p className="text-blue-500 text-xl sm:text-2xl font-bold">R$ {totalPeriod.toFixed(2)}</p>
            </div>
            <div className=" sm:w-[180px]">
              <p className="text-sm sm:text-base">Quantidade de vendas:</p>
              <p className="text-green-500 text-xl sm:text-2xl font-bold">{totalSalesCount}</p>
            </div>
            <div className=" sm:w-[180px]">
              <p className="text-sm sm:text-base">Ticket médio:</p>
              <p className="font-bold text-xl sm:text-2xl">R$ {averageTicket.toFixed(2)}</p>
            </div>
            <p className="text-sm color-gray xs:hidden ">
              ({formatLabelDate(startDate)} - {formatLabelDate(endDate)})
            </p>
          </div>
          <p className="text-sm color-gray xs:block hidden">
            ({formatLabelDate(startDate)} - {formatLabelDate(endDate)})
          </p>
        </div>

        {/* Gráfico */}
        <div className="bg-translucid border border-translucid rounded-lg p-4 shadow-md overflow-x-auto">
          {salesData.length === 0 ? (
            <p className="text-center color-gray">Nenhuma venda nesse período.</p>
          ) : (
            <div className="min-w-[600px] sm:min-w-full">
              <Line data={chartData} options={chartOptions} />
            </div>
          )}
        </div>
        <div className="mt-6">
          <SalesCharts sales={rawSales} />
        </div>
      </div>
    </div>
  );
};

export default SalesDashboard;
