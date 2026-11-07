"use client";

import { useEffect, useState } from "react";
import { FaBolt, FaCheckCircle, FaMoneyBillWave } from "react-icons/fa";
import GenericModal from "@/components/GenericModal";

const STORAGE_KEY = "bite_menu_pix_online_notice";

// Convite pro Pix online: só pra Pro e Business (admin fica de fora) que ainda
// não marcaram a opção. Fechar no X volta a mostrar na próxima visita; "Não mostrar mais" desliga.
export default function PixOnlineModal({ menu, role, onActivate }) {
  const eligible =
    !!menu && ["pro", "business"].includes(role) && !menu.payments?.includes("pix_online");
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!eligible) return;
    try {
      if (window.localStorage.getItem(STORAGE_KEY) === "off") return;
    } catch {}
    setShow(true);
  }, [eligible]);

  if (!show || !eligible) return null;

  const dismiss = () => {
    try {
      window.localStorage.setItem(STORAGE_KEY, "off");
    } catch {}
    setShow(false);
  };

  const perks = [
    "O cliente paga pelo QR Code ou copia e cola, sem sair do cardápio",
    "Pagamento confirmado automaticamente no pedido, sem conferir comprovante",
    "Dinheiro na sua conta do Bite Menu, com saque quando quiser",
  ];

  return (
    <GenericModal title="Cobre seus clientes por Pix diretamente no Bite Menu" size="md" onClose={() => setShow(false)}>
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3 rounded-xl bg-[var(--red)]/10 p-4">
          <FaMoneyBillWave className="shrink-0 text-3xl text-[var(--red)]" />
          <p>
            Seu plano inclui o <strong>Pix online</strong>: receba os pedidos já pagos, sem precisar conferir
            comprovante no WhatsApp.
          </p>
        </div>
        <ul className="flex flex-col gap-2">
          {perks.map((p) => (
            <li key={p} className="flex items-start gap-2">
              <FaCheckCircle className="mt-1 shrink-0 text-green-600" />
              <span>{p}</span>
            </li>
          ))}
        </ul>
        <button
          type="button"
          className="cursor-pointer flex items-center justify-center gap-2 px-4 py-2 bg-bite text-white rounded-full hover:opacity-90 transition-all mt-2"
          onClick={() => {
            setShow(false);
            onActivate();
          }}
        >
          <FaBolt /> Ativar Pix online
        </button>
        <button type="button" className="cursor-pointer text-sm underline opacity-70 hover:opacity-100" onClick={dismiss}>
          Não mostrar mais
        </button>
      </div>
    </GenericModal>
  );
}
