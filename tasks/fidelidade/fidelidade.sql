-- Programa de fidelidade (tasks/fidelidade/fidelidade-plan.md).
-- Rodar no SQL Editor do Supabase ANTES de publicar o código: o cardápio público passa a ler menus.loyalty e,
-- sem a coluna, a consulta do cardápio falha.
-- Mexe em RLS de sales (só adiciona uma policy de leitura): revisar antes de rodar.

begin;

-- Configuração do dono: { "enabled": true, "reward": "1 pizza broto grátis", "goal": 5 }. Nulo = desligado.
alter table public.menus
  add column if not exists loyalty jsonb;

-- De quem foi a compra. O painel copia orders.customer_id ao finalizar o pedido (Orders.jsx, finalizeOrder).
-- on delete set null: cliente que exclui a conta não apaga a venda do estabelecimento
alter table public.sales
  add column if not exists customer_id uuid references auth.users (id) on delete set null;

-- Progresso = "vendas deste cliente neste cardápio": um índice que responde exatamente isso, só nas linhas de cliente
create index if not exists sales_customer_id_menu_id_idx
  on public.sales (customer_id, menu_id)
  where customer_id is not null;

-- Select: o cliente lê só as próprias vendas (as policies do dono e da equipe continuam como estão)
drop policy if exists sales_select_own_customer on public.sales;
create policy sales_select_own_customer on public.sales
  for select to authenticated
  using (customer_id = auth.uid());

commit;

-- Conferência:
-- 1) policies de sales (a do dono/equipe deve continuar; nenhuma "using true" para anon/authenticated):
-- select polname, polcmd, polroles::regrole[], pg_get_expr(polqual, polrelid) as using,
--        pg_get_expr(polwithcheck, polrelid) as check
--   from pg_policy where polrelid = 'public.sales'::regclass;
-- 2) se sales tiver grant por coluna para authenticated, a coluna nova precisa entrar no insert do dono:
-- select grantee, privilege_type, column_name from information_schema.column_privileges
--   where table_name = 'sales' and column_name = 'customer_id';
-- 3) depois de finalizar um pedido de cliente logado:
-- select count(*) filter (where customer_id is not null) as de_cliente, count(*) from public.sales;
