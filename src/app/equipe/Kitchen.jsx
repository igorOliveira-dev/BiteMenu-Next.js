"use client";

import { useEffect, useRef, useState } from "react";
import { FaChevronLeft, FaSyncAlt, FaUndo } from "react-icons/fa";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { supabase } from "@/lib/supabaseClient";
import { useAlert } from "@/providers/AlertProvider";
import { ORDER_STATUS } from "@/lib/staff";
import { serviceLabels } from "@/app/dashboard/tabs/components/print/PrintDocumentButton";
import Loading from "@/components/Loading";

// Próxima etapa de cada status; "ready" sai da fila da cozinha
const NEXT = {
  received: {
    status: "preparing",
    label: "Começar preparo",
    className: "bg-blue-600 hover:bg-blue-700",
  },
  preparing: {
    status: "ready",
    label: "Pronto",
    className: "bg-green-600 hover:bg-green-700",
  },
};

// Altura aproximada do card, pra mandar cada pedido pra coluna mais baixa.
// ponytail: estimativa pelo conteúdo (não mede o DOM); medir com ref se o encaixe ficar ruim
const estimateHeight = (order) =>
  130 +
  (order.items_list || []).reduce(
    (sum, item) =>
      sum +
      28 +
      ((item.additionals || []).length ? 20 : 0) +
      (item.note ? 20 : 0),
    0,
  );

// Colunas pela largura da área (não da janela): no dashboard do dono tem a barra lateral
const columnsFor = (width) => (width < 560 ? 1 : width < 1000 ? 2 : 3);

