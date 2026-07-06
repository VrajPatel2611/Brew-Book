# Brew Book — Supabase backend (Phase 1)

Phase 1 moves the **recipe catalog** out of hardcoded JS and into Supabase.
Personal state (tried / rating) and custom recipes still live in the browser —
those move to a per-user table in Phase 2.

## One-time setup (≈5 minutes, all in the dashboard)

1. **Create the tables + security.**
   Supabase dashboard → **SQL Editor** → **New query** → paste all of
   [`schema.sql`](./schema.sql) → **Run**.

2. **Load the 38 recipes.**
   New query → paste all of [`seed.sql`](./seed.sql) → **Run**.
   (Safe to re-run — it upserts, so it also works as a "push my latest edits".)

3. **Connect the frontend.**
   Dashboard → **Project Settings → API**. Copy **Project URL** and the
   **anon / public** key into [`../js/config.js`](../js/config.js), replacing
   the two placeholder strings. Commit + push.

That's it — the app now reads recipes from Supabase, and falls back to the
bundled seed if it can't reach it.

## Editing recipes from now on

- **Small edits / new recipes:** edit directly in the dashboard → **Table
  Editor → recipes**. Changes are live on next page load. No deploy needed.
- **Bulk / from code:** edit `js/data.js`, run `node scripts/export-seed-sql.js`
  to regenerate `seed.sql`, and run it in the SQL editor.

## Safety

`schema.sql` turns on Row Level Security with a single policy: the catalog is
**world-readable, not writable** from the frontend. That's why the anon key is
safe to ship. Never put the `service_role` secret key in `config.js`.
