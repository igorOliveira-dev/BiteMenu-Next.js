"use client";

import { useState } from "react";
import Link from "next/link";
import { FaTimes } from "react-icons/fa";
import { getContrastTextColor } from "@/utils/color";

// Convite para o visitante criar conta de cliente. Com `colors` ({ text, muted, surface, accent }) segue o tema do
// cardápio; sem, a identidade do Bite Menu. `onBeforeLeave` roda antes de ir para o cadastro/login.
export default function SignUpCta({
  next,
  colors,
  onBeforeLeave,
  title = "Peça mais rápido da próxima vez",
  text = "Crie sua conta grátis: seus dados ficam salvos e você acompanha o histórico dos seus pedidos.",
}) {
  const [hidden, setHidden] = useState(false);
  if (hidden) return null;

  const query = `tipo=cliente&next=${encodeURIComponent(next)}`;

  return (
    <div
      className={`relative rounded-xl p-3 text-left ${colors ? "" : "bg-brand-surface border border-brand-line"}`}
      style={colors ? { backgroundColor: colors.surface, color: colors.text } : undefined}
    >
      <button
        type="button"
        aria-label="Agora não"
        onClick={() => setHidden(true)}
        className="cursor-pointer absolute top-2 right-2 p-1 opacity-60 hover:opacity-100"
      >
        <FaTimes size={12} />
      </button>
      <p className="font-bold text-sm pr-6">{title}</p>
      <p
        className={`text-xs mt-1 ${colors ? "" : "text-brand-muted"}`}
        style={colors ? { color: colors.muted } : undefined}
      >
        {text}
      </p>
      <div className="flex items-center gap-3 mt-3">
        <Link
          href={`/register?${query}`}
          onClick={onBeforeLeave}
          className={`rounded-full px-4 py-1.5 text-sm font-bold hover:opacity-90 transition ${colors ? "" : "bg-azul text-white"}`}
          style={
            colors
              ? { backgroundColor: colors.accent, color: getContrastTextColor(colors.accent) }
              : undefined
          }
        >
          Criar conta
        </Link>
        <Link
          href={`/login?${query}`}
          onClick={onBeforeLeave}
          className="text-sm font-medium underline underline-offset-2 opacity-80 hover:opacity-100"
        >
          Já tenho conta
        </Link>
      </div>
    </div>
  );
}
