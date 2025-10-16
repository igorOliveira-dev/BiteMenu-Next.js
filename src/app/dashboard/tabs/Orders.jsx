"use client";

import { useEffect, useState } from "react";
import useMenu from "@/hooks/useMenu";
import { useAlert } from "@/providers/AlertProvider";
import { supabase } from "@/lib/supabaseClient";
import Loading from "@/components/Loading";
import { FaCheck, FaTimes, FaMoneyBill, FaTrash } from "react-icons/fa";

const Orders = ({ setSelectedTab }) => {
  const { menu, loading } = useMenu();
  const customAlert = useAlert();
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  useEffect(() => {
    if (!menu?.id) return;
    fetchOrders();

    // Realtime update (opcional)
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
      setOrders(data);
    }
    setLoadingOrders(false);
  };

  const togglePaid = async (id, current) => {
    const { error } = await supabase.from("orders").update({ is_paid: !current }).eq("id", id);
    if (error) return customAlert("Erro ao atualizar pagamento", "error");
    fetchOrders();
  };

  const finalizeOrder = async (id) => {
    const { error } = await supabase.from("orders").update({ status: "finalizado" }).eq("id", id);
    if (error) return customAlert("Erro ao finalizar pedido", "error");
    fetchOrders();
  };

  const deleteOrder = async (id) => {
    if (!confirm("Tem certeza que deseja excluir este pedido?")) return;
    const { error } = await supabase.from("orders").delete().eq("id", id);
    if (error) return customAlert("Erro ao excluir pedido", "error");
    fetchOrders();
  };

  if (loading || loadingOrders) return <Loading />;
  if (!menu) return <p>Você ainda não criou seu cardápio.</p>;

  return (
    <div className="px-2 lg:grid">
      <div className="md:m-auto lg:m-2 lg:w-[calc(70dvw-256px)] max-w-[768px] min-h-[calc(100dvh-110px)] bg-translucid rounded-lg overflow-y-auto">
        <div className="p-4 flex justify-between items-center sticky top-0 bg-translucid z-10">
          <h2 className="text-2xl font-bold">Pedidos Recebidos</h2>
        </div>

        {orders.length === 0 ? (
          <p className="text-center text-gray-500 p-6">Nenhum pedido recebido ainda.</p>
        ) : (
          <div className="p-4 space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="p-4 rounded-lg shadow-sm bg-translucid">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-bold text-lg">{order.costumer_name || "Cliente"}</h3>
                  <span className="text-sm color-gray">{new Date(order.created_at).toLocaleString("pt-BR")}</span>
                </div>

                <p className="text-sm color-gray">
                  <strong>Método:</strong> {order.payment_method || "Não informado"} <br />
                  <strong>Serviço:</strong> {order.service || "N/A"}
                </p>

                {order.address && (
                  <p className="text-sm color-gray mt-1">
                    <strong>Endereço:</strong> {order.address}
                  </p>
                )}

                <ul className="mt-2 text-sm">
                  {order.items_list?.map((item, i) => (
                    <li key={i}>
                      • {item.qty}x {item.name} — R$ {(item.price * item.qty).toFixed(2)}
                    </li>
                  ))}
                </ul>

                <p className="mt-3 font-semibold text-right text-lg">Total: R$ {Number(order.total || 0).toFixed(2)}</p>

                <div className="mt-3 flex justify-between items-center">
                  <button
                    onClick={() => togglePaid(order.id, order.is_paid)}
                    className={`px-3 py-2 rounded-lg flex items-center gap-2 text-sm font-medium ${
                      order.is_paid ? "bg-green-600 text-white" : "bg-yellow-500 text-black hover:bg-yellow-600"
                    }`}
                  >
                    <FaMoneyBill />
                    {order.is_paid ? "Pago" : "Marcar como pago"}
                  </button>

                  <div className="flex gap-2">
                    {order.status !== "finalizado" && (
                      <button
                        onClick={() => finalizeOrder(order.id)}
                        className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm flex items-center gap-2 hover:bg-blue-700"
                      >
                        <FaCheck /> Finalizar
                      </button>
                    )}
                    <button
                      onClick={() => deleteOrder(order.id)}
                      className="px-3 py-2 bg-red-600 text-white rounded-lg text-sm flex items-center gap-2 hover:bg-red-700"
                    >
                      <FaTrash /> Excluir
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sidebar */}
      <aside className="hidden p-2 pt-4 m-2 fixed right-0 rounded-lg bg-translucid w-[calc(30dvw-36px)] shadow-[0_0_10px_var(--shadow)] lg:flex flex-col h-[calc(100dvh-110px)] justify-between">
        <div className="p-4">
          <h3 className="font-bold mb-2">Resumo</h3>
          <p>Total de pedidos: {orders.length}</p>
          <p>
            Total pago: R${" "}
            {orders
              .filter((o) => o.is_paid)
              .reduce((sum, o) => sum + (Number(o.total) || 0), 0)
              .toFixed(2)}
          </p>
          <p>
            Total pendente: R${" "}
            {orders
              .filter((o) => !o.is_paid)
              .reduce((sum, o) => sum + (Number(o.total) || 0), 0)
              .toFixed(2)}
          </p>
        </div>

        <div className="p-4">
          <button
            onClick={() => fetchOrders()}
            className="cursor-pointer w-full bg-gray-700 text-white py-2 rounded-lg hover:bg-gray-800 transition"
          >
            Atualizar pedidos
          </button>
        </div>
      </aside>
    </div>
  );
};

export default Orders;
