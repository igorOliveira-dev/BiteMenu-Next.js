"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FaExternalLinkAlt, FaStore } from "react-icons/fa";
import { supabase } from "@/lib/supabaseClient";
import useUser from "@/hooks/useUser";
import LoyaltyProgress from "@/components/LoyaltyProgress";
import { isLoyaltyOn, loyaltyState } from "@/lib/loyalty";

// Fidelidades de que o cliente participa: cardápio com programa ativo e pelo menos 1 venda dele
// (sales.customer_id + policy sales_select_own_customer, tasks/fidelidade/fidelidade.sql)
export default function LoyaltyCards() {
  const { user } = useUser();
  const [cards, setCards] = useState(null);

  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      const { data: sales, error } = await supabase
        .from("sales")
        .select("menu_id")
        .eq("customer_id", user.id);
      if (error) console.warn("[fidelidade] vendas da conta indisponíveis:", error.message);

      const counts = {};
      for (const s of sales || []) counts[s.menu_id] = (counts[s.menu_id] || 0) + 1;
      const ids = Object.keys(counts);
      if (ids.length === 0) return setCards([]);

      // ponytail: o plano do dono não é legível aqui; dono abaixo do Plus continua aparecendo (o cardápio já esconde)
      const { data: menus } = await supabase
        .from("menus")
        .select("id, slug, title, logo_url, banner_url, banner_mobile_url, loyalty")
        .in("id", ids);

      setCards(
        (menus || [])
          .filter((m) => isLoyaltyOn(m.loyalty))
          .map((m) => ({ ...m, count: counts[m.id] }))
          // prêmio liberado primeiro, depois quem está mais perto
          .sort((a, b) => {
            const sa = loyaltyState(a.count, a.loyalty.goal);
            const sb = loyaltyState(b.count, b.loyalty.goal);
            return sb.ready - sa.ready || sb.done / b.loyalty.goal - sa.done / a.loyalty.goal;
          }),
      );
    })();
  }, [user?.id]);

  if (!cards) return null;

  return (
    <div className="space-y-3">
      <p className="text-sm color-gray">
        Cada compra finalizada pelo estabelecimento enche um traço. Completou, a próxima compra sai com o prêmio.
      </p>
      {cards.length === 0 ? (
        <div className="rounded-2xl border border-brand-line bg-translucid p-6 text-center color-gray">
          <p>Você ainda não participa de nenhuma fidelidade.</p>
          <p className="mt-1 text-sm">
            Faça um pedido logado num estabelecimento com fidelidade.{" "}
            <Link href="/descobrir" className="font-semibold text-brand-eyebrow underline underline-offset-2">
              Descobrir estabelecimentos
            </Link>
          </p>
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {cards.map((m) => {
            const banner = m.banner_mobile_url || m.banner_url;
            const { used } = loyaltyState(m.count, m.loyalty.goal);
            return (
              <li
                key={m.id}
                className="overflow-hidden rounded-2xl border border-brand-line bg-brand-surface"
              >
                <span className="block h-20 bg-[var(--translucid)]">
                  {banner && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={banner} alt="" loading="lazy" className="h-full w-full object-cover" />
                  )}
                </span>
                <div className="px-3 pb-3">
                  <div className="flex items-end gap-3">
                    {m.logo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={m.logo_url}
                        alt=""
                        loading="lazy"
                        className="-mt-6 h-12 w-12 shrink-0 rounded-xl border-2 border-brand-surface bg-brand-surface object-cover"
                      />
                    ) : (
                      <span className="-mt-6 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border-2 border-brand-surface bg-brand-surface">
                        <FaStore className="opacity-50" />
                      </span>
                    )}
                    <h3 className="min-w-0 truncate pt-1.5 text-base font-semibold">{m.title}</h3>
                  </div>
                  <div className="mt-3">
                    <LoyaltyProgress count={m.count} goal={m.loyalty.goal} reward={m.loyalty.reward} />
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <span className="text-xs color-gray">
                      {used > 0 ? `Prêmios usados: ${used}` : ""}
                    </span>
                    <Link
                      href={`/menu/${m.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 rounded-full border border-brand-line px-3 py-1.5 text-sm font-medium hover-bg-translucid"
                    >
                      Ver cardápio <FaExternalLinkAlt className="text-xs" />
                    </Link>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
