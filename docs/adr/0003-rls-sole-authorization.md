# ADR-0003 — Row Level Security is the sole authorization boundary

**Status:** Accepted — retroactively recorded (2026-09-06)

## Context

With no server (ADR-0002), Supabase exposes Postgres directly to the browser
using the public **anon** key. Without database-side protection, any client
could read or write any row. So the database itself must decide who can touch
what. Repo SQL confirms RLS is **enabled on all four tables** — `recipes`,
`user_recipe_state`, `user_equipment`, `tasting_notes` — with policies keyed on
`auth.uid()`. Guests never reach this path: their data lives in `localStorage`
(ADR-0004), so RLS governs only the signed-in cloud copy.

## Decision

Authorization lives **entirely in Postgres RLS.** No authorization logic in
client JS is trusted — the client may hide or disable UI for UX, but the
database policies are what actually enforce access. Policy shape, from repo SQL:

- **User-owned tables** (`user_recipe_state`, `user_equipment`,
  `tasting_notes`): a row is readable/writable only by its owner, via
  `user_id = auth.uid()`.
- **`recipes`:** public read of the catalog for everyone ("Public can read
  catalog recipes"), but write only your own rows via `owner_id = auth.uid()`
  — custom user recipes live in the same table as the seed catalog.

The `service_role` key, which bypasses RLS, is never shipped to the client
(ADR-0002).

## Alternatives considered, and why each lost

- **Authorization in application code.** Impossible here — there is no trusted
  application layer; client code is fully visible and editable by the user.
- **A thin server / Edge Function mediating all DB access.** Reintroduces the
  server ADR-0002 avoids, to re-implement what RLS already does in the database.
- **Public tables without RLS ("security by obscurity").** The anon key and
  table names are public; an unprotected table is world-readable and -writable.

## Consequences

**Good**

- Security is enforced in one place, close to the data, and applies no matter
  what the client does.
- No server code that could get authorization wrong.

**Bad / costs we accept**

- **RLS correctness is load-bearing to the whole product.** One wrong policy
  exposes or corrupts real user data. This is why it needs a *verification
  task*, not "we were careful" — it is a project invariant.
- Policies only protect the live DB if the SQL that defines them has actually
  been applied. A migration that hasn't run means the intended policy is not in
  force (some phase-3 tables are in this state pending migration — see Q6 /
  BUILD_PLAN).
- Anything RLS cannot express (rate limits, cross-user rules) has no home until
  Edge Functions are added (ADR-0002).

## Observed gap (to confirm in the RLS audit, not fixed here)

`user_equipment` has read / insert / update policies but **no delete policy**,
while `user_recipe_state` and `tasting_notes` each have delete. Either
intentional (equipment is only ever upserted, never row-deleted) or a gap.
Flagged for the RLS-audit task.

## Supersedes / superseded by

None.
