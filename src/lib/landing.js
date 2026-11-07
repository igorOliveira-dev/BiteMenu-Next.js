// Landing page do estabelecimento gerada pela IA (tasks/landing-ia/landing-ia-plan.md).
// Sem imports de servidor: a aba do dashboard também usa este arquivo.

// Exclusivo do Enterprise (plano ainda não lançado; ninguém tem esse role até lá)
export const LANDING_ROLES = ["admin", "enterprise"];

// mesmo limite do check da coluna menus.landing_html (tasks/landing-ia/landing-ia.sql)
export const LANDING_MAX_LENGTH = 300_000;

// A página roda como origem única (sandbox), sem JS e sem envio de formulário: a segurança está aqui, não no strip.
export const LANDING_CSP = [
  "sandbox allow-popups allow-popups-to-escape-sandbox",
  "default-src 'none'",
  "style-src 'unsafe-inline' https://fonts.googleapis.com",
  "font-src https://fonts.gstatic.com",
  "img-src https: data:",
  "form-action 'none'",
  "base-uri 'none'",
  "frame-ancestors 'self'",
].join("; ");

// shortcut: regex não é um sanitizador completo; o CSP acima é a barreira. Trocar por DOMPurify se a landing aceitar JS.
export function cleanLandingHtml(html) {
  return String(html ?? "")
    .replace(/<(script|iframe|object|embed|form|noscript)\b[\s\S]*?<\/\1\s*>/gi, "")
    .replace(/<\/?(script|iframe|object|embed|form|noscript|base|meta\s+http-equiv)\b[^>]*>/gi, "")
    .replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/(href|src|action|formaction)\s*=\s*(["']?)\s*javascript:/gi, '$1=$2#');
}

const BADGE =
  '<a href="https://bitemenu.com.br" target="_blank" rel="noopener" style="position:fixed;right:12px;bottom:12px;z-index:2147483647;padding:6px 12px;border-radius:999px;background:#111;color:#fff;font:600 12px/1.4 system-ui,sans-serif;text-decoration:none;opacity:.85">Feito com Bite Menu</a>';

// Selo fixo no fim do body; o dono não remove pelo prompt porque é colocado na hora de servir
export function withBadge(html) {
  return /<\/body>/i.test(html) ? html.replace(/<\/body>(?![\s\S]*<\/body>)/i, `${BADGE}</body>`) : html + BADGE;
}

// Aplica os ajustes da IA (troca de trechos exatos). Tudo ou nada: se algum trecho não aparece
// exatamente 1 vez, devolve null e a página fica como estava.
export function applyLandingEdits(html, edits) {
  if (!Array.isArray(edits) || !edits.length) return null;
  let out = html;
  for (const e of edits) {
    if (typeof e?.find !== "string" || !e.find || typeof e.replace !== "string") return null;
    const first = out.indexOf(e.find);
    if (first === -1 || out.indexOf(e.find, first + 1) !== -1) return null;
    out = out.slice(0, first) + e.replace + out.slice(first + e.find.length);
  }
  return out;
}
