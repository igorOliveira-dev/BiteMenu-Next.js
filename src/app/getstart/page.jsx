"use client";

import Loading from "@/components/Loading";
import { useConfirm } from "@/providers/ConfirmProvider";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { FaLightbulb, FaShoppingCart } from "react-icons/fa";
import useUser from "@/hooks/useUser";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { COLOR_PALETTES } from "@/consts/colorPallets";
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
  { id: "delivery", label: "Entrega" },
  { id: "pickup", label: "Retirada" },
  { id: "dinein", label: "Comer no local" },
  { id: "faceToFace", label: "Atendimento presencial" },
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

/**
 * Upload para Supabase Storage (upsert) e retorna publicUrl (bucket público) ou signedUrl (bucket privado)
 */
const uploadFileToStorage = async (file, userId, slug, filename) => {
  if (!file) return null;

  const ext = getExt(file);
  const path = `${userId}/${slug}/${filename}${ext}`;

  const uploadRes = await supabase.storage.from(BUCKET).upload(path, file, { upsert: true });

  const uploadError = uploadRes?.error ?? (uploadRes && uploadRes.status >= 400 ? uploadRes : null);
  if (uploadError) {
    throw new Error(uploadError?.message ?? JSON.stringify(uploadError));
  }

  // tenta public url (bucket público)
  try {
    const publicRes = await supabase.storage.from(BUCKET).getPublicUrl(path);
    const publicUrl = publicRes?.data?.publicUrl ?? null;
    if (publicUrl) return publicUrl;
  } catch {
    // ignore
  }

  // bucket privado -> signed url 1h
  const signedRes = await supabase.storage.from(BUCKET).createSignedUrl(path, 60 * 60);
  if (signedRes?.error) {
    throw new Error(signedRes.error?.message ?? JSON.stringify(signedRes.error));
  }
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

export default function GetStart() {
  // estados gerais
  const [establishmentName, setEstablishmentName] = useState("");
  const [selectedServices, setSelectedServices] = useState(["delivery", "pickup", "dinein"]);

  const [logoFile, setLogoFile] = useState(null);
  const [bannerFile, setBannerFile] = useState(null);

  // ✅ previews estáveis (evita criar ObjectURL infinitas)
  const [logoPreview, setLogoPreview] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(null);

  const logoInputRef = useRef(null);
  const bannerInputRef = useRef(null);

  const [creatingMenu, setCreatingMenu] = useState(false);
  const { user, loading } = useUser();
  const router = useRouter();
  const confirm = useConfirm();
  const alert = useAlert();

  // paleta e cores
  const [paletteIndex, setPaletteIndex] = useState(0);
  const [backgroundColor, setBackgroundColor] = useState(DEFAULT_BACKGROUND);
  const [titleColor, setTitleColor] = useState(DEFAULT_TITLE);
  const [detailsColor, setDetailsColor] = useState(DEFAULT_DETAILS);

  // ✅ gera/revoga preview do logo
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

  // ✅ gera/revoga preview do banner
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

  // alterna checkbox de serviços
  const toggleService = (id) => {
    setSelectedServices((prev) => {
      if (prev.length === 1 && prev.includes(id)) return prev;
      return prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id];
    });
  };

  // handlers de upload
  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) setLogoFile(file);
    e.target.value = ""; // permite selecionar o mesmo arquivo depois
  };

  const handleBannerChange = (e) => {
    const file = e.target.files?.[0];
    if (file) setBannerFile(file);
    e.target.value = "";
  };

  const clearColor = (setter, defaultValue) => setter(defaultValue);

  const suggestRandomPalette = () => {
    let next = Math.floor(Math.random() * COLOR_PALETTES.length);
    while (next === paletteIndex) next = Math.floor(Math.random() * COLOR_PALETTES.length);
    setPaletteIndex(next);
    const { bg, title, details } = COLOR_PALETTES[next];
    setBackgroundColor(bg);
    setTitleColor(title);
    setDetailsColor(details);
  };

  const colorFields = useMemo(
    () => [
      { label: "Cor do fundo:", value: backgroundColor, setter: setBackgroundColor, defaultValue: DEFAULT_BACKGROUND },
      { label: "Cor do título:", value: titleColor, setter: setTitleColor, defaultValue: DEFAULT_TITLE },
      { label: "Cor dos detalhes:", value: detailsColor, setter: setDetailsColor, defaultValue: DEFAULT_DETAILS },
    ],
    [backgroundColor, titleColor, detailsColor],
  );

  const noneIcon = (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="inline-block h-5 w-5 text-red-500"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <circle cx="12" cy="12" r="9" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loading />
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    const ok = await confirm("Quer mesmo criar o cardápio com essas informações?");
    if (!ok) return;

    if (!user) {
      alert("Você precisa estar logado para criar o cardápio.", "error");
      return;
    }

    setCreatingMenu(true);

    try {
      const base = establishmentName?.trim() || "meu-estabelecimento";
      let slug = slugify(base);

      const MAX_BYTES = 8 * 1024 * 1024; // 8MB
      if (logoFile && logoFile.size > MAX_BYTES) {
        alert("Logo muito grande (máx 8MB). Reduza o arquivo e tente de novo.", "error");
        throw new Error("Logo muito grande (máx 8MB).");
      }
      if (bannerFile && bannerFile.size > 4 * MAX_BYTES) {
        alert("Banner muito grande (máx 32MB). Reduza o arquivo e tente de novo.", "error");
        throw new Error("Banner muito grande (máx 32MB).");
      }

      if (!user.id) throw new Error("user.id indefinido — usuário pode não estar autenticado corretamente.");

      let logo_url = null;
      let banner_url = null;

      if (logoFile) {
        console.time("logoConvert+Upload");
        const webpLogoRaw = await fileToWebp(logoFile, { quality: 0.9, maxSize: 512, force: true });
        const webpLogo =
          webpLogoRaw instanceof File ? webpLogoRaw : new File([webpLogoRaw], "logo.webp", { type: "image/webp" });

        const p = uploadFileToStorage(webpLogo, user.id, slug, "logo");
        logo_url = (USE_TIMEOUTS ? await withTimeout(p, 30000, "logo upload") : await p) ?? null;
        console.timeEnd("logoConvert+Upload");
      }

      if (bannerFile) {
        console.time("bannerConvert+Upload");
        const webpBannerRaw = await fileToWebp(bannerFile, { quality: 0.82, maxSize: 2000, force: true });
        const webpBanner =
          webpBannerRaw instanceof File ? webpBannerRaw : new File([webpBannerRaw], "banner.webp", { type: "image/webp" });

        const p2 = uploadFileToStorage(webpBanner, user.id, slug, "banner");
        banner_url = (USE_TIMEOUTS ? await withTimeout(p2, 45000, "banner upload") : await p2) ?? null;
        console.timeEnd("bannerConvert+Upload");
      }

      const safeTitle = establishmentName?.trim() ? establishmentName.trim() : `${slug}`;

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
      };

      const MAX_INSERT_ATTEMPTS = 5;
      let insertAttempt = 0;
      let finalData = null;
      const baseSlug = slug.replace(/-\d+$/, "");

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
            if (suffixMatch) {
              const nextNum = parseInt(suffixMatch[1], 10) + 1;
              slug = `${baseSlug}-${nextNum}`;
            } else {
              slug = `${baseSlug}-1`;
            }
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
        <p className="my-2">Estamos criando seu cardápio</p>
        <p className="text-sm color-gray">Em menos de um minuto estará pronto.</p>
      </div>
    );
  }

  return (
    <form className="flex flex-col items-center p-1 xs:p-4" onSubmit={handleSubmit}>
      <div className="max-w-[700px] w-full rounded-lg mt-6 p-2 py-4 xs:p-6 space-y-6 bg-translucid shadow-[0_0_40px_var(--shadow)]">
        <div className="max-w-[700px] text-center">
          <h1 className="default-h1 mb-2">Responda as perguntas para montar seu cardápio digital!</h1>
          <p className="color-gray">Nenhuma pergunta é obrigatória e você pode mudar tudo depois.</p>
        </div>

        {/* 1. Nome */}
        <div>
          <label className="block font-semibold">1. Como seu negócio se chama?</label>
          <input
            type="text"
            value={establishmentName}
            onChange={(e) => setEstablishmentName(e.target.value.slice(0, 30))}
            maxLength={30}
            placeholder="Nome do seu estabelecimento"
            className="w-full px-3 py-2 bg-translucid border border-[var(--low-gray)] rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <div className="flex items-center justify-between mt-2">
            <div className="text-sm color-gray">{(establishmentName || "").length}/30</div>
          </div>
        </div>

        {/* 2. Serviços */}
        <div>
          <p className="font-semibold mb-2">2. O que você oferece pro cliente? (Pode marcar mais de uma)</p>
          <div className="grid grid-cols-2 gap-1 xs:gap-4">
            {serviceOptions.map((opt) => (
              <label key={opt.id} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  value={opt.id}
                  checked={selectedServices.includes(opt.id)}
                  onChange={() => toggleService(opt.id)}
                  className="peer appearance-none w-6 h-6 border-2 rounded-md transition-all duration-150 flex items-center justify-center relative"
                  style={{
                    borderColor: "#155dfc",
                    backgroundColor: selectedServices.includes(opt.id) ? "#155dfc" : "transparent",
                  }}
                />
                <span
                  className="relative after:content-['✓'] after:absolute after:text-white after:text-sm after:font-bold after:top-[3px] after:left-[-25px] peer-checked:after:opacity-100 after:opacity-0 transition-opacity duration-150 text-sm xs:text-base"
                  style={{ color: "var(--gray)" }}
                >
                  {opt.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* 3. Logo */}
        <div className="mb-4">
          <p className="font-semibold mb-2">3. Tem uma logo ou imagem que represente seu negócio? (ideal quadrada)</p>

          <label className="text-center flex flex-col items-center justify-center w-36 h-36 border-2 border-dashed border-translucid rounded-lg cursor-pointer hover:scale-[1.01] transition-all overflow-hidden">
            {logoPreview ? (
              <img src={logoPreview} alt="Preview da logo" className="object-contain w-full h-full" />
            ) : (
              <span className="color-gray">Clique aqui para inserir sua logo (1:1)</span>
            )}
            <input
              ref={logoInputRef}
              id="logoInput"
              type="file"
              accept="image/*"
              onChange={handleLogoChange}
              className="hidden"
            />
          </label>

          {logoFile && (
            <button
              type="button"
              onClick={() => {
                setLogoFile(null);
                if (logoInputRef.current) logoInputRef.current.value = "";
              }}
              className="mt-1 text-sm text-red-500 hover:underline"
            >
              Remover logo
            </button>
          )}
        </div>

        {/* 4. Banner */}
        <div className="mb-4">
          <p className="font-semibold mb-2">4. Tem uma imagem grande pro banner? (1640×664)</p>

          <label className="text-center flex flex-col items-center justify-center w-full h-30 border-2 border-dashed border-translucid rounded-lg cursor-pointer hover:scale-[1.01] transition-all overflow-hidden">
            {bannerPreview ? (
              <img src={bannerPreview} alt="Preview do banner" className="object-cover w-full h-full" />
            ) : (
              <span className="color-gray">Clique aqui para inserir seu banner (1640×664)</span>
            )}
            <input
              ref={bannerInputRef}
              id="bannerInput"
              type="file"
              accept="image/*"
              onChange={handleBannerChange}
              className="hidden"
            />
          </label>

          {bannerFile && (
            <button
              type="button"
              onClick={() => {
                setBannerFile(null);
                if (bannerInputRef.current) bannerInputRef.current.value = "";
              }}
              className="mt-1 text-sm text-red-500 hover:underline"
            >
              Remover banner
            </button>
          )}
        </div>

        {/* 5. Seletores de cor */}
        <div>
          <p className="font-semibold mb-2">
            6. Escolha as cores do seu cardápio! (Clique em <span className="inline-block align-middle">{noneIcon}</span>{" "}
            para resetar)
          </p>

          <div className="flex flex-col space-y-4">
            {colorFields.map((item, idx) => (
              <div key={idx} className="flex items-center space-x-4">
                <label className="w-32">{item.label}</label>
                <input type="color" value={item.value} onChange={(e) => item.setter(e.target.value)} className="h-8 w-8" />
                <button
                  type="button"
                  onClick={() => clearColor(item.setter, item.defaultValue)}
                  className="flex items-center justify-center h-8 w-8 border border-low-gray rounded hover-bg-translucid transition"
                  title="Resetar para o padrão"
                >
                  {noneIcon}
                </button>
              </div>
            ))}
          </div>

          <div className="mt-4 flex justify-begin">
            <button type="button" onClick={suggestRandomPalette} className="custom-gray-button has-icon">
              <FaLightbulb /> Sugerir cores
            </button>
          </div>
        </div>

        {/* Preview ao vivo */}
        <div className="mt-6">
          <p className="font-semibold mb-2">
            Este é uma prévia rápida — ainda não é o cardápio final. Aqui você confere se cores, logos e imagens estão
            harmonizados antes de seguir adiante:
          </p>

          <div
            className="rounded-lg shadow-inner overflow-hidden transition-colors duration-500 ease-in-out"
            style={{ backgroundColor }}
          >
            {/* Banner */}
            <div
              className="w-full h-32 flex items-center justify-center transition-colors duration-500 ease-in-out"
              style={{
                backgroundColor: getContrastTextColor(backgroundColor) === "white" ? "#ffffff30" : "#00000030",
              }}
            >
              {bannerPreview ? (
                <img src={bannerPreview} alt="Banner do estabelecimento" className="object-cover w-full h-full" />
              ) : (
                <span
                  className="transition-colors duration-500 ease-in-out"
                  style={{ color: getContrastTextColor(backgroundColor) === "white" ? "#ccc" : "#555" }}
                >
                  Banner (1640x664)
                </span>
              )}
            </div>

            {/* Conteúdo interno */}
            <div className="p-4">
              {/* Logo e Nome */}
              <div className="flex items-center mb-4">
                <div
                  className="w-12 h-12 rounded-md overflow-hidden flex-shrink-0 flex items-center justify-center transition-colors duration-500 ease-in-out"
                  style={{
                    backgroundColor: getContrastTextColor(backgroundColor) === "white" ? "#ffffff30" : "#00000030",
                  }}
                >
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo do estabelecimento" className="object-contain w-full h-full" />
                  ) : (
                    <span
                      className="text-xs transition-colors duration-500 ease-in-out"
                      style={{ color: getContrastTextColor(backgroundColor) === "white" ? "#ccc" : "#555" }}
                    >
                      Logo
                    </span>
                  )}
                </div>

                <h3 className="ml-2 font-bold transition-colors duration-500 ease-in-out" style={{ color: titleColor }}>
                  {establishmentName || "Meu Estabelecimento"}
                </h3>
              </div>

              {/* Pratos de exemplo */}
              <p
                className="font-bold mb-2 transition-colors duration-500 ease-in-out"
                style={{ color: getContrastTextColor(backgroundColor) }}
              >
                Lanches:
              </p>

              {[
                {
                  name: "X-Burger Tradicional",
                  desc: "Pão, hambúrguer, queijo, alface, tomate e maionese especial.",
                  price: "20,00",
                },
                {
                  name: "Misto Quente Gourmet",
                  desc: "Pão artesanal, presunto fatiado, queijo muçarela e toque de manteiga.",
                  price: "20,00",
                },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="mb-4 flex items-center p-4 rounded-lg transition-colors duration-500 ease-in-out"
                  style={{
                    backgroundColor: getContrastTextColor(backgroundColor) === "white" ? "#ffffff20" : "#00000020",
                  }}
                >
                  <div className="w-full">
                    <h3
                      className="text-xl font-semibold transition-colors duration-500 ease-in-out"
                      style={{ color: getContrastTextColor(backgroundColor) }}
                    >
                      {item.name}
                    </h3>
                    <p
                      className="text-sm mb-2 transition-colors duration-500 ease-in-out"
                      style={{ color: getContrastTextColor(backgroundColor) }}
                    >
                      {item.desc}
                    </p>

                    <div className="flex justify-between w-full">
                      <p
                        className="text-2xl font-semibold transition-colors duration-500 ease-in-out"
                        style={{ color: getContrastTextColor(backgroundColor) }}
                      >
                        R${item.price}
                      </p>

                      <button
                        className="rounded-md h-8 w-16 flex items-center justify-center transition-colors duration-500 ease-in-out"
                        style={{ backgroundColor: detailsColor, color: getContrastTextColor(detailsColor) }}
                        type="button"
                      >
                        <FaShoppingCart size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Botão final */}
        <button
          type="submit"
          className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
        >
          Criar meu cardápio!
        </button>
      </div>
    </form>
  );
}
