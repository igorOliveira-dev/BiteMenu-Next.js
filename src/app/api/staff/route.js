import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getUserFromRequest } from "@/lib/validapay";
import { STAFF_PLAN_ROLES, STAFF_ROLES, staffEmail, staffLogin } from "@/lib/staff";

// Equipe do cardápio de quem chama. Criar exige Business; listar, trocar senha e remover
// continuam liberados (o dono que caiu de plano ainda consegue limpar a equipe).
async function getOwner(req) {
  const user = await getUserFromRequest(req);
  if (!user) return null;

  const [{ data: menu }, { data: profile }] = await Promise.all([
    supabaseAdmin.from("menus").select("id, slug").eq("owner_id", user.id).maybeSingle(),
    supabaseAdmin.from("profiles").select("role").eq("id", user.id).maybeSingle(),
  ]);
  if (!menu) return null;

  return { menu, canCreate: STAFF_PLAN_ROLES.includes(profile?.role) };
}

const unauthorized = () => Response.json({ error: "Não autenticado" }, { status: 401 });
const notFound = () => Response.json({ error: "Funcionário não encontrado" }, { status: 404 });

// O funcionário precisa ser deste cardápio
async function ownsStaff(menuId, userId) {
  const { data } = await supabaseAdmin
    .from("menu_staff")
    .select("user_id")
    .eq("menu_id", menuId)
    .eq("user_id", userId ?? "")
    .maybeSingle();
  return !!data;
}

// Com um único entregador, as entregas em aberto sem entregador vão pra ele
// (pedidos novos o trigger assign_sole_courier já atribui no banco)
async function assignToSoleCourier(menuId) {
  const { data: couriers } = await supabaseAdmin
    .from("menu_staff")
    .select("user_id")
    .eq("menu_id", menuId)
    .eq("role", "entregador");
  if (couriers?.length !== 1) return;

  await supabaseAdmin
    .from("orders")
    .update({ assigned_to: couriers[0].user_id })
    .eq("menu_id", menuId)
    .eq("service", "delivery")
    .is("assigned_to", null)
    .neq("status", "delivered");
}

export async function GET(req) {
  const owner = await getOwner(req);
  if (!owner) return unauthorized();

  const { data, error } = await supabaseAdmin
    .from("menu_staff")
    .select("user_id, name, role, login")
    .eq("menu_id", owner.menu.id)
    .order("created_at", { ascending: true });
  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json(data);
}

export async function POST(req) {
  const owner = await getOwner(req);
  if (!owner) return unauthorized();
  if (!owner.canCreate) return Response.json({ error: "Disponível no plano Business" }, { status: 403 });

  const { name, role, password } = await req.json().catch(() => ({}));
  const cleanName = String(name ?? "").trim().slice(0, 40);
  const login = staffLogin(cleanName, owner.menu.slug);

  if (!cleanName || login.startsWith(".")) return Response.json({ error: "Informe um nome válido" }, { status: 400 });
  if (!STAFF_ROLES[role]) return Response.json({ error: "Função inválida" }, { status: 400 });
  if (String(password ?? "").length < 6) {
    return Response.json({ error: "A senha precisa ter pelo menos 6 caracteres" }, { status: 400 });
  }

  const { data: created, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: staffEmail(login),
    password,
    email_confirm: true,
    user_metadata: { staff: true },
  });
  if (authError) {
    const taken = /already/i.test(authError.message);
    return Response.json(
      { error: taken ? `Já existe o usuário "${login}". Use outro nome.` : authError.message },
      { status: taken ? 409 : 500 },
    );
  }

  const row = { user_id: created.user.id, menu_id: owner.menu.id, name: cleanName, role, login };
  const { error } = await supabaseAdmin.from("menu_staff").insert(row);
  if (error) {
    await supabaseAdmin.auth.admin.deleteUser(created.user.id); // sem vínculo o login não serve pra nada
    return Response.json({ error: error.message }, { status: 500 });
  }

  if (role === "entregador") await assignToSoleCourier(owner.menu.id);

  return Response.json(row);
}

// Nova senha
export async function PATCH(req) {
  const owner = await getOwner(req);
  if (!owner) return unauthorized();

  const { user_id, password } = await req.json().catch(() => ({}));
  if (String(password ?? "").length < 6) {
    return Response.json({ error: "A senha precisa ter pelo menos 6 caracteres" }, { status: 400 });
  }
  if (!(await ownsStaff(owner.menu.id, user_id))) return notFound();

  const { error } = await supabaseAdmin.auth.admin.updateUserById(user_id, { password });
  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({ ok: true });
}

// Remove o login (o vínculo em menu_staff sai junto pelo on delete cascade)
export async function DELETE(req) {
  const owner = await getOwner(req);
  if (!owner) return unauthorized();

  const { user_id } = await req.json().catch(() => ({}));
  if (!(await ownsStaff(owner.menu.id, user_id))) return notFound();

  const { error } = await supabaseAdmin.auth.admin.deleteUser(user_id);
  if (error) return Response.json({ error: error.message }, { status: 500 });

  // as entregas do removido ficaram sem entregador; se sobrou um só, vão pra ele
  await assignToSoleCourier(owner.menu.id);

  return Response.json({ ok: true });
}
