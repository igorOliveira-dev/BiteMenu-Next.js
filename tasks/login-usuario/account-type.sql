-- Tipo de conta: dono de estabelecimento ou cliente comum.
-- Coluna separada de "role", que guarda o plano e é escrita pelo webhook do ValidaPay.
-- Contas existentes ficam como 'owner' pelo default. Rodar no SQL Editor do Supabase.

begin;

alter table public.profiles
  add column if not exists account_type text not null default 'owner'
  check (account_type in ('owner', 'customer'));

-- O navegador só grava colunas liberadas (security-2-policies.sql). Libera só no insert, no cadastro;
-- sem update, para ninguém trocar o tipo depois pelo DevTools.
grant insert (account_type) on public.profiles to authenticated;

commit;

-- Conferência: todas as contas atuais devem aparecer como 'owner'
-- select account_type, count(*) from public.profiles group by 1;
