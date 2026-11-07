import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { LANDING_CSP, LANDING_ROLES, cleanLandingHtml, withBadge } from "@/lib/landing";

// Landing do estabelecimento gerada pela IA. HTML cru (não página React), isolado pelo CSP sandbox.
// Sem landing ou dono sem o plano: vai para o cardápio (o HTML continua salvo e volta junto com o plano).
export async function GET(req, { params }) {
  const { slug } = await params;
  const { data: menu, error } = await supabaseAdmin
    .from("menus")
    .select("slug, owner_id, landing_html")
    .eq("slug", slug)
    .maybeSingle();
  if (error) {
    console.error("[site] erro ao ler menu:", error);
    return new Response("Erro ao carregar a página", { status: 500 });
  }
  if (!menu) return new Response("Página não encontrada", { status: 404 });

  const toMenu = () => Response.redirect(new URL(`/menu/${encodeURIComponent(menu.slug)}`, req.url), 307);
  if (!menu.landing_html) return toMenu();

  const { data: profile } = await supabaseAdmin.from("profiles").select("role").eq("id", menu.owner_id).maybeSingle();
  if (!LANDING_ROLES.includes(profile?.role)) return toMenu();

  return new Response(withBadge(cleanLandingHtml(menu.landing_html)), {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Security-Policy": LANDING_CSP,
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "Cache-Control": "no-store",
    },
  });
}
