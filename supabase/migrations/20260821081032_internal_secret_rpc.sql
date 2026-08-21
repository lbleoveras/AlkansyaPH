-- Lets a service-role-authenticated caller (only Edge Functions, which hold
-- the auto-injected SUPABASE_SERVICE_ROLE_KEY) fetch a named Vault secret via
-- PostgREST. Vault's own schema isn't exposed via PostgREST, so this is the
-- bridge -- locked to service_role only, so no anon/authenticated request to
-- the API can ever read a secret value through it.
create or replace function public.get_internal_secret(secret_name text)
returns text
language plpgsql
security definer
set search_path = public, vault
as $$
declare
  result text;
begin
  select decrypted_secret into result from vault.decrypted_secrets where name = secret_name;
  return result;
end;
$$;

revoke all on function public.get_internal_secret(text) from public, anon, authenticated;
grant execute on function public.get_internal_secret(text) to service_role;
