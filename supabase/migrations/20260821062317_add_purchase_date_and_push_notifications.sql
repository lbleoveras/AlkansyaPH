-- Purchase date: captured once at Add Holding time, not touched by later
-- increase/decrease adjustments (same "single merged position, no lot ledger"
-- model as average_price).
alter table public.holdings add column purchased_at date not null default current_date;

-- Expo push tokens, one row per (user, device/token). Deleted on logout so a
-- shared/reused device doesn't keep notifying a signed-out account.
create table public.push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  expo_push_token text not null,
  device_name text,
  created_at timestamptz not null default now(),
  unique (user_id, expo_push_token)
);

alter table public.push_tokens enable row level security;

create policy "push tokens are manageable by owner"
  on public.push_tokens
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Dedup log so a holding that stays past the alert threshold all day only
-- triggers one push per user per symbol per day. Written only by the
-- service-role price-alert sender.
create table public.price_alerts_sent (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  symbol text not null references public.stocks (symbol),
  alert_date date not null,
  change_percent numeric(8, 4) not null,
  sent_at timestamptz not null default now(),
  unique (user_id, symbol, alert_date)
);

alter table public.price_alerts_sent enable row level security;

create policy "price alerts are viewable by owner"
  on public.price_alerts_sent
  for select
  to authenticated
  using (auth.uid() = user_id);
