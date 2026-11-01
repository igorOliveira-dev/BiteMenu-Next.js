import { resend, RESEND_FROM_EMAIL } from "@/lib/resend";
import { plans } from "@/consts/Plans";
import { LEGACY_COUPONS } from "@/lib/legacyPlan";
import { SITE, button, shell } from "@/lib/emails/subscriptionEmails";

// E-mails pra quem tem plano com data de término (assinantes da Stripe e testes grátis).
// announce recebe `info` de legacyPlanInfo(); d5/d2/d1/free recebem `notice` de legacyNotice().

const PRICING_URL = `${SITE}/dashboard/pricing`;
const esc = (text) =>
  String(text ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const planName = (plan) => plans.find((p) => p.id === plan)?.name ?? "Bite Menu";
const hello = (name) => `<p>Olá${name ? `, ${esc(name.split(" ")[0])}` : ""}!</p>`;

// "entre 23/10/2026 e 27/10/2026": perto do fim do plano, sem pagar em dobro
const subscribeWindow = (info) =>
  `entre <strong>${info.subscribeFromLabel}</strong> e <strong>${info.lastDayLabel}</strong>`;

const NEW_SYSTEM =
  "No novo sistema você paga com <strong>Pix Automático, cartão ou boleto</strong>, e o plano anual sai com <strong>2 meses grátis</strong>.";

const WHY =
  "Isso acontece porque <strong>trocamos o sistema de pagamentos do Bite Menu</strong>: as assinaturas do sistema antigo não passam automaticamente para o novo, então é preciso assinar de novo, uma única vez.";

const DATA_SAFE = "Seu cardápio, pedidos e dados continuam salvos. Nada é apagado.";

const business = plans.find((p) => p.id === "business");
const featureList = (features) =>
  `<ul style="margin:8px 0 0;padding-left:20px;">${features
    .filter((f) => !f.startsWith("Inclui"))
    .map((f) => `<li>${esc(f)}</li>`)
    .join("")}</ul>`;

const NEWS = `
  <div style="border:1px solid #eee;border-radius:12px;padding:16px;margin:20px 0;">
    <p style="margin:0 0 8px;font-weight:bold;">O que mudou no novo sistema</p>
    <p style="margin:0 0 8px;">💠 <strong>Pix</strong>: agora dá pra pagar por Pix Automático, além de cartão e boleto.</p>
    <p style="margin:0;">🚀 <strong>Novo plano ${business.name}</strong>: tudo do Pro e mais:</p>
    ${featureList(business.features)}
  </div>`;

const couponBox = (coupon, until) => `
  <div style="border:2px dashed #d42020;border-radius:12px;padding:16px;margin:20px 0;text-align:center;background:#fff7f7;">
    <p style="margin:0 0 6px;">Use o cupom no checkout:</p>
    <p style="margin:0 0 6px;font-size:24px;font-weight:bold;letter-spacing:2px;color:#d42020;">${coupon.code}</p>
    <p style="margin:0;"><strong>${coupon.percent}% de desconto</strong>, válido até <strong>${until}</strong></p>
  </div>`;

const early = (n) => couponBox(LEGACY_COUPONS.early, n.endLabel);
const footer = (n) =>
  `<p style="color:#555;">Se não assinar até ${n.lastDayLabel}, sua conta passa para o plano Free em ${n.endLabel}. ${DATA_SAFE}</p>`;

const TEMPLATES = {
  announce: ({ name, info }) => ({
    subject: "Trocamos nosso sistema de pagamentos",
    html: shell(
      "Trocamos nosso sistema de pagamentos",
      `${hello(name)}
       <p>Trocamos o sistema de pagamentos do Bite Menu. Por isso, seu plano <strong>${planName(info.plan)}</strong> atual continua funcionando normalmente, <strong>sem nenhuma cobrança</strong>, até <strong>${info.lastDayLabel}</strong>.</p>
       <p><strong>Você não precisa fazer nada agora.</strong> Para continuar com o ${planName(info.plan)}, recomendamos assinar pelo novo sistema ${subscribeWindow(info)}, perto do fim do seu plano atual. Assim você aproveita o plano até o último dia, não paga em dobro e não fica nenhum dia sem os recursos.</p>
       <p>${NEW_SYSTEM}</p>
       ${button(PRICING_URL, "Ver planos")}
       <p style="color:#555;">Se não assinar, sua conta passa para o plano Free em ${info.endLabel}. ${DATA_SAFE}</p>`,
    ),
  }),

  // D-5: cupom de 25% + novidades
  d5: ({ name, notice: n }) => ({
    subject: `25% de desconto para continuar no ${planName(n.plan)}`,
    html: shell(
      `Continue no ${planName(n.plan)} com 25% de desconto`,
      `${hello(name)}
       <p>Seu plano <strong>${planName(n.plan)}</strong> atual vale até <strong>${n.lastDayLabel}</strong>. ${WHY}</p>
       <p>Para agradecer por estar com a gente desde o começo, separamos um desconto para você reassinar:</p>
       ${early(n)}
       ${NEWS}
       <p>Leva menos de 2 minutos e você não fica nenhum dia sem os recursos.</p>
       ${button(PRICING_URL, "Reassinar com 25% off")}
       ${footer(n)}`,
    ),
  }),

  // D-2: lembrete do prazo
  d2: ({ name, notice: n }) => ({
    subject: `Faltam 2 dias: seu plano ${planName(n.plan)} vale até ${n.lastDayLabel}`,
    html: shell(
      "Faltam 2 dias para reassinar",
      `${hello(name)}
       <p>Lembrete rápido: seu plano <strong>${planName(n.plan)}</strong> vale até <strong>${n.lastDayLabel}</strong>. ${WHY}</p>
       <p>Seu cupom de 25% ainda está valendo:</p>
       ${early(n)}
       <p>${NEW_SYSTEM}</p>
       ${button(PRICING_URL, `Reassinar o ${planName(n.plan)}`)}
       ${footer(n)}`,
    ),
  }),

  // D-1: último dia
  d1: ({ name, notice: n }) => ({
    subject: `Último dia para manter seu plano ${planName(n.plan)}`,
    html: shell(
      `Hoje é o último dia do seu plano ${planName(n.plan)}`,
      `${hello(name)}
       <p>Hoje (<strong>${n.lastDayLabel}</strong>) é o último dia do seu plano <strong>${planName(n.plan)}</strong>. Amanhã sua conta passa para o Free. ${WHY}</p>
       <p>Reassinando hoje, você continua com tudo o que já usa:</p>
       ${featureList(plans.find((p) => p.id === n.plan)?.features ?? [])}
       ${early(n)}
       <p>${NEW_SYSTEM}</p>
       ${button(PRICING_URL, "Manter meu plano")}
       <p style="color:#555;">${DATA_SAFE}</p>`,
    ),
  }),

  // D: voltou ao Free, cupom de reativação
  free: ({ name, notice: n }) => ({
    subject: "Seu plano voltou ao Free",
    html: shell(
      "Seu plano voltou ao Free",
      `${hello(name)}
       <p>A partir de hoje (<strong>${n.endLabel}</strong>) sua conta está no plano <strong>Free</strong>. ${WHY}</p>
       <p>${DATA_SAFE}</p>
       <p>Ainda dá tempo de voltar com desconto:</p>
       ${couponBox(LEGACY_COUPONS.comeback, n.comebackUntilLabel)}
       <p>${NEW_SYSTEM}</p>
       ${button(PRICING_URL, "Reativar meu plano")}`,
    ),
  }),
};

// Lança em caso de erro: quem chama decide se segue pros próximos destinatários.
export async function sendLegacyPlanEmail(kind, to, data, idempotencyKey) {
  if (!resend) throw new Error("RESEND_API_KEY não configurada");
  const { subject, html } = TEMPLATES[kind](data);
  const { error } = await resend.emails.send(
    { from: RESEND_FROM_EMAIL, to, subject, html },
    idempotencyKey ? { idempotencyKey } : undefined,
  );
  if (error) throw new Error(error.message || JSON.stringify(error));
}
