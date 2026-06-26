"use client";

import Loading from "@/components/Loading";
import { useConfirm } from "@/providers/ConfirmProvider";
import React, { useEffect, useRef, useState } from "react";
import { FaShoppingCart, FaArrowRight, FaArrowLeft, FaCheck } from "react-icons/fa";
import useUser from "@/hooks/useUser";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { COLOR_PALETTES } from "@/consts/colorPallets";
import { COUNTRY_TO_CURRENCY } from "@/consts/currencies";
import { getCurrencySymbol } from "@/lib/formatCurrency";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import { fileToWebp } from "@/app/utils/imageToWebp";
import { useAlert } from "@/providers/AlertProvider";

// ---- CONFIG ----
const BUCKET = "menus";
const USE_TIMEOUTS = true;
// -----------------

const DEFAULT_BACKGROUND = COLOR_PALETTES[0].bg;
const DEFAULT_TITLE = COLOR_PALETTES[0].title;
const DEFAULT_DETAILS = COLOR_PALETTES[0].details;

const serviceOptions = [
  { id: "delivery", label: "Entrega", emoji: "🛵" },
  { id: "pickup", label: "Retirada", emoji: "🏃" },
  { id: "dinein", label: "Comer no local", emoji: "🍽️" },
  { id: "faceToFace", label: "Atendimento presencial", emoji: "🤝" },
];

const STEPS = [
  { id: "name", title: "Seu negócio", description: "Como seu cardápio vai ser identificado" },
  { id: "services", title: "Serviços", description: "O que você oferece aos seus clientes" },
  { id: "visual", title: "Identidade visual", description: "Logo, banner e cores do seu cardápio" },
  { id: "preview", title: "Tudo pronto!", description: "Confira como ficou antes de criar" },
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
    new Promise((_, reject) => setTimeout(() => reject(new Error(`${name} timed out after ${ms}ms`)), ms)),
  ]);

const uploadFileToStorage = async (file, userId, slug, filename) => {
  if (!file) return null;
  const ext = getExt(file);
  const path = `${userId}/${slug}/${filename}${ext}`;
  const uploadRes = await supabase.storage.from(BUCKET).upload(path, file, { upsert: true });
  const uploadError = uploadRes?.error ?? (uploadRes && uploadRes.status >= 400 ? uploadRes : null);
  if (uploadError) throw new Error(uploadError?.message ?? JSON.stringify(uploadError));
  try {
    const publicRes = await supabase.storage.from(BUCKET).getPublicUrl(path);
    const publicUrl = publicRes?.data?.publicUrl ?? null;
    if (publicUrl) return publicUrl;
  } catch {}
  const signedRes = await supabase.storage.from(BUCKET).createSignedUrl(path, 60 * 60);
  if (signedRes?.error) throw new Error(signedRes.error?.message ?? JSON.stringify(signedRes.error));
  return signedRes?.data?.signedUrl ?? null;
};

function getContrastTextColor(hex) {
  const cleanHex = (hex || DEFAULT_BACKGROUND).replace("#", "");
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? "black" : "white";
}

function slugify(value) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-");
}

