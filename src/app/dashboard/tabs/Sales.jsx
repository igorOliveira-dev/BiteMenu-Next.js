"use client";

import { useEffect, useState } from "react";
import useMenu from "@/hooks/useMenu";
import { useAlert } from "@/providers/AlertProvider";
import { supabase } from "@/lib/supabaseClient";
import Loading from "@/components/Loading";
import { FaTrash, FaChevronLeft, FaChevronDown, FaChevronRight, FaChevronUp, FaSyncAlt } from "react-icons/fa";
import GenericModal from "@/components/GenericModal";
import { useConfirm } from "@/providers/ConfirmProvider";
import SalesSummary from "./components/SalesSummary";

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
      .select("total, delivery_fee, items_list")
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
        .select("created_at, items_list, total, delivery_fee")
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

  if (loading) return <Loading />;
  if (!menu) return <p>Você ainda não criou seu cardápio.</p>;

  return (
    <div className="px-4 sm:px-2 lg:grid">
      <div className="md:m-auto lg:m-2 lg:w-[calc(80dvw-256px)] max-w-[1024px] min-h-[calc(100dvh-110px)] rounded-lg overflow-y-auto">
        <div className="flex items-center gap-4 mb-2">
          <h2 className="default-h2 font-semibold">Vendas</h2>
          <FaSyncAlt
            className="cursor-pointer opacity-80 hover:opacity-100 transition"
            onClick={() => {
              (resetSales(), setRefreshSummary((prev) => prev + 1));
            }}
          />
        </div>

        <h3 className="mb-2">Dashboard de vendas</h3>
        <SalesSummary setSelectedTab={setSelectedTab} refreshSignal={refreshSummary} />

        <h3 className="mb-2">Histórico de vendas</h3>
        <div className="space-y-2">
          {!monthsList || monthsList.length === 0 ? <p className="color-gray">Nenhuma venda encontrada.</p> : null}
          {monthsList.map((group) => {
            const key = group.key;
            const isOpen = expandedMonths[key] ?? false;
            const monthSales = monthData[key] || [];
            const monthTotal = monthSales.reduce((sum, s) => sum + computeSaleTotal(s), 0);

            return (
              <section key={key} className="border-2 border-translucid rounded-lg overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleMonth(key, group.monthStart)}
                  className="cursor-pointer w-full flex justify-between items-center p-3 bg-translucid hover:opacity-95"
                >
                  <div>
                    <h3 className="xs:font-semibold text-lg capitalize">{key}</h3>
                    <p className="text-sm color-gray text-start flex gap-2 items-center">{group.count} venda(s)</p>
                  </div>
                  <div className="text-right flex items-center gap-1 xs:gap-4">
                    <p className="font-semibold">R$ {Number(group.total || 0).toFixed(2)}</p>
                    {isOpen ? <FaChevronDown /> : <FaChevronRight />}
                  </div>
                </button>

                {isOpen && (
                  <div className="p-4 space-y-4">
                    {/* Barra de pesquisa */}
                    <input
                      type="text"
                      placeholder="Pesquisar por nome, telefone, itens..."
                      className="input w-full bg-translucid border-2 border-translucid p-2 rounded mb-3"
                      value={filters[key]?.query || ""}
                      onChange={(e) =>
                        setFilters((prev) => ({
                          ...prev,
                          [key]: { ...prev[key], query: e.target.value },
                        }))
                      }
                    />

                    {/* Ordenação */}
                    <div className="flex gap-2 mb-2">
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
                            className={`cursor-pointer flex items-center gap-2 text-sm px-3 py-1.5 rounded transition-all border border-2 border-translucid
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
                      <p className="text-center color-gray">Nenhuma venda neste mês.</p>
                    ) : (
                      getFilteredSales(key).map((sale) => (
                        <div
                          key={sale.id}
                          className="p-4 rounded-lg shadow-sm bg-translucid border-2 border-translucid flex flex-col xs:flex-row justify-between"
                        >
                          <div>
                            <h3 className="font-bold text-lg line-clamp-1">{sale.costumer_name || "Cliente"}</h3>
                            <span className="text-sm color-gray xs:hidden">
                              {new Date(sale.created_at).toLocaleString("pt-BR")}
                            </span>
                            <p className="text-sm color-gray">
                              <span className="line-clamp-1">
                                <strong>Método:</strong>{" "}
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
                              <span className="line-clamp-1">
                                <strong>Serviço:</strong>{" "}
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
                              <span className="text-sm color-gray">
                                <strong>Telefone:</strong> {sale.costumer_phone}
                              </span>
                            </p>

                            {sale.items_list && (
                              <ul className="mt-2 text-sm">
                                {sale.items_list?.slice(0, 4).map((item, i) => (
                                  <li key={i} className="line-clamp-1">
                                    • {item.qty}x {item.name} — R$ {(item.price * item.qty).toFixed(2)}
                                  </li>
                                ))}
                                {sale.items_list?.length > 4 && <li className="text-gray-400">...</li>}
                              </ul>
                            )}

                            <p className="mt-2 font-semibold text-lg">Total: R$ {computeSaleTotal(sale).toFixed(2)}</p>
                          </div>

                          <div className="mt-2 flex flex-col justify-between items-start xs:items-end">
                            <span className="text-sm color-gray hidden xs:block">
                              {new Date(sale.created_at).toLocaleString("pt-BR")}
                            </span>
                            <div className="grid grid-rows-2 w-full xs:flex xs:flex-col gap-2">
                              <div className="grid grid-cols-2 xs:flex xs:flex-col gap-2">
                                <button
                                  onClick={() => openSaleModal(sale)}
                                  className="w-full cursor-pointer px-3 py-2 rounded-lg flex items-center justify-center gap-2 text-sm font-medium bg-translucid border-2 border-translucid hover:opacity-80 opacity-100 transition"
                                >
                                  Detalhes
                                </button>
                                <button
                                  onClick={() => deleteSale(sale.id, key)}
                                  className="w-full cursor-pointer px-3 py-2 rounded-lg flex items-center justify-center gap-2 text-xs xxs:text-sm font-medium bg-red-600 text-white hover:bg-red-700"
                                >
                                  <FaTrash /> Excluir
                                </button>
                              </div>
                            </div>
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
                          className="w-full cursor-pointer px-3 py-2 rounded-lg bg-translucid border-2 border-translucid hover:opacity-80 transition"
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
        <GenericModal title="Detalhes da venda" onClose={() => setSaleModalOpen(false)}>
          <div className="max-h-[90vh] sm:max-h-[80vh] w-[min(900px,90vw)] overflow-y-auto scrollbar-none space-y-4">
            <form
              className="space-y-3"
              onSubmit={async (e) => {
                e.preventDefault();
                const subtotal = computeItemsSubtotal(selectedSale);
                const fee = Number(selectedSale.delivery_fee) || 0;
                const total = subtotal + fee;

                const payload = { ...selectedSale, total, updated_at: new Date().toISOString() };

                const { error } = await supabase.from("sales").update(payload).eq("id", selectedSale.id);
                if (error) return customAlert("Erro ao atualizar venda", "error");

                // Atualiza localmente o item no estado monthData
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
              {/* ... o resto do formulário permanece exatamente como antes ... */}
              <div className="flex flex-col gap-3">
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-semibold mb-1">Nome do Cliente</label>
                    <input
                      type="text"
                      className="input w-full bg-translucid p-2 rounded"
                      value={selectedSale.costumer_name || ""}
                      onChange={(e) => setSelectedSale({ ...selectedSale, costumer_name: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-1">Telefone</label>
                    <input
                      type="text"
                      className="input w-full bg-translucid p-2 rounded"
                      value={selectedSale.costumer_phone || ""}
                      onChange={(e) => setSelectedSale({ ...selectedSale, costumer_phone: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2 xs:grid-cols-2">
                  <div>
                    <label className="block text-sm font-semibold mb-1">Serviço</label>
                    <select
                      className="input w-full bg-translucid p-2 rounded"
                      value={selectedSale.service || ""}
                      onChange={(e) => setSelectedSale({ ...selectedSale, service: e.target.value })}
                    >
                      <option className="text-black" value="delivery">
                        Entrega
                      </option>
                      <option className="text-black" value="pickup">
                        Retirada
                      </option>
                      <option className="text-black" value="dinein">
                        No local
                      </option>
                      <option className="text-black" value="faceToFace">
                        Atendimento presencial
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-1">Método de Pagamento</label>
                    <select
                      className="input w-full bg-translucid p-2 rounded"
                      value={selectedSale.payment_method || ""}
                      onChange={(e) => setSelectedSale({ ...selectedSale, payment_method: e.target.value })}
                    >
                      <option className="text-black" value="pix">
                        Pix
                      </option>
                      <option className="text-black" value="debit">
                        Débito
                      </option>
                      <option className="text-black" value="credit">
                        Crédito
                      </option>
                      <option className="text-black" value="cash">
                        Dinheiro
                      </option>
                    </select>
                  </div>
                </div>
                <hr className="border-translucid" />
              </div>

              {/* Itens (mantidos) */}
              <div className="mt-8">
                <label className="block text-lg font-semibold mb-2">Itens</label>

                {(selectedSale.items_list || []).map((item, i) => (
                  <div key={i} className="p-3 border border-2 border-translucid rounded-lg space-y-2">
                    <div className="flex gap-2">
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="w-[50px] h-[50px] xs:w-[130px] xs:h-[130px] mt-3 xs:m-0 object-cover rounded-lg"
                          style={{ flexShrink: 0 }}
                        />
                      ) : null}
                      <div className="w-full">
                        <label className="text-sm color-gray">Nome:</label>
                        <div className="flex items-center gap-3 mb-2">
                          <input
                            type="text"
                            className="input w-full text-sm bg-translucid p-2 rounded"
                            value={item.name}
                            onChange={(e) => {
                              const updated = [...selectedSale.items_list];
                              updated[i] = { ...updated[i], name: e.target.value };
                              setSelectedSale({ ...selectedSale, items_list: updated });
                            }}
                            placeholder="Nome do item"
                          />

                          <button
                            type="button"
                            onClick={() => {
                              const updated = [...(selectedSale.items_list || [])];
                              updated.splice(i, 1);
                              setSelectedSale({ ...selectedSale, items_list: updated });
                            }}
                            className="p-2 text-sm bg-red-600 text-white rounded hover:opacity-90"
                          >
                            <FaTrash />
                          </button>
                        </div>

                        <div className="flex gap-6">
                          <div className="flex flex-col">
                            <label className="text-sm color-gray">Quantidade:</label>
                            <input
                              type="number"
                              min="1"
                              className="input w-21 text-sm bg-translucid p-2 rounded"
                              value={item.qty}
                              onChange={(e) => {
                                const updated = [...selectedSale.items_list];
                                updated[i] = { ...updated[i], qty: Number(e.target.value) || 0 };
                                setSelectedSale({ ...selectedSale, items_list: updated });
                              }}
                              placeholder="Qtd"
                            />
                          </div>

                          <div className="flex flex-col">
                            <label className="text-sm color-gray">Preço unidade:</label>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              className="input max-w-21 flex-1 text-sm bg-translucid p-2 rounded"
                              value={item.price}
                              onChange={(e) => {
                                const value = e.target.value;
                                const updated = [...selectedSale.items_list];
                                updated[i] = { ...updated[i], price: value === "" ? null : Number(value) };
                                setSelectedSale({ ...selectedSale, items_list: updated });
                              }}
                              placeholder="Preço unitário"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm color-gray">Observações:</label>
                      <textarea
                        className="input w-full text-sm p-2 bg-translucid rounded"
                        value={item.note || ""}
                        onChange={(e) => {
                          const updated = [...selectedSale.items_list];
                          updated[i] = { ...updated[i], note: e.target.value };
                          setSelectedSale({ ...selectedSale, items_list: updated });
                        }}
                        placeholder="Observações do item"
                      />
                    </div>

                    {/* Adicionais */}
                    <div className="mt-2 pt-2">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-semibold color-gray">Adicionais:</span>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = [...(selectedSale.items_list || [])];
                            const additionals = updated[i].additionals ? [...updated[i].additionals] : [];
                            additionals.push({ name: "", price: 0 });
                            updated[i] = { ...updated[i], additionals };
                            setSelectedSale({ ...selectedSale, items_list: updated });
                          }}
                          className="cursor-pointer px-2 py-1 text-sm bg-blue-600 hover:bg-blue-700 rounded"
                        >
                          + Adicional
                        </button>
                      </div>
                      {(item.additionals || []).map((add, ai) => (
                        <div key={ai} className="flex gap-2 items-center mb-2">
                          <input
                            type="text"
                            className="input w-40 xs:w-60 text-sm bg-translucid p-2 rounded"
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
                            className="input w-12 xs:w-28 text-sm bg-translucid p-2 rounded"
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
                            className="cursor-pointer p-2 bg-red-600 text-white rounded text-sm"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      ))}
                    </div>
                    <hr className="border-translucid" />
                  </div>
                ))}

                <div>
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
                    className="cursor-pointer px-2 py-1 mt-4 bg-blue-600 hover:bg-blue-700 transition text-white rounded"
                  >
                    + Adicionar item
                  </button>
                </div>
              </div>

              {/* total */}
              <div className="sticky bottom-0 bg-low-gray">
                <div className="flex justify-between sm:items-center flex-col sm:flex-row pt-4">
                  <p className="text-sm color-gray">Subtotal: R$ {modalSubtotal.toFixed(2)}</p>
                  {modalFee > 0 && <p className="text-sm color-gray">Taxa de entrega: R$ {modalFee.toFixed(2)}</p>}
                  <p className="font-semibold">Total: R$ {modalTotal.toFixed(2)}</p>
                </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="cursor-pointer flex-1 w-full bg-blue-600 text-white py-2 rounded-lg mt-3 hover:bg-blue-700 transition"
                  >
                    Salvar alterações
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSaleModalOpen(false);
                    }}
                    className="w-32 py-2 rounded-lg mt-3 border-2 bg-translucid border-translucid hover:opacity-80 transition cursor-pointer"
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
