-- CEP do cliente, pedido no cadastro. Rodar no SQL Editor do Supabase ANTES de publicar o cadastro com CEP:
-- sem a coluna, o cadastro de cliente falha (o de dono não envia cep e não é afetado).

begin;

alter table public.profiles add column if not exists cep text;

-- O navegador só grava colunas liberadas (security-2-policies.sql)
grant insert (cep), update (cep) on public.profiles to authenticated;

commit;
