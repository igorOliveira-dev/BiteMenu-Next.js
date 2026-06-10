"use client";

import useUser from "@/hooks/useUser";
import useMenu from "@/hooks/useMenu";
import { supabase } from "@/lib/supabaseClient";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  FaCreditCard,
  FaCheck,
  FaCheckCircle,
  FaExternalLinkAlt,
  FaInfoCircle,
  FaShieldAlt,
  FaBolt,
  FaArrowRight,
  FaUniversity,
} from "react-icons/fa";
import Loading from "@/components/Loading";

// ─── helpers ─────────────────────────────────────────────────────────────────

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function SectionCard({ icon, title, description, children, aside }) {
  return (
    <section className="rounded-3xl border-2 bg-translucid border-[var(--translucid)] backdrop-blur-sm overflow-hidden">
      <div className="flex flex-col gap-4 border-b border-[var(--translucid)] px-5 py-5 sm:flex-row sm:items-start sm:justify-between sm:px-6">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[var(--translucid)] bg-translucid">
            {icon}
          </div>
          <div>
            <h3 className="text-lg font-semibold">{title}</h3>
            {description && <p className="mt-1 text-sm opacity-70">{description}</p>}
          </div>
        </div>
        {aside && <div className="sm:pl-6">{aside}</div>}
      </div>
      <div className="px-2 xxs:px-5 py-5 sm:px-6">{children}</div>
    </section>
  );
}

function FeatureItem({ icon, title, description }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[var(--translucid)] bg-translucid text-red-400">
        {icon}
      </div>
      <div>
        <div className="text-sm font-semibold">{title}</div>
        <p className="mt-0.5 text-sm opacity-60">{description}</p>
      </div>
    </div>
  );
}

// Same SelectionCard pattern used in ConfigMenu
function SelectionCard({ selected, title, description, onClick, disabled, badge }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cx(
        "group flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition cursor-pointer",
        disabled
          ? "cursor-not-allowed opacity-40 border-[var(--translucid)] bg-translucid"
          : selected
            ? "border-red-500/70 bg-red-500/20 shadow-[0_0_0_1px_rgba(255,0,0,0.25)]"
            : "border-[var(--translucid)] bg-translucid hover:opacity-80 hover:scale-[1.01]",
      )}
    >
      <div
        className={cx(
          "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition",
          selected && !disabled ? "border-red-400 bg-red-500" : "border-gray-500 bg-transparent text-transparent",
        )}
      >
        <FaCheck className="text-[10px]" />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2 font-semibold">
          {title}
          {badge && (
            <span className="rounded-full border border-[var(--translucid)] px-2 py-0.5 text-[10px] uppercase tracking-wide opacity-60">
              {badge}
            </span>
          )}
        </div>
        {description && <p className="mt-0.5 text-sm opacity-60">{description}</p>}
      </div>
    </button>
  );
}

// Métodos de pagamento que podem ser vinculados ao Stripe.
// `available` controla se o método já está liberado na plataforma.
// Basta mudar `available: true` futuramente para ativar novos.
const STRIPE_PAYMENT_OPTIONS = [
  {
    id: "credit",
    label: "Cartão de crédito",
    description: "Pagamento via cartão de crédito processado pelo Stripe.",
    available: true,
  },
  {
    id: "debit",
    label: "Cartão de débito",
    description: "Pagamento via cartão de débito processado pelo Stripe.",
    available: false,
  },
  {
    id: "pix",
    label: "PIX",
    description: "Pagamento via PIX processado pelo Stripe.",
    available: false,
  },
];

// ─── main component ───────────────────────────────────────────────────────────

