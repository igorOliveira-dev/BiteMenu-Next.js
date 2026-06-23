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

      const query = supabase.from("menus").select(`
  *,
  profiles(
    display_name,
    role,
    email,
    phone,
    stripe_customer_id
  )
`);

      const { data, error } = await query;

      if (error) {
        console.error("Erro ao buscar menus:", error);
        setMenus([]);
      } else {
        setMenus(data || []);
      }

      setLoading(false);
    };

    fetchMenus();
  }, [userLoading]);

  return { menus, loading };
}
