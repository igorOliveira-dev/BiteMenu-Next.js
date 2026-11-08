import { cache } from "react";
import { redirect } from "next/navigation";
import NotFoundMenu from "@/app/menu/NotFoundMenu";
import { supabase } from "@/lib/supabaseClient";
import { getOwnerInfo } from "@/app/menu/[slug]/getMenuData";
import { LINKTREE_ROLES, cleanLinktree, hasVisibleLinks } from "@/lib/linktree";
import LinktreeView from "./LinktreeView";

// Linktree do estabelecimento (tasks/linktree/linktree-plan.md). ISR igual ao cardápio;
// /api/revalidate-menu derruba o cache ao salvar.
export const revalidate = 300;

export async function generateStaticParams() {
  return [];
}

// consulta enxuta: a linktree não precisa de categorias e produtos
const getLinktreeMenu = cache(async (slug) => {
  if (!slug) return null;
  const { data, error } = await supabase
    .from("menus")
    .select(
      "id, owner_id, slug, title, description, logo_url, banner_url, banner_mobile_url, background_color, title_color, details_color, linktree",
    )
    .eq("slug", slug)
    .maybeSingle();
  // lança em vez de null: com ISR, um erro momentâneo ficaria cacheado como "não encontrado"
  if (error) throw error;
  return data || null;
});

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const menu = await getLinktreeMenu(slug);
  if (!menu) return { title: "Página não encontrada - Bite Menu" };

  const url = `https://www.bitemenu.com.br/links/${slug}`;
  const description = menu.description || `Links de ${menu.title} no Bite Menu.`;
  const image = menu.logo_url || menu.banner_url;

  return {
    title: `${menu.title} | Links`,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: menu.title,
      description,
      url,
      siteName: "Bite Menu",
      ...(image && { images: [{ url: image, alt: menu.title }] }),
      locale: "pt_BR",
      type: "website",
    },
  };
}

export default async function LinksPage({ params }) {
  const { slug } = await params;
  const menu = await getLinktreeMenu(slug);
  if (!menu) return <NotFoundMenu />;

  const { ownerRole, deletionRequested } = await getOwnerInfo(menu);
  if (deletionRequested) return <NotFoundMenu />;

  // sem linktree, sem link visível ou dono fora do plano: vai para o cardápio (o JSON continua salvo)
  const linktree = menu.linktree && LINKTREE_ROLES.includes(ownerRole) ? cleanLinktree(menu.linktree) : null;
  if (!hasVisibleLinks(linktree)) redirect(`/menu/${slug}`);

  return <LinktreeView menu={menu} linktree={linktree} />;
}
