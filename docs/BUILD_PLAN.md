# BUILD_PLAN

Remaining work, in dependency order. Ownership matters here: several tasks are
**dashboard/SQL actions only you can do** (backend is your weak spot, and I have
no access to your Supabase project) — for those I prep and verify, you execute.

Estimates are rough. IDs are stable; deferred items sit at the bottom.

Legend — **Owner:** who does the hands-on part. **You** = Supabase dashboard /
running SQL. **Me** = code + docs + verification.

---

## P0 — Unblock production (urgent: you want real users, sign-in is down)

### T-01 · Fix production auth config
- **Owner:** You (dashboard) · Me (verify) · **Depends:** none · **Est:** 10 min + verify
- **Files:** none (Supabase → Authentication → URL Configuration)
- **Spec:** ADR-0007, ADR-0009
- **Do:** Site URL → `https://brew-book-xi.vercel.app`; Redirect URLs add
  `https://brew-book-xi.vercel.app/**` and `http://localhost:4321/**`.
- **Acceptance:** my redirect test resolves a Vercel `redirect_to` to the Vercel
  domain (not `localhost:3000`); one real email signup receives a confirmation
  link on the Vercel domain and can confirm + sign in.

### T-02 · Run phase-3 migrations + re-seed
- **Owner:** You (SQL editor) · Me (prep/verify) · **Depends:** none · **Est:** 15 min
- **Files:** `supabase/phase3-foundation.sql`, `phase3-pinned.sql`,
  `phase3-tasting-notes.sql`, `seed.sql`
- **Spec:** `supabase/README.md`, ADR-0003, ADR-0004
- **Acceptance:** the four tables exist with RLS enabled; a signed-in user's
  equipment / pinned / tasting notes survive a reload from the cloud (not just
  localStorage); live `recipes.method` ids match `data.js` canonical ids.

## P1 — Safety net (because real users, per ADR-0010)

### T-03 · RLS audit + close the `user_equipment` delete gap
- **Owner:** Me (analysis + SQL) · You (apply) · **Depends:** T-02 · **Est:** 1–2 h
- **Files:** new `supabase/rls-fixes.sql` (if needed), feeds DATA_MODEL
- **Spec:** ADR-0003
- **Acceptance:** a per-table policy matrix documented; every table proven to
  isolate rows by `auth.uid()`; `user_equipment` has a delete policy or a
  recorded reason it doesn't; a cross-user read/write attempt is denied.

### T-04 · DATA_MODEL document (as it is LIVE)
- **Owner:** Me · **Depends:** T-02 · **Est:** 2–3 h
- **Files:** `docs/DATA_MODEL.md`
- **Spec:** `supabase/*.sql`, ADR-0002/0003/0004
- **Acceptance:** every table/column/type/constraint/index + RLS policy
  documented to match the live DB (spot-checked), with invariants + enforcement.

### T-05 · Tests + CI (invariant smoke suite + GitHub Actions)
- **Owner:** Me · **Depends:** T-01, T-02, T-03 (stable auth/db) · **Est:** 1–2 days
- **Files:** dev-only `package.json`, `tests/`, `.github/workflows/ci.yml`,
  `docs/TEST_STRATEGY.md`
- **Spec:** ADR-0010
- **Acceptance:** tests cover the 4 invariants (catalog public, guest data
  survives sign-out, RLS isolation, no `service_role` in the bundle) + a boot
  smoke test; CI runs on push and blocks a red build; TEST_STRATEGY written,
  incl. an honest "what these can't catch" section. Shipped app stays vanilla.

### T-07 · Decide custom-recipe visibility at scale
- **Owner:** You (decision) · Me (options + impl) · **Depends:** none · **Est:** 30 min decide
- **Files:** an ADR; maybe an RLS change
- **Spec:** ADR-0002/0003/0005
- **Acceptance:** a recorded decision (ADR) on whether user recipes are public,
  private, or moderated; RLS adjusted to match. *Decide before users can publish.*

## P2 — UX (your stated priority: the app is "still lacking")

### T-06 · UX audit → prioritized fix list
- **Owner:** Me (audit) · You (pick) · **Depends:** none (parallel) · **Est:** 3–4 h
- **Files:** `docs/UX_AUDIT.md`
- **Acceptance:** every screen reviewed at mobile/tablet/desktop; a ranked list
  of concrete UI/UX issues + proposed fixes to choose from. Each fix you pick
  then becomes its own task with a mini PRD/UX note before any code.

## P3 — Debt / cleanup (low risk)

### T-08 · Remove dead code + fix stale docs
- **Owner:** Me · **Depends:** none · **Est:** 1 h
- **Files:** delete `js/animations.js`; remove unused `.account-divider` /
  `.account-google-btn` CSS; fix `README.md` (still says GitHub Pages); gitignore
  or delete `brew-book-v2/`
- **Spec:** ADR-0001/0007/0009
- **Acceptance:** no dead references; README reflects Vercel; app verified still
  working. **Note:** the dormant `handleGoogleSignIn`/`handleMagicLinkSubmit`
  stay until the magic-link/Google re-add decision (ADR-0009) — not part of this.

## Deferred (scope later, each with its own mini PRD/UX note)

- **T-09** · Tasting-journal flavor-wheel picker (the interactive wheel deferred
  earlier).
- **T-10** · India-specific roaster picks (public-launch item).
- **T-11** · Re-add magic link / Google sign-in (supersedes ADR-0009) — when the
  auth/redirect story is solid.
