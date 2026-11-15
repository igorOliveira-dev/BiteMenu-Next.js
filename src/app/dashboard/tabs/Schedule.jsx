"use client";

import { useEffect, useMemo, useState } from "react";
import { FaChevronLeft, FaChevronRight, FaArrowRight } from "react-icons/fa";
import useMenu from "@/hooks/useMenu";
import { supabase } from "@/lib/supabaseClient";
import { formatCurrency } from "@/lib/formatCurrency";
import { ORDER_STATUS, ORDER_STATUS_STYLE, paidPillClass } from "@/lib/staff";

// Aba Agenda (Business): pedidos com data marcada pelo cliente (orders.scheduled_for).
const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const dayKey = (d) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
const SERVICE = { delivery: "Entrega", pickup: "Retirada", dinein: "No local" };
const FIELDS = "id, order_number, costumer_name, costumer_phone, service, address, total, status, is_paid, scheduled_for";

const timeOf = (iso) => new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

// "Hoje", "Amanhã" ou a data (ex.: "sex., 20/11")
function dayLabel(d) {
  const diff = Math.round((startOfDay(d) - startOfDay(new Date())) / 86400000);
  if (diff === 0) return "Hoje";
  if (diff === 1) return "Amanhã";
  return d.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit" });
}

// Mesma regra da aba Pedidos: pedido Stripe só aparece depois de pago
const visibleOrders = (menuId) =>
  supabase.from("orders").select(FIELDS).eq("menu_id", menuId).or("payment_method.neq.stripe,is_paid.eq.true");

