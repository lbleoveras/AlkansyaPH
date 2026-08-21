select cron.unschedule('sync-news-daily');

select cron.schedule(
  'sync-news-hourly',
  '0 * * * *',
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
