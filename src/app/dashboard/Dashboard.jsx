"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import useMenu from "@/hooks/useMenu";
import Menu from "./tabs/Menu";
import Orders from "./tabs/Orders";
import Sales from "./tabs/Sales";
import Tables from "./tabs/Tables";
import Stock from "./tabs/Stock";
import WhatsappMessage from "./tabs/WhatsappMessage";
import { useAlert } from "@/providers/AlertProvider";
import ConfigMenu from "./tabs/ConfigMenu";
import { FaBars, FaBook, FaChevronLeft, FaHeadset, FaQrcode, FaTimes } from "react-icons/fa";
import Account from "./tabs/Account";
import { useRouter } from "next/navigation";
import Link from "next/link";
import SalesDashboard from "./tabs/SalesDashboard";
import PlanDetails from "./tabs/PlanDetails";
import Team from "./tabs/Team";
import Landing from "./tabs/Landing";
import { LANDING_ROLES } from "@/lib/landing";
import Attendant from "./tabs/Attendant";
import { ATTENDANT_ROLES } from "@/lib/attendant";
import CustomLayout from "./tabs/CustomLayout";
import { CUSTOM_LAYOUT_ROLES } from "@/lib/customLayout";
import Linktree from "./tabs/Linktree";
import { LINKTREE_ROLES } from "@/lib/linktree";
import Kitchen from "@/app/equipe/Kitchen";
import Delivery from "@/app/equipe/Delivery";
import UpsellBanner from "./components/UpsellBanner";
import AddressUpdateModal from "./components/AddressUpdateModal";
import PixOnlineModal from "./components/PixOnlineModal";
import QrCodeModal from "./tabs/components/menu/QrCodeModal";
import useModalBackHandler from "@/hooks/useModalBackHandler";
import { FaChartLine, FaLifeRing, FaShieldAlt, FaChair, FaGlobe, FaMagic, FaPalette, FaLink } from "react-icons/fa";
import { supabase } from "@/lib/supabaseClient";
import { countVisibleOrders, listRecentVisibleOrders } from "@/lib/queries/orders";
import useUser from "@/hooks/useUser";
import PrintDocumentButton, {
  AUTO_PRINT_KEY,
  PRINT_PLAN_ROLES,
  normalizeOrderForPrint,
} from "./tabs/components/print/PrintDocumentButton";
import { useSearchParams } from "next/navigation";
import { IconPessoa, IconPrato, IconSino } from "@/components/BrandIcons";

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
  const { profile } = useUser();
  // impressão automática: ids já vistos (null até a 1ª checagem) e fila de impressão
  const printedIdsRef = useRef(null);
  const [printQueue, setPrintQueue] = useState([]);
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

    // na 1ª checagem só marca o histórico como visto; depois enfileira os novos
    const autoPrintNew = async () => {
      const first = printedIdsRef.current === null;
      let on = false;
      try {
        on = localStorage.getItem(AUTO_PRINT_KEY) === "1";
      } catch {}
      on = on && PRINT_PLAN_ROLES.includes(profile?.role);
      if (!first && !on) return;

      const { data } = await listRecentVisibleOrders(supabase, menu.id);
      if (!data) return;
      if (first) printedIdsRef.current = new Set();
      const fresh = data.filter((o) => !printedIdsRef.current.has(o.id));
      fresh.forEach((o) => printedIdsRef.current.add(o.id));
      if (!first && fresh.length) setPrintQueue((q) => [...q, ...fresh.reverse()]);
    };

    const checkOrders = async () => {
      const { count, error } = await countVisibleOrders(supabase, menu.id);

      if (error || typeof count !== "number") return;

      if (printedIdsRef.current === null || count > previousCountRef.current) autoPrintNew();

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
  }, [menu?.id, orderQuantityChangeTrigger, profile?.role]);

  // Modal de compartilhamento (hamburger) fecha com botão "Voltar"
  useModalBackHandler(isOpen, () => setIsOpen(false));

  // arrastar o menu lateral pra direita fecha
  const dragStartX = useRef(null);
  const [dragX, setDragX] = useState(0);
  const onDrawerTouchStart = (e) => (dragStartX.current = e.touches[0].clientX);
  const onDrawerTouchMove = (e) => {
    if (dragStartX.current === null) return;
    setDragX(Math.max(0, e.touches[0].clientX - dragStartX.current));
  };
  const onDrawerTouchEnd = () => {
    if (dragX > 80) setIsOpen(false);
    dragStartX.current = null;
    setDragX(0);
  };

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
    { tab: "menu", label: "Cardápio", Icon: IconPrato },
    { tab: "orders", label: "Pedidos", Icon: IconSino },
    { tab: "sales", label: "Vendas", Icon: FaChartLine },
    { tab: "tables", label: "Mesas", Icon: FaChair },
    ...(LANDING_ROLES.includes(profile?.role) ? [{ tab: "landing", label: "Landing page", Icon: FaGlobe, desktopOnly: true }] : []),
    ...(LINKTREE_ROLES.includes(profile?.role) ? [{ tab: "links", label: "Links", Icon: FaLink, desktopOnly: true }] : []),
    ...(ATTENDANT_ROLES.includes(profile?.role) ? [{ tab: "attendant", label: "Atendente IA", Icon: FaMagic, desktopOnly: true }] : []),
    ...(CUSTOM_LAYOUT_ROLES.includes(profile?.role) ? [{ tab: "customLayout", label: "Layout personalizado", Icon: FaPalette, desktopOnly: true }] : []),
  ];

  const navClass = (active) =>
    `cursor-pointer w-full px-1 xxs:px-4 py-5 lg:py-3 lg:rounded-xl hover-bg-translucid transition-colors text-sm xs:text-base flex items-center gap-3 justify-center whitespace-nowrap ${
      collapsed ? "lg:px-0" : "lg:justify-start lg:px-3"
    } ${active ? "bg-brand-gradient bg-brand-gradient-soft text-white font-semibold" : ""}`;

  const drawerItemClass = (active) =>
    `cursor-pointer w-full px-4 py-3 rounded-xl hover-bg-translucid transition-colors flex items-center gap-3 text-left ${
      active ? "bg-brand-gradient bg-brand-gradient-soft text-white font-semibold" : ""
    }`;

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
          className={`max-lg:fixed max-lg:z-[60] max-lg:bottom-2 max-lg:inset-x-2 max-lg:mx-auto max-lg:w-auto max-lg:h-auto max-lg:rounded-2xl max-lg:bg-brand-surface/70 max-lg:backdrop-blur-md lg:m-2 lg:rounded-2xl lg:bg-brand-surface border border-brand-line h-full max-w-[812px] ${collapsed ? "lg:w-16" : "lg:w-60"} lg:transition-[width] lg:duration-200 flex flex-col justify-between items-stretch overflow-hidden lg:h-[calc(100dvh-110px)]`}
        >
          {/* Top section */}
          <div className="w-full flex lg:flex-col lg:gap-1 lg:p-2">
            <button
              onClick={toggleCollapsed}
              aria-expanded={!collapsed}
              aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
              title={collapsed ? "Expandir menu" : "Recolher menu"}
              className={`hidden lg:flex cursor-pointer items-center h-10 rounded-xl hover-bg-translucid transition-colors color-gray mb-1 ${collapsed ? "justify-center" : "justify-end px-3"}`}
            >
              <FaChevronLeft className={`text-sm transition-transform duration-200 ${collapsed ? "rotate-180" : ""}`} />
            </button>

            {navItems.map(({ tab, label, Icon, desktopOnly }) => (
              <button
                key={tab}
                onClick={() => setSelectedTab(tab)}
                title={label}
                aria-label={label}
                className={`${navClass(selectedTab === tab)} ${desktopOnly ? "max-lg:hidden" : ""}`}
              >
                <span className="relative shrink-0">
                  <Icon className="text-lg" />
                  {tab === "orders" && pendingOrdersCount > 0 && (
                    <span className="absolute -top-2 -right-3 bg-bite ring-2 ring-brand-surface text-white rounded-full text-[10px] min-w-[18px] h-[18px] px-1 flex items-center justify-center">
                      {pendingOrdersCount}
                    </span>
                  )}
                </span>
                <span className={labelClass}>
                  {tab === "menu" && changedFields.length > 0 ? `${label} *` : label}
                </span>
              </button>
            ))}

            <button
              onClick={() => setIsOpen(true)}
              aria-label="Mais opções"
              aria-expanded={isOpen}
              className={`${navClass(["landing", "attendant", "account"].includes(selectedTab))} lg:hidden`}
            >
              <FaBars className="text-lg shrink-0" />
            </button>
          </div>

          {/* Bottom section */}
          <div className="w-full hidden lg:flex flex-col gap-1 p-2 border-t border-brand-line">
            <Link href="/docs" title="Documentação" aria-label="Documentação" className={navClass(false)}>
              <FaBook className="text-lg shrink-0" />
              <span className={labelClass}>Documentação</span>
            </Link>

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
              <IconPessoa className="text-lg shrink-0" />
              <span className={labelClass}>Conta</span>
            </button>
          </div>
        </aside>
      </div>

      {/* Main content */}
      <main
        ref={mainRef}
        className="w-[100dvw] lg:w-auto lg:flex-1 lg:min-w-0 h-[calc(100dvh-85px)] pb-[80px] lg:pb-0 lg:h-[calc(100dvh-100px)] overflow-auto scrollbar-none"
      >
        <UpsellBanner selectedTab={selectedTab} collapsed={collapsed} />
        {/* abas sem painel à direita: centralizadas em telas grandes (cada uma com a largura máxima que já usa) */}
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
            <Orders setSelectedTab={setSelectedTab} reloadTrigger={reloadOrderTrigger} setOrderQuantityChangeTrigger={setOrderQuantityChangeTrigger} />
          </div>
        )}
        {selectedTab === "sales" && (
          <div className="block mx-auto w-full max-w-[1056px]">
            <Sales setSelectedTab={setSelectedTab} />
          </div>
        )}
        {selectedTab === "tables" && (
          <div className="block mx-auto w-full max-w-[1024px]">
            <Tables />
          </div>
        )}
        {selectedTab === "stock" && (
          <div className="block mx-auto w-full max-w-[1024px]">
            <Stock setSelectedTab={setSelectedTab} />
          </div>
        )}
        {selectedTab === "whatsappMessage" && (
          <div className="block mx-auto w-full max-w-[1200px]">
            <WhatsappMessage setSelectedTab={setSelectedTab} />
          </div>
        )}
        {selectedTab === "salesDashboard" && (
          <div className="block mx-auto w-full max-w-[1116px]">
            <SalesDashboard setSelectedTab={setSelectedTab} />
          </div>
        )}
        {selectedTab === "configMenu" && (
          <div className="block mx-auto w-full max-w-[1096px]">
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
          <div className="block mx-auto w-full max-w-[812px]">
            <Account setSelectedTab={setSelectedTab} />
          </div>
        )}
        {selectedTab === "kitchen" && menu && (
          <div className="block pt-2">
            <Kitchen menu={menu} reloadTrigger={reloadOrderTrigger} onBack={() => setSelectedTab("orders")} />
          </div>
        )}
        {selectedTab === "delivery" && menu && (
          <div className="block pt-2">
            <Delivery menu={menu} reloadTrigger={reloadOrderTrigger} onBack={() => setSelectedTab("orders")} />
          </div>
        )}
        {selectedTab === "team" && (
          <div className="block mx-auto w-full max-w-[812px]">
            <Team setSelectedTab={setSelectedTab} />
          </div>
        )}
        {selectedTab === "landing" && LANDING_ROLES.includes(profile?.role) && (
          <div className="block mx-auto w-full max-w-[1400px]">
            <Landing />
          </div>
        )}
        {selectedTab === "links" && LINKTREE_ROLES.includes(profile?.role) && (
          <div className="block mx-auto w-full max-w-[1100px]">
            <Linktree />
          </div>
        )}
        {selectedTab === "attendant" && ATTENDANT_ROLES.includes(profile?.role) && (
          <div className="block mx-auto w-full max-w-[812px]">
            <Attendant />
          </div>
        )}
        {selectedTab === "customLayout" && CUSTOM_LAYOUT_ROLES.includes(profile?.role) && (
          <div className="block mx-auto w-full max-w-[1100px]">
            <CustomLayout />
          </div>
        )}
        {selectedTab === "planDetails" && (
          <div className="block mx-auto w-full max-w-[1040px]">
            <PlanDetails setSelectedTab={setSelectedTab} />
          </div>
        )}
      </main>

      <AddressUpdateModal
        menu={menu}
        onUpdate={() => {
          try {
            sessionStorage.setItem("configMenuSection", "basico");
          } catch {}
          setSelectedTab("configMenu");
        }}
      />

      {/* um convite por vez: o do endereço tem prioridade */}
      {!(menu?.address?.trim() && !menu?.address_details?.city && menu?.discoverable !== false) && (
        <PixOnlineModal
          menu={menu}
          role={profile?.role}
          onActivate={() => {
            try {
              sessionStorage.setItem("configMenuSection", "pagamentos");
            } catch {}
            setSelectedTab("configMenu");
          }}
        />
      )}

      {/* impressão automática: um pedido por vez, o próximo entra ao terminar */}
      {printQueue[0] && (
        <PrintDocumentButton
          key={printQueue[0].id}
          autoPrint
          onAutoPrinted={() => setPrintQueue((q) => q.slice(1))}
          document={normalizeOrderForPrint(printQueue[0], {
            deliveryFeeOnSales: menu?.delivery_fee_on_sales,
          })}
          currency={menu?.currency}
          menuName={menu?.title}
          canPrint
          canCustomizeOrder={["business", "admin", "designer"].includes(profile?.role)}
          fileNamePrefix="pedido"
          receiptTitle="PEDIDO"
        />
      )}

      {/* Menu lateral (mobile) ao clicar no hamburger */}
      <div
        className={`lg:hidden fixed inset-0 z-[155] bg-black/50 backdrop-blur-sm transition-opacity duration-200 ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />
      <nav
        aria-label="Mais opções"
        inert={!isOpen}
        onTouchStart={onDrawerTouchStart}
        onTouchMove={onDrawerTouchMove}
        onTouchEnd={onDrawerTouchEnd}
        onTouchCancel={onDrawerTouchEnd}
        style={dragX ? { transform: `translateX(${dragX}px)`, transition: "none" } : undefined}
        className={`lg:hidden fixed inset-y-0 right-0 z-[156] w-[85vw] max-w-[320px] bg-brand-surface border-l border-brand-line shadow-2xl flex flex-col transition-transform duration-200 touch-pan-y ${isOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="flex items-center justify-between px-4 h-16 border-b border-brand-line">
          <span className="font-semibold">Menu</span>
          <button
            onClick={() => setIsOpen(false)}
            aria-label="Fechar menu"
            className="cursor-pointer w-10 h-10 flex items-center justify-center rounded-xl hover-bg-translucid"
          >
            <FaTimes />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1">
          <button
            onClick={() => {
              if (!shareUrl) return;
              setIsOpen(false);
              setShowQrCode(true);
            }}
            className={drawerItemClass(false)}
          >
            <FaQrcode className="text-lg shrink-0" />
            Compartilhar cardápio
          </button>
          {LANDING_ROLES.includes(profile?.role) && (
            <button onClick={() => handleMenuSelect("landing")} className={drawerItemClass(selectedTab === "landing")}>
              <FaGlobe className="text-lg shrink-0" />
              Landing page
            </button>
          )}
          {LINKTREE_ROLES.includes(profile?.role) && (
            <button onClick={() => handleMenuSelect("links")} className={drawerItemClass(selectedTab === "links")}>
              <FaLink className="text-lg shrink-0" />
              Links
            </button>
          )}
          {ATTENDANT_ROLES.includes(profile?.role) && (
            <button onClick={() => handleMenuSelect("attendant")} className={drawerItemClass(selectedTab === "attendant")}>
              <FaMagic className="text-lg shrink-0" />
              Atendente IA
            </button>
          )}
          {CUSTOM_LAYOUT_ROLES.includes(profile?.role) && (
            <button onClick={() => handleMenuSelect("customLayout")} className={drawerItemClass(selectedTab === "customLayout")}>
              <FaPalette className="text-lg shrink-0" />
              Layout personalizado
            </button>
          )}
        </div>

        <div className="p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] border-t border-brand-line flex flex-col gap-1">
          <Link href="/docs" className={drawerItemClass(false)}>
            <FaBook className="text-lg shrink-0" />
            Documentação
          </Link>
          <Link href="/support" className={drawerItemClass(false)}>
            <FaHeadset className="text-lg shrink-0" />
            Suporte
          </Link>
          <Link href="/politica-de-privacidade" className={drawerItemClass(false)}>
            <FaShieldAlt className="text-lg shrink-0" />
            Política de privacidade
          </Link>
          <button onClick={() => handleMenuSelect("account")} className={drawerItemClass(selectedTab === "account")}>
            <IconPessoa className="text-lg shrink-0" />
            Conta
          </button>
        </div>
      </nav>

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
