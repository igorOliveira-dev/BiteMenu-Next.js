-- Conta de cliente não cria cardápio. A tela já redireciona, mas o navegador consegue inserir em
-- menus direto pelo DevTools; o trigger fecha isso no banco. Rodar DEPOIS de account-type.sql.

begin;

-- security definer: lê profiles mesmo com RLS; search_path fixo para não ser sequestrado
create or replace function public.bm_block_customer_menu()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (select 1 from profiles where id = new.owner_id and account_type = 'customer') then
    raise exception 'Conta de cliente não pode criar cardápio' using errcode = '42501';
  end if;
  return new;
end $$;

drop trigger if exists bm_block_customer_menu on public.menus;
create trigger bm_block_customer_menu
  before insert or update of owner_id on public.menus
  for each row execute function public.bm_block_customer_menu();

commit;

-- Teste (troque o uuid por um cliente real; deve falhar com "Conta de cliente não pode criar cardápio"):
-- insert into public.menus (owner_id, title, slug) values ('<uuid-do-cliente>', 'teste', 'teste-bloqueio');
