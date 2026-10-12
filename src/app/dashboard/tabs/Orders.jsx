"use client";

import { Fragment, useEffect, useState, useRef, useMemo } from "react";
import useMenu from "@/hooks/useMenu";
import { formatCurrency } from "@/lib/formatCurrency";
import { useAlert } from "@/providers/AlertProvider";
import { supabase } from "@/lib/supabaseClient";
import { updateMenuById } from "@/lib/queries/menus";
import Loading from "@/components/Loading";
import {
  FaCheck,
  FaTrash,
  FaMoneyBill,
  FaChevronDown,
  FaChevronLeft,
  FaChevronRight,
  FaSyncAlt,
  FaPhoneAlt,
  FaClipboardList,
  FaWhatsapp,
  FaPrint,
  FaLock,
  FaUtensils,
  FaMotorcycle,
  FaShoppingBag,
  FaChair,
  FaUser,
} from "react-icons/fa";
import GenericModal from "@/components/GenericModal";
import { useConfirm } from "@/providers/ConfirmProvider";
import OrdersFilter from "./components/orders/OrdersFilter";
import useModalBackHandler from "@/hooks/useModalBackHandler";
import useUser from "@/hooks/useUser";
import UpdatePlanModal from "./components/UpdatePlanModal";
import { mapsUrl } from "@/components/AddressFields";
import PrintDocumentButton, {
  normalizeOrderForPrint,
} from "./components/print/PrintDocumentButton";
import PrintOrderModal from "./components/print/PrintOrderModal";
import { ORDER_STATUS, STAFF_PLAN_ROLES } from "@/lib/staff";
import { staffApi } from "./Team";

const PAGE_SIZE = 10;

// Avançar a etapa pelo painel (rótulo do botão pela etapa de destino)
const ADVANCE_LABEL = {
  preparing: "Começar preparo",
  ready: "Marcar pronto",
  out_for_delivery: "Saiu para entrega",
  delivered: "Marcar entregue",
};
const STATUS_FLOW = Object.keys(ORDER_STATUS);

const paymentLabels = {
  pix: "Pix",
  debit: "Débito",
  credit: "Crédito",
  cash: "Dinheiro",
  stripe: "Stripe",
};

const serviceIcons = {
  delivery: FaMotorcycle,
  pickup: FaShoppingBag,
  dinein: FaUtensils,
  faceToFace: FaUser,
};

const chipClass =
  "inline-flex items-center gap-1.5 rounded-full border border-translucid bg-[var(--translucid)] px-2.5 py-1 color-gray";

// "14:32" se for hoje, senão "12/10 14:32"
const formatOrderTime = (value) => {
  const date = new Date(value);
  const time = date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  if (date.toDateString() === new Date().toDateString()) return time;
  return `${date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })} ${time}`;
};

const serviceLabels = {
  delivery: "Entrega",
  pickup: "Retirada",
  dinein: "No local",
  faceToFace: "Atendimento presencial",
};

