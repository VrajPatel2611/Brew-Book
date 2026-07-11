-- ===== Brew Book — Phase 2 schema (accounts + cloud sync) =====
-- Run this ONCE in the Supabase SQL editor AFTER schema.sql + seed.sql are in.
-- Safe to re-run: every statement is idempotent (if not exists / drop-then-create).
--
-- Phase 2 adds identity. Until now personal data (which recipes you've made,
-- your ratings, and any recipes you wrote yourself) lived only in one browser.
-- This migration gives each signed-in user cloud storage for that data, scoped
-- so a user can only ever read or write their OWN rows — enforced by Row Level
-- Security in the database, not by the frontend.
--
-- What it does:
--   1. Adds columns to `recipes` that custom (user-authored) recipes need in
--      order to round-trip through the cloud without losing their card styling.
--   2. Creates `user_recipe_state` — one row per (user, recipe) holding the
--      tried flag + star rating. Covers BOTH catalog and user-authored recipes.
--   3. Adds owner-scoped RLS write policies so a signed-in user can manage only
--      their own recipes, while the Phase 1 public read policy stays untouched.

-- ---------------------------------------------------------------------------
-- 1. recipes: columns needed to round-trip a user-authored recipe
-- ---------------------------------------------------------------------------
-- The add/edit form attaches color (card swatch), tag_id (flavour tag), and a
-- 2-letter origin code to every custom recipe. Without these columns those
-- values would be dropped the moment the recipe is saved to the cloud.
-- updated_at supports the last-write-wins sync policy.
alter table public.recipes
  add column if not exists color      text,
  add column if not exists tag_id     text,
  add column if not exists code       text,
  add column if not exists updated_at timestamptz not null default now();

-- ---------------------------------------------------------------------------
-- 2. user_recipe_state: per-user tried / rating
-- ---------------------------------------------------------------------------
-- Keyed by (user_id, recipe_id) so it uniformly covers catalog recipes
-- (seed-*) and the user's own recipes (custom-*) through one table. Both FKs
-- cascade-delete: deleting a user removes their state; deleting a recipe
-- removes any state pointing at it.
create table if not exists public.user_recipe_state (
  user_id    uuid not null references auth.users(id)   on delete cascade,
  recipe_id  text not null references public.recipes(id) on delete cascade,
  tried      boolean     not null default false,
  rating     smallint    not null default 0 check (rating between 0 and 5),
  updated_at timestamptz not null default now(),
  primary key (user_id, recipe_id)
);

create index if not exists user_recipe_state_user_idx on public.user_recipe_state (user_id);

-- Row Level Security: a user may touch ONLY rows where user_id = their own id.
alter table public.user_recipe_state enable row level security;

drop policy if exists "Users can read own state"   on public.user_recipe_state;
drop policy if exists "Users can insert own state" on public.user_recipe_state;
drop policy if exists "Users can update own state" on public.user_recipe_state;
drop policy if exists "Users can delete own state" on public.user_recipe_state;

create policy "Users can read own state"
  on public.user_recipe_state for select
  using ( user_id = auth.uid() );

create policy "Users can insert own state"
  on public.user_recipe_state for insert
  with check ( user_id = auth.uid() );

create policy "Users can update own state"
  on public.user_recipe_state for update
  using ( user_id = auth.uid() )
  with check ( user_id = auth.uid() );

create policy "Users can delete own state"
  on public.user_recipe_state for delete
  using ( user_id = auth.uid() );

grant select, insert, update, delete on public.user_recipe_state to authenticated;

-- ---------------------------------------------------------------------------
-- 3. recipes: owner-scoped write access for user-authored recipes
-- ---------------------------------------------------------------------------
-- The Phase 1 policy "Public can read catalog recipes" (owner_id is null) is
-- left in place. Postgres ORs multiple permissive SELECT policies together, so
-- adding an owner-scoped read policy only ADDS visibility of the caller's own
-- rows — it can never expose one user's private recipe to another user.
drop policy if exists "Users can read own recipes"   on public.recipes;
drop policy if exists "Users can insert own recipes" on public.recipes;
drop policy if exists "Users can update own recipes" on public.recipes;
drop policy if exists "Users can delete own recipes" on public.recipes;

create policy "Users can read own recipes"
  on public.recipes for select
  using ( owner_id = auth.uid() );

create policy "Users can insert own recipes"
  on public.recipes for insert
  with check ( owner_id = auth.uid() );

-- USING gates which existing rows may be changed (must already be yours);
-- WITH CHECK gates what the row is allowed to become (must still be yours
-- after the change). Together they block editing someone else's recipe AND
-- re-pointing owner_id to steal or orphan a row.
create policy "Users can update own recipes"
  on public.recipes for update
  using ( owner_id = auth.uid() )
  with check ( owner_id = auth.uid() );

create policy "Users can delete own recipes"
  on public.recipes for delete
  using ( owner_id = auth.uid() );

grant insert, update, delete on public.recipes to authenticated;
