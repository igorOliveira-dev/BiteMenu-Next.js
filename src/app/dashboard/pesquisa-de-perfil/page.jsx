"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import useUser from "@/hooks/useUser";
import { useAlert } from "@/providers/AlertProvider";
import Link from "next/link";
import { SURVEY_QUESTIONS } from "@/lib/pesquisaPerfilConfig";

const q = Object.fromEntries(SURVEY_QUESTIONS.map((question) => [question.key, question]));

function RadioCard({ label, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-2xl border-2 px-4 py-3 text-left text-sm transition cursor-pointer"
      style={{
        borderColor: selected ? "rgb(239 68 68 / 0.7)" : "var(--translucid)",
        backgroundColor: selected ? "rgb(239 68 68 / 0.1)" : "transparent",
      }}
    >
      {label}
    </button>
  );
}

function CheckCard({ label, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-2xl border-2 px-4 py-3 text-left text-sm transition cursor-pointer"
      style={{
        borderColor: selected ? "rgb(239 68 68 / 0.7)" : "var(--translucid)",
        backgroundColor: selected ? "rgb(239 68 68 / 0.1)" : "transparent",
      }}
    >
      {label}
    </button>
  );
}

function Question({ number, title, children }) {
  return (
    <section className="rounded-3xl border-2 bg-translucid border-[var(--translucid)] px-6 py-5 space-y-3">
      <p className="font-semibold text-sm" style={{ color: "var(--gray)" }}>
        {number}. {title}
      </p>
      {children}
    </section>
  );
}

