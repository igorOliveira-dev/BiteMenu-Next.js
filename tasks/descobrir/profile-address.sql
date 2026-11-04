-- Endereço do cliente na conta (antes ficava só no aparelho e sumia ao limpar o cache).
-- Rodar no SQL Editor do Supabase ANTES de publicar: sem a coluna, salvar o endereço na conta falha
-- (o endereço continua salvo no aparelho, então nada quebra para o cliente).
-- Formato igual ao menus.address_details: { cep, street, number, complement, neighborhood, city, state }

begin;

alter table public.profiles add column if not exists address_details jsonb;

-- O navegador só grava colunas liberadas (security-2-policies.sql); o próprio usuário, pela policy de update que já existe
grant update (address_details) on public.profiles to authenticated;

commit;

-- Conferência:
-- select count(*) filter (where address_details is not null) as com_endereco, count(*) from public.profiles;
