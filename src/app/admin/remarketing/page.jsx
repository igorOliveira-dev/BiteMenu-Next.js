"use client";

import { useEffect, useRef, useState } from "react";
import { FaCog, FaPen, FaPlus, FaTimes, FaPaperPlane, FaSync, FaTrash } from "react-icons/fa";
import { supabase } from "@/lib/supabaseClient";
import Loading from "@/components/Loading";
import Return from "@/components/Return";
import { ROLE_OPTIONS, TRACKS, VARIABLES } from "@/consts/remarketing";

// Painel do remarketing por e-mail: pausa, limites, condições das trilhas, conteúdo dos e-mails e fila do dia.
// Tudo passa por /api/remarketing/admin (as tabelas marketing_* só são acessíveis pelo service role).

async function api(method, body, query = "") {
  const { data } = await supabase.auth.getSession();
  const res = await fetch(`/api/remarketing/admin${query}`, {
    method,
    headers: { Authorization: `Bearer ${data.session?.access_token}`, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Erro");
  return json;
}

const pct = (n, d) => (d ? `${Math.round((n / d) * 1000) / 10}%` : "—");
const card = "rounded-3xl border-2 bg-translucid border-[var(--translucid)] p-5";
const input = "w-full rounded-xl border-2 border-[var(--translucid)] bg-transparent px-3 py-2 text-sm outline-none focus:border-red-500/50";
const btn = "inline-flex items-center gap-2 cursor-pointer rounded-xl px-3 py-2 text-sm border-2 border-[var(--translucid)] hover:bg-[var(--translucid)] transition disabled:opacity-50";
const btnRed = "inline-flex items-center gap-2 cursor-pointer rounded-xl px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition disabled:opacity-50";
const gray = { color: "var(--gray)" };

function Switch({ on, onChange, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      disabled={disabled}
      onClick={() => onChange(!on)}
      className={`relative h-6 w-11 shrink-0 cursor-pointer rounded-full transition disabled:opacity-50 ${on ? "bg-green-500" : "bg-neutral-400/40"}`}
    >
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${on ? "left-[22px]" : "left-0.5"}`} />
    </button>
  );
}

function Dot({ on }) {
  return <span className={`inline-block h-2 w-2 rounded-full ${on ? "bg-green-500" : "bg-yellow-500"}`} />;
}

function Tile({ label, value, sub, alert }) {
  return (
    <div className={`rounded-2xl border-2 px-3 py-2 ${alert ? "border-red-500/60" : "border-[var(--translucid)]"}`}>
      <p className="text-[11px] uppercase tracking-wide" style={gray}>
        {label}
      </p>
      <p className={`text-lg font-bold ${alert ? "text-red-500" : ""}`}>{value}</p>
      {sub && (
        <p className="text-[11px]" style={gray}>
          {sub}
        </p>
      )}
    </div>
  );
}

function Field({ label, children, className = "" }) {
  return (
    <label className={`block text-sm space-y-1 ${className}`}>
      <span className="text-xs" style={gray}>
        {label}
      </span>
      {children}
    </label>
  );
}

function Metrics({ m }) {
  const spam = m?.sent ? m.complained / m.sent : 0;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      <Tile label="Enviados" value={m?.sent ?? 0} sub={`controle: ${m?.control ?? 0}`} />
      <Tile label="Abertura" value={pct(m?.opened, m?.sent)} sub={`clique: ${pct(m?.clicked, m?.sent)}`} />
      <Tile label="Voltaram" value={pct(m?.returned, m?.sent)} sub={`controle: ${pct(m?.controlReturned, m?.control)}`} />
      <Tile label="Assinaram" value={pct(m?.subscribed, m?.sent)} sub={`controle: ${pct(m?.controlSubscribed, m?.control)}`} />
      <Tile label="Bounce" value={pct(m?.bounced, m?.sent)} />
      <Tile label="Spam" value={pct(m?.complained, m?.sent)} alert={spam > 0.003} sub={spam > 0.003 ? "acima de 0,3%" : null} />
    </div>
  );
}

function Settings({ settings, onSaved, notify }) {
  const [form, setForm] = useState(settings);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await api("POST", { action: "settings", ...form, paused: settings.paused });
      notify("Salvo");
      onSaved();
    } catch (err) {
      notify(err.message, true);
    }
    setSaving(false);
  };

  return (
    <div className={`${card} grid grid-cols-1 sm:grid-cols-4 gap-3 items-end`}>
      <Field label="E-mails por dia">
        <input type="number" min="0" className={input} value={form.daily_limit} onChange={(e) => setForm({ ...form, daily_limit: e.target.value })} />
      </Field>
      <Field label="Dias entre e-mails">
        <input type="number" min="0" className={input} value={form.min_gap_days} onChange={(e) => setForm({ ...form, min_gap_days: e.target.value })} />
      </Field>
      <Field label="Grupo de controle (%)">
        <input type="number" min="0" max="100" className={input} value={form.control_percent} onChange={(e) => setForm({ ...form, control_percent: e.target.value })} />
      </Field>
      <button className={`${btnRed} justify-center`} disabled={saving} onClick={save}>
        Salvar
      </button>
    </div>
  );
}

function Conditions({ meta, track, onSaved, notify }) {
  const [form, setForm] = useState(track);
  const [saving, setSaving] = useState(false);
  useEffect(() => setForm(track), [track]);

  const cond = form.conditions ?? {};
  const setCond = (key, value) => setForm({ ...form, conditions: { ...cond, [key]: value } });
  const roles = cond.roles ?? ["free"];

  const save = async () => {
    setSaving(true);
    try {
      await api("POST", { action: "track", ...form, paused: track.paused });
      notify("Condições salvas");
      onSaved();
    } catch (err) {
      notify(err.message, true);
    }
    setSaving(false);
  };

  return (
    <div className={`${card} space-y-4`}>
      <h3 className="font-semibold">Quem recebe</h3>
      <div className="flex flex-wrap gap-2">
        {ROLE_OPTIONS.map((r) => {
          const on = roles.includes(r);
          return (
            <button
              key={r}
              type="button"
              onClick={() => setCond("roles", on ? roles.filter((x) => x !== r) : [...roles, r])}
              className={`cursor-pointer rounded-full px-3 py-1 text-sm border-2 transition ${on ? "border-red-500 bg-red-500/15 font-semibold" : "border-[var(--translucid)]"}`}
            >
              {r}
            </button>
          );
        })}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {meta.fields.map((f) =>
          f.type === "boolean" ? (
            <label key={f.key} className="flex items-center justify-between gap-3 text-sm rounded-xl border-2 border-[var(--translucid)] px-3 py-2">
              {f.label}
              <Switch on={!!cond[f.key]} onChange={(v) => setCond(f.key, v)} />
            </label>
          ) : (
            <Field key={f.key} label={f.label}>
              <input
                type="number"
                min="0"
                className={input}
                value={cond[f.key] ?? ""}
                onChange={(e) => setCond(f.key, e.target.value === "" ? null : Number(e.target.value))}
              />
            </Field>
          ),
        )}
        <Field label="E-mails por dia (trilha)">
          <input type="number" min="0" className={input} value={form.daily_limit} onChange={(e) => setForm({ ...form, daily_limit: e.target.value })} />
        </Field>
      </div>
      <button className={btnRed} disabled={saving} onClick={save}>
        Salvar condições
      </button>
    </div>
  );
}

const EMPTY_STEP = { name: "", position: 0, delay_days: "", subject: "", preview: "", title: "", body: "", cta_label: "", cta_path: "/dashboard", active: false, valid_from: "", valid_until: "" };
const toForm = (s) => ({ ...EMPTY_STEP, ...s, delay_days: s.delay_days ?? "", valid_from: s.valid_from ?? "", valid_until: s.valid_until ?? "" });

function StepEditor({ initial, onClose, onSaved, notify }) {
  const [step, setStep] = useState(toForm(initial));
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState(false);
  const bodyRef = useRef(null);
  const meta = TRACKS.find((t) => t.id === step.track);
  const set = (key) => (e) => setStep({ ...step, [key]: e.target.value });

  const run = async (fn) => {
    setBusy(true);
    try {
      await fn();
    } catch (err) {
      notify(err.message, true);
    }
    setBusy(false);
  };

  const refreshPreview = (s = step) => run(async () => setPreview(await api("POST", { action: "preview", step: s })));

  useEffect(() => {
    if (initial.id) refreshPreview(toForm(initial));
  }, []);

  // clicar numa variável insere no cursor do texto
  const insertVar = (key) => {
    const el = bodyRef.current;
    const tag = `{{${key}}}`;
    const start = el?.selectionStart ?? step.body.length;
    const end = el?.selectionEnd ?? step.body.length;
    setStep({ ...step, body: step.body.slice(0, start) + tag + step.body.slice(end) });
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(start + tag.length, start + tag.length);
    });
  };

  const save = () =>
    run(async () => {
      const { step: saved } = await api("POST", { action: "step-save", step });
      setStep(toForm(saved));
      notify(`Salvo · v${saved.version}`);
      onSaved();
      setPreview(await api("POST", { action: "preview", step: saved }));
    });

  const test = () =>
    run(async () => {
      const { sentTo } = await api("POST", { action: "test", step });
      notify(`Teste enviado para ${sentTo}`);
    });

  const remove = () => {
    if (!window.confirm("Excluir este e-mail?")) return;
    run(async () => {
      await api("POST", { action: "step-delete", id: step.id });
      notify("Excluído");
      onSaved();
      onClose();
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-stretch sm:items-center justify-center sm:p-4" onClick={onClose}>
      <div
        className="w-full max-w-6xl sm:h-[92dvh] bg-[var(--background)] sm:rounded-3xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-5 py-3 border-b-2 border-[var(--translucid)]">
          <h2 className="font-bold">
            {step.id ? step.name || "E-mail" : "Novo e-mail"}
            <span className="ml-2 text-xs font-mono" style={gray}>
              Trilha {step.track}
              {step.id && ` · v${step.version}`}
            </span>
          </h2>
          <label className="ml-auto flex items-center gap-2 text-sm">
            Ativo
            <Switch on={!!step.active} onChange={(v) => setStep({ ...step, active: v })} />
          </label>
          <button className="cursor-pointer p-2 rounded-lg hover:bg-[var(--translucid)]" onClick={onClose} aria-label="Fechar">
            <FaTimes />
          </button>
        </div>

        <div className="flex-1 overflow-auto grid grid-cols-1 lg:grid-cols-2">
          <div className="p-5 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Nome interno">
                <input className={input} value={step.name} onChange={set("name")} />
              </Field>
              {meta?.delayLabel ? (
                <Field label={`Enviar com (${meta.delayLabel})`}>
                  <input type="number" min="0" className={input} value={step.delay_days} onChange={set("delay_days")} />
                </Field>
              ) : (
                <Field label="Ordem">
                  <input type="number" min="0" className={input} value={step.position} onChange={set("position")} />
                </Field>
              )}
            </div>
            {step.track === "C" && (
              <div className="grid grid-cols-2 gap-3">
                <Field label="Válido de">
                  <input type="date" className={input} value={step.valid_from} onChange={set("valid_from")} />
                </Field>
                <Field label="Até">
                  <input type="date" className={input} value={step.valid_until} onChange={set("valid_until")} />
                </Field>
              </div>
            )}
            <Field label="Assunto">
              <input className={input} value={step.subject} onChange={set("subject")} />
            </Field>
            <Field label="Pré-visualização na caixa de entrada">
              <input className={input} value={step.preview} onChange={set("preview")} />
            </Field>
            <Field label="Título (opcional)">
              <input className={input} value={step.title} onChange={set("title")} placeholder="Usa o assunto" />
            </Field>
            <Field label="Texto">
              <div className="flex flex-wrap gap-1 pb-1">
                {VARIABLES.map((v) => (
                  <button
                    key={v.key}
                    type="button"
                    title={v.help}
                    onClick={() => insertVar(v.key)}
                    className="cursor-pointer rounded-full px-2 py-0.5 text-xs font-mono bg-[var(--translucid)] hover:bg-red-500/20 transition"
                  >
                    {v.key}
                  </button>
                ))}
              </div>
              <textarea ref={bodyRef} rows={11} className={`${input} font-mono`} value={step.body} onChange={set("body")} />
              <span className="text-[11px]" style={gray}>
                Linha em branco = novo parágrafo · **negrito**
              </span>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Botão">
                <input className={input} value={step.cta_label} onChange={set("cta_label")} placeholder="Sem botão" />
              </Field>
              <Field label="Link do botão">
                <input className={input} value={step.cta_path} onChange={set("cta_path")} />
              </Field>
            </div>
          </div>

          <div className="p-5 bg-[var(--translucid)] flex flex-col gap-2 min-h-[500px]">
            <div className="flex items-center gap-2">
              <p className="text-sm truncate flex-1">
                {preview ? <b>{preview.subject}</b> : <span style={gray}>Prévia</span>}
              </p>
              <button className={btn} disabled={busy} onClick={() => refreshPreview()}>
                <FaSync /> Atualizar
              </button>
            </div>
            {preview ? (
              <iframe title="Prévia" srcDoc={preview.html} className="w-full flex-1 rounded-2xl bg-white" />
            ) : (
              <div className="flex-1 rounded-2xl border-2 border-dashed border-[var(--translucid)] grid place-items-center text-sm" style={gray}>
                Clique em Atualizar
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 px-5 py-3 border-t-2 border-[var(--translucid)]">
          {step.id && (
            <button className="cursor-pointer p-2 rounded-lg text-red-500 hover:bg-red-500/10" disabled={busy} onClick={remove} title="Excluir">
              <FaTrash />
            </button>
          )}
          <button className={`${btn} ml-auto`} disabled={busy} onClick={test}>
            <FaPaperPlane /> Teste pra mim
          </button>
          <button className={btnRed} disabled={busy} onClick={save}>
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}

function StepRow({ step, meta, metrics, onEdit, onToggle }) {
  const m = metrics.find((x) => x.version === step.version);
  return (
    <div className="flex items-center gap-3 py-3 border-t-2 border-[var(--translucid)] first:border-t-0">
      <Switch on={!!step.active} onChange={onToggle} />
      <span className="w-14 shrink-0 text-center text-xs font-semibold rounded-lg bg-[var(--translucid)] py-1">
        {meta.delayLabel ? `dia ${step.delay_days ?? "?"}` : `#${step.position}`}
      </span>
      <button className="flex-1 min-w-0 text-left cursor-pointer" onClick={onEdit}>
        <p className={`text-sm font-medium truncate ${step.active ? "" : "opacity-50"}`}>{step.subject || "Sem assunto"}</p>
        <p className="text-xs truncate" style={gray}>
          {step.name} · v{step.version}
          {step.valid_until && ` · até ${new Date(`${step.valid_until}T12:00:00`).toLocaleDateString("pt-BR")}`}
        </p>
      </button>
      <div className="hidden sm:block text-right text-xs shrink-0" style={gray}>
        <p>
          <b>{m?.sent ?? 0}</b> env.
        </p>
        <p>{pct(m?.opened, m?.sent)} abert.</p>
      </div>
      <button className="cursor-pointer p-2 rounded-lg hover:bg-[var(--translucid)]" onClick={onEdit} aria-label="Editar">
        <FaPen className="text-sm" />
      </button>
    </div>
  );
}

function TrackView({ meta, data, onSaved, notify, onEdit }) {
  const track = data.tracks[meta.id];
  const [saving, setSaving] = useState(false);
  const steps = data.steps
    .filter((s) => s.track === meta.id)
    .sort((a, b) => (meta.delayLabel ? (a.delay_days ?? 0) - (b.delay_days ?? 0) : a.position - b.position));

  const togglePause = async (on) => {
    setSaving(true);
    try {
      await api("POST", { action: "track", ...track, paused: !on });
      notify(on ? `Trilha ${meta.id} ligada` : `Trilha ${meta.id} pausada`);
      onSaved();
    } catch (err) {
      notify(err.message, true);
    }
    setSaving(false);
  };

  const toggleStep = async (step, active) => {
    try {
      await api("POST", { action: "step-save", step: { ...step, active } });
      onSaved();
    } catch (err) {
      notify(err.message, true);
    }
  };

  if (!track) return null;

  return (
    <div className="space-y-4">
      <div className={`${card} space-y-4`}>
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <h2 className="font-bold">{meta.name}</h2>
            <p className="text-sm" style={gray}>
              {meta.description}
            </p>
          </div>
          <Switch on={!track.paused} onChange={togglePause} disabled={saving} />
        </div>
        <Metrics m={data.metrics.tracks[meta.id]} />
        <p className="text-[11px]" style={gray}>
          Últimos 30 dias
        </p>
      </div>

      <div className={card}>
        <div className="flex items-center mb-1">
          <h3 className="font-semibold flex-1">E-mails</h3>
          <button className={btn} onClick={() => onEdit({ track: meta.id, position: steps.length + 1, active: true })}>
            <FaPlus className="text-xs" /> Novo
          </button>
        </div>
        {steps.length === 0 ? (
          <p className="text-sm py-3" style={gray}>
            Nenhum e-mail.
          </p>
        ) : (
          steps.map((s) => (
            <StepRow
              key={s.id}
              step={s}
              meta={meta}
              metrics={data.metrics.steps.filter((m) => m.stepId === s.id)}
              onEdit={() => onEdit(s)}
              onToggle={(v) => toggleStep(s, v)}
            />
          ))
        )}
      </div>

      <Conditions meta={meta} track={track} onSaved={onSaved} notify={notify} />
    </div>
  );
}

function Queue({ notify }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      setData(await api("GET", null, "?view=queue"));
    } catch (err) {
      notify(err.message, true);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  if (!data) return <div className={`${card} text-sm text-center`} style={gray}>{loading ? "Calculando..." : "—"}</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <p className="text-sm flex-1" style={gray}>
          Se rodasse agora, sem pausas. Nada é enviado.
        </p>
        <button className={btn} disabled={loading} onClick={load}>
          <FaSync className={loading ? "animate-spin" : ""} /> Recalcular
        </button>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {TRACKS.map((t) => {
          const s = data.summary[t.id];
          return <Tile key={t.id} label={`${t.id} · ${t.name}`} value={s.queued} sub={`+${s.deferred} depois · ${s.control} controle`} />;
        })}
      </div>
      <div className={`${card} overflow-x-auto !p-0`}>
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left" style={gray}>
              {["E-mail", "Para", "Cardápio", "Itens", "Sem acessar"].map((h) => (
                <th key={h} className="px-4 py-2 font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.queue.slice(0, 300).map((q, i) => (
              <tr key={i} className="border-t border-[var(--translucid)]">
                <td className="px-4 py-2 whitespace-nowrap">
                  <b>{q.step}</b>
                  {q.control && <span className="ml-1 text-yellow-600">controle</span>}
                </td>
                <td className="px-4 py-2">
                  <p>{q.name}</p>
                  <p style={gray}>{q.email}</p>
                </td>
                <td className="px-4 py-2">
                  {q.restaurant ?? "—"}
                  {q.hadOrder && <span className="ml-1 text-green-600">●</span>}
                </td>
                <td className="px-4 py-2">{q.items}</td>
                <td className="px-4 py-2">{q.accessDays == null ? "—" : `${q.accessDays}d`}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {data.queue.length === 0 && (
          <p className="text-sm text-center py-6" style={gray}>
            Ninguém na fila.
          </p>
        )}
      </div>
    </div>
  );
}

export default function AdminRemarketingPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState("A");
  const [showSettings, setShowSettings] = useState(false);
  const [editing, setEditing] = useState(null);
  const [toast, setToast] = useState(null);

  const load = () =>
    api("GET")
      .then(setData)
      .catch((err) => setError(err.message));

  useEffect(() => {
    load();
  }, []);

  const notify = (message, isError = false) => {
    setToast({ message, isError });
    setTimeout(() => setToast(null), 3000);
  };

  const toggleMaster = async (on) => {
    if (on && !window.confirm("Ligar o envio? As trilhas ligadas enviam no próximo cron.")) return;
    try {
      await api("POST", { action: "settings", ...data.settings, paused: !on });
      notify(on ? "Envio ligado" : "Envio pausado");
      load();
    } catch (err) {
      notify(err.message, true);
    }
  };

  if (error) {
    return (
      <div className="p-6 text-center text-sm space-y-2">
        <p className="text-red-500">{error}</p>
        <p style={gray}>Tabelas não criadas? Rode tasks/remarketing.sql no Supabase.</p>
      </div>
    );
  }
  if (!data) return <Loading />;

  const { settings, metrics } = data;
  const on = !settings.paused;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
      <div className="flex items-center gap-2">
        <Return />
        <h1 className="text-xl font-bold flex-1">Remarketing</h1>
        <button
          className={`cursor-pointer p-2 rounded-lg hover:bg-[var(--translucid)] ${showSettings ? "bg-[var(--translucid)]" : ""}`}
          onClick={() => setShowSettings(!showSettings)}
          aria-label="Configurações"
        >
          <FaCog />
        </button>
      </div>

      <div className={`${card} flex items-center gap-4 ${on ? "!border-green-500/50" : ""}`}>
        <div className="flex-1">
          <p className="font-bold">{on ? "Envio ligado" : "Envio pausado"}</p>
          <p className="text-sm" style={gray}>
            Hoje {metrics.sentToday}/{settings.daily_limit} · {metrics.optOuts} descadastrados
          </p>
        </div>
        <Switch on={on} onChange={toggleMaster} />
      </div>

      {showSettings && <Settings settings={settings} onSaved={load} notify={notify} />}

      <div className="flex gap-1 p-1 rounded-2xl bg-translucid border-2 border-[var(--translucid)] overflow-x-auto">
        {[...TRACKS.map((t) => [t.id, `${t.id} · ${t.name}`, !data.tracks[t.id]?.paused]), ["queue", "Fila de hoje", null]].map(([id, label, active]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex-1 whitespace-nowrap cursor-pointer rounded-xl px-3 py-2 text-sm transition flex items-center justify-center gap-2 ${
              tab === id ? "bg-[var(--background)] font-semibold shadow-sm" : "hover:bg-[var(--translucid)]"
            }`}
          >
            {active !== null && <Dot on={active && on} />}
            {label}
          </button>
        ))}
      </div>

      {tab === "queue" ? (
        <Queue notify={notify} />
      ) : (
        <TrackView key={tab} meta={TRACKS.find((t) => t.id === tab)} data={data} onSaved={load} notify={notify} onEdit={setEditing} />
      )}

      {editing && <StepEditor initial={editing} onClose={() => setEditing(null)} onSaved={load} notify={notify} />}

      {toast && (
        <div className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-[60] px-4 py-2 rounded-xl text-sm text-white shadow-lg ${toast.isError ? "bg-red-600" : "bg-neutral-800"}`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}
