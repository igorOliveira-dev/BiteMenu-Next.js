"use client";

import { useEffect, useRef, useState } from "react";
import {
  FaArrowDown,
  FaArrowLeft,
  FaArrowUp,
  FaBullhorn,
  FaColumns,
  FaDesktop,
  FaExternalLinkAlt,
  FaEye,
  FaEyeSlash,
  FaGift,
  FaHeading,
  FaImage,
  FaList,
  FaMagic,
  FaMobileAlt,
  FaPalette,
  FaPaperPlane,
  FaPlus,
  FaSearch,
  FaStar,
  FaTags,
  FaTh,
  FaTimes,
  FaTrash,
  FaUndo,
} from "react-icons/fa";
import { HexColorInput, HexColorPicker } from "react-colorful";
import { supabase } from "@/lib/supabaseClient";
import useMenu, { updateCachedMenu } from "@/hooks/useMenu";
import { updateMenuById } from "@/lib/queries/menus";
import { useAlert } from "@/providers/AlertProvider";
import { useConfirm } from "@/providers/ConfirmProvider";
import { contrastRatio } from "@/utils/color";
import ActionsMenu from "@/components/ActionMenu";
import {
  BLOCK_TYPES,
  CUSTOM_LAYOUT_MAX_LENGTH,
  FIELDS,
  FONTS,
  basePalette,
  defaultLayout,
  layoutPalette,
  mergeAiLayout,
  newBlock,
  normalizeLayout,
} from "@/lib/customLayout";

// Layout personalizado (Enterprise, tasks/layout-personalizado/). Editor no modelo dos editores de tema:
// lista (Tema + seções) à esquerda, configurações do item à direita (Configurações | Código).
// Rascunho só na tela até "Publicar"; sobrevive à troca de aba do dashboard, some ao recarregar.
let kept = { draft: null, selected: "theme", panel: "settings" };

const THEME = "theme";
const SURPRISE = "Crie um visual único e marcante que combine com o meu estabelecimento. Fuja do layout comum de lista.";

const BLOCK_ICONS = {
  banner: FaImage,
  header: FaHeading,
  search: FaSearch,
  loyalty: FaGift,
  categories: FaTags,
  starred: FaStar,
  items: FaList,
  html: FaBullhorn,
};
const FIELD_LABELS = {
  description: "Descrição",
  logo: "Logo",
  address: "Endereço",
  whatsapp: "WhatsApp",
  status: "Aberto/fechado",
  image: "Foto",
  combos: "Descontos",
  old_price: "Preço antigo",
};

const OPT = {
  display: [
    ["list", "Lista", FaList],
    ["grid", "Grade", FaTh],
    ["carousel", "Carrossel", FaColumns],
  ],
  columns: [
    [2, "2"],
    [3, "3"],
    [4, "4"],
  ],
  columnsMobile: [
    [1, "1"],
    [2, "2"],
  ],
  itemWidth: [
    [160, "P"],
    [220, "M"],
    [300, "G"],
  ],
  gap: [
    [0, "Nenhum"],
    [12, "Normal"],
    [24, "Amplo"],
  ],
  padding: [
    [0, "Nenhum"],
    [12, "P"],
    [24, "M"],
    [48, "G"],
  ],
  radius: [
    [0, "Retos"],
    [12, "Suaves"],
    [28, "Redondos"],
  ],
  maxWidth: [
    [0, "Total"],
    [800, "Média"],
    [600, "Estreita"],
  ],
  pageWidth: [
    [800, "Estreita"],
    [1100, "Normal"],
    [1400, "Larga"],
  ],
};

const FONT_HREF = `https://fonts.googleapis.com/css2?${Object.values(FONTS)
  .map((f) => `family=${f}`)
  .join("&")}&display=swap`;

const inputCls = "w-full rounded-lg border border-[var(--translucid)] bg-transparent px-3 py-2 text-sm outline-none focus:border-brand-select/70";
const codeCls = `${inputCls} font-mono text-xs leading-relaxed`;
// mesmo campo hex da aba Cardápio (INPUT_CLASS do ConfigMenu.jsx)
const HEX_INPUT_CLASS =
  "h-11 w-full rounded-xl border border-[var(--translucid)] bg-translucid px-3 text-[15px] outline-none transition focus:border-brand-select/70";
