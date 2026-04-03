"use client";

import React, { useState, useMemo, useEffect } from "react";
import useMenu from "@/hooks/useMenu";
import Menu from "./tabs/Menu";
import Orders from "./tabs/Orders";
import Sales from "./tabs/Sales";
import { useAlert } from "@/providers/AlertProvider";
import ConfigMenu from "./tabs/ConfigMenu";
import { FaChevronLeft, FaHeadset, FaQrcode } from "react-icons/fa";
import Account from "./tabs/Account";
import { useRouter } from "next/navigation";
import Link from "next/link";
import SalesDashboard from "./tabs/SalesDashboard";
import PlanDetails from "./tabs/PlanDetails";
import GenericModal from "@/components/GenericModal";
import QrCodeModal from "./tabs/components/menu/QrCodeModal";
import useModalBackHandler from "@/hooks/useModalBackHandler";
import { FaUtensils, FaShoppingBag, FaChartLine, FaUser, FaLifeRing, FaShieldAlt } from "react-icons/fa";

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
  const externalUrl = menu?.slug ? `https://external.bitemenu.com.br/menu/${menu.slug}` : "";

  // Se houver menuState externo, usaremos ele; senão, mantemos estados locais como antes.
  const usingExternal = Array.isArray(externalMenuState) && externalMenuState.length === 2;

  // Se externo: destructure o par [localState, setLocalState]
  const [externalState, externalSetState] = usingExternal ? externalMenuState : [null, null];

  // STATES LOCAIS (fallback)
  const [titleLocal, setTitleLocal] = useState("");
  const [descriptionLocal, setDescriptionLocal] = useState("");
  const [addressLocal, setAddressLocal] = useState("");

  const [backgroundColorLocal, setBackgroundColorLocal] = useState("#F8F9FA");
  const [titleColorLocal, setTitleColorLocal] = useState("#007BFF");
  const [detailsColorLocal, setDetailsColorLocal] = useState("#28A745");

  const [showQrCode, setShowQrCode] = useState(false);

  // helpers para usar state unificado (se externo, usar externalState, senao usar locais)
  const title = usingExternal ? externalState.title : titleLocal;
  const setTitle = usingExternal ? (val) => externalSetState((p) => ({ ...p, title: val })) : setTitleLocal;

  const description = usingExternal ? externalState.description : descriptionLocal;
  const setDescription = usingExternal
    ? (val) => externalSetState((p) => ({ ...p, description: val }))
    : setDescriptionLocal;

  const address = usingExternal ? externalState.address : addressLocal;
  const setAddress = usingExternal ? (val) => externalSetState((p) => ({ ...p, address: val })) : setAddressLocal;

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

  const [slug, setSlug] = useState("");

  useEffect(() => {
    if (menu?.slug) setSlug(menu.slug);
  }, [menu?.slug]);

  // Modal de compartilhamento (hamburger) fecha com botão "Voltar"
  useModalBackHandler(isOpen, () => setIsOpen(false));

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

  const shareUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    const s = menu?.slug || slug;
    if (!s) return "";
    return `${window.location.origin}/menu/${s}`;
  }, [menu?.slug, slug]);

  const accessMenu = () => {
    if (!menu) return customAlert("Menu não carregado ainda", "error");

    window.open(`${window.location.origin}/menu/${menu.slug}`, "_blank");
  };

  return (
    <div className="flex w-[100dvw] pt-[85px] items-center lg:items-start lg:h-[calc(100dvh-110px)] lg:flex-row flex-col-reverse items-center">
      <div className="flex items-center">
        <aside className="m-2 rounded-lg bg-translucid border-2 border-translucid h-full max-w-[720px] w-[calc(100dvw-86px)] lg:w-60 shadow-[0_0_10px_var(--shadow)] flex flex-col justify-between items-stretch overflow-hidden lg:h-[calc(100dvh-110px)]">
          {/* Top section */}
          <div className="w-full flex lg:flex-col">
            <button
              onClick={() => setSelectedTab("menu")}
              className={`w-full px-1 xxs:px-4 py-4 hover-bg-translucid transition-colors border-b-2 border-[var(--translucid)] text-sm xs:text-base flex items-center gap-3 justify-center lg:justify-start text-center lg:text-left ${selectedTab === "menu" ? "bg-translucid" : ""}`}
            >
              <FaUtensils className="hidden lg:block text-lg shrink-0" />
              <span>{changedFields.length > 0 ? "Cardápio *" : "Cardápio"}</span>
            </button>

            <button
              onClick={() => setSelectedTab("orders")}
              className={`w-full px-1 xxs:px-4 py-4 hover-bg-translucid transition-colors border-b-2 border-[var(--translucid)] text-sm xs:text-base flex items-center gap-3 justify-center lg:justify-start text-center lg:text-left ${selectedTab === "orders" ? "bg-translucid" : ""}`}
            >
              <FaShoppingBag className="hidden lg:block text-lg shrink-0" />
              <span>Pedidos</span>
            </button>

            <button
              onClick={() => setSelectedTab("sales")}
              className={`w-full px-1 xxs:px-4 py-4 hover-bg-translucid transition-colors border-b-2 border-[var(--translucid)] text-sm xs:text-base flex items-center gap-3 justify-center lg:justify-start text-center lg:text-left ${selectedTab === "sales" ? "bg-translucid" : ""}`}
            >
              <FaChartLine className="hidden lg:block text-lg shrink-0" />
              <span>Vendas</span>
            </button>
          </div>

          {/* Bottom section */}
          <div className="w-full hidden lg:flex flex-col">
            <Link
              href="/support"
              className="w-full px-4 py-4 hover-bg-translucid transition-colors border-t-2 border-[var(--translucid)] flex items-center gap-3 text-left"
            >
              <FaHeadset className="text-lg shrink-0" />
              <span>Suporte</span>
            </Link>

            <Link
              href="/politica-de-privacidade"
              className="w-full px-4 py-4 hover-bg-translucid transition-colors border-t-2 border-[var(--translucid)] flex items-center gap-3 text-left"
            >
              <FaShieldAlt className="text-lg shrink-0" />
              <span>Política de privacidade</span>
            </Link>

            <button
              onClick={() => setSelectedTab("account")}
              className={`cursor-pointer w-full px-4 py-4 hover-bg-translucid transition-colors border-t-2 border-[var(--translucid)] flex items-center gap-3 text-left ${selectedTab === "account" ? "bg-translucid" : ""}`}
            >
              <FaUser className="text-lg shrink-0" />
              <span>Conta</span>
            </button>
          </div>
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
            address={address}
            setAddress={setAddress}
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
        <GenericModal title="Compartilhe seu cardápio" onClose={() => setIsOpen(false)} wfull maxWidth={"420px"} py={"24px"}>
          <div className="grid gap-2 mb-6">
            <button
              onClick={() => shareUrl && setShowQrCode(true)}
              className="disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer mt-2 p-2 bg-green-600/80 text-white font-semibold rounded-lg hover:bg-green-700/80 border-2 border-[var(--translucid)] transition"
            >
              Opções de compartilhamento
            </button>
          </div>

          <ul className="flex flex-col">
            <li>
              <button
                className="w-full text-left px-2 py-2 hover:bg-[var(--translucid)] border-b-2 border-[var(--translucid)] rounded"
                onClick={() => {
                  setSelectedTab("account");
                  setIsOpen(false);
                }}
              >
                Conta
              </button>
            </li>
            <li>
              <button className="w-full flex text-left px-2 py-2 hover:bg-[var(--translucid)] border-b-2 border-[var(--translucid)] rounded">
                <Link href="/support" className="flex-1">
                  Suporte
                </Link>
              </button>
            </li>
            <li>
              <button className="w-full flex text-left px-2 py-2 hover:bg-[var(--translucid)] border-b-2 border-[var(--translucid)] rounded">
                <Link href="/politica-de-privacidade" className="flex-1">
                  Política de privacidade
                </Link>
              </button>
            </li>
          </ul>
        </GenericModal>
      )}

      <QrCodeModal
        isOpen={showQrCode}
        onClose={() => setShowQrCode(false)}
        url={shareUrl}
        externalUrl={externalUrl}
        filename={`qrcode-${menu?.slug || slug || "menu"}`}
        onToast={(msg, type) => customAlert(msg, type === "error" ? "error" : undefined)}
      />
    </div>
  );
};

export default Dashboard;
