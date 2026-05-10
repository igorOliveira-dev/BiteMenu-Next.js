"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Loading from "@/components/Loading";
import Return from "@/components/Return";

const QUESTIONS = [
  {
    key: "establishment_type",
    title: "Tipo de estabelecimento",
    options: ["Restaurante", "Bar", "Doceria", "Lanchonete", "Cafeteria", "Outro"],
    multi: false,
  },
  {
    key: "units_count",
    title: "Unidades gerenciadas",
    options: ["1", "2 a 5", "6 a 20", "Mais de 20"],
    multi: false,
  },
  {
    key: "main_uses",
    title: "Para que mais usa o Bite Menu",
    options: [
      "Cardápio digital na mesa (QR code)",
      "Cardápio para delivery",
      "Receber pedidos pelo WhatsApp",
      "Cardápio para redes sociais",
      "Controle interno de produtos e preços",
    ],
    multi: true,
  },
  {
    key: "update_frequency",
    title: "Frequência de atualização do cardápio",
    options: [
      "Todo dia ou quase isso",
      "Uma vez por semana",
      "Raramente",
      "Nunca mexi desde que configurei",
    ],
    multi: false,
  },
  {
    key: "improvements",
    title: "O que melhorou no negócio",
    options: [
      "Processo ficou mais organizado",
      "Clientes pedem com mais facilidade",
      "Reduzi custos com plataformas de delivery",
      "Passei uma imagem mais profissional",
      "Aumentei meu ticket médio",
      "Ainda não percebi diferença",
    ],
    multi: true,
  },
  {
    key: "has_referred",
    title: "Indicou o Bite Menu para alguém",
    options: ["Sim, já indiquei", "Não, mas indicaria", "Não indicaria ainda"],
    multi: false,
  },
];

function countOptions(rows, key, multi) {
  const counts = {};
  for (const row of rows) {
    const val = row[key];
    if (multi && Array.isArray(val)) {
      val.forEach((v) => { counts[v] = (counts[v] || 0) + 1; });
    } else if (val) {
      counts[val] = (counts[val] || 0) + 1;
    }
  }
  return counts;
}

function QuestionCard({ question, rows }) {
  const counts = countOptions(rows, question.key, question.multi);
  const total = rows.length;
  const maxCount = Math.max(...Object.values(counts), 1);

  const optionsToShow = [...question.options];
  // Add any "other" values not in the preset list
  Object.keys(counts).forEach((k) => {
    if (!optionsToShow.includes(k)) optionsToShow.push(k);
  });

  return (
    <div className="rounded-3xl border-2 bg-translucid border-[var(--translucid)] overflow-hidden">
      <div className="px-5 py-4 border-b border-[var(--translucid)]">
        <p className="font-semibold text-sm">{question.title}</p>
        {question.multi && (
          <p className="text-xs mt-0.5" style={{ color: "var(--gray)" }}>múltipla escolha</p>
        )}
      </div>
      <div className="px-5 py-4 space-y-3">
        {optionsToShow.map((opt) => {
          const count = counts[opt] || 0;
          const pct = total > 0 ? Math.round((count / (question.multi ? total : total)) * 100) : 0;
          const barPct = maxCount > 0 ? Math.round((count / maxCount) * 100) : 0;
          return (
            <div key={opt} className="space-y-1">
              <div className="flex items-center justify-between text-sm gap-3">
                <span className="flex-1 truncate">{opt}</span>
                <span className="shrink-0 text-xs font-mono" style={{ color: "var(--gray)" }}>
                  {count} <span className="opacity-60">({pct}%)</span>
                </span>
              </div>
              <div className="h-2 rounded-full bg-[var(--translucid)]">
                <div
                  className="h-2 rounded-full bg-red-500/60 transition-all"
                  style={{ width: `${barPct}%` }}
                />
              </div>
            </div>
          );
        })}
        {optionsToShow.length === 0 && (
          <p className="text-sm" style={{ color: "var(--gray)" }}>Sem respostas ainda.</p>
        )}
      </div>
    </div>
  );
}

