"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FaReceipt, FaExternalLinkAlt } from "react-icons/fa";
import { supabase } from "@/lib/supabaseClient";
import { getAllReceipts } from "@/lib/orderReceipts";
import { formatCurrency } from "@/lib/formatCurrency";
import {
  paymentLabels,
  serviceLabels,
} from "@/app/menu/[slug]/components/MyOrdersModal";

// shortcut: lê os comprovantes salvos neste aparelho (até 4 por cardápio); trocar por uma query em orders
// quando o pedido tiver o id do cliente
export default function OrdersHistory() {
  const [receipts, setReceipts] = useState(null);
  const [slugs, setSlugs] = useState({}); // menuId -> slug, para pedidos salvos antes de guardar o slug

  useEffect(() => {
    const all = getAllReceipts();
    setReceipts(all);
    const missing = [
      ...new Set(all.filter((r) => !r.menuSlug).map((r) => r.menuId)),
    ];
    if (missing.length === 0) return;
    supabase
      .from("menus")
      .select("id, slug")
      .in("id", missing)
      .then(({ data }) =>
        setSlugs(Object.fromEntries((data || []).map((m) => [m.id, m.slug]))),
      );
  }, []);

  if (!receipts) return null;

  return (
    <div className="space-y-3">
      <p className="text-sm color-gray">Pedidos feitos neste aparelho.</p>
      {receipts.length === 0 ? (
        <p className="rounded-2xl border border-brand-line bg-translucid p-6 text-center color-gray">
          Você ainda não fez nenhum pedido.
        </p>
      ) : (
        receipts.map((r) => {
          const slug = r.menuSlug || slugs[r.menuId];
          return (
            <div
              key={r.id}
              className="rounded-2xl border border-brand-line bg-translucid p-4"
            >
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                {slug ? (
                  <Link
                    href={`/menu/${slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 font-semibold underline-offset-2 hover:text-brand-red hover:underline"
                  >
                    {r.menuTitle || "Cardápio"}{" "}
                    <FaExternalLinkAlt className="text-xs" />
                  </Link>
                ) : (
                  <p className="font-semibold">{r.menuTitle || "Cardápio"}</p>
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
    </div>
  );
}
