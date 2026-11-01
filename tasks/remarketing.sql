-- Remarketing por e-mail (trilhas A, B e C) — rodar uma vez no SQL Editor do Supabase.
-- Tudo começa PAUSADO: nada é enviado até despausar no /admin/remarketing.
-- As tabelas ficam com RLS ligado e sem policies: só o service role (rotas da API) lê e escreve.

-- Configuração geral (uma linha só)
create table if not exists marketing_settings (
  id int primary key default 1 check (id = 1),
  paused boolean not null default true,
  daily_limit int not null default 60,      -- teto de e-mails de remarketing por dia (o Resend tem 100/dia no total)
  min_gap_days int not null default 7,      -- intervalo mínimo entre dois e-mails de marketing pra mesma pessoa
  control_percent int not null default 10,  -- % do público que nunca recebe (grupo de controle)
  updated_at timestamptz not null default now()
);
insert into marketing_settings (id) values (1) on conflict (id) do nothing;

-- Trilhas: pausa, limite diário e condições de entrada
create table if not exists marketing_tracks (
  id text primary key check (id in ('A', 'B', 'C')),
  paused boolean not null default true,
  daily_limit int not null default 30,
  conditions jsonb not null default '{}',
  updated_at timestamptz not null default now()
);
insert into marketing_tracks (id, daily_limit, conditions) values
  ('A', 30, '{"roles":["free"],"signup_max_days":30,"include_no_menu":true,"include_empty_menu":true}'),
  ('B', 40, '{"roles":["free"],"inactive_min_days":21,"inactive_max_days":150,"no_orders_days":30,"min_items":1}'),
  ('C', 25, '{"roles":["free"],"inactive_min_days":150,"no_orders_days":30,"interval_days":60,"max_unopened":3}')
on conflict (id) do nothing;

-- E-mails de cada trilha (conteúdo editável no painel)
-- delay_days: A = dias desde o cadastro, B = dias sem acessar o painel, C = não usa (segue position + interval_days)
create table if not exists marketing_steps (
  id uuid primary key default gen_random_uuid(),
  track text not null references marketing_tracks (id),
  name text not null,
  position int not null default 0,
  delay_days int,
  subject text not null default '',
  preview text not null default '',
  title text not null default '',
  body text not null default '',
  cta_label text not null default '',
  cta_path text not null default '/dashboard',
  active boolean not null default true,
  version int not null default 1,
  valid_from date,
  valid_until date,
  updated_at timestamptz not null default now()
);

-- Histórico de envios (inclui o grupo de controle, com is_control = true e sem e-mail enviado)
create table if not exists marketing_emails (
  id bigint generated always as identity primary key,
  profile_id uuid not null references profiles (id) on delete cascade,
  track text not null,
  step_id uuid not null references marketing_steps (id),
  step_version int not null,
  cycle text not null,
  is_control boolean not null default false,
  resend_id text,
  sent_at timestamptz not null default now(),
  opened_at timestamptz,
  clicked_at timestamptz,
  bounced_at timestamptz,
  complained_at timestamptz,
  unique (profile_id, step_id, cycle)
);
create index if not exists marketing_emails_resend_id_idx on marketing_emails (resend_id);
create index if not exists marketing_emails_sent_at_idx on marketing_emails (sent_at);

-- Descadastro (null = recebe)
alter table profiles add column if not exists marketing_opt_out_at timestamptz;

alter table marketing_settings enable row level security;
alter table marketing_tracks enable row level security;
alter table marketing_steps enable row level security;
alter table marketing_emails enable row level security;

-- Rascunhos iniciais (revise no painel antes de despausar)
insert into marketing_steps (track, name, position, delay_days, subject, preview, title, body, cta_label, cta_path) values
('A', 'A1 · 10 minutos', 1, 1,
 'Seu cardápio fica pronto em 10 minutos',
 'Três passos e seu restaurante já está online.',
 'Seu cardápio digital em 10 minutos',
 $$Você criou sua conta no Bite Menu. Agora falta pouco para seus clientes verem seu cardápio e pedirem direto pelo celular.

São só três passos:
**1.** Coloque o nome e a logo do restaurante
**2.** Crie as categorias (Lanches, Bebidas, Sobremesas...)
**3.** Cadastre os itens com preço e foto

Dá para fazer tudo pelo celular, sem precisar de ninguém.$$,
 'Montar meu cardápio', '/dashboard'),

('A', 'A2 · 5 mais vendidos', 2, 4,
 'Comece só pelos 5 que mais vendem',
 'Não precisa cadastrar tudo hoje.',
 'Comece pelos 5 que mais vendem',
 $$Muita gente trava achando que precisa cadastrar o cardápio inteiro de uma vez. Não precisa.

Comece pelos **5 itens que mais vendem**. Um cardápio pequeno, com foto e preço certinho, já passa uma imagem muito mais profissional que uma lista no WhatsApp.

Depois você completa com calma.$$,
 'Adicionar meus itens', '/dashboard'),

