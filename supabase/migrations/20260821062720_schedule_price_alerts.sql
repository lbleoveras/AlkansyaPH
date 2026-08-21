-- Runs 2 minutes after each sync-stock-quotes tick (same market-hours window)
-- so stocks.change_percent already reflects the latest scrape.
select cron.schedule(
  'send-price-alerts-market-hours',
  '2-59/15 1-7 * * 1-5',
  $$
  select net.http_post(
    url := 'https://zraunfstpbgqbckeaofs.supabase.co/functions/v1/send-price-alerts',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (
        select decrypted_secret from vault.decrypted_secrets where name = 'scrape_pse_auth_token'
      )
    ),
    body := '{}'::jsonb
  );
  $$
);
