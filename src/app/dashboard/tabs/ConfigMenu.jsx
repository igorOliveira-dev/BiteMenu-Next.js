"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  FaChevronLeft,
  FaChevronDown,
  FaLightbulb,
  FaMapMarkerAlt,
  FaStore,
  FaPalette,
  FaTruck,
  FaCreditCard,
  FaClock,
  FaTrash,
  FaPlus,
  FaCheck,
} from "react-icons/fa";
import { HexColorPicker, HexColorInput } from "react-colorful";
import { COLOR_PALETTES } from "@/consts/colorPallets";
import { CURRENCIES } from "@/consts/currencies";
import { getCurrencySymbol } from "@/lib/formatCurrency";
import useMenu from "@/hooks/useMenu";
import Loading from "@/components/Loading";
import { useAlert } from "@/providers/AlertProvider";
import { useConfirm } from "@/providers/ConfirmProvider";
import useUser from "@/hooks/useUser";
import { supabase } from "@/lib/supabaseClient";
import { updateMenuById } from "@/lib/queries/menus";

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
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

const serviceOptions = [
  { id: "delivery", label: "Entrega" },
  { id: "pickup", label: "Retirada" },
  { id: "dinein", label: "Comer no local" },
  { id: "faceToFace", label: "Atendimento presencial" },
];

const paymentOptions = [
  { id: "cash", label: "Dinheiro" },
  { id: "debit", label: "Cartão de débito" },
  { id: "credit", label: "Cartão de crédito" },
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

const dayOrder = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

/* --- Blocos visuais padronizados (mesma borda, mesmo raio, mesma altura) --- */

const INPUT_CLASS =
  "h-11 w-full rounded-xl border border-[var(--translucid)] bg-translucid px-3 text-[15px] outline-none transition focus:border-red-500/70";

function SectionCard({ id, icon, title, summary, open, onToggle, sectionRef, children }) {
  return (
    <section
      ref={sectionRef}
      id={id}
      className="overflow-hidden rounded-2xl border border-[var(--translucid)] bg-translucid"
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full cursor-pointer items-center gap-3 px-4 py-4 text-left transition hover-bg-translucid"
      >
        <span
          className={cx(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition",
            open ? "border-red-500/50 bg-red-500/15 text-red-400" : "border-[var(--translucid)] bg-translucid",
          )}
        >
          {icon}
        </span>

        <span className="min-w-0 flex-1">
          <span className="block font-semibold">{title}</span>
          <span className="mt-0.5 block truncate text-xs opacity-60">{summary}</span>
        </span>

        <FaChevronDown className={cx("shrink-0 text-xs opacity-60 transition-transform", open && "rotate-180")} />
      </button>

      <div
        className="grid transition-[grid-template-rows] duration-300 ease-in-out"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="border-t border-[var(--translucid)] px-4 py-5">{children}</div>
        </div>
      </div>
    </section>
  );
}

function Field({ label, hint, children }) {
  return (
    <div className="space-y-2">
      {label ? (
        <div>
          <div className="text-sm font-semibold">{label}</div>
          {hint ? <p className="mt-0.5 text-xs opacity-60">{hint}</p> : null}
        </div>
      ) : null}
      {children}
    </div>
  );
}

// contador só aparece perto do limite, pra não poluir
function Counter({ value = "", max }) {
  if (value.length < max * 0.75) return null;
  return <div className="text-right text-xs opacity-60">{`${value.length}/${max}`}</div>;
}

function Notice({ children }) {
  return <div className="rounded-xl border border-amber-500/30 bg-amber-500/15 p-3 text-xs">{children}</div>;
}

function TextInput({ className = "", ...props }) {
  return <input {...props} className={cx(INPUT_CLASS, className)} />;
}

function TextArea({ className = "", ...props }) {
  return <textarea {...props} className={cx(INPUT_CLASS, "h-auto py-3", className)} />;
}

function GhostButton({ className = "", children, ...props }) {
  return (
    <button
      type="button"
      {...props}
      className={cx(
        "inline-flex h-11 cursor-pointer items-center gap-2 rounded-xl border border-[var(--translucid)] bg-translucid px-4 text-sm font-semibold transition hover:border-red-500/40",
        className,
      )}
    >
      {children}
    </button>
  );
}

function OptionCard({ selected, multi, title, description, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        "flex w-full cursor-pointer items-start gap-3 rounded-xl border p-3 text-left transition",
        selected
          ? "border-red-500/60 bg-red-500/15"
          : "border-[var(--translucid)] bg-translucid hover:border-red-500/30",
      )}
    >
      <span
        className={cx(
          "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center border transition",
          multi ? "rounded-md" : "rounded-full",
          selected ? "border-red-500 bg-red-500 text-white" : "border-[var(--high-translucid)] text-transparent",
        )}
      >
        <FaCheck className="text-[9px]" />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold">{title}</span>
        {description ? <span className="mt-0.5 block text-xs opacity-60">{description}</span> : null}
      </span>
    </button>
  );
}

