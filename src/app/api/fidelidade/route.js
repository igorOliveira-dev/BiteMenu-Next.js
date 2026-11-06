import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { LOYALTY_ROLES } from "@/lib/loyalty";

// GET /api/fidelidade?menus=<id>,<id>  →  { allowed: { <menu_id>: true | false } }
// A aba Fidelidades do cliente precisa saber se o dono ainda tem plano com fidelidade (Pro+), mas profiles não é
// legível pelo cliente e menu_owner_role só responde ao dono/equipe. Aqui o servidor lê com service role e devolve só
// o sim/não por cardápio, nunca o plano. Rate limit de /api/ no proxy.js.
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(req) {
  const ids = [...new Set((new URL(req.url).searchParams.get("menus") || "").split(","))]
    .filter((id) => UUID.test(id))
    .slice(0, 50);
  if (!ids.length) return NextResponse.json({ allowed: {} });

  try {
    const { data: menus, error } = await supabaseAdmin.from("menus").select("id, owner_id").in("id", ids);
    if (error) throw error;

    const ownerIds = [...new Set(menus.map((m) => m.owner_id).filter(Boolean))];
    const { data: owners, error: ownersError } = ownerIds.length
      ? await supabaseAdmin.from("profiles").select("id, role").in("id", ownerIds)
      : { data: [] };
    if (ownersError) throw ownersError;

    const roleOf = Object.fromEntries(owners.map((p) => [p.id, p.role]));
    const allowed = Object.fromEntries(menus.map((m) => [m.id, LOYALTY_ROLES.includes(roleOf[m.owner_id])]));
    return NextResponse.json({ allowed });
  } catch (err) {
    console.error("[fidelidade] erro ao conferir planos:", err?.message || err);
    return NextResponse.json({ error: "indisponível" }, { status: 500 });
  }
}
