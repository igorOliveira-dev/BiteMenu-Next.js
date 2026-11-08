// Agendamento (plano Business): orders.scheduled_for. Ver tasks/agendamento/.
// Self-check: node scripts/schedule-check.mjs
import { isOpenNow, splitRanges } from "../utils/storeHours.js";
export const SCHEDULE_ROLES = ["business", "enterprise", "admin", "designer"];

export const formatScheduled = (iso) =>
  new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

// valor do <input type="datetime-local"> (hora local) mais cedo permitido: agora + antecedência (min)
export const nowLocalInput = (addMinutes = 0) => {
  const d = new Date(Date.now() + addMinutes * 60000);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};

// horário agendado dentro do funcionamento (no fuso da loja). Sem horário cadastrado, não restringe.
export const isWithinHours = (hours, timeZone, iso) => {
  const configured = Object.values(hours || {}).some((v) => splitRanges(v).length > 0);
  return !configured || isOpenNow(hours, timeZone, new Date(iso));
};
