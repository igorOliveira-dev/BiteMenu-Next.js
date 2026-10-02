// Horário de funcionamento sempre calculado no fuso da loja (menus.timezone),
// nunca no relógio de quem abre o cardápio.
export const DEFAULT_TIMEZONE = "America/Sao_Paulo";

export const weekOrder = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

export const dayNames = {
  mon: "Segunda-feira",
  tue: "Terça-feira",
  wed: "Quarta-feira",
  thu: "Quinta-feira",
  fri: "Sexta-feira",
  sat: "Sábado",
  sun: "Domingo",
};

function toMinutes(str) {
  const [h, m] = str.split(":").map(Number);
  return h * 60 + m;
}

// { dayKey: "mon".."sun", mins: minutos desde 00:00 } no fuso informado
export function nowInZone(timeZone, date = new Date()) {
  let fmt;
  try {
    fmt = new Intl.DateTimeFormat("en-US", {
      timeZone: timeZone || DEFAULT_TIMEZONE,
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    });
  } catch {
    return nowInZone(DEFAULT_TIMEZONE, date);
  }
  const p = Object.fromEntries(fmt.formatToParts(date).map((x) => [x.type, x.value]));
  return { dayKey: p.weekday.toLowerCase(), mins: Number(p.hour) * 60 + Number(p.minute) };
}

export function isOpenNow(hours, timeZone, date) {
  const { dayKey, mins } = nowInZone(timeZone, date);
  const todayHours = hours?.[dayKey];
  if (!todayHours) return false;

  const [openStr, closeStr] = todayHours.split("-");
  return mins >= toMinutes(openStr) && mins <= toMinutes(closeStr);
}

export function getClosingTime(hours, timeZone, date) {
  const { dayKey } = nowInZone(timeZone, date);
  const todayHours = hours?.[dayKey] || null;
  if (!todayHours) return null;

  const [, closeStr] = todayHours.split("-");
  return closeStr;
}

export function getNextOpenInfo(hours, timeZone, date) {
  if (!hours) return null;

  const { dayKey: todayKey, mins } = nowInZone(timeZone, date);
  const todayIndex = weekOrder.indexOf(todayKey);

  // 1. Ainda pode abrir hoje?
  const todayHours = hours[todayKey];
  if (todayHours) {
    const [openStr] = todayHours.split("-");
    if (toMinutes(openStr) > mins) {
      return { label: "hoje", time: openStr };
    }
  }

  // 2. Procura nos próximos dias
  for (let offset = 1; offset <= 6; offset++) {
    const dayKey = weekOrder[(todayIndex + offset) % 7];
    const dayHours = hours[dayKey];
    if (dayHours) {
      const [openStr] = dayHours.split("-");
      const label = offset === 1 ? "amanhã" : dayNames[dayKey];
      return { label, time: openStr };
    }
  }

  return null;
}

// minutos em relação ao UTC (ex: America/Sao_Paulo → -180)
export function zoneOffset(timeZone, date = new Date()) {
  let name;
  try {
    name = new Intl.DateTimeFormat("en-US", { timeZone: timeZone || DEFAULT_TIMEZONE, timeZoneName: "longOffset" })
      .formatToParts(date)
      .find((p) => p.type === "timeZoneName").value;
  } catch {
    return zoneOffset(DEFAULT_TIMEZONE, date);
  }
  const m = name.match(/([+-])(\d{2}):(\d{2})/);
  return m ? (m[1] === "-" ? -1 : 1) * (Number(m[2]) * 60 + Number(m[3])) : 0;
}

// soma minutos a "HH:MM", dando a volta na meia-noite
export function shiftTime(time, diffMin) {
  if (!diffMin) return time;
  const mins = (((toMinutes(time) + diffMin) % 1440) + 1440) % 1440;
  return `${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`;
}

// "UTC-4", "UTC+5:30"
export function formatOffset(offsetMin) {
  const sign = offsetMin < 0 ? "-" : "+";
  const abs = Math.abs(offsetMin);
  const mm = abs % 60;
  return `UTC${sign}${Math.floor(abs / 60)}${mm ? `:${String(mm).padStart(2, "0")}` : ""}`;
}
