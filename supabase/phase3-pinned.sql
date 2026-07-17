-- ===== Brew Book — Phase 3 schema: Pinned favourites (Track 3a) =====
-- Run this ONCE in the Supabase SQL editor AFTER phase2.sql is in.
-- Safe to re-run: idempotent (add column if not exists).
--
-- Pinned favourites let a signed-in user pin a handful of go-to recipes so
-- they surface first, independent of tried/rating. Structurally this is
-- just one more per-(user, recipe) flag, so it lives on the same
-- `user_recipe_state` row as tried/rating rather than a new table — the
-- app's sync code (currentUserData / pushUserDataToCloud /
-- refreshUserDataFromCloud in js/app.js) already treats it as a third field
-- on that row, following the exact same guest-localStorage/cloud split.

alter table public.user_recipe_state
  add column if not exists pinned boolean not null default false;
