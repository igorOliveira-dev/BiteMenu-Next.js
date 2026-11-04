-- Descobrir estabelecimentos: coordenadas da loja e opção do dono de aparecer na lista.
-- Rodar no SQL Editor do Supabase ANTES de publicar a tela /descobrir (a rota e o painel leem estas colunas).
-- menus não tem grant por coluna (só profiles tem, em security-2-policies.sql): o dono já consegue gravar as novas.

begin;

alter table public.menus
  add column if not exists lat double precision,
  add column if not exists lng double precision,
  -- todos aparecem por padrão; o dono desliga no painel
  add column if not exists discoverable boolean not null default true;

commit;

-- Conferência: todas as linhas devem vir com discoverable = true e lat/lng vazios até o backfill
-- select discoverable, count(*) filter (where lat is null) as sem_coordenada, count(*) from public.menus group by 1;
