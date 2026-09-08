export const ACQUISITION_SOURCE_OPTIONS = [
  { value: "direct", label: "Pesquisa no Google" },
  { value: "referral", label: "Indicação" },
  { value: "instagram", label: "Instagram" },
  { value: "facebook", label: "Facebook" },
  { value: "tiktok", label: "TikTok" },
  { value: "youtube", label: "YouTube" },
  { value: "ai", label: "Inteligência Artificial (IA)" },
  { value: "other", label: "Outro" },
];

export const ACQUISITION_SOURCE_LABELS = Object.fromEntries(ACQUISITION_SOURCE_OPTIONS.map((o) => [o.value, o.label]));
