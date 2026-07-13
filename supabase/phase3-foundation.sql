-- ===== Brew Book — Phase 3 schema: Foundation (equipment) =====
-- Run this ONCE in the Supabase SQL editor AFTER phase2.sql is in.
-- Safe to re-run: every statement is idempotent (if not exists / drop-then-create).
--
-- Phase 3's foundation is a comprehensive equipment taxonomy (see
-- EQUIPMENT_TAXONOMY in js/data.js) and a one-time "what do you brew with?"
-- onboarding. This migration adds the cloud side of that: one row per
-- signed-in user holding which equipment they own, so the equipment filter
-- (a later Phase 3 track) and any personalization can read it back on any
-- device. Guests keep the same data in localStorage until they sign in.
--
-- What it does:
--   1. Creates `user_equipment` — one row per user: an array of canonical
--      equipment ids (matching EQUIPMENT_TAXONOMY's `id` field) plus an
--      `onboarded` flag so the app knows whether to show the picker.
--   2. Owner-scoped RLS so a user can only ever read/write their own row.

create table if not exists public.user_equipment (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  equipment  text[] not null default '{}',
  onboarded  boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.user_equipment enable row level security;

drop policy if exists "Users can read own equipment"   on public.user_equipment;
drop policy if exists "Users can insert own equipment" on public.user_equipment;
drop policy if exists "Users can update own equipment" on public.user_equipment;

create policy "Users can read own equipment"
  on public.user_equipment for select
  using ( user_id = auth.uid() );

create policy "Users can insert own equipment"
  on public.user_equipment for insert
  with check ( user_id = auth.uid() );

create policy "Users can update own equipment"
  on public.user_equipment for update
  using ( user_id = auth.uid() )
  with check ( user_id = auth.uid() );

grant select, insert, update on public.user_equipment to authenticated;
