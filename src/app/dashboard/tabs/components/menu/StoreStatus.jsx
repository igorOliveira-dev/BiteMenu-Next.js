"use client";

import { useState } from "react";
import { FaClock } from "react-icons/fa";
import useMenu from "@/hooks/useMenu";
import { useAlert } from "@/providers/AlertProvider";
import { supabase } from "@/lib/supabaseClient";
import { updateMenuById } from "@/lib/queries/menus";
import GenericModal from "@/components/GenericModal";
import useModalBackHandler from "@/hooks/useModalBackHandler";
import { isOpenNow, getClosingTime, getNextOpenInfo } from "@/utils/storeHours";

// Indicador de loja aberta/fechada sobre o banner + modal de controle manual
// hours/timezone vêm do estado da edição, então refletem as configurações na hora
export default function StoreStatus({ setSelectedTab, hours, timezone }) {
  const { menu } = useMenu();
  const customAlert = useAlert();

  const [modalOpen, setModalOpen] = useState(false);
  const [askReset, setAskReset] = useState(false);
  // só lido ao montar: os handlers mutam `menu` (cache do useMenu) após salvar
  const [manualControl, setManualControl] = useState(!!menu?.manual_control);
  const [storeOpen, setStoreOpen] = useState(!!menu?.is_open);

  const closeModal = () => {
    setModalOpen(false);
    setAskReset(false);
  };
  useModalBackHandler(modalOpen, closeModal);

  if (!menu) return null;

  const open = manualControl ? storeOpen : isOpenNow(hours, timezone);

  let detail = "Controle manual";
  if (!manualControl) {
    const closing = open && getClosingTime(hours, timezone);
    const next = !open && getNextOpenInfo(hours, timezone);
    detail = closing
      ? `Fecha às ${closing}`
      : next
        ? `Abre ${next.label} às ${next.time}`
        : "Sem horário definido";
  }

  const handleToggleManualControl = async (value) => {
    setManualControl(value);

    const { error } = await updateMenuById(supabase, menu.id, {
      manual_control: value,
    });

    if (error) {
      customAlert("Erro ao atualizar controle manual da loja.", "error");
      setManualControl(!value);
    } else {
      menu.manual_control = value;
      customAlert("Controle manual da loja atualizado!", "success");
    }
  };

  const handleToggleStoreOpen = async (resetCounter = false) => {
    setAskReset(false);
    const value = !storeOpen;
    setStoreOpen(value);

    const { error } = await updateMenuById(supabase, menu.id, {
      is_open: value,
      ...(resetCounter ? { order_counter: 0 } : {}),
    });

    if (error) {
      customAlert("Erro ao atualizar status da loja.", "error");
      setStoreOpen(!value);
    } else {
      menu.is_open = value;
      customAlert(value ? "Loja aberta!" : "Loja fechada!", "success");
    }
  };

  const goToHours = () => {
    closeModal();
    try {
      sessionStorage.setItem("configMenuSection", "horarios");
    } catch {}
    setSelectedTab("configMenu");
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setModalOpen(true)}
        className="cursor-pointer absolute top-3 left-3 z-10 flex items-center gap-3 rounded-2xl bg-black/65 px-4 py-2 text-left text-white backdrop-blur-sm hover:bg-black/80 transition"
      >
        <span className={`h-3 w-3 shrink-0 rounded-full ${open ? "bg-green-500" : "bg-red-500"}`} />
        <span className="leading-tight">
          <span className="block text-sm font-semibold">{open ? "Loja aberta" : "Loja fechada"}</span>
          <span className="block text-xs opacity-80">{detail}</span>
        </span>
        <FaClock className="shrink-0 opacity-70" />
      </button>

      {modalOpen && (
        <GenericModal title="Abertura da loja" onClose={closeModal} wfull maxWidth="420px" py="24px">
          {askReset ? (
            <>
              <p className="mb-2 text-sm">Deseja reiniciar a numeração dos pedidos ao fechar a loja?</p>
              <p className="mb-6 text-xs color-gray">
                Se estiver fechando para um intervalo, é recomendável escolher &quot;Não&quot;: a numeração
                continua de onde parou quando você abrir a loja de novo.
              </p>
              <div className="grid gap-2">
                <button
                  type="button"
                  onClick={() => handleToggleStoreOpen()}
                  className="cursor-pointer p-2 bg-green-600/80 text-white font-semibold rounded-lg hover:bg-green-700/80 border-2 border-[var(--translucid)] transition"
                >
                  Manter numeração
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleStoreOpen(true)}
                  className="cursor-pointer p-2 font-semibold rounded-lg hover:bg-[var(--translucid)] border-2 border-[var(--translucid)] transition"
                >
                  Resetar numeração
                </button>
              </div>
            </>
          ) : (
            <>
              <p className={`mb-4 text-sm font-semibold ${open ? "text-green-500" : "text-red-500"}`}>
                {open ? "Loja aberta" : "Loja fechada"}
                <span className="font-normal color-gray"> · {manualControl ? "controle manual" : "pelo horário"}</span>
              </p>

              <label className="flex items-center gap-2">
                <span className="switch">
                  <input
                    type="checkbox"
                    checked={manualControl}
                    onChange={(e) => handleToggleManualControl(e.target.checked)}
                  />
                  <span className="slider"></span>
                </span>
                <span>Controle manual de abertura e fechamento</span>
              </label>

              <p className="mt-2 mb-3 text-xs color-gray">
                Quando ativado, o horário de funcionamento é ignorado e a loja só abre e fecha pelo botão abaixo.
              </p>

              <button
                type="button"
                onClick={() => (storeOpen ? setAskReset(true) : handleToggleStoreOpen())}
                disabled={!manualControl}
                className={`w-full cursor-pointer rounded-xl px-3 py-2 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-40 ${
                  storeOpen ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"
                }`}
              >
                {storeOpen ? "Fechar loja" : "Abrir loja"}
              </button>

              <hr className="my-4 border-translucid" />

              <button
                type="button"
                onClick={goToHours}
                className="w-full cursor-pointer flex items-center justify-center gap-2 p-2 font-semibold rounded-lg hover:bg-[var(--translucid)] border-2 border-[var(--translucid)] transition"
              >
                <FaClock />
                Configurar horários
              </button>
            </>
          )}
        </GenericModal>
      )}
    </>
  );
}
