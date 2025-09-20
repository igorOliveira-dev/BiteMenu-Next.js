"use client";

import { useAlert } from "@/providers/AlertProvider";
import useMenu from "@/hooks/useMenu";
import Image from "next/image";
import { FaPen, FaCamera } from "react-icons/fa";
import { FiSettings } from "react-icons/fi";
import GenericModal from "@/components/GenericModal";
import { useEffect, useState, useMemo } from "react";
import Loading from "@/components/Loading";
import { COLOR_PALETTES } from "@/consts/colorPallets";

function getContrastTextColor(hex) {
  const cleanHex = (hex || "").replace("#", "");
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? "black" : "white";
}

const Menu = ({
  setSelectedTab,
  title,
  setTitle,
  description,
  setDescription,
  backgroundColor,
  setBackgroundColor,
  titleColor,
  setTitleColor,
  detailsColor,
  setDetailsColor,
}) => {
  const { menu, loading } = useMenu();

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const customAlert = useAlert();

  // ESTADOS PRINCIPAIS
  const [bannerFile, setBannerFile] = useState(menu?.banner_url);
  const [logoFile, setLogoFile] = useState(menu?.logo_url);

  // ESTADOS TEMPORÁRIOS
  const [tempTitle, setTempTitle] = useState(menu?.title);
  const [tempDescription, setTempDescription] = useState(menu?.description);
  const [tempBannerFile, setTempBannerFile] = useState(menu?.banner_url);
  const [tempLogoFile, setTempLogoFile] = useState(menu?.logo_url);

  // ESTADOS DE MODAL
  const [titleModalOpen, setTitleModalOpen] = useState(false);
  const [bannerModalOpen, setBannerModalOpen] = useState(false);
  const [logoModalOpen, setLogoModalOpen] = useState(false);

  // estados de cores
  const [paletteIndex, setPaletteIndex] = useState(0);
  const colorFields = [
    { label: "Cor do fundo:", value: backgroundColor, setter: setBackgroundColor },
    { label: "Cor do título:", value: titleColor, setter: setTitleColor },
    { label: "Cor dos detalhes:", value: detailsColor, setter: setDetailsColor },
  ];

  // QUANDO MENU VEM DO SUPABASE
  useEffect(() => {
    if (menu) {
      setTitle(menu.title);
      setTempTitle(menu.title);
      setLogoFile(menu.logo_url);
      setTempLogoFile(menu.logo_url);
      setBannerFile(menu.banner_url);
      setTempBannerFile(menu.banner_url);
    }
  }, [menu]);

  useEffect(() => {
    setTempTitle(title);
    setTempDescription(description);
  }, [title, description]);

  // PREVIEWS (PRINCIPAL)
  const bannerPreview = useMemo(() => {
    if (bannerFile instanceof File) return URL.createObjectURL(bannerFile);
    return bannerFile;
  }, [bannerFile]);

  const logoPreview = useMemo(() => {
    if (logoFile instanceof File) return URL.createObjectURL(logoFile);
    return logoFile;
  }, [logoFile]);

  // PREVIEWS (TEMPORÁRIO PARA MODAL)
  const tempBannerPreview = useMemo(() => {
    if (tempBannerFile instanceof File) return URL.createObjectURL(tempBannerFile);
    return tempBannerFile;
  }, [tempBannerFile]);

  const tempLogoPreview = useMemo(() => {
    if (tempLogoFile instanceof File) return URL.createObjectURL(tempLogoFile);
    return tempLogoFile;
  }, [tempLogoFile]);

  // HANDLERS DE TROCA (USAM ESTADO TEMPORÁRIO)
  const handleTempLogoChange = (e) => {
    if (e.target.files?.length) setTempLogoFile(e.target.files[0]);
    e.target.value = "";
  };

  const handleTempBannerChange = (e) => {
    if (e.target.files?.length) setTempBannerFile(e.target.files[0]);
    e.target.value = "";
  };

  const copyLink = () => {
    const fullUrl = `${baseUrl}/menu/${menu.slug}`;
    navigator.clipboard
      .writeText(fullUrl)
      .then(() => customAlert("Link copiado!"))
      .catch(() => customAlert("Erro ao copiar link", "error"));
  };

  const accessMenu = () => {
    window.open(`${baseUrl}/menu/${menu.slug}`, "_blank");
  };

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

  const configTab = () => {
    setSelectedTab("configMenu");
  };

  if (loading) return <Loading />;
  if (!menu) return <p>Você ainda não criou seu menu.</p>;

  return (
    <>
      <div className="px-2 lg:grid">
        <div
          className="md:m-auto lg:m-2 lg:w-[calc(70dvw-256px)] max-w-[768px] h-[800px]"
          style={{ backgroundColor: backgroundColor }}
        >
          {/* Banner */}
          <div className="relative w-full max-w-full h-[25dvh]">
            {bannerPreview ? (
              <Image alt="Preview do banner" src={bannerPreview} fill className="object-cover cursor-pointer" />
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
                setTempBannerFile(bannerFile);
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
                <Image alt="Preview da logo" src={logoPreview} fill className="object-cover rounded-lg cursor-pointer" />
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
                  setTempLogoFile(logoFile);
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
            <h1 className="text-md md:text-2xl font-bold ml-4" style={{ color: titleColor }}>
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
        </div>

        {/* Botão mobile */}
        <button
          onClick={configTab}
          className="cursor-pointer m-2 px-4 py-2 max-w-[320px] bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition fixed top-22 right-0 lg:hidden flex items-center"
        >
          <FiSettings className="text-2xl mr-2" />
          Configurar cardápio
        </button>

        {/* Sidebar */}
        <aside className="hidden p-2 pt-4 m-2 fixed right-0 rounded-lg bg-translucid w-[calc(30dvw-36px)] shadow-[0_0_10px_var(--shadow)] lg:flex items-center flex-col overflow-hidden h-[calc(100dvh-110px)]">
          <div className="h-full py-4 flex flex-col justify-between">
            <div>
              <h3>Compartilhe seu cardápio!</h3>
              <button
                onClick={copyLink}
                className="cursor-pointer w-full max-w-[320px] mt-2 p-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
              >
                Copiar link
              </button>
              <button
                onClick={accessMenu}
                className="cursor-pointer w-full max-w-[320px] mt-2 p-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition"
              >
                Acessar cardápio
              </button>
            </div>
            <hr className="border-[var(--gray)] m-2 mb-4 max-w-full" />
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
                <button
                  type="button"
                  onClick={suggestRandomPalette}
                  className="cursor-pointer px-4 py-2 rounded-lg gray-button text-sm font-medium transition"
                >
                  💡 Sugerir cores
                </button>
              </div>
            </div>
            <hr className="border-[var(--gray)] mt-2 mb-4 max-w-full" />
            <button
              onClick={configTab}
              className="cursor-pointer w-full max-w-[320px] mt-2 p-2 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition flex items-center justify-center"
            >
              <FiSettings className="text-xl mr-2" />
              Configurar cardápio
            </button>
          </div>
        </aside>
      </div>

      {/* -------------------------------------------------------------- */}
      {/* --------------------------- MODAIS --------------------------- */}
      {/* -------------------------------------------------------------- */}

      {/* Modal de título */}
      {titleModalOpen && (
        <GenericModal onClose={() => setTitleModalOpen(false)}>
          <h3 className="font-bold mb-4">Alterar nome</h3>
          <input
            type="text"
            placeholder="Novo título"
            value={tempTitle || ""}
            onChange={(e) => setTempTitle(e.target.value)}
            className="w-full p-2 rounded border bg-translucid mb-4"
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                setTempTitle(title);
                setTitleModalOpen(false);
              }}
              className="cursor-pointer px-4 py-2 bg-gray-600 text-white rounded"
            >
              Cancelar
            </button>
            <button
              onClick={() => {
                setTitle(tempTitle);
                setTitleModalOpen(false);
              }}
              className="cursor-pointer px-4 py-2 bg-green-600 text-white rounded"
            >
              Salvar
            </button>
          </div>
        </GenericModal>
      )}

      {/* Modal de banner */}
      {bannerModalOpen && (
        <GenericModal onClose={() => setBannerModalOpen(false)}>
          <h3 className="font-bold mb-4">Alterar banner</h3>
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
            <button
              onClick={() => setBannerModalOpen(false)}
              className="cursor-pointer px-4 py-2 bg-gray-600 text-white rounded"
            >
              Cancelar
            </button>
            <button
              onClick={() => {
                setBannerFile(tempBannerFile);
                setBannerModalOpen(false);
              }}
              className="cursor-pointer px-4 py-2 bg-green-600 text-white rounded"
            >
              Salvar
            </button>
          </div>
        </GenericModal>
      )}

      {/* Modal de logo */}
      {logoModalOpen && (
        <GenericModal onClose={() => setLogoModalOpen(false)}>
          <h3 className="font-bold mb-4">Alterar logo</h3>
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
            <button
              onClick={() => setLogoModalOpen(false)}
              className="cursor-pointer px-4 py-2 bg-gray-600 text-white rounded"
            >
              Cancelar
            </button>
            <button
              onClick={() => {
                setLogoFile(tempLogoFile);
                setLogoModalOpen(false);
              }}
              className="cursor-pointer px-4 py-2 bg-green-600 text-white rounded"
            >
              Salvar
            </button>
          </div>
        </GenericModal>
      )}
    </>
  );
};

export default Menu;
