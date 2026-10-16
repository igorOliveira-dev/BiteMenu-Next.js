"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FaEye, FaMagic, FaPaperPlane, FaTimes } from "react-icons/fa";
import { supabase } from "@/lib/supabaseClient";
import useMenu from "@/hooks/useMenu";
import useModalBackHandler from "@/hooks/useModalBackHandler";
import { formatCurrency } from "@/lib/formatCurrency";
import { AI_FIELDS, AI_FIELD_LABELS, AI_PREVIEW_KEY, formatAiValue } from "@/lib/assistant";
import { plans } from "@/consts/Plans";

const WELCOME = {
  role: "assistant",
  content:
    'Oi! Posso alterar as configurações do seu cardápio (horários, entrega, pagamentos, serviços, pedido mínimo, PIX e cores), o estoque e criar produtos. Dá até pra colar o seu cardápio em texto que eu cadastro tudo. Antes de salvar, eu mostro um preview.',
};

const SUGGESTIONS = ["Fechar aos domingos", "Taxa de entrega de R$ 7", "Sugira cores para o cardápio", "Vou colar meu cardápio"];

const PREVIEW_W = 375;
const PREVIEW_H = 620;
const ITEMS_SHOWN = 6;

// Só vale abrir o preview do cardápio público quando a mudança aparece nele de cara:
// produtos novos, título/descrição e cores. Estoque, entrega, horários, pagamentos etc. confirmam direto.
const VISIBLE_FIELDS = ["title", "description", "backgroundColor", "titleColor", "detailsColor"];
const needsPreview = (m) =>
  m.newItems?.length > 0 ||
  // ocultar/exibir categoria ou produto aparece na lista; grupo de opções só dentro do produto (preview não abre)
  m.visibility?.some((v) => v.kind !== "group") ||
  // nome, preço e promoção aparecem na lista de produtos
  m.itemEdits?.some((e) => e.fields?.name || e.fields?.price || e.fields?.promoPrice) ||
  Object.keys(m.changes || {}).some((k) => VISIBLE_FIELDS.includes(k));

const VISIBILITY_KIND = { category: "Categoria", item: "Produto", group: "Grupo de opções" };

// Vira texto pro histórico enviado à IA: ela fica sabendo o que o dono fez com cada proposta
function toHistory(messages) {
  return messages
    .filter((m) => m !== WELCOME && !m.upsell)
    .map((m) => {
      let content = m.content;
      if (m.status === "applied") content += "\n[O dono confirmou e as alterações foram salvas.]";
      if (m.status === "canceled") content += "\n[O dono cancelou estas alterações.]";
      if (m.status === "failed") content += "\n[As alterações não foram salvas.]";
      return { role: m.role, content };
    });
}

const FIELD_LABELS = { name: "Nome", description: "Descrição", price: "Preço", promoPrice: "Preço promocional" };
const formatField = (key, value, currency) => {
  if (value === null || value === "") return "—";
  return key === "price" || key === "promoPrice" ? formatCurrency(value, currency) : value;
};

const formatVariations = (v, currency) =>
  v.options.map((o) => `${o.name} ${formatCurrency(o.price, currency)}`).join(" / ");

const itemPrice = (it, currency) =>
  it.variations
    ? it.variations.options.map((o) => `${o.name} ${formatCurrency(o.price, currency)}`).join(" / ")
    : formatCurrency(it.price, currency);

