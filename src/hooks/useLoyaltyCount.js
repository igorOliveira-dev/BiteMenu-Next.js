"use client";

import { useEffect, useState } from "react";
import useUser from "@/hooks/useUser";
import { supabase } from "@/lib/supabaseClient";
import { isLoyaltyOn } from "@/lib/loyalty";

// Vendas finalizadas do cliente logado neste cardápio (fidelidade, tasks/fidelidade/fidelidade-plan.md).
// count: null enquanto carrega, para visitante, dono/equipe ou programa desligado.
export default function useLoyaltyCount(menuId, loyalty) {
  const { user, profile, loading } = useUser();
  const on = isLoyaltyOn(loyalty);
  const isCustomer = profile?.account_type === "customer";
  const [count, setCount] = useState(null);

  useEffect(() => {
    if (!on || !isCustomer || !user?.id || !menuId) return;
    supabase
      .from("sales")
      .select("id", { count: "exact", head: true })
      .eq("menu_id", menuId)
      .eq("customer_id", user.id)
      .then(({ count, error }) => {
        if (error) console.warn("[fidelidade] progresso indisponível:", error.message);
        setCount(count ?? 0);
      });
  }, [on, isCustomer, user?.id, menuId]);

  return { user, profile, loading, on, isCustomer, count };
}
