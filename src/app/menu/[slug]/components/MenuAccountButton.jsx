"use client";

import Link from "next/link";
import { FaUser } from "react-icons/fa";
import useUser from "@/hooks/useUser";
import CustomerMenu from "@/components/CustomerMenu";

// Canto do cardápio: cliente logado vê o círculo da conta; visitante vê "Entrar" e volta pra cá depois.
// Dono/equipe logados não veem nada (a conta deles é do painel).
export default function MenuAccountButton({ slug }) {
  const { user, profile, loading } = useUser();

  if (loading || (user && !profile)) return null;

  if (!user) {
    return (
      <Link
        href={`/login?tipo=cliente&next=${encodeURIComponent(`/menu/${slug}`)}`}
        className="flex items-center gap-2 rounded-full bg-black/60 px-3 py-2 text-sm font-medium text-white backdrop-blur-sm transition hover:bg-black/75"
      >
        <FaUser size={12} /> Entrar
      </Link>
    );
  }

  return profile.account_type === "customer" ? <CustomerMenu profile={profile} /> : null;
}
