"use client";

import { useAlert } from "@/providers/AlertProvider";
import useMenu from "@/hooks/useMenu";
import { FaPen, FaCamera, FaChevronLeft, FaLightbulb } from "react-icons/fa";
import { FiSettings } from "react-icons/fi";
import GenericModal from "@/components/GenericModal";
import { useEffect, useMemo, useRef, useState } from "react";
import Loading from "@/components/Loading";
import { COLOR_PALETTES } from "@/consts/colorPallets";
import MenuItems from "./components/MenuItems";
import QrCodeModal from "./components/QrCodeModal";

function getContrastTextColor(hex) {
  const cleanHex = (hex || "").replace("#", "");
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? "black" : "white";
}

const Menu = (props) => {
  const {
    setSelectedTab,
    title: propTitle,
    setTitle: propSetTitle,
    description: propDescription,
    setDescription: propSetDescription,
    backgroundColor: propBg,
    setBackgroundColor: propSetBg,
    titleColor: propTitleColor,
    setTitleColor: propSetTitleColor,
    detailsColor: propDetailsColor,
    setDetailsColor: propSetDetailsColor,
    menuState,
    changedFields,
  } = props;

  const usingExternal = Array.isArray(menuState) && menuState.length === 2;
  const [externalState, externalSetState] = usingExternal ? menuState : [null, null];

  const title = usingExternal ? externalState.title : propTitle;
  const setTitle = usingExternal ? (v) => externalSetState((p) => ({ ...p, title: v })) : propSetTitle;

  const description = usingExternal ? externalState.description : propDescription;
  const setDescription = usingExternal ? (v) => externalSetState((p) => ({ ...p, description: v })) : propSetDescription;

  const backgroundColor = usingExternal ? externalState.backgroundColor : propBg;
  const setBackgroundColor = usingExternal ? (v) => externalSetState((p) => ({ ...p, backgroundColor: v })) : propSetBg;

  const titleColor = usingExternal ? externalState.titleColor : propTitleColor;
  const setTitleColor = usingExternal ? (v) => externalSetState((p) => ({ ...p, titleColor: v })) : propSetTitleColor;

  const detailsColor = usingExternal ? externalState.detailsColor : propDetailsColor;
  const setDetailsColor = usingExternal ? (v) => externalSetState((p) => ({ ...p, detailsColor: v })) : propSetDetailsColor;

  const { menu, loading } = useMenu();
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const customAlert = useAlert();

  // banner/logo values live in externalState.bannerFile / logoFile when usingExternal
  const bannerFile = usingExternal ? externalState.bannerFile : null;
  const logoFile = usingExternal ? externalState.logoFile : null;

  // temp files for modals (local to the component)
  const [tempBannerFile, setTempBannerFile] = useState(bannerFile ?? null);
  const [tempLogoFile, setTempLogoFile] = useState(logoFile ?? null);

  // titulo temporário
  const [tempTitle, setTempTitle] = useState(title);

  // modal booleans
  const [titleModalOpen, setTitleModalOpen] = useState(false);
  const [bannerModalOpen, setBannerModalOpen] = useState(false);
  const [logoModalOpen, setLogoModalOpen] = useState(false);

  const [showQrCode, setShowQrCode] = useState(false);

  // palette index
  const [paletteIndex, setPaletteIndex] = useState(0);
  const colorFields = [
    { label: "Cor do fundo:", value: backgroundColor, setter: setBackgroundColor },
    { label: "Cor do título:", value: titleColor, setter: setTitleColor },
    { label: "Cor dos detalhes:", value: detailsColor, setter: setDetailsColor },
  ];

  const [slug, setSlug] = useState("");

  useEffect(() => {
    if (menu?.slug) setSlug(menu.slug);
  }, [menu?.slug]);

  const anyModalOpen = titleModalOpen || bannerModalOpen || logoModalOpen;

  // o botão de voltar do navegador fecha o modal
  const closingFromPopState = useRef(false);

  useEffect(() => {
    const handlePopState = () => {
      if (anyModalOpen) {
        closingFromPopState.current = true;
        setTitleModalOpen(false);
        setBannerModalOpen(false);
        setLogoModalOpen(false);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [anyModalOpen]);

  useEffect(() => {
    if (anyModalOpen && !history.state?.modal) {
      history.pushState({ modal: true }, "");
    }
  }, [anyModalOpen]);

  const shareUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    const s = menu?.slug || slug;
    if (!s) return "";
    return `${window.location.origin}/menu/${s}`;
  }, [menu?.slug, slug]);

  // função de fechar modais
  const closeAllModals = () => {
    setTitleModalOpen(false);
    setBannerModalOpen(false);
    setLogoModalOpen(false);

    if (history.state?.modal && !closingFromPopState.current) {
      history.back();
    }

    closingFromPopState.current = false;
  };

  // synchronize temp files when external files change
  useEffect(() => {
    if (usingExternal) {
      setTempBannerFile(bannerFile ?? null);
      setTempLogoFile(logoFile ?? null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bannerFile, logoFile]);

  // previews with cleanup
  const [bannerPreview, setBannerPreview] = useState(null);
  const bannerPreviewRef = useRef(null);
  useEffect(() => {
    if (bannerPreviewRef.current) {
      URL.revokeObjectURL(bannerPreviewRef.current);
      bannerPreviewRef.current = null;
    }
    if (bannerFile instanceof File) {
      const url = URL.createObjectURL(bannerFile);
      bannerPreviewRef.current = url;
      setBannerPreview(url);
    } else {
      setBannerPreview(bannerFile ?? null);
    }
    return () => {
      if (bannerPreviewRef.current) {
        URL.revokeObjectURL(bannerPreviewRef.current);
        bannerPreviewRef.current = null;
      }
    };
  }, [bannerFile]);

  const [logoPreview, setLogoPreview] = useState(null);
  const logoPreviewRef = useRef(null);
  useEffect(() => {
    if (logoPreviewRef.current) {
      URL.revokeObjectURL(logoPreviewRef.current);
      logoPreviewRef.current = null;
    }
    if (logoFile instanceof File) {
      const url = URL.createObjectURL(logoFile);
      logoPreviewRef.current = url;
      setLogoPreview(url);
    } else {
      setLogoPreview(logoFile ?? null);
    }
    return () => {
      if (logoPreviewRef.current) {
        URL.revokeObjectURL(logoPreviewRef.current);
        logoPreviewRef.current = null;
      }
    };
  }, [logoFile]);

  // temp previews for modal (with cleanup)
  const [tempBannerPreview, setTempBannerPreview] = useState(null);
  const tempBannerRef = useRef(null);
  useEffect(() => {
    if (tempBannerRef.current) {
      URL.revokeObjectURL(tempBannerRef.current);
      tempBannerRef.current = null;
    }
    if (tempBannerFile instanceof File) {
      const url = URL.createObjectURL(tempBannerFile);
      tempBannerRef.current = url;
      setTempBannerPreview(url);
    } else {
      setTempBannerPreview(tempBannerFile ?? null);
    }
    return () => {
      if (tempBannerRef.current) {
        URL.revokeObjectURL(tempBannerRef.current);
        tempBannerRef.current = null;
      }
    };
  }, [tempBannerFile]);

  const [tempLogoPreview, setTempLogoPreview] = useState(null);
  const tempLogoRef = useRef(null);
  useEffect(() => {
    if (tempLogoRef.current) {
      URL.revokeObjectURL(tempLogoRef.current);
      tempLogoRef.current = null;
    }
    if (tempLogoFile instanceof File) {
      const url = URL.createObjectURL(tempLogoFile);
      tempLogoRef.current = url;
      setTempLogoPreview(url);
    } else {
      setTempLogoPreview(tempLogoFile ?? null);
    }
    return () => {
      if (tempLogoRef.current) {
        URL.revokeObjectURL(tempLogoRef.current);
        tempLogoRef.current = null;
      }
    };
  }, [tempLogoFile]);

  // file input handlers for modal
  const handleTempBannerChange = (e) => {
    if (e.target.files?.length) setTempBannerFile(e.target.files[0]);
    e.target.value = "";
  };
  const handleTempLogoChange = (e) => {
    if (e.target.files?.length) setTempLogoFile(e.target.files[0]);
    e.target.value = "";
  };

  // apply temp files to central state
  const applyTempBanner = () => {
    if (usingExternal) {
      externalSetState((p) => ({ ...p, bannerFile: tempBannerFile ?? null }));
    }
    closeAllModals();
  };
  const removeBanner = () => {
    if (usingExternal) externalSetState((p) => ({ ...p, bannerFile: null }));
  };

  const applyTempLogo = () => {
    if (usingExternal) {
      externalSetState((p) => ({ ...p, logoFile: tempLogoFile ?? null }));
    }
    closeAllModals();
  };
  const removeLogo = () => {
    if (usingExternal) externalSetState((p) => ({ ...p, logoFile: null }));
  };

  const copyLink = () => {
    if (!menu) return customAlert("Menu não carregado ainda", "error");
    const fullUrl = `${baseUrl}/menu/${menu.slug}`;
    navigator.clipboard
      .writeText(fullUrl)
      .then(() => customAlert("Link copiado!"))
      .catch(() => customAlert("Erro ao copiar link", "error"));
  };
  const accessMenu = () => {
    window.open(`${baseUrl}/menu/${menu?.slug}`, "_blank");
  };

  const suggestRandomPalette = () => {
    let next = Math.floor(Math.random() * COLOR_PALETTES.length);
    while (next === paletteIndex) {
      next = Math.floor(Math.random() * COLOR_PALETTES.length);
    }
    setPaletteIndex(next);
    const { bg, title, details } = COLOR_PALETTES[next];
    if (usingExternal) {
      externalSetState((p) => ({ ...p, backgroundColor: bg, titleColor: title, detailsColor: details }));
    } else {
      if (typeof setBackgroundColor === "function") setBackgroundColor(bg);
      if (typeof setTitleColor === "function") setTitleColor(title);
      if (typeof setDetailsColor === "function") setDetailsColor(details);
    }
  };

  if (loading) return <Loading />;
  if (!menu) return <p>Você ainda não criou seu menu.</p>;

  return (
    <>
      <div className="px-2 lg:grid">
        <button
          onClick={() => setSelectedTab("configMenu")}
          className={`flex lg:hidden cursor-pointer ${
            changedFields.length > 0 ? "bottom-56" : "bottom-20"
          } right-4 p-2 bg-low-gray border-2 border-translucid font-semibold rounded-lg hover:opacity-80 transition items-center justify-center fixed z-100`}
        >
          <FiSettings className="text-xl mr-2" />
          Configurar cardápio
        </button>
        <div
          className="md:m-auto lg:m-2 lg:w-[calc(70dvw-256px)] max-w-[812px] min-h-[calc(100dvh-110px)]"
          style={{ backgroundColor }}
        >
          {/* Banner */}
          <div className="relative w-full max-w-full h-[18dvh] sm:h-[25dvh]">
            {bannerPreview ? (
              <img alt="Preview do banner" src={bannerPreview} className="object-cover w-full h-full cursor-pointer" />
            ) : (
              <div
                className="bg-translucid relative w-full h-full rounded-lg flex items-center justify-center"
                style={{
                  backgroundColor: getContrastTextColor(backgroundColor) === "white" ? "#ffffff30" : "#00000030",
                  color: getContrastTextColor(backgroundColor) === "white" ? "#ccc" : "#555",
                }}
              >
                <p>Banner</p>
              </div>
            )}
            <button
              onClick={() => {
                setTempBannerFile(bannerFile ?? null);
                setBannerModalOpen(true);
              }}
              className="cursor-pointer absolute inset-0 flex items-end justify-end opacity-75 hover:opacity-100 transition"
            >
              <div className="border border-2 border-gray-500 m-2 p-1.5 rounded-xl bg-translucid-50 transition">
                <FaCamera className="text-2xl text-white" />
              </div>
            </button>
          </div>

          <div className="flex items-center py-4 px-4">
            {/* Logo */}
            <div className="relative w-full max-w-[80px] aspect-[1/1]">
              {logoPreview ? (
                <img
                  alt="Preview da logo"
                  src={logoPreview}
                  className="object-cover rounded-lg cursor-pointer w-full h-full"
                />
              ) : (
                <div
                  className="bg-translucid relative w-full max-w-[80px] aspect-[1/1] rounded-lg flex items-center justify-center"
                  style={{
                    backgroundColor: getContrastTextColor(backgroundColor) === "white" ? "#ffffff30" : "#00000030",
                    color: getContrastTextColor(backgroundColor) === "white" ? "#ccc" : "#555",
                  }}
                >
                  <p>Logo</p>
                </div>
              )}
              <button
                onClick={() => {
                  setTempLogoFile(logoFile ?? null);
                  setLogoModalOpen(true);
                }}
                className="cursor-pointer absolute inset-0 flex items-end justify-end opacity-75 hover:opacity-100 transition"
              >
                <div className="border border-2 border-gray-500 m-1 p-1.5 rounded-xl bg-translucid-50 transition">
                  <FaCamera className="text-sm text-white" />
                </div>
              </button>
            </div>

            {/* Título */}
            <h1 className="text-xl md:text-2xl font-bold ml-4" style={{ color: titleColor }}>
              {title}
            </h1>
            <button
              onClick={() => setTitleModalOpen(true)}
              className="border border-2 border-gray-500 p-2 cursor-pointer bg-translucid-50 rounded-lg ml-2 opacity-75 hover:opacity-100"
            >
              <FaPen className="font-xl text-white opacity-75" />
            </button>
          </div>

          <p className="mx-4" style={{ color: getContrastTextColor(backgroundColor) === "white" ? "#fafafa" : "#171717" }}>
            {description}
          </p>

          <MenuItems backgroundColor={backgroundColor} detailsColor={detailsColor} changedFields={changedFields} />
        </div>

        {/* Sidebar */}
        <aside className="hidden p-2 pt-4 m-2 fixed right-0 rounded-lg bg-translucid border-2 border-translucid w-[calc(30dvw-36px)] shadow-[0_0_10px_var(--shadow)] lg:flex items-center flex-col overflow-hidden h-[calc(100dvh-110px)]">
          <div className="h-full py-4 flex flex-col justify-between">
            <div>
              <h3>Compartilhe seu cardápio!</h3>
              <button
                onClick={() => shareUrl && setShowQrCode(true)}
                className="cursor-pointer w-full max-w-[320px] mt-2 p-2 bg-green-600/80 text-white font-semibold rounded-lg hover:bg-green-700/80 border-2 border-[var(--translucid)] transition"
              >
                Opções de compartilhamento
              </button>
            </div>

            <hr className="border-2 border-translucid m-2 mb-4 max-w-full" />
            <div className="mt-2 max-w-full">
              <div className="flex items-center mb-2">
                <p className="font-semibold">Cores do cardápio:</p>
              </div>

              <div className="flex flex-col space-y-3">
                {colorFields.map((item, idx) => (
                  <div key={idx} className="flex items-center space-x-3">
                    <label className="w-36">{item.label}</label>
                    <input
                      type="color"
                      value={item.value}
                      onChange={(e) => item.setter(e.target.value)}
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
            </div>

            <hr className="border-2 border-translucid mt-2 mb-4 max-w-full" />
            <button
              onClick={() => setSelectedTab("configMenu")}
              className="cursor-pointer w-full max-w-[320px] mt-2 p-2 bg-low-gray border-2 border-translucid font-semibold rounded-lg hover:opacity-80 transition flex items-center justify-center"
            >
              <FiSettings className="text-xl mr-2" />
              Configurar cardápio
            </button>
          </div>
        </aside>
      </div>

      {/* MODALS */}
      {titleModalOpen && (
        <GenericModal title="Alterar nome" onClose={closeAllModals} wfull maxWidth={"420px"}>
          <input
            type="text"
            placeholder="Novo título"
            value={tempTitle ?? ""}
            onChange={(e) => {
              const v = e.target.value.slice(0, 30);
              setTempTitle(v);
            }}
            maxLength={30}
            className="w-full p-2 rounded border bg-translucid mb-4"
          />

          <div className="flex items-center justify-between mt-2">
            <div className="text-sm color-gray">{(tempTitle || "").length}/30</div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                setTempTitle(propTitle);
                closeAllModals();
              }}
              className="cursor-pointer px-4 py-2 bg-gray-600 text-white rounded"
            >
              Cancelar
            </button>
            <button
              onClick={() => {
                setTitle(tempTitle);
                closeAllModals();
              }}
              className="cursor-pointer px-4 py-2 bg-green-600 text-white rounded"
            >
              Salvar
            </button>
          </div>
        </GenericModal>
      )}

      {bannerModalOpen && (
        <GenericModal title="Alterar banner" onClose={closeAllModals} wfull maxWidth={"420px"}>
          <label className="text-center flex flex-col items-center justify-center w-full h-30 border-2 border-dashed border-[var(--gray)] rounded-lg cursor-pointer hover:scale-[1.01] transition-all overflow-hidden">
            {tempBannerPreview ? (
              <img src={tempBannerPreview} alt="Preview temporário" className="object-cover w-full h-full" />
            ) : (
              <span className="color-gray">Clique aqui para inserir seu banner (1640x664)</span>
            )}
            <input type="file" accept="image/*" className="hidden" onChange={handleTempBannerChange} />
          </label>
          {tempBannerFile && (
            <button
              onClick={() => setTempBannerFile(null)}
              className="cursor-pointer mt-1 text-sm text-red-500 hover:underline"
            >
              Remover banner
            </button>
          )}
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={closeAllModals} className="cursor-pointer px-4 py-2 bg-gray-600 text-white rounded">
              Cancelar
            </button>
            <button onClick={applyTempBanner} className="cursor-pointer px-4 py-2 bg-green-600 text-white rounded">
              Salvar
            </button>
          </div>
        </GenericModal>
      )}

      {logoModalOpen && (
        <GenericModal title="Alterar logo" onClose={closeAllModals} wfull maxWidth={"420px"}>
          <label className="text-center flex flex-col items-center justify-center w-30 h-30 border-2 border-dashed border-[var(--gray)] rounded-lg cursor-pointer hover:scale-[1.01] transition-all overflow-hidden">
            {tempLogoPreview ? (
              <img src={tempLogoPreview} alt="Preview temporário" className="object-cover w-full h-full" />
            ) : (
              <span className="color-gray m-4">Clique aqui para inserir sua logo (1:1)</span>
            )}
            <input type="file" accept="image/*" className="hidden" onChange={handleTempLogoChange} />
          </label>
          {tempLogoFile && (
            <button onClick={() => setTempLogoFile(null)} className="mt-1 text-sm text-red-500 hover:underline">
              Remover logo
            </button>
          )}
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={closeAllModals} className="cursor-pointer px-4 py-2 bg-gray-600 text-white rounded">
              Cancelar
            </button>
            <button onClick={applyTempLogo} className="cursor-pointer px-4 py-2 bg-green-600 text-white rounded">
              Salvar
            </button>
          </div>
        </GenericModal>
      )}
      <QrCodeModal
        isOpen={showQrCode}
        onClose={() => setShowQrCode(false)}
        url={shareUrl}
        filename={`qrcode-${menu?.slug || slug || "menu"}`}
        onToast={(msg, type) => customAlert(msg, type === "error" ? "error" : undefined)}
      />
    </>
  );
};

export default Menu;
