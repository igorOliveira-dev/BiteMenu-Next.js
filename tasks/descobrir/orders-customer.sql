-- Histórico de pedidos do cliente no banco: em vez de copiar o pedido, marca de quem ele é.
-- 1 coluna uuid (16 bytes, só nos pedidos de cliente logado) + índice parcial (só indexa essas linhas).
-- Rodar no SQL Editor do Supabase ANTES de publicar o código. Se o código subir antes, o carrinho tenta de novo
-- sem customer_id e o pedido não se perde (só não entra no histórico).

begin;

-- on delete set null: cliente que exclui a conta não apaga o pedido do estabelecimento
alter table public.orders
  add column if not exists customer_id uuid references auth.users (id) on delete set null;

-- histórico = "pedidos deste cliente, do mais novo pro mais antigo": um índice que responde exatamente isso
create index if not exists orders_customer_id_created_at_idx
  on public.orders (customer_id, created_at desc)
  where customer_id is not null;

-- Insert: mesma regra de antes (security-2-policies.sql) + ninguém grava pedido no nome de outro cliente.
-- Visitante (anon) tem auth.uid() nulo, então só consegue mandar customer_id vazio.
drop policy if exists orders_insert_customers on public.orders;
create policy orders_insert_customers on public.orders
  for insert to anon, authenticated
  with check (
    is_paid is not true
    and exists (select 1 from public.menus m where m.id = menu_id)
    and (customer_id is null or customer_id = auth.uid())
  );

-- Select: o cliente lê só os próprios pedidos (as policies do dono e da equipe continuam como estão)
drop policy if exists orders_select_own_customer on public.orders;
create policy orders_select_own_customer on public.orders
  for select to authenticated
  using (customer_id = auth.uid());

commit;

-- Conferência:
-- select polname, pg_get_expr(polqual, polrelid) as using, pg_get_expr(polwithcheck, polrelid) as check
--   from pg_policy where polrelid = 'public.orders'::regclass;
-- select count(*) filter (where customer_id is not null) as de_cliente, count(*) from public.orders;
