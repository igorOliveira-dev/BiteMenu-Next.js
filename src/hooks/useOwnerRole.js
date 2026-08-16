"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { getOwnerRole } from "@/lib/queries/profiles";

// Mesmo padrão de cache em módulo usado em useUser.js/useMenu.js.
// getOwnerRole era chamado sem cache em MenuItems.jsx e SalesDashboard.jsx,
// refazendo a mesma query de "profiles" toda vez que cada aba montava.
let cachedRole = null;
let cachedOwnerId = null;

export default function useOwnerRole(ownerId) {
  const [role, setRole] = useState(cachedOwnerId === ownerId ? cachedRole : null);

  useEffect(() => {
    if (!ownerId) return;

    if (cachedOwnerId === ownerId && cachedRole != null) {
      setRole(cachedRole);
      return;
    }

    let cancelled = false;

    getOwnerRole(supabase, ownerId).then(({ data, error }) => {
      if (cancelled) return;

      if (error) {
        console.error("Erro ao buscar role do dono:", error);
        return;
      }

      cachedRole = data?.role ?? null;
      cachedOwnerId = ownerId;
      setRole(cachedRole);
    });

    return () => {
      cancelled = true;
    };
  }, [ownerId]);

  return role;
}
