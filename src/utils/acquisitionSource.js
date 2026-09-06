const STORAGE_KEY = "bite_menu_acquisition_source";

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

export function captureAcquisitionSource() {
  if (typeof window === "undefined") return;
  if (readValue()) return;

  const params = new URLSearchParams(window.location.search);
  const source = params.get("utm_source");
  if (!source) return;

  writeValue(source.trim().slice(0, 100));
}

export function getAcquisitionSource() {
  return readValue();
}
