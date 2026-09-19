import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

const REFRESH_MS = 30000;

// Lê o controle manual direto do banco: a página do cardápio é cacheada (ISR 5 min)
// e o dono precisa que abrir/fechar a loja valha na hora. Como o cliente pode
// deixar a aba aberta, rechecamos a cada 30s e ao voltar para a aba.
// ponytail: polling, trocar por realtime do Supabase se o intervalo incomodar.
export default function useManualStore(menuId) {
  const [state, setState] = useState({ control: false, open: false });

  useEffect(() => {
    if (!menuId) return;

    const refresh = async () => {
      if (document.visibilityState !== "visible") return;
      const { data } = await supabase
        .from("menus")
        .select("manual_control, is_open")
        .eq("id", menuId)
        .maybeSingle();
      if (data) {
        const next = { control: !!data.manual_control, open: !!data.is_open };
        setState((prev) =>
          prev.control === next.control && prev.open === next.open ? prev : next,
        );
      }
    };

    refresh();
    const timer = setInterval(refresh, REFRESH_MS);
    document.addEventListener("visibilitychange", refresh);
    window.addEventListener("focus", refresh);

    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, [menuId]);

  return state;
}
