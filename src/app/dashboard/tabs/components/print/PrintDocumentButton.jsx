"use client";

import { useRef, useState } from "react";
import { useReactToPrint } from "react-to-print";
import { FaPrint } from "react-icons/fa";
import GenericModal from "@/components/GenericModal";
import { formatCurrency } from "@/lib/formatCurrency";

export const paymentLabels = {
  pix: "Pix",
  debit: "Débito",
  credit: "Crédito",
  cash: "Dinheiro",
  stripe: "Stripe",
};

export const serviceLabels = {
  delivery: "Entrega",
  pickup: "Retirada",
  dinein: "No local",
  faceToFace: "Atendimento presencial",
};

// ---- Normalizadores: transformam order/sale num formato comum ----

const computeItemsSubtotal = (itemsList = []) =>
  itemsList.reduce((acc, it) => {
    const qty = Number(it.qty) || 0;
    const unit = Number(it.price) || 0;
    const addsUnit = (it.additionals || []).reduce(
      (sa, a) => sa + (Number(a.price) || 0),
      0,
    );
    return acc + (unit + addsUnit) * qty;
  }, 0);

export function normalizeOrderForPrint(order, { deliveryFeeOnSales } = {}) {
  if (!order) return null;
  const subtotal = computeItemsSubtotal(order.items_list);
  const deliveryFee =
    order.service === "delivery" ? Number(order.delivery_fee) || 0 : 0;

  return {
    id: order.id,
    createdAt: order.created_at,
    costumerName: order.costumer_name,
    costumerPhone: order.costumer_phone,
    neighborhood: order.neighborhood,
    address: order.address,
    paymentMethod: order.payment_method,
    service: order.service,
    itemsList: order.items_list || [],
    subtotal,
    deliveryFee,
    total: subtotal + deliveryFee,
    netTotal: null,
  };
}

export function normalizeSaleForPrint(sale) {
  if (!sale) return null;
  const subtotal = computeItemsSubtotal(sale.items_list);
  const deliveryFee = Number(sale.delivery_fee) || 0;
  const total =
    sale.total != null ? Number(sale.total) : subtotal + deliveryFee;

  return {
    id: sale.id,
    createdAt: sale.created_at,
    costumerName: sale.costumer_name,
    costumerPhone: sale.costumer_phone,
    neighborhood: sale.neighborhood,
    address: sale.address,
    paymentMethod: sale.payment_method,
    service: sale.service,
    itemsList: sale.items_list || [],
    subtotal,
    deliveryFee,
    total,
    netTotal: sale.net_total != null ? Number(sale.net_total) : null,
  };
}

const defaultModeDescriptions = {
  full: {
    label: "Completo",
    title: "Completo",
    desc: "Via administrativa para conferência e entrega. Exibe todas as informações, incluindo cliente, pagamento, itens e valores.",
  },
  kitchen: {
    label: "Via da cozinha",
    title: "Via da cozinha",
    desc: "Utilizada para preparo. Exibe apenas os itens solicitados, opções e observações, sem dados do cliente ou valores.",
  },
  counter: {
    label: "Comanda de balcão",
    title: "Comanda de balcão",
    desc: "Utilizada para identificação e retirada. Exibe número, cliente, itens e valor total, ocultando dados de contato e pagamento.",
  },
};

/**
 * Botão + modal de opções + layout oculto de impressão, tudo autocontido.
 * Reutilizável para pedidos (orders) e vendas (sales) — basta passar o
 * `document` já normalizado por normalizeOrderForPrint/normalizeSaleForPrint.
 */