function ProposalDetails({ m, currency }) {
  return (
    <ul className="mt-2 space-y-1 border-t border-[var(--translucid)] pt-2 text-xs">
      {Object.entries(m.changes || {}).map(([key, value]) => (
        <li key={key}>
          <span className="font-semibold">{AI_FIELD_LABELS[key] ?? key}:</span>{" "}
          <span className="line-through opacity-50">{formatAiValue(key, m.before?.[key])}</span>
          {" → "}
          <span>{formatAiValue(key, value)}</span>
        </li>
      ))}
      {m.stock?.map((s) => (
        <li key={s.id}>
          <span className="font-semibold">Estoque de {s.name}:</span>{" "}
          <span className="line-through opacity-50">{s.before ?? "sem controle"}</span>
          {" → "}
          <span>{s.after ?? "sem controle"}</span>
        </li>
      ))}
      {m.visibility?.map((v) => (
        <li key={`${v.kind}-${v.id ?? v.label}`}>
          <span className="font-semibold">
            {VISIBILITY_KIND[v.kind]} {v.label}:
          </span>{" "}
          {v.visible ? "exibir no cardápio" : "ocultar do cardápio"}
        </li>
      ))}
      {m.itemEdits?.map((e) => (
        <li key={e.itemId} className="pt-1">
          <span className="font-semibold">{e.itemName}</span>
          <ul className="ml-3 opacity-80">
            {Object.entries(e.fields || {}).map(([key, f]) => (
              <li key={key}>
                • {FIELD_LABELS[key]}:{" "}
                <span className="line-through opacity-50">{formatField(key, f.before, currency)}</span> →{" "}
                {formatField(key, f.after, currency)}
              </li>
            ))}
            {e.variations && (
              <li>
                • Variação {e.variations.after.name}:{" "}
                {e.variations.before && (
                  <span className="line-through opacity-50">{formatVariations(e.variations.before, currency)}</span>
                )}
                {e.variations.before && " → "}
                {formatVariations(e.variations.after, currency)}
              </li>
            )}
            {e.groups.map((g) => (
              <li key={g.groupId ?? g.name}>
                • {g.groupId ? "Grupo" : "Novo grupo"} {g.name}
                {g.rename && ` → ${g.rename}`}
                {(!g.groupId || g.limitsChanged) && ` (mín ${g.min}, máx ${g.max || "sem limite"})`}
                {g.updates.map((c) => (
                  <div key={c.id} className="ml-3">
                    {c.name}: <span className="line-through opacity-50">{formatCurrency(c.before, currency)}</span> →{" "}
                    {formatCurrency(c.price, currency)}
                  </div>
                ))}
                {g.inserts.map((c) => (
                  <div key={c.name} className="ml-3">
                    + {c.name} {formatCurrency(c.price, currency)}
                  </div>
                ))}
              </li>
            ))}
          </ul>
        </li>
      ))}
      {m.newItems?.map((g) => (
        <li key={g.name} className="pt-1">
          <span className="font-semibold">
            {g.id ? g.name : `Nova categoria: ${g.name}`} (+{g.items.length})
          </span>
          <ul className="ml-3 opacity-80">
            {g.items.slice(0, ITEMS_SHOWN).map((it) => (
              <li key={it.name}>
                • {it.name} — {itemPrice(it, currency)}
              </li>
            ))}
            {g.items.length > ITEMS_SHOWN && <li>• e mais {g.items.length - ITEMS_SHOWN}...</li>}
          </ul>
        </li>
      ))}
    </ul>
  );
}

// canto direito (o esquerdo cobre "Conta" na barra lateral); sobe quando o aviso "Alterações não salvas" aparece
// allowed: plano com acesso (Business/admin). Sem acesso o chat abre normal, mas enviar mostra o convite pro Business.
const BUSINESS_PRICE = plans.find((p) => p.id === "business")?.price;

// Convite pro Business quando quem não tem o plano tenta usar a IA
function UpsellMessage() {
  return (
    <div className="space-y-2">
      <p className="font-semibold">Eu faria isso pra você agora mesmo... mas o Bite Menu IA é exclusivo do plano Business.</p>
      <p>
        Imagine colar o seu cardápio e ver tudo cadastrado em segundos. Mudar horários, taxas, estoque e cores só pedindo,
        sem procurar em nenhuma tela, e ainda ver um preview antes de salvar.
      </p>
      <p>
        E isso vem junto com tudo do Business: cardápio sem limites, controle de estoque, logins para a equipe, tela da
        cozinha e tela de entregas.
      </p>
      <a
        href="/dashboard/pricing"
        className="mt-1 flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 font-semibold text-white no-underline transition hover:bg-red-700"
      >
        <FaMagic /> Quero o plano Business
      </a>
      {BUSINESS_PRICE && <p className="text-center text-xs opacity-60">A partir de R$ {BUSINESS_PRICE}/mês. Cancele quando quiser.</p>}
    </div>
  );
}

