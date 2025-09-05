"use client";

import Loading from "@/components/Loading";
import { useRouter } from "next/navigation";
import useUser from "@/hooks/useUser";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function GetstartLayout({ children }) {
  const router = useRouter();
  const { user, loading } = useUser();
  const [checkingMenu, setCheckingMenu] = useState(true);

  useEffect(() => {
    const checkUserMenu = async () => {
      if (!loading && user) {
        const { data: menus } = await supabase.from("menus").select("id").eq("owner_id", user.id);

        if (menus && menus.length > 0) {
          router.replace("/dashboard");
          return;
        }

        setCheckingMenu(false);
      }
    };

    if (!loading && user) {
      checkUserMenu();
    } else if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  if (loading || checkingMenu) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loading />
      </div>
    );
  }

  return <>{children}</>;
}
