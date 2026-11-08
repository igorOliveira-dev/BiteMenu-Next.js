-- Atendente IA no cardápio (tasks/atendente-ia/atendente-ia-plan.md)
-- Rodar à mão no SQL Editor ANTES do deploy. ATENÇÃO: o cardápio público lê menus.attendant_enabled;
-- sem a coluna, TODOS os cardápios dão erro. Pode rodar de novo sem problema (if not exists).

-- 1) Configuração do dono (aba "Atendente IA"): salva pelo client do dono, com o RLS de update que menus já tem
alter table public.menus
  add column if not exists attendant_enabled boolean not null default true,
  add column if not exists attendant_info text check (attendant_info is null or length(attendant_info) <= 2000);

-- 2) Gasto do dia por cardápio, em micro-dólares (1_000_000 = US$ 1). Só o servidor (service role) lê e escreve;
--    o dono vê pela rota /api/attendant/usage.
create table if not exists public.ai_attendant_usage (
  menu_id uuid primary key references public.menus(id) on delete cascade,
  day date not null,
  micro_usd bigint not null default 0,
  messages integer not null default 0,
  updated_at timestamptz not null default now()
);
alter table public.ai_attendant_usage add column if not exists messages integer not null default 0;

-- RLS ligado e sem policies: anon e authenticated não acessam; o service role ignora RLS
alter table public.ai_attendant_usage enable row level security;

-- Consulta útil (gasto por dia):
-- select m.slug, u.day, u.messages, round(u.micro_usd / 1e6, 4) as usd from ai_attendant_usage u join menus m on m.id = u.menu_id order by u.day desc;

-- 3) Cobrança atômica + teto mensal (proteção contra ataque com muitos IPs ao mesmo tempo).
--    Antes de chamar a IA o servidor RESERVA o custo máximo possível; depois ACERTA pelo custo real.
--    Sem reserva não há chamada, então o gasto nunca passa dos tetos, nem com mensagens simultâneas.
--    month_micro_usd soma o atendente e a landing IA (as IAs do Enterprise); micro_usd/messages são só do atendente, do dia.
alter table public.ai_attendant_usage
  add column if not exists month date,
  add column if not exists month_micro_usd bigint not null default 0;

create or replace function public.ai_attendant_reserve(
  p_menu_id uuid, p_amount bigint, p_daily_cap bigint, p_monthly_cap bigint, p_daily boolean
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  d date := (now() at time zone 'utc')::date;
  m date := date_trunc('month', now() at time zone 'utc')::date;
  r public.ai_attendant_usage;
begin
  insert into public.ai_attendant_usage (menu_id, day, month) values (p_menu_id, d, m) on conflict (menu_id) do nothing;
  select * into r from public.ai_attendant_usage where menu_id = p_menu_id for update; -- trava a linha: uma reserva por vez
  if r.day <> d then r.micro_usd := 0; r.messages := 0; end if;
  if r.month is distinct from m then r.month_micro_usd := 0; end if;
  if r.month_micro_usd + p_amount > p_monthly_cap or (p_daily and r.micro_usd + p_amount > p_daily_cap) then
    return false;
  end if;
  update public.ai_attendant_usage set
    day = d,
    month = m,
    micro_usd = r.micro_usd + case when p_daily then p_amount else 0 end,
    messages = r.messages,
    month_micro_usd = r.month_micro_usd + p_amount,
    updated_at = now()
  where menu_id = p_menu_id;
  return true;
end
$$;

-- p_delta = custo real - reservado (normalmente negativo: devolve a sobra)
create or replace function public.ai_attendant_settle(p_menu_id uuid, p_delta bigint, p_daily boolean, p_message boolean)
returns void
language sql
security definer
set search_path = public
as $$
  update public.ai_attendant_usage set
    micro_usd = greatest(0, micro_usd + case when p_daily then p_delta else 0 end),
    month_micro_usd = greatest(0, month_micro_usd + p_delta),
    messages = messages + case when p_message then 1 else 0 end,
    updated_at = now()
  where menu_id = p_menu_id;
$$;

-- security definer: só o servidor (service role) pode chamar; sem isto qualquer visitante chamaria pela API
revoke execute on function public.ai_attendant_reserve(uuid, bigint, bigint, bigint, boolean) from public, anon, authenticated;
revoke execute on function public.ai_attendant_settle(uuid, bigint, boolean, boolean) from public, anon, authenticated;
grant execute on function public.ai_attendant_reserve(uuid, bigint, bigint, bigint, boolean) to service_role;
grant execute on function public.ai_attendant_settle(uuid, bigint, boolean, boolean) to service_role;
