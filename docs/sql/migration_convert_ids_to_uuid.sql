-- ==============================================================================
-- Migration: Convert trips and itineraries IDs to UUID
-- Target: public.trips(id), public.itineraries(id), public.itineraries(trip_id)
--
-- Safety Guarantees:
-- 1. In-place alteration: retains primary key constraints (trips_pkey, itineraries_pkey)
--    and indexes without DROP CONSTRAINT CASCADE.
-- 2. Audit table: records legacy ID mappings permanently in public._legacy_id_mapping.
-- 3. Dependency audit: aborts if unexpected foreign keys or views depend on altered columns.
-- 4. Strict abort: halts with clear exception on NULL IDs, orphan FKs, or unsupported types.
-- 5. Preserves existing RLS policies and table grants without broad public exposure.
-- 6. Atomic transaction: rolls back completely on any error; safe to rerun multiple times.
-- ==============================================================================

begin;

-- 1. Ensure pgcrypto extension for gen_random_uuid()
create extension if not exists "pgcrypto";

-- 2. Create persistent audit table for historical ID traceability
create table if not exists public._legacy_id_mapping (
  table_name text not null,
  old_id bigint not null,
  new_id uuid not null,
  migrated_at timestamptz not null default now(),
  primary key (table_name, old_id)
);

do $$
declare
  v_trip_id_type text;
  v_itin_id_type text;
  v_itin_trip_id_type text;
  v_null_count int;
  v_orphan_count int;
  v_fk_name text;
  v_fk_update_rule text;
  v_fk_delete_rule text;
  v_unhandled_fk text;
  v_dependent_view text;
  r record;
