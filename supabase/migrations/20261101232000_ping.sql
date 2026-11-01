-- Endpoint mínimo para o ping diário (GitHub Actions) que evita a pausa
-- do plano gratuito por inatividade. Não lê nem expõe dados.
create or replace function public.ping()
returns text
language sql
stable
set search_path = ''
as $$
  select 'ok'::text;
$$;

revoke execute on function public.ping() from public;
grant execute on function public.ping() to anon, authenticated;
