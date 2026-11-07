"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Loading from "@/components/Loading";
import Return from "@/components/Return";

const fmt = (d) => (d ? new Date(d).toLocaleString("pt-BR") : "—");

export default function AdminClientesPage() {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [sortByPurchases, setSortByPurchases] = useState(false);

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data }) =>
        fetch("/api/admin/clientes", { headers: { Authorization: `Bearer ${data.session?.access_token}` } }),
      )
      .then(async (res) => (res.ok ? setRows(await res.json()) : setError((await res.json()).error || "Erro")))
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <p className="p-4 text-center text-red-500">{error}</p>;
  if (!rows) return <Loading />;

  const s = search.trim().toLowerCase();
  const visible = rows
    .filter((r) => !s || [r.name, r.email, r.phone, r.cep].some((v) => v?.toLowerCase().includes(s)))
    .sort((a, b) =>
      sortByPurchases
        ? b.purchases - a.purchases
        : new Date(b.created_at || 0) - new Date(a.created_at || 0),
    );
  const buyers = rows.filter((r) => r.purchases > 0).length;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-2">
        <Return />
        <div>
          <h1 className="text-xl font-bold">Clientes (não donos)</h1>
          <p className="text-sm" style={{ color: "var(--gray)" }}>
            {rows.length} contas · {buyers} já compraram
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Nome, e-mail, telefone ou CEP..."
          className="px-3 py-1 w-full rounded bg-translucid border border-translucid text-sm"
        />
        <label className="flex items-center gap-2 text-sm text-gray-300">
          Ordenar por nº de compras
          <input
            type="checkbox"
            checked={sortByPurchases}
            onChange={(e) => setSortByPurchases(e.target.checked)}
            className="toggle toggle-primary"
          />
        </label>
      </div>

      {visible.length === 0 ? (
        <p className="text-sm" style={{ color: "var(--gray)" }}>
          Nenhum cliente encontrado.
        </p>
      ) : (
        <ul className="space-y-2">
          {visible.map((r) => {
            const a = r.address || {};
            const address = [a.street, a.number, a.neighborhood, a.city].filter(Boolean).join(", ");
            return (
              <li key={r.id} className="p-4 rounded-2xl bg-translucid border border-[var(--translucid)] text-sm space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold">{r.name || "Sem nome"}</span>
                  {r.deletion_requested_at && <span className="text-xs text-red-500">exclusão solicitada</span>}
                  <span className="text-xs ml-auto font-mono" style={{ color: "var(--gray)" }}>
                    {r.purchases} {r.purchases === 1 ? "compra" : "compras"}
                  </span>
                </div>
                <p className="text-xs" style={{ color: "var(--gray)" }}>
                  {r.email} {r.phone && <>· {r.phone}</>} {r.cep && <>· CEP {r.cep}</>}
                </p>
                {address && (
                  <p className="text-xs" style={{ color: "var(--gray)" }}>
                    {address}
                  </p>
                )}
                <p className="text-xs font-mono" style={{ color: "var(--gray)" }}>
                  cadastro: {fmt(r.created_at)} · última compra: {fmt(r.last_purchase_at)}
                  {r.marketing_opt_out_at && " · sem marketing"}
                </p>
                {r.phone && (
                  <a href={`https://wa.me/${r.phone.replace(/\D/g, "")}`} target="_blank" className="underline text-brand-red text-xs">
                    whatsapp
                  </a>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
