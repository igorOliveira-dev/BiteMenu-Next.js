import { validapayOnline as validapay, PLATFORM_FEE_PERCENT, ONLINE_PAYMENT_ROLES } from "@/lib/validapay";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { finalizeOnlineOrder } from "@/lib/onlineOrders";

const json = (body, status = 200) => Response.json(body, { status });

// Campos do pedido que o cliente pode mandar; menu_id, pagamento e is_paid são definidos aqui.
const ORDER_FIELDS = [
  "costumer_name",
  "costumer_phone",
  "service",
  "items_list",
  "neighborhood",
  "address",
  "delivery_fee",
  "discount",
  "total",
];

async function onlineAccount(menuId) {
  const { data: menu, error } = await supabaseAdmin
    .from("menus")
    .select("id, owner_id, online_payment_enabled, online_payment_account")
    .eq("id", menuId)
    .maybeSingle();
  if (error) throw error;
  if (!menu?.online_payment_enabled || !menu.online_payment_account) return null;

  const { data: profile } = await supabaseAdmin.from("profiles").select("role").eq("id", menu.owner_id).maybeSingle();
  return ONLINE_PAYMENT_ROLES.includes(profile?.role) ? menu.online_payment_account : null;
}

// Cria o Pix na subconta do estabelecimento com split de PLATFORM_FEE_PERCENT para a master.
// O pedido só entra em orders depois de pago (finalizeOnlineOrder).
// ponytail: total calculado no navegador, como no PIX manual; recalcular no servidor se houver abuso.
// ponytail: sem rate limit; adicionar se aparecer spam de cobranças.
export async function POST(req) {
  try {
    const { menuId, payload } = await req.json();
    const account = menuId && (await onlineAccount(menuId));
    if (!account) return json({ error: "Pagamento online indisponível neste cardápio." }, 400);

    const total = Math.round(Number(payload?.total) * 100) / 100;
    if (!Number.isFinite(total) || total < 1) return json({ error: "Valor mínimo para Pix online: R$ 1,00." }, 400);
    if (!Array.isArray(payload.items_list) || !payload.items_list.length) return json({ error: "Pedido vazio." }, 400);

    const order = { menu_id: menuId, change_requested: null, change_for_amount: null };
    for (const key of ORDER_FIELDS) order[key] = payload[key] ?? null;
    order.total = total;

    const charge = await validapay("/v1/charges/pix", {
      method: "POST",
      subAccount: account,
      body: {
        amount: total,
        externalTxid: menuId,
        metadata: { menuId },
        split: [{ type: "percentage", amount: PLATFORM_FEE_PERCENT }],
      },
    });

    const { error } = await supabaseAdmin
      .from("online_payments")
      .insert([{ charge_id: charge.chargeId, menu_id: menuId, payload: order, amount: total }]);
    if (error) throw error;

    return json({ chargeId: charge.chargeId, emv: charge.emv, qrCode: charge.qrCode, total });
  } catch (err) {
    console.error("[Pix online] Erro ao criar cobrança:", err);
    return json({ error: "Não foi possível gerar o Pix. Tente novamente." }, 500);
  }
}

// Polling do cliente: quando a cobrança é paga, registra o pedido (o webhook faz o mesmo).
export async function GET(req) {
  try {
    const chargeId = new URL(req.url).searchParams.get("chargeId");
    if (!chargeId) return json({ error: "chargeId obrigatório" }, 400);

    const { data: pending, error } = await supabaseAdmin
      .from("online_payments")
      .select("menu_id")
      .eq("charge_id", chargeId)
      .maybeSingle();
    if (error) throw error;

    if (!pending) {
      // já finalizado pelo webhook (ou cobrança desconhecida)
      const { data: order } = await supabaseAdmin
        .from("orders")
        .select("id")
        .eq("online_charge_id", chargeId)
        .maybeSingle();
      return json({ status: order ? "PAID" : "UNKNOWN" });
    }

    const { data: menu } = await supabaseAdmin
      .from("menus")
      .select("online_payment_account")
      .eq("id", pending.menu_id)
      .maybeSingle();

    const { status } = await validapay(`/v1/charges/${chargeId}/status`, {
      subAccount: menu?.online_payment_account,
    });
    if (status === "PAID") await finalizeOnlineOrder(chargeId);

    return json({ status });
  } catch (err) {
    console.error("[Pix online] Erro ao consultar cobrança:", err);
    return json({ error: "Erro ao consultar pagamento" }, 500);
  }
}
