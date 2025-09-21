// src/components/StatesManager.jsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { supabase } from "@/lib/supabaseClient";
import useMenu from "@/hooks/useMenu";
import Dashboard from "./page"; // ajuste se necessário
import Loading from "@/components/Loading";
import { useAlert } from "@/providers/AlertProvider";

/**
 * StatesManager (versão com checagem de auth e tratamento RLS/storage)
 *
 * Ajuste BUCKET_NAME se necessário (use env NEXT_PUBLIC_SUPABASE_BUCKET).
 */
const BUCKET_NAME = process.env.NEXT_PUBLIC_SUPABASE_BUCKET || "menus";
const TABLE_NAME = "menus";

function stableStringify(value) {
  if (value === null || value === undefined) return String(value);
  if (typeof value !== "object") return String(value);
  if (Array.isArray(value)) return "[" + value.map((v) => stableStringify(v)).join(",") + "]";
  const keys = Object.keys(value).sort();
  return "{" + keys.map((k) => JSON.stringify(k) + ":" + stableStringify(value[k])).join(",") + "}";
}

function detectChanges(local, server, watchKeys = []) {
  if (!local || !server) return [];
  const diffs = [];
  for (const key of watchKeys) {
    const lv = local[key];
    const sv = server[key];

    if (lv instanceof File) {
      if (typeof sv === "string" && sv && sv.includes(lv.name)) {
        // opcional: considerar igual
      } else {
        diffs.push(key);
      }
      continue;
    }

    if (Array.isArray(lv) || Array.isArray(sv) || (lv && typeof lv === "object") || (sv && typeof sv === "object")) {
      if (stableStringify(lv) !== stableStringify(sv)) diffs.push(key);
      continue;
    }

    if ((lv ?? "") !== (sv ?? "")) diffs.push(key);
  }
  return diffs.sort();
}

/* ---------------- path helpers ---------------- */
function normalizeFolderPrefix(prefix, bucketName) {
  if (!prefix) return "";
  let p = String(prefix).replace(/^\/+|\/+$/g, "");
  if (bucketName && p.startsWith(bucketName + "/")) p = p.slice(bucketName.length + 1);
  const parts = p.split("/").filter(Boolean);
  if (bucketName && parts[0] === bucketName) parts.shift();
  return parts.join("/");
}

function buildFilePath(folderPrefix, file) {
  const safePrefix = normalizeFolderPrefix(folderPrefix, BUCKET_NAME);
  const safeName = encodeURIComponent(file.name.replace(/\s+/g, "_"));
  const ts = Date.now();
  return safePrefix ? `${safePrefix}/${ts}_${safeName}` : `${ts}_${safeName}`;
}

/* ---------------- upload helper com logs e checagem auth ---------------- */
async function uploadFileAndGetUrl(file, folderPrefix = "") {
  if (!file) return null;
  const path = buildFilePath(folderPrefix, file);

  console.info("[StatesManager] upload -> bucket/path:", {
    bucket: BUCKET_NAME,
    path,
    fileName: file.name,
    fileSize: file.size,
  });

  // checagem rápida de usuário autenticado (necessário se bucket exigir auth)
  try {
    // supabase v2: supabase.auth.getUser()
    const userRes = await supabase.auth.getUser?.();
    const user = userRes?.data?.user ?? null;
    console.info("[StatesManager] auth.getUser:", user?.id ? user.id : user);
    if (!user) {
      const err = new Error("Usuário não autenticado: upload cancelado.");
      err.code = "NOT_AUTHENTICATED";
      throw err;
    }
  } catch (e) {
    console.warn(
      "[StatesManager] falha ao verificar auth antes do upload (continuando, mas upload provavelmente falhará):",
      e
    );
    // deixamos continuar para que o upload falhe explicitamente e gere logs detalhados.
  }

  try {
    const res = await supabase.storage.from(BUCKET_NAME).upload(path, file, {
      cacheControl: "3600",
      upsert: true,
      contentType: file.type || undefined,
    });

    console.info("[StatesManager] supabase.storage.upload result:", res);

    const { data: uploadData, error: uploadError } = res || {};

    if (uploadError) {
      console.error("[StatesManager] supabase.upload error (raw):", uploadError);
      try {
        console.error(
          "[StatesManager] supabase.upload error (stringified):",
          JSON.stringify(uploadError, Object.getOwnPropertyNames(uploadError))
        );
      } catch (e) {
        console.warn("[StatesManager] falha ao stringificar uploadError:", e);
      }
      const err = new Error("Supabase storage upload error");
      err.details = uploadError;
      err._uploadContext = { path, fileName: file.name, fileType: file.type, fileSize: file.size };
      throw err;
    }

    // getPublicUrl
    const publicRes = await supabase.storage.from(BUCKET_NAME).getPublicUrl(path);
    console.info("[StatesManager] supabase.getPublicUrl result:", publicRes);
    if (publicRes?.error) {
      console.error("[StatesManager] supabase.getPublicUrl error:", publicRes.error);
      throw publicRes.error;
    }

    return publicRes?.data?.publicUrl ?? publicRes?.data?.publicURL ?? null;
  } catch (err) {
    console.error("[StatesManager] uploadFileAndGetUrl caught error:", err, "context:", err?._uploadContext);
    throw err;
  }
}

