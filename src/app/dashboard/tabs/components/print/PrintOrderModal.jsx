"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { FaArrowDown, FaArrowUp } from "react-icons/fa";
import GenericModal from "@/components/GenericModal";
import { useAlert } from "@/providers/AlertProvider";
import UpdatePlanModal from "../UpdatePlanModal";
import { PRINT_SECTIONS, loadPrintOrder, savePrintOrder } from "./PrintDocumentButton";

const labelOf = (id) => PRINT_SECTIONS.find((s) => s.id === id)?.label;

export default function PrintOrderModal({ canSave, onClose }) {
  const customAlert = useAlert();
  const [order, setOrder] = useState(loadPrintOrder);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const itemRefs = useRef({});
  const lastTops = useRef(null);

  // animação ao trocar de posição: cada bloco desliza da posição antiga pra nova
  useLayoutEffect(() => {
    if (!lastTops.current) return;
    Object.entries(itemRefs.current).forEach(([id, el]) => {
      const dy = lastTops.current[id] - el?.getBoundingClientRect().top;
      if (dy) el.animate([{ transform: `translateY(${dy}px)` }, { transform: "none" }], { duration: 200, easing: "ease-out" });
    });
    lastTops.current = null;
  }, [order]);

  const captureTops = () => {
    lastTops.current = Object.fromEntries(
      Object.entries(itemRefs.current).map(([id, el]) => [id, el?.getBoundingClientRect().top]),
    );
  };

  const move = (index, delta) => {
    captureTops();
    const next = [...order];
    [next[index], next[index + delta]] = [next[index + delta], next[index]];
    setOrder(next);
  };

  const handleSave = () => {
    // fora do Business dá pra montar a ordem, mas só salva assinando
    if (!canSave) return setShowPlanModal(true);
    savePrintOrder(order);
    customAlert("Ordem da impressão atualizada!", "success");
    onClose();
  };

  return (
    <GenericModal title="Ordem da impressão" onClose={onClose} size="sm">
      <div className="space-y-4">
        <p className="text-sm color-gray">
          Defina a ordem das informações na impressão com cabeçalho. Vale para todos os tipos de impressão (cada um
          mostra só os blocos que possui) e fica salva neste navegador.
        </p>

        <ol className="space-y-2">
          {order.map((id, index) => (
            <li
              key={id}
              ref={(el) => (itemRefs.current[id] = el)}
              className="flex items-center justify-between gap-2 rounded-xl border border-translucid bg-translucid px-3 py-2 text-sm"
            >
              <span>
                {index + 1}. {labelOf(id)}
              </span>
              <span className="flex gap-1">
                <button
                  type="button"
                  aria-label="Subir"
                  disabled={index === 0}
                  onClick={() => move(index, -1)}
                  className="cursor-pointer rounded-lg p-2 transition hover:opacity-80 disabled:cursor-default disabled:opacity-30"
                >
                  <FaArrowUp />
                </button>
                <button
                  type="button"
                  aria-label="Descer"
                  disabled={index === order.length - 1}
                  onClick={() => move(index, 1)}
                  className="cursor-pointer rounded-lg p-2 transition hover:opacity-80 disabled:cursor-default disabled:opacity-30"
                >
                  <FaArrowDown />
                </button>
              </span>
            </li>
          ))}
        </ol>

        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={handleSave}
            className="w-full cursor-pointer rounded-xl bg-green-600 py-2 text-white transition hover:bg-green-700"
          >
            Salvar
          </button>
          <button
            type="button"
            onClick={() => {
              captureTops();
              setOrder(PRINT_SECTIONS.map((s) => s.id));
            }}
            className="w-full cursor-pointer rounded-xl border border-translucid bg-[var(--translucid)] py-2 transition hover:opacity-80"
          >
            Restaurar padrão
          </button>
        </div>
      </div>

      {showPlanModal && (
        <UpdatePlanModal
          plan="business"
          title="Ordem da impressão"
          text="Assine o plano Business para salvar a ordem da impressão. Até lá, seus pedidos são impressos na ordem padrão."
          onClose={() => setShowPlanModal(false)}
        />
      )}
    </GenericModal>
  );
}
