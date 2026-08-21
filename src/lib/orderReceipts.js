const STORAGE_KEY = "bite_menu_receipts_v1";
const MAX_PER_MENU = 4;

export function saveReceipt(menuId, receipt) {
  if (typeof window === "undefined" || !menuId) return;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const all = raw ? JSON.parse(raw) : {};
    all[menuId] = [receipt, ...(all[menuId] || [])].slice(0, MAX_PER_MENU);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch (e) {
    console.warn("Erro ao salvar comprovante", e);
  }
}

export function getReceipts(menuId) {
  if (typeof window === "undefined" || !menuId) return [];

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return (raw ? JSON.parse(raw) : {})[menuId] || [];
  } catch (e) {
    console.warn("Erro ao ler comprovantes", e);
    return [];
  }
}
