-- Landing page gerada por IA (tasks/landing-ia/landing-ia-plan.md)
-- Rodar à mão no SQL Editor. null = sem landing; só a versão publicada fica aqui.
alter table public.menus
  add column if not exists landing_html text
  check (landing_html is null or length(landing_html) <= 300000);