begin
  -- ----------------------------------------------------------------------------
  -- Step A: Independent Column Type Inspection
  -- ----------------------------------------------------------------------------
  select data_type into v_trip_id_type
  from information_schema.columns
  where table_schema = 'public' and table_name = 'trips' and column_name = 'id';

  select data_type into v_itin_id_type
  from information_schema.columns
  where table_schema = 'public' and table_name = 'itineraries' and column_name = 'id';

  select data_type into v_itin_trip_id_type
  from information_schema.columns
  where table_schema = 'public' and table_name = 'itineraries' and column_name = 'trip_id';

  if v_trip_id_type is null or v_itin_id_type is null or v_itin_trip_id_type is null then
    raise exception 'Migration aborted: Expected tables public.trips and public.itineraries with id and trip_id columns were not found.';
  end if;

  if v_trip_id_type not in ('uuid', 'bigint', 'integer', 'smallint') then
    raise exception 'Migration aborted: public.trips.id has unsupported type "%".', v_trip_id_type;
  end if;
  if v_itin_id_type not in ('uuid', 'bigint', 'integer', 'smallint') then
    raise exception 'Migration aborted: public.itineraries.id has unsupported type "%".', v_itin_id_type;
  end if;
  if v_itin_trip_id_type not in ('uuid', 'bigint', 'integer', 'smallint') then
    raise exception 'Migration aborted: public.itineraries.trip_id has unsupported type "%".', v_itin_trip_id_type;
  end if;

  -- If all columns are already UUID, skip DDL alteration
  if v_trip_id_type = 'uuid' and v_itin_id_type = 'uuid' and v_itin_trip_id_type = 'uuid' then
    raise notice 'All ID columns (trips.id, itineraries.id, itineraries.trip_id) are already UUID. Skipping ID conversion.';
    return;
  end if;

  -- ----------------------------------------------------------------------------
  -- Step B: Guard Against Temporary Column Name Collisions
  -- ----------------------------------------------------------------------------
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name in ('trips', 'itineraries')
      and column_name in ('_migration_tmp_uuid_id', '_migration_tmp_uuid_trip_id')
  ) then
    raise exception 'Migration aborted: Temporary migration columns already exist. Clean up prior uncommitted state before proceeding.';
  end if;

  -- ----------------------------------------------------------------------------
  -- Step C: Inspect Dependent Views and External Foreign Keys
  -- ----------------------------------------------------------------------------
  select view_name into v_dependent_view
  from information_schema.view_column_usage
  where view_schema = 'public' 
    and table_name in ('trips', 'itineraries')
    and column_name in ('id', 'trip_id')
  limit 1;

  if v_dependent_view is not null then
    raise exception 'Migration aborted: View "%" depends on columns being altered.', v_dependent_view;
  end if;

  select tc.constraint_name into v_unhandled_fk
  from information_schema.table_constraints tc
  join information_schema.constraint_column_usage ccu 
    on tc.constraint_name = ccu.constraint_name and tc.table_schema = ccu.table_schema
  join information_schema.key_column_usage kcu
    on tc.constraint_name = kcu.constraint_name and tc.table_schema = kcu.table_schema
  where tc.constraint_type = 'FOREIGN KEY'
    and tc.table_schema = 'public'
    and ccu.table_name in ('trips', 'itineraries')
    and ccu.column_name = 'id'
    and not (tc.table_name = 'itineraries' and kcu.column_name = 'trip_id')
  limit 1;

  if v_unhandled_fk is not null then
    raise exception 'Migration aborted: Found unhandled foreign key constraint "%" referencing trips.id or itineraries.id.', v_unhandled_fk;
  end if;

  -- Capture existing FK properties on itineraries.trip_id
  select 
    tc.constraint_name,
    coalesce(rc.update_rule, 'NO ACTION'),
    coalesce(rc.delete_rule, 'CASCADE')
  into v_fk_name, v_fk_update_rule, v_fk_delete_rule
  from information_schema.table_constraints tc
  join information_schema.referential_constraints rc 
    on tc.constraint_name = rc.constraint_name
  join information_schema.key_column_usage kcu
    on tc.constraint_name = kcu.constraint_name and tc.table_schema = kcu.table_schema
  where tc.constraint_type = 'FOREIGN KEY'
    and tc.table_schema = 'public'
    and tc.table_name = 'itineraries'
    and kcu.column_name = 'trip_id';

  if v_fk_name is null then
    v_fk_name := 'itineraries_trip_id_fkey';
    v_fk_update_rule := 'NO ACTION';
    v_fk_delete_rule := 'CASCADE';
  end if;

  -- ----------------------------------------------------------------------------
  -- Step D: Pre-Migration Data Validation
  -- ----------------------------------------------------------------------------
  select count(*) into v_null_count from public.trips where id is null;
  if v_null_count > 0 then
    raise exception 'Migration aborted: % row(s) in public.trips have NULL id.', v_null_count;
  end if;

  select count(*) into v_null_count from public.itineraries where id is null;
  if v_null_count > 0 then
    raise exception 'Migration aborted: % row(s) in public.itineraries have NULL id.', v_null_count;
  end if;

  select count(*) into v_null_count from public.itineraries where trip_id is null;
  if v_null_count > 0 then
    raise exception 'Migration aborted: % row(s) in public.itineraries have NULL trip_id.', v_null_count;
  end if;

  -- Mixed schema checks
  if v_trip_id_type = 'uuid' and v_itin_trip_id_type != 'uuid' then
    select count(*) into v_orphan_count from public.itineraries;
    if v_orphan_count > 0 then
      raise exception 'Migration aborted: trips.id is already UUID but public.itineraries contains % row(s) with numeric trip_id.', v_orphan_count;
    end if;
  end if;

  if v_trip_id_type != 'uuid' and v_itin_trip_id_type = 'uuid' then
    select count(*) into v_orphan_count from public.itineraries;
    if v_orphan_count > 0 then
      raise exception 'Migration aborted: public.itineraries contains % row(s) with UUID trip_id but trips.id is still numeric.', v_orphan_count;
    end if;
  end if;

  if v_trip_id_type = v_itin_trip_id_type and v_trip_id_type != 'uuid' then
    select count(*) into v_orphan_count
    from public.itineraries i
    where not exists (select 1 from public.trips t where t.id = i.trip_id);

    if v_orphan_count > 0 then
      raise exception 'Migration aborted: % orphan row(s) in public.itineraries reference non-existent trips.id.', v_orphan_count;
    end if;
  end if;

  -- ----------------------------------------------------------------------------
  -- Step E: Drop Foreign Key on itineraries(trip_id)
  -- ----------------------------------------------------------------------------
  for r in (
    select tc.constraint_name, tc.table_schema, tc.table_name
    from information_schema.table_constraints tc
    join information_schema.key_column_usage kcu
      on tc.constraint_name = kcu.constraint_name and tc.table_schema = kcu.table_schema
    where tc.constraint_type = 'FOREIGN KEY'
      and tc.table_schema = 'public'
      and tc.table_name = 'itineraries'
      and kcu.column_name = 'trip_id'
  ) loop
    execute format('alter table %I.%I drop constraint if exists %I', r.table_schema, r.table_name, r.constraint_name);
    raise notice 'Temporarily dropped foreign key: %', r.constraint_name;
  end loop;

  -- ----------------------------------------------------------------------------
  -- Step F: Migrate trips.id to UUID (In-Place, preserving trips_pkey)
  -- ----------------------------------------------------------------------------
  if v_trip_id_type != 'uuid' then
    alter table public.trips alter column id drop identity if exists;
    alter table public.trips alter column id drop default;

    alter table public.trips add column _migration_tmp_uuid_id uuid;
    update public.trips set _migration_tmp_uuid_id = gen_random_uuid();

    -- Persist old-ID-to-new-UUID mapping
    insert into public._legacy_id_mapping (table_name, old_id, new_id)
    select 'trips', id, _migration_tmp_uuid_id
    from public.trips
    on conflict (table_name, old_id) do nothing;

    for r in select old_id, new_id from public._legacy_id_mapping where table_name = 'trips' loop
      raise notice 'Recorded trips ID mapping: % -> %', r.old_id, r.new_id;
    end loop;

    -- Map itineraries foreign key if numeric
    if v_itin_trip_id_type != 'uuid' then
      alter table public.itineraries add column _migration_tmp_uuid_trip_id uuid;
      update public.itineraries i
      set _migration_tmp_uuid_trip_id = t._migration_tmp_uuid_id
      from public.trips t
      where i.trip_id = t.id;

      select count(*) into v_orphan_count
      from public.itineraries
      where trip_id is not null and _migration_tmp_uuid_trip_id is null;

      if v_orphan_count > 0 then
        raise exception 'Migration aborted: % itinerary row(s) could not be mapped to parent trips UUID.', v_orphan_count;
      end if;
    end if;

    -- Alter column in-place: PostgreSQL automatically converts the primary key index
    alter table public.trips alter column id type uuid using _migration_tmp_uuid_id;
    alter table public.trips alter column id set not null;
    alter table public.trips alter column id set default gen_random_uuid();
    alter table public.trips drop column _migration_tmp_uuid_id;

    raise notice 'Converted public.trips.id to UUID in-place.';
  end if;

  -- ----------------------------------------------------------------------------
  -- Step G: Migrate itineraries.id to UUID (In-Place, preserving itineraries_pkey)
  -- ----------------------------------------------------------------------------
  if v_itin_id_type != 'uuid' then
    alter table public.itineraries alter column id drop identity if exists;
    alter table public.itineraries alter column id drop default;

    alter table public.itineraries add column _migration_tmp_uuid_id uuid;
    update public.itineraries set _migration_tmp_uuid_id = gen_random_uuid();

    insert into public._legacy_id_mapping (table_name, old_id, new_id)
    select 'itineraries', id, _migration_tmp_uuid_id
    from public.itineraries
    on conflict (table_name, old_id) do nothing;

    alter table public.itineraries alter column id type uuid using _migration_tmp_uuid_id;
    alter table public.itineraries alter column id set not null;
    alter table public.itineraries alter column id set default gen_random_uuid();
    alter table public.itineraries drop column _migration_tmp_uuid_id;

    raise notice 'Converted public.itineraries.id to UUID in-place.';
  end if;

  -- ----------------------------------------------------------------------------
  -- Step H: Migrate itineraries.trip_id to UUID
  -- ----------------------------------------------------------------------------
  if v_itin_trip_id_type != 'uuid' then
    if exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'itineraries' and column_name = '_migration_tmp_uuid_trip_id'
    ) then
      alter table public.itineraries alter column trip_id type uuid using _migration_tmp_uuid_trip_id;
      alter table public.itineraries drop column _migration_tmp_uuid_trip_id;
    else
      -- Empty table during mixed schema
      alter table public.itineraries alter column trip_id type uuid using (trip_id::text::uuid);
    end if;

    alter table public.itineraries alter column trip_id set not null;
    raise notice 'Converted public.itineraries.trip_id to UUID in-place.';
  end if;

  -- ----------------------------------------------------------------------------
  -- Step I: Re-establish Foreign Key with Preserved Name & Action Rules
  -- ----------------------------------------------------------------------------
  if not exists (
    select 1 from information_schema.table_constraints tc
    join information_schema.key_column_usage kcu
      on tc.constraint_name = kcu.constraint_name and tc.table_schema = kcu.table_schema
    where tc.constraint_type = 'FOREIGN KEY'
      and tc.table_schema = 'public'
      and tc.table_name = 'itineraries'
      and kcu.column_name = 'trip_id'
  ) then
    execute format(
      'alter table public.itineraries add constraint %I foreign key (trip_id) references public.trips(id) on update %s on delete %s',
      v_fk_name,
      v_fk_update_rule,
      v_fk_delete_rule
    );
    raise notice 'Recreated foreign key "%" on update % on delete %', v_fk_name, v_fk_update_rule, v_fk_delete_rule;
  end if;

