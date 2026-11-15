-- Autorização de depoimentos (popup no dashboard: TestimonialConsentModal).
-- Rodar MANUALMENTE no SQL Editor do Supabase, na ordem dos passos.

-- ============================================================
-- PASSO 1 — Tabela + RLS + trigger (rodar uma vez)
-- ============================================================
create table if not exists public.testimonial_consents (
  id uuid primary key default gen_random_uuid(),
  -- set null: se a conta for excluída, a prova continua (email fica salvo abaixo)
  user_id uuid references auth.users(id) on delete set null,
  quote text not null,                 -- texto EXATO que será publicado (o que o cliente vê no popup)
  choice text check (choice in ('anonimo', 'com_nome', 'nao_autorizado')),
  display_name text,                   -- só quando choice = 'com_nome'
  establishment_name text,             -- só quando choice = 'com_nome'
  consent_text text,                   -- texto do termo exibido no momento do aceite
  user_agent text,
  email text,                          -- preenchido pelo trigger no momento da resposta
  created_at timestamptz not null default now(),
  answered_at timestamptz              -- preenchido pelo trigger (hora do servidor)
);

alter table public.testimonial_consents enable row level security;

-- dono vê só o próprio pedido
drop policy if exists "testimonial_consents_select_own" on public.testimonial_consents;
create policy "testimonial_consents_select_own" on public.testimonial_consents
  for select using (user_id = auth.uid());

-- dono responde UMA vez (só enquanto choice é null). Sem insert/delete para o cliente.
drop policy if exists "testimonial_consents_answer_once" on public.testimonial_consents;
create policy "testimonial_consents_answer_once" on public.testimonial_consents
  for update using (user_id = auth.uid() and choice is null)
  with check (user_id = auth.uid() and choice is not null);

-- trava o que o cliente não pode mudar e grava hora/email pelo servidor
create or replace function public.testimonial_consents_lock()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  new.id := old.id;
  new.user_id := old.user_id;
  new.quote := old.quote;
  new.created_at := old.created_at;
  new.answered_at := now();
  new.email := (select email from auth.users where id = old.user_id);
  if new.choice <> 'com_nome' then
    new.display_name := null;
    new.establishment_name := null;
  end if;
  return new;
end $$;

drop trigger if exists testimonial_consents_lock on public.testimonial_consents;
create trigger testimonial_consents_lock before update on public.testimonial_consents
  for each row execute function public.testimonial_consents_lock();


-- ============================================================
-- PASSO 2 — Descobrir quem escreveu cada depoimento (conferir antes do passo 3)
-- ============================================================
select s.user_id, u.email, p.display_name, p.role, m.title as estabelecimento, m.slug,
       s.created_at, s.missing_feature
from public.profile_surveys s
join auth.users u on u.id = s.user_id
left join public.profiles p on p.id = s.user_id
left join public.menus m on m.owner_id = s.user_id
where s.missing_feature ilike any (array['%sonhando grande%', '%impressionad%', '%relat_rio%'])
order by s.created_at;


-- ============================================================
-- PASSO 3 — Criar os pedidos de autorização (o popup aparece sozinho pra eles)
-- IDs já conferidos em 15/11/2026 (Bandeira's Cocina, Pizzamn, Açai Top Secret).
-- O texto em "quote" é o que vai pro post: o cliente autoriza ESTA versão.
-- ============================================================
insert into public.testimonial_consents (user_id, quote) values
  ('a5feac65-22fb-42d1-ba6d-fa2f11066e11',
   'Muito obrigado por proporcionar esse mecanismo a pessoas como eu, que estão começando pequeno mas sonhando grande.'),
  ('efcf8e31-ebf8-42a2-8a76-dcb1088c7d44',
   'Tinha umas 4 sugestões. Enviei ao suporte e foram feitas em UM dia. Fiquei impressionado.'),
  ('e532d2f7-48c8-4d15-a1fc-f1f514d746b1',
   'Sentia falta do relatório, mas já disponibilizaram… estou amando a plataforma.');


-- ============================================================
-- PASSO 4 — Acompanhar / comprovar autorizações
-- ============================================================
select quote, choice, display_name, establishment_name, email,
       answered_at, user_agent, consent_text, user_id
from public.testimonial_consents
order by created_at;
