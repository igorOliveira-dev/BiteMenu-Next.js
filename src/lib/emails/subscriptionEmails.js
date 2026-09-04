import { resend, RESEND_FROM_EMAIL } from "@/lib/resend";

function formatBRL(cents) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(date) {
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
}

function planPhrase(planName) {
  return planName ? `plano <strong>${planName}</strong>` : "seu plano";
}

function emailShell(title, bodyHtml) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #1a1a1a;">
      <h2 style="color: #111;">${title}</h2>
      ${bodyHtml}
      <p style="margin-top: 32px; font-size: 12px; color: #888;">Bite Menu</p>
    </div>
  `;
}

export async function sendUpcomingRenewalEmail({ to, planName, amountCents, renewalDate }) {
  if (!to) return;
  if (!resend) {
    console.warn("[Resend] RESEND_API_KEY não configurada; email de renovação não enviado");
    return;
  }

  const html = emailShell(
    "Sua assinatura vai renovar em breve",
    `
      <p>Olá!</p>
      <p>Sua assinatura do ${planPhrase(planName)} no Bite Menu será renovada automaticamente em <strong>${formatDate(renewalDate)}</strong>, no valor de <strong>${formatBRL(amountCents)}</strong>.</p>
      <p>Se você paga por boleto, fique de olho no seu email nos próximos dias para não perder o vencimento.</p>
    `,
  );

  await resend.emails.send({
    from: RESEND_FROM_EMAIL,
    to,
    subject: "Sua assinatura Bite Menu renova em breve",
    html,
  });
}

export async function sendBoletoReadyEmail({ to, planName, amountCents, dueDate, boletoUrl }) {
  if (!to || !boletoUrl) return;
  if (!resend) {
    console.warn("[Resend] RESEND_API_KEY não configurada; email de boleto não enviado");
    return;
  }

  const html = emailShell(
    "Seu boleto está pronto",
    `
      <p>Olá!</p>
      <p>O boleto de renovação da sua assinatura do ${planPhrase(planName)} no Bite Menu já está disponível, no valor de <strong>${formatBRL(amountCents)}</strong>.</p>
      <p><strong>Vencimento: ${formatDate(dueDate)}</strong></p>
      <p style="margin-top: 24px;">
        <a href="${boletoUrl}" style="background:#111;color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none;">Ver boleto</a>
      </p>
      <p>Se o boleto vencer sem pagamento, sua assinatura pode ser cancelada automaticamente.</p>
    `,
  );

  await resend.emails.send({
    from: RESEND_FROM_EMAIL,
    to,
    subject: "Seu boleto Bite Menu está pronto para pagamento",
    html,
  });
}
