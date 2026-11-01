-- Permite que a Edge Function confira o header x-cron-secret contra o Vault,
-- sem precisar copiar o segredo para fora do banco.
create or replace function public.verify_cron_secret(p_secret text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select decrypted_secret = p_secret
     from vault.decrypted_secrets
     where name = 'cron_secret'),
    false
  );
$$;

revoke execute on function public.verify_cron_secret(text) from public, anon, authenticated;
grant execute on function public.verify_cron_secret(text) to service_role;

-- Os secrets ficam fora do Git. Para recriar em outro projeto:
--   select vault.create_secret('https://<ref>.supabase.co', 'project_url');
--   select vault.create_secret(encode(extensions.gen_random_bytes(32), 'hex'), 'cron_secret');