// onOpenOrder(id): abre o pedido na aba Pedidos
export default function Schedule({ onOpenOrder }) {
  const { menu } = useMenu();
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [orders, setOrders] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(new Date());

  useEffect(() => {
    if (!menu?.id) return;
    setLoading(true);
    const end = new Date(month.getFullYear(), month.getMonth() + 1, 1);
    visibleOrders(menu.id)
      .gte("scheduled_for", month.toISOString())
      .lt("scheduled_for", end.toISOString())
      .order("scheduled_for", { ascending: true })
      .then(({ data, error }) => {
        if (error) console.error("[agenda]", error);
        setOrders(data || []);
        setLoading(false);
      });
  }, [menu?.id, month]);

  // Próximos agendamentos, de qualquer mês
  useEffect(() => {
    if (!menu?.id) return;
    visibleOrders(menu.id)
      .gte("scheduled_for", new Date().toISOString())
      .order("scheduled_for", { ascending: true })
      .limit(5)
      .then(({ data, error }) => {
        if (error) console.error("[agenda]", error);
        setUpcoming(data || []);
      });
  }, [menu?.id]);

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

  // Mostra o dia no calendário (troca de mês se preciso) e na lista
  const goToDay = (d) => {
    setMonth(new Date(d.getFullYear(), d.getMonth(), 1));
    setSelected(d);
  };
  // Trocar de mês leva a seleção junto, pra lista nunca mostrar um dia fora do calendário
  const shift = (n) => {
    const m = new Date(month.getFullYear(), month.getMonth() + n, 1);
    const now = new Date();
    goToDay(m.getFullYear() === now.getFullYear() && m.getMonth() === now.getMonth() ? now : m);
  };

  const now = new Date();
  const today = dayKey(now);
  const todayStart = startOfDay(now);
  const dayOrders = byDay[dayKey(selected)] || [];
  const dayTotal = dayOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);

  return (
    <div className="p-4 flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-bold">Agenda</h1>
        <p className="text-sm color-gray">Pedidos com data marcada pelo cliente. Escolha um dia para ver os pedidos dele.</p>
      </div>

      {upcoming.length > 0 && (
        <div>
          <h2 className="font-semibold mb-2">Próximos agendamentos</h2>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {upcoming.map((o) => {
              const d = new Date(o.scheduled_for);
              return (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => goToDay(d)}
                  className="cursor-pointer shrink-0 rounded-xl border border-brand-line bg-brand-surface px-3 py-2 text-left text-sm transition hover:bg-[var(--translucid)]"
                >
                  <span className="block font-semibold text-brand-select">
                    {dayLabel(d)} · {timeOf(o.scheduled_for)}
                  </span>
                  <span className="block max-w-[180px] truncate">{o.costumer_name || "Sem nome"}</span>
                  <span className="block color-gray">{formatCurrency(o.total, menu?.currency)}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
        <div className="rounded-2xl border border-brand-line bg-brand-surface p-4">
          <div className="flex items-center justify-between gap-2 mb-3">
            <button onClick={() => shift(-1)} className="cursor-pointer p-2 rounded-full hover:bg-[var(--translucid)]" aria-label="Mês anterior">
              <FaChevronLeft />
            </button>
            <div className="flex items-center gap-2">
              <strong className="capitalize">{month.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}</strong>
              {dayKey(selected) !== today && (
                <button
                  type="button"
                  onClick={() => goToDay(new Date())}
                  className="cursor-pointer rounded-full border border-brand-line px-2.5 py-0.5 text-xs hover:bg-[var(--translucid)]"
                >
                  Hoje
                </button>
              )}
            </div>
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
              const past = d < todayStart;
              return (
                <button
                  key={i}
                  onClick={() => setSelected(d)}
                  aria-label={`${d.toLocaleDateString("pt-BR", { day: "2-digit", month: "long" })}, ${n} ${n === 1 ? "pedido" : "pedidos"}`}
                  className={`cursor-pointer aspect-square rounded-xl text-sm flex flex-col items-center justify-center gap-0.5 border transition ${
                    active ? "bg-brand-gradient bg-brand-gradient-soft text-white font-semibold border-transparent" : "border-brand-line hover:bg-[var(--translucid)]"
                  } ${k === today && !active ? "border-brand-select" : ""} ${past && !active ? "opacity-60" : ""}`}
                >
                  {d.getDate()}
                  {n > 0 && (
                    <span className={`rounded-full px-1.5 text-[10px] font-bold leading-4 ${active ? "bg-white/25" : "bg-brand-select text-white"}`}>
                      {n}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <p className="mt-3 text-xs color-gray">O número em cada dia é a quantidade de pedidos agendados.</p>
        </div>

        <div className="flex flex-col gap-2">
          <div>
            <h2 className="font-semibold capitalize">
              {dayKey(selected) === today ? "Hoje · " : ""}
              {selected.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}
            </h2>
            {!loading && dayOrders.length > 0 && (
              <p className="text-sm color-gray">
                {dayOrders.length} {dayOrders.length === 1 ? "pedido" : "pedidos"} · {formatCurrency(dayTotal, menu?.currency)}
              </p>
            )}
          </div>
          {loading ? (
            <p className="opacity-70">Carregando...</p>
          ) : dayOrders.length === 0 ? (
            <p className="opacity-70">Nenhum agendamento neste dia.</p>
          ) : (
            dayOrders.map((o) => {
              const style = ORDER_STATUS_STYLE[o.status] ?? ORDER_STATUS_STYLE.received;
              return (
                <div key={o.id} className="rounded-xl border border-translucid bg-[var(--low-translucid)] p-3 flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xl font-bold leading-none">{timeOf(o.scheduled_for)}</p>
                      <p className="mt-1.5 truncate font-semibold">{o.costumer_name || "Sem nome"}</p>
                      <p className="text-xs color-gray">Pedido Nº {o.order_number ?? "—"}</p>
                    </div>
                    <p className="shrink-0 font-semibold">{formatCurrency(o.total, menu?.currency)}</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${style.pill}`}>{ORDER_STATUS[o.status] ?? "—"}</span>
                    <span className={paidPillClass(o.is_paid)}>{o.is_paid ? "Pago" : "Pagamento pendente"}</span>
                    {new Date(o.scheduled_for) < now && (
                      <span className="rounded-full bg-brand-red/12 px-2.5 py-1 text-xs font-semibold text-brand-red">Horário já passou</span>
                    )}
                  </div>

                  <p className="text-sm opacity-80">
                    {SERVICE[o.service] || o.service || "—"}
                    {o.service === "delivery" && o.address ? ` · ${o.address}` : ""}
                    {o.costumer_phone ? ` · ${o.costumer_phone}` : ""}
                  </p>

                  {onOpenOrder && (
                    <button
                      type="button"
                      onClick={() => onOpenOrder(o.id)}
                      className="cursor-pointer self-start inline-flex items-center gap-2 rounded-full border border-brand-line px-3 py-1.5 text-sm font-semibold transition hover:bg-[var(--translucid)]"
                    >
                      Abrir em Pedidos <FaArrowRight size={12} />
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
