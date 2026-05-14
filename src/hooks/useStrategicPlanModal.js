"use client";

import { useEffect, useState } from "react";
import {
  getActions,
  getModalSuggestion,
  markModalDismissed,
  markModalShown,
} from "@/utils/userActions";

const COOLDOWN_NORMAL_MS = 4 * 24 * 60 * 60 * 1000;
const COOLDOWN_EXTENDED_MS = 15 * 24 * 60 * 60 * 1000;
const EXTENDED_THRESHOLD = 3;

export default function useStrategicPlanModal(profile) {
  const [state, setState] = useState({ show: false, suggestion: null });

  useEffect(() => {
    if (!profile || !profile.role) return;
    if (profile.role === "pro" || profile.role === "admin") return;

    const actions = getActions();
    const cooldown =
      actions.modalDismissCount >= EXTENDED_THRESHOLD ? COOLDOWN_EXTENDED_MS : COOLDOWN_NORMAL_MS;
    if (actions.lastModalShownAt && Date.now() - actions.lastModalShownAt < cooldown) return;

    const suggestion = getModalSuggestion(profile.role);
    if (!suggestion) return;

    setState({ show: true, suggestion });
  }, [profile?.role]);

  const onClose = () => {
    if (state.suggestion?.featureKey) markModalDismissed(state.suggestion.featureKey);
    setState({ show: false, suggestion: null });
  };

  const onCta = () => {
    if (state.suggestion?.featureKey) markModalShown(state.suggestion.featureKey);
    setState({ show: false, suggestion: null });
    if (typeof window !== "undefined") window.location.href = "/dashboard/pricing";
  };

  if (!state.show) return { show: false };
  return { show: true, suggestion: state.suggestion, onClose, onCta };
}
