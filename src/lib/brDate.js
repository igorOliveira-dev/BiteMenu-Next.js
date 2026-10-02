// Datas da ValidaPay em pt-BR no horário de Brasília.
// Vêm em dois formatos: instante (ex.: vencimento "2026-10-02T01:42:33Z" = 01/10 22:42 em Brasília)
// e data pura ("2026-11-10" ou meia-noite UTC "2026-11-10T00:00:00.000Z"). Converter data pura
// pro fuso de Brasília cairia no dia anterior, então ela é lida como meio-dia do próprio dia.
export function brDate(iso, options = {}) {
  if (!iso) return "";
  const dateOnly = /^\d{4}-\d{2}-\d{2}(T00:00:00(\.000)?Z)?$/.test(iso);
  const date = new Date(dateOnly ? `${iso.slice(0, 10)}T12:00:00Z` : iso);
  return date.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo", ...options });
}

// Hoje em Brasília, como "AAAA-MM-DD"
export function brToday() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
}

// Soma dias a uma data "AAAA-MM-DD" (sem fuso envolvido)
export function addDays(ymd, days) {
  const d = new Date(`${ymd}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
