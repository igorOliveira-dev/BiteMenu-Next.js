"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import useUser from "./useUser";

let cachedMenu = null;
let cachedUserId = null;

export default function useMenu() {
  const { user, loading: userLoading } = useUser();
  const [menu, setMenu] = useState(cachedMenu);
  const [loading, setLoading] = useState(!cachedMenu); // se já tem cache, não carrega de novo

  useEffect(() => {
    if (userLoading) return;

    // usuário deslogado → limpa estados e cache
    if (!user) {
      setMenu(null);
      cachedMenu = null;
      cachedUserId = null;
      setLoading(false);
      return;
    }

    // se já existe cache, mas é de outro usuário, invalida
    if (cachedUserId && cachedUserId !== user.id) {
      cachedMenu = null;
    }

    // se ainda não há cache para este usuário, busca do Supabase
    if (!cachedMenu) {
      const fetchMenu = async () => {
        setLoading(true);

        const { data, error } = await supabase.from("menus").select("*").eq("owner_id", user.id).single();

        if (error && error.code !== "PGRST116") {
          console.error("Erro ao buscar menu:", error);
        }

        cachedMenu = data ?? null;
        cachedUserId = user.id;
        setMenu(cachedMenu);
        setLoading(false);
      };

      fetchMenu();
      return;
    }

    // se já há cache válido para este usuário, garante sincronização local
    setMenu(cachedMenu);
    setLoading(false);
  }, [user, userLoading]);

  return { menu, loading };
}
