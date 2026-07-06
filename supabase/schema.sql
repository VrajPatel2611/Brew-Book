-- ===== Brew Book — Phase 1 schema =====
-- Run this ONCE in the Supabase SQL editor (Dashboard → SQL Editor → New query),
-- then run supabase/seed.sql to load the 38 recipes.
--
-- Phase 1 scope: the recipes table is a PUBLIC, READ-ONLY catalog. Anyone
-- (even signed-out) can read it; nobody can write it from the frontend — you
-- edit recipes in the Supabase dashboard, which bypasses these rules.
--
-- owner_id is here now but stays null for every catalog row. Phase 2 will use
-- it (non-null = a user's own recipe) and add write policies; you don't need
-- to touch it yet.

create table if not exists public.recipes (
  id            text primary key,
  serial        int,
  name          text not null,
  origin        text,
  method        text,
  ratio         text,
  ratio_label   text,
  strength      int,
  description   text,
  story         text,
  bean          text,
  notes         text,
  ingredients   jsonb not null default '[]'::jsonb,
  steps         jsonb not null default '[]'::jsonb,
  methods       jsonb not null default '[]'::jsonb,
  roaster_picks jsonb,
  owner_id      uuid references auth.users(id) on delete cascade,
  created_at    timestamptz not null default now()
);

-- Keep the "brew of the day" and lanes fast even as the catalog grows.
create index if not exists recipes_serial_idx on public.recipes (serial);
create index if not exists recipes_owner_idx  on public.recipes (owner_id);

-- Row Level Security: with this ON, the public anon key can do ONLY what the
-- policies below allow. This is what makes shipping the anon key in the
-- frontend safe.
alter table public.recipes enable row level security;

-- The only Phase 1 policy: anyone may READ catalog rows (owner_id is null).
-- No insert/update/delete policy exists, so the frontend cannot write — the
-- catalog is edited from the dashboard only.
drop policy if exists "Public can read catalog recipes" on public.recipes;
create policy "Public can read catalog recipes"
  on public.recipes
  for select
  using ( owner_id is null );

-- Make sure the API roles can reach the table (RLS still gates the rows).
grant usage on schema public to anon, authenticated;
grant select on public.recipes to anon, authenticated;
