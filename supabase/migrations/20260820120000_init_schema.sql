-- AlkansyaPH initial schema
-- Tables: public.stocks (shared reference data), public.holdings (per-user, RLS-isolated),
-- public.stock_price_history (append-only snapshot log).

-- ============================================================================
-- Extensions
-- ============================================================================

create extension if not exists pgcrypto with schema extensions;

-- ============================================================================
-- Tables
-- ============================================================================

create table if not exists public.stocks (
  symbol text primary key,
  company_name text not null,
  sector text not null,
  cmpy_id integer unique, -- PSE Edge's internal numeric company id; nullable until mapped
  price numeric(12, 4) not null default 0,
  change_amount numeric(12, 4) not null default 0,
  change_percent numeric(8, 4) not null default 0,
  open_price numeric(12, 4),
  prev_close numeric(12, 4),
  day_high numeric(12, 4),
  day_low numeric(12, 4),
  volume bigint,
  average_price numeric(12, 4),
  week52_high numeric(12, 4),
  week52_low numeric(12, 4),
  market_cap_billion numeric(14, 4),
  outstanding_shares bigint,
  board_lot integer,
  par_value numeric(12, 4),
  float_million numeric(14, 4), -- not available from PSE Edge's page; manually curated/nullable
  index_weight_percent numeric(6, 3), -- PSEi weight, only populated for the 30 index members
  is_pse_index_member boolean not null default false,
  last_scraped_at timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists public.holdings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  symbol text not null references public.stocks (symbol),
  quantity numeric(14, 4) not null check (quantity > 0),
  average_price numeric(12, 4) not null check (average_price >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, symbol)
);

create table if not exists public.stock_price_history (
  id bigint generated always as identity primary key,
  symbol text not null references public.stocks (symbol),
  captured_at timestamptz not null default now(),
  price numeric(12, 4) not null
);

create index if not exists stock_price_history_symbol_captured_at_idx
  on public.stock_price_history (symbol, captured_at);

-- ============================================================================
-- Row Level Security
-- ============================================================================

alter table public.stocks enable row level security;
alter table public.holdings enable row level security;
alter table public.stock_price_history enable row level security;

-- stocks: shared reference data, readable by everyone. No write policy is
-- defined here on purpose — the scraper writes via the service-role key,
-- which bypasses RLS entirely.
create policy "stocks are viewable by everyone"
  on public.stocks
  for select
  to anon, authenticated
  using (true);

-- holdings: strictly per-user, enforced via auth.uid() on every operation.
create policy "holdings are viewable by owner"
  on public.holdings
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "holdings are insertable by owner"
  on public.holdings
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "holdings are updatable by owner"
  on public.holdings
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "holdings are deletable by owner"
  on public.holdings
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- stock_price_history: shared reference data, same reasoning as stocks —
-- readable by everyone, written only by the service-role scraper.
create policy "stock price history is viewable by everyone"
  on public.stock_price_history
  for select
  to anon, authenticated
  using (true);

-- ============================================================================
-- Triggers
-- ============================================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_stocks_updated_at
  before update on public.stocks
  for each row
  execute function public.set_updated_at();

create trigger set_holdings_updated_at
  before update on public.holdings
  for each row
  execute function public.set_updated_at();
