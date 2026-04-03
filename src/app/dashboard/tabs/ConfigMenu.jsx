"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  FaChevronLeft,
  FaLightbulb,
  FaMapMarkerAlt,
  FaStore,
  FaPalette,
  FaTruck,
  FaCreditCard,
  FaClock,
  FaTrash,
  FaPlus,
  FaLink,
  FaCheck,
} from "react-icons/fa";
import { COLOR_PALETTES } from "@/consts/colorPallets";
import useMenu from "@/hooks/useMenu";
import Loading from "@/components/Loading";
import { useAlert } from "@/providers/AlertProvider";
import { useConfirm } from "@/providers/ConfirmProvider";
import useUser from "@/hooks/useUser";
import Return from "@/components/Return";

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

function slugify(value) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

const serviceOptions = [
  {
    id: "delivery",
    label: "Entrega",
  },
  {
    id: "pickup",
    label: "Retirada",
  },
  {
    id: "dinein",
    label: "Comer no local",
  },
  {
    id: "faceToFace",
    label: "Atendimento presencial",
  },
];

const paymentOptions = [
  { id: "cash", label: "Dinheiro", description: "Pagamento em espécie" },
  { id: "debit", label: "Débito", description: "Cartão de débito" },
  { id: "credit", label: "Crédito", description: "Cartão de crédito" },
  { id: "pix", label: "PIX", description: "Pagamento instantâneo" },
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

const dayOrder = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function SectionCard({ icon, title, description, children, aside }) {
  return (
    <section className="rounded-3xl border-2 bg-translucid border-[var(--translucid)] backdrop-blur-sm overflow-hidden">
      <div className="flex flex-col gap-4 border-b border-[var(--translucid)] px-5 py-5 sm:flex-row sm:items-start sm:justify-between sm:px-6">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[var(--translucid)] bg-translucid ">
            {icon}
          </div>
          <div>
            <h3 className="text-lg font-semibold ">{title}</h3>
            {description ? <p className="mt-1 text-sm ">{description}</p> : null}
          </div>
        </div>
        {aside ? <div className="sm:pl-6">{aside}</div> : null}
      </div>
      <div className="px-2 xxs:px-5 py-5 sm:px-6">{children}</div>
    </section>
  );
}

function Field({ label, hint, children }) {
  return (
    <div className="space-y-2">
      <div>
        <label className="font-semibold">{label}</label>
        {hint ? <p className="mt-1 text-sm ">{hint}</p> : null}
      </div>
      {children}
    </div>
  );
}

function TextInput({ className = "", ...props }) {
  return (
    <input
      {...props}
      className={cx(
        "h-12 w-full rounded-2xl border bg-translucid border-[var(--translucid)] px-4 text-[15px]  outline-none transition",
        "placeholder: focus:border-red-500/70",
        className,
      )}
    />
  );
}

function TextArea({ className = "", ...props }) {
  return (
    <textarea
      {...props}
      className={cx(
        "w-full rounded-2xl border bg-translucid border-[var(--translucid)] px-4 py-3 text-[15px]  outline-none transition",
        "placeholder: focus:border-red-500/70",
        className,
      )}
    />
  );
}

function SelectionCard({ selected, title, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        "group flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition cursor-pointer",
        selected
          ? "border-red-500/70 bg-red-500/20 shadow-[0_0_0_1px_rgba(255, 0, 0, 0.25)]"
          : "border-[var(--translucid)] bg-translucid hover:opacity-80 hover:scale-[1.01]",
      )}
    >
      <div
        className={cx(
          "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition",
          selected ? "border-red-400 bg-red-500 " : "border-gray-500 bg-transparent text-transparent",
        )}
      >
        <FaCheck className="text-[10px]" />
      </div>
      <div>
        <div className="font-semibold">{title}</div>
      </div>
    </button>
  );
}

