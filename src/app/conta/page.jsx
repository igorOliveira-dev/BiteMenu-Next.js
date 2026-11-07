"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FaUser, FaReceipt, FaAddressCard, FaGift } from "react-icons/fa";
import useUser from "@/hooks/useUser";
import Loading from "@/components/Loading";
import BrandLogo from "@/components/BrandLogo";
import ThemeToggle from "@/components/ThemeToggle";
import Account from "@/app/dashboard/tabs/Account";
import OrdersHistory, { countActiveOrders } from "./components/OrdersHistory";
import PersonalInfo from "./components/PersonalInfo";
import LoyaltyCards from "./components/LoyaltyCards";

// ?aba=<tab> abre direto numa seção (ex.: o menu da navbar abre ?aba=pedidos)
const TABS = [
  { tab: "perfil", label: "Perfil", Icon: FaUser },
  { tab: "dados", label: "Dados pessoais", Icon: FaAddressCard },
  { tab: "pedidos", label: "Meus pedidos", Icon: FaReceipt },
  { tab: "fidelidades", label: "Fidelidades", Icon: FaGift },
];

export default function ContaPage() {
  const router = useRouter();
  const { user, loading } = useUser();
  const [selectedTab, setSelectedTab] = useState("perfil");
  const [activeOrders, setActiveOrders] = useState(0);

  // lido após o mount (sem useSearchParams, que exigiria Suspense)
  useEffect(() => {
    const aba = new URLSearchParams(window.location.search).get("aba");
    if (TABS.some((t) => t.tab === aba)) setSelectedTab(aba);
  }, []);

  // pedido em andamento: contador no menu e, sem ?aba, a conta já abre nos pedidos
  useEffect(() => {
    if (!user?.id) return;
    countActiveOrders(user.id).then((n) => {
      setActiveOrders(n);
      if (n > 0 && !new URLSearchParams(window.location.search).get("aba"))
        setSelectedTab("pedidos");
    });
  }, [user?.id]);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  const selectTab = (tab) => {
    setSelectedTab(tab);
    window.history.replaceState(null, "", `/conta?aba=${tab}`);
  };

  if (loading || !user) return <Loading />;

  const current = TABS.find((t) => t.tab === selectedTab);

  // mesmo visual do dashboard: lateral no desktop, barra fixa embaixo no celular
  const navClass = (active) =>
    `cursor-pointer w-full px-2 py-4 lg:py-3 lg:px-3 lg:rounded-xl hover-bg-translucid transition-colors flex items-center gap-3 justify-center lg:justify-start whitespace-nowrap ${
      active
        ? "bg-brand-gradient bg-brand-gradient-soft text-white font-semibold"
        : ""
    }`;

  return (
    <>
      <header className="z-10 backdrop-blur-xl flex items-center fixed top-0 w-[calc(100%-20px)] justify-between py-1.5 pl-4 pr-1.5 m-2 my-3 bg-brand-surface/85 border border-brand-line rounded-full">
        <BrandLogo as="a" href="/" />
        <ThemeToggle />
      </header>

      <div className="flex flex-col lg:flex-row lg:items-start pt-[85px]">
        <aside className="max-lg:fixed max-lg:z-[60] max-lg:bottom-2 max-lg:inset-x-2 max-lg:rounded-2xl max-lg:bg-brand-surface/70 max-lg:backdrop-blur-md lg:m-2 lg:w-64 lg:shrink-0 lg:rounded-2xl lg:bg-brand-surface border border-brand-line overflow-hidden">
          <nav className="flex lg:flex-col lg:gap-1 lg:p-2">
            {TABS.map(({ tab, label, Icon }) => (
              <button
                key={tab}
                onClick={() => selectTab(tab)}
                title={label}
                aria-label={label}
                aria-current={selectedTab === tab ? "page" : undefined}
                className={navClass(selectedTab === tab)}
              >
                <span className="relative">
                  <Icon className="text-lg shrink-0" />
                  {tab === "pedidos" && activeOrders > 0 && (
                    <span
                      aria-label={`${activeOrders} em andamento`}
                      className="absolute -right-2.5 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-verde px-1 text-[10px] font-bold text-white"
                    >
                      {activeOrders}
                    </span>
                  )}
                </span>
                <span className="hidden lg:block">{label}</span>
              </button>
            ))}
          </nav>
        </aside>

        <main className="flex-1 min-w-0 px-4 pb-[90px] lg:pb-6 lg:pt-2">
          {/* centraliza no espaço à direita da lateral em telas grandes */}
          <div className="mx-auto w-full max-w-[812px]">
            {selectedTab === "perfil" ? (
              <Account setSelectedTab={() => router.push("/")} />
            ) : (
              <div className="pt-2">
                <h2 className="mb-4 font-semibold">{current.label}</h2>
                {selectedTab === "pedidos" && (
                  <OrdersHistory onActiveCount={setActiveOrders} />
                )}
                {selectedTab === "dados" && <PersonalInfo />}
                {selectedTab === "fidelidades" && <LoyaltyCards />}
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
}
