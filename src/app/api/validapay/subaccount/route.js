import { validapay, getUserFromRequest, ONLINE_PAYMENT_ROLES } from "@/lib/validapay";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// Subconta ValidaPay do estabelecimento (pagamento online por Pix).
// POST envia a proposta · GET status/saldo · PUT saque · DELETE refaz o cadastro.
// Ligar/desligar: "pix_online" em menus.payments (Configurar cardápio → Pagamentos).

const json = (body, status = 200) => Response.json(body, { status });
const digits = (v) => String(v ?? "").replace(/\D/g, "");
const phone = (v) => `+55${digits(v).replace(/^55(?=\d{10,11}$)/, "")}`;

async function ownerMenu(req) {
  const user = await getUserFromRequest(req);
  if (!user) return { error: json({ error: "Não autenticado" }, 401) };

  const [{ data: profile }, { data: menu, error }] = await Promise.all([
    supabaseAdmin.from("profiles").select("role").eq("id", user.id).maybeSingle(),
    supabaseAdmin
      .from("menus")
      .select("id, slug, payments, online_payment_form_id, online_payment_account")
      .eq("owner_id", user.id)
      .maybeSingle(),
  ]);
  if (error) throw error;
  if (!menu) return { error: json({ error: "Cardápio não encontrado" }, 404) };
  // Só Pro/Business/admin cadastram; quem já tem subconta e mudou de plano continua vendo o saldo e sacando
  return { menu, allowed: ONLINE_PAYMENT_ROLES.includes(profile?.role) };
}

const handle = (fn) => async (req) => {
  try {
    const { menu, allowed, error } = await ownerMenu(req);
    if (error) return error;
    return await fn(req, menu, allowed);
  } catch (err) {
    console.error("[ValidaPay Subconta] Erro:", err, err.details);
    // erros de validação da ValidaPay trazem os campos em details
    const details = err.details
      ? ` (${typeof err.details === "string" ? err.details : JSON.stringify(err.details)})`
      : "";
    return json({ error: `${err.message || "Erro interno"}${details}` }, err.status || (err.code ? 400 : 500));
  }
};

const address = (a = {}) => ({
  postalCode: digits(a.postalCode),
  street: a.street,
  number: a.number,
  addressComplement: a.addressComplement || "",
  neighborhood: a.neighborhood,
  city: a.city,
  state: String(a.state || "").toUpperCase(),
});

const brDate = (iso) => (iso ? iso.split("-").reverse().join("-") : ""); // yyyy-mm-dd → dd-mm-yyyy

export const POST = handle(async (req, menu, allowed) => {
  if (!allowed) return json({ error: "Pagamento online disponível nos planos Pro e Business." }, 403);
  if (menu.online_payment_form_id) return json({ error: "Cadastro já enviado." }, 400);

  const f = await req.json();
  const o = f.owner ?? {};
  const { formId } = await validapay("/v1/proposals", {
    method: "POST",
    body: {
      contactNumber: phone(f.contactNumber),
      documentNumber: digits(f.documentNumber),
      businessEmail: f.businessEmail,
      businessName: f.businessName,
      tradingName: f.tradingName,
      // tipo da conta (não o porte): MEI e ME também são PJ; o porte vai no faturamento declarado
      companyType: "PJ",
      businessAddress: address(f.businessAddress),
      // mesma faixa de faturamento (01-05) nos dois códigos
      financialCompanyDetails: { declaredCompanyRevenue: `DCRB${f.revenueBand}` },
      owner: [
        {
          ownerType: "SOCIO",
          documentNumber: digits(o.documentNumber),
          fullName: o.fullName,
          phoneNumber: phone(o.phoneNumber),
          email: o.email,
          motherName: o.motherName,
          socialName: o.socialName || o.fullName,
          birthDate: brDate(o.birthDate),
          address: address(o.address),
          isPoliticallyExposedPerson: !!o.isPoliticallyExposedPerson,
          financialOwnerDetails: {
            ownerDeclaredIncome: `ODIB${o.incomeBand}`,
            ownerDeclaredRevenue: `ODRB${f.revenueBand}`,
          },
        },
      ],
    },
  });

  const { error } = await supabaseAdmin.from("menus").update({ online_payment_form_id: formId }).eq("id", menu.id);
  if (error) throw error;
  return json({ ok: true });
});

