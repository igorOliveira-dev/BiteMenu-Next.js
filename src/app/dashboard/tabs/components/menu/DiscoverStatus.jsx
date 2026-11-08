"use client";

import { useEffect, useState } from "react";
import { FaCompass, FaMapMarkerAlt, FaCog, FaCheckCircle, FaExclamationTriangle, FaEyeSlash } from "react-icons/fa";
import useMenu from "@/hooks/useMenu";
import useUser from "@/hooks/useUser";
import { supabase } from "@/lib/supabaseClient";
import GenericModal from "@/components/GenericModal";
import AddressFields from "@/components/AddressFields";
import useModalBackHandler from "@/hooks/useModalBackHandler";
import { LANDING_ROLES } from "@/lib/landing";
import DiscoverOpenSelect from "./DiscoverOpenSelect";

const INPUT_CLASS =
  "h-11 w-full rounded-xl border border-[var(--translucid)] bg-translucid px-3 text-[15px] outline-none transition focus:border-brand-select/70";

// Indicador "aparece em Descobrir" sobre o banner, no estilo do StoreStatus.
// Mesmas regras de src/app/api/descobrir/route.js: se mudar lá, mudar aqui.
// Campos vêm do estado da edição (menuState do StatesManager), como hours no StoreStatus.
export default function DiscoverStatus({ setSelectedTab, menuState, saveAll, unsaved }) {
  const { menu } = useMenu();
  const { profile } = useUser();
  const [state, setState] = menuState || [];
  const [modalOpen, setModalOpen] = useState(false);
  const [addressDraft, setAddressDraft] = useState(null); // != null = modal de endereço aberto
  const [savingAddress, setSavingAddress] = useState(false);
  const [savingToggle, setSavingToggle] = useState(false);
  const [hasItems, setHasItems] = useState(null); // null = carregando

  // reconsulta ao abrir o modal: o dono pode ter ocultado/criado produtos na aba
  useEffect(() => {
    if (!menu?.id) return;
    let alive = true;
    supabase
      .from("categories")
      .select("menu_items(visible)")
      .eq("menu_id", menu.id)
      .then(({ data, error }) => {
        if (!alive || error) return;
        setHasItems(data.some((c) => (c.menu_items || []).some((i) => i.visible !== false)));
      });
    return () => {
      alive = false;
    };
  }, [menu?.id, modalOpen]);

  useModalBackHandler(modalOpen && addressDraft === null, () => setModalOpen(false));
  useModalBackHandler(addressDraft !== null, () => setAddressDraft(null));

  // dono com exclusão pedida não pode aparecer de jeito nenhum: nem mostra o status
  // (para a equipe, profile é o do funcionário, então só vale para o dono)
  if (!menu || !state || (profile?.deletion_requested_at && profile.id === menu.owner_id)) return null;

  // abre a seção e rola até o campo (ConfigMenu lê configMenuSection/configMenuField)
  const goToSlug = () => {
    setModalOpen(false);
    try {
      sessionStorage.setItem("configMenuSection", "basico");
      sessionStorage.setItem("configMenuField", "config-slug");
    } catch {}
    setSelectedTab("configMenu");
  };

  const openAddress = () => setAddressDraft(state.addressDetails || {});

  // mesmo caminho do assistente IA (applyAiChanges): aplica no estado e salva pelo saveAll
  const saveAddress = async () => {
    setSavingAddress(true);
    const next = { ...state, addressDetails: addressDraft };
    setState(next);
    await saveAll(next);
    setSavingAddress(false);
    setAddressDraft(null);
  };

  // mesmos campos de Configurações > Informações básicas, salvos na hora
  const saveField = async (patch) => {
    setSavingToggle(true);
    const next = { ...state, ...patch };
    setState(next);
    await saveAll(next);
    setSavingToggle(false);
  };

  const active = state.discoverable !== false;
  const reasons = [];
  if (active) {
    if (!state.addressDetails?.city)
      reasons.push({
        short: "Falta cidade no endereço",
        text: "O endereço não tem cidade. Preencha o endereço completo (o CEP completa o resto).",
        action: { label: "Corrigir endereço", icon: <FaMapMarkerAlt />, onClick: openAddress },
      });
    if (!state.slug)
      reasons.push({
        short: "Falta o link do cardápio",
        text: "O cardápio ainda não tem link.",
        action: { label: "Definir link em Configurações", icon: <FaCog />, onClick: goToSlug },
      });
    if (hasItems === false)
      reasons.push({
        short: "Nenhum produto visível",
        text: "Nenhum produto visível no cardápio. Crie ou exiba ao menos um produto nesta aba.",
      });
  }
  const loading = active && hasItems === null;
  const showing = active && !loading && !reasons.length;

  const label = loading ? "Verificando Descobrir" : showing ? "Aparece no Descobrir" : "Não aparece no Descobrir";
  const detail = !active
    ? "Opção desativada"
    : loading
      ? "..."
      : showing
        ? "Clientes encontram sua loja"
        : reasons.length > 1
          ? `${reasons[0].short} (+${reasons.length - 1})`
          : reasons[0].short;
  const dot = loading ? "bg-gray-400" : showing ? "bg-green-500" : active ? "bg-yellow-400" : "bg-gray-400";

  const card = !active
    ? {
        cls: "border-[var(--translucid)] bg-translucid",
        icon: <FaEyeSlash className="text-xl opacity-70" />,
        title: "Seu estabelecimento não aparece no Descobrir",
        text: "A opção \"Aparecer em Descobrir\" está desativada. Clientes não encontram sua loja na busca de restaurantes do Bite Menu.",
      }
    : showing
      ? {
          cls: "border-green-500/40 bg-green-500/10",
          icon: <FaCheckCircle className="text-xl text-green-500" />,
          title: "Seu estabelecimento aparece no Descobrir",
          text: "Clientes do Bite Menu encontram sua loja na busca por restaurantes perto deles.",
        }
      : {
          cls: "border-yellow-500/40 bg-yellow-500/10",
          icon: <FaExclamationTriangle className="text-xl text-yellow-500" />,
          title: loading ? "Verificando..." : "Seu estabelecimento não aparece no Descobrir",
          text: loading
            ? "Conferindo os produtos do cardápio."
            : `A opção está ativa, mas ${reasons.length > 1 ? "faltam alguns itens" : "falta um item"} para sua loja entrar na lista:`,
        };

  return (
    <>
      <button
        type="button"
        onClick={() => setModalOpen(true)}
        aria-label={`Descobrir: ${label}`}
        className="cursor-pointer absolute top-3 right-3 z-10 flex items-center gap-2 rounded-2xl bg-black/65 px-3 py-2 text-left text-white backdrop-blur-sm hover:bg-black/80 transition sm:px-4"
      >
        <span className={`h-3 w-3 shrink-0 rounded-full ${dot}`} />
        <span className="min-w-0 leading-tight">
          <span className="block max-w-[110px] text-xs font-semibold sm:max-w-none sm:text-sm">{label}</span>
          <span className="hidden text-xs opacity-80 sm:block">{detail}</span>
        </span>
        <FaCompass className="hidden shrink-0 opacity-70 sm:block" />
      </button>

      {modalOpen && addressDraft === null && (
        <GenericModal title="Descobrir" onClose={() => setModalOpen(false)} wfull maxWidth="420px" py="24px">
          <div className={`mb-4 rounded-xl border p-3 ${card.cls}`}>
            <div className="flex items-start gap-3">
              <span className="mt-0.5 shrink-0">{card.icon}</span>
              <div>
                <p className="font-semibold">{card.title}</p>
                <p className="mt-1 text-sm opacity-80">{card.text}</p>
              </div>
            </div>
          </div>

          <label className="mb-4 flex cursor-pointer items-center gap-3">
            <span className="switch shrink-0">
              <input
                type="checkbox"
                checked={active}
                disabled={savingToggle}
                onChange={(e) => saveField({ discoverable: e.target.checked })}
              />
              <span className="slider"></span>
            </span>
            <span className="text-sm font-medium">
              Aparecer em Descobrir {savingToggle && <span className="font-normal color-gray">· salvando...</span>}
            </span>
          </label>

          {LANDING_ROLES.includes(profile?.role) && (
            <div className="mb-4 text-sm">
              <span className="mb-1.5 block font-medium">No Descobrir, abrir primeiro</span>
              <DiscoverOpenSelect
                landing={state.discoverLanding}
                hasLanding={!!menu.landing_html}
                disabled={savingToggle}
                onChange={(discoverLanding) => saveField({ discoverLanding })}
              />
            </div>
          )}

          {reasons.length > 0 && (
            <div className="mb-4 rounded-xl border border-[var(--translucid)] p-3 text-sm">
              <p className="mb-2 font-semibold">O que falta</p>
              <ul className="space-y-3">
                {reasons.map((r) => (
                  <li key={r.text}>
                    <p>{r.text}</p>
                    {r.action && (
                      <button
                        type="button"
                        onClick={r.action.onClick}
                        className="mt-2 cursor-pointer inline-flex items-center gap-2 rounded-full bg-bite px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 transition"
                      >
                        {r.action.icon}
                        {r.action.label}
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p className="text-xs color-gray">
            Mudanças podem levar até 10 minutos para aparecer no Descobrir.
            {unsaved && " Você tem outras alterações não salvas: mudar as opções acima também salva elas."}
          </p>
        </GenericModal>
      )}

      {addressDraft !== null && (
        <GenericModal title="Endereço do estabelecimento" onClose={() => setAddressDraft(null)} wfull maxWidth="480px" py="24px">
          <p className="mb-4 text-sm color-gray">Digite o CEP para preencher automaticamente.</p>
          <AddressFields value={addressDraft} onChange={setAddressDraft} inputClassName={INPUT_CLASS} />
          {unsaved && (
            <p className="mt-3 text-xs color-gray">As outras alterações não salvas do painel também serão salvas.</p>
          )}
          <button
            type="button"
            onClick={saveAddress}
            disabled={!addressDraft.city?.trim() || savingAddress}
            className="mt-4 w-full cursor-pointer p-2 font-semibold text-white bg-bite rounded-full hover:opacity-90 transition disabled:cursor-not-allowed disabled:opacity-40"
          >
            {savingAddress ? "Salvando..." : "Salvar endereço"}
          </button>
        </GenericModal>
      )}
    </>
  );
}
