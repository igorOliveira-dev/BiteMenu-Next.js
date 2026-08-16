import { supabase } from "@/lib/supabaseClient";
import { cache } from "react";

export const getMenuBySlug = cache(async (slug) => {
  if (!slug) return null;

  const { data: menu, error } = await supabase
    .from("menus")
    .select(
      `
      id,
      owner_id,
      slug,
      title,
      description,
      address,
      banner_url,
      logo_url,
      background_color,
      title_color,
      details_color,
      hours,
      services,
      payments,
      delivery_fee,
      delivery_fee_mode,
      minimum_order_value,
      pix_key,
      orders,
      layout,
      currency,
      use_stripe_express,
      categories (
        id,
        name,
        position,
        menu_items (
          id,
          name,
          description,
          price,
          promo_price,
          image_url,
          thumb_url,
          additionals,
          starred,
          mandatory_additional,
          additionals_limit,
          visible,
          option_groups (
            id,
            name,
            min_choices,
            max_choices,
            position,
            option_choices (
              id,
              name,
              price,
              hidden,
              position
            )
          )
        )
      )
    `,
    )
    .eq("slug", slug)
    .order("position", { foreignTable: "categories", ascending: true })
    .order("position", { foreignTable: "categories.menu_items", ascending: true })
    .order("position", { foreignTable: "categories.menu_items.option_groups", ascending: true })
    .order("position", { foreignTable: "categories.menu_items.option_groups.option_choices", ascending: true })
    .maybeSingle();

  if (error) return null;
  return menu || null;
});

// Busca phone e role do dono server-side para evitar 2 queries client-side por visita.
export async function getOwnerInfo(menu) {
  let ownerPhone = null;
  let ownerRole = "free";
  let ownerStripeAccount = null;
  let ownerCanUseStripeExpress = false;

  if (menu?.owner_id) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("phone, role, stripe_connect_account_id, privileges")
      .eq("id", menu.owner_id)
      .maybeSingle();

    if (profile) {
      ownerPhone = profile.phone || null;
      ownerRole = profile.role || "free";
      ownerStripeAccount = profile.stripe_connect_account_id || null;
      ownerCanUseStripeExpress = (profile.privileges ?? []).includes("stripe-express");
    }
  }

  return { ownerPhone, ownerRole, ownerStripeAccount, ownerCanUseStripeExpress };
}
