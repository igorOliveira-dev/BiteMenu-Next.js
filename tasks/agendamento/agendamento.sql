-- Agendamento (Business): o cliente escolhe data/hora no carrinho; vira orders.scheduled_for.
-- Rodar à mão no SQL Editor ANTES do deploy. Pode rodar de novo. Sem tabela nova: RLS de orders já cobre.
alter table public.orders add column if not exists scheduled_for timestamptz;
create index if not exists orders_menu_scheduled_idx on public.orders (menu_id, scheduled_for) where scheduled_for is not null;

-- Config do dono (Configurações > Serviços): off = não agenda; optional = cliente escolhe; required = só por agendamento.
-- schedule_min_minutes = antecedência mínima a partir de agora. Sem estas colunas a aba de config falha ao salvar só esses campos.
alter table public.menus add column if not exists schedule_mode text not null default 'off' check (schedule_mode in ('off','optional','required'));
alter table public.menus add column if not exists schedule_min_minutes integer not null default 0 check (schedule_min_minutes >= 0);
