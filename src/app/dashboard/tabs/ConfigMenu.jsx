"use client";

import React, { useEffect, useState } from "react";
import { FaPen, FaChevronLeft, FaLightbulb, FaTrash, FaChevronDown, FaChevronUp } from "react-icons/fa";
import { COLOR_PALETTES } from "@/consts/colorPallets";
import useMenu from "@/hooks/useMenu";
import Loading from "@/components/Loading";
import GenericModal from "@/components/GenericModal";
import { useAlert } from "@/providers/AlertProvider";
import useModalBackHandler from "@/hooks/useModalBackHandler";
import { useConfirm } from "@/providers/ConfirmProvider";
import useUser from "@/hooks/useUser";

const DEFAULT_HOURS = {
  mon: "09:00-18:00",
  tue: "09:00-18:00",
  wed: "09:00-18:00",
  thu: "09:00-18:00",
  fri: "09:00-18:00",
  sat: "09:00-18:00",
  sun: "09:00-18:00",
};

function normalizeHours(data) {
  if (!data) return { ...DEFAULT_HOURS };

  if (data?.hours && typeof data.hours === "string" && Array.isArray(data.days)) {
    const obj = {};
    data.days.forEach((day) => {
      obj[day] = data.hours;
    });
    return { ...DEFAULT_HOURS, ...obj };
  }

  return { ...DEFAULT_HOURS, ...data };
}

function createZoneId(index = 0) {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `zone-${Date.now()}-${index}-${Math.random().toString(36).slice(2)}`;
}

function normalizeDeliveryZones(zones = []) {
  if (!Array.isArray(zones)) return [];

  return zones.map((zone, index) => ({
    id: zone?.id || createZoneId(index),
    name: zone?.name || "",
    shipping_fee: zone?.shipping_fee !== undefined && zone?.shipping_fee !== null ? String(zone.shipping_fee) : "",
  }));
}

function createEmptyZone() {
  return {
    id: createZoneId(),
    name: "",
    shipping_fee: "",
  };
}