function CurrencySelect({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [rect, setRect] = useState(null);
  const btnRef = useRef(null);

  const selected = CURRENCIES.find((c) => c.code === value) || CURRENCIES[0];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return CURRENCIES;
    return CURRENCIES.filter((c) => c.label.toLowerCase().includes(q) || c.code.toLowerCase().includes(q));
  }, [query]);

  const closeMenu = () => {
    setOpen(false);
    setQuery("");
  };

  const openMenu = () => {
    if (btnRef.current) setRect(btnRef.current.getBoundingClientRect());
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const reposition = () => {
      if (btnRef.current) setRect(btnRef.current.getBoundingClientRect());
    };
    window.addEventListener("resize", reposition);
    window.addEventListener("scroll", reposition, true);
    return () => {
      window.removeEventListener("resize", reposition);
      window.removeEventListener("scroll", reposition, true);
    };
  }, [open]);

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={() => (open ? closeMenu() : openMenu())}
        className={cx(INPUT_CLASS, "flex cursor-pointer items-center justify-between")}
      >
        <span>
          {selected.symbol} — {selected.label}
        </span>
        <FaChevronDown className="text-xs opacity-60" />
      </button>

      {open &&
        rect &&
        createPortal(
          <>
            <div className="fixed inset-0 z-[998]" onMouseDown={closeMenu} />
            <div
              className="fixed z-[999] overflow-hidden rounded-xl border border-[var(--low-gray)] bg-[var(--background)] text-[var(--foreground)] shadow-xl"
              style={{ left: rect.left, top: rect.bottom + 6, width: rect.width }}
            >
              <input
                type="text"
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar moeda..."
                className="h-11 w-full border-b border-[var(--low-gray)] bg-[var(--background)] px-4 text-[15px] text-[var(--foreground)] outline-none"
              />
              <ul className="max-h-60 overflow-y-auto">
                {filtered.length === 0 ? (
                  <li className="px-4 py-3 text-sm opacity-60">Nenhuma moeda encontrada</li>
                ) : (
                  filtered.map((c) => (
                    <li key={c.code}>
                      <button
                        type="button"
                        onClick={() => {
                          onChange(c.code);
                          closeMenu();
                        }}
                        className={cx(
                          "flex w-full cursor-pointer items-center gap-2 px-4 py-3 text-left text-[15px] transition hover:bg-[var(--translucid)]",
                          c.code === value ? "bg-[var(--translucid)] font-semibold" : "",
                        )}
                      >
                        <span className="w-12 shrink-0">{c.symbol}</span>
                        <span>{c.label}</span>
                      </button>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </>,
          document.body,
        )}
    </>
  );
}

function timeToMinutes(time) {
  if (!time) return null;
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function isCloseBeforeOpen(openTime, closeTime) {
  const open = timeToMinutes(openTime);
  const close = timeToMinutes(closeTime);
  if (open === null || close === null) return false;
  return close < open;
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
  // seletor de cor aberto (só um por vez; o nativo do Firefox/Linux não dá pra fechar via JS)
  const [openColorIdx, setOpenColorIdx] = useState(null);
  const openColorRef = useRef(null);
  const [layoutPreview, setLayoutPreview] = useState(null);
  const [layout, setLayout] = useState("default");
  const [previewScale, setPreviewScale] = useState(1);
  const previewScrollRef = useRef(null);

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
  const [useStripeExpressLocal, setUseStripeExpressLocal] = useState(!!menu?.use_stripe_express);
  const [currencyLocal, setCurrencyLocal] = useState(menu?.currency ?? "BRL");
  const [hoursLocal, setHoursLocal] = useState(() => normalizeHours(menu?.hours));
  const [minimumOrderValueLocal, setMinimumOrderValueLocal] = useState(
    menu?.minimum_order_value !== undefined && menu?.minimum_order_value !== null
      ? String(menu.minimum_order_value)
      : "",
  );

  // ---- Estado de UI: uma seção aberta por vez ----
  const [openSection, setOpenSection] = useState(null);

  const sectionRefs = {
    basico: useRef(null),
    servicos: useRef(null),
    pagamentos: useRef(null),
    aparencia: useRef(null),
    horarios: useRef(null),
  };

  const toggleSection = (key) => {
    setOpenSection((prev) => {
      const next = prev === key ? null : key;
      if (next) {
        requestAnimationFrame(() => {
          sectionRefs[next]?.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        });
      }
      return next;
    });
  };

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

  const currency = usingExternal ? (externalState?.currency ?? "BRL") : currencyLocal;
  const setCurrency = usingExternal
    ? (value) => externalSetState((p) => ({ ...p, currency: value }))
    : setCurrencyLocal;

  const minimumOrderValue = usingExternal ? (externalState?.minimumOrderValue ?? "") : minimumOrderValueLocal;
  const setMinimumOrderValue = usingExternal
    ? (value) => externalSetState((p) => ({ ...p, minimumOrderValue: value }))
    : setMinimumOrderValueLocal;

  const useStripeExpress = usingExternal ? !!externalState?.useStripeExpress : useStripeExpressLocal;
  const setUseStripeExpress = usingExternal
    ? (value) => externalSetState((p) => ({ ...p, useStripeExpress: value }))
    : setUseStripeExpressLocal;

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

  const setDefaultLayout = async () => {
    await updateLayout("default");
  };

  useEffect(() => {
    if (!menu) return;

    if (menu.title && !usingExternal && typeof propSetTitle === "function") propSetTitle(menu.title);
    if (menu.description && !usingExternal && typeof propSetDescription === "function")
      propSetDescription(menu.description);
    if (menu.address && !usingExternal && typeof propSetAddress === "function") propSetAddress(menu.address);

    if (menu.slug) {
      if (!usingExternal) setSlugLocal(menu.slug);
    }

    if (menu.services && !usingExternal) setSelectedServicesLocal(menu.services);
    if (menu.payments && !usingExternal) setSelectedPaymentsLocal(menu.payments);

    if (!usingExternal) {
      setDeliveryFeeLocal(
        menu?.delivery_fee !== undefined && menu?.delivery_fee !== null ? String(menu.delivery_fee) : "",
      );
      setDeliveryZonesLocal(normalizeDeliveryZones(menu?.delivery_zones));
      setDeliveryFeeModeLocal(menu?.delivery_fee_mode ?? null);
      setMinimumOrderValueLocal(
        menu?.minimum_order_value !== undefined && menu?.minimum_order_value !== null
          ? String(menu.minimum_order_value)
          : "",
      );
      setPixKeyLocal(menu?.pix_key ?? "");
      setCurrencyLocal(menu?.currency ?? "BRL");
      setUseStripeExpressLocal(!!menu?.use_stripe_express);
      safeSetHours(menu?.hours);
    }

    if (menu.background_color && !usingExternal && typeof propSetBg === "function") propSetBg(menu.background_color);
    if (menu.title_color && !usingExternal && typeof propSetTitleColor === "function")
      propSetTitleColor(menu.title_color);
    if (menu.details_color && !usingExternal && typeof propSetDetailsColor === "function")
      propSetDetailsColor(menu.details_color);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [menu?.id]);

  useEffect(() => {
    if (!loading && profile) {
      setUserRole(profile.role);
    }
  }, [loading, profile]);

  useEffect(() => {
    if (profile?.role === "free" && menu?.layout && menu.layout !== "default") {
      setLayout("default");
      setDefaultLayout();
    }
  }, [profile?.role, menu?.layout]);

  useEffect(() => {
    if (menu?.layout && profile?.role !== "free") {
      setLayout(menu.layout);
    }
  }, [menu?.layout, profile?.role]);

  useEffect(() => {
    if (!layoutPreview) return;

    const iframe = previewScrollRef.current;
    if (!iframe) return;

    let rafId = null;
    let t1 = null;
    let t2 = null;
    let userTookControl = false;

    const cancelAll = () => {
      if (rafId) cancelAnimationFrame(rafId);
      clearTimeout(t1);
      clearTimeout(t2);
    };

    const linearScroll = (win, from, to, duration, onDone) => {
      const startTime = performance.now();
      const delta = to - from;

      const step = (now) => {
        if (userTookControl) return;
        const progress = Math.min((now - startTime) / duration, 1);
        win.scrollTo(0, from + delta * progress);
        if (progress < 1) {
          rafId = requestAnimationFrame(step);
        } else if (onDone) {
          onDone();
        }
      };

      rafId = requestAnimationFrame(step);
    };

    const handleLoad = () => {
      const win = iframe.contentWindow;
      const doc = iframe.contentDocument;
      if (!win || !doc) return;

      const blockInteraction = (e) => {
        e.preventDefault();
        e.stopPropagation();
      };
      doc.addEventListener("click", blockInteraction, true);
      doc.addEventListener("mousedown", blockInteraction, true);
      doc.addEventListener("keydown", blockInteraction, true);
      doc.addEventListener("submit", blockInteraction, true);

      const onUserScroll = () => {
        userTookControl = true;
        cancelAll();
      };
      win.addEventListener("wheel", onUserScroll, { passive: true });
      win.addEventListener("touchstart", onUserScroll, { passive: true });

      win.scrollTo(0, 0);

      t1 = setTimeout(() => {
        linearScroll(win, 0, 550, 4500, () => {
          t2 = setTimeout(() => {
            linearScroll(win, 550, 0, 3500, null);
          }, 600);
        });
      }, 900);
    };

    iframe.addEventListener("load", handleLoad);

    return () => {
      iframe.removeEventListener("load", handleLoad);
      cancelAll();
    };
  }, [layoutPreview]);

  useEffect(() => {
    if (!layoutPreview) return;

    const FRAME_W = 375;
    const FRAME_H = 620;
    const BUTTONS_H = 110;

    const compute = () => {
      const scaleW = Math.min(1, (window.innerWidth - 32) / FRAME_W);
      const scaleH = Math.min(1, (window.innerHeight - BUTTONS_H) / FRAME_H);
      setPreviewScale(Math.min(scaleW, scaleH));
    };

    compute();
    window.addEventListener("resize", compute);
    return () => window.removeEventListener("resize", compute);
  }, [layoutPreview]);

  // fecha o seletor de cor ao clicar fora dele
  useEffect(() => {
    if (openColorIdx === null) return;
    const onPointerDown = (e) => {
      if (!openColorRef.current?.contains(e.target)) setOpenColorIdx(null);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [openColorIdx]);

  const hasPlusPermissions = userRole === "admin" || userRole === "plus" || userRole === "pro";

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

  const updateLayout = async (layout) => {
    const { error } = await updateMenuById(supabase, menu.id, { layout });
    if (error) {
      console.error(error);
    }
  };

  const handleLayoutClick = (selectedLayout) => {
    if (selectedLayout === layout) return;
    setLayoutPreview(selectedLayout);
  };

  const handleApplyLayout = async () => {
    setLayout(layoutPreview);
    await updateLayout(layoutPreview);
    setLayoutPreview(null);
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

    const stripeActive = isConnected && useStripeExpress;

    if (next.length === 0 && !stripeActive) {
      customAlert("Mantenha ao menos 1 forma de pagamento.");
      return;
    }

    setSelectedPayments(next);
  };

  const isConnected = !!profile?.stripe_connect_ready;

  const toggleStripeExpress = () => {
    const next = !useStripeExpress;

    if (!next && (selectedPayments?.length || 0) === 0) {
      customAlert("Mantenha ao menos 1 forma de pagamento.");
      return;
    }

    setUseStripeExpress(next);
  };

  const toggleDeliveryMode = (mode) => {
    if (mode === "zones" && !hasPlusPermissions) {
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

  const updateDayHour = (day, field, value) => {
    const currentValue = hours?.[day];

    if (currentValue === null) return;

    const [currentOpen = "09:00", currentClose = "18:00"] =
      typeof currentValue === "string" ? currentValue.split("-") : ["09:00", "18:00"];

    const openTime = field === "open" ? value : currentOpen;
    let closeTime = field === "close" ? value : currentClose;

    if (closeTime === "00:00") {
      closeTime = "23:59";
      customAlert("Meia-noite foi ajustada para 23:59.", "info");
    }

    if (isCloseBeforeOpen(openTime, closeTime)) {
      customAlert("O horário de fechamento não pode ser antes do horário de abertura.", "error");
      return;
    }

    safeSetHours((prev) => ({
      ...prev,
      [day]: `${openTime}-${closeTime}`,
    }));
  };

  if (loading) return <Loading />;

  // ---- Resumo de cada seção (mostra o estado atual, sem texto decorativo) ----
  const basicoSummary = [propTitle || "Sem nome", slug ? `/${slug}` : null].filter(Boolean).join(" · ");

  const servicosSummary = (() => {
    const count = selectedServices?.length || 0;
    const parts = [`${count} serviço${count === 1 ? "" : "s"}`];
    if (selectedServices?.includes("delivery")) {
      parts.push(deliveryFeeMode === "zones" ? "frete por bairro" : "frete fixo");
    }
    return parts.join(" · ");
  })();

  const pagamentosSummary = (() => {
    const count = (selectedPayments?.length || 0) + (isConnected && useStripeExpress ? 1 : 0);
    return `${count} forma${count === 1 ? "" : "s"} de pagamento`;
  })();

  const aparenciaSummary = `Estilo ${layout === "default" ? "padrão" : layout === "list" ? "lista" : "grade"}`;

  const horariosSummary = (() => {
    const closedDays = dayOrder.filter((d) => hours?.[d] === null).length;
    if (closedDays === 0) return "Aberto todos os dias";
    if (closedDays === 7) return "Fechado todos os dias";
    return `Fechado em ${closedDays} dia${closedDays === 1 ? "" : "s"}`;
  })();

  const colorFields = [
    { label: "Fundo", value: propBg, setter: propSetBg },
    { label: "Título", value: propTitleColor, setter: propSetTitleColor },
    { label: "Detalhes", value: propDetailsColor, setter: propSetDetailsColor },
  ];

  return (
    <div className="w-full max-w-7xl px-2 pb-32 pt-3">
      <div className="flex items-center gap-2 pb-5">
        <button
          type="button"
          className="cursor-pointer rounded-lg p-2 transition hover-bg-translucid"
          onClick={() => setSelectedTab("menu")}
          aria-label="Voltar"
        >
          <FaChevronLeft />
        </button>
        <h2 className="text-lg font-semibold">Configurações do cardápio</h2>
      </div>

      <div className="max-w-[1080px] space-y-3">
        <SectionCard
          id="basico"
          sectionRef={sectionRefs.basico}
          icon={<FaStore />}
          title="Informações básicas"
          summary={basicoSummary}
          open={openSection === "basico"}
          onToggle={() => toggleSection("basico")}
        >
          <div className="grid gap-5">
            <Field label="Nome do estabelecimento">
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
              <Counter value={propTitle || ""} max={30} />
            </Field>

            <Field label="Descrição">
              <TextArea
                rows={3}
                value={propDescription || ""}
                onChange={(e) => {
                  const value = e.target.value.slice(0, 200);
                  if (usingExternal) externalSetState((p) => ({ ...p, description: value }));
                  else if (typeof propSetDescription === "function") propSetDescription(value);
                }}
                placeholder="Ex.: Lanches, porções e bebidas."
                maxLength={200}
              />
              <Counter value={propDescription || ""} max={200} />
            </Field>

            <Field label="Endereço">
              <div className="relative">
                <FaMapMarkerAlt className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs opacity-60" />
                <TextInput
                  className="pl-9"
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

            <Field label="Link do cardápio">
              <div className="flex h-11 items-center overflow-hidden rounded-xl border border-[var(--translucid)] bg-translucid">
                <span className="hidden h-full shrink-0 items-center border-r border-[var(--translucid)] px-3 text-sm opacity-60 xs:flex">
                  bitemenu.com.br/menu/
                </span>
                <input
                  type="text"
                  value={slug || ""}
                  onChange={(e) => setSlug(slugify(e.target.value.slice(0, 20)))}
                  placeholder="seu-slug"
                  maxLength={20}
                  className="h-full w-full bg-transparent px-3 text-[15px] outline-none"
                />
              </div>
              <Counter value={slug || ""} max={20} />
            </Field>

            <Field label="Moeda">
              <CurrencySelect value={currency || "BRL"} onChange={setCurrency} />
            </Field>
          </div>
        </SectionCard>

        <SectionCard
          id="servicos"
          sectionRef={sectionRefs.servicos}
          icon={<FaTruck />}
          title="Serviços e entrega"
          summary={servicosSummary}
          open={openSection === "servicos"}
          onToggle={() => toggleSection("servicos")}
        >
          <div className="grid gap-5">
            <Field label="Como o cliente recebe o pedido">
              <div className="grid gap-2 sm:grid-cols-2">
                {serviceOptions.map((opt) => (
                  <OptionCard
                    key={opt.id}
                    multi
                    selected={selectedServices?.includes(opt.id)}
                    title={opt.label}
                    onClick={() => toggleService(opt.id)}
                  />
                ))}
              </div>
            </Field>

            {selectedServices?.includes("delivery") && (
              <Field label="Cobrança do frete">
                <div className="grid gap-2 sm:grid-cols-2">
                  <OptionCard
                    selected={deliveryFeeMode === "fixed"}
                    title="Taxa fixa"
                    description="Mesmo valor para qualquer entrega."
                    onClick={() => toggleDeliveryMode("fixed")}
                  />
                  <OptionCard
                    selected={deliveryFeeMode === "zones"}
                    title="Taxa por bairro"
                    description="Um valor para cada bairro."
                    onClick={() => toggleDeliveryMode("zones")}
                  />
                </div>

                {deliveryFeeMode === "fixed" && (
                  <div className="max-w-xs pt-1">
                    <TextInput
                      type="number"
                      min="0"
                      step="0.01"
                      value={deliveryFee || ""}
                      onChange={(e) => setDeliveryFee(String(e.target.value).replace(",", "."))}
                      placeholder={`Taxa em ${getCurrencySymbol(currency)}`}
                    />
                  </div>
                )}

                {deliveryFeeMode === "zones" &&
                  (!hasPlusPermissions ? (
                    <Notice>Taxa por bairro é exclusiva do Plus ou Pro. Seu cardápio continua com taxa fixa.</Notice>
                  ) : (
                    <div className="space-y-2 pt-1">
                      {deliveryZones.length === 0 ? (
                        <p className="text-xs opacity-60">Nenhum bairro cadastrado ainda.</p>
                      ) : (
                        deliveryZones.map((zone) => (
                          <div key={zone.id} className="grid grid-cols-[1fr_110px_44px] gap-2">
                            <TextInput
                              value={zone.name}
                              onChange={(e) => updateDeliveryZone(zone.id, "name", e.target.value)}
                              placeholder="Bairro"
                            />
                            <TextInput
                              type="number"
                              min="0"
                              step="0.01"
                              value={zone.shipping_fee}
                              onChange={(e) => updateDeliveryZone(zone.id, "shipping_fee", e.target.value)}
                              placeholder={getCurrencySymbol(currency)}
                            />
                            <button
                              type="button"
                              onClick={() => removeDeliveryZone(zone.id)}
                              aria-label={`Remover ${zone.name || "bairro"}`}
                              className="flex h-11 cursor-pointer items-center justify-center rounded-xl border border-red-500/30 text-red-400 transition hover:bg-red-500/15"
                            >
                              <FaTrash className="text-xs" />
                            </button>
                          </div>
                        ))
                      )}

                      <GhostButton onClick={addDeliveryZone}>
                        <FaPlus className="text-xs" />
                        Adicionar bairro
                      </GhostButton>
                    </div>
                  ))}
              </Field>
            )}

            <Field label={`Valor mínimo de pedido (${getCurrencySymbol(currency)})`}>
              {hasPlusPermissions ? (
                <TextInput
                  type="number"
                  min="0"
                  step="0.01"
                  value={minimumOrderValue || ""}
                  onChange={(e) => setMinimumOrderValue(String(e.target.value).replace(",", "."))}
                  placeholder="Ex.: 15.00"
                  className="max-w-xs"
                />
              ) : (
                <Notice>Valor mínimo de pedido é exclusivo do Plus ou Pro.</Notice>
              )}
            </Field>
          </div>
        </SectionCard>

        <SectionCard
          id="pagamentos"
          sectionRef={sectionRefs.pagamentos}
          icon={<FaCreditCard />}
          title="Pagamentos"
          summary={pagamentosSummary}
          open={openSection === "pagamentos"}
          onToggle={() => toggleSection("pagamentos")}
        >
          <div className="grid gap-5">
            <div className="grid gap-2 sm:grid-cols-2">
              {paymentOptions.map((opt) => (
                <OptionCard
                  key={opt.id}
                  multi
                  selected={selectedPayments?.includes(opt.id)}
                  title={opt.label}
                  onClick={() => togglePayment(opt.id)}
                />
              ))}
              {isConnected && (
                <OptionCard
                  multi
                  selected={useStripeExpress}
                  title="Pagamento online"
                  description="Cartão via Stripe."
                  onClick={toggleStripeExpress}
                />
              )}
            </div>

            {selectedPayments?.includes("pix") && (
              <Field label="Chave PIX">
                <TextInput
                  value={pixKey || ""}
                  onChange={(e) => setPixKey(e.target.value)}
                  placeholder="Telefone, e-mail, CPF ou chave aleatória"
                />
              </Field>
            )}
          </div>
        </SectionCard>

        <SectionCard
          id="aparencia"
          sectionRef={sectionRefs.aparencia}
          icon={<FaPalette />}
          title="Aparência"
          summary={aparenciaSummary}
          open={openSection === "aparencia"}
          onToggle={() => toggleSection("aparencia")}
        >
          <div className="grid gap-5">
            <Field label="Cores">
              <div className="grid gap-3 sm:grid-cols-3">
                {colorFields.map((item, idx) => (
                  <div key={item.label} ref={openColorIdx === idx ? openColorRef : null}>
                    <div className="mb-2 text-xs opacity-60">{item.label}</div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setOpenColorIdx(openColorIdx === idx ? null : idx)}
                        className="h-11 w-11 shrink-0 cursor-pointer rounded-xl border border-[var(--high-translucid)]"
                        style={{ backgroundColor: item.value }}
                        aria-label={`Escolher cor: ${item.label}`}
                        aria-expanded={openColorIdx === idx}
                      />
                      <HexColorInput
                        prefixed
                        color={item.value}
                        onChange={(c) => item.setter?.(c)}
                        aria-label={`Hexadecimal: ${item.label}`}
                        className={cx(INPUT_CLASS, "uppercase")}
                      />
                    </div>
                    {openColorIdx === idx && (
                      <HexColorPicker
                        color={item.value}
                        onChange={(c) => item.setter?.(c)}
                        style={{ width: "100%", height: 150, marginTop: 8 }}
                      />
                    )}
                  </div>
                ))}
              </div>
              <GhostButton onClick={suggestRandomPalette}>
                <FaLightbulb />
                Sugerir cores
              </GhostButton>
            </Field>

            <Field label="Estilo do menu">
              <div className="grid gap-2 sm:grid-cols-3">
                <OptionCard
                  selected={layout === "default"}
                  title="Padrão"
                  description="Simples, foco no cardápio."
                  onClick={() => handleLayoutClick("default")}
                />
                <OptionCard
                  selected={layout === "list"}
                  title="Lista"
                  description="Fotos menores, itens em lista."
                  onClick={() => handleLayoutClick("list")}
                />
                <OptionCard
                  selected={layout === "grid"}
                  title="Grade"
                  description="Fotos maiores em grade."
                  onClick={() => handleLayoutClick("grid")}
                />
              </div>
            </Field>
          </div>
        </SectionCard>

        <SectionCard
          id="horarios"
          sectionRef={sectionRefs.horarios}
          icon={<FaClock />}
          title="Horários"
          summary={horariosSummary}
          open={openSection === "horarios"}
          onToggle={() => toggleSection("horarios")}
        >
          <div className="space-y-2">
            {dayOrder.map((day) => {
              const value = hours?.[day];
              const isClosed = value === null;
              const [openTime, closeTime] = typeof value === "string" ? value.split("-") : ["", ""];

              return (
                <div key={day} className="grid grid-cols-[44px_1fr] items-center gap-3 sm:grid-cols-[44px_1fr_auto]">
                  <div className="text-sm font-semibold">{dayLabels[day]}</div>

                  <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                    <input
                      type="time"
                      value={openTime || ""}
                      disabled={isClosed}
                      onChange={(e) => updateDayHour(day, "open", e.target.value)}
                      onBlur={(e) => updateDayHour(day, "open", e.target.value)}
                      className={cx(INPUT_CLASS, "disabled:cursor-not-allowed disabled:opacity-40")}
                    />
                    <span className="text-xs opacity-60">até</span>
                    <input
                      type="time"
                      value={closeTime || ""}
                      disabled={isClosed}
                      onChange={(e) => updateDayHour(day, "close", e.target.value)}
                      onBlur={(e) => updateDayHour(day, "close", e.target.value)}
                      className={cx(INPUT_CLASS, "disabled:cursor-not-allowed disabled:opacity-40")}
                    />
                  </div>

                  <label className="col-start-2 inline-flex cursor-pointer items-center gap-2 text-xs opacity-70 sm:col-start-3">
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

          <GhostButton
            className="mt-4"
            onClick={() => {
              safeSetHours((prev) => {
                const next = { ...prev };
                Object.keys(next).forEach((day) => {
                  next[day] = "00:00-23:59";
                });
                return next;
              });
            }}
          >
            Abrir 24h todos os dias
          </GhostButton>
        </SectionCard>
      </div>

      {layoutPreview !== null && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.75)", backdropFilter: "blur(12px)" }}
          onClick={() => setLayoutPreview(null)}
        >
          <div
            style={{
              width: 375 * previewScale,
              height: 620 * previewScale,
              position: "relative",
              borderRadius: 32,
              overflow: "hidden",
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.9)",
              border: "4px solid rgba(255,255,255,0.15)",
              flexShrink: 0,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ transform: `scale(${previewScale})`, transformOrigin: "top left", width: 375, height: 620 }}>
              <iframe
                ref={previewScrollRef}
                src={`/menu/${menu?.slug}/preview?preview_layout=${layoutPreview}`}
                style={{ width: "375px", height: "620px", border: "none" }}
                title="Preview do cardápio"
              />
            </div>
          </div>

          <div className="mt-4 flex gap-3" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setLayoutPreview(null)}
              className="h-11 cursor-pointer rounded-xl border border-white/20 bg-white/10 px-5 text-sm font-semibold text-white transition hover:opacity-80"
            >
              Cancelar
            </button>

            {userRole === "free" && layoutPreview !== "default" ? (
              <button
                type="button"
                onClick={() => {
                  window.location.href = "https://www.bitemenu.com.br/dashboard/pricing";
                }}
                className="h-11 cursor-pointer rounded-xl bg-[#d42020] px-5 text-sm font-semibold text-white transition hover:opacity-90"
              >
                Assinar Plus para liberar
              </button>
            ) : (
              <button
                type="button"
                onClick={handleApplyLayout}
                className="h-11 cursor-pointer rounded-xl bg-[#d42020] px-5 text-sm font-semibold text-white transition hover:opacity-90"
              >
                Aplicar estilo
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ConfigMenu;
