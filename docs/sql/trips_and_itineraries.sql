-- Expected schema for Personalized Travel Itinerary Planner.
-- Safe to re-run: IF NOT EXISTS / DROP POLICY IF EXISTS / column type migrations.

create extension if not exists "pgcrypto";

-- Drop foreign key on itineraries(trip_id) before altering ID types if necessary
do $$
declare
  r record;
begin
  for r in (
    select tc.constraint_name, tc.table_schema, tc.table_name
    from information_schema.table_constraints tc
    join information_schema.key_column_usage kcu
      on tc.constraint_name = kcu.constraint_name
      and tc.table_schema = kcu.table_schema
    where tc.constraint_type = 'FOREIGN KEY'
      and tc.table_schema = 'public'
      and tc.table_name = 'itineraries'
      and kcu.column_name = 'trip_id'
  ) loop
    execute format('alter table %I.%I drop constraint if exists %I', r.table_schema, r.table_name, r.constraint_name);
  end loop;
end $$;

create table if not exists public.trips (
  id uuid primary key default gen_random_uuid(),
  destination text not null,
  days int not null check (days >= 1 and days <= 14),
  budget text not null,
  interests text[] not null default '{}',
  traveler_type text,
  created_at timestamptz not null default now()
);

create table if not exists public.itineraries (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  provider text not null default 'mock',
  summary text not null default '',
  plan jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

-- Upgrade existing columns to UUID if they were previously created as bigint/integer
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'trips' and column_name = 'id' and data_type != 'uuid'
  ) then
    alter table public.trips alter column id drop identity if exists;
    alter table public.trips alter column id drop default;
    if exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'trips' and column_name = 'id' and data_type in ('bigint', 'integer', 'smallint')
    ) then
      alter table public.trips alter column id type uuid using (lpad(to_hex(id), 32, '0')::uuid);
    else
      alter table public.trips alter column id type uuid using (id::text::uuid);
    end if;
  end if;
end $$;

alter table public.trips alter column id set default gen_random_uuid();

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'itineraries' and column_name = 'trip_id' and data_type != 'uuid'
  ) then
    if exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'itineraries' and column_name = 'trip_id' and data_type in ('bigint', 'integer', 'smallint')
    ) then
      alter table public.itineraries alter column trip_id type uuid using (lpad(to_hex(trip_id), 32, '0')::uuid);
    else
      alter table public.itineraries alter column trip_id type uuid using (trip_id::text::uuid);
    end if;
  end if;
end $$;

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'itineraries' and column_name = 'id' and data_type != 'uuid'
  ) then
    alter table public.itineraries alter column id drop identity if exists;
    alter table public.itineraries alter column id drop default;
    if exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'itineraries' and column_name = 'id' and data_type in ('bigint', 'integer', 'smallint')
    ) then
      alter table public.itineraries alter column id type uuid using (lpad(to_hex(id), 32, '0')::uuid);
    else
      alter table public.itineraries alter column id type uuid using (id::text::uuid);
    end if;
  end if;
end $$;

alter table public.itineraries alter column id set default gen_random_uuid();

-- Re-establish foreign key constraint
alter table public.itineraries alter column trip_id set not null;

do $$
begin
  if not exists (
    select 1 from information_schema.table_constraints tc
    join information_schema.key_column_usage kcu
      on tc.constraint_name = kcu.constraint_name
      and tc.table_schema = kcu.table_schema
    where tc.constraint_type = 'FOREIGN KEY'
      and tc.table_schema = 'public'
      and tc.table_name = 'itineraries'
      and kcu.column_name = 'trip_id'
  ) then
    alter table public.itineraries
      add constraint itineraries_trip_id_fkey
      foreign key (trip_id) references public.trips(id) on delete cascade;
  end if;
end $$;

-- Ensure required columns exist
alter table public.trips add column if not exists destination text;
alter table public.trips add column if not exists days int;
alter table public.trips add column if not exists budget text;
alter table public.trips add column if not exists interests text[] not null default '{}';
alter table public.trips add column if not exists traveler_type text;
alter table public.trips add column if not exists created_at timestamptz not null default now();

alter table public.itineraries add column if not exists provider text default 'mock';
alter table public.itineraries add column if not exists summary text default '';
alter table public.itineraries add column if not exists plan jsonb default '[]'::jsonb;
alter table public.itineraries add column if not exists created_at timestamptz not null default now();

update public.itineraries set provider = 'mock' where provider is null;
update public.itineraries set summary = coalesce(summary, '') where summary is null;
update public.itineraries set plan = '[]'::jsonb where plan is null;

alter table public.itineraries alter column provider set default 'mock';
alter table public.itineraries alter column provider set not null;
alter table public.itineraries alter column summary set default '';
alter table public.itineraries alter column summary set not null;
alter table public.itineraries alter column plan set default '[]'::jsonb;
alter table public.itineraries alter column plan set not null;

-- Enable RLS and setup anon policies
alter table public.trips enable row level security;
alter table public.itineraries enable row level security;

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

notify pgrst, 'reload schema';
