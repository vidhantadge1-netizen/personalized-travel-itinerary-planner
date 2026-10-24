# Database

Supabase project URL (not a secret): `https://zkiyssoeluerfbulbcgf.supabase.co`

Until `GET /health` reports `supabase_status: ready`, itineraries stay in
memory so the frontend keeps working.

## Expected tables

### `trips`

| column | type | notes |
| --- | --- | --- |
| id | uuid | primary key, default gen_random_uuid() |
| destination | text | city or region |
| days | int | 1–14 |
| budget | text | budget / moderate / luxury |
| interests | text[] | tags |
| traveler_type | text | solo, couple, family, friends |
| created_at | timestamptz | default now() |

### `itineraries`

| column | type | notes |
| --- | --- | --- |
| id | uuid | primary key, default gen_random_uuid() |
| trip_id | uuid | foreign key to trips.id on delete cascade |
| provider | text | mock, openai, gemini, ... |
| summary | text | short description |
| plan | jsonb | list of day objects |
| created_at | timestamptz | default now() |

## Expected RLS (safe for a publishable key)

- RLS **enabled** on both tables
- `anon` may `SELECT` and `INSERT`
- no `UPDATE` or `DELETE` policies for `anon`
- do **not** put the secret/service-role key in the backend

## SQL Migrations

1. Safe migration converting existing bigint/identity IDs to UUIDs while preserving data & foreign keys:
   `docs/sql/migration_convert_ids_to_uuid.sql`

2. Full idempotent initial / repair script:
   `docs/sql/trips_and_itineraries.sql`

Inspect in the SQL editor:

```sql
select table_name, column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_schema = 'public' and table_name in ('trips', 'itineraries')
order by table_name, ordinal_position;

select tablename, policyname, cmd, roles
from pg_policies
where tablename in ('trips', 'itineraries');
```

## Backend env

- `SUPABASE_URL`
- `SUPABASE_KEY` — publishable / anon key only, in local `backend/.env`
