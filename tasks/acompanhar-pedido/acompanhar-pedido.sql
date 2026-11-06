-- Acompanhar pedido pelo link do WhatsApp (/pedido/<id>). Ver tasks/README.md.
-- Rodar no SQL Editor do Supabase ANTES de publicar o código. Sem ele: o link mostra "não foi possível abrir",
-- finalizar pedido grava a venda sem order_id (como antes) e /conta mostra só os pedidos em aberto + os do aparelho.

begin;

-- A venda guarda o id do pedido de origem (finalizar apaga o pedido): o link continua abrindo depois de finalizado
-- e /conta junta pedido e venda sem repetir. Sem FK: o pedido some de orders ao finalizar.
alter table public.sales
  add column if not exists order_id uuid;

create index if not exists sales_order_id_idx
  on public.sales (order_id)
  where order_id is not null;

-- Para onde o link leva quem está logado:
--   'owner' / 'owner_sale' -> dono do cardápio (pedido em aberto / já finalizado)
--   'staff'                -> equipe do cardápio
--   'customer'             -> cliente dono do pedido (vincula à conta se o pedido foi feito sem login)
--   'not_found' / 'forbidden'
-- Vincular: só conta de cliente, só pedido sem dono e só nos 2 primeiros dias. O id é uuid aleatório (122 bits),
-- então ter o link já prova que a pessoa recebeu a mensagem; a janela curta limita link encaminhado depois.
create or replace function public.open_order_link(p_order_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_menu uuid;
  v_customer uuid;
  v_created timestamptz;
  v_is_sale boolean := false;
begin
  if v_uid is null then
    return 'forbidden';
  end if;

  select o.menu_id, o.customer_id, o.created_at
    into v_menu, v_customer, v_created
    from orders o
   where o.id = p_order_id;

  if not found then
    select s.menu_id, s.customer_id, s.created_at
      into v_menu, v_customer, v_created
      from sales s
     where s.order_id = p_order_id
     limit 1;
    if not found then
      return 'not_found';
    end if;
    v_is_sale := true;
  end if;

  if exists (select 1 from menus m where m.id = v_menu and m.owner_id = v_uid) then
    return case when v_is_sale then 'owner_sale' else 'owner' end;
  end if;

  if v_menu = staff_menu_id() then
    return 'staff';
  end if;

  if v_customer = v_uid then
    return 'customer';
  end if;

  if v_customer is null
     and v_created > now() - interval '2 days'
     and exists (select 1 from profiles p where p.id = v_uid and p.account_type = 'customer') then
    if v_is_sale then
      update sales set customer_id = v_uid where order_id = p_order_id and customer_id is null;
    else
      update orders set customer_id = v_uid where id = p_order_id and customer_id is null;
    end if;
    return 'customer';
  end if;

  return 'forbidden';
end;
$$;

revoke execute on function public.open_order_link(uuid) from public, anon;
grant execute on function public.open_order_link(uuid) to authenticated;

commit;

-- Conferência:
-- 1) select column_name from information_schema.columns where table_name = 'sales' and column_name = 'order_id';
-- 2) logado como cliente, num pedido recente sem customer_id: select public.open_order_link('<id>'); -> 'customer'
-- 3) se sales tiver grant por coluna para authenticated, order_id precisa entrar no insert do dono:
-- select grantee, privilege_type, column_name from information_schema.column_privileges
--   where table_name = 'sales' and column_name = 'order_id';
