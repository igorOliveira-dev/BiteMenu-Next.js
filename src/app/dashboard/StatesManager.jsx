// src/components/StatesManager.jsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import useMenu from "@/hooks/useMenu";
import Dashboard from "./page";
import Loading from "@/components/Loading";

/**
 * StatesManager
 *
 * - centraliza localState e serverState (vindo de useMenu)
 * - calcula changedFields (shallow) e mostra um popup com ações:
 *    - Salvar tudo -> chama onSave (se fornecido) ou console.log
 *    - Descartar tudo -> reverte localState para serverState
 *    - Reverter campo -> reverte um campo específico
 *
 * Props:
 *  - keys: lista de chaves que serão monitoradas (padrão já incluído)
 *  - onSave: função async(localState, serverState) => { ... } (opcional)
 *
 * Uso: coloque esse componente no lugar onde antes você renderizava o Dashboard.
 */
export default function StatesManager({
  keys = [
    "title",
    "description",
    "backgroundColor",
    "titleColor",
    "detailsColor",
    "bannerFile",
    "logoFile",
    "slug",
    "selectedServices",
    "hours",
  ],
  onSave,
}) {
  const { menu: menuFromServer, loading } = useMenu();

  // serverState: o que está no banco (normalizado)
  const [serverState, setServerState] = useState(null);

  // localState: o que o usuário está editando
  const [localState, setLocalState] = useState(null);

  // salvar / loading
  const [saving, setSaving] = useState(false);

  // carregando menuFromServer -> inicializa serverState/localState
  useEffect(() => {
    if (!menuFromServer) return;
    const normalized = {
      title: menuFromServer.title ?? "",
      description: menuFromServer.description ?? "",
      backgroundColor: menuFromServer.background_color ?? "#F8F9FA",
      titleColor: menuFromServer.title_color ?? "#007BFF",
      detailsColor: menuFromServer.details_color ?? "#28A745",
      bannerFile: menuFromServer.banner_url ?? null,
      logoFile: menuFromServer.logo_url ?? null,
      slug: menuFromServer.slug ?? "",
      selectedServices: menuFromServer.services ?? [],
      hours: menuFromServer.hours ?? null,
    };
    setServerState(normalized);
    setLocalState(normalized);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [menuFromServer?.id]);

  // util: compara shallow (primitivos, arrays por stringify, File por name/size)
  function detectChanges(local, server, watchKeys = []) {
    if (!local || !server) return [];
    const diffs = [];
    for (const k of watchKeys) {
      const lv = local[k];
      const sv = server[k];

      // arquivos - compara por tipo/nome/size quando File
      if (lv instanceof File || sv instanceof File) {
        const eq =
          lv instanceof File && sv instanceof File && lv.name === sv.name && lv.size === sv.size && lv.type === sv.type;
        if (!eq) diffs.push(k);
        continue;
      }

      // arrays
      if (Array.isArray(lv) || Array.isArray(sv)) {
        if (JSON.stringify(lv || []) !== JSON.stringify(sv || [])) diffs.push(k);
        continue;
      }

      // objetos rasos
      if (lv && typeof lv === "object" && sv && typeof sv === "object") {
        if (JSON.stringify(lv) !== JSON.stringify(sv)) diffs.push(k);
        continue;
      }

      // primitivos
      if ((lv ?? "") !== (sv ?? "")) diffs.push(k);
    }
    return diffs;
  }

  // changedFields (debounced simples)
  // dentro de StatesManager.jsx
  const [changedFields, setChangedFields] = useState([]);
  const timerRef = useRef(null);

  useEffect(() => {
    // se localState ou serverState não estão prontos, garantimos que changedFields esteja vazio
    if (!localState || !serverState) {
      if (changedFields.length !== 0) {
        setChangedFields([]); // só atualiza se realmente houver algo a limpar
      }
      return;
    }

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      const diffs = detectChanges(localState, serverState, keys);
      // só atualiza se diferente (evita criar novo array igual toda vez)
      const same = diffs.length === changedFields.length && diffs.every((d, i) => d === changedFields[i]);

      if (!same) setChangedFields(diffs);
    }, 150);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // added changedFields to deps because we read it above
  }, [localState, serverState, keys, changedFields]);

  // reverter campo
  const revertField = (key) => {
    if (!serverState) return;
    setLocalState((prev) => ({ ...prev, [key]: serverState[key] }));
  };

  // reverter tudo
  const revertAll = () => {
    if (!serverState) return;
    setLocalState({ ...serverState });
  };

  // salvar tudo -> chama onSave(localState, serverState) se fornecido, senão console.log
  const saveAll = async () => {
    if (!localState) return;
    try {
      setSaving(true);
      if (onSave && typeof onSave === "function") {
        await onSave(localState, serverState);
      } else {
        // fallback: log (substitua por sua lógica de upload / supabase)
        console.log("StatesManager.saveAll -> payload:", localState);
        // opcional: simular atraso
        await new Promise((r) => setTimeout(r, 500));
      }
      // após salvar com sucesso, atualiza serverState para o que foi salvo
      setServerState({ ...localState });
      setChangedFields([]);
    } catch (err) {
      console.error("Erro ao salvar:", err);
      // trate com toast/alert aqui se quiser
    } finally {
      setSaving(false);
    }
  };

  // popup de alterações (porta para body)
  const ChangesPopup = () => {
    if (!changedFields || changedFields.length === 0) return null;
    return createPortal(
      <div className="fixed bottom-6 right-6 z-50">
        <div className="bg-white/95 p-4 rounded-lg shadow-lg w-[340px]">
          <div className="flex justify-between items-center mb-2">
            <strong>Alterações não salvas</strong>
            <span className="text-sm text-gray-500">{changedFields.length}</span>
          </div>

          <div className="max-h-44 overflow-auto mb-3">
            <ul className="space-y-2">
              {changedFields.map((key) => (
                <li key={key} className="flex justify-between items-start">
                  <div className="flex-1 mr-3">
                    <div className="font-medium">{key}</div>
                    <div className="text-xs text-gray-500">Server: {String(serverState?.[key] ?? "")?.slice(0, 80)}</div>
                    <div className="text-xs text-gray-800">Local: {String(localState?.[key] ?? "")?.slice(0, 80)}</div>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <button onClick={() => revertField(key)} className="text-xs px-2 py-1 rounded bg-gray-100">
                      Reverter
                    </button>
                    <button
                      onClick={() => {
                        // alias de reverter para "cancelar alteração"
                        revertField(key);
                      }}
                      className="text-xs text-red-600"
                    >
                      Cancelar
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex justify-end gap-2">
            <button onClick={revertAll} className="px-3 py-1 rounded bg-gray-200">
              Descartar tudo
            </button>
            <button onClick={saveAll} className="px-3 py-1 rounded bg-green-600 text-white" disabled={saving}>
              {saving ? "Salvando..." : "Salvar tudo"}
            </button>
          </div>
        </div>
      </div>,
      document.body
    );
  };

  if (loading || !localState) return <Loading />;

  // Rendera o Dashboard original passando menuState como prop (par [localState, setLocalState])
  return (
    <>
      <Dashboard
        menuState={[localState, setLocalState]}
        changedFields={changedFields}
        revertField={revertField}
        saveAll={saveAll}
      />
      {ChangesPopup()}
    </>
  );
}
