"use client";

import { useEffect, useState } from "react";
import GenericModal from "@/components/GenericModal";
import { formatCurrency } from "@/lib/formatCurrency";
import { getReceipts } from "@/lib/orderReceipts";
import { FaReceipt } from "react-icons/fa";

const paymentLabels = {
  pix: "Pix",
  debit: "Débito",
  credit: "Crédito",
  cash: "Dinheiro",
  stripe: "Cartão (online)",
};

const serviceLabels = {
  delivery: "Entrega",
  pickup: "Retirada",
  dinein: "No local",
  faceToFace: "Atendimento presencial",
};

export default function MyOrdersModal({ menu, isOpen, onClose }) {
  const [receipts, setReceipts] = useState([]);

  useEffect(() => {
    if (isOpen) setReceipts(getReceipts(menu?.id));
  }, [isOpen, menu?.id]);

  if (!isOpen) return null;

  return (
    <GenericModal title="Meus pedidos recentes" onClose={onClose} wfull size="md">
      {receipts.length === 0 ? (
        <p className="text-sm opacity-80 text-center py-4">Você ainda não fez nenhum pedido aqui.</p>
      ) : (
        <div className="flex flex-col gap-3 max-h-[70vh] overflow-y-auto">
          {receipts.map((receipt) => (
            <div key={receipt.id} className="rounded-xl border border-translucid bg-[var(--low-translucid)] p-3">
              <div className="flex items-center justify-between gap-2 mb-1">
                <p className="text-sm font-semibold flex items-center gap-2">
                  <FaReceipt className="opacity-70" />
                  {new Date(receipt.createdAt).toLocaleString("pt-BR")}
                </p>
                {receipt.isPaid && <span className="text-xs rounded-full px-2 py-0.5 bg-green-600/40">Pago</span>}
              </div>

              <div className="flex flex-wrap gap-2 text-xs opacity-80 mb-2">
                {receipt.tableLabel && (
                  <span className="rounded-full border border-translucid px-2 py-0.5">{receipt.tableLabel}</span>
                )}
                <span className="rounded-full border border-translucid px-2 py-0.5">
                  {serviceLabels[receipt.service] || "Não informado"}
                </span>
                <span className="rounded-full border border-translucid px-2 py-0.5">
                  {paymentLabels[receipt.paymentMethod] || "Não informado"}
                </span>
              </div>

              <div className="flex flex-col gap-1 text-sm mb-2">
                {(receipt.itemsList || []).map((item, index) => (
                  <div key={index}>
                    <span className="font-medium">
                      {item.qty}x {item.name}
                    </span>
                    {(item.additionals || []).length > 0 && (
                      <p className="text-xs opacity-70 pl-4">+ {item.additionals.map((a) => a.name).join(", ")}</p>
                    )}
                    {item.note && <p className="text-xs opacity-70 pl-4">Obs: {item.note}</p>}
                  </div>
                ))}
              </div>

              <p className="text-right font-bold">Total: {formatCurrency(receipt.total, menu?.currency)}</p>
            </div>
          ))}
        </div>
      )}
    </GenericModal>
  );
}
