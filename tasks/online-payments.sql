-- Pagamento online (Pix via subconta ValidaPay, 5% para a plataforma).
-- Rodar no Supabase ANTES do deploy: o cardápio público seleciona menus.online_payment_enabled.

alter table menus add column if not exists online_payment_form_id text;   -- proposta da subconta enviada
alter table menus add column if not exists online_payment_account text;   -- accountNumber da subconta (CONFIRMED)
alter table menus add column if not exists online_payment_enabled boolean not null default false;

alter table orders add column if not exists online_charge_id text unique; -- idempotência webhook + polling

-- Pedido aguardando o Pix. Só o servidor (service role) lê e escreve: RLS ligado e sem policies.
create table if not exists online_payments (
  charge_id text primary key,
  menu_id uuid not null references menus(id) on delete cascade,
  payload jsonb not null,
  amount numeric not null,
  created_at timestamptz default now()
);
alter table online_payments enable row level security;

-- Se menus tiver grant por coluna para anon, liberar a leitura do flag:
-- grant select (online_payment_enabled) on menus to anon, authenticated;
