"use client";

import Loading from "@/components/Loading";
import { useConfirm } from "@/providers/ConfirmProvider";
import React, { useState } from "react";
import { FaShoppingCart } from "react-icons/fa";
import useUser from "@/hooks/useUser";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { COLOR_PALETTES } from "@/consts/colorPallets";

// ---- CONFIG ----
const BUCKET = "menus";
const USE_TIMEOUTS = true; // ativado por segurança/debug;
// -----------------

// ---- helpers ----
const slugify = (text = "") =>
  text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-");

const getExt = (file) => {
  if (!file || !file.name) return "";
  const parts = file.name.split(".");
  return parts.length > 1 ? `.${parts.pop()}` : "";
};

// util: timeout wrapper
const withTimeout = (promise, ms, name = "operation") =>
  Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(`${name} timed out after ${ms}ms`)), ms)),
  ]);

/**
 * Faz upload do file para o storage do Supabase.
 * Tenta obter publicUrl; se não existir (bucket privado), tenta createSignedUrl (1h).
 * Lança erro com mensagem legível em caso de falha.
 */
const uploadFileToStorage = async (file, userId, slug, filename) => {
  if (!file) return null;

  const ext = getExt(file);
  const path = `${userId}/${slug}/${filename}${ext}`;

  try {
    console.log("[upload] iniciando upload", {
      path,
      bucket: BUCKET,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      ts: new Date().toISOString(),
    });

    const uploadRes = await supabase.storage.from(BUCKET).upload(path, file, { upsert: true });

    // alguns SDKs retornam { data, error }, outros retornam Response-like — normalize:
    const uploadError = uploadRes?.error ?? (uploadRes && uploadRes.status >= 400 ? uploadRes : null);
    if (uploadError) {
      console.error("[upload] upload error object:", uploadError);
      throw new Error(uploadError?.message ?? JSON.stringify(uploadError));
    }

    console.log("[upload] upload concluído (raw response):", uploadRes);

    // tenta public url (apenas funciona se bucket for público)
    try {
      const publicRes = await supabase.storage.from(BUCKET).getPublicUrl(path);
      if (publicRes?.error) {
        console.warn("[upload] getPublicUrl retornou erro:", publicRes.error);
      }
      const publicUrl = publicRes?.data?.publicUrl ?? null;
      if (publicUrl) {
        console.log("[upload] publicUrl obtida:", publicUrl);
        return publicUrl;
      }
    } catch (publicErr) {
      console.warn("[upload] exceção em getPublicUrl:", publicErr);
    }

    // se não há publicUrl, tenta criar signed url (válida por 1 hora)
    try {
      console.log("[upload] publicUrl não disponível. Tentando createSignedUrl (1 hora)...");
      const signedRes = await supabase.storage.from(BUCKET).createSignedUrl(path, 60 * 60);
      if (signedRes?.error) {
        console.warn("[upload] createSignedUrl retornou erro:", signedRes.error);
        throw new Error(signedRes.error?.message ?? JSON.stringify(signedRes.error));
      }
      const signedUrl = signedRes?.data?.signedUrl ?? null;
      if (signedUrl) {
        console.log("[upload] signedUrl obtida:", signedUrl);
        return signedUrl;
      }
    } catch (signedErr) {
      console.warn("[upload] exceção em createSignedUrl:", signedErr);
      // propagate so caller knows
      throw signedErr;
    }

    console.warn("[upload] upload ok, mas não obtivemos nem publicUrl nem signedUrl:", {
      uploadRes,
    });
    return null;
  } catch (err) {
    console.error("[upload] exceção em uploadFileToStorage:", err);
    throw err;
  }
};
// ---- fim helpers ----

const DEFAULT_BACKGROUND = COLOR_PALETTES[0].bg;
const DEFAULT_TITLE = COLOR_PALETTES[0].title;
const DEFAULT_DETAILS = COLOR_PALETTES[0].details;

