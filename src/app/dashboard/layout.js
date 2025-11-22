"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Loading from "@/components/Loading";
import useUser from "@/hooks/useUser";
import Image from "next/image";
import LogoMark from "../../../public/LogoMarca-sem-fundo.png";
import LogoTip from "../../../public/LogoTipo-sem-fundo.png";
import ThemeToggle from "@/components/ThemeToggle";
import { FaBolt } from "react-icons/fa";

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const { user, profile, loading } = useUser();
  const [checkingMenu, setCheckingMenu] = useState(true);
  const [ownerPlan, setOwnerPlan] = useState(null);
  const [showPlanButton, setShowPlanButton] = useState(false);

  useEffect(() => {
    const checkUserMenu = async () => {
      if (!user) {
        // se user é null e loading já acabou → redireciona login
        if (!loading) router.replace("/login");
        return;
      }

      try {
        const { data: menus } = await supabase.from("menus").select("id").eq("owner_id", user.id);

        if (!menus || menus.length === 0) {
          router.replace("/getstart");
          return;
        }

        setCheckingMenu(false);
      } catch (err) {
        console.error("Erro ao buscar menus:", err);
        setCheckingMenu(false);
      }
    };

    checkUserMenu();
  }, [user, loading, router]);

  useEffect(() => {
    if (user && profile) {
      setOwnerPlan(profile.role);
    }
  }, [user, router, checkingMenu]);

  useEffect(() => {
    if (window.location.pathname === "/dashboard") {
      if (ownerPlan === "free" || ownerPlan === "plus" || ownerPlan === "admin") {
        setShowPlanButton(true);
      } else {
        setShowPlanButton(false);
      }
    }
  }, [ownerPlan]);

  if (loading || checkingMenu) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loading />
      </div>
    );
  }

  return (
    <>
      <header className="z-10 backdrop-blur-sm flex items-center fixed top-0 w-[calc(100%-20px)] justify-between p-2 m-2 my-3 bg-translucid border-2 border-translucid rounded-lg shadow-[0_0_10px_var(--shadow)]">
        {/* logo marca - telas grandes */}
        <Image
          src={LogoMark}
          height={50}
          width={180}
          alt="Bite Menu"
          onClick={() => (window.location.href = "/dashboard")}
          className="hidden xs:block"
        />

        {/* logo tipo - telas pequenas */}
        <Image
          src={LogoTip}
          height={50}
          width={50}
          alt="Bite Menu"
          onClick={() => (window.location.href = "/dashboard")}
          className="block xs:hidden"
        />

        <div className="flex items-center gap-2">
          {/* botao de melhorar plano */}
          {showPlanButton ? (
            <a href="/dashboard/pricing" className="cta-button">
              <span className="hidden xxs:block">
                <FaBolt />
              </span>
              Melhorar plano!
            </a>
          ) : null}

          {/* troca de temas */}
          <ThemeToggle />
        </div>
      </header>
      <main>{children}</main>
    </>
  );
}
