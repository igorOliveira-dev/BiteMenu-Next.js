"use client";

import { useEffect, useState } from "react";
import { FaCompass, FaMapMarkerAlt } from "react-icons/fa";
import GenericModal from "@/components/GenericModal";

const STORAGE_KEY = "bite_menu_address_update_notice";

// Convite pra quem tem endereço antigo (texto livre, sem cidade estruturada): sem o formato novo a loja não
// entra no Descobrir (api/descobrir exige address_details.city). Some sozinho quando o endereço é atualizado.
export default function AddressUpdateModal({ menu, onUpdate }) {
  const needsUpdate =
    !!menu?.address?.trim() && !menu?.address_details?.city && menu?.discoverable !== false;
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!needsUpdate) return;
    try {
      if (window.localStorage.getItem(STORAGE_KEY) === "off") return;
    } catch {}
    setShow(true);
  }, [needsUpdate]);

  if (!show) return null;

  const dismiss = () => {
    try {
      window.localStorage.setItem(STORAGE_KEY, "off");
    } catch {}
    setShow(false);
  };

  return (
    <GenericModal title="Apareça no Descobrir do Bite Menu" size="md" onClose={() => setShow(false)}>
      <div className="flex flex-col gap-4">
        <p className="flex items-start gap-2">
          <FaCompass className="mt-1 shrink-0 text-[var(--red)]" />
          <span>
            Lançamos o <strong>Descobrir</strong>: clientes da sua região encontram seu cardápio por cidade, bairro ou
            distância. Para sua loja aparecer lá, o endereço precisa estar no formato novo (CEP, rua, número, bairro,
            cidade e UF).
          </span>
        </p>
        <p className="flex items-start gap-2 text-sm opacity-80">
          <FaMapMarkerAlt className="mt-1 shrink-0" />
          <span>
            Endereço atual: <strong>{menu.address}</strong>
          </span>
        </p>
        <button
          type="button"
          className="cursor-pointer px-4 py-2 bg-bite text-white rounded-full hover:opacity-90 transition-all mt-2"
          onClick={() => {
            setShow(false);
            onUpdate();
          }}
        >
          Atualizar endereço
        </button>
        <button type="button" className="cursor-pointer text-sm underline opacity-70 hover:opacity-100" onClick={dismiss}>
          Não mostrar mais
        </button>
      </div>
    </GenericModal>
  );
}