const serviceOptions = [
  { id: "delivery", label: "Entrega" },
  { id: "pickup", label: "Retirada" },
  { id: "dinein", label: "Comer no local" },
  { id: "takeaway", label: "Para viagem" },
  { id: "driveThru", label: "Drive-thru" },
];

export default function GetStart() {
  // estados gerais
  const [establishmentName, setEstablishmentName] = useState("");
  const [selectedServices, setSelectedServices] = useState(["delivery", "pickup", "dinein"]);
  const [logoFile, setLogoFile] = useState(null);
  const [bannerFile, setBannerFile] = useState(null);
  const [creatingMenu, setCreatingMenu] = useState(false);
  const { user, loading } = useUser();
  const router = useRouter();
  const confirm = useConfirm();

  // índice da paleta atual
  const [paletteIndex, setPaletteIndex] = useState(0);

  // estados de cor já iniciados com valores da paleta
  const [backgroundColor, setBackgroundColor] = useState(DEFAULT_BACKGROUND);
  const [titleColor, setTitleColor] = useState(DEFAULT_TITLE);
  const [detailsColor, setDetailsColor] = useState(DEFAULT_DETAILS);

  // alterna checkbox de serviços
  const toggleService = (id) => {
    setSelectedServices((prev) => {
      if (prev.length === 1 && prev.includes(id)) {
        return prev;
      }
      return prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id];
    });
  };

  // handlers de upload
  const handleLogoChange = (e) => {
    if (e.target.files?.length) setLogoFile(e.target.files[0]);
    e.target.value = ""; // reset do input para permitir selecionar o mesmo arquivo depois
  };
  const handleBannerChange = (e) => {
    if (e.target.files?.length) setBannerFile(e.target.files[0]);
    e.target.value = "";
  };

  // reset pro default da paleta atual
  const clearColor = (setter, defaultValue) => setter(defaultValue);

  // sugere uma paleta aleatória diferente da atual
  const suggestRandomPalette = () => {
    let next = Math.floor(Math.random() * COLOR_PALETTES.length);
    while (next === paletteIndex) {
      next = Math.floor(Math.random() * COLOR_PALETTES.length);
    }
    setPaletteIndex(next);
    const { bg, title, details } = COLOR_PALETTES[next];
    setBackgroundColor(bg);
    setTitleColor(title);
    setDetailsColor(details);
  };

  const colorFields = [
    {
      label: "Cor do fundo:",
      value: backgroundColor,
      setter: setBackgroundColor,
      defaultValue: DEFAULT_BACKGROUND,
    },
    {
      label: "Cor do título:",
      value: titleColor,
      setter: setTitleColor,
      defaultValue: DEFAULT_TITLE,
    },
    {
      label: "Cor dos detalhes:",
      value: detailsColor,
      setter: setDetailsColor,
      defaultValue: DEFAULT_DETAILS,
    },
  ];

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

  function getContrastTextColor(hex) {
    const cleanHex = (hex || DEFAULT_BACKGROUND).replace("#", "");
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;
    return yiq >= 128 ? "black" : "white";
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loading />
      </div>
    );
  }

  // handleSubmit
  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("[submit] iniciado");

    const ok = await confirm("Quer mesmo criar o cardápio com essas informações?");
    if (!ok) {
      console.log("[submit] usuário cancelou");
      return;
    }

    if (!user) {
      alert("Você precisa estar logado para criar o cardápio.");
      return;
    }

    setCreatingMenu(true);

    try {
      const base = establishmentName?.trim() || "meu-estabelecimento";
      let slug = slugify(base);

      console.log("[submit] slug inicial:", slug);

      const MAX_BYTES = 3 * 1024 * 1024; // 3MB
      if (logoFile && logoFile.size > MAX_BYTES) {
        throw new Error("Logo muito grande (máx 3MB). Reduza o arquivo e tente de novo.");
      }
      if (bannerFile && bannerFile.size > 4 * MAX_BYTES) {
        throw new Error("Banner muito grande (máx 12MB). Reduza o arquivo e tente de novo.");
      }

      // checagens antes do upload
      console.log("[submit] checagens antes de upload:", {
        userId: user.id,
        hasLogo: !!logoFile,
        hasBanner: !!bannerFile,
        ts: new Date().toISOString(),
      });
      if (!user.id) {
        throw new Error("user.id indefinido — usuário pode não estar autenticado corretamente.");
      }

      // Faz uploads SEQUENCIAIS (isolamos problemas)
      console.log("[submit] iniciando uploads sequenciais (isolando)", new Date().toISOString());
      let logo_url = null;
      let banner_url = null;

      if (logoFile) {
        try {
          console.time("logoUpload");
          const p = uploadFileToStorage(logoFile, user.id, slug, "logo");
          const result = USE_TIMEOUTS ? await withTimeout(p, 30000, "logo upload") : await p;
          console.timeEnd("logoUpload");
          logo_url = result ?? null;
          console.log("[submit] logo upload result:", logo_url);
        } catch (errLogo) {
          console.error("[submit] logo upload failed:", errLogo);
          throw new Error("Falha no upload do logo: " + (errLogo?.message ?? JSON.stringify(errLogo)));
        }
      }

      if (bannerFile) {
        try {
          console.time("bannerUpload");
          const p2 = uploadFileToStorage(bannerFile, user.id, slug, "banner");
          const result2 = USE_TIMEOUTS ? await withTimeout(p2, 45000, "banner upload") : await p2;
          console.timeEnd("bannerUpload");
          banner_url = result2 ?? null;
          console.log("[submit] banner upload result:", banner_url);
        } catch (errBanner) {
          console.error("[submit] banner upload failed:", errBanner);
          throw new Error("Falha no upload do banner: " + (errBanner?.message ?? JSON.stringify(errBanner)));
        }
      }

      console.log("[submit] uploads finalizados:", { logo_url, banner_url });

      // prepara insert (garante title não-nulo)
      const safeTitle = establishmentName?.trim() ? establishmentName.trim() : `${slug}`;
      let insertObj = {
        owner_id: user.id,
        slug,
        title: safeTitle,
        description: null,
        logo_url: logo_url ?? null,
        banner_url: banner_url ?? null,
        services: selectedServices && selectedServices.length ? selectedServices : null,
        background_color: backgroundColor || null,
        title_color: titleColor || null,
        details_color: detailsColor || null,
      };

      console.log("[submit] pronto para inserir (iniciando loop de tentativas):", insertObj);

      // Loop de insert com retries para tratar unique constraint (23505)
      const MAX_INSERT_ATTEMPTS = 5;
      let insertAttempt = 0;
      let finalData = null;

      // baseSlug sem sufixo numérico (usado para incrementar)
      const baseSlug = slug.replace(/-\d+$/, "");

      while (insertAttempt < MAX_INSERT_ATTEMPTS) {
        insertAttempt++;
        try {
          console.log(`[submit] insert attempt ${insertAttempt} slug=${slug}`);

          // garante que o objeto tem o slug atual
          insertObj.slug = slug;

          const insertPromise = supabase.from("menus").insert([insertObj]).select().single();
          const result = USE_TIMEOUTS ? await withTimeout(insertPromise, 15000, "db insert") : await insertPromise;
          const { data: inserted, error: insertError } = result || {};

          if (insertError) {
            console.error("[submit] supabase insert error object:", insertError);

            // trata duplicate key (unique violation)
            const isDuplicate =
              insertError.code === "23505" ||
              (insertError?.message && insertError.message.toLowerCase().includes("duplicate"));

            if (isDuplicate) {
              console.warn("[submit] duplicate slug detected on insert attempt", insertAttempt, "slug:", slug);

              // se já tem sufixo numérico, incrementa; senão começa com -1
              const suffixMatch = slug.match(/-(\d+)$/);
              if (suffixMatch) {
                const nextNum = parseInt(suffixMatch[1], 10) + 1;
                slug = `${baseSlug}-${nextNum}`;
              } else {
                slug = `${baseSlug}-1`;
              }
              insertObj.slug = slug;
              console.log("[submit] retrying with new slug:", slug);
              continue; // tenta novamente
            }

            // outro erro de insert -> lança para o catch externo
            throw insertError;
          }

          // sucesso!
          finalData = inserted ?? result?.data ?? null;
          console.log("[submit] insert ok:", finalData);
          break;
        } catch (err) {
          console.error(`[submit] insert attempt ${insertAttempt} failed:`, err);

          // se última tentativa, rethrow
          if (insertAttempt >= MAX_INSERT_ATTEMPTS) {
            throw err;
          }

          // fallback: gera slug aleatório curto e tenta de novo
          const randomSuffix = Math.random().toString(36).substring(2, 6);
          slug = `${baseSlug}-${randomSuffix}`;
          insertObj.slug = slug;
          console.log(`[submit] fallback new slug for next attempt: ${slug}`);
          // loop continua
        }
      }

      if (!finalData) {
        throw new Error("Não foi possível criar o cardápio depois de várias tentativas.");
      }

      console.log("Cardápio criado com sucesso!", finalData);
      router.push("/dashboard");
    } catch (err) {
      console.error("Erro ao criar cardápio:", err);
      const supaMsg = err?.message ?? err?.error ?? JSON.stringify(err);
      const details = err?.details ?? err?.hint ?? "";
      alert("Erro ao criar cardápio: " + supaMsg + (details ? " — " + details : ""));
    } finally {
      setCreatingMenu(false);
      console.log("[submit] finalizado (creatingMenu=false)", new Date().toISOString());
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
    <form className="flex flex-col items-center p-4" onSubmit={handleSubmit}>
      {/* Container do form */}
      <div className="max-w-[700px] w-full rounded-lg mt-6 p-6 space-y-6 bg-translucid shadow-[0_0_40px_var(--shadow)]">
        {/* Cabeçalho */}
        <div className="max-w-[700px] text-center">
          <h1 className="text-3xl font-bold mb-2">Bora montar seu cardápio digital?</h1>
          <h3>Responda rapidinho aqui embaixo pra gente deixar tudo do seu jeito.</h3>
          <p className="color-gray">Fica tranquilo: nenhuma pergunta é obrigatória e você pode mudar tudo depois.</p>
        </div>
        {/* 1. Nome */}
        <div>
          <label className="block font-semibold">1. Como seu negócio se chama?</label>
          <input
            type="text"
            value={establishmentName}
            onChange={(e) => {
              const v = e.target.value.slice(0, 20);
              setEstablishmentName(v);
            }}
            maxLength={20}
            placeholder="Nome do seu estabelecimento"
            className="w-full px-3 py-2 bg-translucid border border-[var(--low-gray)] rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <div className="flex items-center justify-between mt-2">
            <div className="text-sm color-gray">{(establishmentName || "").length}/20</div>
          </div>
        </div>

        {/* 2. Serviços */}
        <div>
          <p className="font-semibold mb-2">2. O que você oferece pro cliente? (Pode marcar mais de uma)</p>
          <div className="grid grid-cols-2 gap-4">
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
                  className="relative after:content-['✓'] after:absolute after:text-white after:text-sm after:font-bold after:top-[3px] after:left-[-25px] peer-checked:after:opacity-100 after:opacity-0 transition-opacity duration-150"
                  style={{
                    color: "var(--gray)",
                  }}
                >
                  {opt.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* 3. Logo do estabelecimento */}
        <div className="mb-4">
          <p className="font-semibold mb-2">3. Tem uma logo ou imagem que represente seu negócio? (ideal quadrada)</p>
          <label className="text-center flex flex-col items-center justify-center w-36 h-36 border-2 border-dashed border-[var(--gray)] rounded-lg cursor-pointer hover:scale-[1.01] transition-all overflow-hidden">
            {logoFile ? (
              <img src={URL.createObjectURL(logoFile)} alt="Preview da logo" className="object-contain w-full h-full" />
            ) : (
              <span className="color-gray">Clique aqui para inserir sua logo (1:1)</span>
            )}
            <input id="logoInput" type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
          </label>
          {logoFile && (
            <button
              type="button"
              onClick={() => {
                setLogoFile(null);
                document.querySelector("#logoInput").value = "";
              }}
              className="mt-1 text-sm text-red-500 hover:underline"
            >
              Remover logo
            </button>
          )}
        </div>

        {/* 4. Banner do estabelecimento */}
        <div className="mb-4">
          <p className="font-semibold mb-2">4. Tem uma imagem grande pro banner? (1640×664)</p>
          <label className="text-center flex flex-col items-center justify-center w-full h-30 border-2 border-dashed border-[var(--gray)] rounded-lg cursor-pointer hover:scale-[1.01] transition-all overflow-hidden">
            {bannerFile ? (
              <img src={URL.createObjectURL(bannerFile)} alt="Preview do banner" className="object-cover w-full h-full" />
            ) : (
              <span className="color-gray">Clique aqui para inserir seu banner (1640×664)</span>
            )}
            <input id="bannerInput" type="file" accept="image/*" onChange={handleBannerChange} className="hidden" />
          </label>
          {bannerFile && (
            <button
              type="button"
              onClick={() => {
                setBannerFile(null);
                document.querySelector("#bannerInput").value = "";
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
                <input type="color" value={item.value} onChange={(e) => item.setter(e.target.value)} className="h-8 w-8 " />
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

          {/* Botão de sugerir paleta aleatória */}
          <div className="mt-4 flex justify-begin">
            <button
              type="button"
              onClick={suggestRandomPalette}
              className="px-6 py-4 rounded-lg gray-button text-sm font-medium transition"
            >
              💡 Sugerir cores
            </button>
          </div>
        </div>

        {/* Preview ao vivo */}
        <div className="mt-6">
          <p className="font-semibold mb-2">
            Este é uma prévia rápida — ainda não è o cardápio final. Aqui você confere se cores, logos e imagens estão
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
              {bannerFile ? (
                <img
                  src={URL.createObjectURL(bannerFile)}
                  alt="Banner do estabelecimento"
                  className="object-cover w-full h-full"
                />
              ) : (
                <span
                  className="transition-colors duration-500 ease-in-out"
                  style={{
                    color: getContrastTextColor(backgroundColor) === "white" ? "#ccc" : "#555",
                  }}
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
                  {logoFile ? (
                    <img
                      src={URL.createObjectURL(logoFile)}
                      alt="Logo do estabelecimento"
                      className="object-contain w-full h-full"
                    />
                  ) : (
                    <span
                      className="text-xs transition-colors duration-500 ease-in-out"
                      style={{
                        color: getContrastTextColor(backgroundColor) === "white" ? "#ccc" : "#555",
                      }}
                    >
                      Logo
                    </span>
                  )}
                </div>
                <h2
                  className="ml-3 text-2xl font-bold transition-colors duration-500 ease-in-out"
                  style={{ color: titleColor }}
                >
                  {establishmentName || "Meu Estabelecimento"}
                </h2>
              </div>

              {/* Pratos de exemplo */}
              <h3
                className="font-bold mb-2 transition-colors duration-500 ease-in-out"
                style={{ color: getContrastTextColor(backgroundColor) }}
              >
                Lanches:
              </h3>

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

                      {/* Botão Adicionar ao carrinho */}
                      <button
                        className="rounded-md h-8 w-16 flex items-center justify-center transition-colors duration-500 ease-in-out"
                        style={{
                          backgroundColor: detailsColor,
                          color: getContrastTextColor(detailsColor),
                        }}
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
