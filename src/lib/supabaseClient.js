import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Tabelas que aparecem na página pública /menu/[slug] (cacheada por ISR)
const MENU_WRITE = /\/rest\/v1\/(menus|categories|menu_items|option_groups|option_choices|option_stock)(\?|$)/;
let revalidateTimer = null;

// Não altera nenhuma query: só observa as respostas. Depois de uma gravação bem-sucedida
// no cardápio, pede para o servidor derrubar o cache (agrupando gravações seguidas).
async function fetchWithMenuRevalidate(input, init = {}) {
  const res = await fetch(input, init);

  const method = (init.method || "GET").toUpperCase();
  const url = typeof input === "string" ? input : input?.url || "";
  const isWrite = method !== "GET" && method !== "HEAD";
  // o registro de último acesso do dashboard grava em menus, mas não muda o cardápio
  const onlyLastAccess = typeof init.body === "string" && /^\{"last_access_at":"[^"]*"\}$/.test(init.body);

  if (typeof window !== "undefined" && res.ok && isWrite && !onlyLastAccess && MENU_WRITE.test(url)) {
    const headers = new Headers(init.headers);
    const authorization = headers.get("Authorization");

    clearTimeout(revalidateTimer);
    revalidateTimer = setTimeout(() => {
      fetch("/api/revalidate-menu", { method: "POST", headers: { Authorization: authorization }, keepalive: true }).catch(
        () => {},
      );
    }, 800);
  }

  return res;
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    detectSessionInUrl: true,
  },
  global: {
    fetch: fetchWithMenuRevalidate,
  },
});
