import XButton from "@/components/XButton";
import { planClick } from "@/app/utils/planClick";
import { plans } from "@/consts/Plans";
import { useAlert } from "@/providers/AlertProvider";
import useUser from "@/hooks/useUser";
import React, { useEffect, useRef, useState } from "react";
import {
  FiPrinter,
  FiBarChart2,
  FiDownload,
  FiSmartphone,
  FiHeadphones,
  FiGrid,
  FiCloudRain,
  FiCloudLightning,
} from "react-icons/fi";
import { PaymentMethodModal } from "@/components/PlansSection";

const ACCESS_COUNT_KEY = "bitemenu_free_access_count";
const ACCESS_INTERVAL = 5;

const PRO_BENEFITS = [
  { icon: FiGrid, title: "Mais itens e categorias", description: "Até 200 itens e 20 categorias no seu cardápio." },
  { icon: FiPrinter, title: "Impressão de pedidos", description: "Imprima os pedidos assim que chegarem, sem complicação." },
  { icon: FiBarChart2, title: "Dashboard de vendas", description: "Acompanhe o desempenho do seu negócio em tempo real." },
  { icon: FiDownload, title: "Relatórios em CSV", description: "Baixe relatórios completos de vendas quando quiser." },
  {
    icon: FiCloudLightning,
    title: "Tudo do Plus",
    description: "Aproveite todos os recursos do plano Plus, inclusive personalização avançada.",
  },
  { icon: FiHeadphones, title: "Suporte prioritário", description: "Atendimento rápido e prioritário sempre que precisar." },
];

const ProTrial = () => {
  const { profile } = useUser();
  const [showOverlay, setShowOverlay] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [stripeLoading, setStripeLoading] = useState(false);

  const alert = useAlert();
  const proPlan = plans.find((p) => p.id === "pro");

  const hasIncrementedRef = useRef(false);

  useEffect(() => {
    if (!profile || profile.role !== "free") return;
    if (hasIncrementedRef.current) return;
    hasIncrementedRef.current = true;

    const currentCount = Number(localStorage.getItem(ACCESS_COUNT_KEY) || 0) + 1;
    localStorage.setItem(ACCESS_COUNT_KEY, String(currentCount));

    if (currentCount % ACCESS_INTERVAL === 0) {
      setShowOverlay(true);
    }
  }, [profile?.id, profile?.role]);

  if (!profile || profile.role !== "free") return null;

  const openCheckout = () => {
    // Se já usou o trial, não deveria oferecer trial de novo
    if (profile?.has_used_trial) {
      setModalOpen(true); // abre sem trial, se quiser permitir assinar direto
    } else {
      setModalOpen(true);
    }
  };

  const closeModal = () => {
    if (stripeLoading) return;
    setModalOpen(false);
  };

  const handleCredit = async () => {
    if (!proPlan) return;

    try {
      setStripeLoading(true);

      if (profile?.stripe_subscription_id) {
        const res = await fetch(
          `/api/stripe-subscription?subscriptionId=${profile.stripe_subscription_id}&userId=${profile.id}`,
        );
        const data = await res.json();

        const activeStatuses = ["active", "trialing", "past_due"];
        if (activeStatuses.includes(data.status)) {
          alert("Você já possui uma assinatura ativa. Cancele o plano atual antes de assinar outro.");
          return;
        }
      }

      await planClick(proPlan.id, !profile?.has_used_trial);
    } catch (e) {
      console.error(e);
      alert("Não foi possível iniciar o pagamento. Tente novamente.");
    } finally {
      setStripeLoading(false);
    }
  };

  return (
    <>
      <div
        className="absolute left-[50%] transform -translate-x-1/2 top-0 h-[100dvh] bg-[var(--background)] w-full z-100 p-2 sm:p-4 overflow-y-auto"
        style={{ display: showOverlay ? "flex" : "none" }}
      >
        <div className="w-full max-w-2xl mx-auto flex flex-col">
          <div className="self-end" onClick={() => setShowOverlay(false)} aria-label="Fechar">
            <XButton ariaLabel="Fechar" />
          </div>

          <div className="flex flex-col items-center text-center gap-2 mt-2 mb-8">
            <span className="text-sm font-semibold uppercase tracking-wide text-[var(--red)]">Plano Pro</span>
            <h2 className="text-2xl sm:text-3xl font-bold">Leve seu cardápio para o próximo nível</h2>
            <p className="text-sm sm:text-base opacity-70 max-w-md">
              Desbloqueie recursos avançados e otimize a operação do seu estabelecimento.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            {PRO_BENEFITS.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="flex items-start gap-3 p-4 rounded-xl border border-[var(--translucid)] bg-[var(--low-translucid)]"
              >
                <div className="p-2 rounded-lg bg-[var(--red)]/10 text-[var(--red)]">
                  <Icon size={20} />
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-sm">{title}</span>
                  <span className="text-xs opacity-70">{description}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row-reverse gap-3 mt-auto pb-4">
            <button
              onClick={openCheckout}
              className="flex-1 py-3 rounded-xl bg-[var(--red)] text-white font-medium text-sm text-center cursor-pointer hover:opacity-80 transition-colors"
            >
              {profile?.has_used_trial ? "Assinar Plano Pro" : "Testar Pro grátis por 7 dias"}
            </button>
            <button
              onClick={() => setShowOverlay(false)}
              className="flex-1 py-3 rounded-xl border border-[var(--translucid)] font-medium text-sm cursor-pointer bg-translucid hover:opacity-80 transition-colors"
            >
              Agora não
            </button>
          </div>
        </div>
      </div>

      <PaymentMethodModal
        open={modalOpen}
        plan={proPlan}
        selectedPlanTrial={!profile?.has_used_trial}
        onClose={closeModal}
        onCredit={handleCredit}
        stripeLoading={stripeLoading}
      />
    </>
  );
};

export default ProTrial;
