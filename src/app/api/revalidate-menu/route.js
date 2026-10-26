import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getUserFromRequest } from "@/lib/validapay";

// Derruba o cache (ISR) do cardápio de quem chama, para a edição aparecer na hora.
// Chamado pelo supabaseClient depois de gravações nas tabelas do cardápio público.
export async function POST(req) {
  const user = await getUserFromRequest(req);
  if (!user) return Response.json({ error: "Não autenticado" }, { status: 401 });

  let { data: menu } = await supabaseAdmin.from("menus").select("slug").eq("owner_id", user.id).maybeSingle();

  // funcionário (caixa/cozinha) também altera estoque e abre/fecha a loja
  if (!menu) {
    const { data: staff } = await supabaseAdmin.from("menu_staff").select("menu_id").eq("user_id", user.id).maybeSingle();
    if (staff?.menu_id) {
      ({ data: menu } = await supabaseAdmin.from("menus").select("slug").eq("id", staff.menu_id).maybeSingle());
    }
  }

  if (!menu?.slug) return Response.json({ ok: false });

  revalidatePath(`/menu/${menu.slug}`);
  return Response.json({ ok: true });
}
