-- Linktree do estabelecimento (tasks/linktree/linktree-plan.md)
-- Rodar à mão no SQL Editor ANTES do deploy. Pode rodar de novo (if not exists).

-- null = nunca montou. Salvo pelo client do dono, com a policy de update que menus já tem.
-- A segurança está na renderização (cleanLinktree em src/lib/linktree.js): o dono pode gravar qualquer JSON pela API.
-- Sem esta coluna, só /links/[slug] falha: o cardápio não lê esta coluna.
alter table public.menus
  add column if not exists linktree jsonb
  -- 50 mil: o máximo do cleanLinktree (30 links com URL de 500 e nome de 60) passa de 20 mil no texto do jsonb
  check (linktree is null or length(linktree::text) <= 50000);

-- "No Descobrir, abrir primeiro: Links". Sem esta coluna o /api/descobrir QUEBRA (lê discover_links no select).
alter table public.menus
  add column if not exists discover_links boolean not null default false;
