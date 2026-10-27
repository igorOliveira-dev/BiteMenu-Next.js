// chave anon (menus é de leitura pública): o sitemap roda no build, onde a service role pode não existir
import { supabase } from "@/lib/supabaseClient";
import { listMenuSlugs } from "@/lib/queries/menus";

// Gerado no máximo 1x por dia: robôs acessam com frequência e a lista varre todos os menus
export const revalidate = 86400;

const BASE_URL = "https://www.bitemenu.com.br";

export async function GET() {
  const staticPages = [
    { url: `${BASE_URL}/`, lastmod: "2026-05-12" },
    { url: `${BASE_URL}/support`, lastmod: "2026-05-12" },
    { url: `${BASE_URL}/register`, lastmod: "2025-10-29" },
    { url: `${BASE_URL}/login`, lastmod: "2025-10-29" },
    { url: `${BASE_URL}/politica-de-privacidade`, lastmod: "2026-10-26" },
    { url: `${BASE_URL}/termos-de-uso`, lastmod: "2026-06-28" },
    { url: `${BASE_URL}/pricing`, lastmod: "2026-03-25" },
    { url: `${BASE_URL}/about`, lastmod: "2025-10-29" },
    { url: `${BASE_URL}/faqs`, lastmod: "2026-05-12" },
    { url: `${BASE_URL}/docs`, lastmod: "2026-10-27" },
    { url: `${BASE_URL}/docs/como-comecar`, lastmod: "2026-10-27" },
    { url: `${BASE_URL}/docs/planos`, lastmod: "2026-10-27" },
    { url: `${BASE_URL}/docs/bite-menu-ia`, lastmod: "2026-10-27" },
    { url: `${BASE_URL}/docs/cardapio-digital`, lastmod: "2026-10-27" },
    { url: `${BASE_URL}/docs/pedidos`, lastmod: "2026-10-27" },
    { url: `${BASE_URL}/docs/vendas`, lastmod: "2026-10-27" },
  ];

  // 🌐 Busca todos os menus registrados
  const { data: menus, error } = await listMenuSlugs(supabase);

  if (error) {
    console.error("Erro ao buscar menus:", error);
  }

  const dynamicPages =
    menus?.map((menu) => ({
      url: `${BASE_URL}/menu/${menu.slug}`,
      lastmod: new Date(menu.updated_at).toISOString(),
    })) || [];

  const allPages = [...staticPages, ...dynamicPages];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    ${allPages
      .map(
        (p) => `
      <url>
        <loc>${p.url}</loc>
        <lastmod>${p.lastmod}</lastmod>
      </url>`,
      )
      .join("")}
  </urlset>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/xml" },
  });
}