const btnCls = "cursor-pointer flex items-center gap-2 rounded-full px-4 py-2 text-sm bg-[var(--translucid)] hover:opacity-80 disabled:opacity-50";
const primaryCls = "cursor-pointer flex items-center gap-2 rounded-full bg-brand-select px-4 py-2 text-sm font-semibold text-white disabled:opacity-50";
const iconBtn = "cursor-pointer p-1.5 rounded-md color-gray hover:bg-[var(--translucid)] hover:text-[var(--foreground)] disabled:opacity-30";

// o seletor trabalha com #rrggbb
function hex6(hex) {
  const h = String(hex || "").replace("#", "");
  return "#" + (h.length < 6 ? [...h.slice(0, 3)].map((c) => c + c).join("") : h.slice(0, 6)).padEnd(6, "0");
}

function useOutsideClose(open, close) {
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e) => {
      if (!ref.current?.contains(e.target)) close();
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);
  return ref;
}

function Group({ title, children }) {
  return (
    <div className="flex flex-col gap-4 border-t border-[var(--translucid)] pt-4 first:border-0 first:pt-0">
      {title && <p className="text-xs font-semibold uppercase tracking-wider color-gray">{title}</p>}
      {children}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm">{label}</span>
      {children}
    </div>
  );
}

// controle segmentado (estilo iOS/Shopify)
function Segmented({ options, value, onChange }) {
  return (
    <div className="inline-flex flex-wrap rounded-lg bg-[var(--translucid)] p-0.5">
      {options.map(([v, label, Icon]) => (
        <button
          key={String(v)}
          type="button"
          aria-pressed={value === v}
          onClick={() => onChange(v)}
          className={`cursor-pointer flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm ${
            value === v ? "bg-[var(--background)] font-semibold shadow-sm" : "color-gray hover:text-[var(--foreground)]"
          }`}
        >
          {Icon && <Icon size={12} />}
          {label}
        </button>
      ))}
    </div>
  );
}

function Check({ checked, onChange, children }) {
  return (
    <label className="flex items-center gap-2 text-sm cursor-pointer">
      <input type="checkbox" checked={checked} onChange={onChange} className="h-4 w-4 accent-[var(--brand-select)]" />
      {children}
    </label>
  );
}

