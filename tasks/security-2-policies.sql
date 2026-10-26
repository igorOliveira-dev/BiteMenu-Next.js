-- Parte 2 (fecha os vazamentos): rodar SÓ DEPOIS do deploy do código novo
-- (o cardápio público passou a ler profiles com service role no servidor).
-- Remove apenas as policies perigosas; as demais (dono, equipe, caixa, admin, designer) continuam.
-- Tudo numa transação: se algo falhar, nada muda.

begin;

-- Trava de segurança: se um trigger de orders roda sem security definer e lê orders/profiles,
-- ele dependia do vazamento (o cliente anônimo deixaria de enxergar as linhas). Aborta para revisar.
do $$
begin
  if exists (
    select 1 from pg_proc
    where proname in ('set_order_number', 'assign_sole_courier')
      and not prosecdef
      and prosrc ~* 'from\s+(public\.)?(orders|profiles)\M'
  ) then
    raise exception 'Trigger de orders lê orders/profiles sem security definer: revisar antes de aplicar';
  end if;
end $$;

-- ── orders ──────────────────────────────────────────────────────────────────
-- "id = id" é sempre verdadeiro: qualquer visitante lia todos os pedidos (nome, telefone, endereço)
drop policy "Allow read by id" on public.orders;

-- Cliente continua criando pedido, mas só não pago e para um cardápio que existe
-- (marcar pago é do painel ou do webhook, com service role)
drop policy "insert all" on public.orders;
create policy orders_insert_customers on public.orders
  for insert to anon, authenticated
  with check (is_paid is not true and exists (select 1 from public.menus m where m.id = menu_id));

-- ── profiles ────────────────────────────────────────────────────────────────
-- "using true" expunha e-mail, telefone e assinatura de todos os donos
drop policy select_all_profile on public.profiles;

-- Cada um lê o próprio perfil; admin e designer leem todos (páginas /admin).
-- ("designer le perfis" já existe e continua)
create policy profiles_select_own on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.bm_is_admin_or_designer());

-- Colunas: update_own_profile/insert_own_profile deixavam o usuário gravar role, plano e assinatura
-- (virar Business ou admin pelo DevTools). Agora o navegador só grava o que o app grava;
-- o resto fica com o servidor (service role ignora estes grants).
revoke insert, update, delete on public.profiles from anon, authenticated;
grant insert (id, email, display_name, phone, privacy_accepted_at, privacy_policy_version, acquisition_source)
  on public.profiles to authenticated;
grant update (display_name, phone, privacy_accepted_at, privacy_policy_version, acquisition_source)
  on public.profiles to authenticated;

commit;
