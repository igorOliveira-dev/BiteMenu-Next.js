"use client";

import { useAlert } from "@/providers/AlertProvider";
import useMenu from "@/hooks/useMenu";
import Image from "next/image";
import { FaPen, FaCamera } from "react-icons/fa";
import { FiSettings } from "react-icons/fi";
import GenericModal from "@/components/GenericModal";
import { useEffect, useState, useMemo } from "react";
import Loading from "@/components/Loading";

const Menu = ({ setSelectedTab }) => {
  const { menu, loading } = useMenu();
  const baseUrl = window.location.origin;
  const customAlert = useAlert();

  // estados de controle de arquivos
  const [bannerFile, setBannerFile] = useState(menu?.banner_url);
  const [logoFile, setLogoFile] = useState(menu?.logo_url);

  // estados para controlar os modais
  const [titleModalOpen, setTitleModalOpen] = useState(false);
  const [bannerModalOpen, setBannerModalOpen] = useState(false);
  const [logoModalOpen, setLogoModalOpen] = useState(false);

  // sincroniza arquivos quando menu muda
  useEffect(() => {
    if (menu?.logo_url) setLogoFile(menu.logo_url);
    if (menu?.banner_url) setBannerFile(menu.banner_url);
  }, [menu]);

  // gera URLs seguras para preview
  const bannerPreview = useMemo(() => {
    if (bannerFile instanceof File) return URL.createObjectURL(bannerFile);
    return bannerFile; // pode ser string (url do supabase)
  }, [bannerFile]);

  const logoPreview = useMemo(() => {
    if (logoFile instanceof File) return URL.createObjectURL(logoFile);
    return logoFile;
  }, [logoFile]);

  // limpa URLs criadas para evitar memory leaks
  useEffect(() => {
    return () => {
      if (bannerFile instanceof File) URL.revokeObjectURL(bannerPreview);
      if (logoFile instanceof File) URL.revokeObjectURL(logoPreview);
    };
  }, [bannerPreview, logoPreview, bannerFile, logoFile]);

  if (loading) return <Loading />;
  if (!menu) return <p>Você ainda não criou seu menu.</p>;

  // handlers de troca de imagem
  const handleLogoChange = (e) => {
    if (e.target.files?.length) setLogoFile(e.target.files[0]);
    e.target.value = "";
  };

  const handleBannerChange = (e) => {
    if (e.target.files?.length) setBannerFile(e.target.files[0]);
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

  const configTab = () => {
    setSelectedTab("configMenu");
  };

  return (
    <>
      <div className="px-2 lg:grid">
        <div
          className="md:m-auto lg:m-2 lg:w-[calc(70dvw-256px)] max-w-[768px] h-[800px]"
          style={{ backgroundColor: menu.background_color }}
        >
          {/* Banner */}
          <div className="relative w-full max-w-full h-[25dvh]">
            {bannerPreview ? (
              <Image alt="Preview do banner" src={bannerPreview} fill className="object-cover cursor-pointer" />
            ) : null}
            {/* Botão de trocar banner */}
            <button
              onClick={() => setBannerModalOpen(true)}
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
              ) : null}
              {/* Botão de trocar logo */}
              <button
                onClick={() => setLogoModalOpen(true)}
                className="cursor-pointer absolute inset-0 flex items-end justify-end opacity-75 hover:opacity-100 transition"
              >
                <div className="border border-2 border-gray-500 m-1 p-1.5 rounded-xl bg-translucid-50 transition">
                  <FaCamera className="text-xl text-white" />
                </div>
              </button>
            </div>

            {/* Título */}
            <h1 className="text-md md:text-2xl font-bold ml-4" style={{ color: menu.title_color }}>
              {menu.title}
            </h1>
            <button
              onClick={() => setTitleModalOpen(true)}
              className="border border-2 border-gray-500 p-2 cursor-pointer bg-translucid-50 rounded-lg ml-2 opacity-75 hover:opacity-100"
            >
              <FaPen className="font-xl text-white opacity-75" />
            </button>
          </div>
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

      {/* Modal de título */}
      {titleModalOpen && (
        <GenericModal onClose={() => setTitleModalOpen(false)}>
          <h3 className="font-bold mb-4">Alterar nome</h3>
          <input type="text" placeholder="Novo título" className="w-full p-2 rounded border bg-translucid mb-4" />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setTitleModalOpen(false)}
              className="cursor-pointer px-4 py-2 bg-gray-600 rounded hover:bg-gray-500 transition text-white"
            >
              Cancelar
            </button>
            <button
              onClick={() => {
                console.log("Salvar novo título");
                setTitleModalOpen(false);
              }}
              className="cursor-pointer px-4 py-2 bg-green-600 rounded hover:bg-green-500 transition text-white"
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
            {bannerPreview ? (
              <img src={bannerPreview} alt="Preview do banner" className="object-cover w-full h-full" />
            ) : (
              <span className="color-gray">Clique aqui para inserir seu banner (1640×664)</span>
            )}
            <input id="bannerInput" type="file" accept="image/*" className="hidden" onChange={handleBannerChange} />
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
          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={() => setBannerModalOpen(false)}
              className="cursor-pointer px-4 py-2 bg-gray-600 rounded hover:bg-gray-500 transition text-white"
            >
              Cancelar
            </button>
            <button
              onClick={() => {
                console.log("Upload novo banner");
                setBannerModalOpen(false);
              }}
              className="cursor-pointer px-4 py-2 bg-green-600 rounded hover:bg-green-500 transition text-white"
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
            {logoPreview ? (
              <img src={logoPreview} alt="Preview da logo" className="w-full h-full" />
            ) : (
              <span className="color-gray m-4">Clique aqui para inserir sua logo (1:1)</span>
            )}
            <input id="logoInput" type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
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
          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={() => setLogoModalOpen(false)}
              className="cursor-pointer px-4 py-2 bg-gray-600 rounded hover:bg-gray-500 transition text-white"
            >
              Cancelar
            </button>
            <button
              onClick={() => {
                console.log("Upload nova logo");
                setLogoModalOpen(false);
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

export default Menu;
