import { Resend } from "resend";

// O construtor do Resend lança erro se a key estiver ausente — guardamos aqui
// pra não derrubar o módulo (e junto o webhook inteiro) quando RESEND_API_KEY
// não estiver configurada.
export const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "Bite Menu <contato@bitemenu.com.br>";
