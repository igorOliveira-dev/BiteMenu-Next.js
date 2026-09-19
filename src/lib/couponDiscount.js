// Efeito de um cupom sobre o subtotal (já com desconto de combo).
// Frete grátis só vale para entrega; abaixo do pedido mínimo o cupom não aplica.
export function applyCoupon({ coupon, subtotal, isDelivery }) {
  const none = { discount: 0, freeShipping: false, belowMin: false };
  if (!coupon) return none;

  if (subtotal < (Number(coupon.min_order) || 0)) return { ...none, belowMin: true };
  if (coupon.type === "free_shipping") return { ...none, freeShipping: !!isDelivery };

  let discount =
    coupon.type === "fixed"
      ? Number(coupon.discount_amount) || 0
      : subtotal * (Number(coupon.discount_percent) / 100);
  const cap = Number(coupon.max_discount) || 0;
  if (cap > 0) discount = Math.min(discount, cap);

  return { ...none, discount: Math.round(Math.min(discount, subtotal) * 100) / 100 };
}
