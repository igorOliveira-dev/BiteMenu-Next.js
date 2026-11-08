"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { DndContext, closestCenter, PointerSensor, TouchSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { HexColorPicker, HexColorInput } from "react-colorful";
import { FaEye, FaEyeSlash, FaGripVertical, FaLightbulb, FaPlus, FaShareAlt, FaTrash, FaUtensils } from "react-icons/fa";
import { supabase } from "@/lib/supabaseClient";
import useMenu, { updateCachedMenu } from "@/hooks/useMenu";
import { updateMenuById } from "@/lib/queries/menus";
import { useAlert } from "@/providers/AlertProvider";
import { useConfirm } from "@/providers/ConfirmProvider";
import { COLOR_PALETTES } from "@/consts/colorPallets";
import { IconAcessar } from "@/components/BrandIcons";
import QrCodeModal from "./components/menu/QrCodeModal";
import LinktreeView, { ICON_COMPONENTS } from "@/app/links/[slug]/LinktreeView";
import {
  ICONS,
  MAX_LABEL,
  MAX_LINKS,
  MAX_URL,
  cleanLinktree,
  defaultLinktree,
  iconFor,
  newLinkId,
  normalizeUrl,
  safeUrl,
} from "@/lib/linktree";

// Aba Links (tasks/linktree/linktree-plan.md). Salva por conta própria, fora do "Salvar tudo", como a aba Landing.
// O rascunho sobrevive à troca de aba (o Dashboard desmonta a aba) e some ao recarregar.
let kept = { menuId: null, draft: null };

const INPUT_CLASS =
  "h-11 w-full min-w-0 rounded-xl border border-[var(--translucid)] bg-translucid px-3 text-[15px] outline-none transition focus:border-brand-select/70";
const CARD_CLASS = "rounded-2xl border border-brand-line bg-brand-surface p-4";
const OUTLINE_BTN =
  "cursor-pointer inline-flex items-center justify-center gap-2 rounded-full border border-brand-line px-4 py-2 text-sm font-semibold transition hover:bg-[var(--translucid)] disabled:cursor-not-allowed disabled:opacity-50";

const BUTTON_OPTIONS = [
  { value: "fill", label: "Cheio" },
  { value: "outline", label: "Contorno" },
  { value: "soft", label: "Translúcido" },
];
const SHAPE_OPTIONS = [
  { value: "pill", label: "Pílula" },
  { value: "rounded", label: "Arredondado" },
];

const linkErrors = (link) => ({
  label: !link.label?.trim() ? "Dê um nome ao botão" : null,
  url: link.kind === "menu" ? null : !safeUrl(normalizeUrl(link.url)) ? "Endereço inválido" : null,
});

