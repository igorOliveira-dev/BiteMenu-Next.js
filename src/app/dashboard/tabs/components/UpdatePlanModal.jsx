import React from "react";
import GenericModal from "@/components/GenericModal";
import { planLine, goToPlan } from "@/app/dashboard/components/PlanLockNotice";

const UpdatePlanModal = ({
  onClose,
  title = "Recurso do plano Plus/Pro",
  text = "Para usar este recurso, atualize seu plano.",
  image,
  ctaText = "Ver planos",
  onCta,
  plan, // recurso exclusivo: mostra "Disponível a partir do plano X" e o botão leva pra esse plano
}) => {
  return (
    <GenericModal title={title} onClose={onClose} zIndex={160} size="md">
      <div>
        {image ? <img src={image} alt="" className="w-full h-auto max-h-[240px] object-contain mb-3" /> : null}

        {plan ? <p className="text-sm font-semibold mb-1">{planLine(plan)}</p> : null}

        {text ? <p className="text-sm opacity-80 mb-4">{text}</p> : null}

        <div className="flex gap-2 items-end justify-end">
          <button
            onClick={onClose}
            className="cursor-pointer px-4 py-2 bg-translucid border-2 border-[var(--translucid)] hover:opacity-80 rounded-lg"
            type="button"
          >
            Agora não
          </button>

          <button
            onClick={() => {
              // se você passar onCta, roda; se não passar, só fecha
              if (onCta) onCta();
              else if (plan) goToPlan(plan);
              else onClose?.();
            }}
            className="cta-button glow-red"
            type="button"
          >
            {ctaText}
          </button>
        </div>
      </div>
    </GenericModal>
  );
};

export default UpdatePlanModal;