('A', 'A3 · Cardápio profissional', 3, 10,
 'Como fica um cardápio profissional',
 'Link próprio, sua marca e pedidos organizados.',
 'Seu restaurante com cara de profissional',
 $$Cliente que vê um cardápio organizado, com fotos e a marca do restaurante, confia mais e pede mais.

Com o Bite Menu, seu restaurante ganha:
• Um link próprio para colocar no Instagram e no WhatsApp
• Cardápio com a sua logo e as suas cores
• Pedidos chegando organizados, sem anotar nada no caderno

E o plano Free já faz tudo isso.$$,
 'Deixar o meu assim', '/dashboard'),

('B', 'B1 · Divulgar', 1, 21,
 'Seu cardápio está pronto. Falta seu cliente ver',
 '3 jeitos simples de divulgar o {{restaurante}}.',
 'Falta seu cliente ver',
 $$O cardápio do **{{restaurante}}** já tem {{itens}} itens e está no ar em:
{{link_cardapio}}

Agora é fazer ele chegar no cliente. Três jeitos simples:
• Coloque o link na **bio do Instagram**
• Mande no **status do WhatsApp** e na mensagem automática
• Imprima o **QR Code** e deixe nas mesas e no balcão

Leva 5 minutos e o cardápio passa a trabalhar por você.$$,
 'Ver meu cardápio', '{{link_cardapio}}'),

('B', 'B2 · Caderno', 2, 35,
 'Pare de anotar pedido no caderno',
 'Os pedidos podem chegar prontos e organizados.',
 'Pare de anotar pedido no caderno',
 $$Pedido anotado no caderno, áudio no WhatsApp, cliente perguntando o preço de novo... dá para ser bem mais simples.

No Bite Menu, o cliente escolhe no cardápio e o pedido chega **pronto na aba Pedidos**: itens, observações, endereço e forma de pagamento. Você ainda acompanha as vendas do dia e controla as mesas.

Tudo isso já está no seu plano atual, sem pagar nada.$$,
 'Abrir meus pedidos', '/dashboard?tab=orders'),

('B', 'B3 · Planos', 3, 60,
 'Profissional não precisa ser caro',
 'Menos de R$ 1 por dia para vender mais.',
 'Profissional não precisa ser caro',
 $$Um cardápio profissional não precisa custar caro nem dar trabalho.

Com o **Plus**, por **R$ 29,90/mês** (menos de R$ 1 por dia), você ganha:
• Mais itens e categorias
• Combos para aumentar o ticket
• Taxa de entrega por bairro ou por distância
• Mais opções de personalização

Dá para assinar com **Pix Automático**, sem cartão de crédito, e cancelar quando quiser.$$,
 'Conhecer os planos', '/dashboard/pricing'),

('B', 'B4 · Despedida', 4, 120,
 'Ainda quer seu cardápio no ar?',
 'Uma pergunta rápida.',
 'Uma pergunta rápida',
 $$Faz um tempo que você não aparece por aqui, e tudo bem.

O cardápio do **{{restaurante}}** continua salvo, do jeito que você deixou. Quando quiser voltar, é só entrar.

Se o Bite Menu não resolveu o que você precisava, me responde este e-mail contando o porquê. Eu leio todas as respostas.

Igor, do Bite Menu$$,
 'Voltar ao Bite Menu', '/dashboard');

insert into marketing_steps (track, name, position, subject, preview, title, body, cta_label, cta_path, valid_until) values
('C', 'C · Fim de ano 2026', 1,
 'Seu delivery pronto para o fim de ano',
 'O Bite Menu mudou bastante desde {{mes_cadastro}}.',
 'Seu delivery pronto para o fim de ano',
 $$Em {{mes_cadastro}} você criou uma conta no Bite Menu, o cardápio digital para restaurantes. Muita coisa mudou desde então.

O fim de ano é a época de mais pedidos no delivery, e dá para deixar seu cardápio pronto em 10 minutos:
• Link próprio para Instagram e WhatsApp
• Pedidos chegando organizados, sem anotar nada
• Plano Free para começar, ou planos pagos com Pix Automático, sem cartão

Sua conta continua salva. É só entrar e continuar de onde parou.$$,
 'Voltar ao Bite Menu', '/dashboard', '2026-12-20');

-- Agendamento diário (10h de Brasília). Com tudo pausado, a rota não envia nada.
-- Troque <CRON_SECRET> pelo valor do Coolify antes de rodar.
-- select cron.schedule(
--   'remarketing-emails',
--   '0 13 * * *',
--   $$ select net.http_post(
--        url := 'https://www.bitemenu.com.br/api/cron/remarketing',
--        headers := '{"Content-Type":"application/json","Authorization":"Bearer <CRON_SECRET>"}'::jsonb,
--        body := '{"mode":"send"}'::jsonb,
--        timeout_milliseconds := 300000
--      ) $$
-- );