// Progress bar component
function ProgressBar({ currentStep, totalSteps }) {
  return (
    <div className="w-full mb-8">
      <div className="flex items-center justify-between mb-2">
        {STEPS.map((step, idx) => {
          const isCompleted = idx < currentStep;
          const isCurrent = idx === currentStep;
          return (
            <React.Fragment key={step.id}>
              <div className="flex flex-col items-center" style={{ flex: "0 0 auto" }}>
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300"
                  style={{
                    backgroundColor: isCompleted ? "#16a34a" : isCurrent ? "#155dfc" : "var(--low-gray)",
                    color: isCompleted || isCurrent ? "white" : "var(--gray)",
                    transform: isCurrent ? "scale(1.15)" : "scale(1)",
                  }}
                >
                  {isCompleted ? <FaCheck size={12} /> : idx + 1}
                </div>
                <span
                  className="hidden xs:block text-xs mt-1 text-center max-w-[64px] min-h-[30px] leading-tight"
                  style={{ color: isCurrent ? "#155dfc" : "var(--gray)", fontWeight: isCurrent ? "600" : "400" }}
                >
                  {step.title}
                </span>
              </div>
              {idx < totalSteps - 1 && (
                <div
                  className="flex-1 h-1 mx-1 rounded transition-all duration-500"
                  style={{ backgroundColor: idx < currentStep ? "#16a34a" : "var(--low-gray)" }}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

// Step card wrapper
function StepCard({ title, description, children }) {
  const [animate, setAnimate] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setAnimate(false), 300); // duração da animação
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="w-full" style={animate ? { animation: "fadeSlideIn 0.3s ease forwards" } : undefined}>
      <h2 className="mb-2">{title}</h2>
      <p className="text-[var(--gray)] mb-3">{description}</p>

      {children}
    </div>
  );
}

export default function GetStart() {
  const [currentStep, setCurrentStep] = useState(0);

  const [establishmentName, setEstablishmentName] = useState("");
  const [selectedServices, setSelectedServices] = useState(["delivery", "pickup", "dinein"]);

  const [logoFile, setLogoFile] = useState(null);
  const [bannerFile, setBannerFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(null);

  const logoInputRef = useRef(null);
  const bannerInputRef = useRef(null);

  const [creatingMenu, setCreatingMenu] = useState(false);
  const [previewCurrency, setPreviewCurrency] = useState("BRL");
  const { user, loading } = useUser();
  const router = useRouter();
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
        const { data: profile } = await supabase.from("profiles").select("phone").eq("id", user.id).single();
        if (!active || !profile?.phone) return;
        const pn = parsePhoneNumberFromString("+" + String(profile.phone).replace(/^\+/, ""));
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

  useEffect(() => {
    if (!bannerFile) {
      setBannerPreview((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      return;
    }
    const url = URL.createObjectURL(bannerFile);
    setBannerPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return url;
    });
    return () => URL.revokeObjectURL(url);
  }, [bannerFile]);

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
    if (file) setBannerFile(file);
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
      const { data, error } = await supabase.from("menus").select("id").eq("slug", candidate).maybeSingle();
      if (error && error.code !== "PGRST116") throw error;
      if (!data) return candidate;
      candidate = `${baseSlug}-${count}`;
      count++;
    }
  };

  const handleSubmit = async () => {
    const ok = await confirm("Quer mesmo criar o cardápio com essas informações?");
    if (!ok) return;

    if (!user) {
      alert("Você precisa estar logado para criar o cardápio.", "error");
      return;
    }

    setCreatingMenu(true);

    try {
      const rawName = establishmentName?.trim();
      const baseSlug = rawName ? slugify(rawName) : `meu-estabelecimento-${user.id.slice(0, 8)}`;
      let slug = await getUniqueSlug(baseSlug);

      const MAX_BYTES = 8 * 1024 * 1024;
      if (logoFile && logoFile.size > MAX_BYTES) {
        alert("Logo muito grande (máx 8MB). Reduza o arquivo e tente de novo.", "error");
        throw new Error("Logo muito grande (máx 8MB).");
      }
      if (bannerFile && bannerFile.size > 4 * MAX_BYTES) {
        alert("Banner muito grande (máx 32MB). Reduza o arquivo e tente de novo.", "error");
        throw new Error("Banner muito grande (máx 32MB).");
      }

      if (!user.id) throw new Error("user.id indefinido - usuário pode não estar autenticado corretamente.");

      let logo_url = null;
      let banner_url = null;

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
          webpLogoRaw instanceof File ? webpLogoRaw : new File([webpLogoRaw], "logo.webp", { type: "image/webp" });
        const p = uploadFileToStorage(webpLogo, user.id, slug, "logo");
        logo_url = (USE_TIMEOUTS ? await withTimeout(p, 30000, "logo upload") : await p) ?? null;
      }

      if (bannerFile) {
        const webpBannerRaw = await fileToWebp(bannerFile, {
          maxBytes: 300 * 1024,
          maxDimension: 1640,
          minDimension: 1200,
          startQuality: 0.82,
          minQuality: 0.55,
          force: true,
        });
        const webpBanner =
          webpBannerRaw instanceof File ? webpBannerRaw : new File([webpBannerRaw], "banner.webp", { type: "image/webp" });
        const p2 = uploadFileToStorage(webpBanner, user.id, slug, "banner");
        banner_url = (USE_TIMEOUTS ? await withTimeout(p2, 45000, "banner upload") : await p2) ?? null;
      }

      const safeTitle = rawName || "Meu estabelecimento";

      let detectedCurrency = "BRL";
      try {
        const { data: profile } = await supabase.from("profiles").select("phone").eq("id", user.id).single();
        if (profile?.phone) {
          const pn = parsePhoneNumberFromString("+" + String(profile.phone).replace(/^\+/, ""));
          if (pn?.country && COUNTRY_TO_CURRENCY[pn.country]) detectedCurrency = COUNTRY_TO_CURRENCY[pn.country];
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
        services: selectedServices?.length ? selectedServices : null,
        background_color: backgroundColor || null,
        title_color: titleColor || null,
        details_color: detailsColor || null,
        currency: detectedCurrency,
      };

      const MAX_INSERT_ATTEMPTS = 5;
      let insertAttempt = 0;
      let finalData = null;

      while (insertAttempt < MAX_INSERT_ATTEMPTS) {
        insertAttempt++;
        const insertPromise = supabase.from("menus").insert([insertObj]).select().single();
        const result = USE_TIMEOUTS ? await withTimeout(insertPromise, 15000, "db insert") : await insertPromise;
        const inserted = result?.data ?? null;
        const insertError = result?.error ?? null;

        if (insertError) {
          const isDuplicate =
            insertError.code === "23505" ||
            (insertError?.message && insertError.message.toLowerCase().includes("duplicate"));
          if (isDuplicate) {
            const suffixMatch = slug.match(/-(\d+)$/);
            slug = suffixMatch ? `${baseSlug}-${parseInt(suffixMatch[1], 10) + 1}` : `${baseSlug}-1`;
            insertObj.slug = slug;
            continue;
          }
          throw new Error(insertError?.message ?? JSON.stringify(insertError));
        }

        finalData = inserted;
        break;
      }

      if (!finalData) throw new Error("Não foi possível criar o cardápio depois de várias tentativas.");

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
    <div className="rounded-xl shadow-inner overflow-hidden transition-colors duration-500" style={{ backgroundColor }}>
      {/* Banner */}
      <div
        className="w-full h-28 flex items-center justify-center overflow-hidden"
        style={{ backgroundColor: getContrastTextColor(backgroundColor) === "white" ? "#ffffff18" : "#00000018" }}
      >
        {bannerPreview ? (
          <img src={bannerPreview} alt="Banner" className="object-cover w-full h-full" />
        ) : (
          <span className="text-xs" style={{ color: getContrastTextColor(backgroundColor) === "white" ? "#ccc" : "#888" }}>
            Banner
          </span>
        )}
      </div>

      <div className="p-4">
        {/* Logo + nome */}
        <div className="flex items-center mb-4">
          <div
            className="w-12 h-12 rounded-md overflow-hidden flex-shrink-0 flex items-center justify-center"
            style={{ backgroundColor: getContrastTextColor(backgroundColor) === "white" ? "#ffffff25" : "#00000025" }}
          >
            {logoPreview ? (
              <img src={logoPreview} alt="Logo" className="object-contain w-full h-full" />
            ) : (
              <span
                className="text-xs"
                style={{ color: getContrastTextColor(backgroundColor) === "white" ? "#ccc" : "#888" }}
              >
                Logo
              </span>
            )}
          </div>
          <h3 className="ml-3 font-bold text-base" style={{ color: titleColor }}>
            {establishmentName || "Meu Estabelecimento"}
          </h3>
        </div>

        {/* Itens de exemplo */}
        <p className="font-bold text-sm mb-2" style={{ color: getContrastTextColor(backgroundColor) }}>
          Lanches:
        </p>
        {[
          { name: "X-Burger Tradicional", desc: "Pão, hambúrguer, queijo, alface e maionese especial.", price: "20,00" },
          { name: "Misto Quente Gourmet", desc: "Pão artesanal, presunto, muçarela e manteiga.", price: "18,00" },
        ].map((item, idx) => (
          <div
            key={idx}
            className="mb-3 p-3 rounded-lg"
            style={{ backgroundColor: getContrastTextColor(backgroundColor) === "white" ? "#ffffff15" : "#00000015" }}
          >
            <p className="font-semibold text-sm" style={{ color: getContrastTextColor(backgroundColor) }}>
              {item.name}
            </p>
            <p className="text-xs mb-2 opacity-80" style={{ color: getContrastTextColor(backgroundColor) }}>
              {item.desc}
            </p>
            <div className="flex justify-between items-center">
              <span className="font-bold" style={{ color: getContrastTextColor(backgroundColor) }}>
                {getCurrencySymbol(previewCurrency)} {item.price}
              </span>
              <button
                type="button"
                className="h-8 w-10 rounded-md flex items-center justify-center"
                style={{ backgroundColor: detailsColor, color: getContrastTextColor(detailsColor) }}
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
  const StepName = () => (
    <StepCard
      title="Como seu negócio se chama?"
      description="Pode ser o nome da sua lanchonete, restaurante, doceria… qualquer coisa!"
    >
      <input
        type="text"
        value={establishmentName}
        onChange={(e) => setEstablishmentName(e.target.value.slice(0, 30))}
        maxLength={30}
        placeholder="Ex.: Lanchonete do Zé"
        autoFocus
        className="w-full px-4 py-3 text-lg bg-translucid border border-[var(--low-gray)] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
      />
      <div className="flex justify-between items-center mt-2">
        <span className="text-xs" style={{ color: "var(--gray)" }}>
          {(establishmentName || "").length}/30
        </span>
      </div>
    </StepCard>
  );

  // ─── Step 2: Serviços ─────────────────────────────────────────────────────
  const StepServices = () => (
    <StepCard title="O que você oferece?" description="Marque tudo que se aplica ao seu negócio. Pode mudar depois.">
      <div className="grid grid-cols-2 gap-3">
        {serviceOptions.map((opt) => {
          const isSelected = selectedServices.includes(opt.id);
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => toggleService(opt.id)}
              className="cursor-pointer flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-200 font-medium text-sm"
              style={{
                borderColor: isSelected ? "#155dfc" : "var(--low-gray)",
                backgroundColor: isSelected ? "#155dfc15" : "transparent",
                color: isSelected ? "#155dfc" : "var(--gray)",
                transform: isSelected ? "scale(1.03)" : "scale(1)",
              }}
            >
              <span className="text-2xl mb-1">{opt.emoji}</span>
              {opt.label}
            </button>
          );
        })}
      </div>
    </StepCard>
  );

  // ─── Step 3: Visual ───────────────────────────────────────────────────────
  const StepVisual = () => (
    <StepCard title="Identidade visual" description="Logo, banner e cores — tudo opcional e editável depois.">
      <div className="space-y-6">
        {/* Logo + Banner lado a lado no mesmo bloco */}
        <div className="flex flex-col sm:flex-row gap-4 w-[100%]">
          {/* Logo */}
          <div>
            <p className="text-sm font-semibold mb-2" style={{ color: "var(--gray)" }}>
              Logo <span className="font-normal opacity-60">(quadrada)</span>
            </p>
            <label
              className="flex flex-col items-center justify-center h-28 w-28 border-2 border-dashed rounded-xl cursor-pointer hover:border-blue-400 transition overflow-hidden"
              style={{ borderColor: logoPreview ? "#155dfc" : "var(--low-gray)" }}
            >
              {logoPreview ? (
                <img src={logoPreview} alt="Logo" className="object-contain w-full h-full" />
              ) : (
                <span className="text-center text-xs px-2 opacity-60" style={{ color: "var(--gray)" }}>
                  Clique para adicionar
                </span>
              )}
              <input ref={logoInputRef} type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
            </label>
            {logoFile && (
              <button
                type="button"
                onClick={() => {
                  setLogoFile(null);
                  if (logoInputRef.current) logoInputRef.current.value = "";
                }}
                className="mt-1 text-xs text-red-500 hover:underline"
              >
                Remover
              </button>
            )}
          </div>

          {/* Banner */}
          <div className="flex-1">
            <p className="text-sm font-semibold mb-2" style={{ color: "var(--gray)" }}>
              Banner <span className="font-normal opacity-60">(retangular)</span>
            </p>
            <label
              className="flex flex-col items-center justify-center h-28 w-[100%] border-2 border-dashed rounded-xl cursor-pointer hover:border-blue-400 transition overflow-hidden"
              style={{ borderColor: bannerPreview ? "#155dfc" : "var(--low-gray)" }}
            >
              {bannerPreview ? (
                <img src={bannerPreview} alt="Banner" className="object-cover w-full h-full" />
              ) : (
                <span className="text-center text-xs px-2 opacity-60" style={{ color: "var(--gray)" }}>
                  Clique para adicionar
                </span>
              )}
              <input ref={bannerInputRef} type="file" accept="image/*" onChange={handleBannerChange} className="hidden" />
            </label>
            {bannerFile && (
              <button
                type="button"
                onClick={() => {
                  setBannerFile(null);
                  if (bannerInputRef.current) bannerInputRef.current.value = "";
                }}
                className="mt-1 text-xs text-red-500 hover:underline"
              >
                Remover
              </button>
            )}
          </div>
        </div>

        {/* Paletas de cores */}
        <div>
          <p className="text-sm font-semibold mb-3" style={{ color: "var(--gray)" }}>
            Escolha uma paleta de cores
          </p>
          <div className="grid grid-cols-3 xs:grid-cols-4 gap-2">
            {COLOR_PALETTES.slice(0, visiblePalettes).map((palette, idx) => {
              const isSelected = paletteIndex === idx;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => selectPalette(idx)}
                  title={palette.name || `Paleta ${idx + 1}`}
                  className="relative rounded-xl overflow-hidden transition-all duration-200 focus:outline-none"
                  style={{
                    height: "64px",
                    border: isSelected ? "3px solid #155dfc" : "3px solid transparent",
                    transform: isSelected ? "scale(1.07)" : "scale(1)",
                    boxShadow: isSelected ? "0 0 0 2px #155dfc40" : "none",
                  }}
                >
                  {/* Color strips */}
                  <div className="flex h-full w-full">
                    <div className="flex-1" style={{ backgroundColor: palette.bg }} />
                    <div className="w-4" style={{ backgroundColor: palette.title }} />
                    <div className="w-4" style={{ backgroundColor: palette.details }} />
                  </div>
                  {/* Check mark overlay */}
                  {isSelected && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-white rounded-full w-6 h-6 flex items-center justify-center shadow">
                        <FaCheck size={10} style={{ color: "#155dfc" }} />
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
          <div className="mt-3 flex flex-col items-center gap-2">
            {visiblePalettes < COLOR_PALETTES.length && (
              <button
                type="button"
                onClick={() => setVisiblePalettes((prev) => prev + 12)}
                className="cursor-pointer rounded-xl border border-translucid bg-translucid px-4 py-2 transition hover:opacity-80"
              >
                Carregar mais
              </button>
            )}

            <p className="text-xs opacity-50 text-center" style={{ color: "var(--gray)" }}>
              Pode trocar a qualquer momento nas configurações do cardápio.
            </p>
          </div>
        </div>

        {/* Mini preview inline no step 3 */}
        <div>
          <p className="text-xs mb-2 opacity-60" style={{ color: "var(--gray)" }}>
            Prévia em tempo real:
          </p>
          <LivePreview />
        </div>
      </div>
    </StepCard>
  );

  // ─── Step 4: Preview final ────────────────────────────────────────────────
  const StepPreview = () => (
    <StepCard title="Tudo pronto! 🎉" description="Confira como vai ficar seu cardápio e clique em criar.">
      <div className="space-y-4">
        {/* Resumo */}
        <div
          className="rounded-xl p-4 space-y-2"
          style={{ backgroundColor: "var(--bg-translucid, rgba(0,0,0,0.04))", border: "1px solid var(--low-gray)" }}
        >
          <SummaryRow label="Nome" value={establishmentName || "Meu Estabelecimento"} />
          <SummaryRow
            label="Serviços"
            value={selectedServices.map((id) => serviceOptions.find((o) => o.id === id)?.label).join(", ")}
          />
          <SummaryRow label="Logo" value={logoFile ? "✅ Adicionada" : "Sem logo (pode adicionar depois)"} />
          <SummaryRow label="Banner" value={bannerFile ? "✅ Adicionado" : "Sem banner (pode adicionar depois)"} />
          <div className="flex items-center gap-2">
            <span className="text-sm opacity-60 w-20 flex-shrink-0" style={{ color: "var(--gray)" }}>
              Cores
            </span>
            <div className="flex gap-2">
              {[backgroundColor, titleColor, detailsColor].map((c, i) => (
                <div
                  key={i}
                  className="w-6 h-6 rounded-full border"
                  style={{ backgroundColor: c, borderColor: "var(--low-gray)" }}
                />
              ))}
            </div>
          </div>
        </div>

        <LivePreview />

        <button
          type="button"
          onClick={handleSubmit}
          className="cursor-pointer w-full py-4 bg-blue-600 text-white font-bold text-lg rounded-xl hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          <FaCheck /> Criar meu cardápio!
        </button>
        <p className="text-xs text-center opacity-50" style={{ color: "var(--gray)" }}>
          Você pode editar qualquer coisa depois, sem perder nada.
        </p>
      </div>
    </StepCard>
  );

  const SummaryRow = ({ label, value }) => (
    <div className="flex items-start gap-2">
      <span className="text-sm opacity-60 w-20 flex-shrink-0" style={{ color: "var(--gray)" }}>
        {label}
      </span>
      <span className="text-sm font-medium flex-1" style={{ color: "var(--gray)" }}>
        {value}
      </span>
    </div>
  );

  const stepComponents = [<StepName />, <StepServices />, <StepVisual />, <StepPreview />];
  const isLastStep = currentStep === STEPS.length - 1;

  return (
    <div className="flex flex-col items-center p-3 xs:p-6 min-h-screen">
      <div className="max-w-[560px] w-full mt-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="default-h1 mb-1">Monte seu cardápio digital</h1>
          <p className="text-sm" style={{ color: "var(--gray)", opacity: 0.7 }}>
            4 passos rápidos • Tudo editável depois • Leva menos de 2 minutos
          </p>
        </div>

        {/* Progress */}
        <ProgressBar currentStep={currentStep} totalSteps={STEPS.length} />

        {/* Step container */}
        <div className="rounded-2xl p-5 xs:p-7 bg-translucid shadow-[0_0_40px_var(--shadow)]">
          {stepComponents[currentStep]}

          {/* Navigation buttons */}
          <div className={`flex mt-8 gap-3 ${currentStep === 0 ? "justify-end" : "justify-between"}`}>
            {currentStep > 0 && (
              <button
                type="button"
                onClick={goPrev}
                className="cursor-pointer flex items-center gap-2 px-4 py-2 rounded-lg border transition hover:bg-[var(--translucid)]"
                style={{ borderColor: "var(--low-gray)", color: "var(--gray)" }}
              >
                <FaArrowLeft size={12} /> Voltar
              </button>
            )}

            {!isLastStep && (
              <button
                type="button"
                onClick={goNext}
                className="cursor-pointer flex items-center gap-2 px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 active:scale-95 transition-all ml-auto"
              >
                Continuar <FaArrowRight size={12} />
              </button>
            )}
          </div>

          {/* Skip hint for step 1 */}
          {currentStep === 0 && (
            <p className="text-center text-xs mt-3 opacity-50" style={{ color: "var(--gray)" }}>
              Nenhuma etapa é obrigatória — avance se preferir pular.
            </p>
          )}
        </div>

        {/* Step counter below card */}
        <p className="text-center text-xs mt-4 opacity-40" style={{ color: "var(--gray)" }}>
          Passo {currentStep + 1} de {STEPS.length}
        </p>
      </div>
    </div>
  );
}
