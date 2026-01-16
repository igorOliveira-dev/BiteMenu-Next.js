import React from "react";
import GenericModal from "@/components/GenericModal";

const UpdatePlanModal = ({
  onClose,
  title = "Recurso do plano Plus/Pro",
  text = "Para usar este recurso, atualize seu plano.",
  image,
  ctaText = "Ver planos",
  onCta,
}) => {
  return (
    <GenericModal onClose={onClose} zIndex={160} maxWidth="480px">
      <div>
        <div className="font-bold text-lg mb-2 text-center">{title}</div>

        {image ? <img src={image} alt="" className="w-full h-40 object-cover rounded-lg mb-3" /> : null}

        {text ? <p className="text-sm opacity-80 mb-4">{text}</p> : null}

        <div className="flex gap-2 items-end justify-end">
          <button onClick={onClose} className="cursor-pointer px-4 py-2 bg-translucid text-white rounded" type="button">
            Agora não
          </button>

          <button
            onClick={() => {
              // se você passar onCta, roda; se não passar, só fecha
              if (onCta) onCta();
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
