-- RemindMail: schema inicial no Supabase
-- Substitui as tabelas users/reminders/verification_codes do servidor Express.
-- Cadastro, login, verificação de e-mail e recuperação de senha agora são do Supabase Auth.

-- ---------------------------------------------------------------------------
-- Extensões e schema privado (não exposto pela API)
-- ---------------------------------------------------------------------------
create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create or replace function private.is_valid_timezone(tz text)
returns boolean
language sql
stable
set search_path = ''
as $$
  select exists (select 1 from pg_catalog.pg_timezone_names where name = tz);
$$;

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Perfis (dados públicos do usuário; o e-mail fica no auth.users)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null default '' check (char_length(username) <= 60),
  timezone text not null default 'America/Sao_Paulo'
    check (private.is_valid_timezone(timezone)),
  email_notifications boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'Perfil de cada usuário do RemindMail.';
comment on column public.profiles.email_notifications is 'Quando false, os lembretes vencidos são pulados sem envio.';

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function private.set_updated_at();

-- Cria o perfil automaticamente no cadastro (e-mail/senha ou Google)
create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
begin
  insert into public.profiles (id, username)
  values (
    new.id,
    left(
      btrim(coalesce(
        nullif(meta ->> 'username', ''),
        nullif(meta ->> 'full_name', ''),
        nullif(meta ->> 'name', ''),
        split_part(new.email, '@', 1),
        ''
      )),
      60
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

-- ---------------------------------------------------------------------------
-- Lembretes
-- ---------------------------------------------------------------------------
create table public.reminders (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 120),
  description text check (description is null or char_length(description) <= 1000),
  -- Horário do compromisso (com fuso: corrige o bug de 3h da versão antiga)
  remind_at timestamptz not null,
  -- Avisar com antecedência
  notify_before_minutes integer not null default 0
    check (notify_before_minutes in (0, 5, 10, 15, 30, 60, 120, 1440)),
  -- Momento real do envio = remind_at - antecedência (calculado por trigger)
  notify_at timestamptz not null,
  recurrence text not null default 'none'
    check (recurrence in ('none', 'daily', 'weekly', 'monthly', 'yearly', 'custom_weekly')),
  -- Dias da semana para 'custom_weekly' (0 = domingo ... 6 = sábado)
  recurrence_days smallint[],
  status text not null default 'scheduled'
    check (status in ('scheduled', 'sent', 'failed', 'skipped')),
  attempts smallint not null default 0,
  last_error text,
  last_sent_at timestamptz,
  send_count integer not null default 0,
  locked_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint recurrence_days_valid check (
    (recurrence = 'custom_weekly') = (
      recurrence_days is not null
      and cardinality(recurrence_days) between 1 and 7
      and recurrence_days <@ array[0, 1, 2, 3, 4, 5, 6]::smallint[]
    )
  )
);

comment on table public.reminders is 'Lembretes enviados por e-mail na hora marcada.';

create index reminders_due_idx on public.reminders (notify_at) where status = 'scheduled';
create index reminders_user_idx on public.reminders (user_id, remind_at);

-- Regras de negócio aplicadas a toda escrita
create or replace function private.reminders_before_write()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  from_user boolean := coalesce(auth.role(), '') = 'authenticated';
  schedule_changed boolean;
begin
  new.title := btrim(new.title);
  new.description := nullif(btrim(coalesce(new.description, '')), '');
  if new.recurrence <> 'custom_weekly' then
    new.recurrence_days := null;
  else
    new.recurrence_days := (select array_agg(distinct d order by d) from unnest(new.recurrence_days) d);
  end if;

  new.notify_at := new.remind_at - make_interval(mins => new.notify_before_minutes);

  if from_user then
    if tg_op = 'INSERT' then
      if (select count(*) from public.reminders where user_id = new.user_id) >= 100 then
        raise exception 'Limite de 100 lembretes por conta atingido.' using errcode = 'P0001';
      end if;
      schedule_changed := true;
    else
      schedule_changed := new.remind_at is distinct from old.remind_at
        or new.notify_before_minutes is distinct from old.notify_before_minutes
        or new.recurrence is distinct from old.recurrence
        or new.recurrence_days is distinct from old.recurrence_days;
    end if;

    if schedule_changed then
      if new.notify_at < now() - interval '1 minute' then
        raise exception 'O horário do aviso já passou. Escolha uma data futura.' using errcode = 'P0001';
      end if;
      -- Reagendou: volta a ficar pendente (equivale ao sent=false da versão antiga)
      new.status := 'scheduled';
      new.attempts := 0;
      new.last_error := null;
      new.locked_until := null;
    end if;
  end if;

  if tg_op = 'UPDATE' then
    new.updated_at := now();
  end if;
  return new;
end;
$$;

create trigger reminders_before_write
  before insert or update on public.reminders
  for each row execute function private.reminders_before_write();

-- ---------------------------------------------------------------------------
-- Permissões e RLS
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.reminders enable row level security;

revoke all on public.profiles from anon, authenticated;
revoke all on public.reminders from anon, authenticated;

grant select on public.profiles to authenticated;
grant update (username, timezone, email_notifications) on public.profiles to authenticated;

grant select, delete on public.reminders to authenticated;
grant insert (title, description, remind_at, notify_before_minutes, recurrence, recurrence_days)
  on public.reminders to authenticated;
grant update (title, description, remind_at, notify_before_minutes, recurrence, recurrence_days)
  on public.reminders to authenticated;

create policy "Ver o próprio perfil" on public.profiles
  for select to authenticated using ((select auth.uid()) = id);
create policy "Editar o próprio perfil" on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

create policy "Ver os próprios lembretes" on public.reminders
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Criar os próprios lembretes" on public.reminders
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Editar os próprios lembretes" on public.reminders
  for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Excluir os próprios lembretes" on public.reminders
  for delete to authenticated using ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- Excluir a própria conta (apaga perfil e lembretes em cascata)
-- ---------------------------------------------------------------------------
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'Não autenticado.' using errcode = '42501';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;

revoke execute on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;

-- ---------------------------------------------------------------------------
-- Recorrência (calculada no fuso do usuário)
-- ---------------------------------------------------------------------------
create or replace function private.next_occurrence(
  ts timestamptz,
  rec text,
  days smallint[],
  tz text
)
returns timestamptz
language plpgsql
stable
set search_path = ''
as $$
declare
  local_ts timestamp := ts at time zone tz;
  candidate timestamp;
  i integer;
begin
  case rec
    when 'daily' then candidate := local_ts + interval '1 day';
    when 'weekly' then candidate := local_ts + interval '7 days';
    when 'monthly' then candidate := local_ts + interval '1 month';
    when 'yearly' then candidate := local_ts + interval '1 year';
    when 'custom_weekly' then
      for i in 1..7 loop
        candidate := local_ts + make_interval(days => i);
        exit when extract(dow from candidate)::smallint = any (days);
      end loop;
    else
      return null;
  end case;
  return candidate at time zone tz;
end;
$$;

-- ---------------------------------------------------------------------------
-- Fila de envio (usada só pela Edge Function, com a service role)
-- ---------------------------------------------------------------------------
create or replace function public.claim_due_reminders(p_limit integer default 50)
returns table (
  id bigint,
  title text,
  description text,
  remind_at timestamptz,
  notify_before_minutes integer,
  recurrence text,
  recurrence_days smallint[],
  email text,
  username text,
  timezone text
)
language sql
security definer
set search_path = ''
as $$
  with due as (
    select r.id
    from public.reminders r
    where r.status = 'scheduled'
      and r.notify_at <= now()
      and (r.locked_until is null or r.locked_until < now())
    order by r.notify_at
    limit least(greatest(p_limit, 1), 100)
    for update of r skip locked
  ),
  locked as (
    update public.reminders r
    set locked_until = now() + interval '2 minutes'
    from due
    where r.id = due.id
    returning r.*
  )
  select l.id, l.title, l.description, l.remind_at, l.notify_before_minutes,
         l.recurrence, l.recurrence_days, u.email::text, p.username, p.timezone
  from locked l
  join auth.users u on u.id = l.user_id
  join public.profiles p on p.id = l.user_id;
$$;

-- p_result: 'sent' | 'failed' | 'skipped'
create or replace function public.complete_reminder(
  p_id bigint,
  p_result text,
  p_error text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  r public.reminders;
  tz text;
  nxt timestamptz;
  guard integer := 0;
begin
  if p_result not in ('sent', 'failed', 'skipped') then
    raise exception 'Resultado inválido: %', p_result;
  end if;

  select * into r from public.reminders where id = p_id for update;
  if not found then
    return;
  end if;

  if p_result = 'failed' then
    update public.reminders
    set attempts = r.attempts + 1,
        last_error = left(coalesce(p_error, 'erro desconhecido'), 500),
        -- Nova tentativa em 5, 10, 15 min; depois de 3 falhas, desiste
        locked_until = now() + make_interval(mins => 5 * (r.attempts + 1)),
        status = case when r.attempts + 1 >= 3 then 'failed' else 'scheduled' end
    where id = p_id;
    return;
  end if;

  if r.recurrence = 'none' then
    update public.reminders
    set status = case when p_result = 'sent' then 'sent' else 'skipped' end,
        last_sent_at = case when p_result = 'sent' then now() else r.last_sent_at end,
        send_count = r.send_count + case when p_result = 'sent' then 1 else 0 end,
        attempts = 0,
        last_error = null,
        locked_until = null
    where id = p_id;
    return;
  end if;

  select p.timezone into tz from public.profiles p where p.id = r.user_id;
  tz := coalesce(tz, 'America/Sao_Paulo');

  -- Avança até a próxima ocorrência FUTURA (evita rajada de e-mails atrasados)
  nxt := r.remind_at;
  loop
    nxt := private.next_occurrence(nxt, r.recurrence, r.recurrence_days, tz);
    guard := guard + 1;
    exit when nxt - make_interval(mins => r.notify_before_minutes) > now() or guard > 5000;
  end loop;

  update public.reminders
  set remind_at = nxt,
      status = 'scheduled',
      last_sent_at = case when p_result = 'sent' then now() else r.last_sent_at end,
      send_count = r.send_count + case when p_result = 'sent' then 1 else 0 end,
      attempts = 0,
      last_error = null,
      locked_until = null
  where id = p_id;
end;
$$;

revoke execute on function public.claim_due_reminders(integer) from public, anon, authenticated;
revoke execute on function public.complete_reminder(bigint, text, text) from public, anon, authenticated;
grant execute on function public.claim_due_reminders(integer) to service_role;
grant execute on function public.complete_reminder(bigint, text, text) to service_role;

-- ---------------------------------------------------------------------------
-- Agendador: roda a cada minuto DENTRO do banco e só chama a Edge Function
-- quando existe lembrete vencido (economiza a cota de invocações).
-- Precisa dos secrets 'project_url' e 'cron_secret' no Vault.
-- ---------------------------------------------------------------------------
create or replace function private.dispatch_due_reminders()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  rid bigint;
  fn_url text;
  fn_secret text;
begin
  -- Usuários que desligaram os e-mails: pula sem enviar
  for rid in
    select r.id
    from public.reminders r
    join public.profiles p on p.id = r.user_id
    where r.status = 'scheduled'
      and r.notify_at <= now()
      and not p.email_notifications
  loop
    perform public.complete_reminder(rid, 'skipped');
  end loop;

  if not exists (
    select 1 from public.reminders
    where status = 'scheduled'
      and notify_at <= now()
      and (locked_until is null or locked_until < now())
  ) then
    return;
  end if;

  select decrypted_secret into fn_url from vault.decrypted_secrets where name = 'project_url';
  select decrypted_secret into fn_secret from vault.decrypted_secrets where name = 'cron_secret';
  if fn_url is null or fn_secret is null then
    raise warning 'RemindMail: secrets project_url/cron_secret ausentes no Vault';
    return;
  end if;

  perform net.http_post(
    url := fn_url || '/functions/v1/send-reminders',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron-secret', fn_secret),
    body := '{}'::jsonb,
    timeout_milliseconds := 15000
  );
end;
$$;

revoke execute on function private.dispatch_due_reminders() from public;

select cron.schedule(
  'remindmail-dispatch',
  '* * * * *',
  $$select private.dispatch_due_reminders();$$
);