// Card do pedido (também usado na prévia que segue o dedo/cursor durante o arraste)
function OrderCard({ order, onAdvance, dragging = false }) {
  const next = NEXT[order.status];
  return (
    <div
      className={`rounded-2xl border-2 bg-translucid p-4 shadow-sm flex flex-col gap-3 ${
        order.status === "preparing"
          ? "border-blue-500/60"
          : "border-translucid"
      } ${dragging ? "shadow-[0_10px_30px_var(--shadow)] backdrop-blur-xl" : ""}`}
    >
      <div className="flex items-start justify-between gap-2 border-b-2 border-[var(--translucid)] pb-2">
        <div className="min-w-0">
          <p className="text-lg font-bold">Nº {order.order_number ?? "—"}</p>
          <p className="text-xs color-gray">Pedido #{order.id.slice(0, 6)}</p>
          <p className="text-sm color-gray truncate">
            {order.table_label || serviceLabels[order.service] || "—"}
            {order.costumer_name ? ` · ${order.costumer_name}` : ""}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-sm font-semibold">
            {new Date(order.created_at).toLocaleTimeString("pt-BR", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
          <p className="text-xs color-gray">{ORDER_STATUS[order.status]}</p>
        </div>
      </div>

      <ul className="flex-1 space-y-2">
        {(order.items_list || []).map((item, i) => (
          <li key={i}>
            <p className="font-semibold">
              {item.qty}x {item.name || "Item sem nome"}
            </p>
            {(item.additionals || []).length > 0 && (
              <p className="text-sm color-gray">
                +{" "}
                {item.additionals
                  .map((a) => a.name)
                  .filter(Boolean)
                  .join(", ")}
              </p>
            )}
            {item.note && (
              <p className="text-sm text-yellow-500">Obs: {item.note}</p>
            )}
          </li>
        ))}
      </ul>

      {next && (
        <button
          type="button"
          onClick={() => onAdvance?.(order)}
          className={`cursor-pointer w-full py-3 rounded-lg text-white font-semibold transition ${next.className}`}
        >
          {next.label}
        </button>
      )}
    </div>
  );
}

// O card inteiro arrasta e também é alvo: soltar sobre outro pedido toma a posição dele.
// Nada se mexe durante o arraste (as colunas são recalculadas só ao soltar).
function DraggableCard({ id, children }) {
  const {
    setNodeRef: setDragRef,
    attributes,
    listeners,
    isDragging,
  } = useDraggable({ id });
  const { setNodeRef: setDropRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={(node) => {
        setDragRef(node);
        setDropRef(node);
      }}
      {...attributes}
      {...listeners}
      className={`select-none rounded-2xl transition ${isDragging ? "opacity-30" : ""} ${
        isOver && !isDragging
          ? "ring-2 ring-blue-500 ring-offset-2 ring-offset-transparent"
          : ""
      }`}
    >
      {children}
    </div>
  );
}

// ordem manual da fila, por aparelho (é só visual)
const readSavedOrder = (key) => {
  try {
    return JSON.parse(localStorage.getItem(key)) || [];
  } catch {
    return [];
  }
};

// Fila de preparo: pedidos recebidos/em preparo, mais antigos primeiro (ou na ordem que a cozinha arrumou).
// Usada no login da cozinha (/equipe) e pelo dono no dashboard (onBack volta pros Pedidos).
export default function Kitchen({ menu, reloadTrigger, onBack }) {
  const customAlert = useAlert();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const storageKey = `kitchen-order-${menu.id}`;
  const [savedOrder, setSavedOrder] = useState([]);
  const [columns, setColumns] = useState(1);
  const containerRef = useRef(null);

  useEffect(() => {
    setSavedOrder(readSavedOrder(storageKey));
  }, [storageKey]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) =>
      setColumns(columnsFor(entry.contentRect.width)),
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const load = async () => {
    const { data, error } = await supabase
      .from("orders")
      .select(
        "id, order_number, created_at, service, table_label, costumer_name, items_list, status",
      )
      .eq("menu_id", menu.id)
      .in("status", ["received", "preparing"])
      .or("payment_method.neq.stripe,is_paid.eq.true") // oculta pedidos Stripe enquanto não pagos
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Erro ao buscar pedidos da cozinha:", error);
      customAlert("Erro ao carregar pedidos.", "error");
    } else {
      setOrders(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    // a contagem da página não pega mudança de status feita em outro aparelho
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [menu.id, reloadTrigger]);

  const advance = async (order) => {
    const next = NEXT[order.status];
    const { error } = await supabase
      .from("orders")
      .update({ status: next.status })
      .eq("id", order.id);
    if (error) return customAlert("Erro ao atualizar pedido.", "error");

    setOrders((prev) =>
      next.status === "ready"
        ? prev.filter((o) => o.id !== order.id)
        : prev.map((o) =>
            o.id === order.id ? { ...o, status: next.status } : o,
          ),
    );
  };

  // pedidos arrumados manualmente primeiro (na ordem salva); os novos entram no fim, por chegada
  const rank = (id) => {
    const i = savedOrder.indexOf(id);
    return i === -1 ? Infinity : i;
  };
  const sorted = [...orders].sort((a, b) => rank(a.id) - rank(b.id));

  const saveOrder = (ids) => {
    setSavedOrder(ids);
    try {
      if (ids.length) localStorage.setItem(storageKey, JSON.stringify(ids));
      else localStorage.removeItem(storageKey);
    } catch {}
  };

  // mesmos sensores do arraste de itens do cardápio: no toque, segurar um instante (rolar continua funcionando)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 180, tolerance: 8 },
    }),
  );
  const [activeId, setActiveId] = useState(null);
  const activeOrder = sorted.find((o) => o.id === activeId);

  const handleDragEnd = ({ active, over }) => {
    setActiveId(null);
    if (!over || active.id === over.id) return;
    const ids = sorted.map((o) => o.id);
    saveOrder(arrayMove(ids, ids.indexOf(active.id), ids.indexOf(over.id)));
  };

  // cada pedido vai pra coluna mais baixa até agora: cards altos não esticam os vizinhos
  const columnLists = Array.from({ length: columns }, () => ({
    height: 0,
    items: [],
  }));
  sorted.forEach((order) => {
    const column = columnLists.reduce((low, col) =>
      col.height < low.height ? col : low,
    );
    column.items.push({ order });
    column.height += estimateHeight(order);
  });

  return (
    <div className="px-4" ref={containerRef}>
      {loading ? (
        <Loading />
      ) : (
        <>
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
            <div>
              <h2 className="text-xl font-semibold">Pedidos para preparar</h2>
              {orders.length > 1 && (
                <p className="text-xs color-gray">
                  Segure e arraste um pedido para reorganizar a fila
                </p>
              )}
            </div>
            <button
              type="button"
              className="cursor-pointer rounded-full p-2 opacity-80 transition hover:opacity-100"
              onClick={load}
              title="Atualizar pedidos"
            >
              <FaSyncAlt />
            </button>
            {savedOrder.length > 0 && (
              <button
                type="button"
                onClick={() => saveOrder([])}
                className="ml-auto flex cursor-pointer items-center gap-1.5 rounded-lg px-2 py-1 text-sm color-gray transition hover:bg-[var(--translucid)]"
              >
                <FaUndo /> Ordem de chegada
              </button>
            )}
          </div>

          {orders.length === 0 ? (
            <p className="p-6 text-center color-gray">Nenhum pedido na fila.</p>
          ) : (
            <DndContext
              sensors={sensors}
              onDragStart={({ active }) => setActiveId(active.id)}
              onDragEnd={handleDragEnd}
              onDragCancel={() => setActiveId(null)}
            >
              <div className="flex items-start gap-4">
                {columnLists.map((col, c) => (
                  <div key={c} className="flex min-w-0 flex-1 flex-col gap-4">
                    {col.items.map(({ order }) => (
                      <DraggableCard key={order.id} id={order.id}>
                        <OrderCard order={order} onAdvance={advance} />
                      </DraggableCard>
                    ))}
                  </div>
                ))}
              </div>

              <DragOverlay>
                {activeOrder ? (
                  <OrderCard order={activeOrder} dragging />
                ) : null}
              </DragOverlay>
            </DndContext>
          )}
        </>
      )}
    </div>
  );
}
