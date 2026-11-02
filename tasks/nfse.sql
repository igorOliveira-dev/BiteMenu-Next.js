-- NFS-e automática (Focus NFe) — rodar uma vez no SQL Editor do Supabase.
-- Uma linha por fatura paga na ValidaPay. numero_dps é o número da DPS (série 1, faixa da API).
-- RLS ligado e sem policies: só o service role (rota /api/cron/nfse) lê e escreve.
-- status: pendente | processando_autorizacao | autorizado | erro_autorizacao | rejeitada | cancelado

create table if not exists nfse (
  numero_dps bigint generated always as identity primary key,
  invoice_id text not null unique,
  subscription_id text not null,
  payload jsonb,
  status text not null default 'pendente',
  erro text,
  url_danfse text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table nfse enable row level security;

-- Agendamento diário (11h de Brasília). Só ative depois de testar em homologação.
-- Troque <CRON_SECRET> pelo valor do Coolify antes de rodar.
-- select cron.schedule(
--   'nfse',
--   '0 14 * * *',
--   $$ select net.http_post(
--        url := 'https://www.bitemenu.com.br/api/cron/nfse',
--        headers := '{"Content-Type":"application/json","Authorization":"Bearer <CRON_SECRET>"}'::jsonb,
--        body := '{"mode":"send"}'::jsonb,
--        timeout_milliseconds := 300000
--      ) $$
-- );
