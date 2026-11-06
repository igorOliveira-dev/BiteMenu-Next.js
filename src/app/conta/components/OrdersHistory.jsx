"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { FaReceipt, FaExternalLinkAlt } from "react-icons/fa";
import { supabase } from "@/lib/supabaseClient";
import { getAllReceipts } from "@/lib/orderReceipts";
import useUser from "@/hooks/useUser";
import { formatCurrency } from "@/lib/formatCurrency";
import {
  paymentLabels,
  serviceLabels,
} from "@/app/menu/[slug]/components/MyOrdersModal";

const PAGE = 20;
// só o que a tela mostra: nome, telefone e endereço já estão com o cliente
const COLUMNS =
  "id, menu_id, created_at, payment_method, service, table_label, items_list, total, is_paid";

const toReceipt = (o) => ({
  id: o.id,
  menuId: o.menu_id,
  createdAt: o.created_at,
  paymentMethod: o.payment_method,
  service: o.service,
  tableLabel: o.table_label,
  itemsList: o.items_list,
  total: o.total,
  isPaid: o.is_paid,
});

// mesmo pedido no banco e no aparelho: mesmo cardápio e mesma data (o carrinho grava a mesma nos dois)
const sameOrder = (a, b) =>
  a.menuId === b.menuId &&
  new Date(a.createdAt).getTime() === new Date(b.createdAt).getTime();

// Pedidos da conta (orders.customer_id, tasks/descobrir/orders-customer.sql) + comprovantes deste aparelho que não estão no
// banco: pedidos antigos e os de cardápio "só WhatsApp", que não vão para orders
export default function OrdersHistory() {
  const { user } = useUser();
  const [dbOrders, setDbOrders] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [menus, setMenus] = useState({}); // menuId -> { title, slug }

  const loadPage = async (from) => {
    if (!user?.id) return;
    const { data, error } = await supabase
      .from("orders")
      .select(COLUMNS)
      .eq("customer_id", user.id)
      .order("created_at", { ascending: false })
      .range(from, from + PAGE - 1);
    // sem o SQL (ou sem rede) fica só o que está no aparelho
    if (error)
      console.warn(
        "[histórico] pedidos da conta indisponíveis:",
        error.message,
      );
    const rows = (data || []).map(toReceipt);
    setDbOrders((prev) => (from === 0 ? rows : [...(prev || []), ...rows]));
    setHasMore(rows.length === PAGE);
  };

  useEffect(() => {
    if (user?.id) loadPage(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const receipts = useMemo(() => {
    if (!dbOrders) return null;
    // com mais páginas no banco, o comprovante mais antigo que a página pode ser um pedido ainda não carregado
    const oldest = hasMore ? new Date(dbOrders.at(-1).createdAt) : null;
    const local = getAllReceipts().filter(
      (r) =>
        (!oldest || new Date(r.createdAt) >= oldest) &&
        !dbOrders.some((o) => sameOrder(o, r)),
    );
    return [...dbOrders, ...local].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
    );
  }, [dbOrders, hasMore]);

  // nome e slug do cardápio: os pedidos do banco só têm o id
  useEffect(() => {
    if (!receipts) return;
    const missing = [
      ...new Set(
        receipts
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
  }, [receipts]);

  if (!receipts) return null;

  return (
    <div className="space-y-3">
      <p className="text-sm color-gray">
        Seus pedidos, em qualquer aparelho em que você estiver logado.
      </p>
      {receipts.length === 0 ? (
        <p className="rounded-2xl border border-brand-line bg-translucid p-6 text-center color-gray">
          Você ainda não fez nenhum pedido.
        </p>
      ) : (
        receipts.map((r) => {
          const slug = r.menuSlug || menus[r.menuId]?.slug;
          const title = r.menuTitle || menus[r.menuId]?.title || "Cardápio";
          return (
            <div
              key={r.id}
              className="rounded-2xl border border-brand-line bg-translucid p-4"
            >
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                {slug ? (
                  <Link
                    href={`/menu/${slug}`}
                    prefetch={false}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 font-semibold underline-offset-2 hover:text-brand-red hover:underline"
                  >
                    {title} <FaExternalLinkAlt className="text-xs" />
                  </Link>
                ) : (
                  <p className="font-semibold">{title}</p>
                )}
                <p className="flex items-center gap-2 text-sm color-gray">
                  <FaReceipt /> {new Date(r.createdAt).toLocaleString("pt-BR")}
                </p>
              </div>
              <div className="mb-2 flex flex-wrap gap-2 text-xs color-gray">
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
              <p className="text-right font-bold">
                Total: {formatCurrency(r.total)}
              </p>
            </div>
          );
        })
      )}
      {hasMore && (
        <button
          disabled={loadingMore}
          onClick={async () => {
            setLoadingMore(true);
            await loadPage(dbOrders.length);
            setLoadingMore(false);
          }}
          className="mx-auto block cursor-pointer rounded-full border border-brand-line px-4 py-2 text-sm hover-bg-translucid disabled:opacity-50"
        >
          {loadingMore ? "Carregando..." : "Ver mais pedidos"}
        </button>
      )}
    </div>
  );
}
