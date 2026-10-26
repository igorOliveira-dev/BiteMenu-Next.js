-- Resumo da aba Pedidos calculado no banco (substitui baixar todos os pedidos com items_list).
-- Rodar no SQL Editor do Supabase ANTES do deploy que usa rpc("orders_summary").
-- security invoker: respeita o RLS de orders (dono e equipe veem o mesmo que antes).

-- Number(x) || 0 do JS: texto numérico vira número, o resto vira 0
create or replace function public.bm_num(v text)
returns numeric
language sql
immutable
as $$
  select case
    when btrim(v) ~ '^-?(\d+\.?\d*|\.\d+)$' then btrim(v)::numeric
    else 0
  end
$$;

create or replace function public.orders_summary(
  p_menu_id orders.menu_id%type,
  p_is_paid boolean default null,
  p_service text default null,
  p_payment text default null,
  p_table_only boolean default false,
  p_status text default null,
  p_date_from timestamptz default null,
  p_date_to timestamptz default null,
  p_search text default null
)
returns table (
  count bigint,
  paid_count bigint,
  pending_count bigint,
  paid_total numeric,
  pending_total numeric,
  last_updated_at timestamptz
)
language sql
stable
security invoker
set search_path = public
as $$
  with o as (
    select
      ord.is_paid,
      ord.updated_at,
      case when ord.service::text = 'delivery' then bm_num(ord.delivery_fee::text) else 0 end as fee,
      bm_num(ord.discount::text) as discount,
      coalesce((
        select sum(
          (bm_num(it->>'price') + coalesce((
            select sum(bm_num(a->>'price'))
            from jsonb_array_elements(
              case when jsonb_typeof(it->'additionals') = 'array' then it->'additionals' else '[]'::jsonb end
            ) a
          ), 0)) * bm_num(it->>'qty')
        )
        from jsonb_array_elements(
          case when jsonb_typeof(ord.items_list::jsonb) = 'array' then ord.items_list::jsonb else '[]'::jsonb end
        ) it
      ), 0) as subtotal
    from orders ord
    where ord.menu_id = p_menu_id
      -- oculta pedidos Stripe enquanto não pagos (mesmo filtro do app)
      and (ord.payment_method::text <> 'stripe' or ord.is_paid = true)
      and (p_is_paid is null or ord.is_paid = p_is_paid)
      and (p_service is null or ord.service::text = p_service)
      and (p_payment is null or ord.payment_method::text = p_payment)
      and (not p_table_only or ord.table_id is not null)
      and (p_status is null or ord.status::text = p_status)
      and (p_date_from is null or ord.created_at >= p_date_from)
      and (p_date_to is null or ord.created_at <= p_date_to)
      and (
        p_search is null
        or ord.costumer_name ilike '%' || p_search || '%'
        or ord.costumer_phone ilike '%' || p_search || '%'
        or ord.id_text ilike p_search || '%'
      )
  ),
  t as (
    select is_paid, updated_at, subtotal - least(discount, subtotal) + fee as total from o
  )
  select
    count(*),
    count(*) filter (where is_paid is true),
    count(*) filter (where is_paid is not true),
    coalesce(sum(total) filter (where is_paid is true), 0),
    coalesce(sum(total) filter (where is_paid is not true), 0),
    max(updated_at)
  from t
$$;

-- Índice para o resumo, a lista paginada e a contagem de novos pedidos (polling de 30s).
-- Se já existir um índice começando por menu_id em orders, pode pular.
create index if not exists orders_menu_id_updated_at_idx on public.orders (menu_id, updated_at desc);