export default function Linktree() {
  const { menu } = useMenu();
  const customAlert = useAlert();
  const confirm = useConfirm();
  const [saved, setSaved] = useState(null); // versão do banco, já limpa (null = carregando)
  const [draft, setDraft] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [showShare, setShowShare] = useState(false);

  useEffect(() => {
    if (!menu) return;
    const fromDb = menu.linktree ? cleanLinktree(menu.linktree) : defaultLinktree();
    setSaved(fromDb);
    setDraft(kept.menuId === menu.id && kept.draft ? kept.draft : fromDb);
  }, [menu?.id]);

  useEffect(() => {
    if (menu && draft) kept = { menuId: menu.id, draft };
  }, [draft, menu?.id]);

  const preview = useMemo(() => (draft ? cleanLinktree(draft) : null), [draft]);
  const published = !!menu?.linktree;
  const dirty = !!draft && !!saved && (!published || JSON.stringify(preview) !== JSON.stringify(saved));

  if (!menu || !draft) return <div className="p-4">Carregando...</div>;

  const publicUrl = typeof window !== "undefined" ? `${window.location.origin}/links/${menu.slug}` : "";
  const style = draft.style;
  const hasMenuLink = draft.links.some((l) => l.kind === "menu");

  const setLinks = (fn) => setDraft((d) => ({ ...d, links: fn(d.links) }));
  const updateLink = (id, patch) => setLinks((ls) => ls.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  const setStyle = (patch) => setDraft((d) => ({ ...d, style: { ...d.style, ...patch } }));

  const addLink = (kind = "url") =>
    setLinks((ls) => [
      ...ls,
      kind === "menu"
        ? { id: newLinkId(), kind: "menu", label: "Ver cardápio", icon: null, hidden: false }
        : { id: newLinkId(), kind: "url", label: "", url: "", icon: null, hidden: false },
    ]);

  const removeLink = async (link) => {
    if (!(await confirm(`Remover o botão "${link.label || "sem nome"}"?`))) return;
    setLinks((ls) => ls.filter((l) => l.id !== link.id));
  };

  const save = async () => {
    const invalid = draft.links.some((l) => {
      const e = linkErrors(l);
      return e.label || e.url;
    });
    if (invalid) {
      setShowErrors(true);
      return customAlert("Confira os botões marcados antes de salvar", "error");
    }
    const clean = cleanLinktree({ ...draft, links: draft.links.map((l) => ({ ...l, url: normalizeUrl(l.url) })) });
    setSaving(true);
    const { error } = await updateMenuById(supabase, menu.id, { linktree: clean });
    setSaving(false);
    if (error) {
      console.error("[linktree] erro ao salvar:", error);
      return customAlert("Não foi possível salvar os links. Tente de novo.", "error");
    }
    menu.linktree = clean; // o useMenu guarda o objeto: outros usos (seletor do Descobrir) veem na hora
    updateCachedMenu({ linktree: clean });
    setSaved(clean);
    setDraft(clean);
    setShowErrors(false);
    customAlert("Links salvos!");
  };

  const discard = async () => {
    if (!(await confirm("Descartar as alterações não salvas?", { tone: "confirm" }))) return;
    setDraft(saved);
    setShowErrors(false);
  };

  const needsSave = () => {
    if (published) return false;
    customAlert("Salve os links primeiro", "error");
    return true;
  };

  return (
    <div className="w-full px-2 pb-32 pt-3">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold">Links</h2>
          <p className="text-sm color-gray">
            Uma página com os seus links, para a bio do Instagram. Fica em{" "}
            <span className="font-medium">bitemenu.com.br/links/{menu.slug}</span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => !needsSave() && window.open(publicUrl, "_blank", "noopener,noreferrer")}
            className={OUTLINE_BTN}
          >
            <IconAcessar className="text-lg" /> Ver página
          </button>
          <button
            type="button"
            onClick={() => !needsSave() && setShowShare(true)}
            className="cursor-pointer inline-flex items-center gap-2 rounded-full bg-azul px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
          >
            <FaShareAlt /> Compartilhar
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-4">
          <section className={CARD_CLASS}>
            <div className="mb-3 flex items-center justify-between gap-2">
              <h3 className="text-base font-semibold">Botões</h3>
              <span className="text-xs color-gray">
                {draft.links.length}/{MAX_LINKS}
              </span>
            </div>

            <LinkList
              links={draft.links}
              onReorder={(from, to) => setLinks((ls) => arrayMove(ls, from, to))}
              onChange={updateLink}
              onRemove={removeLink}
              showErrors={showErrors}
            />

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => addLink()}
                disabled={draft.links.length >= MAX_LINKS}
                className="cursor-pointer inline-flex items-center gap-2 rounded-full bg-azul px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <FaPlus /> Adicionar link
              </button>
              {!hasMenuLink && (
                <button type="button" onClick={() => addLink("menu")} disabled={draft.links.length >= MAX_LINKS} className={OUTLINE_BTN}>
                  <FaPlus /> Botão do cardápio
                </button>
              )}
            </div>
          </section>

          <Appearance style={style} menu={menu} onChange={setStyle} />

          <div className="sticky bottom-24 z-10 flex flex-wrap items-center justify-end gap-2 rounded-2xl border border-brand-line bg-brand-surface p-2 lg:bottom-4">
            {dirty && (
              <span className="mr-auto px-2 text-sm color-gray">{published ? "Alterações não salvas" : "Ainda não salva"}</span>
            )}
            {dirty && published && (
              <button type="button" onClick={discard} className={OUTLINE_BTN}>
                Descartar
              </button>
            )}
            <button
              type="button"
              onClick={save}
              disabled={saving || !dirty}
              className="cursor-pointer rounded-full bg-verde px-6 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </div>

        <div className="lg:sticky lg:top-4 lg:self-start">
          <p className="mb-2 text-sm font-medium color-gray">Prévia</p>
          <div className="mx-auto h-[640px] max-h-[75dvh] w-full max-w-[380px] overflow-y-auto overscroll-contain rounded-[2rem] border-4 border-brand-line">
            <LinktreeView menu={menu} linktree={preview} preview />
          </div>
        </div>
      </div>

      <QrCodeModal
        isOpen={showShare}
        onClose={() => setShowShare(false)}
        url={publicUrl}
        externalUrl={publicUrl}
        filename={`linktree-${menu.slug}`}
        title="Compartilhar links"
        shareText={`Confira os links de ${menu.title}:`}
        onToast={(msg, type) => customAlert(msg, type)}
      />
    </div>
  );
}

