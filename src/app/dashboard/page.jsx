"use client";

import React, { useState } from "react";
import Menu from "./tabs/Menu";
import Orders from "./tabs/Orders";
import Sales from "./tabs/Sales";

const Dashboard = () => {
  const [selectedTab, setSelectedTab] = useState("menu");
  return (
    <div className="flex h-[calc(100dvh-110px)]">
      <aside className="m-2 rounded-lg bg-translucid h-full w-60 shadow-[0_0_10px_var(--shadow)] flex flex-col items-center overflow-hidden">
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
      <main>
        {selectedTab === "menu" ? (
          <Menu />
        ) : selectedTab === "orders" ? (
          <Orders />
        ) : selectedTab === "sales" ? (
          <div>
            <Sales />
          </div>
        ) : (
          setSelectedTab("menu")
        )}
      </main>
    </div>
  );
};

export default Dashboard;
