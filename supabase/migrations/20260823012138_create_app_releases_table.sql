create table public.app_releases (
  platform text primary key,
  latest_version text not null,
  download_url text not null,
  release_notes text,
  updated_at timestamptz not null default now()
);

alter table public.app_releases enable row level security;

create policy "app_releases_public_read"
  on public.app_releases
  for select
  using (true);