const BiteMenuPayments = () => {
  const { profile } = useUser();
  const { menu, loading: menuLoading } = useMenu();
  const searchParams = useSearchParams();

  const [actionLoading, setActionLoading] = useState(false);
  const [useStripeExpress, setUseStripeExpress] = useState(false);
  const [stripePaymentMethods, setStripePaymentMethods] = useState([]);

  const isConnected = !!profile?.stripe_connect_ready;

  useEffect(() => {
    if (!menu) return;
    setUseStripeExpress(!!menu.use_stripe_express);
    setStripePaymentMethods(Array.isArray(menu.stripe_payment_methods) ? menu.stripe_payment_methods : []);
  }, [menu?.id]);

  useEffect(() => {
    const connectSuccess = searchParams.get("connect");
    if (connectSuccess === "success" && profile?.id) syncConnectStatus();
  }, [profile, searchParams]);

  const syncConnectStatus = async () => {
    if (!profile?.id) return;
    const res = await fetch("/api/connect/status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: profile.id }),
    });
    const data = await res.json();
    if (data.connected) {
      window.history.replaceState({}, "", "/dashboard?tab=biteMenuPayments");
      window.location.reload();
    }
  };

  const handleCreateConnect = async () => {
    try {
      setActionLoading(true);
      const res = await fetch("/api/connect/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: profile.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      window.location.href = data.url;
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleManageAccount = async () => {
    try {
      setActionLoading(true);
      const res = await fetch("/api/connect/login-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: profile.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      window.location.href = data.url;
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const toggleStripeExpress = async () => {
    const next = !useStripeExpress;
    setUseStripeExpress(next);
    await supabase.from("menus").update({ use_stripe_express: next }).eq("id", menu.id);
  };

  const toggleStripeMethod = async (methodId) => {
    const opt = STRIPE_PAYMENT_OPTIONS.find((o) => o.id === methodId);
    if (!opt?.available) return;
    const next = stripePaymentMethods.includes(methodId)
      ? stripePaymentMethods.filter((m) => m !== methodId)
      : [...stripePaymentMethods, methodId];
    setStripePaymentMethods(next);
    await supabase.from("menus").update({ stripe_payment_methods: next }).eq("id", menu.id);
  };

  if (menuLoading) return <Loading />;

  return (
    <div className="px-4 sm:px-2">
      <div className="md:m-auto lg:m-2 lg:w-[calc(80dvw-256px)] max-w-[1080px] pb-32 pt-3">
        {/* header */}
        <div className="flex items-center gap-3 mb-5">
          <h2 className="font-semibold text-xl">Pagamentos Bite Menu</h2>
        </div>

        <div className="grid gap-5">
          {/* ── como funciona: completo pré-conexão, compacto pós-conexão ── */}
          {!isConnected ? (
            <SectionCard
              icon={<FaInfoCircle />}
              title="Como funciona"
              description="Receba pagamentos diretamente dos seus clientes usando o Stripe Connect Express."
            >
              <div className="grid gap-4 sm:grid-cols-3">
                <FeatureItem
                  icon={<FaBolt />}
                  title="Pagamentos online"
                  description="Clientes pagam diretamente no cardápio com cartão. O valor cai na sua conta conforme o prazo do Stripe."
                />
                <FeatureItem
                  icon={<FaShieldAlt />}
                  title="Seguro e confiável"
                  description="Toda a infraestrutura financeira é gerenciada pelo Stripe, líder global em pagamentos."
                />
                <FeatureItem
                  icon={<FaUniversity />}
                  title="Sua conta, seu dinheiro"
                  description="Os repasses vão direto para a conta bancária que você cadastrar no Stripe."
                />
              </div>

              {/* taxas e prazo */}
              <div className="mt-5 rounded-2xl border border-[var(--translucid)] bg-translucid divide-y divide-[var(--translucid)] overflow-hidden">
                <div className="px-4 py-3">
                  <div className="text-sm font-semibold mb-2">Taxas por transação</div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div className="flex items-start gap-3 rounded-xl border border-[var(--translucid)] bg-translucid p-3">
                      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-red-500/20 text-red-400 text-xs font-bold">
                        BM
                      </div>
                      <div>
                        <div className="text-sm font-semibold">2% — Bite Menu</div>
                        <p className="mt-0.5 text-xs opacity-60">
                          Taxa cobrada pelo Bite Menu sobre cada transação processada.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 rounded-xl border border-[var(--translucid)] bg-translucid p-3">
                      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--translucid)] text-xs font-bold opacity-70">
                        S
                      </div>
                      <div>
                        <div className="text-sm font-semibold">+ taxa Stripe</div>
                        <p className="mt-0.5 text-xs opacity-60">
                          Definida pelo Stripe conforme método e país. Consulte sua conta.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="px-4 py-3 flex items-start gap-3">
                  <FaInfoCircle className="mt-0.5 shrink-0 text-amber-400 text-sm" />
                  <div className="text-sm">
                    <span className="font-semibold text-amber-400">Prazo de repasse variável.</span>{" "}
                    <span className="opacity-70">
                      O tempo para o dinheiro chegar na sua conta é definido pelo Stripe e pode levar de alguns dias até
                      cerca de 30 dias, dependendo do seu perfil, método de pagamento e histórico de transações. O Bite Menu
                      não controla esse prazo.
                    </span>
                  </div>
                </div>
              </div>

              {/* guia */}
              <div className="mt-4 rounded-2xl border border-[var(--translucid)] bg-translucid p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold">Quer entender melhor antes de conectar?</div>
                  <p className="mt-0.5 text-sm opacity-60">
                    Veja nosso guia completo sobre como o Stripe Connect Express funciona dentro do Bite Menu.
                  </p>
                </div>
                <a
                  href="/docs/pagamentos"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex shrink-0 items-center gap-2 rounded-2xl border border-[var(--translucid)] bg-translucid px-4 py-2.5 text-sm font-semibold transition hover:opacity-80 cursor-pointer"
                >
                  Ver guia
                  <FaExternalLinkAlt className="text-xs opacity-70" />
                </a>
              </div>
            </SectionCard>
          ) : (
            /* guia compacto pós-conexão */
            <div className="rounded-2xl border border-[var(--translucid)] bg-translucid p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <div className="text-sm font-semibold">Documentação</div>
                <p className="mt-0.5 text-sm opacity-60">
                  Consulte o guia sobre taxas, prazos de repasse e como o Stripe Connect funciona no Bite Menu.
                </p>
              </div>
              <a
                href="/docs/pagamentos"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex shrink-0 items-center gap-2 rounded-2xl border border-[var(--translucid)] bg-translucid px-4 py-2.5 text-sm font-semibold transition hover:opacity-80 cursor-pointer"
              >
                Ver guia
                <FaExternalLinkAlt className="text-xs opacity-70" />
              </a>
            </div>
          )}

          {/* ── conta stripe ── */}
          {isConnected ? (
            <SectionCard
              icon={<FaCheckCircle className="text-green-400" />}
              title="Conta Stripe"
              description="Sua conta está ativa. Acesse o painel do Stripe para ver saldos, transferências e configurações."
            >
              <div className="flex flex-col gap-4">
                <div className="rounded-2xl border border-green-500/20 bg-green-500/10 p-4 flex items-start gap-3">
                  <FaCheckCircle className="mt-0.5 shrink-0 text-green-400" />
                  <div className="text-sm">
                    <span className="font-semibold text-green-400">Conta conectada.</span>{" "}
                    <span className="opacity-80">
                      Pronta para receber pagamentos. Você pode gerenciar tudo pelo painel do Stripe.
                    </span>
                  </div>
                </div>
                <div>
                  <button
                    type="button"
                    onClick={handleManageAccount}
                    disabled={actionLoading}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#d42020] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50 cursor-pointer"
                  >
                    {actionLoading ? "Carregando..." : "Gerenciar conta Stripe"}
                    {!actionLoading && <FaArrowRight className="text-xs" />}
                  </button>
                </div>
              </div>
            </SectionCard>
          ) : (
            <SectionCard
              icon={<FaCreditCard />}
              title="Conectar conta de recebimento"
              description="Configure sua conta para começar a receber pagamentos dos pedidos feitos no seu cardápio."
            >
              <div className="flex flex-col gap-4">
                <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 flex items-start gap-3">
                  <FaInfoCircle className="mt-0.5 shrink-0 text-amber-400" />
                  <div className="text-sm">
                    <span className="font-semibold text-amber-400">Conta não configurada.</span>{" "}
                    <span className="opacity-80">
                      Para aceitar pagamentos online, conecte sua conta bancária via Stripe. O processo leva menos de 5
                      minutos.
                    </span>
                  </div>
                </div>

                <div className="rounded-2xl border border-[var(--translucid)] bg-translucid p-4 space-y-2">
                  <div className="text-sm font-semibold mb-3">O que você vai precisar</div>
                  {[
                    "CPF ou CNPJ válido",
                    "Dados bancários para recebimento",
                    "Documento de identidade para verificação",
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-2 text-sm opacity-70">
                      <FaCheckCircle className="text-xs text-red-400 shrink-0" />
                      {item}
                    </div>
                  ))}
                </div>

                <div>
                  <button
                    type="button"
                    onClick={handleCreateConnect}
                    disabled={actionLoading}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#d42020] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50 cursor-pointer"
                  >
                    {actionLoading ? "Carregando..." : "Configurar recebimentos"}
                    {!actionLoading && <FaArrowRight className="text-xs" />}
                  </button>
                </div>
              </div>
            </SectionCard>
          )}

          {/* ── configurações do cardápio — só aparece se conta conectada ── */}
          {isConnected && (
            <>
              {/* toggle global — usando o mesmo switch/slider do site */}
              <SectionCard
                icon={<FaCreditCard />}
                title="Ativar Stripe no cardápio"
                description="Quando ativado, os métodos selecionados abaixo redirecionarão o cliente ao Stripe para concluir o pagamento."
              >
                <label className="inline-flex cursor-pointer items-center gap-3 rounded-full text-sm">
                  <span className="switch">
                    <input type="checkbox" className="hidden" checked={useStripeExpress} onChange={toggleStripeExpress} />
                    <span className="slider" />
                  </span>
                  {useStripeExpress ? "Stripe ativado no cardápio" : "Stripe desativado no cardápio"}
                </label>

                {useStripeExpress && (
                  <p className="mt-3 text-sm opacity-60">
                    Os pagamentos pelos métodos selecionados abaixo serão processados pelo Stripe.
                  </p>
                )}
              </SectionCard>

              {/* métodos vinculados ao stripe — mesmo design que ConfigMenu */}
              <SectionCard
                icon={<FaCreditCard />}
                title="Métodos vinculados ao Stripe"
                description="Escolha quais formas de pagamento do seu cardápio devem redirecionar o cliente ao Stripe."
              >
                <div className="grid gap-3 md:grid-cols-2">
                  {STRIPE_PAYMENT_OPTIONS.map((opt) => (
                    <SelectionCard
                      key={opt.id}
                      selected={stripePaymentMethods.includes(opt.id)}
                      title={opt.label}
                      description={opt.description}
                      disabled={!opt.available}
                      badge={!opt.available ? "Em breve" : undefined}
                      onClick={() => toggleStripeMethod(opt.id)}
                    />
                  ))}
                </div>

                {!useStripeExpress && (
                  <div className="mt-4 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-3 text-sm">
                    <span className="font-semibold text-amber-400">Atenção:</span>{" "}
                    <span className="opacity-80">
                      o Stripe está desativado no cardápio. Ative o toggle acima para que esses métodos passem a redirecionar
                      o cliente.
                    </span>
                  </div>
                )}
              </SectionCard>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default BiteMenuPayments;
