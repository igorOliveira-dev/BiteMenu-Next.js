"use client";

import { useEffect, useMemo, useState } from "react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import useMenu from "@/hooks/useMenu";
import { supabase } from "@/lib/supabaseClient";
import { formatCurrency } from "@/lib/formatCurrency";
import { ORDER_STATUS } from "@/lib/staff";

// Aba Agenda (Business): pedidos com data marcada pelo cliente (orders.scheduled_for).
const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const dayKey = (d) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
const SERVICE = { delivery: "Entrega", pickup: "Retirada", dinein: "No local" };

export default function Schedule() {
  const { menu } = useMenu();
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(new Date());

  useEffect(() => {
    if (!menu?.id) return;
    setLoading(true);
    const end = new Date(month.getFullYear(), month.getMonth() + 1, 1);
    supabase
      .from("orders")
      .select("id, costumer_name, costumer_phone, service, address, total, status, scheduled_for")
      .eq("menu_id", menu.id)
      .gte("scheduled_for", month.toISOString())
      .lt("scheduled_for", end.toISOString())
      .order("scheduled_for", { ascending: true })
      .then(({ data, error }) => {
        if (error) console.error("[agenda]", error);
        setOrders(data || []);
        setLoading(false);
      });
  }, [menu?.id, month]);

  const byDay = useMemo(() => {
    const map = {};
    for (const o of orders) (map[dayKey(new Date(o.scheduled_for))] ??= []).push(o);
    return map;
  }, [orders]);

  const cells = useMemo(() => {
    const first = month.getDay();
    const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    return [...Array(first).fill(null), ...Array.from({ length: days }, (_, i) => new Date(month.getFullYear(), month.getMonth(), i + 1))];
  }, [month]);

  const shift = (n) => setMonth((m) => new Date(m.getFullYear(), m.getMonth() + n, 1));
  const dayOrders = byDay[dayKey(selected)] || [];
  const today = dayKey(new Date());

  return (
    <div className="p-4 flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Agenda</h1>
      <div className="rounded-2xl border border-brand-line bg-brand-surface p-4">
        <div className="flex items-center justify-between mb-3">
          <button onClick={() => shift(-1)} className="cursor-pointer p-2 rounded-full hover:bg-[var(--translucid)]" aria-label="Mês anterior">
            <FaChevronLeft />
          </button>
          <strong className="capitalize">{month.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}</strong>
          <button onClick={() => shift(1)} className="cursor-pointer p-2 rounded-full hover:bg-[var(--translucid)]" aria-label="Próximo mês">
            <FaChevronRight />
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-xs opacity-70 mb-1">
          {WEEKDAYS.map((w) => (
            <div key={w}>{w}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((d, i) => {
            if (!d) return <div key={i} />;
            const k = dayKey(d);
            const n = byDay[k]?.length || 0;
            const active = k === dayKey(selected);
            return (
              <button
                key={i}
                onClick={() => setSelected(d)}
                className={`cursor-pointer aspect-square rounded-xl text-sm flex flex-col items-center justify-center border transition ${
                  active ? "bg-brand-gradient bg-brand-gradient-soft text-white font-semibold border-transparent" : "border-brand-line hover:bg-[var(--translucid)]"
                } ${k === today && !active ? "border-brand-select" : ""}`}
              >
                {d.getDate()}
                {n > 0 && <span className={`text-[10px] font-bold ${active ? "" : "text-brand-select"}`}>{n} ped.</span>}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="font-semibold">
          {selected.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}
        </h2>
        {loading ? (
          <p className="opacity-70">Carregando...</p>
        ) : dayOrders.length === 0 ? (
          <p className="opacity-70">Nenhum agendamento neste dia.</p>
        ) : (
          dayOrders.map((o) => (
            <div key={o.id} className="rounded-xl border border-translucid bg-[var(--low-translucid)] p-3 flex flex-col gap-1">
              <div className="flex justify-between gap-2">
                <strong>
                  {new Date(o.scheduled_for).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })} · {o.costumer_name || "Sem nome"}
                </strong>
                <span>{formatCurrency(o.total, menu?.currency)}</span>
              </div>
              <span className="text-sm opacity-80">
                {SERVICE[o.service] || o.service || "—"}
                {o.service === "delivery" && o.address ? ` · ${o.address}` : ""} · {ORDER_STATUS[o.status] ?? "—"}
              </span>
              {o.costumer_phone && <span className="text-sm opacity-80">{o.costumer_phone}</span>}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
