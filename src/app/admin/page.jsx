"use client";

import React, { useEffect, useState } from "react";
import useAllMenus from "@/hooks/useAllMenus";
import { supabase } from "@/lib/supabaseClient";
import Loading from "@/components/Loading";
import Return from "@/components/Return";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ComposedChart,
  Legend,
  Bar,
  Line,
} from "recharts";

const Admin = () => {
  const { menus, loading: menusLoading } = useAllMenus();
  const [fullMenus, setFullMenus] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showOnlyPaid, setShowOnlyPaid] = useState(false);
  const [search, setSearch] = useState("");
  const [avgPerWeekday, setAvgPerWeekday] = useState(null);
  const [monthlyGrowth, setMonthlyGrowth] = useState([]);

  const [showCharts, setShowCharts] = useState(true);
  const [planGrowth, setPlanGrowth] = useState({ plus: [], pro: [] });
  const [planGrowthLoading, setPlanGrowthLoading] = useState(true);
  const [planGrowthError, setPlanGrowthError] = useState(null);

  const [sortByLastAccess, setSortByLastAccess] = useState(false);
  const [onlyLast7Days, setOnlyLast7Days] = useState(false);
  const [showOnlyPlusPro, setShowOnlyPlusPro] = useState(false);

  const PAGE_SIZE = 15;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    const fetchOwnerProfiles = async () => {
      if (menusLoading) return;

      setLoading(true);

      if (!menus || menus.length === 0) {
        setFullMenus([]);
        setLoading(false);
        return;
      }

      const ownerIds = [...new Set(menus.map((menu) => menu.owner_id))];

      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("id, display_name, role, email, phone, stripe_customer_id")
        .in("id", ownerIds);

      if (error) {
        console.error("Erro ao buscar perfis:", error);
        setFullMenus(menus);
        setLoading(false);
        return;
      }

      const merged = menus.map((menu) => {
        const ownerProfile = profiles.find((p) => p.id === menu.owner_id);
        return {
          ...menu,
          owner_name: ownerProfile?.display_name || "Sem nome",
          owner_email: ownerProfile?.email || "Sem e-mail",
          owner_role: ownerProfile?.role || "desconhecido",
          owner_phone: ownerProfile?.phone || "Sem telefone",
          stripe_costumer_id: ownerProfile?.stripe_customer_id || null,
        };
      });

      setFullMenus(merged);
      setLoading(false);
    };

    fetchOwnerProfiles();
  }, [menus, menusLoading]);

  useEffect(() => {
    if (fullMenus.length === 0) return;

    const filteredMenus = fullMenus.filter((m) => m.id !== "3c3d7889-fa34-4bb3-a9c1-9950c76c6a81");

    const dates = filteredMenus.map((m) => new Date(m.created_at));
    const minDate = new Date(Math.min(...dates));
    const maxDate = new Date(Math.max(...dates));

    const diffMs = maxDate - minDate;
    const weeks = diffMs / (1000 * 60 * 60 * 24 * 7);
    const totalWeeks = Math.max(1, weeks);

    const counts = Array(7).fill(0);
    dates.forEach((d) => counts[d.getDay()]++);

    const averages = counts.map((c) => c / totalWeeks);
    setAvgPerWeekday(averages);
  }, [fullMenus]);

  // 🔹 Crescimento acumulado de clientes por mês (baseado nos menus)
  useEffect(() => {
    if (fullMenus.length === 0) {
      setMonthlyGrowth([]);
      return;
    }

    const sorted = [...fullMenus].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

    const monthlyCounts = {};
    sorted.forEach((m) => {
      const date = new Date(m.created_at);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      monthlyCounts[key] = (monthlyCounts[key] || 0) + 1;
    });

    const sortedKeys = Object.keys(monthlyCounts).sort();
    let cumulative = 0;

    const data = sortedKeys.map((key) => {
      cumulative += monthlyCounts[key];
      const [year, month] = key.split("-");
      const label = new Date(Number(year), Number(month) - 1).toLocaleDateString("pt-BR", {
        month: "short",
        year: "2-digit",
      });
      return { month: label, total: cumulative };
    });

    setMonthlyGrowth(data);
  }, [fullMenus]);

  // 🔹 Buscar evolução de assinantes por plano (Stripe: CPF + CNPJ)
  useEffect(() => {
    const fetchPlanGrowth = async () => {
      setPlanGrowthLoading(true);
      setPlanGrowthError(null);

      try {
        const res = await fetch("/api/admin/stripe-subscriptions");
        if (!res.ok) throw new Error("Falha ao buscar dados do Stripe");

        const data = await res.json();
        setPlanGrowth({ plus: data.plus || [], pro: data.pro || [] });
      } catch (err) {
        console.error("Erro ao buscar evolução por plano:", err);
        setPlanGrowthError("Não foi possível carregar os dados do Stripe.");
      } finally {
        setPlanGrowthLoading(false);
      }
    };

    fetchPlanGrowth();
  }, []);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [showOnlyPaid, search, sortByLastAccess, onlyLast7Days, showOnlyPlusPro]);

  if (loading || menusLoading) return <Loading />;

  // 🔹 FILTRAGEM + ORDENAÇÃO
  let visibleMenus = [...fullMenus];

  if (showOnlyPaid) {
    visibleMenus = visibleMenus.filter((m) => m.stripe_costumer_id != null);
  }

  if (search.trim() !== "") {
    const s = search.toLowerCase();
    visibleMenus = visibleMenus.filter((m) => m.title.toLowerCase().includes(s));
  }

  if (onlyLast7Days) {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    visibleMenus = visibleMenus.filter((m) => m.last_access_at && new Date(m.last_access_at) >= sevenDaysAgo);
  }

  if (sortByLastAccess) {
    visibleMenus.sort((a, b) => new Date(b.last_access_at || 0) - new Date(a.last_access_at || 0));
  } else {
    visibleMenus.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }

  if (showOnlyPlusPro) {
    visibleMenus = visibleMenus.filter((m) => ["plus", "pro"].includes(m.owner_role));
  }

  const paginatedMenus = visibleMenus.slice(0, visibleCount);
  const hasMore = visibleCount < visibleMenus.length;

  return (
    <div className="p-4">
      <div className="mb-4 flex items-center justify-center">
        <Return />
        <h1 className="default-h1 text-center">Admin dashboard</h1>
      </div>

      <p className="text-center mb-4 text-sm">
        <button onClick={() => setShowCharts(!showCharts)}>{showCharts ? "Ocultar gráficos" : "Mostrar gráficos"}</button>
      </p>

      {showCharts && (
        <>
          {" "}
          {/* 🔹 Gráfico de crescimento acumulado de clientes (menus) */}
          {monthlyGrowth.length > 0 && (
            <div className="w-full max-w-4xl mx-auto h-64 mb-10">
              <h3 className="text-sm text-gray-400 mb-2 text-center">Crescimento acumulado de clientes por mês</h3>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyGrowth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="month" stroke="#999" fontSize={12} />
                  <YAxis stroke="#999" fontSize={12} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #333" }}
                    labelStyle={{ color: "#fff" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="total"
                    name="Total de clientes"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.2}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
          {/* 🔹 Gráficos de evolução de assinantes por plano (Stripe: CPF + CNPJ) */}
          <div className="w-full max-w-6xl mx-auto mb-10">
            <h3 className="text-sm text-gray-400 mb-4 text-center">Evolução de assinantes por plano</h3>

            {planGrowthError ? (
              <p className="text-center text-red-400 text-sm">{planGrowthError}</p>
            ) : planGrowthLoading ? (
              <p className="text-center text-gray-500 text-sm">Carregando dados do Stripe...</p>
            ) : (
              <div className="flex flex-col gap-10">
                {[
                  { key: "plus", label: "Plus", color: "#3b82f6" },
                  { key: "pro", label: "Pro", color: "#1e3a8a" },
                ].map(({ key, label, color }) => (
                  <div key={key} className="w-full">
                    <p className="text-xs mb-2 text-center" style={{ color }}>
                      {label}
                    </p>
                    <div className="w-full h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={planGrowth[key]}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                          <XAxis dataKey="month" stroke="#999" fontSize={12} />
                          <YAxis stroke="#999" fontSize={12} allowDecimals={false} />
                          <Tooltip
                            contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #333" }}
                            labelStyle={{ color: "#fff" }}
                          />
                          <Legend wrapperStyle={{ fontSize: 12 }} />
                          <Bar dataKey="novos" name="Novos assinantes" fill={color} fillOpacity={0.6} />
                          <Bar dataKey="cancelados" name="Cancelamentos" fill="#ef4444" fillOpacity={0.6} />
                          <Line
                            type="monotone"
                            dataKey="total"
                            name="Total líquido acumulado"
                            stroke="#22c55e"
                            strokeWidth={2}
                            dot={false}
                          />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* 🔹 Filtros */}
      <div className="flex flex-col items-center gap-4 mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Pesquisar..."
          className="px-3 py-1 w-full rounded bg-translucid border border-translucid text-sm max-w-lg"
        />

        <div className="flex gap-4 flex-wrap justify-center">
          <label className="flex items-center gap-2 text-sm text-gray-300">
            Apenas Plus/Pro
            <input
              type="checkbox"
              checked={showOnlyPlusPro}
              onChange={(e) => setShowOnlyPlusPro(e.target.checked)}
              className="toggle toggle-primary"
            />
          </label>

          <label className="flex items-center gap-2 text-sm text-gray-300">
            Somente com stripe
            <input
              type="checkbox"
              checked={showOnlyPaid}
              onChange={(e) => setShowOnlyPaid(e.target.checked)}
              className="toggle toggle-primary"
            />
          </label>

          <label className="flex items-center gap-2 text-sm text-gray-300">
            Ordenar por último acesso
            <input
              type="checkbox"
              checked={sortByLastAccess}
              onChange={(e) => {
                setSortByLastAccess(e.target.checked);
              }}
              className="toggle toggle-primary"
            />
          </label>

          <label className="flex items-center gap-2 text-sm text-gray-300">
            Apenas acessados nos últimos 7 dias
            <input
              type="checkbox"
              checked={onlyLast7Days}
              onChange={(e) => setOnlyLast7Days(e.target.checked)}
              className="toggle toggle-primary"
            />
          </label>
        </div>
      </div>

      <p className="my-28 text-3xl xs:text-5xl sm:text-7xl lg:text-9xl font-bold text-center">
        <span>{visibleMenus.length}</span> Registros
        <span className="text-[var(--gray)] text-xs ml-2">(de {fullMenus.length} no total)</span>
      </p>

      {paginatedMenus.length === 0 ? (
        <p className="text-[var(--gray)]">Nenhum cardápio encontrado.</p>
      ) : (
        <ul className="space-y-2">
          <h3>Lista de registros:</h3>
          {paginatedMenus.map((menu) => (
            <li
              key={menu.id}
              className={`p-4 bg-translucid border-2 ${
                menu.owner_role === "admin"
                  ? "border-red-500"
                  : menu.owner_role === "plus"
                    ? "border-blue-500"
                    : menu.owner_role === "pro"
                      ? "border-4 border-blue-900"
                      : "border-translucid"
              } rounded-lg flex flex-col gap-2`}
            >
              <div className="flex items-center gap-2">
                {menu.stripe_costumer_id != null && <span className="text-gray-400">!</span>}
                <h2 className="text-lg font-semibold">{menu.title}</h2>
                <span className="text-xs text-gray-400 ml-auto">{menu.items_count ?? 0} itens</span>
              </div>

              <p className="text-xs text-gray-400 font-mono">
                criado em {new Date(menu.created_at).toLocaleString("pt-BR")}
              </p>

              <p className="text-xs text-gray-400">
                último acesso:{" "}
                {menu.last_access_at ? (
                  <span className="font-mono">{new Date(menu.last_access_at).toLocaleString("pt-BR")}</span>
                ) : (
                  <span className="italic text-gray-500">sem dados</span>
                )}
              </p>

              <p className="text-xs text-gray-400">
                dono: <span className="font-semibold text-white">{menu.owner_name}</span> (
                <span className="font-mono">{menu.owner_role}</span>)
              </p>

              <p className="text-xs text-gray-400">
                email: <span className="font-semibold text-white">{menu.owner_email}</span>
              </p>

              <a href={`${window.location.origin}/menu/${menu.slug}`} target="_blank" className="underline text-blue-500">
                acessar
              </a>

              <a href={`https://wa.me/${menu.owner_phone}`} target="_blank" className="underline text-blue-500">
                whatsapp
              </a>
            </li>
          ))}
        </ul>
      )}

      {hasMore && (
        <div className="flex justify-center mt-6">
          <button
            onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
            className="px-6 py-2 rounded-lg border border-translucid bg-translucid hover:opacity-80 transition"
          >
            Ver mais
          </button>
        </div>
      )}
    </div>
  );
};

export default Admin;
