import { resend, RESEND_FROM_EMAIL } from "@/lib/resend";
import { plans } from "@/consts/Plans";
import { brDate } from "@/lib/brDate";

// E-mails da assinatura enviados pelo Bite Menu (os automáticos da ValidaPay ficam desligados).
// Disparados pelo webhook da ValidaPay; idempotencyKey = id do evento, pra retentativa não duplicar e-mail.

const SITE = "https://www.bitemenu.com.br";
const PLAN_DETAILS_URL = `${SITE}/dashboard?tab=planDetails`;
const PRICING_URL = `${SITE}/dashboard/pricing`;

const esc = (text) =>
  String(text ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const brl = (value) => Number(value ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const date = (iso) => brDate(iso, { day: "2-digit", month: "long", year: "numeric" });
const planName = (plan) => plans.find((p) => p.id === plan)?.name ?? "Bite Menu";
const perCycle = (interval) => (interval === "YEARLY" ? "por ano" : "por mês");

const button = (href, label) => `
  <p style="margin: 28px 0;">
    <a href="${href}" style="background:#d42020;color:#fff;padding:12px 22px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block;">${label}</a>
  </p>`;

function shell(title, body) {
  return `
    <div style="background:#f8ecec;padding:24px 12px;font-family:Arial,Helvetica,sans-serif;">
      <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:16px;padding:28px;color:#171717;">
        <img src="${SITE}/LogoMarca-sem-fundo.png" alt="Bite Menu" width="150" style="display:block;margin-bottom:20px;" />
        <h2 style="margin:0 0 16px;font-size:20px;">${title}</h2>
        <div style="font-size:15px;line-height:1.6;">${body}</div>
        <p style="margin-top:28px;font-size:12px;color:#888;">
          Bite Menu · Dúvidas? Responda este e-mail ou fale com a gente pelo <a href="${SITE}/support" style="color:#888;">suporte</a>.
        </p>
      </div>
    </div>`;
}

const TEMPLATES = {
  activated: ({ plan, interval, amount, nextChargeDate }) => ({
    subject: `Sua assinatura do plano ${planName(plan)} está ativa`,
    html: shell(
      `Bem-vindo ao plano ${planName(plan)}!`,
      `<p>Seu pagamento foi confirmado e todos os recursos do plano <strong>${planName(plan)}</strong> já estão liberados na sua conta.</p>
       <p>Valor: <strong>${brl(amount)} ${perCycle(interval)}</strong>${nextChargeDate ? `<br/>Próxima cobrança: <strong>${date(nextChargeDate)}</strong>` : ""}</p>
       ${button(PLAN_DETAILS_URL, "Ver meu plano")}`,
    ),
  }),

  renewed: ({ plan, interval, amount, nextChargeDate }) => ({
    subject: "Pagamento da sua assinatura confirmado",
    html: shell(
      "Assinatura renovada",
      `<p>Recebemos o pagamento de <strong>${brl(amount)}</strong> da sua assinatura do plano <strong>${planName(plan)}</strong>. Tudo certo por aqui!</p>
       ${nextChargeDate ? `<p>Próxima cobrança: <strong>${date(nextChargeDate)}</strong> (${brl(amount)} ${perCycle(interval)}).</p>` : ""}
       ${button(PLAN_DETAILS_URL, "Ver meu plano")}`,
    ),
  }),

  boleto: ({ plan, amount, dueDate, boletoUrl }) => ({
    subject: "Seu boleto do Bite Menu está disponível",
    html: shell(
      "Seu boleto chegou",
      `<p>O boleto da sua assinatura do plano <strong>${planName(plan)}</strong> já está disponível.</p>
       <p>Valor: <strong>${brl(amount)}</strong>${dueDate ? `<br/>Vencimento: <strong>${date(dueDate)}</strong>` : ""}</p>
       ${button(boletoUrl, "Abrir boleto")}
       <p style="color:#555;">O boleto também tem um QR Code Pix, se preferir pagar na hora pelo app do banco.</p>`,
    ),
  }),

  paymentFailed: ({ plan, amount, reason, nextRetryAt }) => ({
    subject: "Não conseguimos processar o pagamento da sua assinatura",
    html: shell(
      "Pagamento não aprovado",
      `<p>Tentamos cobrar <strong>${brl(amount)}</strong> da sua assinatura do plano <strong>${planName(plan)}</strong>, mas o pagamento não foi aprovado${reason ? ` (${esc(reason)})` : ""}.</p>
       ${nextRetryAt ? `<p>Vamos tentar de novo em <strong>${date(nextRetryAt)}</strong>. Confira se há saldo ou limite disponível até lá.</p>` : "<p>Confira se há saldo ou limite disponível.</p>"}
       <p>Enquanto isso, seu plano continua funcionando normalmente.</p>
       ${button(PLAN_DETAILS_URL, "Ver minha assinatura")}`,
    ),
  }),

  cancelScheduled: ({ plan, effectiveAt }) => ({
    subject: "Cancelamento da sua assinatura confirmado",
    html: shell(
      "Assinatura cancelada",
      `<p>O cancelamento da sua assinatura do plano <strong>${planName(plan)}</strong> foi confirmado. Nenhuma nova cobrança será feita.</p>
       <p>Você continua com todos os recursos${effectiveAt ? ` até <strong>${date(effectiveAt)}</strong>` : " até o fim do período já pago"}. Depois disso, sua conta volta para o plano Free.</p>
       <p>Mudou de ideia? Dá pra restaurar a assinatura até essa data.</p>
       ${button(PLAN_DETAILS_URL, "Restaurar assinatura")}`,
    ),
  }),

  expired: ({ plan }) => ({
    subject: "Sua assinatura do Bite Menu foi encerrada",
    html: shell(
      "Assinatura encerrada",
      `<p>Como não conseguimos confirmar o pagamento, sua assinatura do plano <strong>${planName(plan)}</strong> foi encerrada e sua conta voltou para o plano Free.</p>
       <p>Seu cardápio e seus dados continuam salvos. Para voltar a usar todos os recursos, é só assinar de novo.</p>
       ${button(PRICING_URL, "Assinar novamente")}`,
    ),
  }),

  canceled: ({ plan }) => ({
    subject: `Seu plano ${planName(plan)} terminou`,
    html: shell(
      "Seu plano terminou",
      `<p>O período da sua assinatura do plano <strong>${planName(plan)}</strong> chegou ao fim e sua conta voltou para o plano Free.</p>
       <p>Seu cardápio e seus dados continuam salvos. Quando quiser voltar, é só assinar de novo.</p>
       ${button(PRICING_URL, "Ver planos")}`,
    ),
  }),
};

// Nunca lança: falha de e-mail não pode derrubar o webhook (que já atualizou o plano).
export async function sendSubscriptionEmail(kind, to, data, idempotencyKey) {
  if (!to) return;
  if (!resend) {
    console.warn(`[Resend] RESEND_API_KEY não configurada; e-mail "${kind}" não enviado`);
    return;
  }

  try {
    const { subject, html } = TEMPLATES[kind](data);
    const { error } = await resend.emails.send(
      { from: RESEND_FROM_EMAIL, to, subject, html },
      idempotencyKey ? { idempotencyKey: `sub-${kind}-${idempotencyKey}` } : undefined,
    );
    if (error) console.error(`[Resend] Falha ao enviar "${kind}" para ${to}:`, error);
  } catch (err) {
    console.error(`[Resend] Erro ao enviar "${kind}":`, err);
  }
}
