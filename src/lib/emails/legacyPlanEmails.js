import { resend, RESEND_FROM_EMAIL } from "@/lib/resend";
import { plans } from "@/consts/Plans";
import { SITE, button, shell } from "@/lib/emails/subscriptionEmails";

// E-mails pra quem tem plano com data de término (assinantes da Stripe e testes grátis).
// `info` vem de legacyPlanInfo().

const PRICING_URL = `${SITE}/dashboard/pricing`;
const esc = (text) =>
  String(text ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const planName = (plan) => plans.find((p) => p.id === plan)?.name ?? "Bite Menu";
const hello = (name) => `<p>Olá${name ? `, ${esc(name.split(" ")[0])}` : ""}!</p>`;

// Sempre o intervalo "entre 26/10/2026 e 28/10/2026": o cliente não precisa assinar antes do fim do plano
const subscribeWindow = (info) =>
  `entre <strong>${info.subscribeFromLabel}</strong> e <strong>${info.endLabel}</strong>`;

const NEW_SYSTEM =
  "No novo sistema você paga com <strong>Pix Automático, cartão ou boleto</strong>, e o plano anual sai com <strong>2 meses grátis</strong>.";

const TEMPLATES = {
  announce: ({ name, info }) => ({
    subject: "Trocamos nosso sistema de pagamentos",
    html: shell(
      "Trocamos nosso sistema de pagamentos",
      `${hello(name)}
       <p>Trocamos o sistema de pagamentos do Bite Menu. Por isso, seu plano <strong>${planName(info.plan)}</strong> atual continua funcionando normalmente, <strong>sem nenhuma cobrança</strong>, e termina em <strong>${info.endLabel}</strong>.</p>
       <p><strong>Você não precisa fazer nada agora.</strong> Para continuar com o ${planName(info.plan)}, recomendamos assinar pelo novo sistema ${subscribeWindow(info)}, perto do fim do seu plano atual. Assim você aproveita o plano até o último dia, não paga em dobro e não fica nenhum dia sem os recursos.</p>
       <p>${NEW_SYSTEM}</p>
       ${button(PRICING_URL, "Ver planos")}
       <p style="color:#555;">Se não assinar, sua conta passa para o plano Free em ${info.endLabel}. Seu cardápio, pedidos e dados continuam salvos, e você pode assinar quando quiser.</p>`,
    ),
  }),

  reminder: ({ name, info }) => ({
    subject: `Seu plano ${planName(info.plan)} termina em ${info.endLabel}`,
    html: shell(
      `Seu plano ${planName(info.plan)} termina em ${info.endLabel}`,
      `${hello(name)}
       <p>Como trocamos o sistema de pagamentos do Bite Menu, seu plano <strong>${planName(info.plan)}</strong> atual termina em <strong>${info.endLabel}</strong>, sem nenhuma cobrança. A continuação é feita pelo novo sistema.</p>
       <p>Para continuar com todos os recursos sem interrupção, recomendamos assinar ${subscribeWindow(info)}. Assim você aproveita o plano atual até o fim e não paga em dobro. Leva menos de 2 minutos.</p>
       <p>${NEW_SYSTEM}</p>
       ${button(PRICING_URL, `Assinar o ${planName(info.plan)}`)}
       <p style="color:#555;">Se não assinar, sua conta passa para o plano Free. Seu cardápio e seus dados continuam salvos.</p>`,
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
