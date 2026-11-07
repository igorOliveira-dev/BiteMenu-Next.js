"use client";

import { useEffect, useRef, useState } from "react";
import { FaExternalLinkAlt, FaMagic, FaPaperPlane } from "react-icons/fa";
import { supabase } from "@/lib/supabaseClient";
import useMenu, { updateCachedMenu } from "@/hooks/useMenu";
import { updateMenuById } from "@/lib/queries/menus";
import { useAlert } from "@/providers/AlertProvider";
import { useConfirm } from "@/providers/ConfirmProvider";

// conversa e rascunho sobrevivem à troca de aba (o Dashboard desmonta a aba); somem ao recarregar
let kept = { messages: [], draft: null };

const EXAMPLES = [
  "Crie uma landing moderna para o meu restaurante, com os produtos em destaque",
  "Página escura e elegante, com botão para pedir no WhatsApp",
];

export default function Landing() {
  const { menu } = useMenu();
  const customAlert = useAlert();
  const confirm = useConfirm();
  const [messages, setMessages] = useState(kept.messages);
  const [draft, setDraft] = useState(kept.draft);
  const [published, setPublished] = useState(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [saving, setSaving] = useState(false);
  const [usage, setUsage] = useState(null);
  const listRef = useRef(null);

  useEffect(() => {
    kept = { messages, draft };
  }, [messages, draft]);

  useEffect(() => {
    if (!menu) return;
    setPublished(menu.landing_html ?? null);
    if (kept.draft === null) setDraft(menu.landing_html ?? null);
  }, [menu?.id]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  const authHeaders = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return { Authorization: `Bearer ${session?.access_token}`, "Content-Type": "application/json" };
  };

  // mesmo saldo do Bite Menu IA
  useEffect(() => {
    (async () => {
      const res = await fetch("/api/assistant", { headers: await authHeaders() }).catch(() => null);
      const data = await res?.json().catch(() => null);
      if (data?.usage) setUsage(data.usage);
    })();
  }, []);

  const limitReached = usage?.percent >= 100 && !(usage.resetsAt && new Date(usage.resetsAt) <= new Date());

  const send = async (e, preset) => {
    e?.preventDefault();
    const text = (preset ?? input).trim();
    if (!text || sending || limitReached) return;

    const next = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setSending(true);
    try {
      const res = await fetch("/api/assistant/landing", {
        method: "POST",
        headers: await authHeaders(),
        body: JSON.stringify({ messages: next, html: draft ?? "" }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.usage) setUsage(data.usage);
      if (!res.ok) {
        setMessages((prev) => [...prev, { role: "assistant", content: data.error || "Algo deu errado. Tente de novo." }]);
        return;
      }
      if (data.html) setDraft(data.html);
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
    } catch (err) {
      console.error("[Landing] erro:", err);
      setMessages((prev) => [...prev, { role: "assistant", content: "Sem conexão com o assistente. Tente de novo." }]);
    } finally {
      setSending(false);
    }
  };

  // mesmo update do resto do cardápio (client do dono + RLS)
  const save = async (html) => {
    setSaving(true);
    const { error } = await updateMenuById(supabase, menu.id, { landing_html: html });
    setSaving(false);
    if (error) {
      console.error("[Landing] erro ao salvar:", error);
      return customAlert("Não foi possível salvar a landing page.", "error");
    }
    updateCachedMenu({ landing_html: html });
    setPublished(html);
    customAlert(html ? "Landing page publicada!" : "Landing page removida.");
  };

  const remove = async () => {
    const ok = await confirm("Remover a landing page? O link passa a abrir o cardápio.");
    if (ok) save(null);
  };

  const unpublished = !!draft && draft !== published;
  const siteUrl = menu?.slug ? `/site/${menu.slug}` : null;

  return (
    <div className="pt-2 px-4 pb-4 flex flex-col gap-4">
      <div>
        <h2 className="font-semibold flex items-center gap-2">
          <FaMagic className="text-brasa" /> Landing page
        </h2>
        <p className="text-sm color-gray mt-1">
          Peça para a IA criar a página de apresentação do seu estabelecimento. Ela usa os dados e fotos do seu cardápio.
          Depois peça ajustes: ela muda só o que você pedir. Nada vai ao ar até você clicar em Publicar.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(320px,420px)_1fr]">
        {/* chat */}
        <div className="flex flex-col rounded-2xl border border-[var(--translucid)] bg-translucid h-[60dvh] lg:h-[calc(100dvh-230px)]">
          <div ref={listRef} className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
            {!messages.length && (
              <div className="flex flex-col gap-2">
                <p className="text-sm color-gray">Exemplos:</p>
                {EXAMPLES.map((ex) => (
                  <button
                    key={ex}
                    type="button"
                    onClick={() => send(null, ex)}
                    disabled={sending || limitReached}
                    className="cursor-pointer text-left text-sm rounded-xl px-3 py-2 border border-[var(--translucid)] hover:bg-[var(--translucid)] disabled:opacity-50"
                  >
                    {ex}
                  </button>
                ))}
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                <div
                  className={`max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2.5 text-sm ${
                    m.role === "user" ? "rounded-br-md bg-brand-select text-white" : "rounded-tl-md bg-[var(--translucid)]"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {sending && (
              <p className="text-sm color-gray" role="status">
                Gerando… criar a página inteira pode levar até 1 minuto.
              </p>
            )}
          </div>

          <form onSubmit={send} className="flex items-end gap-2 p-2 border-t border-[var(--translucid)]">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) send(e);
              }}
              rows={2}
              maxLength={4000}
              aria-label="Mensagem para a IA"
              placeholder={limitReached ? "Limite da sessão atingido" : draft ? "Ex.: deixe os botões verdes" : "Descreva a página que você quer"}
              disabled={limitReached}
              className="flex-1 resize-none rounded-xl bg-transparent p-2 text-sm outline-none"
            />
            <button
              type="submit"
              disabled={sending || !input.trim() || limitReached}
              aria-label="Enviar"
              className="cursor-pointer rounded-full bg-brand-select p-3 text-white disabled:opacity-50"
            >
              <FaPaperPlane />
            </button>
          </form>
          {usage && <p className="px-3 pb-2 text-xs color-gray">{usage.percent}% do limite da sessão usado</p>}
        </div>

        {/* preview */}
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => save(draft)}
              disabled={!unpublished || saving || !menu}
              className="cursor-pointer rounded-full bg-brand-select px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {saving ? "Salvando…" : "Publicar"}
            </button>
            {draft && draft !== published && published && (
              <button
                type="button"
                onClick={() => setDraft(published)}
                className="cursor-pointer rounded-full px-4 py-2 text-sm bg-[var(--translucid)] hover:opacity-80"
              >
                Descartar mudanças
              </button>
            )}
            {published && siteUrl && (
              <a
                href={siteUrl}
                target="_blank"
                rel="noopener"
                className="flex items-center gap-2 rounded-full px-4 py-2 text-sm bg-[var(--translucid)] hover:opacity-80"
              >
                Ver página <FaExternalLinkAlt className="text-xs" />
              </a>
            )}
            {published && (
              <button
                type="button"
                onClick={remove}
                disabled={saving}
                className="cursor-pointer rounded-full px-4 py-2 text-sm text-red-500 hover:bg-[var(--translucid)]"
              >
                Remover landing
              </button>
            )}
            {unpublished && <span className="text-xs color-gray">Rascunho não publicado</span>}
          </div>

          {draft ? (
            // sandbox vazio: sem JS e origem isolada, igual à página publicada
            <iframe
              title="Prévia da landing page"
              sandbox=""
              srcDoc={draft}
              className="w-full rounded-2xl border border-[var(--translucid)] bg-white h-[70dvh] lg:h-[calc(100dvh-280px)]"
            />
          ) : (
            <div className="flex items-center justify-center rounded-2xl border border-dashed border-[var(--translucid)] h-[40dvh] lg:h-[calc(100dvh-280px)] text-sm color-gray p-4 text-center">
              A prévia da sua landing page aparece aqui.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
