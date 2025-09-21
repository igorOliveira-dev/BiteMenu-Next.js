"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Loading from "@/components/Loading";
import useUser from "@/hooks/useUser";
import Image from "next/image";
import LogoMark from "../../../public/LogoMarca-sem-fundo.png";
import ThemeToggle from "@/components/ThemeToggle";
import StatesManager from "./StatesManager";

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const { user, loading } = useUser();
  const [checkingMenu, setCheckingMenu] = useState(true);

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
        setCheckingMenu(false); // garante que não trava o loader
      }
    };

    checkUserMenu();
  }, [user, loading, router]);

  if (loading || checkingMenu) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loading />
      </div>
    );
  }

  return (
    <>
      <header className="flex items-center justify-between p-2 m-2 my-3 bg-translucid rounded-lg shadow-[0_0_10px_var(--shadow)]">
        <Image src={LogoMark} height={50} width={180} alt="Bite Menu" />
        <ThemeToggle />
      </header>
      <main>
        <StatesManager />
      </main>
    </>
  );
}
