"use client";

import Link from "next/link";
import { FaGift, FaLock } from "react-icons/fa";
import useLoyaltyCount from "@/hooks/useLoyaltyCount";
import LoyaltyProgress from "@/components/LoyaltyProgress";

// Faixa da fidelidade acima das categorias, nas cores do cardápio. Cliente logado vê o progresso; visitante vê o
// programa e "Entre para participar". Dono e equipe não veem nada. Dono abaixo do Pro: `loyalty.locked` (page.jsx);
// só o cliente que já tem compra vê a faixa, com cadeado e aviso.
// colors: { text, muted, track, accent }
export default function LoyaltyBanner({ loyalty, menuId, slug, colors, className = "" }) {
  const { user, profile, loading, on, isCustomer, count, state, hasOpenOrder } = useLoyaltyCount(menuId, loyalty);

  if (!on || loading || (user && !profile)) return null;
  if (user && !isCustomer) return null;
  if (user && count === null) return null; // só aparece com o número pronto: o layout não pula
  if (loyalty.locked && !(count > 0)) return null;

  return (
    <div className={className}>
      <div className="rounded-2xl p-3" style={{ backgroundColor: colors.track, color: colors.text }}>
        <p className="mb-2 flex items-center gap-2 text-sm font-semibold">
          <FaGift style={{ color: colors.accent }} /> Programa de fidelidade
          {loyalty.locked && <FaLock className="ml-auto text-xs" style={{ color: colors.muted }} aria-label="Bloqueada" />}
        </p>
        {loyalty.locked ? (
          <>
            <div className="pointer-events-none opacity-40" aria-hidden="true">
              <LoyaltyProgress state={state} goal={loyalty.goal} reward={loyalty.reward} colors={colors} />
            </div>
            <p className="mt-2 text-sm" style={{ color: colors.text }}>
              Este estabelecimento não tem acesso à fidelidade no momento. Seu progresso fica guardado e volta a valer
              quando o programa for liberado.
            </p>
          </>
        ) : user ? (
          <LoyaltyProgress
            state={state}
            goal={loyalty.goal}
            reward={loyalty.reward}
            colors={colors}
            inOpenOrder={!!hasOpenOrder}
          />
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm" style={{ color: colors.muted }}>
              A cada {loyalty.goal} compras, a próxima sai com <strong style={{ color: colors.text }}>{loyalty.reward}</strong>.
            </p>
            <Link
              href={`/login?tipo=cliente&next=${encodeURIComponent(`/menu/${slug}`)}`}
              className="rounded-full border px-3 py-1 text-sm font-medium hover:opacity-80"
              style={{ borderColor: colors.text, color: colors.text }}
            >
              Entre para participar
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
