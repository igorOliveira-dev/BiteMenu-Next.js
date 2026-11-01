-- Parte 1 (só adiciona funções, não muda nenhum acesso): rodar ANTES do deploy do código.
-- Não mexe em is_admin()/is_designer() existentes (usadas por várias policies).
-- security definer + search_path fixo: leem o necessário sem abrir as tabelas.

-- Admin ou designer? (usada na policy de select de profiles; definer evita recursão de RLS)
create or replace function public.bm_is_admin_or_designer()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'designer'))
$$;

-- Plano do dono, só para o próprio dono ou para a equipe do cardápio dele (useOwnerRole)
create or replace function public.menu_owner_role(p_owner_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select p.role
  from profiles p
  where p.id = p_owner_id
    and (
      p_owner_id = auth.uid()
      or exists (select 1 from menus m where m.owner_id = p_owner_id and m.id = staff_menu_id())
    )
$$;

-- Cadastro: telefone já usado? (antes o /register lia a tabela profiles inteira)
create or replace function public.phone_in_use(p_phone text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from profiles where phone = p_phone)
$$;

revoke execute on function public.bm_is_admin_or_designer() from public, anon;
revoke execute on function public.menu_owner_role(uuid) from public, anon;
grant execute on function public.bm_is_admin_or_designer() to authenticated;
grant execute on function public.menu_owner_role(uuid) to authenticated;
grant execute on function public.phone_in_use(text) to anon, authenticated;
