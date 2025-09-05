"use client";

import React, { useState } from "react";
import Menu from "./tabs/Menu";
import Orders from "./tabs/Orders";
import Sales from "./tabs/Sales";

const Dashboard = () => {
  const [selectedTab, setSelectedTab] = useState("menu");
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex w-[100dvw] items-center lg:items-start lg:h-[calc(100dvh-110px)] lg:flex-row flex-col-reverse items-center">
      <div className="flex items-center">
        <aside className="m-2 rounded-lg bg-translucid h-full lg:w-60 shadow-[0_0_10px_var(--shadow)] flex lg:flex-col items-center overflow-hidden lg:h-[calc(100dvh-110px)]">
          <button
            className="w-full p-4 hover-bg-translucid transition-colors font-semibold border-b-2 border-[var(--translucid)]"
            onClick={() => setSelectedTab("menu")}
          >
            Cardápio
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
        </aside>

        {/* boatao hamburger: */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="lg:hidden relative w-8 h-8 m-2 flex flex-col justify-between items-center group"
        >
          <span
            className={`h-[5px] w-8 bg-white rounded transition-all duration-300 ${
              isOpen ? "rotate-45 translate-y-[13px]" : ""
            }`}
          ></span>
          <span className={`h-[5px] w-8 bg-white rounded transition-all duration-300 ${isOpen ? "opacity-0" : ""}`}></span>
          <span
            className={`h-[5px] w-8 bg-white rounded transition-all duration-300 ${
              isOpen ? "-rotate-45 -translate-y-[13px]" : ""
            }`}
          ></span>
        </button>
      </div>
      <main className="w-[100dvw] lg:w-[calc(100dvw-280px)] h-[calc(100dvh-160px)] lg:h-[calc(100dvh-100px)] overflow-auto scrollbar-none">
        <div className={selectedTab === "menu" ? "block" : "hidden"}>
          <Menu />
        </div>
        <div className={selectedTab === "orders" ? "block" : "hidden"}>
          <Orders />
        </div>
        <div className={selectedTab === "sales" ? "block" : "hidden"}>
          <Sales />
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
