"use client";

import { useEffect, useState, useMemo } from "react";
import useMenu from "@/hooks/useMenu";
import { useAlert } from "@/providers/AlertProvider";
import { supabase } from "@/lib/supabaseClient";
import Loading from "@/components/Loading";
import { FaCheck, FaTrash, FaMoneyBill, FaChevronLeft } from "react-icons/fa";
import GenericModal from "@/components/GenericModal";
import { useConfirm } from "@/providers/ConfirmProvider";
import OrdersFilter from "./components/OrdersFilter"; // import do filtro

const Orders = ({ setSelectedTab }) => {
  const { menu, loading } = useMenu();
  const customAlert = useAlert();
  const confirm = useConfirm();

  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [filters, setFilters] = useState({});
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    if (!menu?.id) return;
    fetchOrders();

    const channel = supabase
      .channel("orders-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, (payload) => {
        if (payload.new?.menu_id === menu.id) fetchOrders();
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [menu?.id]);

  const fetchOrders = async () => {
    setLoadingOrders(true);
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("menu_id", menu.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      customAlert("Erro ao carregar pedidos", "error");
    } else {
      setOrders(data || []);
    }
    setLoadingOrders(false);
  };

  const togglePaid = async (id, current) => {
    const { error } = await supabase.from("orders").update({ is_paid: !current }).eq("id", id);
    if (error) return customAlert("Erro ao atualizar pagamento", "error");
    fetchOrders();
  };

  const finalizeOrder = async (id) => {
    const ok = await confirm("Quer mesmo finalizar esse pedido?");
    if (!ok) return;
    const { error } = await supabase.from("orders").delete().eq("id", id);
    if (error) return customAlert("Erro ao excluir pedido", "error");
    fetchOrders();
  };

  const deleteOrder = async (id) => {
    const ok = await confirm("Quer mesmo excluir esse pedido?");
    if (!ok) return;
    const { error } = await supabase.from("orders").delete().eq("id", id);
    if (error) return customAlert("Erro ao excluir pedido", "error");
    fetchOrders();
  };

  const openOrderModal = (order) => {
    setSelectedOrder(order);
    setOrderModalOpen(true);
  };

  const computeTotal = (order) => {
    if (!order) return 0;
    const items = order.items_list || [];
    return items.reduce((acc, it) => {
      const itemBase = (Number(it.price) || 0) * (Number(it.qty) || 0);
      const adds = (it.additionals || []).reduce((sa, a) => sa + (Number(a.price) || 0), 0);
      return acc + itemBase + adds;
    }, 0);
  };

  // --- AQUI ESTÁ A FILTRAGEM LOCAL ---
  const filteredOrders = useMemo(() => {
    let list = [...orders];

    // FILTRO isPaid
    if (filters.isPaid === true) {
      list = list.filter((o) => o.is_paid === true);
    } else if (filters.isPaid === false) {
      list = list.filter((o) => o.is_paid === false);
    }

    // FILTRO deliveryType
    if (filters.deliveryType && filters.deliveryType !== "all") {
      list = list.filter((o) => o.service === filters.deliveryType);
    }

    // FILTRO payment
    if (filters.payment && filters.payment !== "all") {
      list = list.filter((o) => o.payment_method === filters.payment);
    }

    // FILTRO de busca
    if (filters.search && filters.search.trim() !== "") {
      const term = filters.search.toLowerCase();
      list = list.filter(
        (o) =>
          o.costumer_name?.toLowerCase().includes(term) ||
          o.items_list?.some((it) => it.name.toLowerCase().includes(term)) ||
          o.id?.toString().includes(term)
      );
    }

    // FILTRO de datas
    if (filters.dateFrom) {
      const from = new Date(filters.dateFrom);
      list = list.filter((o) => new Date(o.created_at) >= from);
    }
    if (filters.dateTo) {
      const to = new Date(filters.dateTo);
      list = list.filter((o) => new Date(o.created_at) <= to);
    }

    // ORDENAÇÃO sempre crescente
    if (filters.sortBy) {
      list.sort((a, b) => {
        // ignoramos sortDir, sempre crescente
        if (filters.sortBy === "total") return (a.total || 0) - (b.total || 0);
        if (filters.sortBy === "customer_name") return (a.costumer_name || "").localeCompare(b.costumer_name || "");
        if (filters.sortBy === "created_at") return new Date(a.created_at) - new Date(b.created_at);
        return 0;
      });
    }

    return list;
  }, [orders, filters]);
  // --- FIM DA FILTRAGEM LOCAL ---

  if (loading || loadingOrders) return <Loading />;
  if (!menu) return <p>Você ainda não criou seu cardápio.</p>;

  return (
    <div className="px-2 lg:grid">
      <div className="md:m-auto lg:m-2 lg:w-[calc(70dvw-256px)] max-w-[768px] min-h-[calc(100dvh-110px)] rounded-lg overflow-y-auto">
        <h2 className="text-2xl font-bold mb-2">Pedidos Recebidos</h2>
        <OrdersFilter onChange={setFilters} />

        {filteredOrders.length === 0 ? (
          <p className="text-center color-gray p-6">Nenhum pedido encontrado com esses filtros.</p>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <div key={order.id} className="p-4 rounded-lg shadow-sm bg-low-gray flex flex-col xs:flex-row justify-between">
                <div>
                  <h3 className="font-bold text-lg line-clamp-1">{order.costumer_name || "Cliente"}</h3>
                  <span className="text-sm color-gray xs:hidden">{new Date(order.updated_at).toLocaleString("pt-BR")}</span>
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
                  </p>
                  {order.address && (
                    <p className="text-sm color-gray mt-1 line-clamp-1">
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
                  <p className="mt-2 font-semibold text-lg">Total: R$ {Number(order.total || 0).toFixed(2)}</p>
                </div>

                <div className="mt-2 flex flex-col justify-between items-start xs:items-end">
                  <span className="text-sm color-gray hidden xs:block">
                    {new Date(order.updated_at).toLocaleString("pt-BR")}
                  </span>
                  <div className="grid grid-rows-2 w-full xs:flex xs:flex-col gap-2">
                    <div className="grid grid-cols-2 xs:flex xs:flex-col gap-2">
                      <button
                        onClick={() => openOrderModal(order)}
                        className="w-full cursor-pointer px-3 py-2 rounded-lg flex items-center justify-center gap-2 text-sm font-medium bg-translucid border hover:opacity-100 opacity-75 transition"
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
          </div>
        )}
      </div>

      {/* Sidebar */}
      <aside className="hidden p-2 m-2 fixed right-0 rounded-lg bg-translucid w-[calc(30dvw-36px)] shadow-[0_0_10px_var(--shadow)] lg:flex flex-col h-[calc(100dvh-110px)] justify-between">
        <div className="p-4">
          <h3 className="font-bold mb-2">Resumo</h3>
          <p>Total de pedidos: {filteredOrders.length}</p>
          <p>
            Total pago: R${" "}
            {filteredOrders
              .filter((o) => o.is_paid)
              .reduce((sum, o) => sum + (Number(o.total) || 0), 0)
              .toFixed(2)}
          </p>
          <p>
            Total pendente: R${" "}
            {filteredOrders
              .filter((o) => !o.is_paid)
              .reduce((sum, o) => sum + (Number(o.total) || 0), 0)
              .toFixed(2)}
          </p>
        </div>
        <div className="p-4">
          <button
            onClick={() => fetchOrders()}
            className="cursor-pointer w-full bg-translucid border text-white py-2 rounded-lg opacity-75 hover:opacity-100 transition"
          >
            Atualizar pedidos
          </button>
        </div>
      </aside>
      {orderModalOpen && selectedOrder && (
        <GenericModal onClose={() => setOrderModalOpen(false)}>
          <div className="max-h-[90vh] sm:max-h-[80vh] w-[min(900px,90vw)] overflow-y-auto scrollbar-none space-y-4">
            <div className="flex items-center gap-4 mb-2 sticky top-0 bg-low-gray pb-2">
              <div onClick={() => setOrderModalOpen(false)}>
                <FaChevronLeft />
              </div>
              <h2 className="text-xl font-bold">Detalhes do pedido</h2>
            </div>

            <form
              className="space-y-3"
              onSubmit={async (e) => {
                e.preventDefault();
                const total = computeTotal(selectedOrder);
                const payload = { ...selectedOrder, total };
                const { error } = await supabase.from("orders").update(payload).eq("id", selectedOrder.id);
                if (error) return customAlert("Erro ao atualizar pedido", "error");
                customAlert("Pedido atualizado com sucesso!", "success");
                setOrderModalOpen(false);
                fetchOrders();
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
                              step="1"
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
                            step="1"
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
                  <p className="font-semibold">Total: R$ {computeTotal(selectedOrder).toFixed(2)}</p>
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
                      fetchOrders();
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
