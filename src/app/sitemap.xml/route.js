import { supabaseServer } from "@/lib/supabaseServer";

export async function GET() {
  const staticPages = [
    { url: "https://bitemenu.com.br/", lastmod: "2025-10-29" },
    { url: "https://bitemenu.com.br/support", lastmod: "2025-10-29" },
    { url: "https://bitemenu.com.br/register", lastmod: "2025-10-29" },
    { url: "https://bitemenu.com.br/login", lastmod: "2025-10-29" },
    { url: "https://bitemenu.com.br/politica-de-privacidade", lastmod: "2025-10-29" },
    { url: "https://bitemenu.com.br/pricing", lastmod: "2025-10-29" },
    { url: "https://bitemenu.com.br/about", lastmod: "2025-10-29" },
    { url: "https://bitemenu.com.br/faqs", lastmod: "2025-10-29" },
  ];

  // 🌐 Busca todos os menus registrados
  const { data: menus, error } = await supabaseServer.from("menus").select("slug, updated_at");

  console.log("Menus:", menus);

  if (error) {
    console.error("Erro ao buscar menus:", error);
  }

  const dynamicPages =
    menus?.map((menu) => ({
      url: `https://bitemenu.com.br/menu/${menu.slug}`,
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
      </url>`
      )
      .join("")}
  </urlset>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/xml" },
  });
}
