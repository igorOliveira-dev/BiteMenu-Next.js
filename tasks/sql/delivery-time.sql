-- Tempo médio de entrega (texto livre, ex.: "30 a 45 min"), definido em Configurações > Serviços
-- e mostrado ao cliente no carrinho quando escolhe entrega.
alter table public.menus add column if not exists delivery_time text;
