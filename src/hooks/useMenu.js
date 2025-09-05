"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import useUser from "./useUser";

let cachedMenu = null;

export default function useMenu() {
  const { user, loading: userLoading } = useUser();
  const [menu, setMenu] = useState(cachedMenu);
  const [loading, setLoading] = useState(!cachedMenu); // se já tem cache, não carrega de novo

  useEffect(() => {
    if (userLoading) return;
    if (!user) {
      setMenu(null);
      cachedMenu = null;
      setLoading(false);
      return;
    }

    if (!cachedMenu) {
      const fetchMenu = async () => {
        setLoading(true);

        const { data, error } = await supabase.from("menus").select("*").eq("owner_id", user.id).single();

        if (error && error.code !== "PGRST116") {
          console.error("Erro ao buscar menu:", error);
        }

        cachedMenu = data ?? null;
        setMenu(cachedMenu);
        setLoading(false);
      };

      fetchMenu();
    }
  }, [user, userLoading]);

  return { menu, loading };
}
