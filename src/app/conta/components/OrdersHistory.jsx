"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { FaReceipt, FaExternalLinkAlt, FaCheck } from "react-icons/fa";
import { supabase } from "@/lib/supabaseClient";
import { getAllReceipts } from "@/lib/orderReceipts";
import useUser from "@/hooks/useUser";
import { formatCurrency } from "@/lib/formatCurrency";
import {
  paymentLabels,
  serviceLabels,
} from "@/app/menu/[slug]/components/MyOrdersModal";

const PAGE = 20;
const POLL_MS = 15000;
// ponytail: pedido parado há mais de 1 dia sai de "em andamento" (dono que não usa as etapas nem finaliza);
// trocar por status vindo do dono se isso esconder pedido real
const ACTIVE_MS = 24 * 60 * 60 * 1000;

// só o que a tela mostra: nome, telefone e endereço já estão com o cliente
const ORDER_COLUMNS =
  "id, menu_id, created_at, status, payment_method, service, table_label, items_list, total, is_paid";
// venda = pedido finalizado (o painel apaga o pedido e grava a venda; order_id em tasks/acompanhar-pedido)
const SALE_COLUMNS =
  "id, order_id, menu_id, created_at, payment_method, service, items_list, total";

const fromOrder = (o) => ({
  key: o.id,
  orderId: o.id,
  menuId: o.menu_id,
  createdAt: o.created_at,
  status: o.status || "received",
  paymentMethod: o.payment_method,
  service: o.service,
  tableLabel: o.table_label,
  itemsList: o.items_list,
  total: o.total,
  isPaid: o.is_paid,
});

const fromSale = (s) => ({
  key: `venda-${s.id}`,
  orderId: s.order_id,
  menuId: s.menu_id,
  createdAt: s.created_at,
  status: "finalized",
  paymentMethod: s.payment_method,
  service: s.service,
  itemsList: s.items_list,
  total: s.total,
  isPaid: true,
});

const isActive = (o) =>
  o.status !== "delivered" &&
  Date.now() - new Date(o.createdAt).getTime() < ACTIVE_MS;

// badge e aba inicial de /conta (mesma regra de isActive)
export const countActiveOrders = async (userId) => {
  const { count } = await supabase
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("customer_id", userId)
    .or("status.is.null,status.neq.delivered")
    .gte("created_at", new Date(Date.now() - ACTIVE_MS).toISOString());
  return count || 0;
};

// mesmo pedido no banco e no aparelho: mesmo id ou mesmo cardápio e mesma data (o carrinho grava a mesma nos dois)
const sameOrder = (a, b) =>
  (a.orderId && a.orderId === b.orderId) ||
  (a.menuId === b.menuId &&
    new Date(a.createdAt).getTime() === new Date(b.createdAt).getTime());

// Etapas que o cliente vê. "ready" na entrega = pronto esperando o entregador (ainda na etapa de preparo).
const TRACK = {
  delivery: {
    steps: ["Recebido", "Em preparo", "A caminho", "Entregue"],
    at: { received: 0, preparing: 1, ready: 1, out_for_delivery: 2, delivered: 3 },
  },
  other: {
    steps: ["Recebido", "Em preparo", "Pronto", "Concluído"],
    at: { received: 0, preparing: 1, ready: 2, out_for_delivery: 2, delivered: 3 },
  },
};

const headline = (o) => {
  if (o.status === "preparing") return ["Em preparo", "Seu pedido está sendo preparado."];
  if (o.status === "out_for_delivery") return ["Saiu para entrega", "Seu pedido está a caminho."];
  if (o.status === "ready") {
    if (o.service === "delivery") return ["Pronto!", "Aguardando o entregador sair."];
    if (o.service === "dinein") return ["Pronto!", "Já vai chegar na sua mesa."];
    return ["Pronto para retirada!", "Pode buscar seu pedido."];
  }
  return ["Pedido recebido", "O estabelecimento recebeu seu pedido."];
};

const HISTORY_STATUS = {
  finalized: "Finalizado",
  delivered: "Entregue",
};