export default function PesquisaDePerfilPage() {
  const { user, loading: userLoading } = useUser();
  const { showAlert } = useAlert();

  const [alreadyAnswered, setAlreadyAnswered] = useState(false);
  const [checkLoading, setCheckLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    establishment_type: "",
    establishment_type_other: "",
    units_count: "",
    main_uses: [],
    update_frequency: "",
    improvements: [],
    has_referred: "",
    missing_feature: "",
    referral_source: "",
    referral_source_other: "",
    previous_tool: "",
    previous_tool_other: "",
    decision_factor: "",
    decision_factor_other: "",
  });

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profile_surveys")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setAlreadyAnswered(true);
        setCheckLoading(false);
      });
  }, [user]);

  function toggleMulti(field, value) {
    setForm((prev) => {
      const list = prev[field];
      return {
        ...prev,
        [field]: list.includes(value) ? list.filter((v) => v !== value) : [...list, value],
      };
    });
  }

  function isValid() {
    const type =
      form.establishment_type === "Outro" ? form.establishment_type_other.trim() !== "" : form.establishment_type !== "";
    const referral =
      form.referral_source === "Outro" ? form.referral_source_other.trim() !== "" : form.referral_source !== "";
    const previous = form.previous_tool === "Outro" ? form.previous_tool_other.trim() !== "" : form.previous_tool !== "";
    const decision =
      form.decision_factor === "Outro" ? form.decision_factor_other.trim() !== "" : form.decision_factor !== "";
    return (
      type &&
      form.units_count !== "" &&
      form.main_uses.length > 0 &&
      form.update_frequency !== "" &&
      form.improvements.length > 0 &&
      form.has_referred !== "" &&
      referral &&
      previous &&
      decision
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!isValid() || submitting) return;

    setSubmitting(true);
    const payload = {
      user_id: user.id,
      establishment_type: form.establishment_type === "Outro" ? "Outro" : form.establishment_type,
      establishment_type_other: form.establishment_type === "Outro" ? form.establishment_type_other.trim() : null,
      units_count: form.units_count,
      main_uses: form.main_uses,
      update_frequency: form.update_frequency,
      improvements: form.improvements,
      has_referred: form.has_referred,
      missing_feature: form.missing_feature.trim() || null,
      referral_source: form.referral_source,
      referral_source_other: form.referral_source === "Outro" ? form.referral_source_other.trim() : null,
      previous_tool: form.previous_tool,
      previous_tool_other: form.previous_tool === "Outro" ? form.previous_tool_other.trim() : null,
      decision_factor: form.decision_factor,
      decision_factor_other: form.decision_factor === "Outro" ? form.decision_factor_other.trim() : null,
    };

    const { error } = await supabase.from("profile_surveys").insert(payload);
    setSubmitting(false);

    if (error) {
      showAlert("Erro ao enviar pesquisa. Tente novamente.", "error");
      return;
    }

    setAlreadyAnswered(true);
    showAlert("Pesquisa enviada! Obrigado.", "success");
  }

  if (userLoading || checkLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 rounded-full border-4 border-[var(--low-gray)] border-t-red-500 animate-spin" />
      </div>
    );
  }

  if (alreadyAnswered) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 px-4 text-center">
        <span className="text-4xl">🎉</span>
        <h1 className="text-xl font-bold">Obrigado pela sua resposta!</h1>
        <p className="text-[var(--gray)]">
          Você já respondeu esta pesquisa. Suas respostas nos ajudam a melhorar o Bite Menu.
        </p>
        <Link href="/dashboard" className="text-blue-500 hover:text-blue-700 underline">
          Voltar ao dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6 mt-16">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">Pesquisa de perfil</h1>
        <p className="text-sm" style={{ color: "var(--gray)" }}>
          Leva menos de 3 minutos e nos ajuda a melhorar o Bite Menu para você.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Question number={1} title={q.establishment_type.title}>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {q.establishment_type.options.map((opt) => (
              <RadioCard
                key={opt}
                label={opt}
                selected={form.establishment_type === opt}
                onClick={() => setForm((p) => ({ ...p, establishment_type: opt }))}
              />
            ))}
          </div>
          {form.establishment_type === "Outro" && (
            <input
              type="text"
              placeholder={q.establishment_type.otherPlaceholder}
              maxLength={80}
              value={form.establishment_type_other}
              onChange={(e) => setForm((p) => ({ ...p, establishment_type_other: e.target.value }))}
              className="h-12 w-full rounded-2xl border bg-translucid border-[var(--translucid)] px-4 text-sm outline-none transition focus:border-red-500/70"
            />
          )}
        </Question>

        <Question number={2} title={q.units_count.title}>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {q.units_count.options.map((opt) => (
              <RadioCard
                key={opt}
                label={opt}
                selected={form.units_count === opt}
                onClick={() => setForm((p) => ({ ...p, units_count: opt }))}
              />
            ))}
          </div>
        </Question>

        <Question number={3} title={q.main_uses.title}>
          <div className="space-y-2">
            {q.main_uses.options.map((opt) => (
              <CheckCard
                key={opt}
                label={opt}
                selected={form.main_uses.includes(opt)}
                onClick={() => toggleMulti("main_uses", opt)}
              />
            ))}
          </div>
        </Question>

        <Question number={4} title={q.update_frequency.title}>
          <div className="space-y-2">
            {q.update_frequency.options.map((opt) => (
              <RadioCard
                key={opt}
                label={opt}
                selected={form.update_frequency === opt}
                onClick={() => setForm((p) => ({ ...p, update_frequency: opt }))}
              />
            ))}
          </div>
        </Question>

        <Question number={5} title={q.improvements.title}>
          <div className="space-y-2">
            {q.improvements.options.map((opt) => (
              <CheckCard
                key={opt}
                label={opt}
                selected={form.improvements.includes(opt)}
                onClick={() => toggleMulti("improvements", opt)}
              />
            ))}
          </div>
        </Question>

        <Question number={6} title={q.has_referred.title}>
          <div className="space-y-2">
            {q.has_referred.options.map((opt) => (
              <RadioCard
                key={opt}
                label={opt}
                selected={form.has_referred === opt}
                onClick={() => setForm((p) => ({ ...p, has_referred: opt }))}
              />
            ))}
          </div>
        </Question>

        <Question number={7} title={q.referral_source.title}>
          <div className="space-y-2">
            {q.referral_source.options.map((opt) => (
              <RadioCard
                key={opt}
                label={opt}
                selected={form.referral_source === opt}
                onClick={() => setForm((p) => ({ ...p, referral_source: opt }))}
              />
            ))}
          </div>
          {form.referral_source === "Outro" && (
            <input
              type="text"
              placeholder={q.referral_source.otherPlaceholder}
              maxLength={80}
              value={form.referral_source_other}
              onChange={(e) => setForm((p) => ({ ...p, referral_source_other: e.target.value }))}
              className="h-12 w-full rounded-2xl border bg-translucid border-[var(--translucid)] px-4 text-sm outline-none transition focus:border-red-500/70"
            />
          )}
        </Question>

        <Question number={8} title={q.previous_tool.title}>
          <div className="space-y-2">
            {q.previous_tool.options.map((opt) => (
              <RadioCard
                key={opt}
                label={opt}
                selected={form.previous_tool === opt}
                onClick={() => setForm((p) => ({ ...p, previous_tool: opt }))}
              />
            ))}
          </div>
          {form.previous_tool === "Outro" && (
            <input
              type="text"
              placeholder={q.previous_tool.otherPlaceholder}
              maxLength={80}
              value={form.previous_tool_other}
              onChange={(e) => setForm((p) => ({ ...p, previous_tool_other: e.target.value }))}
              className="h-12 w-full rounded-2xl border bg-translucid border-[var(--translucid)] px-4 text-sm outline-none transition focus:border-red-500/70"
            />
          )}
        </Question>

        <Question number={9} title={q.decision_factor.title}>
          <div className="space-y-2">
            {q.decision_factor.options.map((opt) => (
              <RadioCard
                key={opt}
                label={opt}
                selected={form.decision_factor === opt}
                onClick={() => setForm((p) => ({ ...p, decision_factor: opt }))}
              />
            ))}
          </div>
          {form.decision_factor === "Outro" && (
            <input
              type="text"
              placeholder={q.decision_factor.otherPlaceholder}
              maxLength={80}
              value={form.decision_factor_other}
              onChange={(e) => setForm((p) => ({ ...p, decision_factor_other: e.target.value }))}
              className="h-12 w-full rounded-2xl border bg-translucid border-[var(--translucid)] px-4 text-sm outline-none transition focus:border-red-500/70"
            />
          )}
        </Question>

        <Question number={10} title="Tem alguma funcionalidade que você sente falta no Bite Menu?">
          <input
            type="text"
            placeholder="Opcional — escreva aqui se quiser"
            maxLength={200}
            value={form.missing_feature}
            onChange={(e) => setForm((p) => ({ ...p, missing_feature: e.target.value }))}
            className="h-12 w-full rounded-2xl border bg-translucid border-[var(--translucid)] px-4 text-sm outline-none transition focus:border-red-500/70"
          />
        </Question>

        <button
          type="submit"
          disabled={!isValid() || submitting}
          className="w-full rounded-2xl bg-green-600 py-3 text-white font-semibold transition hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {submitting ? "Enviando..." : "Enviar pesquisa"}
        </button>
      </form>
    </div>
  );
}
