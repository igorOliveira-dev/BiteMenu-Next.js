"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { FaBolt, FaTimes } from "react-icons/fa";
import useUser from "@/hooks/useUser";
import { upsellAds } from "@/consts/upsellAds";
import { plansBlockedFor } from "@/consts/Plans";

const STORAGE_KEY = "bite_menu_upsell";
const DAY = 86400000;
const SNOOZE_DAYS = 14;
const SWIPE_CLOSE_PX = 100;
const PAUSE_HOURS = 6; // fechou um anúncio: nenhum outro aparece nesse período

function readState() {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "{}");
    return { dismissed: parsed.dismissed ?? {}, shown: parsed.shown ?? {}, closedAt: parsed.closedAt ?? 0 };
  } catch {
    return { dismissed: {}, shown: {}, closedAt: 0 };
  }
}

function writeState(state) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignora quota / privacidade do browser
  }
}

const sameDay = (ts) => ts && new Date(ts).toDateString() === new Date().toDateString();

// Escolhe o anúncio da aba: mantém o mesmo durante o dia e roda pro menos visto no dia seguinte.
function pickAd(tab, accountDays, state) {
  const now = Date.now();
  const candidates = upsellAds.filter(
    (ad) =>
      ad.tabs.includes(tab) &&
      accountDays >= ad.minDays &&
      !(state.dismissed[ad.id] && now - state.dismissed[ad.id] < SNOOZE_DAYS * DAY),
  );
  const today = candidates.find((ad) => sameDay(state.shown[ad.id]));
  if (today) return today;
  // sort é estável: empate mantém a ordem de prioridade do catálogo
  return [...candidates].sort((a, b) => (state.shown[a.id] ?? 0) - (state.shown[b.id] ?? 0))[0] ?? null;
}

// Anúncio flutuante no topo, logo abaixo do header: centralizado no celular, na posição do SurveyBanner em telas grandes. Fecha no × ou arrastando pro lado. Só pra conta free.
export default function UpsellBanner({ selectedTab }) {
  const { user, profile } = useUser();
  const [ad, setAd] = useState(null);
  const [dx, setDx] = useState(0);
  const drag = useRef(null); // { startX, moved }

  const eligible =
    profile?.role === "free" && !profile.legacy_plan_until && !plansBlockedFor(user?.email) && user?.created_at;

  useEffect(() => {
    if (!eligible) return setAd(null);
    const accountDays = (Date.now() - new Date(user.created_at).getTime()) / DAY;
    const state = readState();
    if (Date.now() - state.closedAt < PAUSE_HOURS * 3600000) return setAd(null);
    const next = pickAd(selectedTab, accountDays, state);
    if (next && !sameDay(state.shown[next.id])) {
      state.shown[next.id] = Date.now();
      writeState(state);
    }
    setAd(next);
    setDx(0);
  }, [eligible, selectedTab, user?.created_at]);

  if (!ad) return null;

  const dismiss = () => {
    const state = readState();
    state.dismissed[ad.id] = Date.now();
    state.closedAt = Date.now();
    writeState(state);
    setAd(null);
  };

  const onPointerDown = (e) => {
    drag.current = { startX: e.clientX, moved: false };
  };
  const onPointerMove = (e) => {
    if (!drag.current) return;
    const delta = e.clientX - drag.current.startX;
    if (!drag.current.moved && Math.abs(delta) > 5) {
      drag.current.moved = true;
      e.currentTarget.setPointerCapture(e.pointerId); // só captura ao arrastar, pra não engolir o clique nos botões
    }
    if (drag.current.moved) setDx(delta);
  };
  const onPointerUp = () => {
    if (!drag.current) return;
    if (Math.abs(dx) > SWIPE_CLOSE_PX) dismiss();
    else setDx(0);
    // mantém "moved" até o click que vem logo depois do pointerup
    setTimeout(() => (drag.current = null));
  };
  const ignoreIfDragged = (e) => {
    if (drag.current?.moved) e.preventDefault();
  };

  return (
    <div
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onClickCapture={ignoreIfDragged}
      style={{
        transform: `translateX(${dx}px)`,
        opacity: 1 - Math.min(Math.abs(dx) / (SWIPE_CLOSE_PX * 2), 0.7),
        transition: drag.current?.moved ? "none" : "transform 0.2s, opacity 0.2s",
      }}
      className="fixed top-[92px] left-1/2 -translate-x-1/2 lg:left-[272px] lg:translate-x-0 z-[151] w-[calc(100%-16px)] sm:w-[calc(100%-32px)] sm:max-w-sm lg:w-[calc(70dvw-256px)] lg:max-w-3xl touch-pan-y select-none cursor-grab active:cursor-grabbing flex items-center gap-3 px-3 py-2 bg-[var(--background)] border-2 border-[var(--high-translucid)] rounded-2xl shadow-[0_8px_32px_var(--shadow)]"
    >
      <FaBolt className="text-lg shrink-0 hidden xs:block text-[var(--red)]" />
      <div className="flex-1 min-w-0 text-xs leading-snug">
        <strong className="block text-sm">{ad.title}</strong>
        {ad.text}
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <Link href={ad.href} onClick={dismiss} className="text-center cta-button text-xs whitespace-nowrap">
          {ad.cta}
        </Link>
        <button type="button" onClick={dismiss} aria-label="Fechar anúncio" className="cursor-pointer p-1.5 opacity-60 hover:opacity-100">
          <FaTimes />
        </button>
      </div>
    </div>
  );
}
