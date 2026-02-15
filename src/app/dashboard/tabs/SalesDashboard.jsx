"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
import { FaChevronLeft, FaSyncAlt } from "react-icons/fa";
import { Line } from "react-chartjs-2";
import { Chart as ChartJS, LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend } from "chart.js";
import useMenu from "@/hooks/useMenu";
import { supabase } from "@/lib/supabaseClient";
import Loading from "@/components/Loading";
import { useAlert } from "@/providers/AlertProvider";
import SalesCharts from "./components/sales/SalesCharts";

ChartJS.register(LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend);

/** -------------------------
 * Helpers (agregação dinâmica)
 * ------------------------ */
const MS_DAY = 24 * 60 * 60 * 1000;
const MAX_RANGE_YEARS = 5;
const MAX_RANGE_DAYS = MAX_RANGE_YEARS * 366; // margem p/ bissexto

function diffDaysInclusive(a, b) {
  return Math.floor((b.getTime() - a.getTime()) / MS_DAY) + 1;
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

// Segunda-feira como início da semana (ISO/BR)
function startOfWeek(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay(); // 0 dom, 1 seg...
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

// Regras de granularidade:
//  - intervalo de 1 dia => hora
//  - até 62 dias => dia
//  - até 365 dias => semana
//  - até 5 anos => mês
function pickGranularity(start, end, isSameDay) {
  if (isSameDay) return "hour";
  const days = diffDaysInclusive(start, end);
  if (days <= 62) return "day";
  if (days <= 365) return "week";
  return "month";
}

function keyFor(date, granularity) {
  const d = new Date(date);

  if (granularity === "hour") {
    return `${pad2(d.getHours())}:00`;
  }
  if (granularity === "day") {
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  }
  if (granularity === "week") {
    const w = startOfWeek(d);
    return `${w.getFullYear()}-${pad2(w.getMonth() + 1)}-${pad2(w.getDate())}`; // chave = segunda
  }
  // month
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;
}

function labelForKey(key, granularity) {
  if (granularity === "hour") return key; // "13:00"

  if (granularity === "day") {
    const [, m, d] = key.split("-");
    return `${d}/${m}`;
  }

  if (granularity === "week") {
    const [, m, d] = key.split("-");
    return `Sem ${d}/${m}`;
  }

  // month
  const [y, m] = key.split("-");
  return `${m}/${y}`;
}

function addStep(date, granularity) {
  const d = new Date(date);

  if (granularity === "hour") d.setHours(d.getHours() + 1);
  else if (granularity === "day") d.setDate(d.getDate() + 1);
  else if (granularity === "week") d.setDate(d.getDate() + 7);
  else d.setMonth(d.getMonth() + 1); // month

  return d;
}

function normalizeStart(start, granularity) {
  const d = new Date(start);

  if (granularity === "hour") {
    d.setMinutes(0, 0, 0);
    return d;
  }

  d.setHours(0, 0, 0, 0);

  if (granularity === "week") return startOfWeek(d);
  if (granularity === "month") return new Date(d.getFullYear(), d.getMonth(), 1);

  return d; // day
}

function formatLabelDate(dateStr) {
  const [, m, d] = dateStr.split("-");
  return `${d}/${m}`;
}

/** -------------------------
 * Componente
 * ------------------------ */
const SalesDashboard = ({ setSelectedTab }) => {
  const { menu, loading } = useMenu();
  const customAlert = useAlert();

  const [ownerRole, setOwnerRole] = useState(null);

  const [rawSales, setRawSales] = useState([]);
  const [salesData, setSalesData] = useState([]);
  const [granularity, setGranularity] = useState("day");
  const [loadingSales, setLoadingSales] = useState(false);

  // Datas oficiais (disparam fetch)
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split("T")[0]);

  // Datas pending (inputs)
  const [pendingStartDate, setPendingStartDate] = useState(startDate);
  const [pendingEndDate, setPendingEndDate] = useState(endDate);

  // Se quiser depois, dá pra reativar: filtrar por um dia específico.
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

  const isRangeTooLarge = useCallback((start, end) => {
    const days = diffDaysInclusive(start, end);
    return days > MAX_RANGE_DAYS;
  }, []);

  const fetchSalesInPeriod = useCallback(async () => {
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

    if (end < start) {
      customAlert("A data final não pode ser menor que a inicial.", "error");
      setLoadingSales(false);
      return;
    }

    if (isRangeTooLarge(start, end)) {
      customAlert(`Intervalo muito grande. Selecione no máximo ${MAX_RANGE_YEARS} anos.`, "error");
      setLoadingSales(false);
      return;
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

    const chosenGranularity = pickGranularity(start, end, isSameDay);
    setGranularity(chosenGranularity);

    const computeTotal = (sale) => {
      const items = sale.items_list || [];
      return items.reduce((acc, it) => {
        const qty = Number(it.qty) || 0;
        const base = (Number(it.price) || 0) * qty;
        const adds = (it.additionals || []).reduce((sa, a) => sa + (Number(a.price) || 0), 0) * qty;
        return acc + base + adds;
      }, 0);
    };

    // Agrupar
    const map = {};
    data.forEach((s) => {
      const d = new Date(s.created_at);
      const key = keyFor(d, chosenGranularity);
      const total = s.total ?? computeTotal(s);

      if (!map[key]) map[key] = { total: 0, count: 0 };
      map[key].total += Number(total) || 0;
      map[key].count += 1;
    });

    // Série contínua
    const entries = [];

    if (chosenGranularity === "hour") {
      for (let h = 0; h < 24; h++) {
        const k = `${pad2(h)}:00`;
        entries.push({
          label: labelForKey(k, chosenGranularity),
          total: map[k]?.total || 0,
          count: map[k]?.count || 0,
        });
      }
    } else {
      let cursor = normalizeStart(start, chosenGranularity);
      const endCursor = new Date(end);
      endCursor.setHours(23, 59, 59, 999);

      const endKey = keyFor(endCursor, chosenGranularity);

      while (true) {
        const k = keyFor(cursor, chosenGranularity);
        entries.push({
          label: labelForKey(k, chosenGranularity),
          total: map[k]?.total || 0,
          count: map[k]?.count || 0,
        });

        if (k === endKey) break;
        cursor = addStep(cursor, chosenGranularity);
      }
    }

    setSalesData(entries);
    setRawSales(data);
    setLoadingSales(false);
  }, [menu?.id, startDate, endDate, singleDate, customAlert, isRangeTooLarge]);

  useEffect(() => {
    if (menu?.id) fetchSalesInPeriod();
  }, [menu?.id, fetchSalesInPeriod]);

  const totalPeriod = useMemo(() => salesData.reduce((sum, d) => sum + d.total, 0), [salesData]);
  const totalSalesCount = useMemo(() => salesData.reduce((sum, d) => sum + d.count, 0), [salesData]);
  const averageTicket = useMemo(() => (totalSalesCount ? totalPeriod / totalSalesCount : 0), [totalPeriod, totalSalesCount]);

  if (loading || ownerRole === null || loadingSales) return <Loading />;

  if (ownerRole === "free" || ownerRole === "plus") {
    return (
      <div className="p-4">
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
        data: salesData.map((d) => d.total), // número (melhor)
        borderColor: "#4f46e5",
        backgroundColor: "rgba(79, 70, 229, 0.15)",
        fill: true,
        pointRadius: 2,
        borderWidth: 1.4,
        yAxisID: "y",
      },
      {
        label: "Qtd. de vendas",
        data: salesData.map((d) => d.count),
        borderColor: "#22c55e",
        backgroundColor: "rgba(34, 197, 94, 0.15)",

        fill: false,
        pointRadius: 2,
        borderWidth: 1.2,
        yAxisID: "y1",
      },
    ],
  };

  const maxCount = Math.max(0, ...salesData.map((d) => d.count));

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    plugins: {
      legend: {
        display: true,
        position: "top",
        labels: {
          usePointStyle: true,
          pointStyle: "rectRounded",
          boxWidth: 10,
          boxHeight: 10,
          padding: 16,
        },
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            if (String(context.dataset.label).includes("R$")) {
              return `R$ ${Number(context.parsed.y || 0).toFixed(2)}`;
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
        grid: { color: "rgba(255,255,255,0.06)" },
      },
      y1: {
        beginAtZero: true,
        position: "right",
        grid: { drawOnChartArea: false },
        ticks: { callback: (v) => `${v}x` },
        suggestedMax: maxCount ? maxCount * 2 : 5,
      },
      x: {
        ticks: {
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: granularity === "day" ? 10 : granularity === "week" ? 12 : 8,
        },
        grid: { display: false },
      },
    },
  };

  const granularityLabel =
    granularity === "hour"
      ? "por hora"
      : granularity === "day"
        ? "por dia"
        : granularity === "week"
          ? "por semana"
          : "por mês";

  return (
    <div className="px-2">
      <div className="w-full max-w-[1100px] min-h-[calc(100dvh-110px)]">
        {/* Header */}
        <div className="mb-5 mt-2 flex items-start gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="p-2 rounded hover:bg-white/5 transition"
              onClick={() => setSelectedTab("sales")}
              aria-label="Voltar"
            >
              <FaChevronLeft />
            </button>

            <div>
              <h2 className="font-semibold leading-tight">Dashboard de vendas</h2>
              <p className="text-sm color-gray">
                {formatLabelDate(startDate)} - {formatLabelDate(endDate)} • {granularityLabel}
              </p>
            </div>
          </div>

          <button
            type="button"
            className="p-2 rounded hover:bg-white/5 transition opacity-90 hover:opacity-100"
            onClick={fetchSalesInPeriod}
            aria-label="Atualizar"
          >
            <FaSyncAlt />
          </button>
        </div>

        {/* Filtros (card) */}
        <div className="bg-translucid border border-translucid rounded-lg p-4 mb-4">
          <div className="grid gap-3 sm:grid-cols-3 sm:items-end">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold">Início</label>
              <input
                type="date"
                value={pendingStartDate}
                onChange={(e) => {
                  setPendingStartDate(e.target.value);
                  setSingleDate("");
                }}
                className="input bg-translucid p-2 rounded w-full"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold">Fim</label>
              <input
                type="date"
                value={pendingEndDate}
                onChange={(e) => {
                  setPendingEndDate(e.target.value);
                  setSingleDate("");
                }}
                className="input bg-translucid p-2 rounded w-full"
              />
            </div>

            <button
              className="cursor-pointer py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded transition w-full"
              onClick={() => {
                // validação de limite já acontece no fetch, mas aqui dá um “feedback” antes
                setStartDate(pendingStartDate);
                setEndDate(pendingEndDate);
              }}
            >
              Aplicar filtros
            </button>
          </div>

          <p className="text-xs color-gray mt-3">Limite de intervalo: até {MAX_RANGE_YEARS} anos.</p>
        </div>

        {/* KPIs (grid) */}
        <div className="grid gap-4 sm:grid-cols-3 mb-4">
          <div className="bg-translucid border border-translucid rounded-lg p-4">
            <p className="text-sm color-gray">Total no período</p>
            <p className="text-blue-500 text-2xl font-bold mt-1">R$ {totalPeriod.toFixed(2)}</p>
          </div>

          <div className="bg-translucid border border-translucid rounded-lg p-4">
            <p className="text-sm color-gray">Quantidade de vendas</p>
            <p className="text-green-500 text-2xl font-bold mt-1">{totalSalesCount}</p>
          </div>

          <div className="bg-translucid border border-translucid rounded-lg p-4">
            <p className="text-sm color-gray">Ticket médio</p>
            <p className="text-2xl font-bold mt-1">R$ {averageTicket.toFixed(2)}</p>
          </div>
        </div>

        {/* Gráfico */}
        <div className="bg-translucid border border-translucid rounded-lg p-4 overflow-x-auto">
          {salesData.length === 0 ? (
            <p className="text-center color-gray">Nenhuma venda nesse período.</p>
          ) : (
            <div className="min-w-[600px] sm:min-w-full h-[320px] sm:h-[420px]">
              <Line data={chartData} options={chartOptions} />
            </div>
          )}
        </div>

        {/* Donuts */}
        <div className="mt-6">
          <SalesCharts sales={rawSales} />
        </div>
      </div>
    </div>
  );
};

export default SalesDashboard;