// Pedidos da conta: em aberto (orders.customer_id, tasks/descobrir/orders-customer.sql), finalizados (sales.customer_id)
// e comprovantes deste aparelho que não estão no banco: pedidos antigos e os de cardápio "só WhatsApp"
export default function OrdersHistory({ onActiveCount }) {
  const { user } = useUser();
  const [openOrders, setOpenOrders] = useState(null);
  const [sales, setSales] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [menus, setMenus] = useState({}); // menuId -> { title, slug }
  const [highlight, setHighlight] = useState(null); // ?pedido=<id> (link do WhatsApp)

  const loadOpen = async () => {
    // em aberto são poucos: o dono finaliza e o pedido vira venda
    const { data, error } = await supabase
      .from("orders")
      .select(ORDER_COLUMNS)
      .eq("customer_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);
    // sem o SQL (ou sem rede) fica só o que está no aparelho
    if (error) console.warn("[pedidos] em aberto indisponíveis:", error.message);
    setOpenOrders((data || []).map(fromOrder));
  };

  const loadSales = async (from) => {
    const { data, error } = await supabase
      .from("sales")
      .select(SALE_COLUMNS)
      .eq("customer_id", user.id)
      .order("created_at", { ascending: false })
      .range(from, from + PAGE - 1);
    if (error) console.warn("[pedidos] finalizados indisponíveis:", error.message);
    const rows = (data || []).map(fromSale);
    setSales((prev) => (from === 0 ? rows : [...prev, ...rows]));
    setHasMore(rows.length === PAGE);
  };

  useEffect(() => {
    if (!user?.id) return;
    loadOpen();
    loadSales(0);
    setHighlight(new URLSearchParams(window.location.search).get("pedido"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const active = useMemo(() => (openOrders || []).filter(isActive), [openOrders]);

  useEffect(() => {
    if (openOrders) onActiveCount?.(active.length);
  }, [openOrders, active.length, onActiveCount]);

  // ponytail: polling (orders não está no Realtime); só com pedido em andamento e a aba visível
  useEffect(() => {
    if (active.length === 0) return;
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") loadOpen();
    }, POLL_MS);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active.length]);

  const history = useMemo(() => {
    if (!openOrders) return null;
    const db = [...openOrders.filter((o) => !isActive(o)), ...sales];
    // com mais vendas no banco, o comprovante mais antigo que a página pode ser um pedido ainda não carregado
    const oldest = hasMore && sales.length ? new Date(sales.at(-1).createdAt) : null;
    const local = getAllReceipts()
      .map((r) => ({ ...r, key: r.id, status: null }))
      .filter(
        (r) =>
          (!oldest || new Date(r.createdAt) >= oldest) &&
          ![...openOrders, ...sales].some((o) => sameOrder(o, r)),
      );
    return [...db, ...local].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
    );
  }, [openOrders, sales, hasMore]);

  // nome e slug do cardápio: os pedidos do banco só têm o id
  useEffect(() => {
    if (!history) return;
    const missing = [
      ...new Set(
        [...active, ...history]
          .filter((r) => !r.menuSlug && !menus[r.menuId])
          .map((r) => r.menuId),
      ),
    ];
    if (missing.length === 0) return;
    supabase
      .from("menus")
      .select("id, slug, title")
      .in("id", missing)
      .then(({ data }) =>
        setMenus((prev) => ({
          ...prev,
          ...Object.fromEntries((data || []).map((m) => [m.id, m])),
        })),
      );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [history, active]);

  // leva até o pedido do link assim que ele aparece na tela
  useEffect(() => {
    if (!highlight || !history) return;
    document
      .getElementById(`pedido-${highlight}`)
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [highlight, history]);

  if (!history) return null;

  const menuOf = (r) => ({
    slug: r.menuSlug || menus[r.menuId]?.slug,
    title: r.menuTitle || menus[r.menuId]?.title || "Cardápio",
  });
  const highlighted = (r) =>
    highlight && r.orderId === highlight
      ? "ring-2 ring-brand-red ring-offset-2 ring-offset-[var(--background)]"
      : "";

  return (
    <div className="space-y-6">
      {active.length > 0 && (
        <section aria-labelledby="em-andamento" className="space-y-3">
          <h3 id="em-andamento" className="flex items-center gap-2 font-semibold">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-verde opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-verde" />
            </span>
            Em andamento
            <span className="text-xs font-normal color-gray">
              · atualiza sozinho
            </span>
          </h3>
          {active.map((o) => (
            <ActiveOrder
              key={o.key}
              order={o}
              menu={menuOf(o)}
              className={highlighted(o)}
            />
          ))}
        </section>
      )}

      <section aria-labelledby="historico" className="space-y-3">
        <h3 id="historico" className="font-semibold">
          {active.length > 0 ? "Anteriores" : "Seus pedidos"}
        </h3>
        <p className="text-sm color-gray">
          Seus pedidos, em qualquer aparelho em que você estiver logado.
        </p>
        {history.length === 0 ? (
          <p className="rounded-2xl border border-brand-line bg-translucid p-6 text-center color-gray">
            {active.length > 0
              ? "Os pedidos finalizados aparecem aqui."
              : "Você ainda não fez nenhum pedido."}
          </p>
        ) : (
          history.map((r) => {
            const { slug, title } = menuOf(r);
            return (
              <div
                key={r.key}
                id={r.orderId ? `pedido-${r.orderId}` : undefined}
                className={`rounded-2xl border border-brand-line bg-translucid p-4 ${highlighted(r)}`}
              >
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <MenuTitle slug={slug} title={title} />
                  <p className="flex items-center gap-2 text-sm color-gray">
                    <FaReceipt /> {new Date(r.createdAt).toLocaleString("pt-BR")}
                  </p>
                </div>
                <OrderDetails order={r}>
                  {HISTORY_STATUS[r.status] && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[var(--translucid)] px-2 py-0.5 color-gray">
                      <FaCheck className="text-[10px]" /> {HISTORY_STATUS[r.status]}
                    </span>
                  )}
                </OrderDetails>
              </div>
            );
          })
        )}
        {hasMore && (
          <button
            disabled={loadingMore}
            onClick={async () => {
              setLoadingMore(true);
              await loadSales(sales.length);
              setLoadingMore(false);
            }}
            className="mx-auto block cursor-pointer rounded-full border border-brand-line px-4 py-2 text-sm hover-bg-translucid disabled:opacity-50"
          >
            {loadingMore ? "Carregando..." : "Ver mais pedidos"}
          </button>
        )}
      </section>
    </div>
  );
}

function ActiveOrder({ order, menu, className }) {
  const track = TRACK[order.service === "delivery" ? "delivery" : "other"];
  const step = track.at[order.status] ?? 0;
  const [title, subtitle] = headline(order);
  const time = new Date(order.createdAt).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <article
      id={`pedido-${order.orderId}`}
      className={`overflow-hidden rounded-2xl border border-brand-red/40 bg-brand-surface shadow-md ${className}`}
    >
      <div className="bg-brand-gradient p-4 text-white">
        <div className="flex items-center justify-between gap-2 text-sm opacity-90">
          <span className="truncate font-medium">{menu.title}</span>
          <span className="shrink-0">
            #{order.orderId.slice(0, 6)} · {time}
          </span>
        </div>
        <p className="mt-2 text-2xl font-bold leading-tight" aria-live="polite">
          {title}
        </p>
        <p className="text-sm opacity-90">{subtitle}</p>
      </div>

      <div className="space-y-4 p-4">
        {/* linha do tempo: concluídas cheias, a atual pulsando */}
        <ol className="grid grid-cols-4 gap-1" aria-label="Andamento do pedido">
          {track.steps.map((label, i) => (
            <li
              key={label}
              aria-current={i === step ? "step" : undefined}
              className="flex flex-col items-center gap-1.5 text-center"
            >
              <div className="flex w-full items-center">
                <span
                  className={`h-1 flex-1 rounded-full ${i === 0 ? "invisible" : i <= step ? "bg-brand-gradient" : "bg-[var(--translucid)]"}`}
                />
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] ${
                    i < step
                      ? "bg-brand-gradient text-white"
                      : i === step
                        ? "bg-brand-gradient text-white ring-4 ring-brand-red/25 animate-pulse"
                        : "border-2 border-brand-line"
                  }`}
                >
                  {i < step ? <FaCheck /> : null}
                </span>
                <span
                  className={`h-1 flex-1 rounded-full ${i === track.steps.length - 1 ? "invisible" : i < step ? "bg-brand-gradient" : "bg-[var(--translucid)]"}`}
                />
              </div>
              <span
                className={`text-[11px] leading-tight ${i === step ? "font-semibold" : "color-gray"}`}
              >
                {label}
              </span>
            </li>
          ))}
        </ol>

        <OrderDetails order={order} />

        {menu.slug && (
          <MenuTitle slug={menu.slug} title={`Ver cardápio de ${menu.title}`} small />
        )}
      </div>
    </article>
  );
}

function MenuTitle({ slug, title, small = false }) {
  if (!slug) return <p className="font-semibold">{title}</p>;
  return (
    <Link
      href={`/menu/${slug}`}
      prefetch={false}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex items-center gap-2 underline-offset-2 hover:text-brand-red hover:underline ${small ? "text-sm color-gray" : "font-semibold"}`}
    >
      {title} <FaExternalLinkAlt className="text-xs" />
    </Link>
  );
}

function OrderDetails({ order: r, children }) {
  return (
    <>
      <div className="mb-2 flex flex-wrap gap-2 text-xs color-gray">
        {children}
        {r.tableLabel && (
          <span className="rounded-full border border-brand-line px-2 py-0.5">
            {r.tableLabel}
          </span>
        )}
        <span className="rounded-full border border-brand-line px-2 py-0.5">
          {serviceLabels[r.service] || "Não informado"}
        </span>
        <span className="rounded-full border border-brand-line px-2 py-0.5">
          {paymentLabels[r.paymentMethod] || "Não informado"}
        </span>
        {r.isPaid && (
          <span className="rounded-full bg-verde px-2 py-0.5 text-white">
            Pago
          </span>
        )}
      </div>
      <ul className="mb-2 space-y-1 text-sm">
        {(r.itemsList || []).map((item, i) => (
          <li key={i}>
            <span className="font-medium">
              {item.qty}x {item.name}
            </span>
            {(item.additionals || []).length > 0 && (
              <p className="pl-4 text-xs color-gray">
                + {item.additionals.map((a) => a.name).join(", ")}
              </p>
            )}
          </li>
        ))}
      </ul>
      <p className="text-right font-bold">Total: {formatCurrency(r.total)}</p>
    </>
  );
}
