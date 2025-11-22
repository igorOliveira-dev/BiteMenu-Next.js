"use client";

import React, { useState } from "react";
import useMenu from "@/hooks/useMenu";
import Menu from "./tabs/Menu";
import Orders from "./tabs/Orders";
import Sales from "./tabs/Sales";
import { useAlert } from "@/providers/AlertProvider";
import ConfigMenu from "./tabs/ConfigMenu";
import { FaChevronLeft } from "react-icons/fa";
import Account from "./tabs/Account";
import { useRouter } from "next/navigation";
import Link from "next/link";
import SalesDashboard from "./tabs/SalesDashboard";
import PlanDetails from "./tabs/PlanDetails";

const Dashboard = ({
  menuState: externalMenuState,
  changedFields,
  revertField,
  saveAll,
  selectedTab,
  setSelectedTab,
  showChanges,
}) => {
  const router = useRouter();
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
    <div className="flex w-[100dvw] pt-[85px] items-center lg:items-start lg:h-[calc(100dvh-110px)] lg:flex-row flex-col-reverse items-center">
      <div className="flex items-center">
        <aside className="m-2 rounded-lg bg-translucid border-2 border-translucid h-full max-w-[720px] w-[calc(100dvw-86px)] lg:w-60 shadow-[0_0_10px_var(--shadow)] flex lg:flex-col items-center overflow-hidden lg:h-[calc(100dvh-110px)]">
          <button
            className={`cursor-pointer w-full px-2 p-4 sm:px-4 hover-bg-translucid ${
              selectedTab === "menu" ? "bg-translucid" : ""
            } transition-colors font-semibold border-b-2 border-[var(--translucid)] text-nowrap`}
            onClick={() => setSelectedTab("menu")}
          >
            {changedFields.length > 0 ? "Cardápio *" : "Cardápio"}
          </button>
          <button
            className={`cursor-pointer w-full px-2 p-4 sm:px-4 hover-bg-translucid ${
              selectedTab === "orders" ? "bg-translucid" : ""
            } transition-colors font-semibold border-b-2 border-[var(--translucid)]`}
            onClick={() => setSelectedTab("orders")}
          >
            Pedidos
          </button>
          <button
            className={`cursor-pointer w-full px-2 p-4 sm:px-4 hover-bg-translucid ${
              selectedTab === "sales" ? "bg-translucid" : ""
            } transition-colors font-semibold border-b-2 border-[var(--translucid)]`}
            onClick={() => setSelectedTab("sales")}
          >
            Vendas
          </button>
          <button
            className={`cursor-pointer w-full hidden lg:block p-4 hover-bg-translucid ${
              selectedTab === "account" ? "bg-translucid" : ""
            } transition-colors font-semibold border-b-2 border-[var(--translucid)]`}
            onClick={() => setSelectedTab("account")}
          >
            Conta
          </button>
          <Link
            className="w-full hidden lg:block p-4 hover-bg-translucid transition-colors font-semibold border-b-2 border-[var(--translucid)] text-center"
            href="/support"
          >
            Suporte
          </Link>
          <Link
            className="w-full hidden lg:block p-4 hover-bg-translucid transition-colors font-semibold border-b-2 border-[var(--translucid)] text-center"
            href="/politica-de-privacidade"
          >
            Política de privacidade
          </Link>
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
            changedFields={changedFields}
            revertField={revertField}
            saveAll={saveAll}
            menuState={usingExternal ? externalMenuState : undefined}
            showChanges={showChanges}
          />
        </div>
        <div className={selectedTab === "orders" ? "block" : "hidden"}>
          <Orders />
        </div>
        <div className={selectedTab === "sales" ? "block" : "hidden"}>
          <Sales setSelectedTab={setSelectedTab} />
        </div>
        <div className={selectedTab === "salesDashboard" ? "block" : "hidden"}>
          <SalesDashboard setSelectedTab={setSelectedTab} />
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
        <div className={selectedTab === "account" ? "block" : "hidden"}>
          <Account setSelectedTab={setSelectedTab} />
        </div>
        <div className={selectedTab === "planDetails" ? "block" : "hidden"}>
          <PlanDetails setSelectedTab={setSelectedTab} />
        </div>
      </main>

      {/* Modal central ao clicar no hamburger */}
      {isOpen && (
        <div
          className="fixed lg:hidden top-0 left-0 right-0 bg-black/50 backdrop-blur-sm z-150 flex justify-center items-center transition-opacity duration-300"
          style={{ height: "calc(100dvh - 72px)" }}
          onClick={() => setIsOpen(false)}
        >
          <div
            className="bg-low-gray rounded-lg w-[90vw] p-6 shadow-lg relative animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 mb-4">
                <FaChevronLeft className="cursor-pointer" onClick={() => setIsOpen(false)} />
                <h3 className="font-bold">Compartilhe seu cardápio!</h3>
              </div>
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
                  onClick={() => {
                    setSelectedTab("account");
                    setIsOpen(false);
                  }}
                >
                  Conta
                </button>
              </li>
              <li>
                <button className="w-full flex text-left px-2 py-2 hover:bg-white/10 rounded">
                  <Link href="support" className="flex-1">
                    Suporte
                  </Link>
                </button>
              </li>
              <li>
                <button className="w-full flex text-left px-2 py-2 hover:bg-white/10 rounded">
                  <Link href="politica-de-privacidade" className="flex-1">
                    Política de privacidade
                  </Link>
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
