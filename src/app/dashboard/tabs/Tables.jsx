"use client";

import { useEffect, useState } from "react";
import useMenu from "@/hooks/useMenu";
import { supabase } from "@/lib/supabaseClient";
import { useAlert } from "@/providers/AlertProvider";
import { useConfirm } from "@/providers/ConfirmProvider";
import GenericModal from "@/components/GenericModal";
import Loading from "@/components/Loading";
import QrCodeModal from "./components/menu/QrCodeModal";
import { FaPlus, FaQrcode, FaTrash, FaChair } from "react-icons/fa";

const Tables = () => {
  const { menu, loading: menuLoading } = useMenu();
  const customAlert = useAlert();
  const confirm = useConfirm();

  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [labelInput, setLabelInput] = useState("Mesa");
  const [quantityInput, setQuantityInput] = useState(1);
  const [saving, setSaving] = useState(false);

  const [qrTable, setQrTable] = useState(null);

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

  const fetchTables = async () => {
    if (!menu?.id) return;

    setLoading(true);

    const { data, error } = await supabase
      .from("tables")
      .select("*")
      .eq("menu_id", menu.id)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Erro ao buscar mesas:", error);
      customAlert("Erro ao carregar mesas.", "error");
    }

    setTables(data || []);
    setLoading(false);
  };

  useEffect(() => {
    if (menu?.id) fetchTables();
  }, [menu?.id]);

  const openCreateModal = () => {
    setLabelInput("Mesa");
    setQuantityInput(1);
    setIsCreateOpen(true);
  };

  const createTables = async () => {
    const prefix = labelInput.trim();

    if (prefix.length < 1) {
      customAlert("Digite um nome para a mesa.", "error");
      return;
    }

    const quantity = Math.max(1, Math.min(50, Number(quantityInput) || 1));

    setSaving(true);

    const rows =
      quantity === 1
        ? [{ menu_id: menu.id, label: prefix }]
        : Array.from({ length: quantity }, (_, i) => ({
            menu_id: menu.id,
            label: `${prefix} ${tables.length + i + 1}`,
          }));

    const { error } = await supabase.from("tables").insert(rows);

    setSaving(false);

    if (error) {
      console.error("Erro ao criar mesa(s):", error);
      customAlert("Erro ao criar mesa(s).", "error");
      return;
    }

    customAlert(quantity === 1 ? "Mesa criada!" : `${quantity} mesas criadas!`, "success");
    setIsCreateOpen(false);
    fetchTables();
  };

  const deleteTable = async (table) => {
    const ok = await confirm(`Remover "${table.label}"? Pedidos já feitos nela continuam salvos normalmente.`);
    if (!ok) return;

    const { error } = await supabase.from("tables").delete().eq("id", table.id);

    if (error) {
      console.error("Erro ao remover mesa:", error);
      customAlert("Erro ao remover mesa.", "error");
      return;
    }

    setTables((prev) => prev.filter((t) => t.id !== table.id));
  };

  if (menuLoading || loading) return <Loading />;

  const qrUrl = qrTable ? `${baseUrl}/menu/${menu.slug}?mesa=${qrTable.id}` : "";
  const qrExternalUrl = qrTable ? `https://external.bitemenu.com.br/menu/${menu.slug}?mesa=${qrTable.id}` : "";

  return (
    <div className="p-4 sm:p-6 flex flex-col gap-4 max-w-[1024px]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Mesas</h2>
          <p className="text-xs color-gray mt-1">
            Crie mesas e baixe o QR Code de cada uma. O cliente escaneia, faz o pedido e ele cai direto na aba Pedidos
            já identificado com a mesa.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="cursor-pointer shrink-0 px-3 py-2 bg-blue-600/80 hover:bg-blue-700/80 text-white font-semibold rounded-lg border-2 border-[var(--translucid)] transition flex items-center gap-2 text-sm"
        >
          <FaPlus /> Nova mesa
        </button>
      </div>

      {tables.length === 0 ? (
        <div className="rounded-2xl border border-translucid bg-[var(--low-translucid)] p-8 flex flex-col items-center gap-2 text-center">
          <FaChair className="text-2xl opacity-60" />
          <p className="text-sm opacity-80">Nenhuma mesa cadastrada ainda.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {tables.map((table) => (
            <div
              key={table.id}
              className="rounded-xl border border-translucid bg-[var(--low-translucid)] p-3 flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <FaChair className="text-lg opacity-70 shrink-0" />
                <span className="font-medium truncate">{table.label}</span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setQrTable(table)}
                  className="cursor-pointer p-2 bg-translucid hover:bg-white/[0.06] rounded-lg border border-translucid transition"
                  aria-label="Ver QR Code"
                >
                  <FaQrcode />
                </button>

                <button
                  onClick={() => deleteTable(table)}
                  className="cursor-pointer p-2 bg-translucid hover:bg-red-600/20 text-red-400 rounded-lg border border-translucid transition"
                  aria-label="Remover mesa"
                >
                  <FaTrash />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {isCreateOpen && (
        <GenericModal title="Nova mesa" onClose={() => setIsCreateOpen(false)} wfull size="sm">
          <div className="flex flex-col gap-4">
            <div>
              <label className="text-xs opacity-80 block mb-1">Nome da mesa</label>
              <input
                type="text"
                value={labelInput}
                onChange={(e) => setLabelInput(e.target.value)}
                className="w-full p-2 rounded-lg bg-translucid border border-translucid outline-none"
                placeholder="Mesa"
              />
            </div>

            <div>
              <label className="text-xs opacity-80 block mb-1">Quantas mesas criar de uma vez</label>
              <input
                type="number"
                min={1}
                max={50}
                value={quantityInput}
                onChange={(e) => setQuantityInput(e.target.value)}
                className="w-full p-2 rounded-lg bg-translucid border border-translucid outline-none"
              />
              <p className="text-xs opacity-60 mt-1">
                Se maior que 1, cria mesas numeradas automaticamente (ex: {labelInput || "Mesa"} {tables.length + 1},{" "}
                {labelInput || "Mesa"} {tables.length + 2}...).
              </p>
            </div>

            <button
              onClick={createTables}
              disabled={saving}
              className="cursor-pointer p-2 bg-blue-600/80 hover:bg-blue-700/80 disabled:opacity-60 text-white font-semibold rounded-lg border-2 border-[var(--translucid)] transition"
            >
              {saving ? "Criando..." : "Criar"}
            </button>
          </div>
        </GenericModal>
      )}

      <QrCodeModal
        isOpen={Boolean(qrTable)}
        onClose={() => setQrTable(null)}
        url={qrUrl}
        externalUrl={qrExternalUrl}
        filename={`mesa-${qrTable?.label || ""}`}
        onToast={customAlert}
      />
    </div>
  );
};

export default Tables;