end $$;

-- ----------------------------------------------------------------------------
-- Step 3: Ensure Expected Auxiliary Columns, Types, and Defaults Exist
-- ----------------------------------------------------------------------------
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
update public.itineraries set summary = '' where summary is null;
update public.itineraries set plan = '[]'::jsonb where plan is null;

alter table public.itineraries alter column provider set default 'mock';
alter table public.itineraries alter column provider set not null;
alter table public.itineraries alter column summary set default '';
alter table public.itineraries alter column summary set not null;
alter table public.itineraries alter column plan set default '[]'::jsonb;
alter table public.itineraries alter column plan set not null;

-- ----------------------------------------------------------------------------
-- Step 4: Row Level Security & Access Grants (non-destructive)
-- ----------------------------------------------------------------------------
alter table public.trips enable row level security;
alter table public.itineraries enable row level security;

do $$
begin
  -- Only create baseline policies if NO policy currently exists on the table
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'trips') then
    create policy trips_anon_select on public.trips for select to anon using (true);
    create policy trips_anon_insert on public.trips for insert to anon with check (true);
    raise notice 'Created baseline anon policies on public.trips.';
  else
    raise notice 'Existing policies on public.trips preserved.';
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'itineraries') then
    create policy itineraries_anon_select on public.itineraries for select to anon using (true);
    create policy itineraries_anon_insert on public.itineraries for insert to anon with check (true);
    raise notice 'Created baseline anon policies on public.itineraries.';
  else
    raise notice 'Existing policies on public.itineraries preserved.';
  end if;
end $$;

-- Scoped permissions required by publishable REST client
grant usage on schema public to anon, authenticated;
grant select, insert on public.trips to anon, authenticated;
grant select, insert on public.itineraries to anon, authenticated;
grant select on public._legacy_id_mapping to anon, authenticated;

-- ----------------------------------------------------------------------------
-- Step 5: Reload PostgREST Schema Cache
-- ----------------------------------------------------------------------------
notify pgrst, 'reload schema';

commit;