export default function AdminPesquisaPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTable, setShowTable] = useState(false);
  const [onlyPaid, setOnlyPaid] = useState(false);

  useEffect(() => {
    supabase
      .from("profile_surveys")
      .select("*")
      .order("created_at", { ascending: false })
      .then(async ({ data, error }) => {
        if (error || !data) { setLoading(false); return; }

        const userIds = data.map((r) => r.user_id);
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, role")
          .in("id", userIds);

        const enriched = data.map((r) => ({
          ...r,
          role: profiles?.find((p) => p.id === r.user_id)?.role ?? "free",
        }));

        setRows(enriched);
        setLoading(false);
      });
  }, []);

  const filtered = onlyPaid ? rows.filter((r) => r.role === "plus" || r.role === "pro") : rows;

  if (loading) return <Loading />;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-2">
        <Return />
        <div>
          <h1 className="text-xl font-bold">Pesquisa de perfil</h1>
          <p className="text-sm" style={{ color: "var(--gray)" }}>
            {rows.length} {rows.length === 1 ? "resposta" : "respostas"} coletadas
          </p>
        </div>
      </div>

      {/* Filtro pagantes */}
      <div className="flex gap-2">
        {[
          { label: `Todos (${rows.length})`, value: false },
          { label: `Pagantes (${rows.filter((r) => r.role === "plus" || r.role === "pro").length})`, value: true },
        ].map((opt) => (
          <button
            key={String(opt.value)}
            onClick={() => setOnlyPaid(opt.value)}
            className="rounded-2xl border-2 px-4 py-2 text-sm transition cursor-pointer"
            style={{ borderColor: onlyPaid === opt.value ? "rgb(239 68 68 / 0.7)" : "var(--translucid)" }}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm" style={{ color: "var(--gray)" }}>Nenhuma resposta ainda.</p>
      ) : (
        <>
          <div className="space-y-4">
            {QUESTIONS.map((q) => (
              <QuestionCard key={q.key} question={q} rows={filtered} />
            ))}

            {/* Funcionalidade que sente falta */}
            <div className="rounded-3xl border-2 bg-translucid border-[var(--translucid)] overflow-hidden">
              <div className="px-5 py-4 border-b border-[var(--translucid)]">
                <p className="font-semibold text-sm">Funcionalidade que sente falta</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--gray)" }}>campo livre</p>
              </div>
              <ul className="px-5 py-4 space-y-2">
                {filtered.filter((r) => r.missing_feature).map((r) => (
                  <li key={r.id} className="text-sm border-b border-[var(--translucid)] pb-2 last:border-0 last:pb-0">
                    {r.missing_feature}
                  </li>
                ))}
                {filtered.filter((r) => r.missing_feature).length === 0 && (
                  <li className="text-sm" style={{ color: "var(--gray)" }}>Nenhuma resposta.</li>
                )}
              </ul>
            </div>
          </div>

          {/* Toggle tabela individual */}
          <button
            onClick={() => setShowTable((v) => !v)}
            className="text-sm underline cursor-pointer"
            style={{ color: "var(--gray)" }}
          >
            {showTable ? "Ocultar" : "Ver"} respostas individuais ({filtered.length})
          </button>

          {showTable && (
            <div className="overflow-x-auto rounded-3xl border-2 border-[var(--translucid)]">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-[var(--translucid)] bg-translucid">
                    <th className="text-left px-4 py-3 font-semibold whitespace-nowrap">Data</th>
                    <th className="text-left px-4 py-3 font-semibold whitespace-nowrap">Plano</th>
                    <th className="text-left px-4 py-3 font-semibold whitespace-nowrap">Tipo</th>
                    <th className="text-left px-4 py-3 font-semibold whitespace-nowrap">Unidades</th>
                    <th className="text-left px-4 py-3 font-semibold whitespace-nowrap">Indicou?</th>
                    <th className="text-left px-4 py-3 font-semibold whitespace-nowrap">Funcionalidade faltando</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => (
                    <tr key={r.id} className="border-b border-[var(--translucid)] last:border-0">
                      <td className="px-4 py-3 whitespace-nowrap" style={{ color: "var(--gray)" }}>
                        {new Date(r.created_at).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap capitalize">{r.role}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {r.establishment_type === "Outro"
                          ? `Outro: ${r.establishment_type_other || "—"}`
                          : r.establishment_type}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">{r.units_count}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{r.has_referred}</td>
                      <td className="px-4 py-3 max-w-[200px] truncate">{r.missing_feature || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
