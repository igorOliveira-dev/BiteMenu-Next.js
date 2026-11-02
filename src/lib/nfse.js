import { plans } from "@/consts/Plans";
import { priceInfo } from "@/lib/validapay";

// NFS-e Nacional pela Focus NFe: uma nota por fatura paga na ValidaPay (cron /api/cron/nfse).
// FOCUS_NFE_URL: https://homologacao.focusnfe.com.br (testes, sem valor fiscal) ou https://api.focusnfe.com.br
// FOCUS_NFE_TOKEN: token da empresa no painel da Focus (cada ambiente tem o seu).
// Endereço do tomador fica de fora: no padrão nacional ele é opcional.

const CNPJ = "67096848000137";
const MUNICIPIO = "3503604"; // código IBGE (7 dígitos) do município do CNPJ
const COD_TRIBUTACAO = "010501"; // cTribNac (6 dígitos), o mesmo usado nas notas emitidas no portal

// Faturas pagas antes disso não entram (notas anteriores ficaram fora da automação)
export const DESDE = "2026-11-01T03:00:00Z";

export const ref = (numero) => `bitemenu-${numero}`;

export async function focus(path, { method = "GET", body } = {}) {
  const res = await fetch(`${process.env.FOCUS_NFE_URL}/v2${path}`, {
    method,
    headers: {
      Authorization: `Basic ${Buffer.from(`${process.env.FOCUS_NFE_TOKEN}:`).toString("base64")}`,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  return { status: res.status, data: await res.json().catch(() => ({})) };
}

// Horário de Brasília (sem horário de verão desde 2019) no formato que a DPS pede
export const brNow = () => new Date(Date.now() - 3 * 3600000).toISOString().slice(0, 19) + "-03:00";

const CYCLE = { monthly: "mensal", yearly: "anual" };
const planLabel = (priceId) => {
  const info = priceInfo(priceId);
  return info && `${plans.find((p) => p.id === info.plan)?.name} (${CYCLE[info.cycle]})`;
};

// Plano contratado ou, na fatura proporcional de upgrade, a troca de plano
export function describeInvoice(sub, invoice) {
  const lines = invoice.lineItems ?? [];
  const upgrade = lines.find((l) => l.type === "PRORATA_UPGRADE");
  const line = upgrade ?? lines.find((l) => l.type === "RECURRING") ?? lines[0];
  const to = planLabel(line?.priceId) ?? line?.name;

  let text = `assinatura do plano ${to}`;
  if (upgrade) {
    const toItem = sub.items?.find((i) => i.priceId === upgrade.priceId && i.upgradedFromItemId);
    const from = planLabel(sub.items?.find((i) => i.itemId === toItem?.upgradedFromItemId)?.priceId);
    text = `troca ${from ? `do plano ${from} ` : ""}para o plano ${to}, valor proporcional ao restante do período atual`;
  }
  return `Bite Menu - cardápio digital para restaurantes (www.bitemenu.com.br): ${text}. Fatura ${invoice.invoiceNumber}.`;
}

// email: o de login no Bite Menu; o digitado na página da ValidaPay às vezes vem errado
export function nfsePayload(sub, invoice, numero, email) {
  const doc = (sub.document ?? sub.customer?.document ?? "").replace(/\D/g, "");
  return {
    data_emissao: brNow(),
    serie_dps: 1,
    numero_dps: numero,
    data_competencia: new Date(invoice.paidAt).toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" }),
    emitente_dps: 1,
    codigo_municipio_emissora: MUNICIPIO,
    cnpj_prestador: CNPJ,
    codigo_opcao_simples_nacional: 3, // ME/EPP optante pelo Simples
    regime_tributario_simples_nacional: 1, // tributos federais e ISS apurados pelo Simples
    regime_especial_tributacao: 0,
    // Sem CPF/CNPJ a nota sai sem tomador identificado
    ...(doc && {
      [doc.length === 14 ? "cnpj_tomador" : "cpf_tomador"]: doc,
      razao_social_tomador: (sub.customer?.name ?? sub.name)?.trim(),
      email_tomador: email ?? sub.email,
    }),
    codigo_municipio_prestacao: MUNICIPIO,
    codigo_tributacao_nacional_iss: COD_TRIBUTACAO,
    descricao_servico: describeInvoice(sub, invoice),
    valor_servico: invoice.summary.total,
    tributacao_iss: 1, // operação tributável
    tipo_retencao_iss: 1, // não retido
    indicador_total_tributacao: 0, // não informa estimativa de tributos
  };
}
