"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import useUser from "./useUser";

export default function useAllMenus() {
  const { user, loading: userLoading } = useUser();
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userLoading) return;

    const fetchMenus = async () => {
      setLoading(true);

      const pageSize = 1000;
      let allMenus = [];
      let from = 0;

      while (true) {
        const { data, error } = await supabase
          .from("menus")
          .select("id, owner_id, title, slug, created_at, last_access_at")
          .range(from, from + pageSize - 1);

        if (error) {
          console.error("Erro ao buscar menus:", error);
          break;
        }

        allMenus = allMenus.concat(data || []);

        if (!data || data.length < pageSize) break;

        from += pageSize;
      }

      setMenus(allMenus);
      setLoading(false);
    };

    fetchMenus();
  }, [userLoading]);

  return { menus, loading };
}
