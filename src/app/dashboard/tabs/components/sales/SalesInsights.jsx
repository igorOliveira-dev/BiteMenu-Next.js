"use client";

import { useState } from "react";
import {
  FaMagic,
  FaLayerGroup,
  FaStar,
  FaCamera,
  FaClock,
  FaTags,
  FaHeart,
  FaDollarSign,
  FaLightbulb,
  FaArrowRight,
  FaChartLine,
} from "react-icons/fa";
import { supabase } from "@/lib/supabaseClient";

// Insights com IA do período aplicado no filtro (tasks/insights-ia). Só é montado para INSIGHTS_ROLES.
const IMPACT = {
  alto: { label: "Impacto alto", pill: "bg-st-done/12 text-st-done", bar: "bg-st-done" },
  medio: { label: "Impacto médio", pill: "bg-info/12 text-info", bar: "bg-info" },
  baixo: { label: "Impacto baixo", pill: "bg-st-wait/12 text-st-wait", bar: "bg-st-wait" },
};

const TYPES = {
  combo: { icon: FaLayerGroup, label: "Combo" },
  destaque: { icon: FaStar, label: "Destaque" },
  foto: { icon: FaCamera, label: "Foto e descrição" },
  horario: { icon: FaClock, label: "Horário" },
  promocao: { icon: FaTags, label: "Promoção" },
  fidelidade: { icon: FaHeart, label: "Fidelidade" },
  preco: { icon: FaDollarSign, label: "Preço" },
  outro: { icon: FaLightbulb, label: "Ideia" },
};

function InsightCard({ it, wide }) {
  const impact = IMPACT[it.impacto] ?? IMPACT.baixo;
  const type = TYPES[it.tipo] ?? TYPES.outro;
  const Icon = type.icon;
  return (
    <div className={`relative overflow-hidden rounded-xl border border-translucid bg-translucid p-4 pl-5 flex flex-col gap-3 ${wide ? "sm:col-span-2" : ""}`}>
      <span className={`absolute left-0 top-0 h-full w-1.5 ${impact.bar}`} aria-hidden />

      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-2 text-xs font-semibold color-gray">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-info/10 text-info">
            <Icon />
          </span>
          {type.label}
        </span>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${impact.pill}`}>{impact.label}</span>
      </div>

      <div>
        {it.numero && <p className="text-2xl font-bold leading-tight">{it.numero}</p>}
        <p className="font-semibold leading-snug mt-0.5">{it.titulo}</p>
        <p className="text-sm color-gray mt-1">{it.dado}</p>
      </div>

      <div className="mt-auto flex items-start gap-2 rounded-lg bg-[var(--translucid)] p-3 text-sm">
        <FaArrowRight className="mt-0.5 shrink-0 text-info" />
        <p>
          <span className="font-semibold">O que fazer: </span>
          {it.acao}
        </p>
      </div>
    </div>
  );
}

export default function SalesInsights({ startDate, endDate }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const generate = async () => {
    if (loading) return;
    setLoading(true);
    setError("");
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const res = await fetch("/api/assistant/insights", {
        method: "POST",
        headers: { Authorization: `Bearer ${session?.access_token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ start: startDate, end: endDate }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Não consegui gerar os insights agora. Tente novamente.");
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const insights = result?.insights || [];

  return (
    <div className="bg-translucid border border-translucid rounded-xl p-4 mb-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-info/10 text-info">
            <FaMagic />
          </span>
          <div>
            <p className="font-semibold">Insights com IA</p>
            <p className="text-sm color-gray">Sugestões para vender mais, a partir das vendas deste período.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={generate}
          disabled={loading}
          className="cursor-pointer py-2 px-4 bg-verde hover:opacity-90 text-white rounded-full transition text-sm disabled:opacity-60 disabled:cursor-wait"
        >
          {loading ? "Analisando..." : result ? "Gerar de novo" : "Gerar insights"}
        </button>
      </div>

      {error && <p className="mt-3 text-sm text-brand-red">{error}</p>}

      {loading && (
        <div className="mt-4 grid gap-3 sm:grid-cols-2" aria-hidden>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className={`h-40 rounded-xl bg-[var(--translucid)] animate-pulse ${i === 0 ? "sm:col-span-2" : ""}`} />
          ))}
        </div>
      )}

      {result && !loading && (
        <div className="mt-4 flex flex-col gap-3">
          {result.resumo && (
            <div className="flex items-start gap-3 rounded-xl bg-info/10 p-3">
              <FaChartLine className="mt-0.5 shrink-0 text-info" />
              <p className="text-sm">{result.resumo}</p>
            </div>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            {insights.map((it, i) => (
              // o primeiro (maior impacto) ocupa a linha toda; com número par de cartões, o último fecharia sozinho
              <InsightCard key={i} it={it} wide={i === 0 && insights.length % 2 === 1} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
