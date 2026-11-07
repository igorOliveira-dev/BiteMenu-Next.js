"use client";

import Loading from "@/components/Loading";
import { useConfirm } from "@/providers/ConfirmProvider";
import React, { useEffect, useMemo, useRef, useState } from "react";
import BannerCropper, {
  BANNER_CROPS,
} from "@/app/dashboard/tabs/components/menu/BannerCropper";
import {
  FaShoppingCart,
  FaArrowRight,
  FaArrowLeft,
  FaCheck,
  FaImage,
} from "react-icons/fa";
import useUser from "@/hooks/useUser";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { COLOR_PALETTES } from "@/consts/colorPallets";
import { COUNTRY_TO_CURRENCY } from "@/consts/currencies";
import { getCurrencySymbol } from "@/lib/formatCurrency";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import { fileToWebp, cropToWebp } from "@/app/utils/imageToWebp";
import { useAlert } from "@/providers/AlertProvider";
import AddressFields, { formatAddress } from "@/components/AddressFields";
import { geocodeAddress } from "@/lib/deliveryRadius";
import { getContrastTextColor as contrastText } from "@/utils/color";

// ---- CONFIG ----
const BUCKET = "menus";
const USE_TIMEOUTS = true;
// -----------------

const DEFAULT_BACKGROUND = COLOR_PALETTES[0].bg;
const DEFAULT_TITLE = COLOR_PALETTES[0].title;
const DEFAULT_DETAILS = COLOR_PALETTES[0].details;
const NO_BANNER = { desktop: null, mobile: null };

const serviceOptions = [
  { id: "delivery", label: "Entrega", emoji: "🛵" },
  { id: "pickup", label: "Retirada", emoji: "🏃" },
  { id: "dinein", label: "Comer no local", emoji: "🍽️" },
  { id: "faceToFace", label: "Atendimento presencial", emoji: "🤝" },
];

const STEPS = [
  { id: "name", title: "Nome" },
  { id: "services", title: "Serviços" },
  { id: "visual", title: "Visual" },
  { id: "preview", title: "Revisar" },
];

const getExt = (file) => {
  if (!file) return "";
  if (file.type === "image/webp") return ".webp";
  if (file.name) {
    const parts = file.name.split(".");
    return parts.length > 1 ? `.${parts.pop()}` : "";
  }
  return "";
};

const withTimeout = (promise, ms, name = "operation") =>
  Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(
        () => reject(new Error(`${name} timed out after ${ms}ms`)),
        ms,
      ),
    ),
  ]);

const uploadFileToStorage = async (file, userId, slug, filename) => {
  if (!file) return null;
  const ext = getExt(file);
  const path = `${userId}/${slug}/${filename}${ext}`;
  const uploadRes = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: true });
  const uploadError =
    uploadRes?.error ??
    (uploadRes && uploadRes.status >= 400 ? uploadRes : null);
  if (uploadError)
    throw new Error(uploadError?.message ?? JSON.stringify(uploadError));
  try {
    const publicRes = await supabase.storage.from(BUCKET).getPublicUrl(path);
    const publicUrl = publicRes?.data?.publicUrl ?? null;
    if (publicUrl) return publicUrl;
  } catch {}
  const signedRes = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, 60 * 60);
  if (signedRes?.error)
    throw new Error(
      signedRes.error?.message ?? JSON.stringify(signedRes.error),
    );
  return signedRes?.data?.signedUrl ?? null;
};

const getContrastTextColor = (hex) => contrastText(hex, DEFAULT_BACKGROUND);

function slugify(value) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-");
}

