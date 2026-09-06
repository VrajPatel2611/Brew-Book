# ADR-0004 — Guest-first: localStorage is primary, cloud sync is additive

**Status:** Accepted — retroactively recorded (2026-09-06)

## Context

Brew Book must work for a stranger with no account (ADR-0005) and must not
break when Supabase is unconfigured, unreachable, or missing a migration
(ADR-0002/0003). At the same time, signed-in users expect their data
(tried / rating / pinned, custom recipes, owned equipment, tasting notes) to
follow them across devices. These two needs are reconciled by treating local
storage as the base layer and the cloud as an additive layer on top.

Repo confirms the split: guest data lives under its own keys
(`brewbook-userdata-v1`, `brewbook-equipment-v1`, `brewbook-tasting-<id>`,
`brewbook-recipes-v2`), while the signed-in copy is cached separately and
tagged by user id (`brewbook-userdata-cloud-v1`, `brewbook-equipment-cloud-v1`)
and the catalog is cached at `brewbook-catalog-cache-v1`. The bundled seed data
in `js/data.js` is the offline fallback for the recipe catalog itself.

## Decision

**localStorage is the primary, always-available store; Supabase is additive
sync for signed-in users.** Concretely:

- Every user-facing feature reads and writes localStorage first, so it works
  with no account and with no network.
- When signed in, the cloud is the source of truth and is cached locally
  (per-user keys) for instant paint and offline reads; on first sign-in with an
  empty cloud, the guest data in this browser is pushed up once
  (`maybeMigrateLocalToCloud` / `…EquipmentToCloud` / `…TastingNotesToCloud`).
- **The guest keys are never touched while signed in.** Signing out restores
  the exact pre-sign-in guest state with no wipe-and-restore logic, because the
  guest copy was never overwritten and the cloud cache is simply dropped.

## Alternatives considered, and why each lost

- **Cloud-only (require an account).** Violates the core product invariant that
  the app is usable — recipes and personal tracking — without signing in
  (ADR-0005), and breaks entirely offline or before Supabase is configured.
- **One shared store, overwritten on sign-in.** Simpler, but sign-out would
  either wipe the user's data or clobber the guest's; keeping two separate
  stores is what makes sign-out lossless.
- **IndexedDB instead of localStorage.** More capacity and async, but heavier
  API for a dataset this small (dozens of rows); localStorage's synchronous
  simplicity fits the no-build, single-file style (ADR-0001).

## Consequences

**Good**

- The app never hard-depends on the backend: no config, no network, or an
  un-run migration all degrade to a fully working local experience.
- Instant first paint from cache; no loading spinner gate on Supabase.
- Sign-out is lossless and needs no special code — the guest copy was untouched.

**Bad / costs we accept**

- Two copies of the same shape (guest keys vs per-user cloud cache) and a
  one-time migration path — more code and more states to reason about.
- Guest and cloud copies can diverge (e.g. changes made as a guest on device B
  after signing in on device A); the "push once when cloud is empty" rule
  resolves only the first-sign-in case, not ongoing multi-device guest edits.
- localStorage is synchronous, string-only, and size-limited; fine now, but a
  ceiling if per-user data ever grows large.

## Invariant grounding

This ADR is where two project invariants are enforced architecturally:
**"the app works without the backend"** and **"guest data is never lost."** Both
follow from localStorage-primary + never overwriting guest keys — see the
invariants section of `CLAUDE.md`.

## Supersedes / superseded by

None.
