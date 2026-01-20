"use client";

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { supabase } from "@/lib/supabaseClient";
import useMenu from "@/hooks/useMenu";
import Dashboard from "./Dashboard";
import Loading from "@/components/Loading";
import { useAlert } from "@/providers/AlertProvider";
import GenericModal from "@/components/GenericModal";
import { FaChevronLeft } from "react-icons/fa";
import { useConfirm } from "@/providers/ConfirmProvider";

/**
 * StatesManager (versão com checagem de auth e tratamento RLS/storage)
 *
 * Estratégia aplicada: gera nomes únicos para cada upload (timestamp) **e**
 * remove explicitamente o arquivo antigo no bucket depois do upload bem-sucedido.
 * Isso evita acumular lixo no storage enquanto mantém baixa chance de colisão.
 *
 * Ajuste BUCKET_NAME se necessário (use env NEXT_PUBLIC_SUPABASE_BUCKET).
 */
const BUCKET_NAME = process.env.NEXT_PUBLIC_SUPABASE_BUCKET || "menus";
const TABLE_NAME = "menus";
const DEFAULT_BACKGROUND = "#ffffff";

function rgbToHex(rgb) {
  const match = rgb.match(/\d+/g);
  if (!match) return "#ffffff"; // fallback para branco se der erro
  const [r, g, b] = match.map(Number);
  return "#" + [r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("");
}

function getContrastTextColor(hex) {
  const cleanHex = (hex || DEFAULT_BACKGROUND).replace("#", "");
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? "black" : "white";
}

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

    if (key === "deliveryFee") {
      if (Number(lv ?? 0) !== Number(sv ?? 0)) diffs.push(key);
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

/* ---------------- storage helpers (nova estratégia) ---------------- */

// extrai o path interno usado pelo Supabase a partir de uma publicUrl
function getPathFromPublicUrl(publicUrl) {
  if (!publicUrl) return null;
  try {
    const u = new URL(publicUrl);
    // caminho típico: /storage/v1/object/public/<bucket>/<path...>
    const prefix = `/storage/v1/object/public/${BUCKET_NAME}/`;
    const idx = u.pathname.indexOf(prefix);
    if (idx === -1) {
      // fallback: tentar split
      const parts = u.pathname.split(`/storage/v1/object/public/${BUCKET_NAME}/`);
      return parts[1] ? decodeURIComponent(parts[1]) : null;
    }
    return decodeURIComponent(u.pathname.slice(idx + prefix.length));
  } catch (e) {
    console.warn("getPathFromPublicUrl parse error:", e);
    return null;
  }
}

// faz upload com nome único e tenta remover o arquivo antigo (se informado)
async function uploadAndReplace(file, folderPrefix = "", oldPublicUrl = null) {
  if (!file) return null;

  const path = buildFilePath(folderPrefix, file);
  console.info("[StatesManager] uploadAndReplace -> bucket/path:", {
    bucket: BUCKET_NAME,
    path,
    fileName: file.name,
    fileSize: file.size,
  });

  // checar usuário autenticado (importante para buckets privados)
  try {
    const userRes = await supabase.auth.getUser?.();
    const user = userRes?.data?.user ?? null;
    console.info("[StatesManager] auth.getUser:", user?.id ? user.id : user);
    if (!user) {
      const err = new Error("Usuário não autenticado: upload cancelado.");
      err.code = "NOT_AUTHENTICATED";
      throw err;
    }
  } catch (e) {
    console.warn("[StatesManager] falha ao verificar auth antes do upload (continuando):", e);
  }

  // upload
  const { data: uploadData, error: uploadError } = await supabase.storage.from(BUCKET_NAME).upload(path, file, {
    cacheControl: "3600",
    upsert: true,
    contentType: file.type || undefined,
  });

  if (uploadError) {
    console.error("[StatesManager] supabase.upload error:", uploadError);
    throw uploadError;
  }

  // get public url
  const publicRes = await supabase.storage.from(BUCKET_NAME).getPublicUrl(path);
  if (publicRes.error) {
    console.error("[StatesManager] getPublicUrl error:", publicRes.error);
    throw publicRes.error;
  }
  const newPublicUrl = publicRes.data?.publicUrl ?? publicRes.data?.publicURL ?? null;

  // tentar remover o arquivo antigo (não falhar o fluxo principal se remoção falhar)
  try {
    const oldPath = getPathFromPublicUrl(oldPublicUrl);
    if (oldPath && oldPath !== path) {
      const { data: rmData, error: rmError } = await supabase.storage.from(BUCKET_NAME).remove([oldPath]);
      if (rmError) {
        console.warn("[StatesManager] failed to remove old storage object:", rmError);
      } else {
        console.info("[StatesManager] old storage object removed:", oldPath);
      }
    }
  } catch (e) {
    console.warn("[StatesManager] error while removing old file (ignored):", e);
  }

  return newPublicUrl;
}

/* ---------------- componente principal ---------------- */
export default function StatesManager({
  keys = [
    "title",
    "description",
    "address",
    "backgroundColor",
    "titleColor",
    "detailsColor",
    "bannerFile",
    "logoFile",
    "slug",
    "selectedServices",
    "selectedPayments",
    "deliveryFee",
    "hours",
  ],
  onSave,
  defaultFolderPrefix,
}) {
  const { menu: menuFromServer, loading } = useMenu();
  const customAlert = useAlert();
  const confirm = useConfirm();

  const [selectedTab, setSelectedTab] = useState("menu");
  const [tabHistory, setTabHistory] = useState(["menu"]);

  const [showChanges, setShowChanges] = useState(false);

  const [serverState, setServerState] = useState(null);
  const [localState, setLocalState] = useState(0);
  const [changedFields, setChangedFields] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (changedFields.length === 0) return;

    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = "Você tem alterações não salvas. Tem certeza que deseja sair?";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [changedFields]);

  useEffect(() => {
    if (!menuFromServer) return;
    const normalized = {
      title: menuFromServer.title ?? "",
      description: menuFromServer.description ?? "",
      address: menuFromServer.address ?? "",
      backgroundColor: menuFromServer.background_color ?? "#F8F9FA",
      titleColor: menuFromServer.title_color ?? "#007BFF",
      detailsColor: menuFromServer.details_color ?? "#28A745",
      bannerFile: menuFromServer.banner_url ?? null,
      logoFile: menuFromServer.logo_url ?? null,
      slug: menuFromServer.slug ?? "",
      selectedServices: menuFromServer.services ?? [],
      selectedPayments: menuFromServer.payments ?? [],
      deliveryFee: menuFromServer.delivery_fee ?? 0,
      hours: menuFromServer.hours ?? null,
    };
    setServerState(normalized);
    setLocalState(normalized);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [menuFromServer?.id]);

  const timerRef = useRef(null);
  const isPoppingRef = useRef(false);

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

  useEffect(() => {
    setTabHistory((prev) => {
      if (prev[prev.length - 1] !== selectedTab) {
        return [...prev, selectedTab];
      }
      return prev;
    });

    if (isPoppingRef.current) {
      isPoppingRef.current = false;
      return;
    }

    window.history.pushState({ selectedTab }, "", window.location.pathname);
  }, [selectedTab]);

  const revertField = (key) => {
    if (!serverState) return;
    setLocalState((prev) => ({ ...prev, [key]: serverState[key] }));
    customAlert?.(`${key} revertido.`);
  };

  const revertAll = async () => {
    if (!serverState) return;
    const ok = await confirm("Quer mesmo descartar todas as alterações?");
    if (!ok) {
      console.log("[submit] usuário cancelou");
      return;
    }
    setLocalState({ ...serverState });
    customAlert?.("Alterações descartadas");
    setShowChanges(false);
  };

  async function isSlugDuplicated(slug) {
    if (!slug) return false;

    const { data, error } = await supabase.from(TABLE_NAME).select("id").eq("slug", slug).limit(1);

    if (error) {
      console.error("[StatesManager] Erro ao checar slug duplicado:", error);
      return false;
    }

    if (!data || data.length === 0) return false;

    // Se existe e não é o mesmo registro atual → duplicado
    return !menuFromServer?.id || data[0].id !== menuFromServer.id;
  }

  const saveAll = async () => {
    if (!localState) return;

    if (await isSlugDuplicated(localState.slug)) {
      customAlert?.("O slug selecionado já foi usado. Escolha outro.", "error");
      return;
    }

    if (localState.title === "") {
      customAlert?.("O título não pode ficar vazio.", "error");
      return;
    }

    const ok = await confirm("Quer mesmo salvar todas as alterações?");
    if (!ok) {
      console.log("[submit] usuário cancelou");
      return;
    }

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
        address: localState.address,
        background_color: localState.backgroundColor,
        title_color: localState.titleColor,
        details_color: localState.detailsColor,
        slug: localState.slug,
        services: localState.selectedServices,
        payments: localState.selectedPayments,
        delivery_fee: parseFloat(localState.deliveryFee) || 0,
        hours: localState.hours,
      };

      // folderPrefix: use prop defaultFolderPrefix se fornecida, senão userId/menuId
      const folderPrefix = defaultFolderPrefix ?? `${user.id}/${menuFromServer?.id ?? "temp"}`;
      console.info("[StatesManager] saving -> folderPrefix:", folderPrefix);

      // uploads — usando uploadAndReplace que remove o arquivo anterior
      let bannerUrl = null;
      let logoUrl = null;

      if (localState.bannerFile instanceof File) {
        bannerUrl = await uploadAndReplace(localState.bannerFile, folderPrefix, serverState?.bannerFile || null);
      } else if (typeof localState.bannerFile === "string") {
        bannerUrl = localState.bannerFile;
      } else {
        bannerUrl = null;
      }

      if (localState.logoFile instanceof File) {
        logoUrl = await uploadAndReplace(localState.logoFile, folderPrefix, serverState?.logoFile || null);
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
          console.error("[StatesManager] supabase update error:", error);
          if (error?.message?.toLowerCase()?.includes("row-level")) {
            customAlert?.(
              "Atualização bloqueada por políticas de segurança do banco (RLS). Verifique se o usuário é o owner do menu.",
              "error",
            );
          } else {
            customAlert?.("Erro ao atualizar menu. Veja o console para detalhes.", "error");
          }
          throw error;
        }

        const normalized = {
          title: data.title ?? "",
          description: data.description ?? "",
          address: data.address ?? "",
          backgroundColor: data.background_color ?? "#F8F9FA",
          titleColor: data.title_color ?? "#007BFF",
          detailsColor: data.details_color ?? "#28A745",
          bannerFile: data.banner_url ?? null,
          logoFile: data.logo_url ?? null,
          slug: data.slug ?? "",
          selectedServices: data.services ?? [],
          selectedPayments: data.payments ?? [],
          deliveryFee: data.delivery_fee ?? 0,
          hours: data.hours ?? null,
        };

        setServerState(normalized);
        setLocalState(normalized);
        setChangedFields([]);
        customAlert?.("Alterações salvas com sucesso.", "success");
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
          address: data.address ?? "",
          backgroundColor: data.background_color ?? "#F8F9FA",
          titleColor: data.title_color ?? "#007BFF",
          detailsColor: data.details_color ?? "#28A745",
          bannerFile: data.banner_url ?? null,
          logoFile: data.logo_url ?? null,
          slug: data.slug ?? "",
          selectedServices: data.services ?? [],
          selectedPayments: data.payments ?? [],
          deliveryFee: data.delivery_fee ?? 0,
          hours: data.hours ?? null,
        };

        setServerState(normalized);
        setLocalState(normalized);
        setChangedFields([]);
        customAlert?.("Cardápio criado e salvo com sucesso.", "success");
        if (typeof onSave === "function") onSave(normalized);
      }
    } catch (err) {
      console.error("[StatesManager] saveAll error (detailed):", err);
      if (!customAlert) window.alert("Erro ao salvar alterações. Veja o console para detalhes.");
    } finally {
      setSaving(false);
      setShowChanges(false);
    }
  };

  const ChangesPopup = () => {
    if (!changedFields || changedFields.length === 0) return null;

    let backgroundColorToUse = localState.backgroundColor;
    if (selectedTab !== "menu") {
      const bodyBg = getComputedStyle(document.body).backgroundColor;
      backgroundColorToUse = rgbToHex(bodyBg);
    }

    const contrastColor = getContrastTextColor(backgroundColorToUse);

    return createPortal(
      <div
        className={`fixed bottom-22 right-2 lg:bottom-6 w-[340px] z-100
        ${selectedTab === "menu" ? "lg:left-[50%] lg:transform lg:-translate-x-1/2" : ""}
        ${selectedTab === "configMenu" ? "right-4" : ""}
        ${selectedTab === "menu" || selectedTab === "configMenu" ? "" : "hidden"}
        `}
      >
        <div
          className="bg-translucid backdrop-blur-[15px] p-4 rounded-lg shadow-lg w-[340px]"
          style={{
            backgroundColor: contrastColor === "white" ? "#ffffff30" : "#00000030",
            color: contrastColor === "white" ? "#fafafa" : "#171717",
          }}
        >
          <div className="flex justify-between items-center">
            <strong>Alterações não salvas</strong>
            <span className="text-sm">{changedFields.length}</span>
          </div>

          <button
            className="mb-2 underline cursor-pointer"
            style={{
              color: contrastColor === "white" ? "#ccc" : "#171717",
            }}
            onClick={() => setShowChanges(true)}
          >
            Ver alterações
          </button>

          <div className="flex justify-end gap-2">
            <button onClick={revertAll} className="cursor-pointer px-4 py-2 bg-gray-600 text-white rounded">
              Descartar tudo
            </button>
            <button onClick={saveAll} className="cursor-pointer px-4 py-2 bg-green-600 text-white rounded" disabled={saving}>
              {saving ? "Salvando..." : "Salvar tudo"}
            </button>
          </div>
        </div>
      </div>,
      document.body,
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
        selectedTab={selectedTab}
        setSelectedTab={setSelectedTab}
      />
      {ChangesPopup()}
      {showChanges && (
        <GenericModal onClose={() => setShowChanges(false)}>
          <div className="flex flex-col max-h-80 w-full">
            <div className="mb-2">
              <div className="flex items-center gap-4 mb-1">
                <FaChevronLeft className="cursor-pointer" onClick={() => setShowChanges(false)} />
                <h3 className="font-semibold">Alterações não salvas</h3>
              </div>
              <p className="text-sm color-gray">
                Estes campos foram modificados. Você pode revisar e decidir salvar ou reverter cada um.
              </p>
            </div>

            {/* Container scrollável */}
            <div className="flex-1 overflow-y-auto pr-2">
              <ul className="space-y-3">
                {changedFields.map((key) => {
                  const displayNameMap = {
                    title: "Título",
                    description: "Descrição",
                    address: "Endereço",
                    backgroundColor: "Cor de fundo",
                    titleColor: "Cor do título",
                    detailsColor: "Cor dos detalhes",
                    bannerFile: "Banner",
                    logoFile: "Logo",
                    slug: "Identificador",
                    selectedServices: "Serviços selecionados",
                    selectedPayments: "Formas de pagamento",
                    deliveryFee: "Taxa de entrega",
                    hours: "Horário",
                  };

                  const displayName = displayNameMap[key] || key;

                  return (
                    <li key={key} className="flex justify-between items-center border-b pb-2">
                      <div className="flex-1 mr-3">
                        <div className="font-medium">{displayName}</div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <button
                          onClick={() => revertField(key)}
                          className="cursor-pointer text-xs color-gray underline pr-2"
                        >
                          Reverter
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Botões fixos */}
            <div className="mt-2 flex justify-center gap-2 pt-2">
              <button onClick={revertAll} className="cursor-pointer px-4 py-2 bg-gray-600 text-white rounded">
                Descartar tudo
              </button>
              <button
                onClick={saveAll}
                className="cursor-pointer px-4 py-2 bg-green-600 text-white rounded"
                disabled={saving}
              >
                {saving ? "Salvando..." : "Salvar tudo"}
              </button>
            </div>
          </div>
        </GenericModal>
      )}
    </>
  );
}