function LinkList({ links, onReorder, onChange, onRemove, showErrors }) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } }),
  );

  const onDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return;
    const from = links.findIndex((l) => l.id === active.id);
    const to = links.findIndex((l) => l.id === over.id);
    if (from !== -1 && to !== -1) onReorder(from, to);
  };

  if (!links.length) {
    return (
      <p className="rounded-xl border border-dashed border-[var(--translucid)] p-6 text-center text-sm color-gray">
        Nenhum botão ainda.
      </p>
    );
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={links.map((l) => l.id)} strategy={verticalListSortingStrategy}>
        <ul className="space-y-2">
          {links.map((link) => (
            <LinkRow key={link.id} link={link} onChange={onChange} onRemove={onRemove} showErrors={showErrors} />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}

function LinkRow({ link, onChange, onRemove, showErrors }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: link.id });
  const [pickIcon, setPickIcon] = useState(false);
  const errors = showErrors ? linkErrors(link) : {};
  const Icon = ICON_COMPONENTS[iconFor(link)];

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, ...(isDragging && { opacity: 0.75, zIndex: 1 }) }}
      className={`relative rounded-xl border border-[var(--translucid)] bg-translucid p-3 ${link.hidden ? "opacity-60" : ""}`}
    >
      <div className="flex items-start gap-2">
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label="Arrastar para reordenar"
          className="mt-3 cursor-grab touch-none text-sm opacity-50 transition hover:opacity-100 active:cursor-grabbing"
        >
          <FaGripVertical />
        </button>

        <button
          type="button"
          onClick={() => setPickIcon((v) => !v)}
          aria-label="Escolher ícone"
          aria-expanded={pickIcon}
          title="Escolher ícone"
          className={`flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-xl border transition hover:border-brand-select/50 ${
            pickIcon ? "border-brand-select/70" : "border-[var(--translucid)]"
          }`}
        >
          <Icon className="text-lg" />
        </button>

        <div className="grid min-w-0 flex-1 gap-2">
          <div>
            <input
              value={link.label}
              maxLength={MAX_LABEL}
              onChange={(e) => onChange(link.id, { label: e.target.value })}
              placeholder="Nome do botão (ex.: Instagram)"
              aria-label="Nome do botão"
              className={`${INPUT_CLASS} ${errors.label ? "border-red-500" : ""}`}
            />
            {errors.label && <p className="mt-1 text-xs text-red-500">{errors.label}</p>}
          </div>
          {link.kind === "menu" ? (
            <p className="flex items-center gap-2 px-1 text-xs color-gray">
              <FaUtensils /> Abre o seu cardápio
            </p>
          ) : (
            <div>
              <input
                value={link.url}
                maxLength={MAX_URL}
                inputMode="url"
                onChange={(e) => onChange(link.id, { url: e.target.value })}
                onBlur={(e) => onChange(link.id, { url: normalizeUrl(e.target.value) })}
                placeholder="instagram.com/seu_perfil, wa.me/55..., tel:+55..."
                aria-label="Endereço do link"
                className={`${INPUT_CLASS} ${errors.url ? "border-red-500" : ""}`}
              />
              {errors.url && <p className="mt-1 text-xs text-red-500">{errors.url}</p>}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <button
            type="button"
            onClick={() => onChange(link.id, { hidden: !link.hidden })}
            aria-label={link.hidden ? "Mostrar botão" : "Esconder botão"}
            title={link.hidden ? "Mostrar" : "Esconder"}
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full transition hover:bg-[var(--translucid)]"
          >
            {link.hidden ? <FaEyeSlash /> : <FaEye />}
          </button>
          <button
            type="button"
            onClick={() => onRemove(link)}
            aria-label="Remover botão"
            title="Remover"
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full color-gray transition hover:bg-[var(--translucid)] hover:text-red-500"
          >
            <FaTrash className="text-sm" />
          </button>
        </div>
      </div>

      {pickIcon && (
        <div className="mt-3 grid grid-cols-[repeat(auto-fill,minmax(76px,1fr))] gap-1.5" role="listbox" aria-label="Ícones">
          <IconChoice selected={!link.icon} label="Automático" onClick={() => (onChange(link.id, { icon: null }), setPickIcon(false))}>
            <span className="text-xs font-bold">Auto</span>
          </IconChoice>
          {Object.entries(ICONS).map(([key, label]) => {
            const C = ICON_COMPONENTS[key];
            return (
              <IconChoice key={key} selected={link.icon === key} label={label} onClick={() => (onChange(link.id, { icon: key }), setPickIcon(false))}>
                <C className="text-lg" />
              </IconChoice>
            );
          })}
        </div>
      )}
    </li>
  );
}

