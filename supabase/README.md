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

---

# Phase 2 — accounts & cloud sync

Phase 2 adds optional user accounts (email magic-link **and** Google sign-in) so
each user's **made / rating** state and **their own recipes** are stored in the
cloud and follow them across devices. The app stays fully usable signed-out —
accounts are additive, never a gate.

## One-time database setup

Run [`phase2.sql`](./phase2.sql) once in the **SQL Editor** (after `schema.sql`
+ `seed.sql`). It's idempotent — safe to re-run. It adds:

- columns on `recipes` (`color`, `tag_id`, `code`, `updated_at`) so a
  user-authored recipe round-trips without losing its card styling,
- a `user_recipe_state` table (per-user `tried` / `rating`),
- owner-scoped RLS policies so a signed-in user can read/write **only** their
  own rows. The Phase 1 public-read policy is left untouched.

## One-time auth setup (in the dashboards)

1. **Supabase → Authentication → URL Configuration**
   - **Site URL** = your GitHub Pages URL (e.g. `https://<user>.github.io/Brew-Book/`).
   - **Additional Redirect URLs** = the same URL, plus `http://localhost:8000/*`
     for local testing.
2. **Supabase → Authentication → Providers → Email** — ensure it's enabled and
   "Allow new users to sign up" is ON (magic-link auto-creates users).
3. **Google Cloud Console → APIs & Services → Credentials → Create OAuth client
   ID** (type: *Web application*):
   - **Authorized JavaScript origins** = your Pages origin + `http://localhost:8000`.
   - **Authorized redirect URI** = the callback URL shown on Supabase's Google
     provider page (`https://<project-ref>.supabase.co/auth/v1/callback`).
4. **Supabase → Authentication → Providers → Google** — enable it and paste the
   Client ID + Client Secret from step 3.

> **Email limits:** Supabase's built-in email sender has a low free-tier hourly
> cap — fine for personal testing. If magic-link emails start to lag or fail,
> configure custom SMTP under **Authentication → Settings**.

## How the sync works

- Signed out: personal data lives in `localStorage` exactly as before.
- Signed in: personal data is read from / written to Supabase, and mirrored to a
  local cache for instant paint and offline fallback. The guest `localStorage`
  data is left untouched, so signing out restores it exactly.
- First sign-in on an account with no cloud data migrates the browser's existing
  data up once (guarded on cloud emptiness, so it can't duplicate).
- Conflict policy is last-write-wins by `updated_at` (single user per account).