/* ---------------- componente principal ---------------- */
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
  defaultFolderPrefix,
}) {
  const { menu: menuFromServer, loading } = useMenu();
  const customAlert = useAlert();

  const [serverState, setServerState] = useState(null);
  const [localState, setLocalState] = useState(null);
  const [changedFields, setChangedFields] = useState([]);
  const [saving, setSaving] = useState(false);

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

  const timerRef = useRef(null);
  useEffect(() => {
    if (!localState || !serverState) {
      if (changedFields.length !== 0) setChangedFields([]);
      return;
    }
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      const diffs = detectChanges(localState, serverState, keys);
      const same = JSON.stringify(diffs) === JSON.stringify(changedFields);
      if (!same) setChangedFields(diffs);
    }, 150);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [localState, serverState, keys, changedFields]);

  const revertField = (key) => {
    if (!serverState) return;
    setLocalState((prev) => ({ ...prev, [key]: serverState[key] }));
    customAlert?.(`${key} revertido para o valor do servidor.`);
  };

  const revertAll = () => {
    if (!serverState) return;
    setLocalState({ ...serverState });
    customAlert?.("Alterações descartadas");
  };

  const saveAll = async () => {
    if (!localState) return;

    try {
      setSaving(true);

      // checar usuário autenticado ANTES de tentar upload/DB
      const userRes = await supabase.auth.getUser?.();
      const user = userRes?.data?.user ?? null;
      if (!user) {
        customAlert?.("Você precisa estar logado para salvar alterações.", "error");
        setSaving(false);
        return;
      }

      // payload
      const payload = {
        title: localState.title,
        description: localState.description,
        background_color: localState.backgroundColor,
        title_color: localState.titleColor,
        details_color: localState.detailsColor,
        slug: localState.slug,
        services: localState.selectedServices,
        hours: localState.hours,
      };

      // folderPrefix: use prop defaultFolderPrefix se fornecida, senão userId/menuId
      const folderPrefix = defaultFolderPrefix ?? `${user.id}/${menuFromServer?.id ?? "temp"}`;
      console.info("[StatesManager] saving -> folderPrefix:", folderPrefix);

      // uploads
      let bannerUrl = null;
      let logoUrl = null;

      if (localState.bannerFile instanceof File) {
        bannerUrl = await uploadFileAndGetUrl(localState.bannerFile, folderPrefix);
      } else if (typeof localState.bannerFile === "string") {
        bannerUrl = localState.bannerFile;
      } else {
        bannerUrl = null;
      }

      if (localState.logoFile instanceof File) {
        logoUrl = await uploadFileAndGetUrl(localState.logoFile, folderPrefix);
      } else if (typeof localState.logoFile === "string") {
        logoUrl = localState.logoFile;
      } else {
        logoUrl = null;
      }

      payload.banner_url = bannerUrl;
      payload.logo_url = logoUrl;

      // Atualizar DB — RLS pode bloquear se 'user' não for owner ou se token ausente
      if (menuFromServer?.id) {
        const { data, error } = await supabase
          .from(TABLE_NAME)
          .update(payload)
          .eq("id", menuFromServer.id)
          .select()
          .single();

        if (error) {
          // Erro comum: RLS (row-level security) bloqueou a atualização
          console.error("[StatesManager] supabase update error:", error);
          // Mensagem clara para o dev / usuário
          if (error?.message?.toLowerCase()?.includes("row-level")) {
            customAlert?.(
              "Atualização bloqueada por políticas de segurança do banco (RLS). Verifique se o usuário é o owner do menu.",
              "error"
            );
          } else {
            customAlert?.("Erro ao atualizar menu. Veja o console para detalhes.", "error");
          }
          throw error;
        }

        const normalized = {
          title: data.title ?? "",
          description: data.description ?? "",
          backgroundColor: data.background_color ?? "#F8F9FA",
          titleColor: data.title_color ?? "#007BFF",
          detailsColor: data.details_color ?? "#28A745",
          bannerFile: data.banner_url ?? null,
          logoFile: data.logo_url ?? null,
          slug: data.slug ?? "",
          selectedServices: data.services ?? [],
          hours: data.hours ?? null,
        };

        setServerState(normalized);
        setLocalState(normalized);
        setChangedFields([]);
        customAlert?.("Alterações salvas com sucesso.");
        if (typeof onSave === "function") onSave(normalized);
      } else {
        // insert (caso sem menuFromServer.id)
        const { data, error } = await supabase.from(TABLE_NAME).insert(payload).select().single();

        if (error) {
          console.error("[StatesManager] supabase insert error:", error);
          customAlert?.("Erro ao criar menu. Veja o console.", "error");
          throw error;
        }

        const normalized = {
          title: data.title ?? "",
          description: data.description ?? "",
          backgroundColor: data.background_color ?? "#F8F9FA",
          titleColor: data.title_color ?? "#007BFF",
          detailsColor: data.details_color ?? "#28A745",
          bannerFile: data.banner_url ?? null,
          logoFile: data.logo_url ?? null,
          slug: data.slug ?? "",
          selectedServices: data.services ?? [],
          hours: data.hours ?? null,
        };

        setServerState(normalized);
        setLocalState(normalized);
        setChangedFields([]);
        customAlert?.("Cardápio criado e salvo com sucesso.");
        if (typeof onSave === "function") onSave(normalized);
      }
    } catch (err) {
      console.error("[StatesManager] saveAll error (detailed):", err);
      // mensagem para usuário já enviada acima em casos específicos; aqui falamos genericamente
      if (!customAlert) window.alert("Erro ao salvar alterações. Veja o console para detalhes.");
    } finally {
      setSaving(false);
    }
  };

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
                    <button onClick={() => revertField(key)} className="text-xs text-red-600">
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
