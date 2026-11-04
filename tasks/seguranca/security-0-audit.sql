-- Diagnóstico (só leitura): rodar no SQL Editor e mandar o resultado para revisão
-- antes do security-2-policies.sql. Mostra policies, RLS, triggers e funções usadas nas policies.
select 'policy' as kind,
       tablename::text as obj,
       policyname || ' | ' || cmd || ' | ' || array_to_string(roles, ',') ||
       ' | using: ' || coalesce(qual, '-') || ' | check: ' || coalesce(with_check, '-') as detail
from pg_policies
where schemaname = 'public'

union all
select 'rls', c.relname::text, case when c.relrowsecurity then 'on' else 'OFF' end
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r'

union all
select 'trigger', t.tgrelid::regclass::text, pg_get_triggerdef(t.oid)
from pg_trigger t
where not t.tgisinternal
  and t.tgrelid::regclass::text in ('profiles', 'orders', 'menus', 'public.profiles', 'public.orders', 'public.menus')

union all
select 'function', p.proname::text, pg_get_functiondef(p.oid)
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in ('staff_menu_id', 'consume_stock', 'use_coupon', 'get_coupon')

order by 1, 2;
