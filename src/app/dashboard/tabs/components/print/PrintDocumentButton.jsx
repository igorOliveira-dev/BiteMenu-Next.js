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
  const discount = Math.min(Number(order.discount) || 0, subtotal);

  return {
    id: order.id,
    orderNumber: order.order_number ?? null,
    createdAt: order.created_at,
    costumerName: order.costumer_name,
    costumerPhone: order.costumer_phone,
    neighborhood: order.neighborhood,
    address: order.address,
    paymentMethod: order.payment_method,
    service: order.service,
    tableLabel: order.table_label || null,
    itemsList: order.items_list || [],
    subtotal,
    discount,
    deliveryFee,
    total: subtotal - discount + deliveryFee,
    netTotal: null,
  };
}

export function normalizeSaleForPrint(sale) {
  if (!sale) return null;
  const subtotal = computeItemsSubtotal(sale.items_list);
  const deliveryFee = Number(sale.delivery_fee) || 0;
  const total =
    sale.total != null ? Number(sale.total) : subtotal + deliveryFee;
  // vendas não guardam o desconto: a diferença para o total é o desconto aplicado
  const discount = Math.max(0, Math.round((subtotal + deliveryFee - total) * 100) / 100);

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
    discount,
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

// Cabeçalho comum aos 3 modos: logo, título, número em destaque e id curto.
// Vendas não guardam order_number: o id curto vira o destaque.
function PrintHeader({ title, document }) {
  const shortId = `#${document.id?.slice(0, 6)}`;
  const hasNumber = document.orderNumber != null;

  return (
    <div className="print-header">
      <img src="/LogoTipo-sem-fundo.png" alt="Bite Menu" />
      <div className="print-header-info">
        <h1>{title}</h1>
        <p>{new Date(document.createdAt).toLocaleString("pt-BR")}</p>
        {hasNumber && <p>ID {shortId}</p>}
      </div>
      <div className="print-number">
        <span>{hasNumber ? "Nº" : "ID"}</span>
        <strong>{hasNumber ? document.orderNumber : shortId}</strong>
      </div>
    </div>
  );
}

// linha "rótulo .... valor"
function PrintRow({ label, value, className = "" }) {
  return (
    <div className={`print-row ${className}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

/**
 * Botão + modal de opções + layout oculto de impressão, tudo autocontido.
 * Reutilizável para pedidos (orders) e vendas (sales) — basta passar o
 * `document` já normalizado por normalizeOrderForPrint/normalizeSaleForPrint.
 */
export default function PrintDocumentButton({
  document,
  currency,
  menuName,
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

  // o label da mesa já vem com o prefixo escolhido pelo dono (ex.: "Mesa 5")
  const serviceText = [serviceLabels[document.service], document.tableLabel]
    .filter(Boolean)
    .join(" · ");

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
              <PrintHeader title={receiptTitle} document={document} />
              {menuName && <p>{menuName}</p>}
              <p>
                <strong>Cliente:</strong> {document.costumerName}
              </p>
              <p>
                <strong>Telefone:</strong> {document.costumerPhone}
              </p>
              <p>
                <strong>Serviço:</strong> {serviceText}
              </p>
              {document.service === "delivery" &&
                (document.address || document.neighborhood) && (
                  <div className="print-box">
                    <strong>ENDEREÇO DE ENTREGA</strong>
                    {document.address && <div>{document.address}</div>}
                    {document.neighborhood && (
                      <div>Bairro: {document.neighborhood}</div>
                    )}
                  </div>
                )}
              <hr />
              {document.itemsList.map((item, index) => {
                const adds = item.additionals || [];
                const unit =
                  (Number(item.price) || 0) +
                  adds.reduce((sa, a) => sa + (Number(a.price) || 0), 0);
                return (
                  <div key={index} className="print-item">
                    <PrintRow
                      label={
                        <strong>
                          {item.qty}x {item.name}
                        </strong>
                      }
                      value={formatCurrency(
                        unit * (Number(item.qty) || 0),
                        currency,
                      )}
                    />
                    {adds.map((add, i) => (
                      <div key={i} className="print-sub">
                        + {add.name}
                      </div>
                    ))}
                    {item.note && (
                      <div className="print-sub">Obs: {item.note}</div>
                    )}
                  </div>
                );
              })}
              <hr />
              <PrintRow label="Itens" value={totalItens} />
              <PrintRow
                label="Pagamento"
                value={paymentLabels[document.paymentMethod] || "—"}
              />
              <PrintRow
                label="Subtotal"
                value={formatCurrency(document.subtotal, currency)}
              />
              {document.discount > 0 && (
                <PrintRow
                  label="Desconto"
                  value={`-${formatCurrency(document.discount, currency)}`}
                />
              )}
              {document.service === "delivery" && (
                <PrintRow
                  label="Entrega"
                  value={formatCurrency(document.deliveryFee, currency)}
                />
              )}
              <PrintRow
                className="print-total"
                label="TOTAL"
                value={formatCurrency(document.total, currency)}
              />
              {document.netTotal != null && (
                <PrintRow
                  label="Líquido"
                  value={formatCurrency(document.netTotal, currency)}
                />
              )}
            </>
          )}

          {printMode === "kitchen" && (
            <>
              <PrintHeader title="COZINHA" document={document} />
              {serviceText && (
                <div className="print-banner">
                  {serviceText.toUpperCase()}
                </div>
              )}
              {menuName && (
                <p>
                  {menuName}
                </p>
              )}
              {document.costumerName && (
                <p>
                  <strong>Cliente:</strong> {document.costumerName}
                </p>
              )}
              <hr />
              {document.itemsList.map((item, index) => (
                <div key={index} className="print-item">
                  <strong>
                    {item.qty}x {item.name}
                  </strong>
                  {(item.additionals || []).map((add, i) => (
                    <div key={i} className="print-sub">
                      + {add.name}
                    </div>
                  ))}
                  {item.note && (
                    <div className="print-note">
                      OBS: {item.note.toUpperCase()}
                    </div>
                  )}
                  <hr />
                </div>
              ))}
              <PrintRow label="Total de itens" value={totalItens} />
            </>
          )}

          {printMode === "counter" && (
            <>
              <PrintHeader title="COMANDA" document={document} />
              {document.costumerName && (
                <div className="print-banner">{document.costumerName}</div>
              )}
              {menuName && (
                <p>
                  {menuName}
                </p>
              )}
              <p>
                <strong>Serviço:</strong> {serviceText}
              </p>
              <hr />
              {document.itemsList.map((item, index) => (
                <div key={index} className="print-item">
                  <strong>
                    {item.qty}x {item.name}
                  </strong>
                  {(item.additionals || []).map((add, i) => (
                    <div key={i} className="print-sub">
                      + {add.name}
                    </div>
                  ))}
                  {item.note && (
                    <div className="print-sub">Obs: {item.note}</div>
                  )}
                </div>
              ))}
              <hr />
              <PrintRow label="Itens" value={totalItens} />
              <PrintRow
                className="print-total"
                label="TOTAL"
                value={formatCurrency(document.total, currency)}
              />
            </>
          )}
        </div>
      </div>
    </>
  );
}
