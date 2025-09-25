import { supabase } from "@/lib/supabaseClient";
import NotFoundMenu from "../NotFoundMenu";
import ClientMenu from "./ClientMenu";

// SEO dinâmico (server only)
export async function generateMetadata({ params }) {
  const { slug } = await params;

  const { data: menu } = await supabase
    .from("menus")
    .select("title, description, banner_url, logo_url")
    .eq("slug", slug)
    .single();

  if (!menu) {
    return {
      title: "Menu não encontrado - Bite Menu",
      description: "Este cardápio não existe ou foi removido.",
    };
  }

  const baseUrl = "https://bitemenu.com.br";
  const canonicalUrl = `${baseUrl}/menu/${slug}`;
  const imageUrl = menu.banner_url || menu.logo_url || `${baseUrl}/default-og.jpg`;

  return {
    title: `${menu.title} | Bite Menu`,
    description: menu.description || "Confira este cardápio no Bite Menu.",
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: `${menu.title} | Bite Menu`,
      description: menu.description,
      url: canonicalUrl,
      siteName: "Bite Menu",
      images: [{ url: imageUrl, width: 1200, height: 630, alt: menu.title }],
      type: "website",
    },
  };
}

// Página principal (server component)
export default async function MenuPage({ params }) {
  const { slug } = await params;

  const { data: menu } = await supabase
    .from("menus")
    .select(
      `
      id,
      title,
      description,
      banner_url,
      logo_url,
      background_color,
      title_color,
      details_color,
      hours,
      categories (
        id,
        name,
        menu_items (
          id,
          name,
          description,
          price
        )
      )
    `
    )
    .eq("slug", slug)
    .single();

  if (!menu) return <NotFoundMenu />;

  // passa dados para o componente client
  return <ClientMenu menu={menu} />;
}
