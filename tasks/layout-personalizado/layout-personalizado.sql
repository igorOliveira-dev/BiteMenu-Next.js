-- Layout personalizado do cardápio (tasks/layout-personalizado/layout-personalizado-plan.md)
-- Rodar à mão no SQL Editor ANTES de alguém publicar um layout personalizado. Pode rodar de novo (if not exists).
-- Sem a coluna o cardápio NÃO quebra: getCustomLayout (getMenuData.js) só é chamado com layout = 'custom' e,
-- se falhar, o cardápio cai no layout padrão.

-- null = nunca montou. Só a versão publicada fica aqui; o rascunho fica na aba até "Publicar".
-- Salvo pelo client do dono, com o RLS de update que menus já tem. A segurança está na renderização
-- (cleanLayout em src/lib/customLayout.js), não aqui: o dono pode gravar qualquer JSON pela API.
alter table public.menus
  add column if not exists custom_layout jsonb
  check (custom_layout is null or length(custom_layout::text) <= 200000);

-- menus.layout passa a aceitar 'custom'. Se existir um check/enum restringindo os valores, conferir com:
--   select conname, pg_get_constraintdef(oid) from pg_constraint where conrelid = 'public.menus'::regclass and contype = 'c';
-- e incluir 'custom' na lista. (No repositório não há check para essa coluna.)
