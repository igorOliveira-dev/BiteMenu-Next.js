"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FaClipboardList } from "react-icons/fa";
import useUser from "@/hooks/useUser";
import { supabase } from "@/lib/supabaseClient";

export default function SurveyBanner() {
  const { user, loading: userLoading } = useUser();
  const [answered, setAnswered] = useState(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    supabase
      .from("profile_surveys")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled) setAnswered(!!data);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (userLoading || answered === null || answered) return null;

  return (
    <Link
      href="/dashboard/pesquisa-de-perfil"
      className="max-w-[100%] flex flex-col xs:flex-row items-center gap-3 px-2 sm:px-4 py-2 my-2 max-w-3xl bg-translucid border-2 border-[var(--translucid)] rounded-2xl hover:opacity-90 transition"
    >
      <FaClipboardList className="text-lg shrink-0 hidden xs:block" />
      <span className="text-xs flex-1">Responda uma pesquisa rápida e ajude o Bite Menu</span>
      <span className="w-full xs:w-auto text-center text-xs px-4 py-1.5 rounded-lg border-2 border-[var(--translucid)] bg-translucid hover:opacity-80 text-sm shrink-0">
        Responder
      </span>
    </Link>
  );
}