const ConfigMenu = (props) => {
  const {
    setSelectedTab,
    title: propTitle,
    setTitle: propSetTitle,
    description: propDescription,
    setDescription: propSetDescription,
    address: propAddress,
    setAddress: propSetAddress,
    backgroundColor: propBg,
    setBackgroundColor: propSetBg,
    titleColor: propTitleColor,
    setTitleColor: propSetTitleColor,
    detailsColor: propDetailsColor,
    setDetailsColor: propSetDetailsColor,
    menuState,
  } = props;

  const confirm = useConfirm();
  const customAlert = useAlert();

  const { profile, loadingUser } = useUser();
  const { menu, loading } = useMenu();

  const [userRole, setUserRole] = useState(null);

  const [expandedZones, setExpandedZones] = useState(false);

  const usingExternal = Array.isArray(menuState) && menuState.length === 2;
  const [externalState, externalSetState] = usingExternal ? menuState : [null, null];

  const [slugLocal, setSlugLocal] = useState(menu?.slug ?? "");
  const [selectedServicesLocal, setSelectedServicesLocal] = useState(menu?.services ?? []);
  const [selectedPaymentsLocal, setSelectedPaymentsLocal] = useState(menu?.payments ?? []);
  const [deliveryFeeLocal, setDeliveryFeeLocal] = useState(
    menu?.delivery_fee !== undefined && menu?.delivery_fee !== null ? String(menu.delivery_fee) : "",
  );
  const [deliveryZonesLocal, setDeliveryZonesLocal] = useState(normalizeDeliveryZones(menu?.delivery_zones));
  const [deliveryFeeModeLocal, setDeliveryFeeModeLocal] = useState(menu?.delivery_fee_mode ?? null);
  const [pixKeyLocal, setPixKeyLocal] = useState(menu?.pix_key ?? null);
  const [hoursLocal, setHoursLocal] = useState(() => normalizeHours(menu?.hours));

  const slug = usingExternal ? externalState?.slug : slugLocal;
  const setSlug = usingExternal ? (v) => externalSetState((p) => ({ ...p, slug: v })) : setSlugLocal;

  const selectedServices = usingExternal ? (externalState?.selectedServices ?? []) : (selectedServicesLocal ?? []);
  const setSelectedServices = usingExternal
    ? (arr) => externalSetState((p) => ({ ...p, selectedServices: arr }))
    : setSelectedServicesLocal;

  const selectedPayments = usingExternal ? (externalState?.selectedPayments ?? []) : (selectedPaymentsLocal ?? []);
  const setSelectedPayments = usingExternal
    ? (arr) => externalSetState((p) => ({ ...p, selectedPayments: arr }))
    : setSelectedPaymentsLocal;

  const deliveryFee = usingExternal ? (externalState?.deliveryFee ?? "") : deliveryFeeLocal;
  const setDeliveryFee = usingExternal ? (v) => externalSetState((p) => ({ ...p, deliveryFee: v })) : setDeliveryFeeLocal;

  const deliveryZones = usingExternal
    ? normalizeDeliveryZones(externalState?.deliveryZones)
    : normalizeDeliveryZones(deliveryZonesLocal);

  const setDeliveryZones = usingExternal
    ? (arrOrUpdater) =>
        externalSetState((prev) => {
          const current = normalizeDeliveryZones(prev?.deliveryZones);
          const next = typeof arrOrUpdater === "function" ? arrOrUpdater(current) : arrOrUpdater;
          return { ...prev, deliveryZones: normalizeDeliveryZones(next) };
        })
    : (arrOrUpdater) =>
        setDeliveryZonesLocal((prev) => {
          const current = normalizeDeliveryZones(prev);
          const next = typeof arrOrUpdater === "function" ? arrOrUpdater(current) : arrOrUpdater;
          return normalizeDeliveryZones(next);
        });

  const deliveryFeeMode = usingExternal ? (externalState?.deliveryFeeMode ?? null) : deliveryFeeModeLocal;

  const setDeliveryFeeMode = usingExternal
    ? (v) => externalSetState((p) => ({ ...p, deliveryFeeMode: v }))
    : setDeliveryFeeModeLocal;

  const pixKey = usingExternal ? (externalState?.pixKey ?? null) : pixKeyLocal;
  const setPixKey = usingExternal ? (v) => externalSetState((p) => ({ ...p, pixKey: v })) : setPixKeyLocal;

  const hours = normalizeHours(usingExternal ? externalState?.hours : hoursLocal);

  const safeSetHours = (updaterOrValue) => {
    if (usingExternal) {
      if (typeof updaterOrValue === "function") {
        externalSetState((prev) => {
          const prevHours = normalizeHours(prev?.hours);
          const nextRaw = updaterOrValue(prevHours);
          const next = normalizeHours(nextRaw);
          return { ...prev, hours: next };
        });
      } else {
        externalSetState((prev) => ({
          ...prev,
          hours: normalizeHours(updaterOrValue),
        }));
      }
    } else {
      setHoursLocal((prevRaw) => {
        const prevHours = normalizeHours(prevRaw);
        if (typeof updaterOrValue === "function") {
          const nextRaw = updaterOrValue(prevHours);
          return normalizeHours(nextRaw);
        }
        return normalizeHours(updaterOrValue);
      });
    }
  };

  const [titleModalOpen, setTitleModalOpen] = useState(false);
  const [descModalOpen, setDescModalOpen] = useState(false);
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [slugModalOpen, setSlugModalOpen] = useState(false);

  const [tempTitle, setTempTitle] = useState(propTitle ?? "");
  const [tempDescription, setTempDescription] = useState(propDescription ?? "");
  const [tempAddress, setTempAddress] = useState(propAddress ?? "");
  const [tempSlug, setTempSlug] = useState(slug ?? "");

  const visibleZones = expandedZones ? deliveryZones : deliveryZones.slice(0, 2);

  useModalBackHandler(titleModalOpen, () => setTitleModalOpen(false));
  useModalBackHandler(descModalOpen, () => setDescModalOpen(false));
  useModalBackHandler(addressModalOpen, () => setAddressModalOpen(false));
  useModalBackHandler(slugModalOpen, () => setSlugModalOpen(false));

  useEffect(() => {
    if (!menu) return;

    if (menu.title) {
      if (!usingExternal && typeof propSetTitle === "function") propSetTitle(menu.title);
      setTempTitle(menu.title);
    }

    if (menu.description) {
      if (!usingExternal && typeof propSetDescription === "function") {
        propSetDescription(menu.description);
      }
      setTempDescription(menu.description);
    }

    if (menu.address) {
      if (!usingExternal && typeof propSetAddress === "function") {
        propSetAddress(menu.address);
      }
      setTempAddress(menu.address);
    }

    if (menu.slug) {
      if (!usingExternal) setSlugLocal(menu.slug);
      setTempSlug(menu.slug);
    }

    if (menu.services && !usingExternal) setSelectedServicesLocal(menu.services);
    if (menu.payments && !usingExternal) setSelectedPaymentsLocal(menu.payments);

    if (!usingExternal) {
      setDeliveryFeeLocal(menu?.delivery_fee !== undefined && menu?.delivery_fee !== null ? String(menu.delivery_fee) : "");
      setDeliveryZonesLocal(normalizeDeliveryZones(menu?.delivery_zones));
      setDeliveryFeeModeLocal(menu?.delivery_fee_mode ?? null);
    }

    if (menu.pix_key && !usingExternal) setPixKeyLocal(menu.pix_key);

    if (menu.background_color && !usingExternal && typeof propSetBg === "function") {
      propSetBg(menu.background_color);
    }

    if (menu.title_color && !usingExternal && typeof propSetTitleColor === "function") {
      propSetTitleColor(menu.title_color);
    }

    if (menu.details_color && !usingExternal && typeof propSetDetailsColor === "function") {
      propSetDetailsColor(menu.details_color);
    }

    if (menu.hours && !usingExternal) safeSetHours(menu.hours);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [menu?.id]);

  useEffect(() => {
    setTempTitle(propTitle);
    setTempDescription(propDescription);
    setTempAddress(propAddress);
  }, [propTitle, propDescription, propAddress]);

  useEffect(() => {
    if (!loading && profile) {
      const role = profile.role;
      setUserRole(role);
    }
  }, [profile]);

  const [paletteIndex, setPaletteIndex] = useState(0);

  const colorFields = [
    { label: "Cor do fundo:", value: propBg, setter: propSetBg },
    { label: "Cor do título:", value: propTitleColor, setter: propSetTitleColor },
    { label: "Cor dos detalhes:", value: propDetailsColor, setter: propSetDetailsColor },
  ];

  const serviceOptions = [
    { id: "delivery", label: "Entrega" },
    { id: "pickup", label: "Retirada" },
    { id: "dinein", label: "Comer no local" },
    { id: "faceToFace", label: "Atendimento presencial" },
  ];

  const paymentOptions = [
    { id: "cash", label: "Dinheiro" },
    { id: "debit", label: "Débito" },
    { id: "credit", label: "Crédito" },
    { id: "pix", label: "PIX" },
  ];

  const dayLabels = {
    mon: "Seg",
    tue: "Ter",
    wed: "Qua",
    thu: "Qui",
    fri: "Sex",
    sat: "Sáb",
    sun: "Dom",
  };

  function slugify(value) {
    return value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9-]/g, "")
      .replace(/-+/g, "-");
  }

  const dayOrder = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

  const suggestRandomPalette = () => {
    let next = Math.floor(Math.random() * COLOR_PALETTES.length);
    while (next === paletteIndex) {
      next = Math.floor(Math.random() * COLOR_PALETTES.length);
    }
    setPaletteIndex(next);

    const { bg, title, details } = COLOR_PALETTES[next];

    if (usingExternal) {
      externalSetState((p) => ({
        ...p,
        backgroundColor: bg,
        titleColor: title,
        detailsColor: details,
      }));
    } else {
      if (typeof propSetBg === "function") propSetBg(bg);
      if (typeof propSetTitleColor === "function") propSetTitleColor(title);
      if (typeof propSetDetailsColor === "function") propSetDetailsColor(details);
    }
  };

  const toggleService = (id) => {
    const prev = selectedServices || [];

    if (prev.length === 1 && prev.includes(id)) {
      customAlert("Mantenha ao menos 1 serviço.");
      return;
    }

    let next;
    if (prev.includes(id)) next = prev.filter((s) => s !== id);
    else next = [...prev, id];

    setSelectedServices(next);

    if (id === "delivery" && prev.includes("delivery")) {
      setDeliveryFeeMode(null);
    }
  };

  const togglePayment = (id) => {
    const prev = selectedPayments || [];

    let next;
    if (prev.includes(id)) next = prev.filter((p) => p !== id);
    else next = [...prev, id];

    if (next.length === 0) {
      customAlert("Mantenha ao menos 1 forma de pagamento.");
      return;
    }

    setSelectedPayments(next);
  };

  const addDeliveryZone = () => {
    setDeliveryZones((prev) => [...prev, createEmptyZone()]);
  };

  const updateDeliveryZone = (id, field, value) => {
    setDeliveryZones((prev) =>
      prev.map((zone) => {
        if (zone.id !== id) return zone;

        if (field === "shipping_fee") {
          let nextValue = String(value ?? "").replace(",", ".");
          if (nextValue.includes("-")) nextValue = nextValue.replace("-", "");
          return { ...zone, [field]: nextValue };
        }

        return { ...zone, [field]: value };
      }),
    );
  };

  const removeDeliveryZone = async (id) => {
    const ok = await confirm("Tem certeza que deseja remover este bairro?");
    if (ok) {
      setDeliveryZones((prev) => prev.filter((zone) => zone.id !== id));
    }
  };

  const toggleDeliveryMode = (mode) => {
    if (deliveryFeeMode === mode) {
      setDeliveryFeeMode(null);
      return;
    }
    setDeliveryFeeMode(mode);
  };

  if (loading) return <Loading />;

  return (
    <>
      <div className="sm:pb-0 m-2 pb-32 flex flex-col items-center lg:items-start">
        <div className="max-w-[720px] sm:w-[calc(100dvw-86px)] w-[calc(100dvw-20px)]">
          <div className="flex items-center mb-4 gap-2">
            <div onClick={() => setSelectedTab("menu")}>
              <FaChevronLeft className="cursor-pointer" />
            </div>
            <h2 className="xs:font-semibold">Configurações do cardápio</h2>
          </div>

          <div>
            <div className="flex sm:items-center max-w-full min-h-[46px] flex-col sm:flex-row">
              <p className="font-semibold mr-2 whitespace-nowrap">Nome do estabelecimento:</p>
              <div onClick={() => setTitleModalOpen(true)} className="flex w-full">
                <span className="bg-translucid p-2 rounded-lg w-full">
                  {propTitle ? propTitle : <span className="color-gray">Insira o nome</span>}
                </span>
                <button className="border border-2 border-gray-500 p-2 bg-translucid-50 rounded-lg ml-2 opacity-75 hover:opacity-100 cursor-pointer">
                  <FaPen className="font-xl text-white opacity-75" />
                </button>
              </div>
            </div>
            <hr className="border-1 border-translucid mt-2 mb-4 max-w-full" />
          </div>

          <div>
            <div className="flex sm:items-center max-w-full min-h-[46px] flex-col sm:flex-row">
              <p className="font-semibold mr-2 whitespace-nowrap">Descrição:</p>
              <div onClick={() => setDescModalOpen(true)} className="flex w-full">
                <span className="bg-translucid p-2 rounded-lg w-full">
                  {propDescription ? propDescription : <span className="color-gray">Insira a descrição</span>}
                </span>
                <button className="border border-2 border-gray-500 p-2 bg-translucid-50 rounded-lg ml-2 opacity-75 hover:opacity-100 cursor-pointer">
                  <FaPen className="font-xl text-white opacity-75" />
                </button>
              </div>
            </div>
            <hr className="border-1 border-translucid mt-2 mb-4 max-w-full" />
          </div>

          <div>
            <div className="flex sm:items-center max-w-full min-h-[46px] flex-col sm:flex-row">
              <p className="font-semibold mr-2 whitespace-nowrap">Endereço:</p>
              <div onClick={() => setAddressModalOpen(true)} className="flex w-full">
                <span className="bg-translucid p-2 rounded-lg w-full">
                  {propAddress ? propAddress : <span className="color-gray">Insira o endereço</span>}
                </span>
                <button className="border border-2 border-gray-500 p-2 bg-translucid-50 rounded-lg ml-2 opacity-75 hover:opacity-100 cursor-pointer">
                  <FaPen className="font-xl text-white opacity-75" />
                </button>
              </div>
            </div>
            <hr className="border-1 border-translucid mt-2 mb-4 max-w-full" />
          </div>

          <div>
            <div className="flex sm:items-center max-w-full min-h-[46px] flex-col sm:flex-row">
              <p className="font-semibold mr-2 whitespace-nowrap">Slug:</p>
              <div onClick={() => setSlugModalOpen(true)} className="flex w-full items-center">
                <span>bitemenu.com.br/menu/</span>
                <span className="bg-translucid p-2 rounded-lg w-full overflow-hidden whitespace-nowrap text-ellipsis">
                  {slug ? slug : <span className="color-gray">Insira o slug</span>}
                </span>
                <button className="border border-2 border-gray-500 p-2 bg-translucid-50 rounded-lg ml-2 opacity-75 hover:opacity-100 cursor-pointer">
                  <FaPen className="font-xl text-white opacity-75" />
                </button>
              </div>
            </div>
            <hr className="border-1 border-translucid mt-2 mb-4 max-w-full" />
          </div>

          <div className="mt-2 max-w-full">
            <p className="font-semibold mb-2">Cores do cardápio:</p>

            <div className="flex flex-col space-y-3">
              {colorFields.map((item, idx) => (
                <div key={idx} className="flex items-center space-x-3">
                  <label className="w-36">{item.label}</label>
                  <input
                    type="color"
                    value={item.value}
                    onChange={(e) => item.setter && item.setter(e.target.value)}
                    className="h-8 w-8 rounded"
                    aria-label={item.label}
                  />
                </div>
              ))}
            </div>

            <div className="mt-4 flex items-center space-x-3">
              <button type="button" onClick={suggestRandomPalette} className="custom-gray-button has-icon">
                <FaLightbulb /> Sugerir cores
              </button>
            </div>
            <hr className="border-1 border-translucid mt-2 mb-4 max-w-full" />
          </div>

          <div className="mb-4">
            <p className="font-semibold mb-2">Serviços disponíveis:</p>

            <div className="grid grid-cols-1 xs:grid-cols-2 gap-y-4 max-w-160">
              {serviceOptions.map((opt) => (
                <label key={opt.id} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    value={opt.id}
                    checked={selectedServices?.includes(opt.id)}
                    onChange={() => toggleService(opt.id)}
                    className="peer appearance-none w-6 h-6 border-2 rounded-md transition-all duration-150 flex items-center justify-center relative"
                    style={{
                      borderColor: "#155dfc",
                      backgroundColor: selectedServices?.includes(opt.id) ? "#155dfc" : "transparent",
                    }}
                  />
                  <span
                    className="relative after:content-['✓'] after:absolute after:text-white after:text-sm after:font-bold after:top-[3px] after:left-[-25px] peer-checked:after:opacity-100 after:opacity-0 transition-opacity duration-150 text-sm"
                    style={{ color: "var(--gray)" }}
                  >
                    {opt.label}
                  </span>
                </label>
              ))}
            </div>

            {selectedServices?.includes("delivery") && (
              <div className="mt-5">
                <p className="font-semibold mb-3">Forma de cobrança do frete:</p>

                <div className="flex flex-col gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <span className="switch">
                      <input
                        type="checkbox"
                        checked={deliveryFeeMode === "fixed"}
                        onChange={() => toggleDeliveryMode("fixed")}
                      />
                      <span className="slider"></span>
                    </span>
                    <span>Usar taxa fixa de entrega</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <span className="switch">
                      <input
                        type="checkbox"
                        checked={deliveryFeeMode === "zones"}
                        onChange={() => toggleDeliveryMode("zones")}
                      />
                      <span className="slider"></span>
                    </span>
                    <span>Usar taxa por bairro</span>
                  </label>
                </div>

                {deliveryFeeMode === "fixed" && (
                  <div className="mt-4">
                    <label className="flex items-center w-[300px] gap-2">
                      <span className="whitespace-nowrap">Taxa de entrega (R$):</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={deliveryFee || ""}
                        onChange={(e) => setDeliveryFee(String(e.target.value).replace(",", "."))}
                        placeholder="0.00"
                        className="p-1 rounded border-2 border-translucid bg-translucid flex-1 min-w-0"
                      />
                    </label>
                  </div>
                )}

                {deliveryFeeMode === "zones" && (
                  <>
                    {userRole === "admin" || userRole === "plus" || userRole === "pro" ? (
                      <div className="mt-4">
                        <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
                          <p className="font-semibold">Bairros e taxas de entrega:</p>

                          <button type="button" onClick={addDeliveryZone} className="custom-gray-button">
                            Adicionar bairro
                          </button>
                        </div>

                        {deliveryZones.length === 0 ? (
                          <div className="p-3 rounded-lg color-gray">Nenhum bairro cadastrado ainda.</div>
                        ) : (
                          <div className="flex flex-col gap-3">
                            {visibleZones.map((zone, index) => (
                              <div key={zone.id} className="border-2 border-translucid rounded-xl p-3 bg-translucid">
                                <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
                                  <div className="flex flex-col flex-1">
                                    <label className="mb-1 text-sm color-gray">Bairro {index + 1}</label>
                                    <input
                                      type="text"
                                      value={zone.name}
                                      onChange={(e) => updateDeliveryZone(zone.id, "name", e.target.value)}
                                      placeholder="Ex.: Centro"
                                      className="p-2 rounded border-2 border-translucid bg-background"
                                    />
                                  </div>

                                  <div className="flex flex-col w-full sm:w-[170px]">
                                    <label className="mb-1 text-sm color-gray">Taxa (R$)</label>
                                    <input
                                      type="number"
                                      min="0"
                                      step="0.01"
                                      value={zone.shipping_fee}
                                      onChange={(e) => updateDeliveryZone(zone.id, "shipping_fee", e.target.value)}
                                      placeholder="0.00"
                                      className="p-2 rounded border-2 border-translucid bg-background"
                                    />
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => removeDeliveryZone(zone.id)}
                                    className="cursor-pointer px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-all flex gap-2 items-center justify-center"
                                  >
                                    Remover
                                  </button>
                                </div>
                              </div>
                            ))}

                            {deliveryZones.length > 2 && (
                              <button
                                type="button"
                                onClick={() => setExpandedZones((prev) => !prev)}
                                className="w-full p-3 rounded-xl border-2 border-dashed border-translucid bg-translucid hover:opacity-80 transition-all text-sm font-medium cursor-pointer"
                              >
                                {expandedZones ? (
                                  <div className="flex items-center justify-center gap-2">
                                    <FaChevronUp /> Mostrar menos bairros
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-center gap-2">
                                    <FaChevronDown /> Ver mais {deliveryZones.length - 2} bairro
                                    {deliveryZones.length - 2 > 1 ? "s" : ""}
                                  </div>
                                )}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-[var(--gray)] my-4">
                        Você precisa estar com o plano Plus ou Pro para gerenciar taxas por bairro. <br /> Seu cardápio
                        utilizará a taxa fixa de entrega.
                      </p>
                    )}
                  </>
                )}
              </div>
            )}

            <hr className="border-1 border-translucid mt-4 mb-4 max-w-full" />
          </div>

          <div className="mb-4">
            <p className="font-semibold mb-2">Formas de pagamento:</p>
            <div className="grid grid-cols-2 gap-4 max-w-160">
              {paymentOptions.map((opt) => (
                <label key={opt.id} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    value={opt.id}
                    checked={selectedPayments?.includes(opt.id)}
                    onChange={() => togglePayment(opt.id)}
                    className="peer appearance-none w-6 h-6 border-2 rounded-md transition-all duration-150 flex items-center justify-center relative"
                    style={{
                      borderColor: "#155dfc",
                      backgroundColor: selectedPayments?.includes(opt.id) ? "#155dfc" : "transparent",
                    }}
                  />
                  <span
                    className="relative after:content-['✓'] after:absolute after:text-white after:text-sm after:font-bold after:top-[3px] after:left-[-25px] peer-checked:after:opacity-100 after:opacity-0 transition-opacity duration-150"
                    style={{ color: "var(--gray)" }}
                  >
                    {opt.label}
                  </span>
                </label>
              ))}
            </div>

            {selectedPayments?.includes("pix") && (
              <div className="mt-4">
                <label className="flex items-center w-[300px] gap-2">
                  <span className="whitespace-nowrap">Chave PIX:</span>
                  <input
                    type="text"
                    value={pixKey || ""}
                    onChange={(e) => setPixKey(e.target.value)}
                    placeholder="Sem chave pix"
                    className="p-1 rounded border-2 border-translucid bg-translucid flex-1 min-w-0"
                  />
                </label>
              </div>
            )}

            <hr className="border-1 border-translucid mt-2 mb-4 max-w-full" />
          </div>

          <div className="mb-4">
            <p className="font-semibold mb-2">Horários de funcionamento:</p>
            <div className="flex flex-col space-y-2">
              {dayOrder.map((day) => {
                const value = hours?.[day];
                const isClosed = value === null;
                const [openTime, closeTime] = typeof value === "string" ? value.split("-") : ["", ""];

                return (
                  <div key={day}>
                    <label className="w-10">{dayLabels[day]}:</label>

                    <div className="flex gap-2 items-center">
                      <input
                        type="time"
                        value={openTime || ""}
                        disabled={isClosed}
                        onChange={(e) => {
                          const newOpen = e.target.value;
                          safeSetHours((prev) => {
                            const base = { ...prev };
                            const currentClose = typeof base[day] === "string" ? base[day].split("-")[1] : "23:59";
                            base[day] = `${newOpen}-${currentClose || "23:59"}`;
                            return base;
                          });
                        }}
                        className="border rounded p-1 cursor-pointer w-[78px] xxs:w-[90px] text-sm xxs:text-base"
                      />

                      <span className="hidden xs:block">-</span>

                      <input
                        type="time"
                        value={closeTime || ""}
                        disabled={isClosed}
                        onChange={(e) => {
                          const newClose = e.target.value;
                          safeSetHours((prev) => {
                            const base = { ...prev };
                            const currentOpen = typeof base[day] === "string" ? base[day].split("-")[0] : "00:00";
                            base[day] = `${currentOpen || "00:00"}-${newClose}`;
                            return base;
                          });
                        }}
                        className="border rounded p-1 text-foreground cursor-pointer w-[78px] xxs:w-[90px] text-sm xxs:text-base"
                      />

                      <label className="ml-2 flex items-center space-x-1 cursor-pointer">
                        <span className="switch">
                          <input
                            type="checkbox"
                            checked={isClosed}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              safeSetHours((prev) => {
                                const base = { ...prev };
                                base[day] = checked ? null : typeof base[day] === "string" ? base[day] : DEFAULT_HOURS[day];
                                return base;
                              });
                            }}
                          />
                          <span className="slider"></span>
                        </span>

                        <span>Fechado</span>
                      </label>
                    </div>
                    <hr className="border-1 mt-2 border-[var(--translucid)]" />
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              className="custom-gray-button mt-4"
              onClick={() => {
                safeSetHours((prev) => {
                  const newObj = { ...prev };
                  Object.keys(newObj).forEach((d) => {
                    newObj[d] = "00:00-23:59";
                  });
                  return newObj;
                });
              }}
            >
              Definir 24h para todos
            </button>
          </div>
        </div>
      </div>

      {titleModalOpen && (
        <GenericModal title="Alterar nome" onClose={() => setTitleModalOpen(false)} wfull size="md">
          <input
            type="text"
            placeholder="Novo título"
            value={tempTitle || ""}
            onChange={(e) => {
              const v = e.target.value.slice(0, 30);
              setTempTitle(v);
            }}
            maxLength={30}
            className="w-full p-2 rounded border-2 border-translucid bg-translucid mb-4"
          />

          <div className="flex items-center justify-between mb-4">
            <div className="text-sm color-gray">{(tempTitle || "").length}/30</div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                setTempTitle(propTitle);
                setTitleModalOpen(false);
              }}
              className="cursor-pointer px-4 py-2 bg-gray-600 rounded hover:bg-gray-500 transition text-white"
            >
              Cancelar
            </button>
            <button
              onClick={() => {
                if (usingExternal) externalSetState((p) => ({ ...p, title: tempTitle }));
                else if (typeof propSetTitle === "function") propSetTitle(tempTitle);
                setTitleModalOpen(false);
              }}
              className="cursor-pointer px-4 py-2 bg-green-600 rounded hover:bg-green-500 transition text-white"
            >
              Salvar
            </button>
          </div>
        </GenericModal>
      )}

      {descModalOpen && (
        <GenericModal title="Alterar descrição" onClose={() => setDescModalOpen(false)} wfull size="md">
          <textarea
            placeholder="Nova descrição"
            value={tempDescription || ""}
            onChange={(e) => {
              const v = e.target.value.slice(0, 200);
              setTempDescription(v);
            }}
            maxLength={200}
            rows={4}
            className="w-full p-2 rounded border-2 border-translucid bg-translucid mb-4"
          />

          <div className="flex items-center justify-between mb-4">
            <div className="text-sm color-gray">{(tempDescription || "").length}/200</div>
            <div className="text-sm color-gray">Dica: seja objetivo.</div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                setTempDescription(propDescription);
                setDescModalOpen(false);
              }}
              className="cursor-pointer px-4 py-2 bg-gray-600 rounded hover:bg-gray-500 transition text-white"
            >
              Cancelar
            </button>

            <button
              onClick={() => {
                const finalDesc = (tempDescription || "").slice(0, 200);

                if (usingExternal) {
                  externalSetState((p) => ({ ...p, description: finalDesc }));
                } else if (typeof propSetDescription === "function") {
                  propSetDescription(finalDesc);
                }

                setDescModalOpen(false);
              }}
              className="cursor-pointer px-4 py-2 bg-green-600 rounded hover:bg-green-500 transition text-white"
            >
              Salvar
            </button>
          </div>
        </GenericModal>
      )}

      {addressModalOpen && (
        <GenericModal title="Alterar endereço" onClose={() => setAddressModalOpen(false)} wfull size="md">
          <textarea
            placeholder="Novo endereço"
            value={tempAddress || ""}
            onChange={(e) => {
              const v = e.target.value.slice(0, 255);
              setTempAddress(v);
            }}
            maxLength={255}
            rows={4}
            className="w-full p-2 rounded border-2 border-translucid bg-translucid mb-4"
          />

          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                setTempAddress(propAddress);
                setAddressModalOpen(false);
              }}
              className="cursor-pointer px-4 py-2 bg-gray-600 rounded hover:bg-gray-500 transition text-white"
            >
              Cancelar
            </button>

            <button
              onClick={() => {
                const finalAddress = (tempAddress || "").slice(0, 255);

                if (usingExternal) {
                  externalSetState((p) => ({ ...p, address: finalAddress }));
                } else if (typeof propSetAddress === "function") {
                  propSetAddress(finalAddress);
                }

                setAddressModalOpen(false);
              }}
              className="cursor-pointer px-4 py-2 bg-green-600 rounded hover:bg-green-500 transition text-white"
            >
              Salvar
            </button>
          </div>
        </GenericModal>
      )}

      {slugModalOpen && (
        <GenericModal title="Alterar slug" onClose={() => setSlugModalOpen(false)} wfull size="md">
          <input
            type="text"
            placeholder="Novo slug"
            value={tempSlug || ""}
            onChange={(e) => {
              const v = e.target.value.slice(0, 20);
              setTempSlug(slugify(v));
            }}
            maxLength={20}
            className="w-full p-2 rounded border-2 border-translucid bg-translucid mb-4"
          />

          <div className="flex items-center justify-between mb-4">
            <div className="text-sm color-gray">{(tempSlug || "").length}/20</div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                setTempSlug(slug);
                setSlugModalOpen(false);
              }}
              className="cursor-pointer px-4 py-2 bg-gray-600 rounded hover:bg-gray-500 transition text-white"
            >
              Cancelar
            </button>
            <button
              onClick={() => {
                if (usingExternal) externalSetState((p) => ({ ...p, slug: tempSlug }));
                else setSlugLocal(tempSlug);
                setSlugModalOpen(false);
              }}
              className="cursor-pointer px-4 py-2 bg-green-600 rounded hover:bg-green-500 transition text-white"
            >
              Salvar
            </button>
          </div>
        </GenericModal>
      )}
    </>
  );
};

export default ConfigMenu;
