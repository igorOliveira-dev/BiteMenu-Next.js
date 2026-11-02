-- Lembrete de boleto 1 dia antes do vencimento — rodar uma vez no SQL Editor do Supabase.
-- Diário às 10h de Brasília. Troque <CRON_SECRET> pelo valor do Coolify antes de rodar.
select cron.schedule(
  'boleto-reminder',
  '0 13 * * *',
  $$ select net.http_post(
       url := 'https://www.bitemenu.com.br/api/cron/boleto-reminder',
       headers := '{"Content-Type":"application/json","Authorization":"Bearer <CRON_SECRET>"}'::jsonb,
       body := '{"mode":"send"}'::jsonb,
       timeout_milliseconds := 300000
     ) $$
);