export default function PrintDocumentButton({
  document,
  currency,
  canPrint,
  onDenied,
  triggerClassName,
  triggerLabel = null, // se null, mostra só o ícone
  fileNamePrefix = "documento",
  receiptTitle = "PEDIDO", // cabeçalho impresso no modo "full"
  modeDescriptions = defaultModeDescriptions,
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [printMode, setPrintMode] = useState("full");
  const [paperSize, setPaperSize] = useState("paper-80mm");
  const printRef = useRef(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `${fileNamePrefix}-${document?.costumerName || "cliente"}`,
    pageStyle: `
@page {
  size: ${paperSize === "paper-58mm" ? "58mm auto" : paperSize === "paper-80mm" ? "80mm auto" : "A4 portrait"};
  margin: 5mm;
}
`,
  });

  if (!document) return null;

  const totalItens = (document.itemsList || []).reduce(
    (acc, item) => acc + (Number(item.qty) || 0),
    0,
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setModalOpen(true)}
        title="Imprimir"
        className={
          triggerClassName ||
          "flex cursor-pointer items-center justify-center gap-2 rounded-xl border bg-[var(--translucid)] border-translucid px-3 py-2 text-sm font-medium transition hover:opacity-80"
        }
      >
        <FaPrint />
        {triggerLabel ? (
          <span className="hidden xs:block">{triggerLabel}</span>
        ) : null}
      </button>

      {modalOpen ? (
        <GenericModal
          title="Imprimir"
          onClose={() => setModalOpen(false)}
          size="sm"
        >
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium">
                Tipo da impressão
              </label>
              <select
                value={printMode}
                onChange={(e) => setPrintMode(e.target.value)}
                className="input w-full rounded-xl bg-translucid p-2"
              >
                <option className="text-black" value="full">
                  {modeDescriptions.full.label}
                </option>
                <option className="text-black" value="kitchen">
                  {modeDescriptions.kitchen.label}
                </option>
                <option className="text-black" value="counter">
                  {modeDescriptions.counter.label}
                </option>
              </select>
            </div>

            <div className="rounded-xl border border-translucid bg-translucid p-3 text-sm">
              <p className="mb-1 font-medium">
                {modeDescriptions[printMode].title}
              </p>
              <p className="color-gray">{modeDescriptions[printMode].desc}</p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Formato do papel
              </label>
              <select
                value={paperSize}
                onChange={(e) => setPaperSize(e.target.value)}
                className="input w-full rounded-xl bg-translucid p-2"
              >
                <option className="text-black" value="paper-80mm">
                  Bobina 80mm
                </option>
                <option className="text-black" value="paper-58mm">
                  Bobina 58mm
                </option>
                <option className="text-black" value="paper-a4">
                  Folha A4
                </option>
              </select>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() => {
                  if (canPrint) {
                    handlePrint();
                    setModalOpen(false);
                  } else {
                    onDenied?.();
                  }
                }}
                className="w-full cursor-pointer rounded-xl bg-green-600 py-2 text-white transition hover:bg-green-700"
              >
                Imprimir
              </button>

              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="w-full cursor-pointer rounded-xl border border-translucid bg-[var(--translucid)] py-2 transition hover:opacity-80"
              >
                Cancelar
              </button>
            </div>
          </div>
        </GenericModal>
      ) : null}

      <div style={{ position: "absolute", left: "-99999px", top: 0 }}>
        <div ref={printRef} className={`print-layout ${paperSize}`}>
          {printMode === "full" && (
            <>
              <h1>{receiptTitle}</h1>
              <p>
                <strong>Nº:</strong> #{document.id?.slice(0, 6)}
              </p>
              <p>{new Date(document.createdAt).toLocaleString("pt-BR")}</p>
              <hr />
              <p>
                <strong>Cliente:</strong> {document.costumerName}
              </p>
              <p>
                <strong>Telefone:</strong> {document.costumerPhone}
              </p>
              {document.neighborhood && (
                <p>
                  <strong>Bairro:</strong> {document.neighborhood}
                </p>
              )}
              {document.address && (
                <p>
                  <strong>Endereço:</strong> {document.address}
                </p>
              )}
              <p>
                <strong>Pagamento:</strong>{" "}
                {paymentLabels[document.paymentMethod]}
              </p>
              <p>
                <strong>Serviço:</strong> {serviceLabels[document.service]}
              </p>
              <hr />
              {document.itemsList.map((item, index) => (
                <div
                  key={index}
                  style={{ breakInside: "avoid", pageBreakInside: "avoid" }}
                >
                  <strong>
                    {item.qty}x {item.name}
                  </strong>
                  {(item.additionals || []).map((add, i) => (
                    <div key={i}>+ {add.name}</div>
                  ))}
                  {item.note && <div>Obs: {item.note}</div>}
                </div>
              ))}
              <hr />
              <p>
                <strong>Itens:</strong> {totalItens}
              </p>
              <p>
                <strong>Subtotal:</strong>{" "}
                {formatCurrency(document.subtotal, currency)}
              </p>
              {document.service === "delivery" && (
                <p>
                  <strong>Entrega:</strong>{" "}
                  {formatCurrency(document.deliveryFee, currency)}
                </p>
              )}
              <hr />
              <p style={{ fontSize: "18px", fontWeight: "bold" }}>
                TOTAL: {formatCurrency(document.total, currency)}
              </p>
              {document.netTotal != null && (
                <p style={{ fontSize: "14px" }}>
                  Líquido: {formatCurrency(document.netTotal, currency)}
                </p>
              )}
            </>
          )}

          {printMode === "kitchen" && (
            <>
              <h1>COZINHA</h1>
              <p>
                <strong>Nº:</strong> #{document.id?.slice(0, 6)}
              </p>
              <p>{new Date(document.createdAt).toLocaleString("pt-BR")}</p>
              <p>
                <strong>
                  {serviceLabels[document.service]?.toUpperCase()}
                </strong>
              </p>
              {document.costumerName && (
                <p>
                  <strong>Cliente:</strong> {document.costumerName}
                </p>
              )}
              <hr />
              {document.itemsList.map((item, index) => (
                <div
                  key={index}
                  style={{ breakInside: "avoid", pageBreakInside: "avoid" }}
                >
                  <h3>
                    {item.qty}x {item.name}
                  </h3>
                  {(item.additionals || []).map((add, i) => (
                    <div key={i}>+ {add.name}</div>
                  ))}
                  {item.note && (
                    <div style={{ fontWeight: "bold" }}>
                      OBS: {item.note.toUpperCase()}
                    </div>
                  )}
                  <hr />
                </div>
              ))}
            </>
          )}

          {printMode === "counter" && (
            <>
              <h1>COMANDA</h1>
              <p>
                <strong>Nº:</strong> #{document.id?.slice(0, 6)}
              </p>
              <p>{new Date(document.createdAt).toLocaleString("pt-BR")}</p>
              {document.costumerName && (
                <p>
                  <strong>Cliente:</strong> {document.costumerName}
                </p>
              )}
              <hr />
              {document.itemsList.map((item, index) => (
                <div
                  key={index}
                  style={{ breakInside: "avoid", pageBreakInside: "avoid" }}
                >
                  <strong>
                    {item.qty}x {item.name}
                  </strong>
                  {(item.additionals || []).map((add, i) => (
                    <div key={i}>+ {add.name}</div>
                  ))}
                  {item.note && <div>Obs: {item.note}</div>}
                </div>
              ))}
              <hr />
              <p>
                <strong>Itens:</strong> {totalItens}
              </p>
              <p style={{ fontSize: "18px", fontWeight: "bold" }}>
                TOTAL: {formatCurrency(document.total, currency)}
              </p>
            </>
          )}
        </div>
      </div>
    </>
  );
}
