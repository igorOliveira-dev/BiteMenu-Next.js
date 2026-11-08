// node scripts/schedule-check.mjs — agendamento só dentro do horário (src/lib/schedule.js)
import assert from "node:assert/strict";
import { isWithinHours } from "../src/lib/schedule.js";

const tz = "America/Sao_Paulo"; // UTC-3
const hours = { mon: "11:00-14:00,18:00-02:00" }; // 09/11/2026 é segunda
const at = (isoLocal) => new Date(`${isoLocal}-03:00`).toISOString();

assert.equal(isWithinHours(hours, tz, at("2026-11-09T12:00")), true, "turno do almoço");
assert.equal(isWithinHours(hours, tz, at("2026-11-09T16:00")), false, "entre turnos");
assert.equal(isWithinHours(hours, tz, at("2026-11-09T10:59")), false, "antes de abrir");
assert.equal(isWithinHours(hours, tz, at("2026-11-10T01:30")), true, "madrugada do turno da noite");
assert.equal(isWithinHours(hours, tz, at("2026-11-10T03:00")), false, "depois do turno da noite");
assert.equal(isWithinHours(hours, tz, at("2026-11-11T12:00")), false, "dia sem horário");
assert.equal(isWithinHours(null, tz, at("2026-11-11T12:00")), true, "sem horário cadastrado não restringe");
assert.equal(isWithinHours({ mon: "" }, tz, at("2026-11-11T12:00")), true, "horário vazio não restringe");
console.log("schedule-check ok");
