import { supabase } from "@/lib/supabaseClient";
import NotFoundMenu from "../NotFoundMenu";
import ClientMenu from "./ClientMenu";
import { CartProvider } from "@/contexts/CartContext";
import { cache } from "react";
import ClientMenu2 from "./ClientMenu2";
import ClientMenu3 from "./ClientMenu3";

export const revalidate = 300; // 5 minutos — cardápios raramente mudam em alta frequência

const getMenuBySlug = cache(async (slug) => {
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
      stripe_payment_methods,
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

// SEO dinâmico (server only)
export async function generateMetadata({ params }) {
  const { slug } = await params;

  const menu = await getMenuBySlug(slug);

  if (!menu) {
    return {
      title: "Menu não encontrado - Bite Menu",
      description: "Este cardápio não existe ou foi removido.",
    };
  }

  const baseUrl = "https://www.bitemenu.com.br";
  const canonicalUrl = `${baseUrl}/menu/${slug}`;
  const imageUrl = menu.banner_url || menu.logo_url || `${baseUrl}/default-og.jpg`;
  const description = menu.description || "Confira este cardápio no Bite Menu.";

  return {
    title: `${menu.title} | Bite Menu`,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    robots: {
      index: true,
      follow: false,
    },
    openGraph: {
      title: menu.title,
      description,
      url: canonicalUrl,
      siteName: "Bite Menu",
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: `Banner do cardápio ${menu.title}`,
        },
      ],
      locale: "pt_BR",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: menu.title,
      description,
      images: [imageUrl],
    },
  };
}

// Página principal (server component)
export default async function MenuPage({ params, searchParams }) {
  const { slug } = await params;
  const { preview_layout } = (await searchParams) ?? {};

  const menu = await getMenuBySlug(slug);

  if (!menu) return <NotFoundMenu />;

  // Buscar phone e role do dono server-side para evitar 2 queries client-side por visita.
  // Incluído no cache ISR — não gera egress adicional em visitas repetidas.
  let ownerPhone = null;
  let ownerRole = "free";
  let ownerStripeAccount = null;
  let ownerCanUseStripeExpress = false; // ← novo

  if (menu.owner_id) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("phone, role, stripe_connect_account_id, privileges")
      .eq("id", menu.owner_id)
      .maybeSingle();

    if (profile) {
      ownerPhone = profile.phone || null;
      ownerRole = profile.role || "free";
      ownerStripeAccount = profile.stripe_connect_account_id || null;
      ownerCanUseStripeExpress = (profile.privileges ?? []).includes("stripe-express"); // ← novo
    }
  }

  const effectiveLayout = preview_layout || menu.layout;

  return (
    <CartProvider>
      {effectiveLayout === "default" ? (
        <ClientMenu
          menu={menu}
          ownerPhone={ownerPhone}
          ownerRole={ownerRole}
          ownerStripeAccount={ownerStripeAccount}
          ownerCanUseStripeExpress={ownerCanUseStripeExpress}
        />
      ) : effectiveLayout === "list" ? (
        <ClientMenu2
          menu={menu}
          ownerPhone={ownerPhone}
          ownerRole={ownerRole}
          ownerStripeAccount={ownerStripeAccount}
          ownerCanUseStripeExpress={ownerCanUseStripeExpress}
        />
      ) : effectiveLayout === "grid" ? (
        <ClientMenu3
          menu={menu}
          ownerPhone={ownerPhone}
          ownerRole={ownerRole}
          ownerStripeAccount={ownerStripeAccount}
          ownerCanUseStripeExpress={ownerCanUseStripeExpress}
        />
      ) : (
        <ClientMenu
          menu={menu}
          ownerPhone={ownerPhone}
          ownerRole={ownerRole}
          ownerStripeAccount={ownerStripeAccount}
          ownerCanUseStripeExpress={ownerCanUseStripeExpress}
        />
      )}
    </CartProvider>
  );
}
