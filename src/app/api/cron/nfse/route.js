import crypto from "crypto";
import { validapay } from "@/lib/validapay";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { focus, nfsePayload, brNow, ref, DESDE } from "@/lib/nfse";
import { sendSubscriptionEmail } from "@/lib/emails/subscriptionEmails";

// NFS-e das faturas pagas na ValidaPay, chamado pelo pg_cron uma vez por dia (tasks/nfse.sql).
// POST { mode: "dry-run" | "send" }  ·  Authorization: Bearer CRON_SECRET
// Não depende do webhook: lê as faturas direto da ValidaPay e a tabela nfse impede nota repetida.
// A Focus autoriza de forma assíncrona, então cada rodada primeiro atualiza as notas da anterior.
// Nota com status rejeitada/erro_autorizacao: corrigir o motivo e apagar a linha em nfse
// faz a próxima rodada emitir de novo (com outro número de DPS).

export const maxDuration = 300;

const json = (body, status = 200) => Response.json(body, { status });

function authorized(req) {
  const secret = process.env.CRON_SECRET;
  const given = req.headers.get("authorization")?.replace("Bearer ", "") ?? "";
  return !!secret && given.length === secret.length && crypto.timingSafeEqual(Buffer.from(given), Buffer.from(secret));
}

async function save(numero, patch) {
  const { error } = await supabaseAdmin
    .from("nfse")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("numero_dps", numero);
  if (error) throw error;
}

// 4xx = a Focus recusou na hora (a nota não existe lá); 5xx/rede = não sabemos, fica pendente
async function send(numero, payload) {
  try {
    const { status, data } = await focus(`/nfsen?ref=${ref(numero)}`, {
      method: "POST",
      body: { ...payload, data_emissao: brNow() },
    });
    if (status === 202) return { status: data.status ?? "processando_autorizacao", erro: null };
    return { status: status >= 500 ? "pendente" : "rejeitada", erro: data.mensagem ?? `Focus ${status}` };
  } catch (err) {
    return { status: "pendente", erro: err.message };
  }
}

async function refresh() {
  const { data: open, error } = await supabaseAdmin
    .from("nfse")
    .select("numero_dps, status, payload")
    .in("status", ["pendente", "processando_autorizacao"]);
  if (error) throw error;

  for (const row of open) {
    const { status, data } = await focus(`/nfsen/${ref(row.numero_dps)}`);
    if (status === 404 && row.status === "pendente") await save(row.numero_dps, await send(row.numero_dps, row.payload));
    else if (status === 200) {
      await save(row.numero_dps, {
        status: data.status,
        url_danfse: data.url_danfse ?? null,
        erro: data.erros?.map((e) => e.mensagem).join(" | ") || null,
      });
      // Só na passagem pra autorizado (a linha sai da lista de abertas), então não repete
      if (data.status === "autorizado" && data.url_danfse) {
        await sendSubscriptionEmail(
          "nfse",
          row.payload?.email_tomador,
          {
            amount: row.payload.valor_servico,
            description: row.payload.descricao_servico,
            danfseUrl: data.url_danfse,
          },
          `nfse-${row.numero_dps}`,
        );
      }
    }
  }
}

// ponytail: 1 chamada por assinatura, igual ao admin-payments; filtrar por data se a lista crescer muito
async function paidInvoices() {
  const subs = [];
  let lastKey = null;
  do {
    const page = await validapay(`/v1/subscriptions?limit=100${lastKey ? `&lastKey=${encodeURIComponent(lastKey)}` : ""}`);
    subs.push(...page.items);
    lastKey = page.pagination?.lastKey;
  } while (lastKey);

  const paid = [];
  for (const s of subs.filter((s) => s.status !== "PENDING")) {
    const sub = await validapay(`/v1/subscriptions/${s.subscriptionId}`);
    for (const invoice of (sub.billingCycles ?? []).flatMap((c) => c.invoices ?? [])) {
      if (invoice.status === "PAID" && invoice.paidAt >= DESDE && invoice.summary?.total > 0) paid.push({ sub, invoice });
    }
  }
  return paid;
}

export async function POST(req) {
  if (!authorized(req)) return json({ error: "Unauthorized" }, 401);

  try {
    const { mode = "dry-run" } = await req.json().catch(() => ({}));
    if (!["dry-run", "send"].includes(mode)) return json({ error: "mode inválido" }, 400);

    if (mode === "send") await refresh();

    const { data: done, error } = await supabaseAdmin.from("nfse").select("invoice_id");
    if (error) throw error;
    const emitted = new Set(done.map((r) => r.invoice_id));
    const fresh = (await paidInvoices()).filter(({ invoice }) => !emitted.has(invoice.invoiceId));

    // Assinatura antiga (já trocada/cancelada) não está mais no profile: fica o e-mail da ValidaPay
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from("profiles")
      .select("email, validapay_subscription_id")
      .not("validapay_subscription_id", "is", null);
    if (profilesError) throw profilesError;
    const emailOf = new Map(profiles.map((p) => [p.validapay_subscription_id, p.email]));
    const payloadOf = (sub, invoice, numero) => nfsePayload(sub, invoice, numero, emailOf.get(sub.subscriptionId));

    if (mode === "dry-run") {
      return json({ count: fresh.length, notas: fresh.map(({ sub, invoice }) => payloadOf(sub, invoice, null)) });
    }

    const results = [];
    for (const { sub, invoice } of fresh) {
      const { data: row, error } = await supabaseAdmin
        .from("nfse")
        .insert({ invoice_id: invoice.invoiceId, subscription_id: sub.subscriptionId })
        .select("numero_dps")
        .single();
      if (error?.code === "23505") continue; // outra rodada já pegou essa fatura
      if (error) throw error;

      const payload = payloadOf(sub, invoice, row.numero_dps);
      const result = await send(row.numero_dps, payload);
      await save(row.numero_dps, { payload, ...result });
      results.push({ invoice: invoice.invoiceId, numero_dps: row.numero_dps, ...result });
    }
    console.log(`[NFS-e] ${results.length} nota(s) enviada(s)`, results);
    return json({ count: results.length, results });
  } catch (err) {
    console.error("[NFS-e] Erro:", err);
    return json({ error: err.message || "Erro interno" }, 500);
  }
}
