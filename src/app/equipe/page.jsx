"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FaSignOutAlt } from "react-icons/fa";
import { supabase } from "@/lib/supabaseClient";
import { countVisibleOrders } from "@/lib/queries/orders";
import { getStaff, STAFF_ROLES } from "@/lib/staff";
import useUser from "@/hooks/useUser";
import useMenu from "@/hooks/useMenu";
import Loading from "@/components/Loading";
import ThemeToggle from "@/components/ThemeToggle";
import { useAlert } from "@/providers/AlertProvider";
import Orders from "@/app/dashboard/tabs/Orders";
import Kitchen from "./Kitchen";
import Delivery from "./Delivery";

// Tela dos logins da equipe: caixa vê a aba Pedidos, cozinha a fila de preparo, entregador as entregas
export default function EquipePage() {
  const router = useRouter();
  const customAlert = useAlert();
  const { user, loading } = useUser();
  const { menu, loading: menuLoading } = useMenu();
  const [staff, setStaff] = useState(null);
  const [reloadTrigger, setReloadTrigger] = useState(0);
  const previousCountRef = useRef(null);

  useEffect(() => {
    if (loading) return;
    if (!user) return router.replace("/login");

    getStaff(supabase, user.id).then(({ data }) => {
      if (!data) return router.replace("/dashboard"); // não é da equipe
      setStaff(data);
    });
  }, [user, loading, router]);

  // novos pedidos: mesmo esquema do Dashboard (contagem a cada 30s)
  useEffect(() => {
    if (!menu?.id || !staff) return;

    const check = async () => {
      const { count, error } = await countVisibleOrders(supabase, menu.id);
      if (error || typeof count !== "number") return;

      if (previousCountRef.current != null && count > previousCountRef.current) {
        customAlert("Novo pedido recebido!", "success");
        if (menu.sound_new_order) new Audio("/sounds/new-order.wav").play().catch(() => {});
      }
      if (previousCountRef.current != null && count !== previousCountRef.current) {
        setReloadTrigger((prev) => prev + 1);
      }
      previousCountRef.current = count;
    };

    check();
    const interval = setInterval(check, 30000);
    return () => clearInterval(interval);
  }, [menu?.id, staff]);

  const signOut = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
  };

  if (!staff || menuLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loading />
      </div>
    );
  }

  return (
    <>
      <header className="z-10 backdrop-blur-2xl flex items-center fixed top-0 w-[calc(100%-20px)] justify-between gap-2 p-2 m-2 my-3 bg-translucid border-2 border-translucid rounded-lg shadow-[0_0_10px_var(--shadow)]">
        <div className="min-w-0 px-2">
          <p className="font-semibold truncate">{menu?.title || "Bite Menu"}</p>
          <p className="text-xs color-gray truncate">
            {staff.name} · {STAFF_ROLES[staff.role] ?? staff.role}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <ThemeToggle />
          <button
            type="button"
            onClick={signOut}
            className="cursor-pointer flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[var(--translucid)] transition"
          >
            <FaSignOutAlt /> Sair
          </button>
        </div>
      </header>

      <main className="pt-[95px] pb-6">
        {!menu ? (
          <p className="p-6 text-center color-gray max-w-[480px] m-auto">
            Acesso indisponível: o plano Business deste estabelecimento não está ativo ou a tela{" "}
            {{ cozinha: "da cozinha", entregador: "de entregas" }[staff.role] ?? "do caixa"} foi desativada. Fale com o
            responsável.
          </p>
        ) : staff.role === "cozinha" ? (
          <Kitchen menu={menu} reloadTrigger={reloadTrigger} />
        ) : staff.role === "entregador" ? (
          <Delivery menu={menu} reloadTrigger={reloadTrigger} courierId={user.id} />
        ) : (
          <Orders staff reloadTrigger={reloadTrigger} setOrderQuantityChangeTrigger={() => {}} />
        )}
      </main>
    </>
  );
}
