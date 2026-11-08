-- Descobrir abre a landing ou o cardápio (tasks/landing-ia/landing-descobrir-plan.md)
-- Rodar à mão no SQL Editor ANTES do deploy: a rota /api/descobrir passa a ler esta coluna.
alter table public.menus
  add column if not exists discover_landing boolean not null default false;
