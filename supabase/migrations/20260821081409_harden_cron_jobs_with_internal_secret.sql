-- Re-point all three cron jobs at the new internal_cron_secret instead of the
-- anon/publishable key. The anon key is intentionally public (ships in the app
-- bundle) and was never actually restricting these calls to "cron only" --
-- verify_jwt just checked "is this A valid Supabase JWT", which the anon key
-- itself satisfies. The Edge Functions now check this secret themselves
-- (constant-time comparison) with verify_jwt disabled.

select cron.schedule(
  'sync-stock-quotes-market-hours',
  '*/15 1-7 * * 1-5',
  $$
  select net.http_post(
    url := 'https://zraunfstpbgqbckeaofs.supabase.co/functions/v1/sync-stock-quotes',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (
        select decrypted_secret from vault.decrypted_secrets where name = 'internal_cron_secret'
      )
    ),
    body := '{}'::jsonb
  );
  $$
);

select cron.schedule(
  'sync-news-daily',
  '30 22 * * *',
  $$
  select net.http_post(
    url := 'https://zraunfstpbgqbckeaofs.supabase.co/functions/v1/sync-news',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (
        select decrypted_secret from vault.decrypted_secrets where name = 'internal_cron_secret'
      )
    ),
    body := '{}'::jsonb
  );
  $$
);

select cron.schedule(
  'send-price-alerts-market-hours',
  '2-59/15 1-7 * * 1-5',
  $$
  select net.http_post(
    url := 'https://zraunfstpbgqbckeaofs.supabase.co/functions/v1/send-price-alerts',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (
        select decrypted_secret from vault.decrypted_secrets where name = 'internal_cron_secret'
      )
    ),
    body := '{}'::jsonb
  );
  $$
);
