-- ==============================================================================
-- Migration: Add provider and repair trips/itineraries schema
-- Purpose: Safely upgrades public.itineraries and public.trips to match the
--          FastAPI backend schema guard expectations.
-- Preserves existing data, ensures RLS policies are set for anon, and reloads
-- the PostgREST schema cache.
-- ==============================================================================

-- 1. Ensure tables exist
create table if not exists public.trips (
  id uuid primary key,
  destination text not null,
  days int not null check (days >= 1 and days <= 14),
  budget text not null,
  interests text[] not null default '{}',
  traveler_type text,
  created_at timestamptz not null default now()
);

create table if not exists public.itineraries (
  id uuid primary key,
  trip_id uuid not null references public.trips(id) on delete cascade,
  provider text not null default 'mock',
  summary text not null default '',
  plan jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

-- 2. Safely add any missing columns to existing tables (e.g. provider, summary, plan)
alter table public.trips add column if not exists destination text;
alter table public.trips add column if not exists days int;
alter table public.trips add column if not exists budget text;
alter table public.trips add column if not exists interests text[] not null default '{}';
alter table public.trips add column if not exists traveler_type text;
alter table public.trips add column if not exists created_at timestamptz not null default now();

alter table public.itineraries add column if not exists trip_id uuid references public.trips(id) on delete cascade;
alter table public.itineraries add column if not exists provider text default 'mock';
alter table public.itineraries add column if not exists summary text default '';
alter table public.itineraries add column if not exists plan jsonb default '[]'::jsonb;
alter table public.itineraries add column if not exists created_at timestamptz not null default now();

-- 3. Backfill any existing rows with safe defaults to satisfy constraints
update public.itineraries set provider = 'mock' where provider is null;
update public.itineraries set summary = coalesce(summary, '') where summary is null;
update public.itineraries set plan = '[]'::jsonb where plan is null;

-- 4. Preserve existing data from legacy 'itinerary' column if present
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'itineraries' and column_name = 'itinerary'
  ) then
    execute 'update public.itineraries set summary = substring(itinerary::text from 1 for 200) where summary = '''' and itinerary is not null';
  end if;
end $$;

-- 5. Enforce column defaults and NOT NULL constraints
alter table public.itineraries alter column provider set default 'mock';
alter table public.itineraries alter column provider set not null;
alter table public.itineraries alter column summary set default '';
alter table public.itineraries alter column summary set not null;
alter table public.itineraries alter column plan set default '[]'::jsonb;
alter table public.itineraries alter column plan set not null;

-- 6. Enable Row Level Security (RLS)
alter table public.trips enable row level security;
alter table public.itineraries enable row level security;

-- 7. Configure idempotent RLS policies for publishable anon role (select + insert only)
drop policy if exists trips_anon_select on public.trips;
drop policy if exists trips_anon_insert on public.trips;
drop policy if exists itineraries_anon_select on public.itineraries;
drop policy if exists itineraries_anon_insert on public.itineraries;

create policy trips_anon_select
  on public.trips for select to anon using (true);

create policy trips_anon_insert
  on public.trips for insert to anon with check (true);

create policy itineraries_anon_select
  on public.itineraries for select to anon using (true);

create policy itineraries_anon_insert
  on public.itineraries for insert to anon with check (true);

-- 8. Signal PostgREST to reload its schema cache immediately
notify pgrst, 'reload schema';
