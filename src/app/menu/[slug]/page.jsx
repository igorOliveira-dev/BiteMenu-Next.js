import { supabase } from "@/lib/supabaseClient";
import NotFoundMenu from "../NotFoundMenu";
import ClientMenu from "./ClientMenu";
import { CartProvider } from "@/contexts/CartContext";
import { cache } from "react";
import ClientMenu2 from "./ClientMenu2";
import ClientMenu3 from "./ClientMenu3";

const getMenuBySlug = cache(async (slug) => {
  if (!slug) return null;

  const { data: menu, error } = await supabase
    .from("menus")
    .select(
      `
      id,
      owner_id,
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
      delivery_zones,
      delivery_fee_mode,
      minimum_order_value,
      pix_key,
      orders,
      layout,
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
          additionals,
          visible,
          starred,
          mandatory_additional,
          additionals_limit
        )
      )
    `,
    )
    .eq("slug", slug)
    .order("position", { foreignTable: "categories", ascending: true })
    .order("position", { foreignTable: "categories.menu_items", ascending: true })
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

  return {
    title: `${menu.title} | Bite Menu`,
    description: menu.description || "Confira este cardápio no Bite Menu.",
    alternates: {
      canonical: canonicalUrl,
    },
    robots: {
      index: true,
      follow: false,
    },
  };
}

// Página principal (server component)
export default async function MenuPage({ params, searchParams }) {
  const { slug } = await params;
  const { preview_layout } = (await searchParams) ?? {};

  const menu = await getMenuBySlug(slug);

  if (!menu) return <NotFoundMenu />;

  const effectiveLayout = preview_layout || menu.layout;

  return (
    <CartProvider>
      {effectiveLayout === "default" ? (
        <ClientMenu menu={menu} />
      ) : effectiveLayout === "list" ? (
        <ClientMenu2 menu={menu} />
      ) : effectiveLayout === "grid" ? (
        <ClientMenu3 menu={menu} />
      ) : (
        <ClientMenu menu={menu} />
      )}
    </CartProvider>
  );
}
