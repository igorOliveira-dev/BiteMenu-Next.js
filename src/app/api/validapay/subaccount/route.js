import { revalidatePath } from "next/cache";
import { validapayOnline as validapay, getUserFromRequest, ONLINE_PAYMENT_ROLES } from "@/lib/validapay";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// Subconta ValidaPay do estabelecimento (pagamento online por Pix).
// POST envia a proposta · GET status/saldo · PATCH liga/desliga · PUT saque.

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
      .select("id, slug, online_payment_form_id, online_payment_account, online_payment_enabled")
      .eq("owner_id", user.id)
      .maybeSingle(),
  ]);
  if (error) throw error;
  if (!menu) return { error: json({ error: "Cardápio não encontrado" }, 404) };
  if (!ONLINE_PAYMENT_ROLES.includes(profile?.role)) {
    return { error: json({ error: "Pagamento online está disponível nos planos Pro e Business." }, 403) };
  }
  return { menu };
}

const handle = (fn) => async (req) => {
  try {
    const { menu, error } = await ownerMenu(req);
    if (error) return error;
    return await fn(req, menu);
  } catch (err) {
    console.error("[ValidaPay Subconta] Erro:", err);
    return json({ error: err.message || "Erro interno" }, err.code ? 400 : 500);
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

export const POST = handle(async (req, menu) => {
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
      companyType: f.companyType,
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

export const GET = handle(async (req, menu) => {
  if (!menu.online_payment_form_id) return json({ stage: "none" });

  let account = menu.online_payment_account;
  if (!account) {
    const proposal = await validapay(`/v1/proposals/${menu.online_payment_form_id}`);
    const cnpj = proposal.documentNumber;
    // ponytail: só a 1ª página (100 mais recentes); paginar quando houver mais subcontas que isso
    const { subAccounts = [] } = await validapay("/v1/accounts/subaccounts?perPage=100");
    account = subAccounts.find((s) => s.documentNumber === cnpj && s.status === "CONFIRMED")?.accountNumber;

    if (!account) {
      return json({
        stage: "pending",
        proposal: proposal.proposalStatus?.proposal ?? null,
        documents: proposal.proposalStatus?.documents ?? null,
        documentsUrl: proposal.proposalStatus?.urlDocumentscopy ?? null,
      });
    }
    const { error } = await supabaseAdmin.from("menus").update({ online_payment_account: account }).eq("id", menu.id);
    if (error) throw error;
  }

  const { balances = [] } = await validapay(`/v1/wallet/balance?accountId=${account}`);
  return json({
    stage: "active",
    enabled: menu.online_payment_enabled,
    balance: balances.find((b) => String(b.accountNumber) === String(account))?.balance ?? 0,
  });
});

export const PATCH = handle(async (req, menu) => {
  if (!menu.online_payment_account) return json({ error: "Subconta ainda não aprovada." }, 400);
  const { enabled } = await req.json();

  const { error } = await supabaseAdmin
    .from("menus")
    .update({ online_payment_enabled: !!enabled })
    .eq("id", menu.id);
  if (error) throw error;

  revalidatePath(`/menu/${menu.slug}`);
  return json({ ok: true, enabled: !!enabled });
});

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
