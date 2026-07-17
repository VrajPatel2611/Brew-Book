-- ===== Brew Book — Phase 3: Tasting journal =====
-- Run this ONCE in the Supabase SQL editor AFTER phase2.sql is in.
-- Safe to re-run: idempotent (if not exists / drop-then-create policies).
--
-- A tasting journal is a running log of EVERY time a user brews a recipe —
-- a dated entry with an optional rating + a note. That's one-to-many (many
-- brews of the same recipe over time), so it can't live on user_recipe_state
-- (one row per user+recipe); it needs its own table.
--
-- Guests keep their journal in localStorage (`tasting-notes-<recipeId>`); on
-- first sign-in the app migrates those entries up once (see
-- maybeMigrateTastingNotesToCloud in js/app.js). Owner-scoped RLS, exactly
-- like user_recipe_state, so a user only ever sees their own notes.

create table if not exists public.tasting_notes (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id)     on delete cascade,
  recipe_id  text not null references public.recipes(id) on delete cascade,
  method_id  text,                  -- canonical EQUIPMENT_TAXONOMY id brewed
  rating     smallint check (rating between 0 and 5),
  note       text not null,
  brewed_at  timestamptz not null default now()
);

create index if not exists tasting_notes_user_recipe_idx
  on public.tasting_notes (user_id, recipe_id, brewed_at desc);

alter table public.tasting_notes enable row level security;

drop policy if exists "Users can read own tasting notes"   on public.tasting_notes;
drop policy if exists "Users can insert own tasting notes" on public.tasting_notes;
drop policy if exists "Users can update own tasting notes" on public.tasting_notes;
drop policy if exists "Users can delete own tasting notes" on public.tasting_notes;

create policy "Users can read own tasting notes"
  on public.tasting_notes for select
  using ( user_id = auth.uid() );

create policy "Users can insert own tasting notes"
  on public.tasting_notes for insert
  with check ( user_id = auth.uid() );

create policy "Users can update own tasting notes"
  on public.tasting_notes for update
  using ( user_id = auth.uid() )
  with check ( user_id = auth.uid() );

create policy "Users can delete own tasting notes"
  on public.tasting_notes for delete
  using ( user_id = auth.uid() );

grant select, insert, update, delete on public.tasting_notes to authenticated;