export default function AiAssistant({ localState, onApply, raised = false, showButton = true, allowed = false }) {
  const position = raised ? "bottom-52 lg:bottom-44" : "bottom-16 lg:bottom-6";
  const { menu } = useMenu();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([WELCOME]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [applying, setApplying] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(null);
  const [previewScale, setPreviewScale] = useState(1);
  const [usage, setUsage] = useState(null); // { percent, resetsAt } da sessão de uso
  const listRef = useRef(null);
  const iframeRef = useRef(null);
  // Esc / botão voltar do celular fecham o chat (com o preview aberto, quem fecha é o preview)
  useModalBackHandler(open && previewIndex === null, () => setOpen(false));

  // na aba Cardápio o botão fica junto do "Configurar cardápio" (Menu.jsx), que dispara este evento
  useEffect(() => {
    const openChat = () => setOpen(true);
    window.addEventListener("open-ai-assistant", openChat);
    return () => window.removeEventListener("open-ai-assistant", openChat);
  }, []);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

  // celular do preview cabe na tela
  useEffect(() => {
    if (previewIndex === null) return;
    const compute = () =>
      setPreviewScale(Math.min(1, (window.innerWidth - 32) / PREVIEW_W, (window.innerHeight - 110) / PREVIEW_H));
    compute();
    window.addEventListener("resize", compute);
    return () => window.removeEventListener("resize", compute);
  }, [previewIndex]);

  const hasPending = messages.some((m) => m.status === "pending");
  // passou do horário de renovar: libera sem precisar reabrir o chat (o servidor confere de novo)
  const limitReached = usage?.percent >= 100 && !(usage.resetsAt && new Date(usage.resetsAt) <= new Date());
  const resetTime = usage?.resetsAt
    ? new Date(usage.resetsAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    : null;

  const authHeaders = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return { Authorization: `Bearer ${session?.access_token}`, "Content-Type": "application/json" };
  };

  // uso da sessão ao abrir o chat (a sessão pode ter renovado desde a última vez)
  useEffect(() => {
    if (!open || !allowed) return;
    (async () => {
      const res = await fetch("/api/assistant", { headers: await authHeaders() }).catch(() => null);
      const data = await res?.json().catch(() => null);
      if (data?.usage) setUsage(data.usage);
    })();
  }, [open]);

  const send = async (e) => {
    e?.preventDefault();
    const text = input.trim();
    if (!text || sending || hasPending || limitReached) return;

    const next = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");

    // sem o plano: nem chama a API, responde com o convite pro Business
    if (!allowed) {
      setMessages((prev) => [...prev, { role: "assistant", upsell: true }]);
      return;
    }
    setSending(true);

    try {
      const config = Object.fromEntries(AI_FIELDS.map((k) => [k, localState?.[k] ?? null]));

      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: await authHeaders(),
        body: JSON.stringify({ messages: toHistory(next), config }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.usage) setUsage(data.usage);

      if (!res.ok) {
        setMessages((prev) => [...prev, { role: "assistant", content: data.error || "Algo deu errado. Tente de novo." }]);
        return;
      }

      setMessages((prev) => [
        ...prev,
        data.changes
          ? {
              role: "assistant",
              content: data.reply,
              changes: data.changes,
              stock: data.stock ?? [],
              newItems: data.newItems ?? [],
              visibility: data.visibility ?? [],
              itemEdits: data.itemEdits ?? [],
              before: config,
              status: "pending",
            }
          : { role: "assistant", content: data.reply },
      ]);
    } catch (err) {
      console.error("[AiAssistant] erro:", err);
      setMessages((prev) => [...prev, { role: "assistant", content: "Sem conexão com o assistente. Tente de novo." }]);
    } finally {
      setSending(false);
    }
  };

  const setStatus = (index, status) =>
    setMessages((prev) => prev.map((m, i) => (i === index ? { ...m, status } : m)));

  const openPreview = (index) => {
    const m = messages[index];
    try {
      sessionStorage.setItem(AI_PREVIEW_KEY, JSON.stringify({ changes: m.changes, stock: m.stock, newItems: m.newItems, visibility: m.visibility, itemEdits: m.itemEdits }));
    } catch {}
    setPreviewIndex(index);
  };

  // preview só pra olhar: bloqueia cliques (não dá pra fazer pedido no cardápio real por aqui)
  const onPreviewLoad = () => {
    const doc = iframeRef.current?.contentDocument;
    if (!doc) return;
    const block = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };
    ["click", "mousedown", "keydown", "submit"].forEach((type) => doc.addEventListener(type, block, true));
  };

  // estoque e produtos novos: mesmos inserts/updates das telas de Estoque e Cardápio (client do usuário + RLS)
  const saveCatalog = async ({ stock = [], newItems = [], visibility = [], itemEdits = [] }) => {
    // variações e grupos de opções de produtos existentes: mesmos campos que o modal do produto grava
    for (const e of itemEdits) {
      const f = e.fields || {};
      const patch = {
        ...(f.name && { name: f.name.after }),
        ...(f.description && { description: f.description.after }),
        ...(f.price && { price: f.price.after }),
        ...(f.promoPrice && { promo_price: f.promoPrice.after }),
      };
      if (Object.keys(patch).length) {
        const { error } = await supabase.from("menu_items").update(patch).eq("id", e.itemId);
        if (error) throw error;
      }

      if (e.variations) {
        const { after } = e.variations;
        const { error } = await supabase
          .from("menu_items")
          .update({ variations: after, price: Math.min(...after.options.map((o) => o.price)), promo_price: null })
          .eq("id", e.itemId);
        if (error) throw error;
      }

      for (const g of e.groups) {
        let groupId = g.groupId;
        if (!groupId) {
          const { data, error } = await supabase
            .from("option_groups")
            .insert({ item_id: e.itemId, name: g.name, min_choices: g.min, max_choices: g.max, position: g.position })
            .select("id")
            .single();
          if (error) throw error;
          groupId = data.id;
        } else if (g.rename || g.limitsChanged) {
          const { error } = await supabase
            .from("option_groups")
            .update({ name: g.rename ?? g.name, min_choices: g.min, max_choices: g.max })
            .eq("id", groupId);
          if (error) throw error;
        }

        for (const c of g.updates) {
          const { error } = await supabase.from("option_choices").update({ price: c.price }).eq("id", c.id);
          if (error) throw error;
        }
        if (g.inserts.length) {
          const { error } = await supabase.from("option_choices").insert(
            g.inserts.map((c) => ({ group_id: groupId, name: c.name, price: c.price, hidden: false, position: c.position })),
          );
          if (error) throw error;
        }
      }
    }

    // ocultar/exibir: mesmos campos dos botões do dashboard (menu_items.visible / option_choices.hidden)
    for (const v of visibility) {
      const { error } =
        v.kind === "category"
          ? await supabase.from("menu_items").update({ visible: v.visible }).eq("category_id", v.id)
          : v.kind === "item"
            ? await supabase.from("menu_items").update({ visible: v.visible }).eq("id", v.id)
            : await supabase.from("option_choices").update({ hidden: !v.visible }).in("group_id", v.groupIds);
      if (error) throw error;
    }

    for (const s of stock) {
      const { error } = await supabase.from("menu_items").update({ stock: s.after }).eq("id", s.id);
      if (error) throw error;
    }

    for (const group of newItems) {
      let categoryId = group.id;
      if (!categoryId) {
        const { data, error } = await supabase
          .from("categories")
          .insert({ menu_id: menu.id, name: group.name, position: group.position })
          .select("id")
          .single();
        if (error) throw error;
        categoryId = data.id;
      }

      const { error } = await supabase.from("menu_items").insert(
        group.items.map((it) => ({
          category_id: categoryId,
          name: it.name,
          price: it.price,
          promo_price: null,
          variations: it.variations ?? null,
          description: it.description || "",
          image_url: "",
          thumb_url: "",
          position: it.position,
        })),
      );
      if (error) throw error;
    }
  };

  // vem do preview (aparência/produtos novos) ou direto do chat (o resto)
  const confirm = async (index) => {
    const m = messages[index];
    setApplying(true);

    let saved = true;
    if (Object.keys(m.changes || {}).length) saved = await onApply(m.changes);

    if (saved && (m.stock?.length || m.newItems?.length || m.visibility?.length || m.itemEdits?.length)) {
      try {
        await saveCatalog(m);
      } catch (err) {
        console.error("[AiAssistant] erro ao salvar produtos/estoque:", err);
        saved = false;
      }
      window.dispatchEvent(new Event("menu-items-changed"));
    }

    setApplying(false);
    setPreviewIndex(null);
    setStatus(index, saved ? "applied" : "failed");
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <>
      {!open && showButton && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Abrir Bite Menu IA"
          className={`fixed right-4 z-100 ${position} flex h-12 items-center gap-2 rounded-full bg-red-600 px-4 font-semibold text-white shadow-lg cursor-pointer transition hover:bg-red-700`}
        >
          <FaMagic /> <span className="hidden xs:inline">Bite Menu IA</span>
        </button>
      )}

      {open && (
        <div
          className="fixed inset-0 z-[101] flex items-center justify-center bg-black/40 p-3 backdrop-blur-sm"
          style={{ animation: "ai-fade .2s ease-out" }}
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <div
            className="relative flex h-[min(680px,calc(100dvh-24px))] w-[min(560px,calc(100vw-24px))] flex-col overflow-hidden rounded-3xl border border-[var(--translucid)] bg-[var(--background)] text-[var(--foreground)] shadow-2xl"
            style={{ animation: "ai-pop .25s ease-out" }}
          >
            {/* faixa vermelha fina no topo */}
            <div className="h-1 bg-red-600" />
            <div className="flex min-h-0 flex-1 flex-col">
              <div className="relative flex items-center justify-between px-5 pt-4 pb-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 text-red-500">
                    <FaMagic />
                  </span>
                  <div>
                    <strong className="block text-base leading-tight">Bite Menu IA</strong>
                    <span className="text-xs opacity-60">Altera seu cardápio por você, com preview antes de salvar</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Fechar"
                  className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full opacity-60 transition hover:bg-translucid hover:opacity-100"
                >
                  <FaTimes />
                </button>
              </div>
              {usage && (
                <div className="px-5 pb-3">
                  <div className="mb-1 flex justify-between text-[11px] opacity-60">
                    <span>Uso da sessão: {usage.percent}%</span>
                    {resetTime && <span>Renova às {resetTime}</span>}
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-translucid">
                    <div
                      className={`h-full rounded-full transition-[width] duration-500 ${limitReached ? "bg-red-700" : "bg-red-500"}`}
                      style={{ width: `${usage.percent}%` }}
                    />
                  </div>
                </div>
              )}
              <div className="h-px bg-[var(--translucid)]" />

          <div ref={listRef} className="relative flex-1 space-y-3 overflow-y-auto px-5 py-4">
            {messages.map((m, i) => (
              <div
                key={i}
                className={m.role === "user" ? "flex justify-end" : "flex items-start justify-start gap-2"}
                style={{ animation: "ai-rise .2s ease-out" }}
              >
                {m.role === "assistant" && (
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-500/10 text-[11px] text-red-500">
                    <FaMagic />
                  </span>
                )}
                <div
                  className={`max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2.5 text-sm ${
                    m.role === "user"
                      ? "max-h-60 overflow-y-auto rounded-br-md bg-red-600 text-white"
                      : "rounded-tl-md bg-translucid"
                  }`}
                >
                  {m.upsell ? <UpsellMessage /> : m.content}

                  {m.changes && <ProposalDetails m={m} currency={menu?.currency} />}

                  {m.status === "pending" && (
                    <div className="mt-3 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setStatus(i, "canceled")}
                        disabled={applying}
                        className="cursor-pointer rounded bg-[var(--translucid)] px-3 py-1.5 text-xs hover:opacity-80"
                      >
                        Cancelar
                      </button>
                      {needsPreview(m) ? (
                        <button
                          type="button"
                          onClick={() => openPreview(i)}
                          className="cursor-pointer flex items-center gap-1.5 rounded bg-green-600 px-3 py-1.5 text-xs text-white hover:opacity-80"
                        >
                          <FaEye /> Ver preview
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => confirm(i)}
                          disabled={applying}
                          className="cursor-pointer rounded bg-green-600 px-3 py-1.5 text-xs text-white hover:opacity-80"
                        >
                          {applying ? "Salvando..." : "Confirmar"}
                        </button>
                      )}
                    </div>
                  )}
                  {m.status === "applied" && <p className="mt-2 text-xs text-green-500">✓ Alterações salvas</p>}
                  {m.status === "canceled" && <p className="mt-2 text-xs opacity-60">Cancelado</p>}
                  {m.status === "failed" && (
                    <p className="mt-2 text-xs text-yellow-500">Não foi salvo por completo. Confira o cardápio e tente de novo.</p>
                  )}
                </div>
              </div>
            ))}

            {/* sugestões só no começo da conversa */}
            {messages.length === 1 && (
              <div className="flex flex-wrap gap-2 pl-9" style={{ animation: "ai-rise .25s ease-out" }}>
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setInput(s)}
                    className="cursor-pointer rounded-full border border-[var(--translucid)] px-3 py-1.5 text-xs transition hover:border-red-500/50 hover:text-red-500"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {sending && (
              <div className="flex items-center gap-2 pl-9 text-xs opacity-70">
                <span className="flex gap-1">
                  {[0, 0.15, 0.3].map((d) => (
                    <span
                      key={d}
                      className="h-2 w-2 rounded-full bg-red-500"
                      style={{ animation: `ai-dot 1s ${d}s ease-in-out infinite` }}
                    />
                  ))}
                </span>
                Pensando... cardápios grandes podem levar até 1 minuto
              </div>
            )}
          </div>

          <form onSubmit={send} className="relative flex items-end gap-2 p-4 pt-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) send(e);
              }}
              rows={input.includes("\n") ? 4 : 1}
              maxLength={8000}
              placeholder={
                limitReached
                  ? `Limite da sessão atingido${resetTime ? `. Renova às ${resetTime}` : ""}`
                  : hasPending
                    ? "Confirme ou cancele a proposta acima"
                    : "Peça uma alteração ou cole seu cardápio..."
              }
              disabled={sending || hasPending || limitReached}
              className="max-h-36 min-h-11 flex-1 resize-none rounded-2xl border border-[var(--translucid)] bg-translucid px-4 py-2.5 text-sm outline-none transition focus:border-red-500/60"
            />
            <button
              type="submit"
              disabled={sending || hasPending || limitReached || !input.trim()}
              aria-label="Enviar"
              className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-2xl bg-red-600 text-white transition hover:bg-red-700 disabled:opacity-40"
            >
              <FaPaperPlane />
            </button>
          </form>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes ai-fade { from { opacity: 0 } to { opacity: 1 } }
        @keyframes ai-pop { from { opacity: 0; transform: scale(.98) translateY(6px) } to { opacity: 1; transform: none } }
        @keyframes ai-rise { from { opacity: 0; transform: translateY(4px) } to { opacity: 1; transform: none } }
        @keyframes ai-dot { 0%, 80%, 100% { transform: scale(.6); opacity: .4 } 40% { transform: scale(1); opacity: 1 } }
      `}</style>

      {previewIndex !== null && menu?.slug && (
        <div className="fixed inset-0 z-[110] flex flex-col items-center justify-center bg-black/70 p-4">
          <p className="mb-3 text-sm text-white">Preview: assim vai ficar o seu cardápio</p>
          <div
            style={{ width: PREVIEW_W * previewScale, height: PREVIEW_H * previewScale }}
            className="relative overflow-hidden rounded-[32px] border-4 border-white/15 shadow-2xl"
          >
            <div style={{ transform: `scale(${previewScale})`, transformOrigin: "top left", width: PREVIEW_W, height: PREVIEW_H }}>
              <iframe
                ref={iframeRef}
                onLoad={onPreviewLoad}
                src={`/menu/${menu.slug}/preview?ai_draft=1&t=${previewIndex}`}
                style={{ width: PREVIEW_W, height: PREVIEW_H, border: "none" }}
                title="Preview das alterações"
              />
            </div>
          </div>
          <div className="mt-4 flex gap-3">
            <button
              type="button"
              onClick={() => setPreviewIndex(null)}
              disabled={applying}
              className="cursor-pointer rounded-lg bg-white/15 px-5 py-2 text-white hover:opacity-80"
            >
              Voltar
            </button>
            <button
              type="button"
              onClick={() => confirm(previewIndex)}
              disabled={applying}
              className="cursor-pointer rounded-lg bg-green-600 px-5 py-2 font-semibold text-white hover:opacity-80"
            >
              {applying ? "Salvando..." : "Confirmar e salvar"}
            </button>
          </div>
        </div>
      )}
    </>,
    document.body,
  );
}