// Mesmo seletor da aba Cardápio: amostra + hex; clicar na amostra abre o seletor, clicar fora fecha.
// Vazio = `auto` (cor automática), com atalho para voltar a ela.
function ColorField({ label, value, auto, onChange, startOpen = false }) {
  const [open, setOpen] = useState(startOpen);
  const ref = useOutsideClose(open, () => setOpen(false));
  const shown = hex6(value || auto);
  return (
    <div ref={ref}>
      <div className="mb-1.5 flex items-center justify-between gap-2 text-sm">
        <span>{label}</span>
        {value && auto ? (
          <button type="button" onClick={() => onChange("")} className="cursor-pointer text-xs color-gray hover:underline">
            Redefinir
          </button>
        ) : (
          auto && <span className="text-xs color-gray">Automático</span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="h-11 w-11 shrink-0 cursor-pointer rounded-xl border border-[var(--high-translucid)]"
          style={{ backgroundColor: shown }}
          aria-label={`Escolher cor: ${label}`}
          aria-expanded={open}
        />
        <HexColorInput prefixed color={shown} onChange={onChange} aria-label={`Hexadecimal: ${label}`} className={`${HEX_INPUT_CLASS} uppercase`} />
      </div>
      {open && <HexColorPicker color={shown} onChange={onChange} style={{ width: "100%", height: 150, marginTop: 8 }} />}
    </div>
  );
}

function Swatch({ color, label, selected, onClick }) {
  return (
    <button type="button" title={label} aria-label={label} aria-pressed={selected} onClick={onClick} className="cursor-pointer flex flex-col items-center gap-1 text-[11px]">
      <span
        className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${selected ? "border-brand-select" : "border-[var(--translucid)]"}`}
        style={{ background: color || "transparent" }}
      >
        {!color && <FaTimes className="color-gray" size={10} />}
      </span>
      <span className={selected ? "font-semibold" : "color-gray"}>{label}</span>
    </button>
  );
}

// campo único de IA, no topo do painel (cardápio todo ou a seção aberta)
function AiBar({ placeholder, onSend, sending, disabled, reply, onView, extra }) {
  const [text, setText] = useState("");
  const submit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSend(text.trim());
    setText("");
  };
  return (
    <div className="flex flex-col gap-1.5">
      <form onSubmit={submit} className="flex items-center gap-2 rounded-xl border border-[var(--translucid)] px-3 focus-within:border-brand-select/70">
        <FaMagic className="text-brasa shrink-0" />
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={2000}
          disabled={disabled}
          placeholder={placeholder}
          aria-label="Pedido para a IA"
          className="flex-1 bg-transparent py-2.5 text-sm outline-none"
        />
        <button type="submit" aria-label="Enviar para a IA" disabled={sending || disabled || !text.trim()} className={iconBtn}>
          <FaPaperPlane />
        </button>
      </form>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs color-gray">
        {sending ? (
          <span role="status">Gerando…</span>
        ) : (
          reply && (
            <span>
              {reply}
              {onView && (
                <button type="button" onClick={onView} className="ml-2 cursor-pointer font-semibold text-brasa hover:underline">
                  Ver
                </button>
              )}
            </span>
          )
        )}
        {!sending && extra}
      </div>
    </div>
  );
}

function SectionSettings({ block: b, palette, onChange }) {
  const kind = BLOCK_TYPES[b.type];
  const style = (patch) => onChange({ style: { ...b.style, ...patch } });
  const hideable = kind.template === "item" ? ["image", "description", "combos", "old_price"] : ["logo", "description", "status", "address", "whatsapp"];
  const toggleHide = (f) => onChange({ hide: b.hide.includes(f) ? b.hide.filter((x) => x !== f) : [...b.hide, f] });
  const presets = [
    ["", "Nenhum", null],
    ["soft", "Suave", palette.soft],
    ["accent", "Destaque", palette.accent],
    ["#111111", "Escuro", "#111111"],
    ["#ffffff", "Claro", "#ffffff"],
  ];
  const custom = !!b.style.bg && !presets.some(([v]) => v === b.style.bg);
  const [pickOther, setPickOther] = useState(false);

  return (
    <>
      {(b.display || b.type === "starred" || b.type === "search" || b.hide) && (
        <Group title="Conteúdo">
          {b.type === "starred" && (
            <Field label="Título">
              <input value={b.title} maxLength={80} onChange={(e) => onChange({ title: e.target.value })} className={inputCls} />
            </Field>
          )}
          {b.type === "search" && (
            <Field label="Texto do campo">
              <input value={b.placeholder} maxLength={80} onChange={(e) => onChange({ placeholder: e.target.value })} className={inputCls} />
            </Field>
          )}
          {b.hide && (
            <Field label="Mostrar">
              <div className="grid grid-cols-2 gap-2">
                {hideable.map((f) => (
                  <Check key={f} checked={!b.hide.includes(f)} onChange={() => toggleHide(f)}>
                    {FIELD_LABELS[f]}
                  </Check>
                ))}
              </div>
            </Field>
          )}
        </Group>
      )}

      {b.display && (
        <Group title="Disposição">
          <Segmented options={OPT.display} value={b.display} onChange={(v) => onChange({ display: v })} />
          {b.display === "grid" && (
            <>
              <div className="flex flex-wrap gap-6">
                <Field label="Colunas no computador">
                  <Segmented options={OPT.columns} value={b.columns} onChange={(v) => onChange({ columns: v })} />
                </Field>
                <Field label="No celular">
                  <Segmented options={OPT.columnsMobile} value={b.columnsMobile} onChange={(v) => onChange({ columnsMobile: v })} />
                </Field>
              </div>
              <Check checked={b.featured} onChange={() => onChange({ featured: !b.featured })}>
                Primeiro produto maior
              </Check>
            </>
          )}
          {b.display === "carousel" && (
            <Field label="Tamanho do cartão">
              <Segmented options={OPT.itemWidth} value={b.itemWidth} onChange={(v) => onChange({ itemWidth: v })} />
            </Field>
          )}
          <Field label="Espaço entre produtos">
            <Segmented options={OPT.gap} value={b.gap} onChange={(v) => onChange({ gap: v })} />
          </Field>
        </Group>
      )}

      <Group title="Aparência">
        <Field label="Fundo">
          <div className="flex flex-wrap gap-3">
            {presets.map(([v, label, color]) => (
              <Swatch
                key={label}
                label={label}
                color={color}
                selected={!pickOther && b.style.bg === v}
                onClick={() => {
                  setPickOther(false);
                  style({ bg: v, color: "" });
                }}
              />
            ))}
            <Swatch label="Outra" color={custom ? b.style.bg : "conic-gradient(red,yellow,lime,aqua,blue,magenta,red)"} selected={custom || pickOther} onClick={() => setPickOther(true)} />
          </div>
          {(custom || pickOther) && (
            <div className="mt-2 max-w-xs">
              <ColorField label="Cor do fundo" value={custom ? b.style.bg : ""} auto="#888888" startOpen={!custom} onChange={(v) => style({ bg: v, color: "" })} />
            </div>
          )}
        </Field>
        {b.style.bg && (
          <Field label="Cantos">
            <Segmented options={OPT.radius} value={b.style.radius} onChange={(v) => style({ radius: v })} />
          </Field>
        )}
        <div className="flex flex-wrap gap-6">
          <Field label="Espaço vertical">
            <Segmented options={OPT.padding} value={b.style.padding} onChange={(v) => style({ padding: v })} />
          </Field>
          <Field label="Largura">
            <Segmented options={OPT.maxWidth} value={b.style.maxWidth} onChange={(v) => style({ maxWidth: v })} />
          </Field>
        </div>
      </Group>
    </>
  );
}

function SectionCode({ block: b, onChange }) {
  const kind = BLOCK_TYPES[b.type];
  return (
    <div className="flex flex-col gap-4">
      {b.html !== undefined && (
        <Field label={kind.template === "item" ? "HTML de cada produto" : "HTML"}>
          <textarea rows={12} spellCheck={false} value={b.html} onChange={(e) => onChange({ html: e.target.value })} className={codeCls} />
          <span className="text-xs color-gray">
            {FIELDS[kind.template].map((f) => `{{${f}}}`).join(" ")} · data-if=&quot;campo&quot; · data-action=&quot;hours | cart&quot;
          </span>
        </Field>
      )}
      {b.categoryHtml !== undefined && (
        <Field label="HTML do título da categoria">
          <textarea rows={3} spellCheck={false} value={b.categoryHtml} onChange={(e) => onChange({ categoryHtml: e.target.value })} className={codeCls} />
          <span className="text-xs color-gray">{"{{name}} {{combos}}"}</span>
        </Field>
      )}
      <Field label="CSS">
        <textarea rows={10} spellCheck={false} value={b.css} onChange={(e) => onChange({ css: e.target.value })} className={codeCls} />
        <span className="text-xs color-gray">Vale só nesta seção · var(--bm-bg) var(--bm-text) var(--bm-accent) var(--bm-muted) var(--bm-soft)</span>
      </Field>
    </div>
  );
}

function ThemeSettings({ draft, menu, palette, setDraft }) {
  const colors = draft.colors || { bg: "", text: "", accent: "" };
  const setColors = (patch) => setDraft((d) => ({ ...d, colors: { ...(d.colors || {}), ...patch } }));
  const lowContrast = contrastRatio(palette.text, palette.bg) < 4.5;
  return (
    <>
      <Group title="Cores">
        <div className="grid gap-4 sm:grid-cols-3">
          <ColorField label="Fundo" value={colors.bg} auto={basePalette(menu).bg} onChange={(v) => setColors({ bg: v })} />
          <ColorField label="Texto" value={colors.text} auto={palette.text} onChange={(v) => setColors({ text: v })} />
          <ColorField label="Destaque" value={colors.accent} auto={basePalette(menu).accent} onChange={(v) => setColors({ accent: v })} />
        </div>
        {lowContrast && <p className="text-xs text-amber-600">Pouco contraste entre texto e fundo.</p>}
      </Group>
      <Group title="Tipografia">
        <div className="flex flex-wrap gap-2">
          {[["", "Padrão"], ...Object.keys(FONTS).map((f) => [f, f])].map(([f, label]) => (
            <button
              key={label}
              type="button"
              aria-pressed={draft.font === f}
              onClick={() => setDraft((d) => ({ ...d, font: f }))}
              style={f ? { fontFamily: `"${f}", sans-serif` } : undefined}
              className={`cursor-pointer rounded-lg border px-3 py-1.5 ${
                draft.font === f ? "border-brand-select bg-brand-select/10 font-semibold" : "border-[var(--translucid)] hover:border-brand-select/50"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </Group>
      <Group title="Página">
        <Field label="Largura no computador">
          <Segmented options={OPT.pageWidth} value={draft.pageWidth} onChange={(v) => setDraft((d) => ({ ...d, pageWidth: v }))} />
        </Field>
      </Group>
    </>
  );
}

// Prévia em tela cheia, só quando o dono pede: o rascunho vai por postMessage (CustomDraftPreview.jsx)
function PreviewModal({ slug, draft, onClose, onPublish, canPublish, saving }) {
  const [device, setDevice] = useState("mobile");
  const iframeRef = useRef(null);

  useEffect(() => {
    const post = () => iframeRef.current?.contentWindow?.postMessage({ type: "bm-layout-draft", layout: draft }, window.location.origin);
    post();
    const onMessage = (e) => {
      if (e.origin === window.location.origin && e.data?.type === "bm-layout-ready") post();
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [draft]);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/70 backdrop-blur-sm p-2 sm:p-4" role="dialog" aria-modal="true" aria-label="Prévia do cardápio">
      <div className="flex flex-wrap items-center gap-2 pb-2 sm:pb-4">
        <div className="flex gap-1 rounded-full bg-black/40 p-1">
          {[
            ["mobile", FaMobileAlt, "Celular"],
            ["desktop", FaDesktop, "Computador"],
          ].map(([d, Icon, label]) => (
            <button
              key={d}
              type="button"
              onClick={() => setDevice(d)}
              className={`cursor-pointer flex items-center gap-2 rounded-full px-3 py-1.5 text-sm text-white ${device === d ? "bg-white/20" : "opacity-70 hover:opacity-100"}`}
            >
              <Icon /> {label}
            </button>
          ))}
        </div>
        <div className="ml-auto flex gap-2">
          {canPublish && (
            <button type="button" onClick={onPublish} disabled={saving} className={primaryCls}>
              {saving ? "Salvando…" : "Publicar"}
            </button>
          )}
          <button type="button" onClick={onClose} className="cursor-pointer flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm text-white hover:bg-white/25">
            <FaTimes /> Fechar
          </button>
        </div>
      </div>
      <iframe
        ref={iframeRef}
        title="Prévia do cardápio"
        src={`/menu/${slug}/preview?custom_draft=1`}
        className={`mx-auto flex-1 rounded-2xl bg-white shadow-2xl ${device === "mobile" ? "w-[390px] max-w-full" : "w-full"}`}
      />
    </div>
  );
}

export default function CustomLayout() {
  const { menu } = useMenu();
  const customAlert = useAlert();
  const confirm = useConfirm();
  const [draft, setDraft] = useState(kept.draft);
  const [selected, setSelected] = useState(kept.selected); // THEME | id da seção
  const [panel, setPanel] = useState(kept.panel); // "settings" | "code"
  const [mobilePanel, setMobilePanel] = useState(false); // celular: lista ou painel
  const [messages, setMessages] = useState([]);
  const [replies, setReplies] = useState({}); // última resposta da IA por item (THEME ou id)
  const [sending, setSending] = useState(null);
  const [saving, setSaving] = useState(false);
  // o que está no banco. Local porque updateCachedMenu não re-renderiza a aba (status imediato ao publicar)
  const [live, setLive] = useState(null);
  const [usage, setUsage] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const addRef = useOutsideClose(showAdd, () => setShowAdd(false));

  useEffect(() => {
    kept = { draft, selected, panel };
  }, [draft, selected, panel]);

  useEffect(() => {
    if (!menu) return;
    setLive({ layout: menu.layout, custom_layout: menu.custom_layout });
    if (!kept.draft) setDraft(normalizeLayout(menu.custom_layout) ?? defaultLayout());
  }, [menu?.id]);

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
  const blocks = draft?.blocks || [];
  const block = selected === THEME ? null : blocks.find((b) => b.id === selected) || null;
  const palette = menu && draft ? layoutPalette(draft, basePalette(menu)) : null;
  const savedJson = live?.custom_layout ? JSON.stringify(normalizeLayout(live.custom_layout)) : null;
  const dirty = !!draft && JSON.stringify(normalizeLayout(draft)) !== savedJson;
  const active = live?.layout === "custom";
  const canPublish = !!menu && !!draft && (dirty || !active);

  const select = (id) => {
    setSelected(id);
    setMobilePanel(true);
  };
  const setBlocks = (fn) => setDraft((d) => ({ ...d, blocks: fn(d.blocks) }));
  const updateBlock = (id, patch) => setBlocks((bs) => bs.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  const move = (i, dir) =>
    setBlocks((bs) => {
      const j = i + dir;
      if (j < 0 || j >= bs.length) return bs;
      const next = [...bs];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  const removeBlock = async (b) => {
    if (!(await confirm(`Remover a seção "${BLOCK_TYPES[b.type].label}"?`))) return;
    setBlocks((bs) => bs.filter((x) => x.id !== b.id));
    if (selected === b.id) setSelected(THEME);
  };
  const addBlock = (type) => {
    const b = newBlock(type);
    setBlocks((bs) => [...bs, b]);
    setShowAdd(false);
    select(b.id);
  };

  // blockId null = cardápio todo
  const askAi = async (text, blockId = null) => {
    if (!text || sending || limitReached || !draft) return;
    const key = blockId ?? THEME;
    const base = normalizeLayout(draft); // o que a IA recebe: serve de referência para saber o que ela mudou
    const next = [...messages, { role: "user", content: text }].slice(-8);
    setMessages(next);
    setSending(key);
    const done = (content, changed = false) => {
      setMessages((prev) => [...prev, { role: "assistant", content }]);
      setReplies((r) => ({ ...r, [key]: { text: content, changed } }));
    };
    try {
      const res = await fetch("/api/assistant/layout", {
        method: "POST",
        headers: await authHeaders(),
        body: JSON.stringify({ messages: next, layout: draft, blockId }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.usage) setUsage(data.usage);
      if (!res.ok) return done(data.error || "Algo deu errado. Tente de novo.");
      // última alteração vale: a resposta entra só no que a IA mudou e o dono não mexeu enquanto ela gerava
      if (data.layout) setDraft((cur) => mergeAiLayout(base, data.layout, normalizeLayout(cur) ?? cur));
      done(data.reply, !!data.layout);
    } catch (err) {
      console.error("[CustomLayout] erro:", err);
      done("Sem conexão com a IA. Tente de novo.");
    } finally {
      setSending(null);
    }
  };

  // mesmo update do resto do cardápio (client do dono + RLS)
  const persist = async (patch, okMessage) => {
    setSaving(true);
    const { error } = await updateMenuById(supabase, menu.id, patch);
    setSaving(false);
    if (error) {
      console.error("[CustomLayout] erro ao salvar:", error);
      customAlert("Não foi possível salvar o layout.", "error");
      return;
    }
    updateCachedMenu(patch);
    setLive((l) => ({ ...l, ...patch }));
    customAlert(okMessage);
  };

  const publish = () => {
    const layout = normalizeLayout(draft);
    if (JSON.stringify(layout).length > CUSTOM_LAYOUT_MAX_LENGTH) {
      return customAlert("O layout ficou grande demais. Simplifique alguma seção.", "error");
    }
    setDraft(layout);
    persist({ custom_layout: layout, layout: "custom" }, "Layout publicado.");
  };

  const deactivate = async () => {
    if (await confirm("Tirar do cardápio? Ele volta ao layout padrão e este fica salvo aqui.")) {
      persist({ layout: "default" }, "Cardápio voltou ao layout padrão.");
    }
  };

  const discard = async () => {
    if (await confirm("Descartar as mudanças não publicadas?")) setDraft(normalizeLayout(live.custom_layout));
  };

  const restart = async () => {
    if (await confirm("Recomeçar do layout inicial? As mudanças não publicadas se perdem.")) {
      setDraft(defaultLayout());
      setSelected(THEME);
    }
  };

  const status = saving
    ? ["Salvando…", "bg-[var(--translucid)]"]
    : !active
      ? ["Não publicado", "bg-[var(--translucid)]"]
      : dirty
        ? ["Alterações pendentes", "bg-amber-500/15 text-amber-600"]
        : ["Publicado", "bg-green-500/15 text-green-600"];

  const aiKey = block?.id ?? THEME;
  const reply = replies[aiKey];

  if (!draft || !palette) return null;

  const PanelIcon = block ? BLOCK_ICONS[block.type] : FaPalette;

  return (
    <div className="pt-2 px-4 pb-10 flex flex-col gap-4">
      <link rel="stylesheet" href={FONT_HREF} precedence="default" />

      {/* barra superior */}
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="font-semibold">Layout personalizado</h2>
        <span role="status" className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${status[1]}`}>
          {status[0]}
        </span>
        <div className="ml-auto flex items-center gap-2">
          <button type="button" onClick={() => setShowPreview(true)} disabled={!menu?.slug} className={btnCls}>
            <FaEye /> Visualizar
          </button>
          <button type="button" onClick={publish} disabled={!canPublish || saving} className={primaryCls}>
            {saving ? "Salvando…" : "Publicar"}
          </button>
          <ActionsMenu
            ariaLabel="Mais ações do layout"
            options={[
              active &&
                menu?.slug && {
                  label: "Abrir cardápio",
                  icon: <FaExternalLinkAlt size={12} />,
                  onClick: () => window.open(`/menu/${menu.slug}`, "_blank", "noopener"),
                },
              dirty && savedJson && { label: "Descartar alterações", icon: <FaUndo size={12} />, onClick: discard },
              { label: "Recomeçar do layout inicial", icon: <FaUndo size={12} />, onClick: restart },
              active && { label: "Tirar do cardápio", icon: <FaTimes size={12} />, onClick: deactivate, danger: true },
            ].filter(Boolean)}
          />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[280px_1fr] lg:items-start">
        {/* lista: Tema + seções */}
        <nav aria-label="Seções" className={`${mobilePanel ? "hidden lg:flex" : "flex"} flex-col gap-1 rounded-2xl border border-[var(--translucid)] p-2 lg:sticky lg:top-2`}>
          <button
            type="button"
            onClick={() => select(THEME)}
            className={`cursor-pointer flex items-center gap-3 rounded-lg px-2 py-2 text-left text-sm ${selected === THEME ? "bg-[var(--translucid)] font-semibold" : "hover:bg-[var(--translucid)]"}`}
          >
            <FaPalette className="color-gray" /> Tema
          </button>

          <div className="mt-2 mb-1 flex items-center justify-between px-2">
            <span className="text-xs font-semibold uppercase tracking-wider color-gray">Seções</span>
          </div>

          {blocks.map((b, i) => {
            const Icon = BLOCK_ICONS[b.type];
            const isSel = selected === b.id;
            return (
              <div key={b.id} className={`group flex items-center gap-1 rounded-lg pr-1 ${isSel ? "bg-[var(--translucid)]" : "hover:bg-[var(--translucid)]"}`}>
                <button
                  type="button"
                  onClick={() => select(b.id)}
                  className={`cursor-pointer flex flex-1 min-w-0 items-center gap-3 px-2 py-2 text-left text-sm ${b.hidden ? "opacity-50" : ""} ${isSel ? "font-semibold" : ""}`}
                >
                  <Icon className="shrink-0 color-gray" />
                  <span className="truncate">{BLOCK_TYPES[b.type].label}</span>
                </button>
                <div className={`flex items-center ${isSel ? "" : "lg:opacity-0 lg:group-hover:opacity-100 lg:focus-within:opacity-100"}`}>
                  <button type="button" aria-label="Subir" title="Subir" disabled={i === 0} onClick={() => move(i, -1)} className={iconBtn}>
                    <FaArrowUp size={11} />
                  </button>
                  <button type="button" aria-label="Descer" title="Descer" disabled={i === blocks.length - 1} onClick={() => move(i, 1)} className={iconBtn}>
                    <FaArrowDown size={11} />
                  </button>
                  <button
                    type="button"
                    aria-label={b.hidden ? "Mostrar" : "Esconder"}
                    title={b.hidden ? "Mostrar" : "Esconder"}
                    onClick={() => updateBlock(b.id, { hidden: !b.hidden })}
                    className={iconBtn}
                  >
                    {b.hidden ? <FaEyeSlash size={12} /> : <FaEye size={12} />}
                  </button>
                  <button type="button" aria-label="Remover" title="Remover" onClick={() => removeBlock(b)} className={`${iconBtn} hover:!text-red-500`}>
                    <FaTrash size={11} />
                  </button>
                </div>
              </div>
            );
          })}

          <div ref={addRef} className="relative mt-1">
            <button
              type="button"
              onClick={() => setShowAdd(!showAdd)}
              aria-expanded={showAdd}
              className="cursor-pointer flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-sm text-brasa hover:bg-[var(--translucid)]"
            >
              <FaPlus /> Adicionar seção
            </button>
            {showAdd && (
              <div role="menu" className="absolute left-0 right-0 top-full z-30 mt-1 rounded-xl border border-[var(--translucid)] bg-[var(--background)] p-1 shadow-lg">
                {Object.entries(BLOCK_TYPES).map(([type, k]) => {
                  const Icon = BLOCK_ICONS[type];
                  return (
                    <button
                      key={type}
                      type="button"
                      role="menuitem"
                      onClick={() => addBlock(type)}
                      className="cursor-pointer flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm hover:bg-[var(--translucid)]"
                    >
                      <Icon className="shrink-0 color-gray" /> {k.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </nav>

        {/* painel do item selecionado */}
        <section className={`${mobilePanel ? "flex" : "hidden lg:flex"} flex-col gap-5 rounded-2xl border border-[var(--translucid)] p-4 sm:p-5`}>
          <div className="flex items-center gap-3">
            <button type="button" aria-label="Voltar" onClick={() => setMobilePanel(false)} className={`${iconBtn} lg:hidden`}>
              <FaArrowLeft />
            </button>
            <PanelIcon className="color-gray" />
            <h3 className="font-semibold">{block ? BLOCK_TYPES[block.type].label : "Tema"}</h3>
            <div className="ml-auto">
              <Segmented
                options={[
                  ["settings", "Configurações"],
                  ["code", "Código"],
                ]}
                value={panel}
                onChange={setPanel}
              />
            </div>
          </div>

          <AiBar
            key={`ai-${aiKey}`} // prefixo: irmãos com a mesma key (id da seção) duplicavam componentes
            placeholder={block ? `Pedir à IA para ${BLOCK_TYPES[block.type].label.toLowerCase()}…` : "Descreva o visual do cardápio…"}
            onSend={(text) => askAi(text, block?.id ?? null)}
            sending={sending === aiKey}
            disabled={!!sending || limitReached}
            reply={limitReached ? "Limite de IA desta sessão atingido." : reply?.text}
            onView={reply?.changed ? () => setShowPreview(true) : null}
            extra={
              !block && (
                <button type="button" onClick={() => askAi(SURPRISE)} disabled={!!sending || limitReached} className="cursor-pointer font-semibold text-brasa hover:underline disabled:opacity-50">
                  ✨ Surpreenda-me
                </button>
              )
            }
          />

          {panel === "settings" ? (
            block ? (
              <SectionSettings key={`settings-${block.id}`} block={block} palette={palette} onChange={(patch) => updateBlock(block.id, patch)} />
            ) : (
              <ThemeSettings draft={draft} menu={menu} palette={palette} setDraft={setDraft} />
            )
          ) : block ? (
            <SectionCode block={block} onChange={(patch) => updateBlock(block.id, patch)} />
          ) : (
            <Field label="CSS geral">
              <textarea rows={14} spellCheck={false} value={draft.css} onChange={(e) => setDraft((d) => ({ ...d, css: e.target.value }))} className={codeCls} />
              <span className="text-xs color-gray">Vale para o cardápio todo</span>
            </Field>
          )}

          {block && (
            <button type="button" onClick={() => updateBlock(block.id, newBlock(block.type, block.id))} className="cursor-pointer self-start text-xs color-gray hover:underline">
              Restaurar padrão da seção
            </button>
          )}
        </section>
      </div>

      {showPreview && menu?.slug && (
        <PreviewModal slug={menu.slug} draft={draft} onClose={() => setShowPreview(false)} onPublish={publish} canPublish={canPublish} saving={saving} />
      )}
    </div>
  );
}