function ModeOption({ active, title, description, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        "rounded-2xl border p-4 text-left transition cursor-pointer",
        active
          ? "border-red-500/70 bg-red-500/20 shadow-[0_0_0_1px_rgba(239,68,68,0.22)]"
          : "border-[var(--translucid)] bg-translucid hover:border-white/20 hover:bg-white/[0.06]",
      )}
    >
      <div className="font-semibold">{title}</div>
      <p className="mt-1 text-sm ">{description}</p>
    </button>
  );
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
  const { profile } = useUser();
  const { menu, loading } = useMenu();

  const [userRole, setUserRole] = useState(null);
  const [paletteIndex, setPaletteIndex] = useState(0);

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
  const [pixKeyLocal, setPixKeyLocal] = useState(menu?.pix_key ?? "");
  const [hoursLocal, setHoursLocal] = useState(() => normalizeHours(menu?.hours));
  const [minimumOrderValueLocal, setMinimumOrderValueLocal] = useState(
    menu?.minimum_order_value !== undefined && menu?.minimum_order_value !== null ? String(menu.minimum_order_value) : "",
  );

  const slug = usingExternal ? externalState?.slug : slugLocal;
  const setSlug = usingExternal ? (value) => externalSetState((p) => ({ ...p, slug: value })) : setSlugLocal;

  const selectedServices = usingExternal ? (externalState?.selectedServices ?? []) : (selectedServicesLocal ?? []);
  const setSelectedServices = usingExternal
    ? (arr) => externalSetState((p) => ({ ...p, selectedServices: arr }))
    : setSelectedServicesLocal;

  const selectedPayments = usingExternal ? (externalState?.selectedPayments ?? []) : (selectedPaymentsLocal ?? []);
  const setSelectedPayments = usingExternal
    ? (arr) => externalSetState((p) => ({ ...p, selectedPayments: arr }))
    : setSelectedPaymentsLocal;

  const deliveryFee = usingExternal ? (externalState?.deliveryFee ?? "") : deliveryFeeLocal;
  const setDeliveryFee = usingExternal
    ? (value) => externalSetState((p) => ({ ...p, deliveryFee: value }))
    : setDeliveryFeeLocal;

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
    ? (value) => externalSetState((p) => ({ ...p, deliveryFeeMode: value }))
    : setDeliveryFeeModeLocal;

  const pixKey = usingExternal ? (externalState?.pixKey ?? "") : pixKeyLocal;
  const setPixKey = usingExternal ? (value) => externalSetState((p) => ({ ...p, pixKey: value })) : setPixKeyLocal;

  const minimumOrderValue = usingExternal ? (externalState?.minimumOrderValue ?? "") : minimumOrderValueLocal;
  const setMinimumOrderValue = usingExternal
    ? (value) => externalSetState((p) => ({ ...p, minimumOrderValue: value }))
    : setMinimumOrderValueLocal;

  const hours = normalizeHours(usingExternal ? externalState?.hours : hoursLocal);

  const safeSetHours = (updaterOrValue) => {
    if (usingExternal) {
      if (typeof updaterOrValue === "function") {
        externalSetState((prev) => {
          const prevHours = normalizeHours(prev?.hours);
          const nextRaw = updaterOrValue(prevHours);
          return { ...prev, hours: normalizeHours(nextRaw) };
        });
      } else {
        externalSetState((prev) => ({ ...prev, hours: normalizeHours(updaterOrValue) }));
      }
    } else {
      setHoursLocal((prevRaw) => {
        const prevHours = normalizeHours(prevRaw);
        if (typeof updaterOrValue === "function") {
          return normalizeHours(updaterOrValue(prevHours));
        }
        return normalizeHours(updaterOrValue);
      });
    }
  };

  useEffect(() => {
    if (!menu) return;

    if (menu.title && !usingExternal && typeof propSetTitle === "function") propSetTitle(menu.title);
    if (menu.description && !usingExternal && typeof propSetDescription === "function") propSetDescription(menu.description);
    if (menu.address && !usingExternal && typeof propSetAddress === "function") propSetAddress(menu.address);

    if (menu.slug) {
      if (!usingExternal) setSlugLocal(menu.slug);
    }

    if (menu.services && !usingExternal) setSelectedServicesLocal(menu.services);
    if (menu.payments && !usingExternal) setSelectedPaymentsLocal(menu.payments);

    if (!usingExternal) {
      setDeliveryFeeLocal(menu?.delivery_fee !== undefined && menu?.delivery_fee !== null ? String(menu.delivery_fee) : "");
      setDeliveryZonesLocal(normalizeDeliveryZones(menu?.delivery_zones));
      setDeliveryFeeModeLocal(menu?.delivery_fee_mode ?? null);
      setMinimumOrderValueLocal(
        menu?.minimum_order_value !== undefined && menu?.minimum_order_value !== null
          ? String(menu.minimum_order_value)
          : "",
      );
      setPixKeyLocal(menu?.pix_key ?? "");
      safeSetHours(menu?.hours);
    }

    if (menu.background_color && !usingExternal && typeof propSetBg === "function") propSetBg(menu.background_color);
    if (menu.title_color && !usingExternal && typeof propSetTitleColor === "function") propSetTitleColor(menu.title_color);
    if (menu.details_color && !usingExternal && typeof propSetDetailsColor === "function")
      propSetDetailsColor(menu.details_color);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [menu?.id]);

  useEffect(() => {
    if (!loading && profile) {
      setUserRole(profile.role);
    }
  }, [loading, profile]);

  const canUseZones = userRole === "admin" || userRole === "plus" || userRole === "pro";
  const hasPlusPermissions = userRole === "admin" || userRole === "plus" || userRole === "pro";

  const previewStyles = useMemo(
    () => ({
      background: propBg || "#0A0A0A",
      color: propTitleColor || "#FFFFFF",
      accent: propDetailsColor || "#EF4444",
    }),
    [propBg, propTitleColor, propDetailsColor],
  );

  const suggestRandomPalette = () => {
    let next = Math.floor(Math.random() * COLOR_PALETTES.length);
    while (next === paletteIndex && COLOR_PALETTES.length > 1) {
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
      return;
    }

    if (typeof propSetBg === "function") propSetBg(bg);
    if (typeof propSetTitleColor === "function") propSetTitleColor(title);
    if (typeof propSetDetailsColor === "function") propSetDetailsColor(details);
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
    const next = prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id];

    if (next.length === 0) {
      customAlert("Mantenha ao menos 1 forma de pagamento.");
      return;
    }

    setSelectedPayments(next);
  };

  const toggleDeliveryMode = (mode) => {
    if (mode === "zones" && !canUseZones) {
      customAlert?.("Taxa por bairro está disponível apenas no Plus ou Pro.", "error");
      setDeliveryFeeMode("fixed");
      return;
    }

    if (deliveryFeeMode === mode) {
      setDeliveryFeeMode("fixed");
      return;
    }

    setDeliveryFeeMode(mode);
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
    if (!ok) return;
    setDeliveryZones((prev) => prev.filter((zone) => zone.id !== id));
  };

  if (loading) return <Loading />;

  return (
    <div className="w-full max-w-7xl pb-32 pt-3 px-2">
      <div>
        <div className="flex pb-5 lg:flex-row lg:items-center">
          <button
            type="button"
            className="p-2 rounded hover:bg-[var(--translucid)] transition cursor-pointer"
            onClick={() => setSelectedTab("menu")}
            aria-label="Voltar"
          >
            <FaChevronLeft />
          </button>

          <h2 className="ml-2 font-semibold">Configurações do cardápio</h2>
        </div>
      </div>

      <div className="grid gap-5 max-w-[1080px]">
        <div className="space-y-5">
          <SectionCard
            icon={<FaStore />}
            title="Informações básicas"
            description="Os dados principais que aparecem para quem acessa seu cardápio."
          >
            <div className="grid gap-4">
              <Field label="Nome do estabelecimento" hint="Use o nome pelo qual seus clientes já conhecem você.">
                <TextInput
                  value={propTitle || ""}
                  onChange={(e) => {
                    const value = e.target.value.slice(0, 30);
                    if (usingExternal) externalSetState((p) => ({ ...p, title: value }));
                    else if (typeof propSetTitle === "function") propSetTitle(value);
                  }}
                  placeholder="Ex.: Bite Menu"
                  maxLength={30}
                />
                <div className="text-right text-xs ">{(propTitle || "").length}/30</div>
              </Field>

              <Field label="Descrição" hint="Explique objetivamente o que o cliente encontra no seu cardápio.">
                <TextArea
                  rows={4}
                  value={propDescription || ""}
                  onChange={(e) => {
                    const value = e.target.value.slice(0, 200);
                    if (usingExternal) externalSetState((p) => ({ ...p, description: value }));
                    else if (typeof propSetDescription === "function") propSetDescription(value);
                  }}
                  placeholder="Ex.: Lanches, porções e bebidas com pedido rápido no WhatsApp."
                  maxLength={200}
                />
                <div className="text-right text-xs ">{(propDescription || "").length}/200</div>
              </Field>

              <Field label="Endereço" hint="Mostre onde fica o estabelecimento ou o ponto de retirada.">
                <div className="relative">
                  <FaMapMarkerAlt className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 " />
                  <TextInput
                    className="pl-11"
                    value={propAddress || ""}
                    onChange={(e) => {
                      const value = e.target.value.slice(0, 255);
                      if (usingExternal) externalSetState((p) => ({ ...p, address: value }));
                      else if (typeof propSetAddress === "function") propSetAddress(value);
                    }}
                    placeholder="Ex.: Rua das Flores, 120 - Centro"
                    maxLength={255}
                  />
                </div>
              </Field>

              <Field label="Link do cardápio" hint="Escolha um slug simples e fácil de compartilhar.">
                <div className="overflow-hidden rounded-2xl border border-[var(--translucid)] bg-translucid">
                  <div className="flex flex-col sm:flex-row sm:items-center">
                    <div className="flex h-12 items-center border-b border-[var(--translucid)] px-4 text-sm sm:border-b-0 sm:border-r">
                      bitemenu.com.br/menu/
                    </div>
                    <div className="relative flex-1">
                      <FaLink className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 " />
                      <input
                        type="text"
                        value={slug || ""}
                        onChange={(e) => setSlug(slugify(e.target.value.slice(0, 20)))}
                        placeholder="seu-slug"
                        maxLength={20}
                        className="h-12 w-full bg-transparent pl-11 pr-4 text-[15px]  outline-none placeholder:"
                      />
                    </div>
                  </div>
                </div>
                <div className="text-right text-xs ">{(slug || "").length}/20</div>
              </Field>
            </div>
          </SectionCard>

          <SectionCard
            icon={<FaTruck />}
            title="Serviços e entrega"
            description="Defina como os clientes podem fazer pedidos e como o frete será cobrado."
          >
            <div className="space-y-5">
              <div>
                <div className="mb-3 text-sm font-semibold">Serviços disponíveis</div>
                <div className="grid gap-3 md:grid-cols-2">
                  {serviceOptions.map((opt) => (
                    <SelectionCard
                      key={opt.id}
                      selected={selectedServices?.includes(opt.id)}
                      title={opt.label}
                      description={opt.description}
                      onClick={() => toggleService(opt.id)}
                    />
                  ))}
                </div>
              </div>

              {selectedServices?.includes("delivery") && (
                <div>
                  <div className="mb-4">
                    <div className="text-sm font-semibold">Cobrança do frete</div>
                    <p className="mt-1 text-sm ">Escolha a forma mais simples para o seu tipo de operação.</p>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <ModeOption
                      active={deliveryFeeMode === "fixed"}
                      title="Taxa fixa"
                      description="Uma única taxa para qualquer entrega. Melhor para operações simples."
                      onClick={() => toggleDeliveryMode("fixed")}
                    />
                    <ModeOption
                      active={deliveryFeeMode === "zones"}
                      title="Taxa por bairro"
                      description="Defina um valor diferente para cada bairro ou região."
                      onClick={() => toggleDeliveryMode("zones")}
                    />
                  </div>

                  {deliveryFeeMode === "fixed" && (
                    <div className="mt-4 max-w-md">
                      <Field label="Taxa de entrega (R$)">
                        <TextInput
                          type="number"
                          min="0"
                          step="0.01"
                          value={deliveryFee || ""}
                          onChange={(e) => setDeliveryFee(String(e.target.value).replace(",", "."))}
                          placeholder="0.00"
                        />
                      </Field>
                    </div>
                  )}

                  {deliveryFeeMode === "zones" && (
                    <div className="mt-4 space-y-4">
                      {!canUseZones ? (
                        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/20 p-4 text-sm">
                          Taxa por bairro está disponível apenas no Plus ou Pro. Enquanto isso, seu cardápio continuará
                          usando taxa fixa.
                        </div>
                      ) : (
                        <>
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <div className="font-semibold">Bairros e taxas</div>
                              <p className="mt-1 text-sm ">Cadastre os bairros atendidos e quanto cobrar em cada um.</p>
                            </div>
                            <button
                              type="button"
                              onClick={addDeliveryZone}
                              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[var(--translucid)] bg-translucid px-4 py-3 text-sm font-semibold transition hover:opacity-90 cursor-pointer"
                            >
                              <FaPlus className="text-xs" />
                              Adicionar bairro
                            </button>
                          </div>

                          {deliveryZones.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-[var(--translucid)] bg-translucid p-5 text-sm ">
                              Nenhum bairro cadastrado ainda.
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {deliveryZones.map((zone, index) => (
                                <div
                                  key={zone.id}
                                  className="grid gap-3 rounded-2xl border border-[var(--translucid)] bg-translucid p-4 grid-cols-1 sm:grid-cols-[1fr_180px_auto]"
                                >
                                  <div>
                                    <label className="mb-2 block text-xs uppercase tracking-[0.14em] ">
                                      Bairro {index + 1}
                                    </label>
                                    <TextInput
                                      value={zone.name}
                                      onChange={(e) => updateDeliveryZone(zone.id, "name", e.target.value)}
                                      placeholder="Ex.: Centro"
                                    />
                                  </div>

                                  <div>
                                    <label className="mb-2 block text-xs uppercase tracking-[0.14em] ">Taxa (R$)</label>
                                    <TextInput
                                      type="number"
                                      min="0"
                                      step="0.01"
                                      value={zone.shipping_fee}
                                      onChange={(e) => updateDeliveryZone(zone.id, "shipping_fee", e.target.value)}
                                      placeholder="0.00"
                                    />
                                  </div>

                                  <div className="flex items-end">
                                    <button
                                      type="button"
                                      onClick={() => removeDeliveryZone(zone.id)}
                                      className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-red-500/20 bg-red-500/40 px-4 text-sm font-semiboldtransition hover:opacity-90 cursor-pointer w-full"
                                    >
                                      <FaTrash className="text-xs" />
                                      Remover
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="mt-4">
              <Field
                label="Valor mínimo de pedido (R$)"
                hint="Pedidos abaixo desse valor não poderão ser finalizados pelo cliente."
              >
                {hasPlusPermissions ? (
                  <TextInput
                    type="number"
                    min="0"
                    step="0.01"
                    value={minimumOrderValue || ""}
                    onChange={(e) => setMinimumOrderValue(String(e.target.value).replace(",", "."))}
                    placeholder="Ex.: 15.00"
                  />
                ) : (
                  <div className="rounded-2xl border border-amber-500/20 bg-amber-500/20 p-4 text-sm">
                    O valor mínimo de pedido está disponível apenas no Plus ou Pro. Enquanto isso, seus clientes poderão
                    finalizar pedidos de qualquer valor.
                  </div>
                )}
              </Field>
            </div>
          </SectionCard>

          <SectionCard
            icon={<FaCreditCard />}
            title="Pagamentos"
            description="Escolha como o cliente poderá pagar ao finalizar o pedido."
          >
            <div className="space-y-5">
              <div className="grid gap-3 md:grid-cols-2">
                {paymentOptions.map((opt) => (
                  <SelectionCard
                    key={opt.id}
                    selected={selectedPayments?.includes(opt.id)}
                    title={opt.label}
                    description={opt.description}
                    onClick={() => togglePayment(opt.id)}
                  />
                ))}
              </div>

              {selectedPayments?.includes("pix") && (
                <div className="max-w-2xl rounded-2xl border border-[var(--translucid)] bg-translucid p-4 sm:p-5">
                  <Field label="Chave PIX" hint="Essa chave será usada pelo cliente ao escolher pagamento via PIX.">
                    <TextInput
                      value={pixKey || ""}
                      onChange={(e) => setPixKey(e.target.value)}
                      placeholder="Ex.: telefone, e-mail, CPF ou chave aleatória"
                    />
                  </Field>
                </div>
              )}
            </div>
          </SectionCard>
        </div>

        <div className="space-y-5">
          <SectionCard
            icon={<FaPalette />}
            title="Aparência"
            description="Escolha cores bonitas e consistentes para deixar seu cardápio mais profissional."
            aside={
              <button
                type="button"
                onClick={suggestRandomPalette}
                className="inline-flex items-center gap-2 rounded-2xl border border-[var(--translucid)] bg-translucid px-4 py-3 text-sm font-semiboldtransition hover:opacity-90 cursor-pointer"
              >
                <FaLightbulb />
                Sugerir cores
              </button>
            }
          >
            <div className="grid gap-4">
              <Field label="Cor do fundo">
                <div className="flex items-center gap-3 rounded-2xl border border-[var(--translucid)] bg-translucid p-3">
                  <input
                    type="color"
                    value={propBg}
                    onChange={(e) => propSetBg?.(e.target.value)}
                    className="h-12 w-14 cursor-pointer rounded-xl border border-[var(--translucid)] bg-transparent"
                    aria-label="Cor do fundo"
                  />
                  <div className="text-sm ">{propBg}</div>
                </div>
              </Field>

              <Field label="Cor do título">
                <div className="flex items-center gap-3 rounded-2xl border border-[var(--translucid)] bg-translucid p-3">
                  <input
                    type="color"
                    value={propTitleColor}
                    onChange={(e) => propSetTitleColor?.(e.target.value)}
                    className="h-12 w-14 cursor-pointer rounded-xl border border-[var(--translucid)] bg-transparent"
                    aria-label="Cor do título"
                  />
                  <div className="text-sm ">{propTitleColor}</div>
                </div>
              </Field>

              <Field label="Cor dos detalhes">
                <div className="flex items-center gap-3 rounded-2xl border border-[var(--translucid)] bg-translucid p-3">
                  <input
                    type="color"
                    value={propDetailsColor}
                    onChange={(e) => propSetDetailsColor?.(e.target.value)}
                    className="h-12 w-14 cursor-pointer rounded-xl border border-[var(--translucid)] bg-transparent"
                    aria-label="Cor dos detalhes"
                  />
                  <div className="text-sm ">{propDetailsColor}</div>
                </div>
              </Field>
            </div>
          </SectionCard>

          <SectionCard
            icon={<FaClock />}
            title="Horários de funcionamento"
            description="Defina quando seu estabelecimento está aberto para pedidos."
            aside={
              <button
                type="button"
                onClick={() => {
                  safeSetHours((prev) => {
                    const next = { ...prev };
                    Object.keys(next).forEach((day) => {
                      next[day] = "00:00-23:59";
                    });
                    return next;
                  });
                }}
                className="inline-flex items-center gap-2 rounded-2xl border border-[var(--translucid)] bg-translucid px-4 py-3 text-sm font-semiboldtransition hover:opacity-90 cursor-pointer"
              >
                24h para todos
              </button>
            }
          >
            <div className="space-y-3">
              {dayOrder.map((day) => {
                const value = hours?.[day];
                const isClosed = value === null;
                const [openTime, closeTime] = typeof value === "string" ? value.split("-") : ["", ""];

                return (
                  <div
                    key={day}
                    className="grid gap-3 rounded-2xl border border-[var(--translucid)] bg-translucid p-4 sm:grid-cols-[70px_1fr_auto] sm:items-center"
                  >
                    <div className="font-semibold">{dayLabels[day]}</div>

                    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
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
                        className="h-11 rounded-2xl border border-[var(--translucid)] bg-translucid px-3  outline-none disabled:cursor-not-allowed disabled:opacity-40"
                      />
                      <span className="text-center ">até</span>
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
                        className="h-11 rounded-2xl border border-[var(--translucid)] bg-translucid px-3  outline-none disabled:cursor-not-allowed disabled:opacity-40"
                      />
                    </div>

                    <label className="inline-flex cursor-pointer items-center gap-3 rounded-full border border-[var(--translucid)] bg-translucid px-3 py-2 text-sm">
                      <span className="switch">
                        <input
                          type="checkbox"
                          className="hidden"
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
                      Fechado
                    </label>
                  </div>
                );
              })}
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
};

export default ConfigMenu;
