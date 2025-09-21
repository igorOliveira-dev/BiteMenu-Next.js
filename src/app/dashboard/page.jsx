// src/app/dashboard/page.jsx (ou onde seu Dashboard está)
"use client";

import React, { useState } from "react";
import useMenu from "@/hooks/useMenu";
import Menu from "./tabs/Menu";
import Orders from "./tabs/Orders";
import Sales from "./tabs/Sales";
import { useAlert } from "@/providers/AlertProvider";
import ConfigMenu from "./tabs/ConfigMenu";

const Dashboard = ({ menuState: externalMenuState, changedFields, revertField, saveAll, selectedTab, setSelectedTab }) => {
  const { menu, loading } = useMenu();
  const [isOpen, setIsOpen] = useState(false);
  const customAlert = useAlert();

  // Se houver menuState externo, usaremos ele; senão, mantemos estados locais como antes.
  const usingExternal = Array.isArray(externalMenuState) && externalMenuState.length === 2;

  // Se externo: destructure o par [localState, setLocalState]
  const [externalState, externalSetState] = usingExternal ? externalMenuState : [null, null];

  // STATES LOCAIS (fallback)
  const [titleLocal, setTitleLocal] = useState("");
  const [descriptionLocal, setDescriptionLocal] = useState("");

  const [backgroundColorLocal, setBackgroundColorLocal] = useState("#F8F9FA");
  const [titleColorLocal, setTitleColorLocal] = useState("#007BFF");
  const [detailsColorLocal, setDetailsColorLocal] = useState("#28A745");

  // helpers para usar state unificado (se externo, usar externalState, senao usar locais)
  const title = usingExternal ? externalState.title : titleLocal;
  const setTitle = usingExternal ? (val) => externalSetState((p) => ({ ...p, title: val })) : setTitleLocal;

  const description = usingExternal ? externalState.description : descriptionLocal;
  const setDescription = usingExternal
    ? (val) => externalSetState((p) => ({ ...p, description: val }))
    : setDescriptionLocal;

  const backgroundColor = usingExternal ? externalState.backgroundColor : backgroundColorLocal;
  const setBackgroundColor = usingExternal
    ? (val) => externalSetState((p) => ({ ...p, backgroundColor: val }))
    : setBackgroundColorLocal;

  const titleColor = usingExternal ? externalState.titleColor : titleColorLocal;
  const setTitleColor = usingExternal ? (val) => externalSetState((p) => ({ ...p, titleColor: val })) : setTitleColorLocal;

  const detailsColor = usingExternal ? externalState.detailsColor : detailsColorLocal;
  const setDetailsColor = usingExternal
    ? (val) => externalSetState((p) => ({ ...p, detailsColor: val }))
    : setDetailsColorLocal;

  const handleMenuSelect = (tab) => {
    setSelectedTab(tab);
    setIsOpen(false);
  };

  const copyLink = () => {
    if (!menu) return customAlert("Menu não carregado ainda", "error");

    const fullUrl = `${window.location.origin}/menu/${menu.slug}`;

    navigator.clipboard
      .writeText(fullUrl)
      .then(() => customAlert("Link copiado!"))
      .catch(() => customAlert("Erro ao copiar link", "error"));
  };

  const accessMenu = () => {
    if (!menu) return customAlert("Menu não carregado ainda", "error");

    window.open(`${window.location.origin}/menu/${menu.slug}`, "_blank");
  };

  return (
    <div className="flex w-[100dvw] items-center lg:items-start lg:h-[calc(100dvh-110px)] lg:flex-row flex-col-reverse items-center">
      <div className="flex items-center">
        <aside className="m-2 rounded-lg bg-translucid h-full max-w-[720px] w-[calc(100dvw-86px)] lg:w-60 shadow-[0_0_10px_var(--shadow)] flex lg:flex-col items-center overflow-hidden lg:h-[calc(100dvh-110px)]">
          <button
            className="w-full p-4 hover-bg-translucid transition-colors font-semibold border-b-2 border-[var(--translucid)] text-nowrap"
            onClick={() => setSelectedTab("menu")}
          >
            {changedFields.length > 0 ? "Cardápio *" : "Cardápio"}
          </button>
          <button
            className="w-full p-4 hover-bg-translucid transition-colors font-semibold border-b-2 border-[var(--translucid)]"
            onClick={() => setSelectedTab("orders")}
          >
            Pedidos
          </button>
          <button
            className="w-full p-4 hover-bg-translucid transition-colors font-semibold border-b-2 border-[var(--translucid)]"
            onClick={() => setSelectedTab("sales")}
          >
            Vendas
          </button>
          <hr className="hidden lg:block border w-full opacity-50" />
          <button
            className="w-full hidden lg:block p-4 hover-bg-translucid transition-colors font-semibold border-b-2 border-[var(--translucid)]"
            onClick={() => customAlert("conta")}
          >
            Conta
          </button>
          <button
            className="w-full hidden lg:block p-4 hover-bg-translucid transition-colors font-semibold border-b-2 border-[var(--translucid)]"
            onClick={() => customAlert("suporte")}
          >
            Suporte
          </button>
          <button
            className="w-full hidden lg:block p-4 hover-bg-translucid transition-colors font-semibold border-b-2 border-[var(--translucid)]"
            onClick={() => customAlert("políticas de privacidade")}
          >
            Políticas de privacidade
          </button>
        </aside>

        {/* Hamburger mobile */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="lg:hidden relative w-8 h-8 m-2 flex flex-col justify-between items-center group z-50"
        >
          <span
            className={`h-[5px] w-8 bg-[var(--foreground)] rounded transition-all duration-300 ${
              isOpen ? "rotate-45 translate-y-[13px]" : ""
            }`}
          ></span>
          <span
            className={`h-[5px] w-8 bg-[var(--foreground)] rounded transition-all duration-300 ${isOpen ? "opacity-0" : ""}`}
          ></span>
          <span
            className={`h-[5px] w-8 bg-[var(--foreground)] rounded transition-all duration-300 ${
              isOpen ? "-rotate-45 -translate-y-[13px]" : ""
            }`}
          ></span>
        </button>
      </div>

      {/* Main content */}
      <main className="w-[100dvw] lg:w-[calc(100dvw-256px)] h-[calc(100dvh-160px)] lg:h-[calc(100dvh-100px)] overflow-auto scrollbar-none">
        <div className={selectedTab === "menu" ? "block" : "hidden"}>
          <Menu
            setSelectedTab={setSelectedTab}
            title={title}
            setTitle={setTitle}
            description={description}
            setDescription={setDescription}
            backgroundColor={backgroundColor}
            setBackgroundColor={setBackgroundColor}
            titleColor={titleColor}
            setTitleColor={setTitleColor}
            detailsColor={detailsColor}
            setDetailsColor={setDetailsColor}
            // caso você deseje funcionalidades extras vindas do StatesManager:
            changedFields={changedFields}
            revertField={revertField}
            saveAll={saveAll}
            menuState={usingExternal ? externalMenuState : undefined}
          />
        </div>
        <div className={selectedTab === "orders" ? "block" : "hidden"}>
          <Orders />
        </div>
        <div className={selectedTab === "sales" ? "block" : "hidden"}>
          <Sales />
        </div>
        <div className={selectedTab === "configMenu" ? "block" : "hidden"}>
          <ConfigMenu
            setSelectedTab={setSelectedTab}
            title={title}
            setTitle={setTitle}
            description={description}
            setDescription={setDescription}
            backgroundColor={backgroundColor}
            setBackgroundColor={setBackgroundColor}
            titleColor={titleColor}
            setTitleColor={setTitleColor}
            detailsColor={detailsColor}
            setDetailsColor={setDetailsColor}
            changedFields={changedFields}
            revertField={revertField}
            saveAll={saveAll}
            menuState={usingExternal ? externalMenuState : undefined}
          />
        </div>
      </main>

      {/* Modal central ao clicar no hamburger */}
      {isOpen && (
        <div
          className="fixed lg:hidden top-0 left-0 right-0 bg-black/50 backdrop-blur-sm z-40 flex justify-center items-center transition-opacity duration-300"
          style={{ height: "calc(100dvh - 72px)" }}
          onClick={() => setIsOpen(false)}
        >
          <div
            className="bg-low-gray rounded-lg w-[90vw] p-6 shadow-lg relative animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-x">Compartilhe seu cardápio!</h3>
              <button className="text-4xl" onClick={() => setIsOpen(false)}>
                x
              </button>
            </div>

            <div className="grid sm:grid-cols-2 gap-2 max-w-[calc(100%-40px)] mb-6">
              <button
                onClick={copyLink}
                className="cursor-pointer mt-2 p-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
              >
                Copiar link
              </button>
              <button
                onClick={accessMenu}
                className="cursor-pointer mt-2 p-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition"
              >
                Acessar cardápio
              </button>
            </div>

            <ul className="flex flex-col">
              <li>
                <button
                  className="w-full text-left px-2 py-2 hover:bg-white/10 rounded"
                  onClick={() => customAlert("conta")}
                >
                  Conta
                </button>
              </li>
              <li>
                <button
                  className="w-full text-left px-2 py-2 hover:bg-white/10 rounded"
                  onClick={() => customAlert("suporte")}
                >
                  Suporte
                </button>
              </li>
              <li>
                <button
                  className="w-full text-left px-2 py-2 hover:bg-white/10 rounded"
                  onClick={() => customAlert("Políticas de privacidade")}
                >
                  Políticas de privacidade
                </button>
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
