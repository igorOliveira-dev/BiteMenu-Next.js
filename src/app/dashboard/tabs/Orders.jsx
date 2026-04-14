"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import useMenu from "@/hooks/useMenu";
import { useAlert } from "@/providers/AlertProvider";
import { supabase } from "@/lib/supabaseClient";
import Loading from "@/components/Loading";
import {
  FaCheck,
  FaTrash,
  FaMoneyBill,
  FaChevronDown,
  FaSyncAlt,
  FaPhoneAlt,
  FaMapMarkerAlt,
  FaClipboardList,
} from "react-icons/fa";
import GenericModal from "@/components/GenericModal";
import { useConfirm } from "@/providers/ConfirmProvider";
import OrdersFilter from "./components/orders/OrdersFilter";
import useModalBackHandler from "@/hooks/useModalBackHandler";

const PAGE_SIZE = 10;

const paymentLabels = {
  pix: "Pix",
  debit: "Débito",
  credit: "Crédito",
  cash: "Dinheiro",
};

const serviceLabels = {
  delivery: "Entrega",
  pickup: "Retirada",
  dinein: "No local",
  faceToFace: "Atendimento presencial",
};

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

const Orders = ({ setSelectedTab }) => {
  const { menu, loading } = useMenu();
  const customAlert = useAlert();
  const confirm = useConfirm();

  const [showConfig, setShowConfig] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [filters, setFilters] = useState({});
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [receiveOrders, setReceiveOrders] = useState(menu?.orders || "all");
  const [deliveryFeeOnSales, setDeliveryFeeOnSales] = useState(false);
  const [enabledOrders, setEnabledOrders] = useState(false);

  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summary, setSummary] = useState({
    count: 0,
    paidCount: 0,
    pendingCount: 0,
    paidTotal: 0,
    pendingTotal: 0,
    avgTicket: 0,
    lastUpdatedAt: null,
  });

  const hasMoreRef = useRef(true);
  const pageRef = useRef(0);
  const loadingRef = useRef(false);

  const filtersKey = useMemo(() => JSON.stringify(filters), [filters]);

  useEffect(() => {
    if (!menu?.id) return;
    resetAndFetch();
  }, [menu?.id]);

  useEffect(() => {
    if (!menu?.id) return;
    resetAndFetch();
  }, [menu?.id, filtersKey]);

  useEffect(() => {
    hasMoreRef.current = hasMore;
  }, [hasMore]);

  useEffect(() => {
    pageRef.current = page;
  }, [page]);

  useEffect(() => {
    if (menu?.orders) {
      setReceiveOrders(menu.orders);
      setEnabledOrders(menu.orders === "site_whatsapp" || menu.orders === "site");
    }
  }, [menu?.orders]);

  useEffect(() => {
    if (menu?.delivery_fee_on_sales !== undefined) {
      setDeliveryFeeOnSales(menu.delivery_fee_on_sales);
    }
  }, [menu?.delivery_fee_on_sales]);

  useEffect(() => {
    if (!menu?.id || !enabledOrders) return;
    fetchSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [menu?.id, filtersKey, enabledOrders]);

  const resetAndFetch = async () => {
    setOrders([]);
    setPage(0);
    setHasMore(true);
    loadingRef.current = false;
    setLoadingOrders(true);
    await fetchMore(true);
    await fetchSummary();
  };

  const buildOrdersQuery = (filters) => {
    let q = supabase.from("orders").select("*", { count: "exact" }).eq("menu_id", menu.id);

    if (filters.isPaid === true) q = q.eq("is_paid", true);
    if (filters.isPaid === false) q = q.eq("is_paid", false);

    if (filters.deliveryType && filters.deliveryType !== "all") {
      q = q.eq("service", filters.deliveryType);
    }

    if (filters.payment && filters.payment !== "all") {
      q = q.eq("payment_method", filters.payment);
    }

    if (filters.dateFrom) q = q.gte("created_at", new Date(filters.dateFrom).toISOString());
    if (filters.dateTo) q = q.lte("created_at", new Date(filters.dateTo).toISOString());

    if (filters.search && filters.search.trim() !== "") {
      const term = filters.search.trim();
      const ors = [`costumer_name.ilike.%${term}%`, `costumer_phone.ilike.%${term}%`];
      q = q.or(ors.join(","));
    }

    return q.order("updated_at", { ascending: false });
  };

  const buildSummaryQuery = (filters) => {
    let q = supabase
      .from("orders")
      .select(
        "id,is_paid,service,items_list,updated_at,delivery_fee,payment_method,created_at,costumer_name,costumer_phone",
        {
          count: "exact",
        },
      )
      .eq("menu_id", menu.id)
      .order("updated_at", { ascending: false });

    if (filters.isPaid === true) q = q.eq("is_paid", true);
    if (filters.isPaid === false) q = q.eq("is_paid", false);

    if (filters.deliveryType && filters.deliveryType !== "all") {
      q = q.eq("service", filters.deliveryType);
    }

    if (filters.payment && filters.payment !== "all") {
      q = q.eq("payment_method", filters.payment);
    }

    if (filters.dateFrom) q = q.gte("created_at", new Date(filters.dateFrom).toISOString());
    if (filters.dateTo) q = q.lte("created_at", new Date(filters.dateTo).toISOString());

    if (filters.search && filters.search.trim() !== "") {
      const term = filters.search.trim();
      const ors = [`costumer_name.ilike.%${term}%`, `costumer_phone.ilike.%${term}%`];
      q = q.or(ors.join(","));
    }

    return q;
  };

  const fetchMore = async (isReset = false) => {
    if (!menu?.id) return;
    if (!hasMoreRef.current && !isReset) return;
    if (loadingRef.current) return;

    loadingRef.current = true;

    const nextPage = isReset ? 1 : pageRef.current + 1;
    const from = (nextPage - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const { data, error, count } = await buildOrdersQuery(filters).range(from, to);

    if (error) {
      loadingRef.current = false;
      setLoadingOrders(false);
      return;
    }

    setTotalCount(count || 0);

    const withTotal = (data || []).map((order) => ({
      ...order,
      delivery_fee: Number(order?.delivery_fee) || 0,
    }));

    setOrders((prev) => {
      const seen = new Set(prev.map((o) => o.id));
      return [...prev, ...withTotal.filter((o) => !seen.has(o.id))];
    });

    setPage(nextPage);
    setHasMore((withTotal?.length || 0) === PAGE_SIZE);
    loadingRef.current = false;
    setLoadingOrders(false);
  };

  const fetchSummary = async () => {
    if (!menu?.id) return;
    setSummaryLoading(true);

    const PAGE = 1000;
    let all = [];
    let from = 0;

    try {
      while (true) {
        const to = from + PAGE - 1;
        const { data, error, count } = await buildSummaryQuery(filters).range(from, to);

        if (error) throw error;
        if (typeof count === "number") setTotalCount(count);

        const chunk = data || [];
        all = all.concat(chunk);

        if (chunk.length < PAGE) break;
        from += PAGE;
      }

      let paidTotal = 0;
      let pendingTotal = 0;
      let paidCount = 0;
      let pendingCount = 0;

      for (const o of all) {
        const total = computeTotalWithDelivery(o);
        if (o.is_paid) {
          paidTotal += total;
          paidCount += 1;
        } else {
          pendingTotal += total;
          pendingCount += 1;
        }
      }

      const count = all.length;
      const avgTicket = count > 0 ? (paidTotal + pendingTotal) / count : 0;
      const lastUpdatedAt = all[0]?.updated_at || null;

      setSummary({
        count,
        paidCount,
        pendingCount,
        paidTotal,
        pendingTotal,
        avgTicket,
        lastUpdatedAt,
      });
    } catch (error) {
      console.error(error);
    } finally {
      setSummaryLoading(false);
    }
  };

  const handleChangeOrders = async (value) => {
    setReceiveOrders(value);
    setEnabledOrders(value === "site" || value === "site_whatsapp");

    const { error } = await supabase.from("menus").update({ orders: value }).eq("id", menu.id);

    if (error) customAlert("Erro ao atualizar configuração de pedidos.", "error");
    else customAlert("Preferência de pedidos atualizada!", "success");
  };

  const togglePaid = async (id, current) => {
    const { error } = await supabase.from("orders").update({ is_paid: !current }).eq("id", id);
    if (error) return customAlert("Erro ao atualizar pagamento", "error");

    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, is_paid: !current } : o)));
    fetchSummary();
  };

  const handleToggleDeliveryFeeOnSales = async (value) => {
    setDeliveryFeeOnSales(value);

    const { error } = await supabase.from("menus").update({ delivery_fee_on_sales: value }).eq("id", menu.id);

    if (error) {
      customAlert("Erro ao atualizar configuração da taxa de entrega.", "error");
      setDeliveryFeeOnSales(!value);
    } else {
      customAlert("Configuração de taxa de entrega atualizada!", "success");
    }
  };

  const finalizeOrder = async (id) => {
    const ok = await confirm("Quer mesmo finalizar esse pedido?");
    if (!ok) return;

    const { data: order, error: fetchError } = await supabase.from("orders").select("*").eq("id", id).single();
    if (fetchError || !order) {
      return customAlert("Erro ao localizar pedido", "error");
    }

    const deliveryFee = deliveryFeeOnSales && order.service === "delivery" ? Number(order.delivery_fee) || 0 : 0;
    const subtotal = computeSubtotal(order);
    const saleTotal = subtotal + deliveryFee;

    const { error: insertError } = await supabase.from("sales").insert([
      {
        menu_id: order.menu_id,
        costumer_name: order.costumer_name,
        costumer_phone: order.costumer_phone,
        payment_method: order.payment_method,
        service: order.service,
        items_list: order.items_list,
        created_at: order.created_at,
        updated_at: new Date().toISOString(),
        total: saleTotal,
        delivery_fee: deliveryFee,
      },
    ]);

    if (insertError) {
      console.error(insertError);
      return customAlert("Erro ao registrar venda", "error");
    }

    const { error: deleteError } = await supabase.from("orders").delete().eq("id", id);
    if (deleteError) {
      return customAlert("Erro ao excluir pedido", "error");
    }

    customAlert("Pedido finalizado e registrado como venda!", "success");
    resetAndFetch();
  };

  const deleteOrder = async (id) => {
    const ok = await confirm("Quer mesmo excluir esse pedido?");
    if (!ok) return;

    const { error } = await supabase.from("orders").delete().eq("id", id);
    if (error) return customAlert("Erro ao excluir pedido", "error");

    resetAndFetch();
  };

  const deleteItem = async (i) => {
    const ok = await confirm("Quer mesmo deletar esse item?");
    if (!ok) return;

    const updated = [...(selectedOrder.items_list || [])];
    updated.splice(i, 1);
    setSelectedOrder({ ...selectedOrder, items_list: updated });
  };

  const openOrderModal = (order) => {
    setSelectedOrder(order);
    setOrderModalOpen(true);
  };

  const computeSubtotal = (order) => {
    if (!order) return 0;

    return (order.items_list || []).reduce((acc, it) => {
      const qty = Number(it.qty) || 0;
      const unit = Number(it.price) || 0;
      const base = unit * qty;
      const addsUnit = (it.additionals || []).reduce((sa, a) => sa + (Number(a.price) || 0), 0);
      const adds = addsUnit * qty;
      return acc + base + adds;
    }, 0);
  };

  const computeDeliveryFee = (order) => {
    if (!order) return 0;
    if (order.service !== "delivery") return 0;
    return Number(order?.delivery_fee) || 0;
  };

  const computeTotalWithDelivery = (order) => {
    const subtotal = computeSubtotal(order);
    const delivery = computeDeliveryFee(order);
    return subtotal + delivery;
  };

  const getPrimaryItemText = (order) => {
    const items = order?.items_list || [];
    if (items.length === 0) return "Sem itens";

    const firstThree = items.slice(0, 3);

    const text = firstThree.map((item) => `${item.qty}x ${item.name}`).join(" • ");

    const remaining = items.length - 3;

    return remaining > 0 ? `${text} + ${remaining} item(ns)` : text;
  };

  const paidPct = summary.count > 0 ? Math.round((summary.paidCount / summary.count) * 100) : 0;

  useModalBackHandler(orderModalOpen, () => setOrderModalOpen(false));

  if (loading || loadingOrders) return <Loading />;
  if (!menu) return <p>Você ainda não criou seu cardápio.</p>;

  return (
    <div className="px-4 sm:px-2 lg:grid">
      <div className="md:m-auto lg:m-2 lg:w-[calc(70dvw-256px)] max-w-[812px] min-h-[calc(100dvh-110px)] overflow-y-auto rounded-2xl">
        <div className="mb-4 flex items-center gap-3">
          <h2 className="text-xl font-semibold">Pedidos recebidos</h2>
          <button
            type="button"
            className="cursor-pointer rounded-full p-2 opacity-80 transition hover:opacity-100"
            onClick={() => resetAndFetch()}
            title="Atualizar pedidos"
          >
            <FaSyncAlt />
          </button>
        </div>

        <button
          onClick={() => setShowConfig(!showConfig)}
          className="mb-2 flex cursor-pointer items-center gap-2 color-gray"
        >
          Configurar pedidos
          <span className={`transition-transform ${showConfig ? "rotate-180" : ""}`}>
            <FaChevronDown />
          </span>
        </button>

        <div
          className={`${showConfig ? "h-auto border p-3 sm:p-4" : "h-0"} max-w-[calc(100%-6px)] overflow-hidden rounded-2xl border-translucid bg-translucid transition-all duration-500`}
        >
          <p className="mb-3 text-sm font-medium">Receber pedidos</p>

          <label className="mb-2 flex cursor-pointer items-center gap-3">
            <span className="switch">
              <input
                type="radio"
                name="orders"
                value="site_whatsapp"
                checked={receiveOrders === "site_whatsapp"}
                onChange={() => handleChangeOrders("site_whatsapp")}
              />
              <span className="slider" />
            </span>
            <span>No site e no WhatsApp</span>
          </label>

          <label className="mb-2 flex cursor-pointer items-center gap-3">
            <span className="switch">
              <input
                type="radio"
                name="orders"
                value="whatsapp"
                checked={receiveOrders === "whatsapp"}
                onChange={() => handleChangeOrders("whatsapp")}
              />
              <span className="slider" />
            </span>
            <span>Apenas no WhatsApp</span>
          </label>

          <label className="mb-2 flex cursor-pointer items-center gap-3">
            <span className="switch">
              <input
                type="radio"
                name="orders"
                value="none"
                checked={receiveOrders === "none"}
                onChange={() => handleChangeOrders("none")}
              />
              <span className="slider" />
            </span>
            <span>Não receber pedidos</span>
          </label>

          <hr className="my-3 border-translucid" />

          <p className="mb-2 text-sm font-medium">Taxa de entrega</p>

          <label className="flex items-center gap-2">
            <span className="switch">
              <input
                type="checkbox"
                checked={deliveryFeeOnSales}
                onChange={(e) => handleToggleDeliveryFeeOnSales(e.target.checked)}
              />
              <span className="slider"></span>
            </span>
            <span>Contar taxa de entrega como venda</span>
          </label>

          <p className="mt-2 text-xs color-gray">
            Se ativado, a taxa de entrega será somada ao total das vendas registradas.
          </p>
        </div>

        {!enabledOrders ? (
          <p className="p-6 text-center color-gray">Os pedidos no site estão desabilitados.</p>
        ) : (
          <div>
            <OrdersFilter onChange={setFilters} />

            {orders.length === 0 ? (
              <p className="p-6 text-center color-gray">Nenhum pedido encontrado com esses filtros.</p>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => {
                  const total = computeTotalWithDelivery(order);
                  const subtotal = computeSubtotal(order);
                  const deliveryFee = computeDeliveryFee(order);
                  const orderDate = new Date(order.updated_at).toLocaleString("pt-BR");

                  return (
                    <div
                      key={order.id}
                      className="rounded-2xl border border-translucid bg-translucid p-4 shadow-sm transition hover:shadow-md"
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="mb-3 flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="mb-1 flex items-center gap-2">
                                <h3 className="truncate text-lg font-semibold">{order.costumer_name || "Cliente"}</h3>
                                <span
                                  className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                                    order.is_paid ? "bg-green-600/40" : "bg-yellow-500/40"
                                  }`}
                                >
                                  {order.is_paid ? "Pago" : "Pendente"}
                                </span>
                              </div>
                              <p className="text-sm color-gray">{orderDate}</p>
                            </div>

                            <div className="text-right">
                              <p className="text-xs uppercase tracking-wide color-gray">Total</p>
                              <p className="text-2xl font-bold">R$ {total.toFixed(2)}</p>
                            </div>
                          </div>

                          <div className="mb-3 flex flex-wrap gap-2 text-sm">
                            <span className="rounded-full border border-translucid px-3 py-1 color-gray bg-[var(--translucid)]">
                              {serviceLabels[order.service] || "Não informado"}
                            </span>
                            <span className="rounded-full border border-translucid px-3 py-1 color-gray bg-[var(--translucid)]">
                              {paymentLabels[order.payment_method] || "Não informado"}
                            </span>
                          </div>

                          <div className="mt-12 rounded-xl">
                            <p className="mb-1 text-xs uppercase tracking-wide font-bold">Resumo do pedido</p>
                            <p className="font-medium line-clamp-1">{getPrimaryItemText(order)}</p>
                            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm color-gray">
                              <span>
                                {order.items_list?.length || 0} {order.items_list?.length === 1 ? "item" : "itens"}
                              </span>
                              {order.service === "delivery" ? (
                                <>
                                  <span>Subtotal: R$ {subtotal.toFixed(2)}</span>
                                  <span>Entrega: R$ {deliveryFee.toFixed(2)}</span>
                                </>
                              ) : null}
                            </div>
                          </div>
                        </div>

                        <div className="flex w-full flex-col gap-2 sm:w-[220px]">
                          <button
                            onClick={() => openOrderModal(order)}
                            className="w-full cursor-pointer rounded-xl border bg-[var(--translucid)] border-translucid px-4 py-3 text-sm font-medium transition hover:opacity-80"
                          >
                            Ver detalhes
                          </button>

                          <button
                            onClick={() => finalizeOrder(order.id)}
                            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-blue-700"
                          >
                            <FaCheck /> Finalizar pedido
                          </button>

                          <div className="grid grid-cols-4 gap-2">
                            <button
                              onClick={() => togglePaid(order.id, order.is_paid)}
                              className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition col-span-3 ${
                                order.is_paid
                                  ? "border border-translucid bg-translucid hover:opacity-80"
                                  : "bg-yellow-500 text-black hover:bg-yellow-600"
                              }`}
                            >
                              <FaMoneyBill />
                              {order.is_paid ? "Desfazer" : "Pagar"}
                            </button>

                            <button
                              onClick={() => deleteOrder(order.id)}
                              className="flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-red-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-red-700"
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                <div className="flex justify-center py-4">
                  {hasMore ? (
                    <button
                      onClick={() => fetchMore()}
                      disabled={loadingOrders}
                      className="cursor-pointer rounded-xl border border-translucid bg-translucid px-4 py-2 transition hover:opacity-80"
                    >
                      {loadingOrders ? "Carregando..." : "Carregar mais"}
                    </button>
                  ) : null}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {enabledOrders ? (
        <aside className="fixed right-0 hidden h-[calc(100dvh-110px)] w-[calc(30dvw-36px)] flex-col justify-between rounded-2xl border border-translucid bg-translucid p-2 shadow-[0_0_10px_var(--shadow)] lg:m-2 lg:flex">
          <div className="p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h3 className="leading-tight font-bold">Resumo</h3>
                <p className="text-xs color-gray">FILTROS ATUAIS</p>
              </div>

              <button
                type="button"
                className="cursor-pointer rounded-full p-2 opacity-80 transition hover:opacity-100"
                onClick={() => fetchSummary()}
                title="Atualizar resumo"
              >
                <FaSyncAlt className={`${summaryLoading ? "animate-spin" : ""}`} />
              </button>
            </div>

            {summaryLoading ? (
              <div className="space-y-2">
                <div className="h-5 w-36 rounded bg-translucid" />
                <div className="h-10 w-full rounded bg-translucid" />
                <div className="h-10 w-full rounded bg-translucid" />
                <div className="h-4 w-28 rounded bg-translucid" />
              </div>
            ) : (
              <>
                <div className="mb-3">
                  <p className="text-xs color-gray">Pedidos encontrados</p>
                  <p className="text-3xl font-bold">{summary.count}</p>
                  {summary.lastUpdatedAt ? (
                    <p className="mt-1 text-xs color-gray">
                      Última atualização: {new Date(summary.lastUpdatedAt).toLocaleString("pt-BR")}
                    </p>
                  ) : null}
                </div>

                <div className="mb-4">
                  <div className="mb-1 flex items-center justify-between text-xs color-gray">
                    <span>Pagos ({summary.paidCount})</span>
                    <span>{paidPct}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded bg-translucid">
                    <div className="h-full bg-green-600" style={{ width: `${paidPct}%` }} />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  <div className="rounded-2xl border border-translucid bg-translucid p-3">
                    <p className="text-xs color-gray">Total pago</p>
                    <p className="text-xl font-semibold text-green-500">R$ {summary.paidTotal.toFixed(2)}</p>
                  </div>

                  <div className="rounded-2xl border border-translucid bg-translucid p-3">
                    <p className="text-xs color-gray">Total pendente</p>
                    <p className="text-xl font-semibold text-yellow-400">R$ {summary.pendingTotal.toFixed(2)}</p>
                    <p className="mt-1 text-xs color-gray">Pendentes: {summary.pendingCount}</p>
                  </div>

                  <div className="rounded-2xl border border-translucid bg-translucid p-3">
                    <p className="text-xs color-gray">Ticket médio</p>
                    <p className="text-lg font-semibold">R$ {summary.avgTicket.toFixed(2)}</p>
                  </div>
                </div>
              </>
            )}
          </div>
        </aside>
      ) : null}

      {orderModalOpen && selectedOrder ? (
        <GenericModal title="Detalhes do pedido" onClose={() => setOrderModalOpen(false)} size="xl">
          <div className="max-h-[90dvh] w-full overflow-y-auto space-y-4 scrollbar-none sm:max-h-[80vh]">
            <form
              className="space-y-4"
              onSubmit={async (e) => {
                e.preventDefault();
                const subtotal = computeSubtotal(selectedOrder);
                const deliveryFee = computeDeliveryFee(selectedOrder);
                const payload = {
                  ...selectedOrder,
                  delivery_fee: deliveryFee,
                  total: subtotal + deliveryFee,
                };

                const { error } = await supabase.from("orders").update(payload).eq("id", selectedOrder.id);
                if (error) return customAlert("Erro ao atualizar pedido", "error");

                customAlert("Pedido atualizado com sucesso!", "success");
                setOrderModalOpen(false);
                resetAndFetch();
              }}
            >
              <SectionCard title="Cliente" subtitle="Dados básicos do pedido" icon={<FaPhoneAlt />}>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium">Nome do cliente</label>
                    <input
                      type="text"
                      className="input w-full rounded-xl bg-black/10 p-3"
                      value={selectedOrder.costumer_name || ""}
                      onChange={(e) => setSelectedOrder({ ...selectedOrder, costumer_name: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium">Telefone</label>
                    <input
                      type="text"
                      className="input w-full rounded-xl bg-black/10 p-3"
                      value={selectedOrder.costumer_phone || ""}
                      onChange={(e) => setSelectedOrder({ ...selectedOrder, costumer_phone: e.target.value })}
                    />
                  </div>
                </div>

                {selectedOrder.address ? (
                  <div className="mt-3">
                    <label className="mb-1 block text-sm font-medium">Endereço</label>
                    <input
                      type="text"
                      className="input w-full rounded-xl bg-black/10 p-3"
                      value={selectedOrder.address || ""}
                      onChange={(e) => setSelectedOrder({ ...selectedOrder, address: e.target.value })}
                    />
                  </div>
                ) : null}
              </SectionCard>

              <SectionCard title="Pedido" subtitle="Tipo de atendimento e pagamento" icon={<FaClipboardList />}>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium">Serviço</label>
                    <select
                      className="input w-full rounded-xl bg-black/10 p-3"
                      value={selectedOrder.service || ""}
                      onChange={(e) => setSelectedOrder({ ...selectedOrder, service: e.target.value })}
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
                    <label className="mb-1 block text-sm font-medium">Método de pagamento</label>
                    <select
                      className="input w-full rounded-xl bg-black/10 p-3"
                      value={selectedOrder.payment_method || ""}
                      onChange={(e) => setSelectedOrder({ ...selectedOrder, payment_method: e.target.value })}
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
              </SectionCard>

              <SectionCard title="Itens" subtitle="Edite rapidamente o conteúdo do pedido">
                <div className="space-y-4">
                  {(selectedOrder.items_list || []).map((item, i) => (
                    <div key={i} className="rounded-2xl border border-translucid bg-black/10 p-4">
                      <div className="mb-3 flex items-start justify-between gap-3">
                        <div className="flex min-w-0 gap-3">
                          {item.image_url ? (
                            <img
                              src={item.image_url}
                              alt={item.name}
                              className="h-20 w-20 flex-shrink-0 rounded-xl object-cover sm:h-24 sm:w-24"
                            />
                          ) : null}

                          <div className="min-w-0">
                            <p className="mb-1 text-xs uppercase tracking-wide color-gray">Item</p>
                            <input
                              type="text"
                              className="input w-full rounded-xl bg-translucid p-3 text-sm"
                              value={item.name}
                              onChange={(e) => {
                                const updated = [...selectedOrder.items_list];
                                updated[i] = { ...updated[i], name: e.target.value };
                                setSelectedOrder({ ...selectedOrder, items_list: updated });
                              }}
                              placeholder="Nome do item"
                            />
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => deleteItem(i)}
                          className="rounded-xl bg-red-600 p-3 text-white transition hover:opacity-90 cursor-pointer"
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
                              const updated = [...selectedOrder.items_list];
                              updated[i] = { ...updated[i], qty: Number(e.target.value) || 0 };
                              setSelectedOrder({ ...selectedOrder, items_list: updated });
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
                              const updated = [...selectedOrder.items_list];
                              updated[i] = { ...updated[i], price: value === "" ? null : Number(value) };
                              setSelectedOrder({ ...selectedOrder, items_list: updated });
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
                            const updated = [...selectedOrder.items_list];
                            updated[i] = { ...updated[i], note: e.target.value };
                            setSelectedOrder({ ...selectedOrder, items_list: updated });
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
                              const updated = [...(selectedOrder.items_list || [])];
                              const additionals = updated[i].additionals ? [...updated[i].additionals] : [];
                              additionals.push({ name: "", price: 0 });
                              updated[i] = { ...updated[i], additionals };
                              setSelectedOrder({ ...selectedOrder, items_list: updated });
                            }}
                            className="cursor-pointer rounded-xl bg-blue-600 px-3 py-2 text-sm text-white transition hover:bg-blue-700"
                          >
                            + Adicional
                          </button>
                        </div>

                        {(item.additionals || []).length === 0 ? (
                          <p className="text-sm text-[var(--gray)]">Nenhum adicional adicionado.</p>
                        ) : (
                          <div className="space-y-2">
                            {(item.additionals || []).map((add, ai) => (
                              <div key={ai} className="grid grid-cols-[1fr_110px_48px] gap-2">
                                <input
                                  type="text"
                                  className="input rounded-xl bg-translucid p-3 text-sm"
                                  value={add.name}
                                  onChange={(e) => {
                                    const updated = [...selectedOrder.items_list];
                                    const ad = updated[i].additionals ? [...updated[i].additionals] : [];
                                    ad[ai] = { ...ad[ai], name: e.target.value };
                                    updated[i] = { ...updated[i], additionals: ad };
                                    setSelectedOrder({ ...selectedOrder, items_list: updated });
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
                                    const updated = [...selectedOrder.items_list];
                                    const ad = updated[i].additionals ? [...updated[i].additionals] : [];
                                    ad[ai] = { ...ad[ai], price: value === "" ? null : Number(value) };
                                    updated[i] = { ...updated[i], additionals: ad };
                                    setSelectedOrder({ ...selectedOrder, items_list: updated });
                                  }}
                                  placeholder="Preço"
                                />

                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = [...selectedOrder.items_list];
                                    const ad = updated[i].additionals ? [...updated[i].additionals] : [];
                                    ad.splice(ai, 1);
                                    updated[i] = { ...updated[i], additionals: ad };
                                    setSelectedOrder({ ...selectedOrder, items_list: updated });
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
                    setSelectedOrder({
                      ...selectedOrder,
                      items_list: [
                        ...(selectedOrder.items_list || []),
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
                    <p className="text-xs uppercase tracking-wide color-gray">Total do pedido</p>
                    <p className="text-2xl font-bold">R$ {computeTotalWithDelivery(selectedOrder).toFixed(2)}</p>
                  </div>
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
                    onClick={() => {
                      resetAndFetch();
                      setOrderModalOpen(false);
                    }}
                    className="w-full cursor-pointer rounded-xl bg-[var(--translucid)] border border-translucid py-3 transition hover:opacity-80 sm:w-40"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </form>
          </div>
        </GenericModal>
      ) : null}
    </div>
  );
};

export default Orders;
