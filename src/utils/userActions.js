const STORAGE_KEY = "bite_menu_user_actions";
const MAX_EVENTS = 40;

const FEATURE_KEYS = ["salesDashboard", "highlightPromo", "limits", "salesAccess", "configAccess"];

const getDefaults = () => ({
  events: [],
  lastModalShownAt: null,
  modalDismissCount: 0,
  suggestionCounts: FEATURE_KEYS.reduce((acc, k) => ({ ...acc, [k]: 0 }), {}),
});

function readState() {
  if (typeof window === "undefined") return getDefaults();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaults();
    const parsed = JSON.parse(raw);
    const defaults = getDefaults();
    return {
      events: Array.isArray(parsed.events) ? parsed.events : defaults.events,
      lastModalShownAt: typeof parsed.lastModalShownAt === "number" ? parsed.lastModalShownAt : null,
      modalDismissCount: typeof parsed.modalDismissCount === "number" ? parsed.modalDismissCount : 0,
      suggestionCounts: { ...defaults.suggestionCounts, ...(parsed.suggestionCounts || {}) },
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

export function trackAction(key) {
  if (typeof window === "undefined" || !key) return;
  const state = readState();
  state.events.push({ key, ts: Date.now() });
  while (state.events.length > MAX_EVENTS) state.events.shift();
  writeState(state);
}

export function getActions() {
  return readState();
}

export function countKey(events, key) {
  if (!Array.isArray(events)) return 0;
  return events.filter((e) => e?.key === key).length;
}

export function markModalShown(featureKey) {
  if (typeof window === "undefined") return;
  const state = readState();
  state.lastModalShownAt = Date.now();
  if (featureKey && state.suggestionCounts[featureKey] != null) {
    state.suggestionCounts[featureKey] += 1;
  }
  writeState(state);
}

export function markModalDismissed(featureKey) {
  if (typeof window === "undefined") return;
  const state = readState();
  state.lastModalShownAt = Date.now();
  state.modalDismissCount += 1;
  if (featureKey && state.suggestionCounts[featureKey] != null) {
    state.suggestionCounts[featureKey] += 1;
  }
  writeState(state);
}

export function resetActions() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}

const RULES = {
  free: [
    {
      featureKey: "salesDashboard",
      eligible: (events) => countKey(events, "triedSalesDashboard") >= 1,
      suggestion: {
        title: "Dashboard de vendas completo no plano Pro",
        text: "Acompanhe gráficos, produtos mais vendidos e horários de pico para tomar decisões com base em dados reais.",
        ctaText: "Ver plano Pro",
      },
    },
    {
      featureKey: "highlightPromo",
      eligible: (events) => countKey(events, "triedHighlight") + countKey(events, "triedPromotion") >= 3,
      suggestion: {
        title: "Destaque itens e crie preços promocionais",
        text: "Com o plano Plus você pode destacar seus melhores pratos e criar promoções para vender mais.",
        ctaText: "Ver plano Plus",
      },
    },
    {
      featureKey: "limits",
      eligible: (events) => countKey(events, "triedItemLimit") + countKey(events, "triedCategoryLimit") >= 1,
      suggestion: {
        title: "Mais itens e categorias no seu cardápio",
        text: "Você está no limite do plano Free. Amplie seu cardápio com mais itens e categorias no plano Plus.",
        ctaText: "Ver plano Plus",
      },
    },
    {
      featureKey: "salesAccess",
      eligible: (events) => countKey(events, "accessedSales") >= 4,
      suggestion: {
        title: "Análises detalhadas de vendas",
        text: "Acompanhe suas vendas com relatórios completos e descubra o que está dando certo no plano Pro.",
        ctaText: "Ver plano Pro",
      },
    },
    {
      featureKey: "configAccess",
      eligible: (events) => countKey(events, "accessedConfigMenu") >= 5,
      suggestion: {
        title: "Personalize ainda mais seu cardápio",
        text: "O plano Plus permite editar layout do seu cardápio e criar taxas de entrega por bairro.",
        ctaText: "Ver plano Plus",
      },
    },
  ],
  plus: [
    {
      featureKey: "salesDashboard",
      eligible: (events) => countKey(events, "triedSalesDashboard") >= 1,
      suggestion: {
        title: "Dashboard de vendas completo no plano Pro",
        text: "Acompanhe gráficos, produtos mais vendidos e horários de pico para tomar decisões com base em dados reais.",
        ctaText: "Ver plano Pro",
      },
    },
    {
      featureKey: "salesAccess",
      eligible: (events) => countKey(events, "accessedSales") >= 4,
      suggestion: {
        title: "Relatórios detalhados de vendas",
        text: "Tenha relatórios completos das suas vendas e descubra padrões com o plano Pro.",
        ctaText: "Ver plano Pro",
      },
    },
  ],
};

export function getModalSuggestion(role) {
  if (typeof window === "undefined") return null;
  const rules = RULES[role];
  if (!rules) return null;

  const state = readState();
  const eligible = rules.filter((r) => r.eligible(state.events));
  if (eligible.length === 0) return null;

  // entre as elegíveis, escolhe a feature mostrada menos vezes (rotação)
  // empate resolve pela ordem da tabela (primeiro da lista vence)
  let pick = eligible[0];
  let pickCount = state.suggestionCounts[pick.featureKey] ?? 0;
  for (const r of eligible) {
    const c = state.suggestionCounts[r.featureKey] ?? 0;
    if (c < pickCount) {
      pick = r;
      pickCount = c;
    }
  }

  return { featureKey: pick.featureKey, ...pick.suggestion };
}