function IconChoice({ selected, label, onClick, children }) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={selected}
      onClick={onClick}
      title={label}
      className={`flex cursor-pointer flex-col items-center gap-1 rounded-xl border p-2 text-[11px] transition ${
        selected ? "border-brand-select/60 bg-brand-select/10" : "border-transparent hover:bg-[var(--translucid)]"
      }`}
    >
      {children}
      <span className="w-full truncate text-center">{label}</span>
    </button>
  );
}

function Switch({ checked, onChange, label, hint }) {
  return (
    <label className="flex cursor-pointer items-center gap-3">
      <span className="switch shrink-0">
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <span className="slider"></span>
      </span>
      <span>
        <span className="block text-sm font-medium">{label}</span>
        {hint && <span className="block text-xs opacity-60">{hint}</span>}
      </span>
    </label>
  );
}

function Choices({ options, value, onChange, label }) {
  return (
    <div>
      <p className="mb-2 text-sm font-medium">{label}</p>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={label}>
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={value === o.value}
            onClick={() => onChange(o.value)}
            className={`cursor-pointer rounded-full border px-4 py-2 text-sm font-medium transition ${
              value === o.value ? "border-brand-select/60 bg-brand-select/10 text-brand-eyebrow" : "border-[var(--translucid)] hover:border-brand-select/30"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function Appearance({ style, menu, onChange }) {
  const [openColor, setOpenColor] = useState(null);
  const openRef = useRef(null);
  const menuColors = {
    bg: menu.background_color || "#ffffff",
    title: menu.title_color || "#171717",
    details: menu.details_color || "#d42020",
  };
  const ownColors = !!style.colors;
  const colors = style.colors || menuColors;

  useEffect(() => {
    if (openColor === null) return;
    const close = (e) => !openRef.current?.contains(e.target) && setOpenColor(null);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [openColor]);

  const setColor = (key, value) => onChange({ colors: { ...colors, [key]: value } });
  const suggest = () => {
    const { bg, title, details } = COLOR_PALETTES[Math.floor(Math.random() * COLOR_PALETTES.length)];
    onChange({ colors: { bg, title, details } });
  };

  const fields = [
    { key: "bg", label: "Fundo" },
    { key: "title", label: "Título" },
    { key: "details", label: "Detalhes" },
  ];

  return (
    <section className={`${CARD_CLASS} grid gap-5`}>
      <h3 className="text-base font-semibold">Aparência</h3>

      <div className="grid gap-3">
        <Switch
          checked={!ownColors}
          onChange={(useMenuColors) => onChange({ colors: useMenuColors ? null : { ...menuColors } })}
          label="Usar cores do cardápio"
          hint="Muda junto quando você trocar as cores do cardápio"
        />
        {ownColors && (
          <>
            <div className="grid gap-3 sm:grid-cols-3">
              {fields.map((f) => (
                <div key={f.key} ref={openColor === f.key ? openRef : null}>
                  <div className="mb-2 text-xs opacity-60">{f.label}</div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setOpenColor(openColor === f.key ? null : f.key)}
                      className="h-11 w-11 shrink-0 cursor-pointer rounded-xl border border-[var(--high-translucid)]"
                      style={{ backgroundColor: colors[f.key] }}
                      aria-label={`Escolher cor: ${f.label}`}
                      aria-expanded={openColor === f.key}
                    />
                    <HexColorInput
                      prefixed
                      color={colors[f.key]}
                      onChange={(c) => setColor(f.key, c)}
                      aria-label={`Hexadecimal: ${f.label}`}
                      className={`${INPUT_CLASS} uppercase`}
                    />
                  </div>
                  {openColor === f.key && (
                    <HexColorPicker
                      color={colors[f.key]}
                      onChange={(c) => setColor(f.key, c)}
                      style={{ width: "100%", height: 150, marginTop: 8 }}
                    />
                  )}
                </div>
              ))}
            </div>
            <button type="button" onClick={suggest} className={`${OUTLINE_BTN} justify-self-start`}>
              <FaLightbulb /> Sugerir cores
            </button>
          </>
        )}
      </div>

      <Choices label="Estilo do botão" options={BUTTON_OPTIONS} value={style.button} onChange={(button) => onChange({ button })} />
      <Choices label="Formato do botão" options={SHAPE_OPTIONS} value={style.shape} onChange={(shape) => onChange({ shape })} />

      <div className="grid gap-3">
        <p className="text-sm font-medium">Mostrar no topo</p>
        <Switch checked={style.showBanner} onChange={(showBanner) => onChange({ showBanner })} label="Banner" />
        <Switch checked={style.showLogo} onChange={(showLogo) => onChange({ showLogo })} label="Logo" />
        <Switch checked={style.showDescription} onChange={(showDescription) => onChange({ showDescription })} label="Descrição" />
      </div>
    </section>
  );
}
