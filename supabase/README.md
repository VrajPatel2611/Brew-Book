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

Phase 2 adds optional user accounts (email + password, plus email magic-link
**and** Google sign-in) so each user's **made / rating** state and **their own
recipes** are stored in the cloud and follow them across devices. The app stays
fully usable signed-out — accounts are additive, never a gate.

The account dropdown's main path is **email + password** (sign in / create
account), with **Continue with Google** and a secondary **"email me a sign-in
link"** (magic-link) option. All three are standard Supabase Auth — passwords
are hashed and handled server-side by Supabase; no credential logic lives in
the frontend.

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
   "Allow new users to sign up" is ON. This one provider covers **both** the
   magic-link and the email + password flows.
   - **Confirm email** (Authentication → Providers → Email, or Settings):
     - **On** (default, recommended for a real launch) → a new password signup
       must click a confirmation email before it can sign in. The UI already
       tells them to check their inbox.
     - **Off** → password signups are signed in immediately (handy while
       testing, but anyone can register with any email). No code change either
       way — the app handles both.
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

---

# Phase 3 — Foundation (equipment taxonomy)

Phase 3's foundation replaces the old flat `METHODS` list with a comprehensive,
categorized `EQUIPMENT_TAXONOMY` (`js/data.js`) — ~27 brewing methods across
8 categories, not just what's in one kitchen. Every recipe's `method` and
`methods[].id` now store a canonical id from that taxonomy (e.g. `moka`,
`cezve`, `chemex`) instead of a loose string, and a signed-in or guest user can
tell the app what they own via a one-time "what do you brew with?" picker
(skippable, revisitable anytime from the account menu).

**This changed the catalog's `method` values** (`"moka pot"` → `"moka"`,
`"blended"` → `"blender"`, one recipe's stovetop-simmer variant → `"cowboy"`).
Both `js/data.js` and `supabase/seed.sql` have already been updated and
regenerated locally — **the live Supabase catalog still has the old strings
until you re-run the seed**:

1. **Run [`phase3-foundation.sql`](./phase3-foundation.sql)** once in the SQL
   Editor — creates `user_equipment` (per-user owned-equipment array +
   onboarded flag), owner-scoped RLS, idempotent like the earlier migrations.
2. **Re-run [`seed.sql`](./seed.sql)** in the SQL Editor — it's an upsert
   (`on conflict (id) do update`), so this safely updates the 38 existing rows
   to the new canonical method ids without creating duplicates.

If you skip step 2, the app still works — old `"moka pot"`-style values just
fall back to a title-cased display (`methodLabel()` in `js/app.js` handles
unknown ids gracefully) — but equipment matching in a later Phase 3 track
needs the canonical ids to work correctly, so don't skip it for long.

**What's deliberately not done in this pass:** adding new method variants
(AeroPress, espresso, Chemex, traditional regional methods) to *specific*
recipes. That's real editorial judgment — e.g. deciding whether Ethiopian
coffee should offer a `jebena` variant — and is scoped as its own follow-up
content pass rather than guessed at here. This pass only did the mechanical,
safe rename plus the taxonomy/onboarding infrastructure.

---

# Phase 3 — Track 3a (light discovery: Surprise Me, Similar recipes, Pinned)

Surprise Me and Similar recipes are pure client-side features — no schema
changes, nothing to run. Pinned favourites adds one boolean column:

1. **Run [`phase3-pinned.sql`](./phase3-pinned.sql)** once in the SQL Editor
   — adds `pinned boolean not null default false` to the existing
   `user_recipe_state` table (same RLS as tried/rating already covers it,
   no policy changes needed).

Same gotcha shape as Track 3.0: the app degrades gracefully if you skip this
— pinning still works locally and `saveRecipes()`'s cloud push just fails
like any other sync error (shows "Sync error — will retry" in the account
dropdown) — but pins won't actually persist to the cloud for signed-in users
until the column exists, so don't skip it for long.
