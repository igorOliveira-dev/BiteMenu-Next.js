"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import useMenu from "@/hooks/useMenu";
import { useAlert } from "@/providers/AlertProvider";
import { supabase } from "@/lib/supabaseClient";
import Loading from "@/components/Loading";
import { FaCheck, FaTrash, FaMoneyBill, FaChevronLeft, FaChevronDown, FaSyncAlt } from "react-icons/fa";
import GenericModal from "@/components/GenericModal";
import { useConfirm } from "@/providers/ConfirmProvider";
import OrdersFilter from "./components/OrdersFilter";

const Orders = ({ setSelectedTab }) => {
  const { menu, loading } = useMenu();
  const customAlert = useAlert();
  const confirm = useConfirm();

  const [showConfig, setShowConfig] = useState(false);

  const PAGE_SIZE = 10;
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

  useEffect(() => {
    if (!menu?.id) return;
    resetAndFetch();
  }, [menu?.id]);

  const filtersKey = useMemo(() => JSON.stringify(filters), [filters]);

  useEffect(() => {
    if (!menu?.id) return;
    resetAndFetch();
  }, [menu?.id, filtersKey]);

  useEffect(() => {
    if (menu?.orders) {
      setReceiveOrders(menu.orders);
      if (menu.orders === "site_whatsapp" || menu.orders === "site") {
        setEnabledOrders(true);
      } else {
        setEnabledOrders(false);
      }
    }
  }, [menu?.orders]);

  useEffect(() => {
    if (menu?.delivery_fee_on_sales !== undefined) {
      setDeliveryFeeOnSales(menu.delivery_fee_on_sales);
    }
  }, [menu?.delivery_fee_on_sales]);

  const matchesItem = (order, term) => {
    const t = term.toLowerCase();
    return (order.items_list || []).some((it) => (it.name || "").toLowerCase().includes(t));
  };

  const resetAndFetch = async () => {
    setOrders([]);
    setPage(0);
    setHasMore(true);
    loadingRef.current = false;
    await fetchMore(true);
  };

  const hasMoreRef = useRef(true);

  useEffect(() => {
    hasMoreRef.current = hasMore;
  }, [hasMore]);

  const pageRef = useRef(0);
  const loadingRef = useRef(false);

  useEffect(() => {
    pageRef.current = page;
  }, [page]);

  const fetchMore = async (isReset = false) => {
    if (!menu?.id) return;
    if (!hasMoreRef.current && !isReset) return;
    if (loadingRef.current) return;

    loadingRef.current = true;
    // setLoadingOrders(true);

    const nextPage = isReset ? 1 : pageRef.current + 1;
    const from = (nextPage - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const q = buildOrdersQuery(filters).range(from, to);

    const { data, error, count } = await q;

    if (error) {
      loadingRef.current = false;
      setLoadingOrders(false);
    }

    setTotalCount(count || 0);

    const withTotal = (data || []).map((order) => ({
      ...order,
      total: computeSubtotal(order),
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

  const buildOrdersQuery = (filters) => {
    let q = supabase.from("orders").select("*", { count: "exact" }).eq("menu_id", menu.id);

    // isPaid
    if (filters.isPaid === true) q = q.eq("is_paid", true);
    if (filters.isPaid === false) q = q.eq("is_paid", false);

    // deliveryType (service)
    if (filters.deliveryType && filters.deliveryType !== "all") {
      q = q.eq("service", filters.deliveryType);
    }

    // payment
    if (filters.payment && filters.payment !== "all") {
      q = q.eq("payment_method", filters.payment);
    }

    // datas (created_at)
    if (filters.dateFrom) q = q.gte("created_at", new Date(filters.dateFrom).toISOString());
    if (filters.dateTo) q = q.lte("created_at", new Date(filters.dateTo).toISOString());

    // busca (nome/telefone/id) — itens_list é um caso à parte (já falo abaixo)
    if (filters.search && filters.search.trim() !== "") {
      const term = filters.search.trim();

      // se for número, tenta bater com id também
      const maybeId = Number(term);
      const ors = [`costumer_name.ilike.%${term}%`, `costumer_phone.ilike.%${term}%`];

      q = q.or(ors.join(","));
    }

    return q;
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
  };

  const handleToggleDeliveryFeeOnSales = async (value) => {
    setDeliveryFeeOnSales(value);

    const { error } = await supabase.from("menus").update({ delivery_fee_on_sales: value }).eq("id", menu.id);

    if (error) {
      customAlert("Erro ao atualizar configuração da taxa de entrega.", "error");
      setDeliveryFeeOnSales(!value); // rollback visual
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

    const deliveryFee = deliveryFeeOnSales && order.service === "delivery" ? menu.delivery_fee : null;

    const saleTotal = order.total + (deliveryFee || 0);

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
    return Number(menu?.delivery_fee) || 0;
  };

  const computeTotalWithDelivery = (order) => {
    const subtotal = computeSubtotal(order);
    const delivery = computeDeliveryFee(order);
    return subtotal + delivery;
  };

  if (loading || loadingOrders) return <Loading />;
  if (!menu) return <p>Você ainda não criou seu cardápio.</p>;

  return (
    <div className="px-4 sm:px-2 lg:grid">
      <div className="md:m-auto lg:m-2 lg:w-[calc(70dvw-256px)] max-w-[812px] min-h-[calc(100dvh-110px)] rounded-lg overflow-y-auto">
        <div className="flex items-center gap-4 mb-2">
          <h2 className="text-2xl font-bold">Pedidos recebidos</h2>
          <FaSyncAlt className="cursor-pointer opacity-80 hover:opacity-100 transition" onClick={() => resetAndFetch()} />
        </div>

        <button onClick={() => setShowConfig(!showConfig)} className="cursor-pointer flex items-center gap-2 color-gray z-2">
          Configurar pedidos <FaChevronDown />
        </button>

        <div
          className={`${
            showConfig ? "p-2 h-auto border-2" : "p-0 h-0"
          } max-w-[calc(100%-6px)] border-translucid overflow-hidden flex flex-col gap-1 rounded-b-lg`}
        >
          <p>Receber pedidos:</p>

          <label className="flex gap-2 items-center">
            <input
              type="radio"
              name="orders"
              value="site_whatsapp"
              checked={receiveOrders === "site_whatsapp"}
              onChange={() => handleChangeOrders("site_whatsapp")}
            />
            <span>No site e no WhatsApp</span>
          </label>

          <label className="flex gap-2 items-center">
            <input
              type="radio"
              name="orders"
              value="whatsapp"
              checked={receiveOrders === "whatsapp"}
              onChange={() => handleChangeOrders("whatsapp")}
            />
            <span>Apenas no WhatsApp</span>
          </label>

          <label className="flex gap-2 items-center">
            <input
              type="radio"
              name="orders"
              value="none"
              checked={receiveOrders === "none"}
              onChange={() => handleChangeOrders("none")}
            />
            <span>Não receber pedidos</span>
          </label>
          <hr className="border-translucid my-2" />

          <p>Taxa de entrega:</p>

          <label className="flex gap-2 items-center">
            <input
              type="checkbox"
              checked={deliveryFeeOnSales}
              onChange={(e) => handleToggleDeliveryFeeOnSales(e.target.checked)}
            />
            <span>Contar taxa de entrega como venda</span>
          </label>

          <p className="text-xs color-gray">Se ativado, a taxa de entrega será somada ao total das vendas registradas.</p>
        </div>

        {enabledOrders === false ? (
          <p className="text-center color-gray p-6">Os pedidos no site estão desabilitados.</p>
        ) : (
          <div>
            <OrdersFilter onChange={setFilters} />
            {orders.length === 0 ? (
              <p className="text-center color-gray p-6">Nenhum pedido encontrado com esses filtros.</p>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="p-4 rounded-lg shadow-sm bg-translucid border-2 border-translucid flex flex-col xs:flex-row justify-between"
                  >
                    <div>
                      <h3 className="font-bold text-lg line-clamp-1">{order.costumer_name || "Cliente"}</h3>
                      <span className="text-sm color-gray xs:hidden">
                        {new Date(order.updated_at).toLocaleString("pt-BR")}
                      </span>
                      <p className="text-sm color-gray">
                        <span className="line-clamp-1">
                          <strong>Método:</strong>{" "}
                          {order.payment_method === "pix"
                            ? "Pix"
                            : order.payment_method === "debit"
                              ? "Débito"
                              : order.payment_method === "credit"
                                ? "Crédito"
                                : order.payment_method === "cash"
                                  ? "Dinheiro"
                                  : "Não informado"}
                        </span>
                        <span className="line-clamp-1">
                          <strong>Serviço:</strong>{" "}
                          {order.service === "delivery"
                            ? "Entrega"
                            : order.service === "pickup"
                              ? "Retirada"
                              : order.service === "dinein"
                                ? "No local"
                                : order.service === "faceToFace"
                                  ? "Atendimento presencial"
                                  : "Não informado"}
                        </span>
                        <span className="text-sm color-gray">
                          <strong>Telefone:</strong> {order.costumer_phone}
                        </span>
                      </p>
                      {order.address && (
                        <p className="text-sm color-gray line-clamp-1">
                          <strong>Endereço:</strong> {order.address}
                        </p>
                      )}
                      <ul className="mt-2 text-sm">
                        {order.items_list?.slice(0, 4).map((item, i) => (
                          <li key={i} className="line-clamp-1">
                            • {item.qty}x {item.name} — R$ {(item.price * item.qty).toFixed(2)}
                          </li>
                        ))}
                        {order.items_list?.length > 4 && <li className="text-gray-400">...</li>}
                      </ul>
                      {order.service === "delivery" && (
                        <>
                          <p className="text-sm color-gray">
                            <strong>Subtotal:</strong> R$ {computeSubtotal(order).toFixed(2)}
                          </p>
                          <p className="text-sm color-gray">
                            <strong>Taxa de entrega:</strong> R$ {computeDeliveryFee(order).toFixed(2)}
                          </p>
                        </>
                      )}

                      <p className="mt-2 font-semibold text-lg">Total: R$ {computeTotalWithDelivery(order).toFixed(2)}</p>
                    </div>

                    <div className="mt-2 flex flex-col justify-between items-start xs:items-end">
                      <span className="text-sm color-gray hidden xs:block">
                        {new Date(order.updated_at).toLocaleString("pt-BR")}
                      </span>
                      <div className="grid grid-rows-2 w-full xs:flex xs:flex-col gap-2">
                        <div className="grid grid-cols-2 xs:flex xs:flex-col gap-2">
                          <button
                            onClick={() => openOrderModal(order)}
                            className="w-full cursor-pointer px-3 py-2 rounded-lg flex items-center justify-center gap-2 text-sm font-medium bg-translucid border-2 border-translucid hover:opacity-80 opacity-100 transition"
                          >
                            Detalhes
                          </button>
                          <button
                            onClick={() => togglePaid(order.id, order.is_paid)}
                            className={`w-full cursor-pointer px-3 py-2 rounded-lg flex items-center justify-center gap-2 text-xs xxs:text-sm font-medium ${
                              order.is_paid ? "bg-green-600 text-white" : "bg-yellow-500 text-black hover:bg-yellow-600"
                            }`}
                          >
                            <FaMoneyBill />
                            {order.is_paid ? "Pago" : "Marcar como pago"}
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => finalizeOrder(order.id)}
                            className="w-full xs:w-auto cursor-pointer px-3 py-2 bg-blue-600 text-white rounded-lg text-sm flex items-center justify-center gap-2 hover:bg-blue-700"
                          >
                            <FaCheck /> Finalizar
                          </button>
                          <button
                            onClick={() => deleteOrder(order.id)}
                            className="w-full xs:w-auto cursor-pointer px-3 py-2 bg-red-600 text-white rounded-lg text-sm flex items-center justify-center gap-2 hover:bg-red-700"
                          >
                            <FaTrash /> Excluir
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                <div className="flex justify-center py-4">
                  {hasMore ? (
                    <button
                      onClick={() => fetchMore()}
                      disabled={loadingOrders}
                      className="px-4 py-2 rounded-lg border-2 border-translucid bg-translucid hover:opacity-80 transition cursor-pointer"
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

      {/* Sidebar */}

      {enabledOrders ? (
        <aside className="hidden p-2 m-2 fixed right-0 rounded-lg bg-translucid border-2 border-translucid w-[calc(30dvw-36px)] shadow-[0_0_10px_var(--shadow)] lg:flex flex-col h-[calc(100dvh-110px)] justify-between">
          <div className="p-4">
            <h3 className="font-bold mb-2">Resumo</h3>
            <p>Total de pedidos: {totalCount}</p>
            <p>
              Total pago: R${" "}
              {orders
                .filter((o) => o.is_paid)
                .reduce((sum, o) => sum + computeTotalWithDelivery(o), 0)
                .toFixed(2)}
            </p>
            <p>
              Total pendente: R${" "}
              {orders
                .filter((o) => !o.is_paid)
                .reduce((sum, o) => sum + computeTotalWithDelivery(o), 0)
                .toFixed(2)}
            </p>
          </div>
        </aside>
      ) : null}

      {orderModalOpen && selectedOrder && (
        <GenericModal onClose={() => setOrderModalOpen(false)}>
          <div className="max-h-[90vh] sm:max-h-[80vh] w-[min(900px,90vw)] overflow-y-auto scrollbar-none space-y-4">
            <div className="flex items-center gap-4 mb-2 sticky top-0 bg-low-gray pb-2">
              <div onClick={() => setOrderModalOpen(false)}>
                <FaChevronLeft className="cursor-pointer" />
              </div>
              <h2 className="text-xl font-bold">Detalhes do pedido</h2>
            </div>

            <form
              className="space-y-3"
              onSubmit={async (e) => {
                e.preventDefault();
                const subtotal = computeSubtotal(selectedOrder);
                const payload = { ...selectedOrder, total: subtotal };
                const { error } = await supabase.from("orders").update(payload).eq("id", selectedOrder.id);
                if (error) return customAlert("Erro ao atualizar pedido", "error");
                customAlert("Pedido atualizado com sucesso!", "success");
                setOrderModalOpen(false);
                resetAndFetch();
              }}
            >
              <div className="flex flex-col gap-3">
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-semibold mb-1">Nome do Cliente</label>
                    <input
                      type="text"
                      className="input w-full bg-translucid p-2 rounded"
                      value={selectedOrder.costumer_name || ""}
                      onChange={(e) => setSelectedOrder({ ...selectedOrder, costumer_name: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-1">Telefone</label>
                    <input
                      type="text"
                      className="input w-full bg-translucid p-2 rounded"
                      value={selectedOrder.costumer_phone || ""}
                      onChange={(e) => setSelectedOrder({ ...selectedOrder, costumer_phone: e.target.value })}
                    />
                  </div>
                </div>

                {selectedOrder.address && (
                  <div>
                    <label className="block text-sm font-semibold mb-1">Endereço</label>
                    <input
                      type="text"
                      className="input w-full bg-translucid p-2 rounded"
                      value={selectedOrder.address || ""}
                      onChange={(e) => setSelectedOrder({ ...selectedOrder, address: e.target.value })}
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 gap-2 xs:grid-cols-2">
                  <div>
                    <label className="block text-sm font-semibold mb-1">Serviço</label>
                    <select
                      className="input w-full bg-translucid p-2 rounded"
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
                    <label className="block text-sm font-semibold mb-1">Método de Pagamento</label>
                    <select
                      className="input w-full bg-translucid p-2 rounded"
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
                <hr className="border-translucid" />
              </div>

              {/* Itens */}
              <div className="mt-8">
                <label className="block text-lg font-semibold mb-2">Itens</label>

                {(selectedOrder.items_list || []).map((item, i) => (
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
                              const updated = [...selectedOrder.items_list];
                              updated[i] = { ...updated[i], name: e.target.value };
                              setSelectedOrder({ ...selectedOrder, items_list: updated });
                            }}
                            placeholder="Nome do item"
                          />

                          <button
                            type="button"
                            onClick={() => {
                              const updated = [...(selectedOrder.items_list || [])];
                              updated.splice(i, 1);
                              setSelectedOrder({ ...selectedOrder, items_list: updated });
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
                                const updated = [...selectedOrder.items_list];
                                updated[i] = { ...updated[i], qty: Number(e.target.value) || 0 };
                                setSelectedOrder({ ...selectedOrder, items_list: updated });
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
                                const updated = [...selectedOrder.items_list];
                                updated[i] = { ...updated[i], price: value === "" ? null : Number(value) };
                                setSelectedOrder({ ...selectedOrder, items_list: updated });
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
                          const updated = [...selectedOrder.items_list];
                          updated[i] = { ...updated[i], note: e.target.value };
                          setSelectedOrder({ ...selectedOrder, items_list: updated });
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
                            const updated = [...(selectedOrder.items_list || [])];
                            const additionals = updated[i].additionals ? [...updated[i].additionals] : [];
                            additionals.push({ name: "", price: 0 });
                            updated[i] = { ...updated[i], additionals };
                            setSelectedOrder({ ...selectedOrder, items_list: updated });
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
                            className="input w-12 xs:w-28 text-sm bg-translucid p-2 rounded"
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
                      setSelectedOrder({
                        ...selectedOrder,
                        items_list: [
                          ...(selectedOrder.items_list || []),
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
                <div className="flex justify-between items-center pt-4">
                  <p className="font-semibold">Total: R$ {computeTotalWithDelivery(selectedOrder).toFixed(2)}</p>
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
                      // opcional: desfazer mudanças recarregando do servidor
                      resetAndFetch();
                      setOrderModalOpen(false);
                    }}
                    className="w-32 py-2 rounded-lg mt-3 border"
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

export default Orders;
