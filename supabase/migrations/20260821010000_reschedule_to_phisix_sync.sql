-- Re-point the market-hours cron job at sync-stock-quotes (the phisix-based
-- replacement for the retired PSE-Edge-scraping function, which was retired
-- because edge.pse.com.ph's robots.txt explicitly disallows ClaudeBot).
-- The original job ('scrape-pse-market-hours') was unscheduled directly
-- against the live project before this migration was written.

select cron.schedule(
  'sync-stock-quotes-market-hours',
  '*/15 1-7 * * 1-5',
  $$
  select net.http_post(
    url := 'https://zraunfstpbgqbckeaofs.supabase.co/functions/v1/sync-stock-quotes',
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