// Progress bar component
// Passos concluídos em verde, atual em granada (mesmos papéis de cor do painel)
function ProgressBar({ currentStep, onJump }) {
  return (
    <ol className="w-full mb-6 flex items-start">
      {STEPS.map((step, idx) => {
        const isCompleted = idx < currentStep;
        const isCurrent = idx === currentStep;
        return (
          <React.Fragment key={step.id}>
            <li className="flex flex-col items-center shrink-0 w-14">
              <button
                type="button"
                onClick={() => isCompleted && onJump(idx)}
                disabled={!isCompleted}
                aria-current={isCurrent ? "step" : undefined}
                aria-label={`Passo ${idx + 1}: ${step.title}`}
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                  isCompleted
                    ? "bg-verde text-white cursor-pointer hover:opacity-85"
                    : isCurrent
                      ? "bg-brand-select text-white ring-4 ring-brand-select/20"
                      : "bg-brand-surface text-brand-muted border border-brand-line"
                }`}
              >
                {isCompleted ? <FaCheck size={12} /> : idx + 1}
              </button>
              <span
                className={`text-xs mt-1.5 text-center leading-tight ${
                  isCurrent ? "text-brand-fg font-semibold" : "text-brand-muted"
                }`}
              >
                {step.title}
              </span>
            </li>
            {idx < STEPS.length - 1 && (
              <div className="flex-1 h-1 mt-4 -mx-2 rounded-full bg-brand-line overflow-hidden">
                <div
                  className="h-full bg-verde transition-all duration-500"
                  style={{ width: idx < currentStep ? "100%" : "0%" }}
                />
              </div>
            )}
          </React.Fragment>
        );
      })}
    </ol>
  );
}

function StepCard({ step, title, description, children }) {
  return (
    <div className="w-full" style={{ animation: "fadeSlideIn 0.3s ease" }}>
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-eyebrow mb-2">
        Passo {step} de {STEPS.length}
      </p>
      <h2 className="text-2xl font-extrabold tracking-tight text-brand-fg mb-1">
        {title}
      </h2>
      <p className="text-brand-muted mb-6">{description}</p>
      {children}
    </div>
  );
}

function FieldLabel({ children, hint }) {
  return (
    <p className="text-sm font-semibold text-brand-fg mb-2">
      {children}{" "}
      {hint && <span className="font-normal text-brand-muted">{hint}</span>}
    </p>
  );
}

export default function GetStart() {
  const [currentStep, setCurrentStep] = useState(0);

  const [establishmentName, setEstablishmentName] = useState("");
  const [selectedServices, setSelectedServices] = useState([
    "delivery",
    "pickup",
    "dinein",
  ]);

  const [addressDetails, setAddressDetails] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [bannerFiles, setBannerFiles] = useState(NO_BANNER);
  const [bannerCropAreas, setBannerCropAreas] = useState(NO_BANNER);
  const [logoPreview, setLogoPreview] = useState(null);

  const logoInputRef = useRef(null);
  const bannerInputRef = useRef(null);

  const [creatingMenu, setCreatingMenu] = useState(false);
  const [previewCurrency, setPreviewCurrency] = useState("BRL");
  const { user, profile, loading } = useUser();
  const router = useRouter();

  // Cliente não cria cardápio; o dashboard sem cardápio também cai aqui, então isto barra os dois
  useEffect(() => {
    if (profile?.account_type === "customer") router.replace("/");
  }, [profile, router]);
  const confirm = useConfirm();
  const alert = useAlert();

  const [visiblePalettes, setVisiblePalettes] = useState(12);
  const [paletteIndex, setPaletteIndex] = useState(0);
  const [backgroundColor, setBackgroundColor] = useState(DEFAULT_BACKGROUND);
  const [titleColor, setTitleColor] = useState(DEFAULT_TITLE);
  const [detailsColor, setDetailsColor] = useState(DEFAULT_DETAILS);

  useEffect(() => {
    if (!user?.id) return;
    let active = true;
    (async () => {
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("phone")
          .eq("id", user.id)
          .single();
        if (!active || !profile?.phone) return;
        const pn = parsePhoneNumberFromString(
          "+" + String(profile.phone).replace(/^\+/, ""),
        );
        if (pn?.country && COUNTRY_TO_CURRENCY[pn.country]) {
          setPreviewCurrency(COUNTRY_TO_CURRENCY[pn.country]);
        }
      } catch {}
    })();
    return () => {
      active = false;
    };
  }, [user?.id]);

  useEffect(() => {
    if (!logoFile) {
      setLogoPreview((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      return;
    }
    const url = URL.createObjectURL(logoFile);
    setLogoPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return url;
    });
    return () => URL.revokeObjectURL(url);
  }, [logoFile]);

  // mesmo esquema do dashboard (Menu.jsx): um arquivo e um recorte por tela
  const bannerSources = useMemo(
    () => ({
      desktop: bannerFiles.desktop && URL.createObjectURL(bannerFiles.desktop),
      mobile: bannerFiles.mobile && URL.createObjectURL(bannerFiles.mobile),
    }),
    [bannerFiles],
  );
  useEffect(
    () => () =>
      Object.values(bannerSources).forEach(
        (url) => url && URL.revokeObjectURL(url),
      ),
    [bannerSources],
  );
  const bannerPreview = bannerSources.mobile || bannerSources.desktop;

  const setBannerBoth = (file) => {
    setBannerCropAreas(NO_BANNER);
    setBannerFiles(file ? { desktop: file, mobile: file } : NO_BANNER);
  };
  const pickBannerFor = (mode, file) => {
    const other = mode === "mobile" ? "desktop" : "mobile";
    if (!bannerFiles[other]) return setBannerBoth(file);
    setBannerCropAreas((a) => ({ ...a, [mode]: null }));
    setBannerFiles((f) => ({ ...f, [mode]: file }));
  };

  const toggleService = (id) => {
    setSelectedServices((prev) => {
      if (prev.length === 1 && prev.includes(id)) return prev;
      return prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id];
    });
  };

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) setLogoFile(file);
    e.target.value = "";
  };

  const handleBannerChange = (e) => {
    const file = e.target.files?.[0];
    if (file) setBannerBoth(file);
    e.target.value = "";
  };

  const selectPalette = (idx) => {
    setPaletteIndex(idx);
    const { bg, title, details } = COLOR_PALETTES[idx];
    setBackgroundColor(bg);
    setTitleColor(title);
    setDetailsColor(details);
  };

  const goNext = () => {
    (setCurrentStep((s) => Math.min(s + 1, STEPS.length - 1)),
      window.scrollTo({
        top: 0,
      }));
  };
  const goPrev = () => {
    (setCurrentStep((s) => Math.max(s - 1, 0)),
      window.scrollTo({
        top: 0,
      }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loading />
      </div>
    );
  }

  const getUniqueSlug = async (baseSlug) => {
    let candidate = baseSlug;
    let count = 1;
    while (true) {
      const { data, error } = await supabase
        .from("menus")
        .select("id")
        .eq("slug", candidate)
        .maybeSingle();
      if (error && error.code !== "PGRST116") throw error;
      if (!data) return candidate;
      candidate = `${baseSlug}-${count}`;
      count++;
    }
  };

  const handleSubmit = async () => {
    const ok = await confirm(
      "Quer mesmo criar o cardápio com essas informações?",
      { tone: "confirm" },
    );
    if (!ok) return;

    if (!user) {
      alert("Você precisa estar logado para criar o cardápio.", "error");
      return;
    }

    setCreatingMenu(true);

    try {
      const rawName = establishmentName?.trim();
      const baseSlug = rawName
        ? slugify(rawName)
        : `meu-estabelecimento-${user.id.slice(0, 8)}`;
      let slug = await getUniqueSlug(baseSlug);

      const MAX_BYTES = 8 * 1024 * 1024;
      if (logoFile && logoFile.size > MAX_BYTES) {
        alert(
          "Logo muito grande (máx 8MB). Reduza o arquivo e tente de novo.",
          "error",
        );
        throw new Error("Logo muito grande (máx 8MB).");
      }
      if (Object.values(bannerFiles).some((f) => f && f.size > 4 * MAX_BYTES)) {
        alert(
          "Banner muito grande (máx 32MB). Reduza o arquivo e tente de novo.",
          "error",
        );
        throw new Error("Banner muito grande (máx 32MB).");
      }

      if (!user.id)
        throw new Error(
          "user.id indefinido - usuário pode não estar autenticado corretamente.",
        );

      let logo_url = null;
      let banner_url = null;
      let banner_mobile_url = null;

      if (logoFile) {
        const webpLogoRaw = await fileToWebp(logoFile, {
          maxBytes: 80 * 1024,
          maxDimension: 256,
          minDimension: 128,
          startQuality: 0.9,
          minQuality: 0.6,
          force: true,
        });
        const webpLogo =
          webpLogoRaw instanceof File
            ? webpLogoRaw
            : new File([webpLogoRaw], "logo.webp", { type: "image/webp" });
        const p = uploadFileToStorage(webpLogo, user.id, slug, "logo");
        logo_url =
          (USE_TIMEOUTS
            ? await withTimeout(p, 30000, "logo upload")
            : await p) ?? null;
      }

      if (bannerFiles.desktop) {
        // mesmo recorte/tamanho do dashboard (BANNER_CROPS)
        const [desktopWebp, mobileWebp] = await Promise.all(
          ["desktop", "mobile"].map((key) =>
            cropToWebp(bannerFiles[key], bannerCropAreas[key], {
              aspect: BANNER_CROPS[key].aspect,
              maxWidth: BANNER_CROPS[key].maxWidth,
              name: `banner-${key}.webp`,
            }),
          ),
        );
        const up = (file, name) => {
          const p = uploadFileToStorage(file, user.id, slug, name);
          return USE_TIMEOUTS ? withTimeout(p, 45000, `${name} upload`) : p;
        };
        [banner_url, banner_mobile_url] = await Promise.all([
          up(desktopWebp, "banner"),
          up(mobileWebp, "banner-mobile"),
        ]);
      }

      const safeTitle = rawName || "Meu estabelecimento";

      let detectedCurrency = "BRL";
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("phone")
          .eq("id", user.id)
          .single();
        if (profile?.phone) {
          const pn = parsePhoneNumberFromString(
            "+" + String(profile.phone).replace(/^\+/, ""),
          );
          if (pn?.country && COUNTRY_TO_CURRENCY[pn.country])
            detectedCurrency = COUNTRY_TO_CURRENCY[pn.country];
        }
      } catch (e) {
        console.warn("Não foi possível detectar a moeda pelo telefone:", e);
      }

      const insertObj = {
        owner_id: user.id,
        slug,
        title: safeTitle,
        description: null,
        logo_url: logo_url ?? null,
        banner_url: banner_url ?? null,
        banner_mobile_url: banner_mobile_url ?? null,
        services: selectedServices?.length ? selectedServices : null,
        background_color: backgroundColor || null,
        title_color: titleColor || null,
        details_color: detailsColor || null,
        currency: detectedCurrency,
      };

      // endereço é opcional: só grava com a rua preenchida (mesmo critério do painel)
      const address = addressDetails ? formatAddress(addressDetails) : "";
      if (address) {
        insertObj.address = address;
        insertObj.address_details = addressDetails;
        const pos = await geocodeAddress(addressDetails);
        insertObj.lat = pos?.lat ?? null;
        insertObj.lng = pos?.lng ?? null;
      }

      const MAX_INSERT_ATTEMPTS = 5;
      let insertAttempt = 0;
      let finalData = null;

      while (insertAttempt < MAX_INSERT_ATTEMPTS) {
        insertAttempt++;
        const insertPromise = supabase
          .from("menus")
          .insert([insertObj])
          .select()
          .single();
        const result = USE_TIMEOUTS
          ? await withTimeout(insertPromise, 15000, "db insert")
          : await insertPromise;
        const inserted = result?.data ?? null;
        const insertError = result?.error ?? null;

        if (insertError) {
          const isDuplicate =
            insertError.code === "23505" ||
            (insertError?.message &&
              insertError.message.toLowerCase().includes("duplicate"));
          if (isDuplicate) {
            const suffixMatch = slug.match(/-(\d+)$/);
            slug = suffixMatch
              ? `${baseSlug}-${parseInt(suffixMatch[1], 10) + 1}`
              : `${baseSlug}-1`;
            insertObj.slug = slug;
            continue;
          }
          throw new Error(insertError?.message ?? JSON.stringify(insertError));
        }

        finalData = inserted;
        break;
      }

      if (!finalData)
        throw new Error(
          "Não foi possível criar o cardápio depois de várias tentativas.",
        );

      alert("Cardápio criado com sucesso!", "success");
      router.push("/dashboard");
    } catch (err) {
      console.error("Erro ao criar cardápio:", err);
      const supaMsg = err?.message ?? err?.error ?? JSON.stringify(err);
      const details = err?.details ?? err?.hint ?? "";
      alert(`Erro ao criar cardápio: ${supaMsg} ${details}`.trim(), "error");
    } finally {
      setCreatingMenu(false);
    }
  };

  if (creatingMenu) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center">
        <Loading />
        <p className="my-2 font-semibold">Criando seu cardápio…</p>
        <p className="text-sm" style={{ color: "var(--gray)" }}>
          Em menos de um minuto estará pronto.
        </p>
      </div>
    );
  }

  // ─── Live preview (shared across step 3 and 4) ───────────────────────────
  const LivePreview = () => (
    <div
      className="rounded-xl shadow-inner overflow-hidden transition-colors duration-500"
      style={{ backgroundColor }}
    >
      {/* Banner */}
      <div
        className="w-full h-28 flex items-center justify-center overflow-hidden"
        style={{
          backgroundColor:
            getContrastTextColor(backgroundColor) === "white"
              ? "#ffffff18"
              : "#00000018",
        }}
      >
        {bannerPreview ? (
          <img
            src={bannerPreview}
            alt="Banner"
            className="object-cover w-full h-full"
          />
        ) : (
          <span
            className="text-xs"
            style={{
              color:
                getContrastTextColor(backgroundColor) === "white"
                  ? "#ccc"
                  : "#888",
            }}
          >
            Banner
          </span>
        )}
      </div>

      <div className="p-4">
        {/* Logo + nome */}
        <div className="flex items-center mb-4">
          <div
            className="w-12 h-12 rounded-md overflow-hidden flex-shrink-0 flex items-center justify-center"
            style={{
              backgroundColor:
                getContrastTextColor(backgroundColor) === "white"
                  ? "#ffffff25"
                  : "#00000025",
            }}
          >
            {logoPreview ? (
              <img
                src={logoPreview}
                alt="Logo"
                className="object-contain w-full h-full"
              />
            ) : (
              <span
                className="text-xs"
                style={{
                  color:
                    getContrastTextColor(backgroundColor) === "white"
                      ? "#ccc"
                      : "#888",
                }}
              >
                Logo
              </span>
            )}
          </div>
          <h3
            className="ml-3 font-bold text-base"
            style={{ color: titleColor }}
          >
            {establishmentName || "Meu Estabelecimento"}
          </h3>
        </div>

        {/* Itens de exemplo */}
        <p
          className="font-bold text-sm mb-2"
          style={{ color: getContrastTextColor(backgroundColor) }}
        >
          Lanches:
        </p>
        {[
          {
            name: "X-Burger Tradicional",
            desc: "Pão, hambúrguer, queijo, alface e maionese especial.",
            price: "20,00",
          },
          {
            name: "Misto Quente Gourmet",
            desc: "Pão artesanal, presunto, muçarela e manteiga.",
            price: "18,00",
          },
        ].map((item, idx) => (
          <div
            key={idx}
            className="mb-3 p-3 rounded-lg"
            style={{
              backgroundColor:
                getContrastTextColor(backgroundColor) === "white"
                  ? "#ffffff15"
                  : "#00000015",
            }}
          >
            <p
              className="font-semibold text-sm"
              style={{ color: getContrastTextColor(backgroundColor) }}
            >
              {item.name}
            </p>
            <p
              className="text-xs mb-2 opacity-80"
              style={{ color: getContrastTextColor(backgroundColor) }}
            >
              {item.desc}
            </p>
            <div className="flex justify-between items-center">
              <span
                className="font-bold"
                style={{ color: getContrastTextColor(backgroundColor) }}
              >
                {getCurrencySymbol(previewCurrency)} {item.price}
              </span>
              <button
                type="button"
                className="h-8 w-10 rounded-md flex items-center justify-center"
                style={{
                  backgroundColor: detailsColor,
                  color: getContrastTextColor(detailsColor),
                }}
              >
                <FaShoppingCart size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // ─── Step 1: Nome ─────────────────────────────────────────────────────────
  const previewSlug = slugify(establishmentName.trim()) || "seu-negocio";

  const StepName = () => (
    <StepCard
      step={1}
      title="Como seu negócio se chama?"
      description="É o nome que seus clientes vão ver no topo do cardápio."
    >
      <FieldLabel>Nome do estabelecimento</FieldLabel>
      <input
        type="text"
        value={establishmentName}
        onChange={(e) => setEstablishmentName(e.target.value.slice(0, 30))}
        onKeyDown={(e) => e.key === "Enter" && goNext()}
        maxLength={30}
        placeholder="Ex.: Açaí da Praça"
        autoFocus
        className="w-full px-4 py-3.5 text-lg bg-brand-bg text-brand-fg placeholder:text-brand-muted/70 border border-brand-line rounded-2xl focus:outline-none focus:border-brand-select focus:ring-4 focus:ring-brand-select/15 transition"
      />
      <div className="flex justify-between items-start gap-3 mt-3">
        <p className="text-sm text-brand-muted min-w-0">
          Seu link:{" "}
          <span className="font-semibold text-info break-all">
            bitemenu.com.br/menu/{previewSlug}
          </span>
        </p>
        <span className="text-xs text-brand-muted shrink-0">
          {establishmentName.length}/30
        </span>
      </div>
    </StepCard>
  );

  // ─── Step 2: Serviços ─────────────────────────────────────────────────────
  const StepServices = () => (
    <StepCard
      step={2}
      title="Como você atende?"
      description="Marque tudo que vale pro seu negócio. Dá pra mudar depois."
    >
      <div className="grid grid-cols-2 gap-3">
        {serviceOptions.map((opt) => {
          const isSelected = selectedServices.includes(opt.id);
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => toggleService(opt.id)}
              aria-pressed={isSelected}
              className={`relative cursor-pointer flex flex-col items-center justify-center gap-1 p-4 min-h-[104px] rounded-2xl border-2 transition-all duration-200 font-semibold text-sm active:scale-[0.97] ${
                isSelected
                  ? "border-brand-select bg-brand-select/10 text-brand-fg"
                  : "border-brand-line bg-brand-bg text-brand-muted hover:border-brand-select/40"
              }`}
            >
              <span
                className={`absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center transition ${
                  isSelected
                    ? "bg-brand-select text-white"
                    : "border border-brand-line"
                }`}
              >
                {isSelected && <FaCheck size={9} />}
              </span>
              <span className="text-3xl">{opt.emoji}</span>
              {opt.label}
            </button>
          );
        })}
      </div>
      <p className="text-xs text-brand-muted mt-3">
        {selectedServices.length}{" "}
        {selectedServices.length === 1 ? "selecionado" : "selecionados"} · pelo
        menos um
      </p>

      <div className="mt-6">
        <FieldLabel hint="(opcional)">Endereço do estabelecimento</FieldLabel>
        <p className="text-xs text-brand-muted mb-3">
          Com o endereço, seu cardápio aparece no Descobrir do Bite Menu para
          clientes da sua região. Digite o CEP para preencher o resto.
        </p>
        <AddressFields
          value={addressDetails}
          onChange={setAddressDetails}
          inputClassName="w-full px-4 py-3 bg-brand-bg text-brand-fg placeholder:text-brand-muted/70 border border-brand-line rounded-2xl focus:outline-none focus:border-brand-select focus:ring-4 focus:ring-brand-select/15 transition"
        />
      </div>
    </StepCard>
  );

  // ─── Step 3: Visual ───────────────────────────────────────────────────────
  const UploadBox = ({
    preview,
    inputRef,
    onChange,
    onRemove,
    fit,
    className,
  }) => (
    <div>
      <label
        className={`group flex flex-col items-center justify-center gap-1.5 h-28 rounded-2xl cursor-pointer overflow-hidden transition border-2 ${
          preview
            ? "border-verde"
            : "border-dashed border-brand-line bg-brand-bg hover:border-brand-select/50 hover:bg-brand-select/5"
        } ${className}`}
      >
        {preview ? (
          <img src={preview} alt="" className={`w-full h-full ${fit}`} />
        ) : (
          <>
            <FaImage
              size={20}
              className="text-brand-muted group-hover:text-brand-select transition"
            />
            <span className="text-center text-xs font-medium px-2 text-brand-muted">
              Enviar imagem
            </span>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={onChange}
          className="hidden"
        />
      </label>
      {preview && (
        <button
          type="button"
          onClick={onRemove}
          className="cursor-pointer mt-1.5 text-xs font-medium text-brand-muted hover:text-brand-fg underline"
        >
          Remover
        </button>
      )}
    </div>
  );

  const StepVisual = () => (
    <StepCard
      step={3}
      title="Deixe com a sua cara"
      description="Logo, banner e cores. Tudo opcional e editável depois."
    >
      <div className="space-y-7">
        <div className="flex flex-col xs:flex-row gap-4">
          <div>
            <FieldLabel hint="(quadrada)">Logo</FieldLabel>
            <UploadBox
              preview={logoPreview}
              inputRef={logoInputRef}
              onChange={handleLogoChange}
              onRemove={() => setLogoFile(null)}
              fit="object-contain"
              className="w-28"
            />
          </div>
          {!bannerPreview && (
            <div className="flex-1">
              <FieldLabel hint="(retangular)">Banner</FieldLabel>
              <UploadBox
                inputRef={bannerInputRef}
                onChange={handleBannerChange}
                className="w-full"
              />
            </div>
          )}
        </div>

        {/* com imagem: mesmo recortador do dashboard (celular e computador) */}
        {bannerPreview && (
          <div>
            <FieldLabel hint="(ajuste o enquadramento)">Banner</FieldLabel>
            <BannerCropper
              sources={bannerSources}
              saved={NO_BANNER}
              onAreaChange={(mode, area) =>
                setBannerCropAreas((a) => ({ ...a, [mode]: area }))
              }
              onPick={pickBannerFor}
              onPickBoth={setBannerBoth}
              onRemove={() => setBannerBoth(null)}
            />
          </div>
        )}

        <div>
          <FieldLabel>Cores do cardápio</FieldLabel>
          <div className="grid grid-cols-3 xs:grid-cols-4 gap-2.5">
            {COLOR_PALETTES.slice(0, visiblePalettes).map((palette, idx) => {
              const isSelected = paletteIndex === idx;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => selectPalette(idx)}
                  title={palette.name || `Paleta ${idx + 1}`}
                  aria-pressed={isSelected}
                  className={`cursor-pointer relative h-16 rounded-xl overflow-hidden transition-all duration-200 ring-offset-2 ring-offset-brand-surface ${
                    isSelected
                      ? "ring-[3px] ring-brand-select"
                      : "ring-1 ring-brand-line hover:ring-brand-select/40"
                  }`}
                >
                  <div className="flex h-full w-full">
                    <div
                      className="flex-1"
                      style={{ backgroundColor: palette.bg }}
                    />
                    <div
                      className="w-4"
                      style={{ backgroundColor: palette.title }}
                    />
                    <div
                      className="w-4"
                      style={{ backgroundColor: palette.details }}
                    />
                  </div>
                  {isSelected && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-brand-select text-white rounded-full w-6 h-6 flex items-center justify-center shadow">
                        <FaCheck size={10} />
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
          {visiblePalettes < COLOR_PALETTES.length && (
            <button
              type="button"
              onClick={() => setVisiblePalettes((prev) => prev + 12)}
              className="cursor-pointer mt-3 w-full rounded-full border border-brand-line py-2 text-sm font-medium text-brand-fg transition hover:bg-translucid"
            >
              Ver mais paletas
            </button>
          )}
        </div>

        <div>
          <FieldLabel hint="(atualiza na hora)">Prévia</FieldLabel>
          <LivePreview />
        </div>
      </div>
    </StepCard>
  );

  // ─── Step 4: Revisar ──────────────────────────────────────────────────────
  const SummaryRow = ({ label, value, ok, onEdit }) => (
    <div className="flex items-center gap-3 py-2.5 border-b border-brand-line last:border-0">
      <span
        className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
          ok
            ? "bg-verde text-white"
            : "border border-brand-line text-brand-muted"
        }`}
      >
        {ok ? <FaCheck size={10} /> : <span className="text-xs">–</span>}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-brand-muted">{label}</p>
        <div className="text-sm font-semibold text-brand-fg truncate">
          {value}
        </div>
      </div>
      <button
        type="button"
        onClick={onEdit}
        className="cursor-pointer text-xs font-semibold text-info hover:underline shrink-0"
      >
        Editar
      </button>
    </div>
  );

  const StepPreview = () => (
    <StepCard
      step={4}
      title="Tudo pronto!"
      description="Confira o resumo. Se estiver tudo certo, é só criar."
    >
      <div className="space-y-5">
        <div className="rounded-2xl px-4 py-1 bg-brand-bg border border-brand-line">
          <SummaryRow
            label="Nome"
            value={establishmentName || "Meu Estabelecimento"}
            ok={!!establishmentName}
            onEdit={() => goTo(0)}
          />
          <SummaryRow
            label="Serviços"
            value={selectedServices
              .map((id) => serviceOptions.find((o) => o.id === id)?.label)
              .join(", ")}
            ok
            onEdit={() => goTo(1)}
          />
          <SummaryRow
            label="Logo"
            value={logoFile ? "Adicionada" : "Sem logo, dá pra pôr depois"}
            ok={!!logoFile}
            onEdit={() => goTo(2)}
          />
          <SummaryRow
            label="Banner"
            value={
              bannerFiles.desktop
                ? "Adicionado"
                : "Sem banner, dá pra pôr depois"
            }
            ok={!!bannerFiles.desktop}
            onEdit={() => goTo(2)}
          />
          <SummaryRow
            label="Cores"
            ok
            onEdit={() => goTo(2)}
            value={
              <div className="flex gap-1.5 mt-0.5">
                {[backgroundColor, titleColor, detailsColor].map((c, i) => (
                  <div
                    key={i}
                    className="w-5 h-5 rounded-full border border-brand-line"
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            }
          />
        </div>

        <LivePreview />
      </div>
    </StepCard>
  );

  const goTo = (idx) => {
    setCurrentStep(idx);
    window.scrollTo({ top: 0 });
  };

  // Chamados como função (não <StepName />) para o input não remontar a cada tecla
  const stepRenderers = [StepName, StepServices, StepVisual, StepPreview];
  const isLastStep = currentStep === STEPS.length - 1;

  return (
    <div className="flex flex-col items-center px-4 py-6 xs:p-6 min-h-screen bg-brand-bg text-brand-fg">
      <div className="max-w-[560px] w-full mt-4 xs:mt-8">
        <div className="text-center mb-7">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-eyebrow mb-2">
            Crie seu cardápio
          </p>
          <h1 className="default-h1 mb-2">Seu cardápio pronto em minutos</h1>
          <p className="text-sm text-brand-muted">
            4 passos rápidos · nada é obrigatório · tudo editável depois
          </p>
        </div>

        <ProgressBar currentStep={currentStep} onJump={goTo} />

        <div className="rounded-card p-5 xs:p-8 bg-brand-surface border border-brand-line shadow-[0_8px_30px_var(--shadow)]">
          <div key={currentStep}>{stepRenderers[currentStep]()}</div>

          <div className="flex items-center mt-8 gap-3">
            {currentStep > 0 && (
              <button
                type="button"
                onClick={goPrev}
                className="cursor-pointer flex items-center gap-2 px-4 py-3 rounded-full font-semibold text-brand-muted transition hover:bg-translucid hover:text-brand-fg"
              >
                <FaArrowLeft size={12} /> Voltar
              </button>
            )}

            {isLastStep ? (
              <button
                type="button"
                onClick={handleSubmit}
                className="cursor-pointer flex-1 py-3.5 bg-verde text-white font-bold text-lg rounded-full shadow-[0_6px_20px_#2f7d4e40] hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                <FaCheck /> Criar meu cardápio
              </button>
            ) : (
              <button
                type="button"
                onClick={goNext}
                className="cursor-pointer flex items-center justify-center gap-2 px-7 py-3 bg-azul text-white font-semibold rounded-full hover:opacity-90 active:scale-[0.97] transition-all ml-auto max-xs:flex-1"
              >
                {currentStep === 0 && !establishmentName
                  ? "Pular"
                  : "Continuar"}{" "}
                <FaArrowRight size={12} />
              </button>
            )}
          </div>
        </div>

        <p className="text-center text-xs mt-4 text-brand-muted">
          Você pode mudar tudo depois, sem perder nada.
        </p>
      </div>
    </div>
  );
}
