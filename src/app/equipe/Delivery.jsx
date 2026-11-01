"use client";

import { useEffect, useState } from "react";
import { FaChevronLeft, FaMapMarkerAlt, FaPhoneAlt, FaSyncAlt } from "react-icons/fa";
import { supabase } from "@/lib/supabaseClient";
import { useAlert } from "@/providers/AlertProvider";
import { formatCurrency } from "@/lib/formatCurrency";
import { ORDER_STATUS } from "@/lib/staff";
import { mapsUrl } from "@/components/AddressFields";
import { normalizeOrderForPrint, paymentLabels } from "@/app/dashboard/tabs/components/print/PrintDocumentButton";
import Loading from "@/components/Loading";

// Entregas: pedidos de delivery ainda não entregues, mais antigos primeiro. Aparecem desde o recebimento;
// com a tela da cozinha ligada, "Saí para entrega" só libera depois que a cozinha marca "Pronto".
// Usada no login do entregador (/equipe, com courierId) e pelo dono no dashboard (onBack volta pros Pedidos).
// O entregador vê só as entregas atribuídas a ele (com um único entregador, o banco atribui tudo a ele).
export default function Delivery({ menu, reloadTrigger, onBack, courierId }) {
  const customAlert = useAlert();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data, error } = await supabase
      .from("orders")
      .select(
        "id, order_number, created_at, service, costumer_name, costumer_phone, neighborhood, address, payment_method, is_paid, change_requested, change_for_amount, items_list, delivery_fee, discount, status, assigned_to",
      )
      .eq("menu_id", menu.id)
      .eq("service", "delivery")
      .in("status", ["received", "preparing", "ready", "out_for_delivery"])
      .or("payment_method.neq.stripe,is_paid.eq.true") // oculta pedidos Stripe enquanto não pagos
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Erro ao buscar entregas:", error);
      customAlert("Erro ao carregar entregas.", "error");
    } else {
      // filtro de atribuição no cliente: é organização, não segurança (todos são do mesmo estabelecimento)
      setOrders((data || []).filter((o) => !courierId || o.assigned_to === courierId));
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    // a contagem da página não pega mudança de status feita em outro aparelho
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [menu.id, reloadTrigger]);

  const setStatus = async (order, status) => {
    const { error } = await supabase.from("orders").update({ status }).eq("id", order.id);
    if (error) return customAlert("Erro ao atualizar entrega.", "error");

    setOrders((prev) =>
      status === "delivered"
        ? prev.filter((o) => o.id !== order.id)
        : prev.map((o) => (o.id === order.id ? { ...o, status } : o)),
    );
    if (status === "delivered") customAlert("Entrega concluída!", "success");
  };

  if (loading) return <Loading />;

  return (
    <div className="px-4">
      <div className="mb-4 flex items-center gap-3">
        {onBack && (
          <button
            type="button"
            className="p-2 rounded-lg hover:bg-[var(--translucid)] transition cursor-pointer"
            onClick={onBack}
            aria-label="Voltar"
          >
            <FaChevronLeft />
          </button>
        )}
        <h2 className="text-xl font-semibold">Entregas</h2>
        <button
          type="button"
          className="cursor-pointer rounded-full p-2 opacity-80 transition hover:opacity-100"
          onClick={load}
          title="Atualizar entregas"
        >
          <FaSyncAlt />
        </button>
      </div>

      {orders.length === 0 ? (
        <p className="p-6 text-center color-gray">Nenhuma entrega no momento.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {orders.map((order) => {
            const onTheWay = order.status === "out_for_delivery";
            const inKitchen = menu.kitchen_enabled === true && ["received", "preparing"].includes(order.status);
            const { total } = normalizeOrderForPrint(order);
            return (
              <div
                key={order.id}
                className={`rounded-2xl border-2 bg-translucid p-4 shadow-sm flex flex-col gap-3 ${
                  onTheWay ? "border-blue-500/60" : "border-translucid"
                }`}
              >
                <div className="flex items-start justify-between gap-2 border-b-2 border-[var(--translucid)] pb-2">
                  <div className="min-w-0">
                    <p className="text-lg font-bold">Nº {order.order_number ?? "—"}</p>
                    <p className="text-xs color-gray">Pedido #{order.id.slice(0, 6)}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold">
                      {new Date(order.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                    <p className="text-xs color-gray">{ORDER_STATUS[order.status]}</p>
                  </div>
                </div>

                <div className="flex-1 space-y-2 text-sm">
                  <p className="font-semibold text-base">{order.costumer_name || "Cliente"}</p>

                  {order.address ? (
                    <a
                      href={mapsUrl(order.address)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-start gap-2 underline"
                    >
                      <FaMapMarkerAlt className="mt-0.5 shrink-0" />
                      <span>
                        {order.address}
                        {order.neighborhood ? ` · ${order.neighborhood}` : ""}
                      </span>
                    </a>
                  ) : (
                    <p className="color-gray">Endereço não informado</p>
                  )}

                  {order.costumer_phone && (
                    <a href={`tel:${order.costumer_phone}`} className="flex items-center gap-2 underline">
                      <FaPhoneAlt className="shrink-0" /> {order.costumer_phone}
                    </a>
                  )}

                  <div className="rounded-xl bg-[var(--translucid)] p-2">
                    <p>
                      <strong>{formatCurrency(total, menu.currency)}</strong> ·{" "}
                      {paymentLabels[order.payment_method] || "Pagamento não informado"}
                    </p>
                    <p className={order.is_paid ? "text-green-500" : "text-yellow-500"}>
                      {order.is_paid ? "Já pago" : "Não pago"}
                    </p>
                    {order.change_requested && (
                      <p>Troco para {formatCurrency(order.change_for_amount, menu.currency)}</p>
                    )}
                  </div>
                </div>

                {inKitchen ? (
                  <p className="w-full py-3 rounded-lg bg-[var(--translucid)] text-center font-semibold color-gray">
                    Em preparo na cozinha
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={() => setStatus(order, onTheWay ? "delivered" : "out_for_delivery")}
                    className={`cursor-pointer w-full py-3 rounded-lg text-white font-semibold transition ${
                      onTheWay ? "bg-green-600 hover:bg-green-700" : "bg-blue-600 hover:bg-blue-700"
                    }`}
                  >
                    {onTheWay ? "Entregue" : "Saí para entrega"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