const SectionCard = ({
  title,
  subtitle,
  children,
  icon = null,
  open,
  onToggle,
  summary,
}) => (
  <section className="rounded-2xl border border-translucid bg-[var(--low-translucid)] overflow-hidden shadow-sm">
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      className="flex w-full items-center justify-between gap-3 p-4 text-left transition hover:bg-white/[0.02] cursor-pointer"
    >
      <div className="flex min-w-0 items-start gap-3">
        {icon ? <div className="mt-0.5 opacity-80">{icon}</div> : null}
        <div className="min-w-0">
          <h3 className="text-base font-semibold leading-tight">{title}</h3>
          {!open && summary ? (
            <p className="mt-1 truncate text-xs color-gray">{summary}</p>
          ) : subtitle ? (
            <p className="mt-1 text-xs color-gray">{subtitle}</p>
          ) : null}
        </div>
      </div>

      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-translucid bg-translucid transition-transform ${
          open ? "rotate-180" : "rotate-0"
        }`}
      >
        <FaChevronDown className="text-xs" />
      </span>
    </button>

    <div
      className="grid transition-[grid-template-rows] duration-300 ease-in-out"
      style={{ display: "grid", gridTemplateRows: open ? "1fr" : "0fr" }}
    >
      <div className="overflow-hidden">
        <div className="border-t border-translucid p-4">{children}</div>
      </div>
    </div>
  </section>
);

const Orders = ({
  setSelectedTab,
  reloadTrigger,
  setOrderQuantityChangeTrigger,
  staff = false, // login da equipe (caixa): só os pedidos, sem as configurações do cardápio
}) => {
  const { menu, loading } = useMenu();
  const { profile, loadingProfile } = useUser();
  const customAlert = useAlert();
  const [printUpsell, setPrintUpsell] = useState(false);
  // plano do estabelecimento: o caixa não tem profile, mas só entra com o Business do dono ativo
  const planRole = staff ? "business" : profile?.role;
  const canCustomize = ["business", "admin"].includes(planRole);
  // etapas da equipe: Business + tela ligada na aba Equipe
  const teamPlan = STAFF_PLAN_ROLES.includes(planRole);
  const kitchenOn = teamPlan && menu?.kitchen_enabled === true;
  const deliveryOn = teamPlan && menu?.delivery_enabled === true;
  const canAssign = deliveryOn && !staff; // só o dono atribui entregas
  const [couriers, setCouriers] = useState([]);
  const confirm = useConfirm();

  const [showConfig, setShowConfig] = useState(false);
  const [printOrderModalOpen, setPrintOrderModalOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [filters, setFilters] = useState({});
  const [orderModalOpen, setOrderModalOpen] = useState(false);

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [openOrderSections, setOpenOrderSections] = useState({
    cliente: false,
    pedido: false,
    itens: false,
  });

  const [openItemIndexes, setOpenItemIndexes] = useState(() => new Set());

  const [receiveOrders, setReceiveOrders] = useState(menu?.orders || "all");
  const [deliveryFeeOnSales, setDeliveryFeeOnSales] = useState(false);
  const [enabledOrders, setEnabledOrders] = useState(false);

  const [soundNewOrder, setSoundNewOrder] = useState(true);

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
      setEnabledOrders(
        menu.orders === "site_whatsapp" || menu.orders === "site",
      );
    }
  }, [menu?.orders]);

  useEffect(() => {
    if (menu?.sound_new_order !== undefined) {
      setSoundNewOrder(menu.sound_new_order);
    }
  }, [menu?.sound_new_order]);

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

  useEffect(() => {
    if (reloadTrigger !== 0) {
      resetAndFetch();
    }
  }, [reloadTrigger]);

  const resetAndFetch = async () => {
    setOrders([]);
    setPage(0);
    setHasMore(true);
    loadingRef.current = false;
    setLoadingOrders(true);
    await fetchMore(true, filters);
    await fetchSummary(filters);
  };

  const buildOrdersQuery = (filters) => {
    let q = supabase
      .from("orders")
      .select("*", { count: "exact" })
      .eq("menu_id", menu.id);

    // oculta pedidos Stripe enquanto não pagos
    q = q.or("payment_method.neq.stripe,is_paid.eq.true");

    if (filters.isPaid === true) q = q.eq("is_paid", true);
    if (filters.isPaid === false) q = q.eq("is_paid", false);

    if (filters.deliveryType && filters.deliveryType !== "all") {
      q = q.eq("service", filters.deliveryType);
    }

    if (filters.payment && filters.payment !== "all") {
      q = q.eq("payment_method", filters.payment);
    }

    if (filters.tableOnly) {
      q = q.not("table_id", "is", null);
    }

    if (filters.status && filters.status !== "all") {
      q = q.eq("status", filters.status);
    }

    if (filters.dateFrom)
      q = q.gte("created_at", new Date(filters.dateFrom).toISOString());
    if (filters.dateTo)
      q = q.lte("created_at", new Date(filters.dateTo).toISOString());

    if (filters.search && filters.search.trim() !== "") {
      const term = filters.search.trim();
      q = q.or(
        `costumer_name.ilike.%${term}%,costumer_phone.ilike.%${term}%,id_text.ilike.${term}%`,
      );
    }

    return q.order("updated_at", { ascending: false });
  };

  const buildSummaryQuery = (filters) => {
    let q = supabase
      .from("orders")
      .select("is_paid,service,items_list,updated_at,delivery_fee,discount", {
        count: "exact",
      })
      .eq("menu_id", menu.id)
      .order("updated_at", { ascending: false });

    // oculta pedidos Stripe enquanto não pagos
    q = q.or("payment_method.neq.stripe,is_paid.eq.true");

    if (filters.isPaid === true) q = q.eq("is_paid", true);
    if (filters.isPaid === false) q = q.eq("is_paid", false);

    if (filters.deliveryType && filters.deliveryType !== "all") {
      q = q.eq("service", filters.deliveryType);
    }

    if (filters.payment && filters.payment !== "all") {
      q = q.eq("payment_method", filters.payment);
    }

    if (filters.tableOnly) {
      q = q.not("table_id", "is", null);
    }

    if (filters.status && filters.status !== "all") {
      q = q.eq("status", filters.status);
    }

    if (filters.dateFrom)
      q = q.gte("created_at", new Date(filters.dateFrom).toISOString());
    if (filters.dateTo)
      q = q.lte("created_at", new Date(filters.dateTo).toISOString());

    if (filters.search && filters.search.trim() !== "") {
      const term = filters.search.trim();
      q = q.or(
        `costumer_name.ilike.%${term}%,costumer_phone.ilike.%${term}%,id_text.ilike.${term}%`,
      );
    }

    return q;
  };

  const fetchMore = async (isReset = false, currentFilters = filters) => {
    if (!menu?.id) return;
    if (!hasMoreRef.current && !isReset) return;
    if (loadingRef.current) return;

    loadingRef.current = true;

    const nextPage = isReset ? 1 : pageRef.current + 1;
    const from = (nextPage - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const { data, error, count } = await buildOrdersQuery(currentFilters).range(
      from,
      to,
    );

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

  const fetchSummary = async (currentFilters = filters) => {
    if (!menu?.id) return;
    setSummaryLoading(true);

    const PAGE = 1000;
    let all = [];
    let from = 0;

    try {
      while (true) {
        const to = from + PAGE - 1;
        const { data, error, count } = await buildSummaryQuery(
          currentFilters,
        ).range(from, to);

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

    const { error } = await updateMenuById(supabase, menu.id, { orders: value });

    if (error)
      customAlert("Erro ao atualizar configuração de pedidos.", "error");
    else customAlert("Preferência de pedidos atualizada!", "success");
  };

  const togglePaid = async (id, current) => {
    const { error } = await supabase
      .from("orders")
      .update({ is_paid: !current })
      .eq("id", id);
    if (error) return customAlert("Erro ao atualizar pagamento", "error");

    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, is_paid: !current } : o)),
    );
    fetchSummary();
  };

  // Avança ou volta a etapa do pedido (voltar desfaz um clique errado; o pedido reaparece na tela da cozinha/entregas)
  const changeStatus = async (order, status) => {
    const { error } = await supabase
      .from("orders")
      .update({ status })
      .eq("id", order.id);
    if (error) return customAlert("Erro ao atualizar pedido", "error");

    setOrders((prev) =>
      prev.map((o) => (o.id === order.id ? { ...o, status } : o)),
    );
    customAlert(`Pedido em "${ORDER_STATUS[status]}"`, "success");
  };

  useEffect(() => {
    if (!canAssign) return;
    staffApi("GET")
      .then((list) => setCouriers(list.filter((m) => m.role === "entregador")))
      .catch((err) => console.error("Erro ao buscar entregadores:", err));
  }, [canAssign]);

  // null = sem entregador (não aparece pra nenhum; com um único entregador o banco atribui a ele)
  const assignCourier = async (id, userId) => {
    // devolve o valor gravado: com um único entregador o trigger reatribui a ele
    const { data, error } = await supabase
      .from("orders")
      .update({ assigned_to: userId || null })
      .eq("id", id)
      .select("assigned_to")
      .single();
    if (error) return customAlert("Erro ao atribuir entregador", "error");
    const { assigned_to } = data;

    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, assigned_to } : o)),
    );
    customAlert(
      assigned_to ? "Entregador atribuído!" : "Entregador removido da entrega",
      "success",
    );
  };

  const handleToggleDeliveryFeeOnSales = async (value) => {
    setDeliveryFeeOnSales(value);

    const { error } = await updateMenuById(supabase, menu.id, { delivery_fee_on_sales: value });

    if (error) {
      customAlert(
        "Erro ao atualizar configuração da taxa de entrega.",
        "error",
      );
      setDeliveryFeeOnSales(!value);
    } else {
      customAlert("Configuração de taxa de entrega atualizada!", "success");
    }
  };

  const handleToggleSoundNewOrder = async (value) => {
    setSoundNewOrder(value);

    const { error } = await updateMenuById(supabase, menu.id, { sound_new_order: value });

    if (error) {
      customAlert("Erro ao atualizar som de pedidos.", "error");
      setSoundNewOrder(!value);
    } else {
      customAlert("Configuração de som atualizada!", "success");
    }
  };

  const finalizeOrder = async (id) => {
    const ok = await confirm("Quer mesmo finalizar esse pedido?");
    if (!ok) return;

    const { data: order, error: fetchError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", id)
      .single();
    if (fetchError || !order) {
      return customAlert("Erro ao localizar pedido", "error");
    }

    const subtotal = computeSubtotal(order);
    const deliveryFee =
      deliveryFeeOnSales && order.service === "delivery"
        ? Number(order.delivery_fee) || 0
        : 0;
    const grossTotal = subtotal - computeDiscount(order) + deliveryFee;

    const isStripeWithNet =
      order.payment_method === "stripe" && order.net_total != null;
    const netTotal = isStripeWithNet ? Number(order.net_total) : null;

    // total principal continua sendo o bruto (mantém compatibilidade com relatórios existentes)
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
        total: grossTotal,
        delivery_fee: deliveryFee,
        net_total: netTotal,
      },
    ]);

    if (insertError) {
      console.error(insertError);
      return customAlert("Erro ao registrar venda", "error");
    }

    const { error: deleteError } = await supabase
      .from("orders")
      .delete()
      .eq("id", id);
    if (deleteError) {
      return customAlert("Erro ao excluir pedido", "error");
    }

    customAlert("Pedido finalizado e registrado como venda!", "success");
    setOrderQuantityChangeTrigger((prev) => prev + 1); // Trigger para atualizar a quantidade de pedidos no Dashboard
    resetAndFetch();
  };

  const deleteOrder = async (id) => {
    const ok = await confirm("Quer mesmo excluir esse pedido?");
    if (!ok) return;

    const { error } = await supabase.from("orders").delete().eq("id", id);
    if (error) return customAlert("Erro ao excluir pedido", "error");

    customAlert("Pedido excluído com sucesso!", "success");
    setOrderQuantityChangeTrigger((prev) => prev + 1); // Trigger para atualizar a quantidade de pedidos no Dashboard
    resetAndFetch();
  };

  const deleteItem = async (i) => {
    const ok = await confirm("Quer mesmo remover esse item?");
    if (!ok) return;

    const updated = [...(selectedOrder.items_list || [])];
    updated.splice(i, 1);
    setSelectedOrder({ ...selectedOrder, items_list: updated });

    setOpenItemIndexes((prev) => {
      const next = new Set();
      prev.forEach((idx) => {
        if (idx < i) next.add(idx);
        else if (idx > i) next.add(idx - 1);
        // idx === i é o item removido, não entra
      });
      return next;
    });

    customAlert("Item removido do pedido", "success");
  };

  const openOrderModal = (order) => {
    setSelectedOrder(order);
    setOrderModalOpen(true);
    setOpenOrderSections({ cliente: false, pedido: false, itens: false });
    setOpenItemIndexes(new Set());
  };

  const toggleOrderSection = (key) => {
    setOpenOrderSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleItemOpen = (i) => {
    setOpenItemIndexes((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  const computeSubtotal = (order) => {
    if (!order) return 0;

    return (order.items_list || []).reduce((acc, it) => {
      const qty = Number(it.qty) || 0;
      const unit = Number(it.price) || 0;
      const base = unit * qty;
      const addsUnit = (it.additionals || []).reduce(
        (sa, a) => sa + (Number(a.price) || 0),
        0,
      );
      const adds = addsUnit * qty;
      return acc + base + adds;
    }, 0);
  };

  const computeDeliveryFee = (order) => {
    if (!order) return 0;
    if (order.service !== "delivery") return 0;
    return Number(order?.delivery_fee) || 0;
  };

  // desconto (combo/cupom) gravado no pedido, nunca maior que o subtotal
  const computeDiscount = (order) =>
    Math.min(Number(order?.discount) || 0, computeSubtotal(order));

  const computeTotalWithDelivery = (order) => {
    const subtotal = computeSubtotal(order);
    const delivery = computeDeliveryFee(order);
    return subtotal - computeDiscount(order) + delivery;
  };

  const paidPct =
    summary.count > 0
      ? Math.round((summary.paidCount / summary.count) * 100)
      : 0;

  useModalBackHandler(orderModalOpen, () => setOrderModalOpen(false));

  if (loading) return <Loading />;
  if (!menu) return <p>Você ainda não criou seu cardápio.</p>;

  return (
    <div className="px-4 sm:px-2 lg:grid">
      <div className="md:m-auto lg:m-2 lg:w-[calc(100%-30dvw+16px)] min-h-[calc(100dvh-110px)] overflow-y-auto rounded-2xl">
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

        {/* só o dono: atalhos da equipe e configurações do cardápio */}
        {!staff && (
          <>
        {/* atalhos de operação da equipe (Business, telas ligadas na aba Equipe) */}
        {(kitchenOn || deliveryOn) && (
          <div className="mb-4 flex gap-2">
            {[
              kitchenOn && { tab: "kitchen", Icon: FaUtensils, label: "Cozinha" },
              deliveryOn && { tab: "delivery", Icon: FaMotorcycle, label: "Entregas" },
            ]
              .filter(Boolean)
              .map(({ tab, Icon, label }) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setSelectedTab(tab)}
                  className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-translucid bg-[var(--low-translucid)] px-3 py-2 text-sm font-semibold transition hover:bg-[var(--translucid)]"
                >
                  <Icon /> {label}
                </button>
              ))}
          </div>
        )}

        <button
          onClick={() => setShowConfig(!showConfig)}
          className="mb-2 flex cursor-pointer items-center gap-2 color-gray"
        >
          Configurar pedidos
          <span
            className={`transition-transform ${showConfig ? "rotate-180" : ""}`}
          >
            <FaChevronDown />
          </span>
        </button>

        <div
          className={`${showConfig ? "h-auto border p-3 sm:p-4" : "h-0"} max-w-[calc(100%-6px)] overflow-hidden rounded-2xl border-translucid bg-translucid transition-all duration-500`}
        >
          <p className="mb-2 text-sm font-medium">Personalização</p>

          <div className="flex flex-col gap-1">
            {[
              {
                Icon: FaWhatsapp,
                title: "Mensagem do WhatsApp",
                desc: "Personalize o texto que o cliente envia",
                onClick: () => setSelectedTab("whatsappMessage"),
              },
              {
                Icon: FaPrint,
                title: "Ordem da impressão",
                desc: "Escolha a ordem das informações impressas",
                onClick: () => setPrintOrderModalOpen(true),
              },
            ].map(({ Icon, title, desc, onClick }) => (
              <button
                key={title}
                type="button"
                onClick={onClick}
                className="flex min-w-0 cursor-pointer items-center gap-3 rounded-xl p-2 text-left transition hover:bg-[var(--translucid)]"
              >
                <Icon className="shrink-0 opacity-80" />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold leading-tight">{title}</span>
                  <span className="mt-0.5 block text-xs leading-snug color-gray">{desc}</span>
                </span>
                {!canCustomize && (
                  <span
                    title="Plano Business"
                    className="flex shrink-0 items-center gap-1 rounded-full bg-[var(--translucid)] px-2 py-1 text-xs color-gray"
                  >
                    <FaLock className="text-[10px]" />
                    <span className="hidden xs:inline">Business</span>
                  </span>
                )}
              </button>
            ))}
          </div>

          <hr className="my-3 border-translucid" />

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
                onChange={(e) =>
                  handleToggleDeliveryFeeOnSales(e.target.checked)
                }
              />
              <span className="slider"></span>
            </span>
            <span>Contar taxa de entrega como venda</span>
          </label>

          <p className="mt-2 text-xs color-gray">
            Se ativado, a taxa de entrega será somada ao total das vendas
            registradas.
          </p>

          <hr className="my-3 border-translucid" />

          <p className="mb-2 text-sm font-medium">Som de novos pedidos</p>

          <label className="flex items-center gap-2">
            <span className="switch">
              <input
                type="checkbox"
                checked={soundNewOrder}
                onChange={(e) => handleToggleSoundNewOrder(e.target.checked)}
              />
              <span className="slider"></span>
            </span>

            <span>Emitir som ao receber pedido</span>
          </label>

          <p className="mt-2 text-xs color-gray">
            Quando ativado, o sistema tocará um som ao chegar um novo pedido.
          </p>
        </div>
          </>
        )}

        {!enabledOrders ? (
          <p className="p-6 text-center color-gray">
            Os pedidos no site estão desabilitados.
          </p>
        ) : (
          <div>
            <OrdersFilter
              onChange={setFilters}
              statusOptions={
                kitchenOn || deliveryOn
                  ? Object.entries(ORDER_STATUS).filter(
                      ([value]) =>
                        deliveryOn ||
                        !["out_for_delivery", "delivered"].includes(value),
                    )
                  : null
              }
            />

            {orders.length === 0 ? (
              <p className="p-6 text-center color-gray">
                Nenhum pedido encontrado com esses filtros.
              </p>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => {
                  const total = computeTotalWithDelivery(order);
                  const subtotal = computeSubtotal(order);
                  const deliveryFee = computeDeliveryFee(order);
                  const discount = computeDiscount(order);
                  const items = order.items_list || [];
                  const ServiceIcon = serviceIcons[order.service] || FaShoppingBag;

                  // etapas que fazem sentido pra este pedido, conforme as telas ligadas
                  const steps = [
                    "received",
                    ...(kitchenOn ? ["preparing", "ready"] : []),
                    ...(deliveryOn && order.service === "delivery"
                      ? ["out_for_delivery", "delivered"]
                      : []),
                  ];
                  const stepIndex = steps.indexOf(order.status);
                  const showSteps = steps.length > 1;
                  // etapa anterior/próxima entre as do card (cobre status fora da lista, ex.: "ready" com a cozinha desligada)
                  const nextStatus = steps.find(
                    (st) =>
                      STATUS_FLOW.indexOf(st) >
                      STATUS_FLOW.indexOf(order.status),
                  );
                  const prevStatus = [...steps].reverse().find(
                    (st) =>
                      STATUS_FLOW.indexOf(st) <
                      STATUS_FLOW.indexOf(order.status),
                  );
                  const showCourier =
                    canAssign &&
                    couriers.length > 0 &&
                    order.service === "delivery" &&
                    order.status !== "delivered";

                  return (
                    <div
                      key={order.id}
                      className={`overflow-hidden rounded-2xl border border-translucid border-l-2 bg-translucid shadow-sm transition hover:shadow-md ${
                        order.is_paid ? "border-l-green-500" : "border-l-yellow-500"
                      }`}
                    >
                      {/* cabeçalho: identificação + total */}
                      <div className="flex items-start justify-between gap-3 p-4 pb-3">
                        <div className="min-w-0">
                          <div className="flex items-baseline gap-2">
                            <p className="text-2xl font-bold leading-none">
                              Nº {order.order_number ?? "—"}
                            </p>
                            <p className="text-xs color-gray">
                              #{order?.id?.slice(0, 6)}
                            </p>
                          </div>
                          <p className="mt-1.5 truncate text-base font-semibold">
                            {order.costumer_name || "Cliente"}
                          </p>
                          <p className="text-xs color-gray">
                            {formatOrderTime(order.updated_at)}
                          </p>
                        </div>

                        <div className="shrink-0 text-right">
                          <p className="text-xl font-bold leading-none">
                            {formatCurrency(total, menu?.currency)}
                          </p>
                          <span
                            className={`mt-2 inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                              order.is_paid
                                ? "bg-green-600/30 text-green-500"
                                : "bg-yellow-500/30 text-yellow-500"
                            }`}
                          >
                            {order.is_paid ? "Pago" : "Pendente"}
                          </span>
                        </div>
                      </div>

                      {/* serviço, mesa, pagamento, troco */}
                      <div className="flex flex-wrap gap-1.5 px-4 pb-3 text-xs">
                        <span className={chipClass}>
                          <ServiceIcon />
                          {serviceLabels[order.service] || "Não informado"}
                        </span>
                        {order.table_label && (
                          <span className={chipClass}>
                            <FaChair />
                            {order.table_label}
                          </span>
                        )}
                        <span className={chipClass}>
                          <FaMoneyBill />
                          {paymentLabels[order.payment_method] || "Não informado"}
                        </span>
                        {order.change_requested && (
                          <span className={chipClass}>
                            Troco para{" "}
                            {formatCurrency(order.change_for_amount, menu?.currency)}
                          </span>
                        )}
                      </div>

                      {/* progresso da equipe (Business) */}
                      {(showSteps || showCourier) && (
                        <div className="mx-4 mb-3 flex flex-col gap-2 rounded-xl bg-[var(--low-translucid)] p-3">
                          {showSteps && (
                            <div className="flex flex-col gap-1.5">
                              <div className="flex items-center gap-3">
                                <button
                                  type="button"
                                  disabled={!prevStatus}
                                  onClick={() => changeStatus(order, prevStatus)}
                                  title={prevStatus ? `Voltar para "${ORDER_STATUS[prevStatus]}"` : undefined}
                                  aria-label="Voltar etapa"
                                  className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full border border-translucid bg-[var(--translucid)] text-sm transition hover:opacity-80 disabled:cursor-default disabled:opacity-30"
                                >
                                  <FaChevronLeft />
                                </button>

                                <div className="flex flex-1 items-center">
                                  {steps.map((step, i) => (
                                    <Fragment key={step}>
                                      {i > 0 && (
                                        <span
                                          className={`h-0.5 flex-1 ${
                                            i <= stepIndex
                                              ? "bg-blue-500"
                                              : "bg-[var(--translucid)]"
                                          }`}
                                        />
                                      )}
                                      <span
                                        title={ORDER_STATUS[step]}
                                        className={`h-3 w-3 shrink-0 rounded-full border-2 ${
                                          i < stepIndex
                                            ? "border-blue-500 bg-blue-500"
                                            : i === stepIndex
                                              ? "border-blue-500 bg-blue-500 ring-4 ring-blue-500/25"
                                              : "border-[var(--gray)] opacity-40"
                                        }`}
                                      />
                                    </Fragment>
                                  ))}
                                </div>

                                <button
                                  type="button"
                                  disabled={!nextStatus}
                                  onClick={() => changeStatus(order, nextStatus)}
                                  title={nextStatus ? ADVANCE_LABEL[nextStatus] : undefined}
                                  aria-label="Avançar etapa"
                                  className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full border border-translucid bg-[var(--translucid)] text-sm transition hover:opacity-80 disabled:cursor-default disabled:opacity-30"
                                >
                                  <FaChevronRight />
                                </button>
                              </div>

                              <p className="text-center text-xs">
                                <span className="font-semibold">
                                  {ORDER_STATUS[order.status] ?? "—"}
                                </span>
                                {nextStatus && (
                                  <span className="color-gray">
                                    {" "}· próximo: {ORDER_STATUS[nextStatus]}
                                  </span>
                                )}
                              </p>
                            </div>
                          )}

                          {showCourier && (
                            <label className="flex items-center gap-2 text-sm">
                              <FaMotorcycle className="shrink-0 opacity-70" />
                              <span className="color-gray">Entregador</span>
                              <select
                                value={order.assigned_to ?? ""}
                                onChange={(e) =>
                                  assignCourier(order.id, e.target.value)
                                }
                                className={`min-w-0 flex-1 cursor-pointer rounded-lg border-2 bg-translucid p-1.5 ${
                                  order.assigned_to
                                    ? "border-[var(--translucid)]"
                                    : "border-yellow-500/50"
                                }`}
                              >
                                <option value="">Sem entregador</option>
                                {couriers.map((c) => (
                                  <option key={c.user_id} value={c.user_id}>
                                    {c.name}
                                  </option>
                                ))}
                              </select>
                            </label>
                          )}
                        </div>
                      )}

                      {/* itens + composição do valor */}
                      <div className="mx-4 mb-3 rounded-xl border border-translucid p-3">
                        {items.length === 0 ? (
                          <p className="text-sm color-gray">Sem itens</p>
                        ) : (
                          <ul className="space-y-1 text-sm">
                            {items.slice(0, 3).map((item, i) => (
                              <li key={i} className="flex gap-2">
                                <span className="shrink-0 font-semibold">
                                  {item.qty}x
                                </span>
                                <span className="truncate">
                                  {item.name || "Item sem nome"}
                                </span>
                              </li>
                            ))}
                            {items.length > 3 && (
                              <li className="text-xs color-gray">
                                + {items.length - 3}{" "}
                                {items.length - 3 === 1 ? "item" : "itens"}
                              </li>
                            )}
                          </ul>
                        )}

                        {(order.service === "delivery" || discount > 0) && (
                          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 border-t border-translucid pt-2 text-xs color-gray">
                            <span>
                              Subtotal {formatCurrency(subtotal, menu?.currency)}
                            </span>
                            {order.service === "delivery" && (
                              <span>
                                Entrega{" "}
                                {formatCurrency(deliveryFee, menu?.currency)}
                              </span>
                            )}
                            {discount > 0 && (
                              <span className="text-green-500">
                                Desconto -
                                {formatCurrency(discount, menu?.currency)}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* ações */}
                      <div className="flex flex-col-reverse gap-2 border-t border-translucid p-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex gap-2">
                          <button
                            onClick={() => openOrderModal(order)}
                            className="flex-1 cursor-pointer rounded-xl border border-translucid bg-[var(--translucid)] px-3 py-2 text-sm font-medium transition hover:opacity-80 sm:flex-none"
                          >
                            Ver detalhes
                          </button>
                          <PrintDocumentButton
                            document={normalizeOrderForPrint(order, {
                              deliveryFeeOnSales,
                            })}
                            currency={menu?.currency}
                            menuName={menu?.title}
                            canPrint={
                              ["pro", "business", "admin"].includes(planRole)
                            }
                            canCustomizeOrder={["business", "admin"].includes(planRole)}
                            onDenied={() => setPrintUpsell(true)}
                            fileNamePrefix="pedido"
                            receiptTitle="PEDIDO"
                            triggerClassName="flex cursor-pointer items-center justify-center gap-2 rounded-xl border bg-[var(--translucid)] border-translucid px-3 py-2 text-sm font-medium transition hover:opacity-80"
                          />
                          <button
                            onClick={() => deleteOrder(order.id)}
                            title="Excluir pedido"
                            aria-label="Excluir pedido"
                            className="flex cursor-pointer items-center justify-center rounded-xl border border-red-500/20 bg-red-500/30 px-3 text-sm transition hover:bg-red-500/50"
                          >
                            <FaTrash />
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-2 sm:flex">
                          <button
                            onClick={() => togglePaid(order.id, order.is_paid)}
                            className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition ${
                              order.is_paid
                                ? "border border-translucid bg-translucid hover:opacity-80"
                                : "bg-yellow-500 text-black hover:bg-yellow-600"
                            }`}
                          >
                            <FaMoneyBill />
                            {order.is_paid ? "Desfazer pagamento" : "Pagar"}
                          </button>
                          <button
                            onClick={() => finalizeOrder(order.id)}
                            className="flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                          >
                            <FaCheck /> Finalizar
                          </button>
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
                <FaSyncAlt
                  className={`${summaryLoading ? "animate-spin" : ""}`}
                />
              </button>
            </div>

            {summaryLoading ? (
              <div className="space-y-2">
                <div className="h-5 w-36 rounded-lg bg-translucid" />
                <div className="h-10 w-full rounded-lg bg-translucid" />
                <div className="h-10 w-full rounded-lg bg-translucid" />
                <div className="h-4 w-28 rounded-lg bg-translucid" />
              </div>
            ) : (
              <>
                <div className="mb-3">
                  <p className="text-xs color-gray">Pedidos encontrados</p>
                  <p className="text-3xl font-bold">{summary.count}</p>
                  {summary.lastUpdatedAt ? (
                    <p className="mt-1 text-xs color-gray">
                      Última atualização:{" "}
                      {new Date(summary.lastUpdatedAt).toLocaleString("pt-BR")}
                    </p>
                  ) : null}
                </div>

                <div className="mb-4">
                  <div className="mb-1 flex items-center justify-between text-xs color-gray">
                    <span>Pagos ({summary.paidCount})</span>
                    <span>{paidPct}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-lg bg-translucid">
                    <div
                      className="h-full bg-green-600"
                      style={{ width: `${paidPct}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  <div className="rounded-2xl border border-translucid bg-translucid p-3">
                    <p className="text-xs color-gray">Total pago</p>
                    <p className="text-xl font-semibold text-green-500">
                      {formatCurrency(summary.paidTotal, menu?.currency)}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-translucid bg-translucid p-3">
                    <p className="text-xs color-gray">Total pendente</p>
                    <p className="text-xl font-semibold text-yellow-400">
                      {formatCurrency(summary.pendingTotal, menu?.currency)}
                    </p>
                    <p className="mt-1 text-xs color-gray">
                      Pendentes: {summary.pendingCount}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-translucid bg-translucid p-3">
                    <p className="text-xs color-gray">Ticket médio</p>
                    <p className="text-lg font-semibold">
                      {formatCurrency(summary.avgTicket, menu?.currency)}
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        </aside>
      ) : null}

      {orderModalOpen && selectedOrder ? (
        <GenericModal
          title="Detalhes do pedido"
          onClose={() => setOrderModalOpen(false)}
          size="xl"
        >
          <div className="max-h-[90dvh] w-full overflow-y-auto space-y-4 scrollbar-none sm:max-h-[80vh]">
            <form
              className="space-y-4"
              onSubmit={async (e) => {
                e.preventDefault();

                const subtotal = computeSubtotal(selectedOrder);
                const deliveryFee = computeDeliveryFee(selectedOrder);

                const { data, error } = await supabase
                  .from("orders")
                  .update({
                    costumer_name: selectedOrder.costumer_name,
                    costumer_phone: selectedOrder.costumer_phone,
                    neighborhood: selectedOrder.neighborhood ?? null,
                    address: selectedOrder.address ?? null,
                    service: selectedOrder.service,
                    payment_method: selectedOrder.payment_method,
                    items_list: selectedOrder.items_list,
                    delivery_fee: deliveryFee,
                  })
                  .eq("id", selectedOrder.id)
                  .select();

                console.log("DATA:", data);
                console.log("ERROR:", error);

                if (error) {
                  customAlert("Erro ao atualizar pedido", "error");
                  return;
                }

                customAlert("Pedido atualizado com sucesso!", "success");
                setOrderModalOpen(false);
                resetAndFetch();
              }}
            >
              <SectionCard
                title="Cliente"
                subtitle="Dados básicos do pedido"
                icon={<FaPhoneAlt />}
                open={openOrderSections.cliente}
                onToggle={() => toggleOrderSection("cliente")}
              >
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      Nome do cliente
                    </label>
                    <input
                      type="text"
                      className="input w-full rounded-xl bg-translucid p-3"
                      value={selectedOrder.costumer_name || ""}
                      onChange={(e) =>
                        setSelectedOrder({
                          ...selectedOrder,
                          costumer_name: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      Telefone
                    </label>
                    <input
                      type="text"
                      className="input w-full rounded-xl bg-translucid p-3"
                      value={selectedOrder.costumer_phone || ""}
                      onChange={(e) =>
                        setSelectedOrder({
                          ...selectedOrder,
                          costumer_phone: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                {selectedOrder.neighborhood != null ? (
                  <div className="mt-3">
                    <label className="mb-1 block text-sm font-medium">
                      Bairro
                    </label>
                    <input
                      type="text"
                      className="input w-full rounded-xl bg-translucid p-3"
                      placeholder="Informe o bairro"
                      value={selectedOrder.neighborhood || ""}
                      onChange={(e) =>
                        setSelectedOrder({
                          ...selectedOrder,
                          neighborhood: e.target.value,
                        })
                      }
                    />
                  </div>
                ) : null}

                {selectedOrder.address != null ? (
                  <div className="mt-3">
                    <label className="mb-1 block text-sm font-medium">
                      Endereço
                    </label>
                    <input
                      type="text"
                      className="input w-full rounded-xl bg-translucid p-3"
                      placeholder="Informe o endereço"
                      value={selectedOrder.address || ""}
                      onChange={(e) =>
                        setSelectedOrder({
                          ...selectedOrder,
                          address: e.target.value,
                        })
                      }
                    />
                    {selectedOrder.address ? (
                      <a
                        href={mapsUrl(selectedOrder.address)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 inline-block text-xs underline opacity-70"
                      >
                        Ver no mapa
                      </a>
                    ) : null}
                  </div>
                ) : null}
              </SectionCard>

              <SectionCard
                title="Pedido"
                subtitle="Tipo de atendimento e pagamento"
                icon={<FaClipboardList />}
                open={openOrderSections.pedido}
                onToggle={() => toggleOrderSection("pedido")}
              >
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      Serviço
                    </label>
                    <select
                      className="input w-full rounded-xl bg-translucid p-3"
                      value={selectedOrder.service || ""}
                      onChange={(e) =>
                        setSelectedOrder({
                          ...selectedOrder,
                          service: e.target.value,
                        })
                      }
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

                  {selectedOrder.table_label ? (
                    <div>
                      <label className="mb-1 block text-sm font-medium">
                        Mesa
                      </label>
                      <p className="input w-full rounded-xl bg-translucid p-3 color-gray">
                        {selectedOrder.table_label}
                      </p>
                    </div>
                  ) : null}

                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      Método de pagamento
                    </label>
                    <select
                      className="input w-full rounded-xl bg-translucid p-3"
                      value={selectedOrder.payment_method || ""}
                      onChange={(e) =>
                        setSelectedOrder({
                          ...selectedOrder,
                          payment_method: e.target.value,
                        })
                      }
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
                      <option className="text-black" value="stripe">
                        Stripe
                      </option>
                    </select>
                  </div>
                </div>
              </SectionCard>

              <SectionCard
                title="Itens"
                subtitle="Edite rapidamente o conteúdo do pedido"
                open={openOrderSections.itens}
                onToggle={() => toggleOrderSection("itens")}
              >
                <div className="space-y-4">
                  {(selectedOrder.items_list || []).map((item, i) => {
                    const isItemOpen = openItemIndexes.has(i);
                    const additionalsNames = (item.additionals || [])
                      .map((a) => a.name)
                      .filter(Boolean)
                      .join(", ");
                    const itemSubtotal =
                      (Number(item.qty) || 0) * (Number(item.price) || 0);

                    return (
                      <div
                        key={i}
                        className="rounded-2xl border border-translucid bg-[var(--low-translucid)] overflow-hidden"
                      >
                        <button
                          type="button"
                          onClick={() => toggleItemOpen(i)}
                          aria-expanded={isItemOpen}
                          className="flex w-full items-center justify-between gap-3 p-4 text-left transition hover:bg-white/[0.02] cursor-pointer"
                        >
                          <div className="flex min-w-0 flex-1 items-center gap-3">
                            {item.image_url ? (
                              <img
                                src={item.image_url}
                                alt={item.name}
                                className="h-12 w-12 hidden xs:block flex-shrink-0 rounded-xl object-cover"
                              />
                            ) : null}

                            <div className="min-w-0">
                              <p className="truncate font-medium">
                                {item.qty}x {item.name || "Item sem nome"}
                              </p>
                              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm color-gray">
                                <span>
                                  {formatCurrency(itemSubtotal, menu?.currency)}
                                </span>
                                {additionalsNames ? (
                                  <span className="truncate">
                                    {additionalsNames}
                                  </span>
                                ) : null}
                              </div>
                            </div>
                          </div>

                          <div className="flex shrink-0 items-center gap-2">
                            <span
                              role="button"
                              aria-label="Remover item"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteItem(i);
                              }}
                              className="flex items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/40 h-8 w-8 text-sm font-semibold transition hover:opacity-90 cursor-pointer"
                            >
                              <FaTrash />
                            </span>
                            <span
                              className={`flex h-8 w-8 items-center justify-center rounded-full border border-translucid bg-translucid transition-transform ${
                                isItemOpen ? "rotate-180" : "rotate-0"
                              }`}
                            >
                              <FaChevronDown className="text-xs" />
                            </span>
                          </div>
                        </button>

                        <div
                          className="grid transition-[grid-template-rows] duration-300 ease-in-out"
                          style={{
                            display: "grid",
                            gridTemplateRows: isItemOpen ? "1fr" : "0fr",
                          }}
                        >
                          <div className="overflow-hidden">
                            <div className="border-t border-translucid p-4">
                              <div className="mb-3">
                                <p className="mb-1 text-xs uppercase tracking-wide color-gray">
                                  Item
                                </p>
                                <input
                                  type="text"
                                  className="input w-full rounded-xl bg-translucid p-3 text-sm"
                                  value={item.name}
                                  onChange={(e) => {
                                    const updated = [
                                      ...selectedOrder.items_list,
                                    ];
                                    updated[i] = {
                                      ...updated[i],
                                      name: e.target.value,
                                    };
                                    setSelectedOrder({
                                      ...selectedOrder,
                                      items_list: updated,
                                    });
                                  }}
                                  placeholder="Nome do item"
                                />
                              </div>

                              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                                <div>
                                  <label className="mb-1 block text-sm color-gray">
                                    Quantidade
                                  </label>
                                  <input
                                    type="number"
                                    min="1"
                                    className="input w-full rounded-xl bg-translucid p-3 text-sm"
                                    value={item.qty}
                                    onChange={(e) => {
                                      const updated = [
                                        ...selectedOrder.items_list,
                                      ];
                                      updated[i] = {
                                        ...updated[i],
                                        qty: Number(e.target.value) || 0,
                                      };
                                      setSelectedOrder({
                                        ...selectedOrder,
                                        items_list: updated,
                                      });
                                    }}
                                  />
                                </div>

                                <div>
                                  <label className="mb-1 block text-sm color-gray">
                                    Preço unidade
                                  </label>
                                  <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    className="input w-full rounded-xl bg-translucid p-3 text-sm"
                                    value={item.price}
                                    onChange={(e) => {
                                      const value = e.target.value;
                                      const updated = [
                                        ...selectedOrder.items_list,
                                      ];
                                      updated[i] = {
                                        ...updated[i],
                                        price:
                                          value === "" ? null : Number(value),
                                      };
                                      setSelectedOrder({
                                        ...selectedOrder,
                                        items_list: updated,
                                      });
                                    }}
                                  />
                                </div>

                                <div className="col-span-2 sm:col-span-1">
                                  <label className="mb-1 block text-sm color-gray">
                                    Subtotal
                                  </label>
                                  <div className="rounded-xl border border-translucid px-3 py-3 text-sm font-medium">
                                    {formatCurrency(
                                      itemSubtotal,
                                      menu?.currency,
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="mt-3">
                                <label className="mb-1 block text-sm color-gray">
                                  Observações
                                </label>
                                <textarea
                                  className="input w-full rounded-xl bg-translucid p-3 text-sm"
                                  value={item.note || ""}
                                  onChange={(e) => {
                                    const updated = [
                                      ...selectedOrder.items_list,
                                    ];
                                    updated[i] = {
                                      ...updated[i],
                                      note: e.target.value,
                                    };
                                    setSelectedOrder({
                                      ...selectedOrder,
                                      items_list: updated,
                                    });
                                  }}
                                  placeholder="Observações do item"
                                />
                              </div>

                              <div className="mt-4 rounded-xl">
                                <div className="mb-3 flex items-center justify-between gap-3">
                                  <span className="text-sm font-medium">
                                    Opções
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const updated = [
                                        ...(selectedOrder.items_list || []),
                                      ];
                                      const additionals = updated[i].additionals
                                        ? [...updated[i].additionals]
                                        : [];
                                      additionals.push({ name: "", price: 0 });
                                      updated[i] = {
                                        ...updated[i],
                                        additionals,
                                      };
                                      setSelectedOrder({
                                        ...selectedOrder,
                                        items_list: updated,
                                      });
                                    }}
                                    className="cursor-pointer rounded-xl bg-blue-600 px-3 py-2 text-sm text-white transition hover:bg-blue-700"
                                  >
                                    + Opção
                                  </button>
                                </div>

                                {(item.additionals || []).length === 0 ? (
                                  <p className="text-sm text-[var(--gray)]">
                                    Nenhuma opção adicionada.
                                  </p>
                                ) : (
                                  <div className="space-y-2">
                                    {(item.additionals || []).map((add, ai) => (
                                      <div
                                        key={ai}
                                        className="grid grid-cols-[minmax(0,1fr)_52px_36px] xxs:grid-cols-[minmax(0,1fr)_64px_36px] items-center gap-1.5 sm:grid-cols-[minmax(0,1fr)_110px_44px] sm:gap-2"
                                      >
                                        <input
                                          type="text"
                                          className="input rounded-xl bg-translucid p-3 text-sm"
                                          value={add.name}
                                          onChange={(e) => {
                                            const updated = [
                                              ...selectedOrder.items_list,
                                            ];
                                            const ad = updated[i].additionals
                                              ? [...updated[i].additionals]
                                              : [];
                                            ad[ai] = {
                                              ...ad[ai],
                                              name: e.target.value,
                                            };
                                            updated[i] = {
                                              ...updated[i],
                                              additionals: ad,
                                            };
                                            setSelectedOrder({
                                              ...selectedOrder,
                                              items_list: updated,
                                            });
                                          }}
                                          placeholder="Nome da opção"
                                        />

                                        <input
                                          type="number"
                                          step="0.01"
                                          min="0"
                                          className="input rounded-xl bg-translucid p-3 text-sm"
                                          value={add.price ?? ""}
                                          onChange={(e) => {
                                            const value = e.target.value;
                                            const updated = [
                                              ...selectedOrder.items_list,
                                            ];
                                            const ad = updated[i].additionals
                                              ? [...updated[i].additionals]
                                              : [];
                                            ad[ai] = {
                                              ...ad[ai],
                                              price:
                                                value === ""
                                                  ? null
                                                  : Number(value),
                                            };
                                            updated[i] = {
                                              ...updated[i],
                                              additionals: ad,
                                            };
                                            setSelectedOrder({
                                              ...selectedOrder,
                                              items_list: updated,
                                            });
                                          }}
                                          placeholder="Preço"
                                        />

                                        <button
                                          type="button"
                                          onClick={async () => {
                                            const ok = await confirm(
                                              "Quer mesmo remover esta opção?",
                                            );
                                            if (!ok) return;

                                            const updated = [
                                              ...selectedOrder.items_list,
                                            ];
                                            const ad = updated[i].additionals
                                              ? [...updated[i].additionals]
                                              : [];
                                            ad.splice(ai, 1);
                                            updated[i] = {
                                              ...updated[i],
                                              additionals: ad,
                                            };
                                            setSelectedOrder({
                                              ...selectedOrder,
                                              items_list: updated,
                                            });

                                            customAlert(
                                              "Opção removida do item",
                                              "success",
                                            );
                                          }}
                                          className="flex w-full h-full items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/40 text-sm font-semibold transition hover:opacity-90 cursor-pointer"
                                        >
                                          <FaTrash />
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const updatedItems = [
                      ...(selectedOrder.items_list || []),
                      { name: "", qty: 1, price: 0, note: "", additionals: [] },
                    ];
                    setSelectedOrder({
                      ...selectedOrder,
                      items_list: updatedItems,
                    });
                    setOpenItemIndexes((prev) =>
                      new Set(prev).add(updatedItems.length - 1),
                    );
                  }}
                  className="mt-4 cursor-pointer rounded-xl bg-blue-600 px-4 py-3 text-white transition hover:bg-blue-700"
                >
                  + Adicionar item
                </button>
              </SectionCard>

              <div className="sticky bottom-0 rounded-2xl border border-translucid bg-low-gray/95 p-4 backdrop-blur-xl">
                <div className="mb-3 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-wide color-gray">
                      Total do pedido
                    </p>
                    <p className="text-2xl font-bold">
                      {formatCurrency(
                        computeTotalWithDelivery(selectedOrder),
                        menu?.currency,
                      )}
                    </p>
                    {computeDiscount(selectedOrder) > 0 ? (
                      <p className="text-xs text-green-500">
                        Desconto aplicado: -
                        {formatCurrency(
                          computeDiscount(selectedOrder),
                          menu?.currency,
                        )}
                      </p>
                    ) : null}
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
      {printOrderModalOpen && (
        <PrintOrderModal canSave={canCustomize} onClose={() => setPrintOrderModalOpen(false)} />
      )}

      {printUpsell && (
        <UpdatePlanModal
          onClose={() => setPrintUpsell(false)}
          title="Impressão de pedidos"
          plan="pro"
          text="Imprima cada pedido com um clique e mande direto pra cozinha. Também libera o dashboard e o relatório de vendas."
        />
      )}
    </div>
  );
};

export default Orders;
