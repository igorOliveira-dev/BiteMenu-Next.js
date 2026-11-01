import crypto from "crypto";
import { resend, RESEND_FROM_EMAIL } from "@/lib/resend";
import { SITE, button, shell } from "@/lib/emails/subscriptionEmails";

// E-mails do remarketing (trilhas A/B/C). O conteúdo vem da tabela marketing_steps (editado no /admin/remarketing);
// aqui só fica o layout fixo: saudação, texto, botão e link de descadastro.

const esc = (text) =>
  String(text ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

// {{variavel}} -> valor (variável desconhecida vira vazio)
export const fillVars = (text, vars) => String(text ?? "").replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key) => vars[key] ?? "");

// Texto simples -> HTML: linha em branco separa parágrafos, **negrito**, links viram clicáveis
const textToHtml = (text) =>
  esc(text)
    .split(/\n\s*\n/)
    .filter((p) => p.trim())
    .map(
      (p) =>
        `<p>${p
          .trim()
          .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
          .replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" style="color:#d42020;">$1</a>')
          .replace(/\n/g, "<br>")}</p>`,
    )
    .join("");

const ctaHref = (path, vars) => {
  const p = fillVars(path, vars).trim() || "/dashboard";
  return /^https?:\/\//.test(p) ? p : `${SITE}${p.startsWith("/") ? "" : "/"}${p}`;
};

// Token do descadastro: HMAC do id do perfil, não dá pra descadastrar outra pessoa trocando o id
export const unsubscribeToken = (profileId) =>
  crypto.createHmac("sha256", process.env.CRON_SECRET ?? "").update(`unsub:${profileId}`).digest("hex").slice(0, 32);

const unsubscribeQuery = (profileId) => `u=${profileId}&t=${unsubscribeToken(profileId)}`;

export function renderRemarketingEmail(step, vars, profileId) {
  const subject = fillVars(step.subject, vars);
  const title = fillVars(step.title, vars) || subject;
  const preview = fillVars(step.preview, vars);
  const body = `
    <p>Olá${vars.nome ? `, ${esc(vars.nome)}` : ""}!</p>
    ${textToHtml(fillVars(step.body, vars))}
    ${step.cta_label ? button(esc(ctaHref(step.cta_path, vars)), esc(fillVars(step.cta_label, vars))) : ""}
    <p style="margin-top:28px;font-size:12px;color:#888;">
      Não quer mais receber dicas do Bite Menu? <a href="${SITE}/descadastro?${unsubscribeQuery(profileId)}" style="color:#888;">Descadastrar</a>
    </p>`;
  // pré-visualização: texto que aparece ao lado do assunto na caixa de entrada
  const preheader = preview
    ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(preview)}${"&nbsp;&zwnj;".repeat(60)}</div>`
    : "";
  return { subject, html: preheader + shell(esc(title), body) };
}

// Lança em caso de erro. Retorna o id do e-mail no Resend (usado pelo webhook de abertura/clique).
export async function sendRemarketingEmail(step, to, vars, profileId, { idempotencyKey, test = false } = {}) {
  if (!resend) throw new Error("RESEND_API_KEY não configurada");
  const { subject, html } = renderRemarketingEmail(step, vars, profileId);
  const { data, error } = await resend.emails.send(
    {
      from: RESEND_FROM_EMAIL,
      to,
      subject: test ? `[Teste] ${subject}` : subject,
      html,
      headers: {
        "List-Unsubscribe": `<${SITE}/api/remarketing/unsubscribe?${unsubscribeQuery(profileId)}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
    },
    idempotencyKey ? { idempotencyKey } : undefined,
  );
  if (error) throw new Error(error.message || JSON.stringify(error));
  return data?.id ?? null;
}
