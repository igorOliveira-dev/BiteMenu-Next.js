-- Suporte a cancelamento com acesso até o fim do período pago,
-- e downgrade agendado pra próxima renovação.
-- Rode manualmente no SQL editor do Supabase (projeto não está linkado ao CLI).

alter table profiles
  add column if not exists cancel_at_period_end boolean not null default false;

alter table profiles
  add column if not exists scheduled_downgrade_price_id text;
