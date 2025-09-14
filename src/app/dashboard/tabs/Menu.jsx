"use client";

import { useAlert } from "@/providers/AlertProvider";
import useMenu from "@/hooks/useMenu";
import Image from "next/image";

const Menu = ({ setSelectedTab }) => {
  const { menu, loading } = useMenu();
  const baseUrl = window.location.origin;
  const customAlert = useAlert();

  if (loading) return <></>;
  if (!menu) return <p>Você ainda não criou seu menu.</p>;

  const copyLink = () => {
    const baseUrl = window.location.origin;
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
    <div className="px-2 lg:grid">
      <div
        className="md:m-auto lg:m-2 lg:w-[calc(70dvw-256px)] max-w-[768px] h-[800px] rounded-lg"
        style={{ backgroundColor: menu.background_color }}
      >
        {menu.banner_url ? (
          <div className="relative w-full max-w-full h-[25dvh]">
            <Image alt="Banner do estabelecimento" src={menu.banner_url} fill className="object-cover" priority />
          </div>
        ) : (
          <></>
        )}
        <div className="flex items-center py-4 px-4">
          {menu.logo_url ? (
            <div className="relative w-full max-w-[80px] aspect-[1/1]">
              <Image alt="Logo do estabelecimento" src={menu.logo_url} fill className="object-cover rounded-lg" priority />
            </div>
          ) : (
            <></>
          )}
          <h1 className={`text-md md:text-2xl font-bold ml-4`} style={{ color: menu.title_color }}>
            {menu.title}
          </h1>
        </div>
      </div>
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
            className="cursor-pointer w-full max-w-[320px] mt-2 p-2 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition"
          >
            Configurar cardápio
          </button>
        </div>
      </aside>
    </div>
  );
};

export default Menu;
