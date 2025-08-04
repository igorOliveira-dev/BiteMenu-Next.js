"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Loading from "@/components/Loading";
import useUser from "@/hooks/useUser";

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const { user, loading } = useUser();
  const [checkingMenu, setCheckingMenu] = useState(true);
  const [hasMenu, setHasMenu] = useState(false);

  useEffect(() => {
    const checkUserMenu = async () => {
      if (!loading && user) {
        const { data: menus } = await supabase.from("menus").select("id").eq("owner_id", user.id);

        if (!menus || menus.length === 0) {
          router.replace("/getstart");
          return;
        }

        setHasMenu(true);
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
