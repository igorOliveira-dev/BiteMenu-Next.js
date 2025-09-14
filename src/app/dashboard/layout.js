"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Loading from "@/components/Loading";
import useUser from "@/hooks/useUser";
import Image from "next/image";
import LogoMark from "../../../public/LogoMarca-sem-fundo.png";
import ThemeToggle from "@/components/ThemeToggle";

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const { user, loading } = useUser();
  const [checkingMenu, setCheckingMenu] = useState(true);

  useEffect(() => {
    const checkUserMenu = async () => {
      console.log("checkUserMenu disparado:", { loading, user });

      if (!loading) {
        if (!user) {
          console.log("Nenhum usuário encontrado → redirecionando para login");
          router.replace("/login");
          return;
        }

        console.log("Usuário encontrado, buscando menus...");
        const { data: menus, error } = await supabase.from("menus").select("id").eq("owner_id", user.id);

        console.log("Resultado menus:", { menus, error });

        if (error) {
          console.error("Erro ao buscar menus:", error);
        }

        if (!menus || menus.length === 0) {
          console.log("Nenhum menu encontrado → redirecionando para getstart");
          router.replace("/getstart");
          return;
        }

        console.log("Menu encontrado → liberando layout");
        setCheckingMenu(false);
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
      <main>{children}</main>
    </>
  );
}
