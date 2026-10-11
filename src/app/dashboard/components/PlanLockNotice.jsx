import { FaLock } from "react-icons/fa";
import { plans } from "@/consts/Plans";

// Padrão dos avisos de recurso exclusivo: "Disponível a partir do plano X" + botão pros planos.
// Usado aqui (seção/tela bloqueada) e no UpdatePlanModal (clique em algo bloqueado).
export const planName = (plan) => plans.find((p) => p.id === plan)?.name ?? plan;
export const planLine = (plan) => `Disponível a partir do plano ${planName(plan)}`;
export const goToPlan = (plan) => {
  window.location.href = `/dashboard/pricing?plan=${plan}`;
};
// Plano seguinte pra quem bateu um limite; Business é o topo (null = falar com o suporte)
export const nextPlan = (role) => ({ free: "plus", plus: "pro", pro: "business" })[role] ?? null;
export const BUSINESS_LIMIT_TEXT =
  "O plano Business não tem limite para uso normal. Se você chegou aqui, fale com a gente pelo suporte que liberamos mais.";

export default function PlanLockNotice({ plan, text }) {
  return (
    <div className="rounded-2xl border border-translucid bg-[var(--low-translucid)] p-6 flex flex-col items-center gap-2 text-center">
      <FaLock className="text-xl opacity-60" />
      <p className="font-semibold">{planLine(plan)}</p>
      {text && <p className="text-sm opacity-80 max-w-[480px]">{text}</p>}
      <button type="button" onClick={() => goToPlan(plan)} className="cta-button glow-red mt-2">
        Ver planos
      </button>
    </div>
  );
}
