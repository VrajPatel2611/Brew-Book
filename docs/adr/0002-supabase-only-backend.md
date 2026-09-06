# ADR-0002 — Supabase (Postgres + Auth) as the only backend; no custom server

**Status:** Accepted — retroactively recorded (2026-09-06)

## Context

Brew Book needs accounts, cloud sync of user state (tried / rating / pinned,
custom recipes, owned equipment, tasting notes), and a shared recipe catalog.
It has **no custom server code and no serverless functions.** The browser talks
directly to a Supabase project through the `supabase-js` client: Postgres for
data, Supabase Auth for identity. Authorization is enforced inside the database
by Row Level Security (recorded separately in ADR-0003). The only Supabase
artifacts in the repo are SQL files under `supabase/` (`schema.sql`, `seed.sql`,
`phase2.sql`, the three `phase3-*.sql`); there is no `supabase/functions`
directory.

## Decision

Supabase is the **entire** backend, accessed **directly from the client.** No
custom API server, no serverless/edge layer today. The shipped app exposes only
the Supabase URL and the **anon (publishable) key** in `js/config.js`; the
`service_role` secret never touches the frontend. All data access goes through
`supabase-js` under RLS.

## Alternatives considered, and why each lost

- **Custom API server (Node/Express, etc.).** Reintroduces a server to run,
  scale, secure, and pay for — the exact thing ADR-0001/0007 avoid — for CRUD
  the database can authorize by itself via RLS. The author's weak spot is
  backend/deploy; a server enlarges it.
- **Serverless functions on a separate platform.** Another moving part and
  vendor, duplicating what Supabase already bundles.
- **Supabase Edge Functions now.** Rejected *for now, not permanently:* nothing
  in the current feature set needs trusted server-side logic. Kept in reserve
  (see "When this would change").
- **A different BaaS (Firebase).** Postgres + SQL + RLS fit a relational
  recipe/user-state model and the author's existing SQL files; no reason to
  switch ecosystems.

## Consequences

**Good**

- No server to operate; auth, database, and (if needed) file storage in one
  place.
- RLS gives per-row security with zero server code (ADR-0003) — that is what
  makes "no backend" safe.
- Fits static hosting (ADR-0007) and guest-first fallback (ADR-0004): if
  Supabase is unreachable, the app still runs on `localStorage`.

**Bad / costs we accept**

- Every data operation runs in the client and is visible; table shapes and the
  anon key are public. Security rests **entirely** on RLS being correct — a
  mistake there is the whole ballgame (why ADR-0003 exists, and why RLS needs
  its own verification task).
- No home for trusted logic: server-only secrets, third-party API calls you
  don't want exposed, rate limiting, moderation of user-submitted content,
  scheduled jobs, cross-user aggregations, or multi-row transactional
  invariants beyond what RLS and Postgres constraints can express.
- Operational truth lives in a dashboard the code can't see, so the live schema
  can drift from the repo's SQL. It currently has (un-run migrations — tracked
  as a BUILD_PLAN candidate).

## When this would change

The trigger to add **Supabase Edge Functions** (and a superseding ADR) is the
first feature that needs trusted server-side logic — e.g. moderating public
user-submitted recipes, calling a paid third-party API with a secret, or
enforcing a limit a user could otherwise bypass in the client. Until then,
direct-client + RLS stays. This is a growth path *within* Supabase, not a return
to a separate server.

## Supersedes / superseded by

None.
