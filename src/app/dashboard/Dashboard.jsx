"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import useMenu from "@/hooks/useMenu";
import Menu from "./tabs/Menu";
import Orders from "./tabs/Orders";
import Sales from "./tabs/Sales";
import Tables from "./tabs/Tables";
import { useAlert } from "@/providers/AlertProvider";
import ConfigMenu from "./tabs/ConfigMenu";
import { FaBars, FaChevronLeft, FaHeadset, FaQrcode } from "react-icons/fa";
import Account from "./tabs/Account";
import { useRouter } from "next/navigation";
import Link from "next/link";
import SalesDashboard from "./tabs/SalesDashboard";
import PlanDetails from "./tabs/PlanDetails";
import UpsellBanner from "./components/UpsellBanner";
import GenericModal from "@/components/GenericModal";
import QrCodeModal from "./tabs/components/menu/QrCodeModal";
import useModalBackHandler from "@/hooks/useModalBackHandler";
import { FaUtensils, FaShoppingBag, FaChartLine, FaUser, FaLifeRing, FaShieldAlt, FaChair } from "react-icons/fa";
import { supabase } from "@/lib/supabaseClient";
import { countVisibleOrders } from "@/lib/queries/orders";
import { useSearchParams } from "next/navigation";

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

  const searchParams = useSearchParams();

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
  const setTitleColor = usingExternal
    ? (val) => externalSetState((p) => ({ ...p, titleColor: val }))
    : setTitleColorLocal;

  const detailsColor = usingExternal ? externalState.detailsColor : detailsColorLocal;
  const setDetailsColor = usingExternal
    ? (val) => externalSetState((p) => ({ ...p, detailsColor: val }))
    : setDetailsColorLocal;

  const [slug, setSlug] = useState("");

  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);
  const previousCountRef = useRef(0);
  const [reloadOrderTrigger, setReloadOrderTrigger] = useState(0);

  const [orderQuantityChangeTrigger, setOrderQuantityChangeTrigger] = useState(0);

  const audioRef = useRef(null);
  const mainRef = useRef(null);

  // unlocker de audio para som de pedido novo
  useEffect(() => {
    audioRef.current = new Audio("/sounds/new-order.wav");

    const unlockAudio = () => {
      audioRef.current
        ?.play()
        .then(() => {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        })
        .catch(() => {});

      window.removeEventListener("click", unlockAudio);
    };

    window.addEventListener("click", unlockAudio);

    return () => {
      window.removeEventListener("click", unlockAudio);
    };
  }, []);

  useEffect(() => {
    const tab = searchParams.get("tab");

    if (tab) {
      setSelectedTab(tab);
    }
  }, [searchParams]);

  useEffect(() => {
    mainRef.current?.scrollTo({
      top: 0,
    });
  }, [selectedTab]);

  useEffect(() => {
    if (menu?.slug) setSlug(menu.slug);
  }, [menu?.slug]);

  // identificar novos pedidos
  useEffect(() => {
    if (!menu?.id) return;

    const checkOrders = async () => {
      const { count, error } = await countVisibleOrders(supabase, menu.id);

      if (error || typeof count !== "number") return;

      if (previousCountRef.current > 0 && count > previousCountRef.current) {
        customAlert("Novo pedido recebido!", "success");
        if (menu?.sound_new_order) {
          audioRef.current?.play();
        }
        setReloadOrderTrigger((prev) => prev + 1);
      }

      previousCountRef.current = count;
      setPendingOrdersCount(count);
    };

    checkOrders();

    const interval = setInterval(checkOrders, 30000);

    return () => clearInterval(interval);
  }, [menu?.id, orderQuantityChangeTrigger]);

  // Modal de compartilhamento (hamburger) fecha com botão "Voltar"
  useModalBackHandler(isOpen, () => setIsOpen(false));

  const handleMenuSelect = (tab) => {
    setSelectedTab(tab);
    setIsOpen(false);
  };

  // sidebar recolhida (desktop): lido após o mount pra não dar erro de hidratação
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem("dashboard-sidebar-collapsed") === "1");
    } catch {}
  }, []);

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    try {
      localStorage.setItem("dashboard-sidebar-collapsed", next ? "1" : "0");
    } catch {}
  };

  const navItems = [
    { tab: "menu", label: "Cardápio", Icon: FaUtensils },
    { tab: "orders", label: "Pedidos", Icon: FaShoppingBag },
    { tab: "sales", label: "Vendas", Icon: FaChartLine },
    { tab: "tables", label: "Mesas", Icon: FaChair },
  ];

  const navClass = (active) =>
    `cursor-pointer w-full px-1 xxs:px-4 py-5 lg:py-3 lg:rounded-lg hover-bg-translucid transition-colors text-sm xs:text-base flex items-center gap-3 justify-center whitespace-nowrap ${
      collapsed ? "lg:px-0" : "lg:justify-start lg:px-3"
    } ${active ? "bg-translucid font-semibold" : ""}`;

  const labelClass = collapsed ? "hidden" : "hidden lg:block";

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
        <aside
          className={`lg:m-2 lg:rounded-lg bg-translucid lg:border-2 border-translucid h-full max-w-[812px] w-[calc(100dvw)] ${collapsed ? "lg:w-16" : "lg:w-60"} lg:transition-[width] lg:duration-200 shadow-[0_0_10px_var(--shadow)] flex flex-col justify-between items-stretch overflow-hidden lg:h-[calc(100dvh-110px)]`}
        >
          {/* Top section */}
          <div className="w-full flex lg:flex-col lg:gap-1 lg:p-2">
            <button
              onClick={toggleCollapsed}
              aria-expanded={!collapsed}
              aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
              title={collapsed ? "Expandir menu" : "Recolher menu"}
              className={`hidden lg:flex cursor-pointer items-center h-10 rounded-lg hover-bg-translucid transition-colors color-gray mb-1 ${collapsed ? "justify-center" : "justify-end px-3"}`}
            >
              <FaChevronLeft className={`text-sm transition-transform duration-200 ${collapsed ? "rotate-180" : ""}`} />
            </button>

            {navItems.map(({ tab, label, Icon }) => (
              <button
                key={tab}
                onClick={() => setSelectedTab(tab)}
                title={label}
                aria-label={label}
                className={navClass(selectedTab === tab)}
              >
                <span className="relative shrink-0">
                  <Icon className="text-lg" />
                  {tab === "orders" && pendingOrdersCount > 0 && (
                    <span className="absolute -top-2 -right-3 bg-red-500 text-white rounded-full text-[10px] min-w-[18px] h-[18px] px-1 flex items-center justify-center">
                      {pendingOrdersCount}
                    </span>
                  )}
                </span>
                <span className={labelClass}>
                  {tab === "menu" && changedFields.length > 0 ? `${label} *` : label}
                </span>
              </button>
            ))}

            <button onClick={() => setIsOpen(!isOpen)} aria-label="Mais opções" className={`${navClass(false)} lg:hidden`}>
              <FaBars className="text-lg shrink-0" />
            </button>
          </div>

          {/* Bottom section */}
          <div className="w-full hidden lg:flex flex-col gap-1 p-2 border-t-2 border-[var(--translucid)]">
            <Link href="/support" title="Suporte" aria-label="Suporte" className={navClass(false)}>
              <FaHeadset className="text-lg shrink-0" />
              <span className={labelClass}>Suporte</span>
            </Link>

            <Link
              href="/politica-de-privacidade"
              title="Política de privacidade"
              aria-label="Política de privacidade"
              className={navClass(false)}
            >
              <FaShieldAlt className="text-lg shrink-0" />
              <span className={labelClass}>Política de privacidade</span>
            </Link>

            <button
              onClick={() => setSelectedTab("account")}
              title="Conta"
              aria-label="Conta"
              className={navClass(selectedTab === "account")}
            >
              <FaUser className="text-lg shrink-0" />
              <span className={labelClass}>Conta</span>
            </button>
          </div>
        </aside>
      </div>

      {/* Main content */}
      <main
        ref={mainRef}
        className="w-[100dvw] lg:w-auto lg:flex-1 lg:min-w-0 h-[calc(100dvh-143px)] lg:h-[calc(100dvh-100px)] overflow-auto scrollbar-none"
      >
        <UpsellBanner selectedTab={selectedTab} />
        <div className={selectedTab === "menu" ? "block" : "hidden"}>
          <Menu
            setSelectedTab={setSelectedTab}
            title={title}
            setTitle={setTitle}
            description={description}
            setAddress={setAddress}
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
        {selectedTab === "orders" && (
          <div className="block">
            <Orders reloadTrigger={reloadOrderTrigger} setOrderQuantityChangeTrigger={setOrderQuantityChangeTrigger} />
          </div>
        )}
        {selectedTab === "sales" && (
          <div className="block">
            <Sales setSelectedTab={setSelectedTab} />
          </div>
        )}
        {selectedTab === "tables" && (
          <div className="block">
            <Tables />
          </div>
        )}
        {selectedTab === "salesDashboard" && (
          <div className="block">
            <SalesDashboard setSelectedTab={setSelectedTab} />
          </div>
        )}
        {selectedTab === "configMenu" && (
          <div className="block">
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
        )}
        {selectedTab === "account" && (
          <div className="block">
            <Account setSelectedTab={setSelectedTab} />
          </div>
        )}
        {selectedTab === "planDetails" && (
          <div className="block">
            <PlanDetails setSelectedTab={setSelectedTab} />
          </div>
        )}
      </main>

      {/* Modal central ao clicar no hamburger */}
      {isOpen && (
        <GenericModal
          title="Compartilhe seu cardápio"
          onClose={() => setIsOpen(false)}
          wfull
          maxWidth={"420px"}
          py={"24px"}
        >
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
