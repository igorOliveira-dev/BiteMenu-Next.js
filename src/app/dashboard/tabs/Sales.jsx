"use client";

import { useEffect, useState } from "react";
import useMenu from "@/hooks/useMenu";
import { useAlert } from "@/providers/AlertProvider";
import { supabase } from "@/lib/supabaseClient";
import Loading from "@/components/Loading";
import { FaTrash, FaChevronLeft, FaChevronDown, FaChevronRight, FaChevronUp, FaSyncAlt, FaPhoneAlt, FaClipboardList } from "react-icons/fa";
import GenericModal from "@/components/GenericModal";
import { useConfirm } from "@/providers/ConfirmProvider";
import SalesSummary from "./components/sales/SalesSummary";
import useModalBackHandler from "@/hooks/useModalBackHandler";

const SectionCard = ({ title, subtitle, children, icon = null }) => (
  <section className="rounded-2xl border border-translucid bg-translucid/70 p-4 shadow-sm">
    <div className="mb-3 flex items-start gap-3">
      {icon ? <div className="mt-0.5 opacity-80">{icon}</div> : null}
      <div>
        <h3 className="text-base font-semibold leading-tight">{title}</h3>
        {subtitle ? <p className="mt-1 text-xs color-gray">{subtitle}</p> : null}
      </div>
    </div>
    {children}
  </section>
);

