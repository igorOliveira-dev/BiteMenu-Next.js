"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Loading from "@/components/Loading";
import Return from "@/components/Return";

export default function AdminMotivosCancelamentoPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("cancellation_reasons")
      .select("*")
      .order("created_at", { ascending: false })
      .then(async ({ data, error }) => {
        if (error || !data) {
          setLoading(false);
          return;
        }

        const userIds = [...new Set(data.map((r) => r.user_id))];
        const { data: profiles } = await supabase.from("profiles").select("id, display_name, email").in("id", userIds);

        setRows(
          data.map((r) => {
            const prof = profiles?.find((p) => p.id === r.user_id);
            return { ...r, name: prof?.display_name || "Sem nome", email: prof?.email || "" };
          }),
        );
        setLoading(false);
      });
  }, []);

  if (loading) return <Loading />;

  const counts = {};
  rows.forEach((r) => r.reason && (counts[r.reason] = (counts[r.reason] || 0) + 1));
  const ranked = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const maxCount = Math.max(...Object.values(counts), 1);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-2">
        <Return />
        <div>
          <h1 className="text-xl font-bold">Motivos de cancelamento</h1>
          <p className="text-sm" style={{ color: "var(--gray)" }}>
            {rows.length} {rows.length === 1 ? "resposta" : "respostas"}
          </p>
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm" style={{ color: "var(--gray)" }}>
          Nenhuma resposta ainda.
        </p>
      ) : (
        <>
          <div className="rounded-3xl border-2 bg-translucid border-[var(--translucid)] px-5 py-4 space-y-3">
            {ranked.map(([reason, count]) => (
              <div key={reason} className="space-y-1">
                <div className="flex items-center justify-between text-sm gap-3">
                  <span className="flex-1 truncate">{reason}</span>
                  <span className="shrink-0 text-xs font-mono" style={{ color: "var(--gray)" }}>
                    {count}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-[var(--translucid)]">
                  <div
                    className="h-2 rounded-full bg-red-500/60"
                    style={{ width: `${Math.round((count / maxCount) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <ul className="space-y-2">
            {rows.map((r) => (
              <li key={r.id} className="p-4 rounded-2xl bg-translucid border-2 border-[var(--translucid)] text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold">{r.name}</span>
                  {r.plan && <span className="text-xs font-mono">({r.plan})</span>}
                  <span className="text-xs ml-auto font-mono" style={{ color: "var(--gray)" }}>
                    {new Date(r.created_at).toLocaleString("pt-BR")}
                  </span>
                </div>
                {r.email && (
                  <p className="text-xs" style={{ color: "var(--gray)" }}>
                    {r.email}
                  </p>
                )}
                {r.reason && <p className="mt-2">{r.reason}</p>}
                {r.comment && <p className="mt-1 italic">“{r.comment}”</p>}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
