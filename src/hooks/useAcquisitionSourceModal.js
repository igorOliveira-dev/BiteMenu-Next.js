"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { updateCachedProfile } from "@/hooks/useUser";

const STORAGE_KEY = "bite_menu_acquisition_modal_state";
const FIXED_THRESHOLDS = [3, 5, 7, 10];
const REPEAT_INTERVAL = 10;

function getDefaults() {
  return { accessCount: 0, dismissCount: 0 };
}

function readState() {
  if (typeof window === "undefined") return getDefaults();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaults();
    const parsed = JSON.parse(raw);
    return {
      accessCount: typeof parsed.accessCount === "number" ? parsed.accessCount : 0,
      dismissCount: typeof parsed.dismissCount === "number" ? parsed.dismissCount : 0,
    };
  } catch {
    return getDefaults();
  }
}

function writeState(state) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignora quota / privacidade do browser
  }
}

function getNextThreshold(dismissCount) {
  if (dismissCount < FIXED_THRESHOLDS.length) return FIXED_THRESHOLDS[dismissCount];
  return FIXED_THRESHOLDS[FIXED_THRESHOLDS.length - 1] + (dismissCount - FIXED_THRESHOLDS.length + 1) * REPEAT_INTERVAL;
}

export default function useAcquisitionSourceModal(profile) {
  const [show, setShow] = useState(false);
  const hasIncrementedRef = useRef(false);

  useEffect(() => {
    if (!profile || !profile.id) return;
    if (profile.acquisition_source != null) return; // já respondeu ou veio via link utm
    if (hasIncrementedRef.current) return;
    hasIncrementedRef.current = true;

    const state = readState();
    state.accessCount += 1;
    writeState(state);

    const threshold = getNextThreshold(state.dismissCount);
    if (state.accessCount >= threshold) setShow(true);
  }, [profile?.id, profile?.acquisition_source]);

  const onClose = () => {
    const state = readState();
    state.dismissCount += 1;
    writeState(state);
    setShow(false);
  };

  const onSubmit = async (value) => {
    if (!profile?.id || !value) return;
    const { error } = await supabase.from("profiles").update({ acquisition_source: value }).eq("id", profile.id);
    if (error) {
      console.error("acquisition_source update failed:", error);
      return;
    }
    updateCachedProfile({ acquisition_source: value });
    setShow(false);
  };

  return { show, onClose, onSubmit };
}