const Sales = ({ setSelectedTab }) => {
  const { menu, loading } = useMenu();
  const customAlert = useAlert();
  const confirm = useConfirm();

  const [refreshSummary, setRefreshSummary] = useState(0);

  const [monthData, setMonthData] = useState({});
  const [filters, setFilters] = useState({});
  const [saleModalOpen, setSaleModalOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);
  const [expandedMonths, setExpandedMonths] = useState({});
  const [monthsList, setMonthsList] = useState([]);

  const PAGE_SIZE = 20;

  // controla paginação por mês
  const [monthPager, setMonthPager] = useState({});

  const computeItemsSubtotal = (sale) => {
    if (!sale) return 0;
    const items = sale.items_list || [];
    return items.reduce((acc, it) => {
      const qty = Number(it.qty) || 0;
      const base = (Number(it.price) || 0) * qty;
      const adds = (it.additionals || []).reduce((sa, a) => sa + (Number(a.price) || 0), 0) * qty;
      return acc + base + adds;
    }, 0);
  };

  const computeSaleTotal = (sale) => {
    if (!sale) return 0;
    // se já tem total salvo, usa ele
    if (sale.total != null) return Number(sale.total) || 0;

    // fallback (caso raro): subtotal + delivery_fee se existir
    const fee = Number(sale.delivery_fee) || 0;
    return computeItemsSubtotal(sale) + fee;
  };

  useEffect(() => {
    // Remove meses que ficaram vazios
    setMonthsList((prev) => prev.filter((m) => monthData[m.key]?.length !== 0 || m.count > 0));
  }, [monthData]);

  useEffect(() => {
    if (!menu?.id) return;
    const channel = supabase
      .channel("sales-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "sales" }, (payload) => {
        if (payload.new?.menu_id === menu.id) {
          // Atualiza apenas o mês da venda modificada
          const d = new Date(payload.new.created_at);
          const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
          const key = d.toLocaleString("pt-BR", { month: "long", year: "numeric" });
          const end = new Date(monthStart);
          end.setMonth(end.getMonth() + 1);
          fetchSalesByMonth(monthStart, end, key, { page: 0, append: false });
          refreshMonthSummary(monthStart, end, key);
        }
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [menu?.id]);

  const fetchSalesByMonth = async (monthStart, monthEnd, monthKey, { page = 0, append = false } = {}) => {
    if (!menu?.id) return;

    setMonthPager((prev) => ({
      ...prev,
      [monthKey]: { ...(prev[monthKey] || {}), loading: true },
    }));

    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const { data, error } = await supabase
      .from("sales")
      .select("*")
      .eq("menu_id", menu.id)
      .gte("created_at", monthStart.toISOString())
      .lt("created_at", monthEnd.toISOString())
      .order("created_at", { ascending: false })
      .order("id", { ascending: false }) // ajuda a estabilizar a ordem
      .range(from, to);

    if (error) {
      console.error(error);
      customAlert("Erro ao carregar vendas do mês", "error");
      setMonthPager((prev) => ({
        ...prev,
        [monthKey]: { ...(prev[monthKey] || {}), loading: false },
      }));
      return;
    }

    setMonthData((prev) => ({
      ...prev,
      [monthKey]: append
        ? Array.from(new Map([...(prev[monthKey] || []), ...(data || [])].map((s) => [s.id, s])).values())
        : data || [],
    }));

    const hasMore = (data?.length || 0) === PAGE_SIZE;

    setMonthPager((prev) => ({
      ...prev,
      [monthKey]: { page, hasMore, loading: false },
    }));
  };

  const refreshMonthSummary = async (monthStart, monthEnd, monthKey) => {
    if (!menu?.id) return;

    const { data, error } = await supabase
      .from("sales")
      .select("total, delivery_fee")
      .eq("menu_id", menu.id)
      .gte("created_at", monthStart.toISOString())
      .lt("created_at", monthEnd.toISOString());

    if (error) return;

    const count = data.length;
    const total = data.reduce((sum, s) => sum + computeSaleTotal(s), 0);

    setMonthsList((prev) => prev.map((m) => (m.key === monthKey ? { ...m, count, total } : m)));
  };

  const deleteSale = async (id) => {
    const ok = await confirm("Quer mesmo excluir essa venda?");
    if (!ok) return;

    const { error } = await supabase.from("sales").delete().eq("id", id);
    if (error) return customAlert("Erro ao excluir venda", "error");
    customAlert("Venda excluída.", "success");

    // Atualiza o mês afetado de forma segura
    const monthKey = Object.keys(monthData).find((key) => monthData[key].some((s) => s.id === id));

    if (monthKey) {
      const monthStartTimestamp = monthData[monthKey][0] ? new Date(monthData[monthKey][0].created_at) : new Date(); // caso o mês fique vazio
      const start = new Date(monthStartTimestamp.getFullYear(), monthStartTimestamp.getMonth(), 1);
      const end = new Date(start);
      end.setMonth(end.getMonth() + 1);

      fetchSalesByMonth(start, end, monthKey, { page: 0, append: false });
      refreshMonthSummary(start, end, monthKey);
    }
  };

  const openSaleModal = (sale) => {
    setSelectedSale(sale);
    setSaleModalOpen(true);
  };

  useEffect(() => {
    if (!menu?.id) return;

    const fetchMonths = async () => {
      const { data, error } = await supabase
        .from("sales")
        .select("created_at, total, delivery_fee")
        .eq("menu_id", menu.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error(error);
        return customAlert("Erro ao carregar meses de vendas", "error");
      }

      const monthsMap = {};

      data.forEach((sale) => {
        const d = new Date(sale.created_at);
        const key = d.toLocaleString("pt-BR", { month: "long", year: "numeric" });
        const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);

        if (!monthsMap[key]) monthsMap[key] = { key, monthStart: monthStart.getTime(), count: 0, total: 0 };

        monthsMap[key].count++;
        monthsMap[key].total += computeSaleTotal(sale);
      });

      const monthsArray = Object.values(monthsMap);
      setMonthsList(monthsArray);
    };

    fetchMonths();
  }, [menu?.id]);

  const toggleMonth = async (key, monthStart) => {
    setExpandedMonths((prev) => {
      const next = { ...prev, [key]: !prev[key] };

      // quando está abrindo o mês pela primeira vez
      if (!prev[key] && !monthData[key]) {
        // inicializa o pager do mês
        setMonthPager((p) => ({
          ...p,
          [key]: p[key] || { page: 0, hasMore: true, loading: false },
        }));

        const start = new Date(monthStart);
        const end = new Date(start);
        end.setMonth(start.getMonth() + 1);

        // carrega as primeiras 20 vendas
        fetchSalesByMonth(start, end, key, { page: 0, append: false });
        refreshMonthSummary(start, end, key);
      }

      return next;
    });
  };

  const getFilteredSales = (key) => {
    const query = filters[key]?.query?.toLowerCase() || "";
    let salesList = monthData[key] || [];

    const filtered = salesList.filter((s) => {
      const queryLower = query.toLowerCase();

      // Pesquisa por cliente
      if (s.costumer_name?.toLowerCase().includes(queryLower)) return true;
      if (s.costumer_phone?.toLowerCase().includes(queryLower)) return true;

      // Pesquisa pelos itens da venda
      if (s.items_list?.some((item) => item.name?.toLowerCase().includes(queryLower))) return true;

      // Pesquisa pelos adicionais de cada item
      if (s.items_list?.some((item) => item.additionals?.some((add) => add.name?.toLowerCase().includes(queryLower))))
        return true;

      return false;
    });

    const order = filters[key]?.order;
    if (order?.startsWith("date")) {
      filtered.sort((a, b) =>
        order === "date" ? new Date(a.created_at) - new Date(b.created_at) : new Date(b.created_at) - new Date(a.created_at),
      );
    } else if (order?.startsWith("value")) {
      filtered.sort((a, b) => {
        const totalA = computeSaleTotal(a);
        const totalB = computeSaleTotal(b);
        return order === "value" ? totalA - totalB : totalB - totalA;
      });
    }

    return filtered;
  };

  const resetSales = () => {
    setMonthData({});
    setFilters({});
    setExpandedMonths({});
    setMonthsList([]);
    setMonthPager({});

    // Opcional: refazer a lista de meses
    if (menu?.id) {
      const fetchMonths = async () => {
        const { data, error } = await supabase
          .from("sales")
          .select("created_at, items_list, total, delivery_fee")
          .eq("menu_id", menu.id)
          .order("created_at", { ascending: false });

        if (error) return customAlert("Erro ao carregar meses de vendas", "error");

        const monthsMap = {};
        data.forEach((sale) => {
          const d = new Date(sale.created_at);
          const key = d.toLocaleString("pt-BR", { month: "long", year: "numeric" });
          const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);

          if (!monthsMap[key]) monthsMap[key] = { key, monthStart: monthStart.getTime(), count: 0, total: 0 };

          monthsMap[key].count++;
          monthsMap[key].total += computeSaleTotal(sale);
        });

        setMonthsList(Object.values(monthsMap));
      };

      fetchMonths();
    }
  };

  const modalSubtotal = selectedSale ? computeItemsSubtotal(selectedSale) : 0;
  const modalFee = Number(selectedSale?.delivery_fee) || 0;
  const modalTotal = modalSubtotal + modalFee;

  // Modal de detalhes de venda fecha com botão "Voltar"
  useModalBackHandler(saleModalOpen, () => setSaleModalOpen(false));

  if (loading) return <Loading />;
  if (!menu) return <p>Você ainda não criou seu cardápio.</p>;

  return (
    <div className="px-4 sm:px-2 lg:grid">
      <div className="md:m-auto lg:m-2 lg:w-[calc(80dvw-256px)] max-w-[1024px] min-h-[calc(100dvh-110px)] rounded-2xl overflow-y-auto">
        <div className="flex items-center gap-3 mb-4">
          <h2 className="default-h2 font-semibold">Vendas</h2>
          <button
            type="button"
            className="cursor-pointer rounded-full p-2 opacity-80 transition hover:opacity-100"
            onClick={() => {
              resetSales();
              setRefreshSummary((prev) => prev + 1);
            }}
            title="Atualizar vendas"
          >
            <FaSyncAlt />
          </button>
        </div>

        <h3 className="mb-2 text-base font-semibold">Dashboard de vendas</h3>
        <SalesSummary setSelectedTab={setSelectedTab} refreshSignal={refreshSummary} />

        <h3 className="mb-3 text-base font-semibold">Histórico de vendas</h3>
        <div className="space-y-3">
          {!monthsList || monthsList.length === 0 ? (
            <p className="p-6 text-center color-gray">Nenhuma venda encontrada.</p>
          ) : null}
          {monthsList.map((group) => {
            const key = group.key;
            const isOpen = expandedMonths[key] ?? false;
            const monthSales = monthData[key] || [];
            const monthTotal = monthSales.reduce((sum, s) => sum + computeSaleTotal(s), 0);

            return (
              <section key={key} className="border border-translucid rounded-2xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleMonth(key, group.monthStart)}
                  className="cursor-pointer w-full flex justify-between items-center p-4 bg-translucid hover:opacity-95 transition"
                >
                  <div>
                    <h3 className="font-semibold text-lg capitalize">{key}</h3>
                    <p className="text-sm color-gray text-start mt-0.5">{group.count} venda(s)</p>
                  </div>
                  <div className="text-right flex items-center gap-3">
                    <p className="font-bold">R$ {Number(group.total || 0).toFixed(2)}</p>
                    {isOpen ? <FaChevronDown /> : <FaChevronRight />}
                  </div>
                </button>

                {isOpen && (
                  <div className="p-4 space-y-4">
                    {/* Barra de pesquisa */}
                    <input
                      type="text"
                      placeholder="Pesquisar por nome, telefone, itens..."
                      className="input w-full bg-translucid border border-translucid p-3 rounded-xl"
                      value={filters[key]?.query || ""}
                      onChange={(e) =>
                        setFilters((prev) => ({
                          ...prev,
                          [key]: { ...prev[key], query: e.target.value },
                        }))
                      }
                    />

                    {/* Ordenação */}
                    <div className="flex gap-2">
                      {[
                        { key: "date", label: "Data" },
                        { key: "value", label: "Valor" },
                      ].map(({ key: type, label }) => {
                        const current = filters[key]?.order || "";
                        const isActive = current.startsWith(type);
                        const isDesc = current.endsWith("-desc");

                        return (
                          <button
                            key={type}
                            onClick={() =>
                              setFilters((prev) => ({
                                ...prev,
                                [key]: {
                                  ...prev[key],
                                  order: current === type ? `${type}-desc` : current === `${type}-desc` ? type : type,
                                },
                              }))
                            }
                            className={`cursor-pointer flex items-center gap-2 text-sm px-3 py-1.5 rounded-xl transition-all border border-translucid
                            ${isActive ? "bg-[#6060ff80] border-[#6060ff] shadow-md" : "bg-translucid hover:opacity-90"}`}
                          >
                            <span>Ordenar por {label}</span>
                            {isActive &&
                              (isDesc ? <FaChevronDown className="text-xs" /> : <FaChevronUp className="text-xs" />)}
                          </button>
                        );
                      })}
                    </div>

                    {monthPager[key]?.loading && <Loading />}

                    {getFilteredSales(key).length === 0 && !monthPager[key]?.loading ? (
                      <p className="p-6 text-center color-gray">Nenhuma venda encontrada.</p>
                    ) : (
                      getFilteredSales(key).map((sale) => (
                        <div
                          key={sale.id}
                          className="rounded-2xl border border-translucid bg-translucid p-4 shadow-sm transition hover:shadow-md flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-3 mb-3">
                              <div className="min-w-0">
                                <h3 className="font-semibold text-lg truncate">{sale.costumer_name || "Cliente"}</h3>
                                <p className="text-sm color-gray mt-0.5">
                                  {new Date(sale.created_at).toLocaleString("pt-BR")}
                                </p>
                              </div>
                              <div className="text-right shrink-0">
                                <p className="text-xs uppercase tracking-wide color-gray">Total</p>
                                <p className="text-2xl font-bold">R$ {computeSaleTotal(sale).toFixed(2)}</p>
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-2 mb-3 text-sm">
                              <span className="rounded-full border border-translucid px-3 py-1 color-gray bg-[var(--translucid)]">
                                {sale.payment_method === "pix"
                                  ? "Pix"
                                  : sale.payment_method === "debit"
                                    ? "Débito"
                                    : sale.payment_method === "credit"
                                      ? "Crédito"
                                      : sale.payment_method === "cash"
                                        ? "Dinheiro"
                                        : "Não informado"}
                              </span>
                              <span className="rounded-full border border-translucid px-3 py-1 color-gray bg-[var(--translucid)]">
                                {sale.service === "delivery"
                                  ? "Entrega"
                                  : sale.service === "pickup"
                                    ? "Retirada"
                                    : sale.service === "dinein"
                                      ? "No local"
                                      : sale.service === "faceToFace"
                                        ? "Atendimento presencial"
                                        : "Não informado"}
                              </span>
                              {sale.costumer_phone && (
                                <span className="rounded-full border border-translucid px-3 py-1 color-gray bg-[var(--translucid)]">
                                  {sale.costumer_phone}
                                </span>
                              )}
                            </div>

                            {sale.items_list && (
                              <div className="text-sm">
                                <p className="text-xs uppercase tracking-wide font-bold mb-1">Itens</p>
                                <ul>
                                  {sale.items_list?.slice(0, 4).map((item, i) => (
                                    <li key={i} className="line-clamp-1 color-gray">
                                      {item.qty}x {item.name} — R$ {(item.price * item.qty).toFixed(2)}
                                    </li>
                                  ))}
                                  {sale.items_list?.length > 4 && (
                                    <li className="color-gray">+ {sale.items_list.length - 4} item(ns)</li>
                                  )}
                                </ul>
                              </div>
                            )}
                          </div>

                          <div className="flex sm:flex-col gap-2 sm:w-[160px]">
                            <button
                              onClick={() => openSaleModal(sale)}
                              className="flex-1 cursor-pointer px-4 py-2.5 rounded-xl border border-translucid bg-[var(--translucid)] text-sm font-medium hover:opacity-80 transition text-center"
                            >
                              Detalhes
                            </button>
                            <button
                              onClick={() => deleteSale(sale.id, key)}
                              className="flex-1 cursor-pointer px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition"
                            >
                              <FaTrash /> Excluir
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                    {(() => {
                      const pager = monthPager[key] || { page: 0, hasMore: false, loading: false };
                      if (!pager.hasMore) return null;

                      return (
                        <button
                          type="button"
                          disabled={pager.loading}
                          className="w-full cursor-pointer rounded-xl border border-translucid bg-translucid px-4 py-2 transition hover:opacity-80"
                          onClick={() => {
                            const start = new Date(group.monthStart);
                            const end = new Date(start);
                            end.setMonth(start.getMonth() + 1);

                            fetchSalesByMonth(start, end, key, { page: (pager.page || 0) + 1, append: true });
                          }}
                        >
                          {pager.loading ? "Carregando..." : "Carregar mais"}
                        </button>
                      );
                    })()}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      </div>

      {saleModalOpen && selectedSale && (
        <GenericModal title="Detalhes da venda" onClose={() => setSaleModalOpen(false)} size="xl">
          <div className="max-h-[90dvh] sm:max-h-[80vh] w-full overflow-y-auto scrollbar-none space-y-4">
            <form
              className="space-y-4"
              onSubmit={async (e) => {
                e.preventDefault();
                const subtotal = computeItemsSubtotal(selectedSale);
                const fee = Number(selectedSale.delivery_fee) || 0;
                const total = subtotal + fee;

                const payload = { ...selectedSale, total, updated_at: new Date().toISOString() };

                const { error } = await supabase.from("sales").update(payload).eq("id", selectedSale.id);
                if (error) return customAlert("Erro ao atualizar venda", "error");

                setMonthData((prev) => {
                  const updated = { ...prev };
                  const monthKey = Object.keys(prev).find((key) => prev[key].some((s) => s.id === selectedSale.id));
                  if (monthKey) {
                    updated[monthKey] = prev[monthKey].map((s) => (s.id === selectedSale.id ? { ...s, ...payload } : s));
                  }
                  return updated;
                });

                const d = new Date(payload.created_at);
                const start = new Date(d.getFullYear(), d.getMonth(), 1);
                const end = new Date(start);
                end.setMonth(end.getMonth() + 1);
                const key = d.toLocaleString("pt-BR", { month: "long", year: "numeric" });

                refreshMonthSummary(start, end, key);
                customAlert("Venda atualizada com sucesso!", "success");
                setSaleModalOpen(false);
              }}
            >
              <SectionCard title="Cliente" subtitle="Dados básicos da venda" icon={<FaPhoneAlt />}>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium">Nome do cliente</label>
                    <input
                      type="text"
                      className="input w-full rounded-xl bg-black/10 p-3"
                      value={selectedSale.costumer_name || ""}
                      onChange={(e) => setSelectedSale({ ...selectedSale, costumer_name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">Telefone</label>
                    <input
                      type="text"
                      className="input w-full rounded-xl bg-black/10 p-3"
                      value={selectedSale.costumer_phone || ""}
                      onChange={(e) => setSelectedSale({ ...selectedSale, costumer_phone: e.target.value })}
                    />
                  </div>
                </div>
              </SectionCard>

              <SectionCard title="Venda" subtitle="Tipo de atendimento e pagamento" icon={<FaClipboardList />}>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium">Serviço</label>
                    <select
                      className="input w-full rounded-xl bg-black/10 p-3"
                      value={selectedSale.service || ""}
                      onChange={(e) => setSelectedSale({ ...selectedSale, service: e.target.value })}
                    >
                      <option className="text-black" value="delivery">Entrega</option>
                      <option className="text-black" value="pickup">Retirada</option>
                      <option className="text-black" value="dinein">No local</option>
                      <option className="text-black" value="faceToFace">Atendimento presencial</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">Método de pagamento</label>
                    <select
                      className="input w-full rounded-xl bg-black/10 p-3"
                      value={selectedSale.payment_method || ""}
                      onChange={(e) => setSelectedSale({ ...selectedSale, payment_method: e.target.value })}
                    >
                      <option className="text-black" value="pix">Pix</option>
                      <option className="text-black" value="debit">Débito</option>
                      <option className="text-black" value="credit">Crédito</option>
                      <option className="text-black" value="cash">Dinheiro</option>
                    </select>
                  </div>
                </div>
              </SectionCard>

              <SectionCard title="Itens" subtitle="Edite rapidamente o conteúdo da venda">
                <div className="space-y-4">
                  {(selectedSale.items_list || []).map((item, i) => (
                    <div key={i} className="rounded-2xl border border-translucid bg-black/10 p-4">
                      <div className="mb-3 flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="mb-1 text-xs uppercase tracking-wide color-gray">Item</p>
                          <input
                            type="text"
                            className="input w-full rounded-xl bg-translucid p-3 text-sm"
                            value={item.name}
                            onChange={(e) => {
                              const updated = [...selectedSale.items_list];
                              updated[i] = { ...updated[i], name: e.target.value };
                              setSelectedSale({ ...selectedSale, items_list: updated });
                            }}
                            placeholder="Nome do item"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = [...(selectedSale.items_list || [])];
                            updated.splice(i, 1);
                            setSelectedSale({ ...selectedSale, items_list: updated });
                          }}
                          className="rounded-xl bg-red-600 p-3 text-white transition hover:opacity-90 cursor-pointer mt-5"
                        >
                          <FaTrash />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                        <div>
                          <label className="mb-1 block text-sm color-gray">Quantidade</label>
                          <input
                            type="number"
                            min="1"
                            className="input w-full rounded-xl bg-translucid p-3 text-sm"
                            value={item.qty}
                            onChange={(e) => {
                              const updated = [...selectedSale.items_list];
                              updated[i] = { ...updated[i], qty: Number(e.target.value) || 0 };
                              setSelectedSale({ ...selectedSale, items_list: updated });
                            }}
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-sm color-gray">Preço unidade</label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            className="input w-full rounded-xl bg-translucid p-3 text-sm"
                            value={item.price}
                            onChange={(e) => {
                              const value = e.target.value;
                              const updated = [...selectedSale.items_list];
                              updated[i] = { ...updated[i], price: value === "" ? null : Number(value) };
                              setSelectedSale({ ...selectedSale, items_list: updated });
                            }}
                          />
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                          <label className="mb-1 block text-sm color-gray">Subtotal</label>
                          <div className="rounded-xl border border-translucid px-3 py-3 text-sm font-medium">
                            R$ {((Number(item.qty) || 0) * (Number(item.price) || 0)).toFixed(2)}
                          </div>
                        </div>
                      </div>

                      <div className="mt-3">
                        <label className="mb-1 block text-sm color-gray">Observações</label>
                        <textarea
                          className="input w-full rounded-xl bg-translucid p-3 text-sm"
                          value={item.note || ""}
                          onChange={(e) => {
                            const updated = [...selectedSale.items_list];
                            updated[i] = { ...updated[i], note: e.target.value };
                            setSelectedSale({ ...selectedSale, items_list: updated });
                          }}
                          placeholder="Observações do item"
                        />
                      </div>

                      <div className="mt-4 rounded-xl border border-translucid p-3">
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <span className="text-sm font-medium">Adicionais</span>
                          <button
                            type="button"
                            onClick={() => {
                              const updated = [...(selectedSale.items_list || [])];
                              const additionals = updated[i].additionals ? [...updated[i].additionals] : [];
                              additionals.push({ name: "", price: 0 });
                              updated[i] = { ...updated[i], additionals };
                              setSelectedSale({ ...selectedSale, items_list: updated });
                            }}
                            className="cursor-pointer rounded-xl bg-blue-600 px-3 py-2 text-sm text-white transition hover:bg-blue-700"
                          >
                            + Adicional
                          </button>
                        </div>

                        {(item.additionals || []).length === 0 ? (
                          <p className="text-sm color-gray">Nenhum adicional adicionado.</p>
                        ) : (
                          <div className="space-y-2">
                            {(item.additionals || []).map((add, ai) => (
                              <div key={ai} className="grid grid-cols-[1fr_110px_48px] gap-2">
                                <input
                                  type="text"
                                  className="input rounded-xl bg-translucid p-3 text-sm"
                                  value={add.name}
                                  onChange={(e) => {
                                    const updated = [...selectedSale.items_list];
                                    const ad = updated[i].additionals ? [...updated[i].additionals] : [];
                                    ad[ai] = { ...ad[ai], name: e.target.value };
                                    updated[i] = { ...updated[i], additionals: ad };
                                    setSelectedSale({ ...selectedSale, items_list: updated });
                                  }}
                                  placeholder="Nome do adicional"
                                />
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  className="input rounded-xl bg-translucid p-3 text-sm"
                                  value={add.price ?? ""}
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    const updated = [...selectedSale.items_list];
                                    const ad = updated[i].additionals ? [...updated[i].additionals] : [];
                                    ad[ai] = { ...ad[ai], price: value === "" ? null : Number(value) };
                                    updated[i] = { ...updated[i], additionals: ad };
                                    setSelectedSale({ ...selectedSale, items_list: updated });
                                  }}
                                  placeholder="Preço"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = [...selectedSale.items_list];
                                    const ad = updated[i].additionals ? [...updated[i].additionals] : [];
                                    ad.splice(ai, 1);
                                    updated[i] = { ...updated[i], additionals: ad };
                                    setSelectedSale({ ...selectedSale, items_list: updated });
                                  }}
                                  className="cursor-pointer rounded-xl bg-red-600 p-2 flex justify-center items-center text-white hover:opacity-90 transition"
                                >
                                  <FaTrash />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setSelectedSale({
                      ...selectedSale,
                      items_list: [
                        ...(selectedSale.items_list || []),
                        { name: "", qty: 1, price: 0, note: "", additionals: [] },
                      ],
                    })
                  }
                  className="mt-4 cursor-pointer rounded-xl bg-blue-600 px-4 py-3 text-white transition hover:bg-blue-700"
                >
                  + Adicionar item
                </button>
              </SectionCard>

              <div className="sticky bottom-0 rounded-2xl border border-translucid bg-low-gray/95 p-4 backdrop-blur-xl">
                <div className="mb-3 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-wide color-gray">Total da venda</p>
                    <p className="text-2xl font-bold">R$ {modalTotal.toFixed(2)}</p>
                  </div>
                  {modalFee > 0 && (
                    <p className="text-sm color-gray">Taxa de entrega: R$ {modalFee.toFixed(2)}</p>
                  )}
                </div>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <button
                    type="submit"
                    className="w-full cursor-pointer rounded-xl bg-blue-600 py-3 text-white transition hover:bg-blue-700"
                  >
                    Salvar alterações
                  </button>
                  <button
                    type="button"
                    onClick={() => setSaleModalOpen(false)}
                    className="w-full cursor-pointer rounded-xl bg-[var(--translucid)] border border-translucid py-3 transition hover:opacity-80 sm:w-40"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </form>
          </div>
        </GenericModal>
      )}
    </div>
  );
};

export default Sales;
