const STORAGE_KEY = "bite_menu_acquisition_source";
const DEFAULT_SOURCE = "direct";

function readValue() {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeValue(value) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, value);
  } catch {
    // ignora quota / privacidade do browser
  }
}

// Captura utm_source da URL apenas na primeira visita (first-touch).
// Se não houver utm_source (acesso direto), grava "direct" mesmo assim,
// para travar a origem logo no primeiro acesso e evitar que um acesso
// posterior via link de campanha sobrescreva a origem real do usuário.
export function captureAcquisitionSource() {
  if (typeof window === "undefined") return;
  if (readValue()) return;

  const params = new URLSearchParams(window.location.search);
  const source = params.get("utm_source");

  writeValue(source ? source.trim().slice(0, 100) : DEFAULT_SOURCE);
}

export function getAcquisitionSource() {
  return readValue() || DEFAULT_SOURCE;
}
