"use client";

import { useEffect, useState } from "react";
import useUser from "@/hooks/useUser";
import { supabase } from "@/lib/supabaseClient";
import { isLoyaltyOn, loyaltyState } from "@/lib/loyalty";

// Vendas finalizadas do cliente logado neste cardápio (fidelidade, tasks/fidelidade/fidelidade-plan.md).
// count: null enquanto carrega, para visitante, dono/equipe ou programa desligado. state = loyaltyState (lib/loyalty).
// hasOpenOrder: com o prêmio liberado, se já há pedido em aberto (o prêmio está nele). null = não se aplica/carregando.
// refreshKey: muda para reconferir o pedido em aberto (o carrinho passa cartIsEmpty).
export default function useLoyaltyCount(menuId, loyalty, refreshKey) {
  const { user, profile, loading } = useUser();
  const on = isLoyaltyOn(loyalty);
  const isCustomer = profile?.account_type === "customer";
  const [dates, setDates] = useState(null); // created_at das vendas

  useEffect(() => {
    if (!on || !isCustomer || !user?.id || !menuId) return;
    supabase
      .from("sales")
      .select("created_at")
      .eq("menu_id", menuId)
      .eq("customer_id", user.id)
      .then(({ data, error }) => {
        if (error) console.warn("[fidelidade] progresso indisponível:", error.message);
        setDates((data || []).map((s) => s.created_at));
      });
  }, [on, isCustomer, user?.id, menuId]);

  // o prêmio só "gasta" quando o dono finaliza o pedido: com pedido em aberto aqui, ele já foi usado nele
  const count = dates ? dates.length : null;
  const state = on && dates ? loyaltyState(dates, loyalty) : null;
  const ready = !loyalty?.locked && !!state?.ready;
  const [hasOpenOrder, setHasOpenOrder] = useState(null);
  useEffect(() => {
    if (!ready || !user?.id) return;
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("menu_id", menuId)
      .eq("customer_id", user.id)
      .then(({ count, error }) => {
        if (error) console.warn("[fidelidade] pedidos em aberto indisponíveis:", error.message);
        setHasOpenOrder(error ? true : (count ?? 0) > 0);
      });
  }, [ready, user?.id, menuId, refreshKey]);

  return { user, profile, loading, on, isCustomer, count, state, hasOpenOrder };
}