export const GET = handle(async (req, menu, allowed) => {
  if (!menu.online_payment_form_id) return json({ stage: "none", allowed });

  let account = menu.online_payment_account;
  if (!account) {
    let proposal;
    try {
      proposal = await validapay(`/v1/proposals/${menu.online_payment_form_id}`);
    } catch (err) {
      // proposta inacessível (outra credencial/ambiente ou falha da ValidaPay): não trava a tela,
      // o dono pode atualizar ou refazer o cadastro
      if (!err.status || err.status >= 500) throw err;
      console.error("[ValidaPay Subconta] Proposta inacessível:", err.message);
      return json({ stage: "pending", allowed, proposalError: err.message });
    }
    const cnpj = proposal.documentNumber;
    // ponytail: só a 1ª página (100 mais recentes); paginar quando houver mais subcontas que isso
    const { subAccounts = [] } = await validapay("/v1/accounts/subaccounts?perPage=100");
    account = subAccounts.find((s) => s.documentNumber === cnpj && s.status === "CONFIRMED")?.accountNumber;

    if (!account) {
      return json({
        stage: "pending",
        allowed,
        proposal: proposal.proposalStatus?.proposal ?? null,
        documents: proposal.proposalStatus?.documents ?? null,
        documentsUrl: proposal.proposalStatus?.urlDocumentscopy ?? null,
      });
    }
    const { error } = await supabaseAdmin.from("menus").update({ online_payment_account: account }).eq("id", menu.id);
    if (error) throw error;
  }

  const { balances = [] } = await validapay(`/v1/wallet/balance?accountId=${account}`);
  const active = {
    stage: "active",
    allowed,
    enabled: (menu.payments ?? []).includes("pix_online"),
    balance: balances.find((b) => String(b.accountNumber) === String(account))?.balance ?? 0,
  };
  const params = new URL(req.url).searchParams;
  if (!params.has("details")) return json(active);

  // Período do extrato (YYYY-MM-DD, horário de Brasília): padrão últimos 30 dias, máximo 31 dias
  const today = new Date(Date.now() - 3 * 3600000).toISOString().slice(0, 10);
  const to = params.get("to") || today;
  const from = params.get("from") || new Date(new Date(`${to}T12:00:00Z`) - 29 * DAY).toISOString().slice(0, 10);
  const fromDate = new Date(`${from}T00:00:00.000-03:00`);
  const toDate = new Date(`${to}T23:59:59.999-03:00`);
  if (isNaN(fromDate) || isNaN(toDate) || fromDate > toDate) return json({ error: "Período inválido." }, 400);
  if (toDate - fromDate > 31 * DAY) return json({ error: "O período pode ter no máximo 1 mês." }, 400);
  const range = `dateFrom=${fromDate.toISOString()}&dateTo=${toDate.toISOString()}`;

  // tela "Minha conta de recebimentos": dados da subconta, extrato do período e saques
  const [{ subAccounts = [] }, statementItems, { items: withdrawals = [] }] = await Promise.all([
    validapay("/v1/accounts/subaccounts?perPage=100"),
    allStatementItems(account, range),
    validapay(`/v1/wallet/withdrawals?accountId=${account}&limit=20`),
  ]);
  const info = subAccounts.find((s) => String(s.accountNumber) === String(account));
  // itens sem valor (ex.: "Débito" vazio que acompanha o saque) não são movimentação
  const transactions = statementItems.filter((t) => t.amount != null);

  // liga cada entrada do extrato ao pedido pago por ela (orders.online_charge_id = chargeId)
  const chargeIds = [...new Set(transactions.map((t) => t.chargeId).filter(Boolean))];
  const { data: paidOrders, error: ordersError } = chargeIds.length
    ? await supabaseAdmin
        .from("orders")
        .select("online_charge_id, costumer_name, created_at")
        .eq("menu_id", menu.id)
        .in("online_charge_id", chargeIds)
    : { data: [] };
  if (ordersError) throw ordersError;
  const orderByCharge = Object.fromEntries(
    (paidOrders ?? []).map((o) => [o.online_charge_id, { customer: o.costumer_name, createdAt: o.created_at }]),
  );

  return json({
    ...active,
    period: { from, to },
    account: {
      number: account,
      name: info?.name ?? null,
      documentNumber: info?.documentNumber ?? null,
      status: info?.status ?? null,
      createdAt: info?.createdAt ?? null,
      dailyWithdrawalLimit: info?.dailyWithdrawalLimit ?? null,
    },
    transactions: transactions.map((t) => ({
      id: t.transactionId,
      type: t.type,
      category: t.category,
      title: t.title || t.description,
      order: (t.chargeId && orderByCharge[t.chargeId]) || null,
      amount: t.amount, // líquido (já sem a taxa da plataforma e a tarifa da ValidaPay)
      gross: t.grossAmount,
      fee: t.feeAmount,
      balanceAfter: t.balanceAfter,
      createdAt: t.createdAt,
    })),
    withdrawals: withdrawals.map((w) => ({
      id: w.withdrawalId,
      amount: w.amount,
      fee: w.feeAmount,
      status: w.status,
      pixKey: w.pixKey,
      createdAt: w.createdAt,
    })),
  });
});

const DAY = 86400000;

// Extrato completo do período (paginado). A API real devolve a lista em "items" (a doc diz "transactions").
// ponytail: teto de 20 páginas (2000 movimentações por mês); aumentar se algum estabelecimento passar disso
async function allStatementItems(account, range) {
  const items = [];
  let token = "";
  for (let page = 0; page < 20; page++) {
    const res = await validapay(
      `/v1/wallet/transactions?accountId=${account}&${range}&limit=100${token && `&nextPageToken=${encodeURIComponent(token)}`}`,
    );
    items.push(...(res.items ?? res.transactions ?? []));
    token = res.nextPageToken;
    if (!res.hasMore || !token) break;
  }
  return items;
}

export const PUT = handle(async (req, menu) => {
  if (!menu.online_payment_account) return json({ error: "Subconta ainda não aprovada." }, 400);
  const { amount, pixKey, pixKeyType } = await req.json();
  const value = Math.round(Number(amount) * 100) / 100;
  if (!(value > 0)) return json({ error: "Valor inválido" }, 400);

  const withdrawal = await validapay("/v1/wallet/withdraw", {
    method: "POST",
    body: { amount: value, pixKey, pixKeyType, accountId: menu.online_payment_account },
  });
  return json({ ok: true, status: withdrawal.status });
});

// Refazer cadastro: só antes da subconta existir (proposta perdida, recusada ou de outro ambiente)
export const DELETE = handle(async (req, menu) => {
  if (menu.online_payment_account) return json({ error: "A subconta já está ativa." }, 400);
  const { error } = await supabaseAdmin.from("menus").update({ online_payment_form_id: null }).eq("id", menu.id);
  if (error) throw error;
  return json({ ok: true });
});
