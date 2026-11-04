import "server-only";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// Pix online pago: move o pedido de online_payments para orders. Chamado pelo polling do cliente
// e pelo webhook; o unique em orders.online_charge_id impede pedido duplicado.
export async function finalizeOnlineOrder(chargeId) {
  const { data: pending, error } = await supabaseAdmin
    .from("online_payments")
    .select("payload")
    .eq("charge_id", chargeId)
    .maybeSingle();
  if (error) throw error;
  if (!pending) return; // já finalizado (ou cobrança que não é de pedido)

  const now = new Date().toISOString();
  const { error: insertError } = await supabaseAdmin.from("orders").insert([
    {
      ...pending.payload,
      payment_method: "pix_online",
      is_paid: true,
      online_charge_id: chargeId,
      created_at: now,
      updated_at: now,
    },
  ]);
  if (insertError && insertError.code !== "23505") throw insertError;

  await supabaseAdmin.from("online_payments").delete().eq("charge_id", chargeId);
}
