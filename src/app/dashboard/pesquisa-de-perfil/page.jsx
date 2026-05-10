"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import useUser from "@/hooks/useUser";
import { useAlert } from "@/providers/AlertProvider";

const ESTABLISHMENT_TYPES = ["Restaurante", "Bar", "Doceria", "Lanchonete", "Cafeteria", "Outro"];
const UNITS_OPTIONS = ["1", "2 a 5", "6 a 20", "Mais de 20"];
const MAIN_USES = [
  "Cardápio digital na mesa (QR code)",
  "Cardápio para delivery",
  "Receber pedidos pelo WhatsApp",
  "Cardápio para redes sociais",
  "Controle interno de produtos e preços",
];
const UPDATE_FREQUENCIES = ["Todo dia ou quase isso", "Uma vez por semana", "Raramente", "Nunca mexi desde que configurei"];
const IMPROVEMENTS = [
  "Processo ficou mais organizado",
  "Clientes pedem com mais facilidade",
  "Reduzi custos com plataformas de delivery",
  "Passei uma imagem mais profissional",
  "Aumentei meu ticket médio",
  "Ainda não percebi diferença",
];
const REFERRED_OPTIONS = ["Sim, já indiquei", "Não, mas indicaria", "Não indicaria ainda"];

function RadioCard({ label, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-2xl border-2 px-4 py-3 text-left text-sm transition cursor-pointer"
      style={{ borderColor: selected ? "rgb(239 68 68 / 0.7)" : "var(--translucid)" }}
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
      style={{ borderColor: selected ? "rgb(239 68 68 / 0.7)" : "var(--translucid)" }}
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
    return (
      type &&
      form.units_count !== "" &&
      form.main_uses.length > 0 &&
      form.update_frequency !== "" &&
      form.improvements.length > 0 &&
      form.has_referred !== ""
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
        <p className="text-sm" style={{ color: "var(--gray)" }}>
          Você já respondeu esta pesquisa. Suas respostas nos ajudam a melhorar o Bite Menu.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6 mt-16">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">Pesquisa de perfil</h1>
        <p className="text-sm" style={{ color: "var(--gray)" }}>
          Leva menos de 2 minutos e nos ajuda a melhorar o Bite Menu para você.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Question number={1} title="Qual é o tipo do seu estabelecimento?">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {ESTABLISHMENT_TYPES.map((opt) => (
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
              placeholder="Qual tipo?"
              maxLength={80}
              value={form.establishment_type_other}
              onChange={(e) => setForm((p) => ({ ...p, establishment_type_other: e.target.value }))}
              className="h-12 w-full rounded-2xl border bg-translucid border-[var(--translucid)] px-4 text-sm outline-none transition focus:border-red-500/70"
            />
          )}
        </Question>

        <Question number={2} title="Quantas unidades você gerencia com o Bite Menu?">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {UNITS_OPTIONS.map((opt) => (
              <RadioCard
                key={opt}
                label={opt}
                selected={form.units_count === opt}
                onClick={() => setForm((p) => ({ ...p, units_count: opt }))}
              />
            ))}
          </div>
        </Question>

        <Question number={3} title="Para que você mais usa o Bite Menu hoje? (pode escolher mais de uma)">
          <div className="space-y-2">
            {MAIN_USES.map((opt) => (
              <CheckCard
                key={opt}
                label={opt}
                selected={form.main_uses.includes(opt)}
                onClick={() => toggleMulti("main_uses", opt)}
              />
            ))}
          </div>
        </Question>

        <Question number={4} title="Com que frequência você atualiza seu cardápio no Bite Menu?">
          <div className="space-y-2">
            {UPDATE_FREQUENCIES.map((opt) => (
              <RadioCard
                key={opt}
                label={opt}
                selected={form.update_frequency === opt}
                onClick={() => setForm((p) => ({ ...p, update_frequency: opt }))}
              />
            ))}
          </div>
        </Question>

        <Question
          number={5}
          title="Desde que começou a usar o Bite Menu, o que melhorou no seu negócio? (pode escolher mais de uma)"
        >
          <div className="space-y-2">
            {IMPROVEMENTS.map((opt) => (
              <CheckCard
                key={opt}
                label={opt}
                selected={form.improvements.includes(opt)}
                onClick={() => toggleMulti("improvements", opt)}
              />
            ))}
          </div>
        </Question>

        <Question number={6} title="Você já indicou o Bite Menu para alguém?">
          <div className="space-y-2">
            {REFERRED_OPTIONS.map((opt) => (
              <RadioCard
                key={opt}
                label={opt}
                selected={form.has_referred === opt}
                onClick={() => setForm((p) => ({ ...p, has_referred: opt }))}
              />
            ))}
          </div>
        </Question>

        <Question number={7} title="Tem alguma funcionalidade que você sente falta no Bite Menu?">
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
