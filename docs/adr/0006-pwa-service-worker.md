# ADR-0006 — Installable PWA with a stale-while-revalidate service worker

**Status:** Accepted — retroactively recorded (2026-09-06)

## Context

Brew Book is meant to feel like an app you keep — openable from a phone home
screen, usable on a flaky connection in a kitchen. With no build step (ADR-0001)
and static hosting (ADR-0007), the only way to get installability and offline
behaviour is a hand-written `manifest.json` and a hand-written `sw.js`. Both
exist and are live.

`manifest.json`: `display: standalone`, `start_url`/`scope` `./`, portrait,
`theme_color`/`background_color` `#241a14`, and 192/512 + maskable icons.
`sw.js`: `CACHE_NAME = 'brewbook-v2'`, a stale-while-revalidate fetch handler,
same-origin only, with auth callbacks bypassed (ADR-0002 / the auth fix).

## Decision

Ship as an **installable PWA** with a **stale-while-revalidate** service worker:

- Every same-origin GET is served instantly from cache when present, and always
  re-fetched from the network in the background to refresh the cache for next
  time. This is what keeps an installed copy from getting silently stuck on an
  old version, and it is why routine CSS/JS edits do **not** need a
  `CACHE_NAME` bump — the file refreshes in place on next request regardless of
  its `?v=N`.
- `CACHE_NAME` is bumped only for a breaking change that must invalidate every
  installed cache at once (it was bumped to `v2` to purge cached auth codes).
- **Never cached:** cross-origin requests (Supabase, fonts, CDN libs) are left
  to the network untouched; auth-callback URLs are bypassed entirely (ADR-0002).
- On `controllerchange` (a newer worker took over) the page reloads once to
  pick up fresh files — but **deferred while the user is on Recipe Detail or
  mid-brew** (`bbSafeToReload()` in `index.html`), so an update never yanks the
  page out from under an in-progress brew.

## Alternatives considered, and why each lost

- **No service worker (plain website).** No install, no offline; a returning
  user with a cached page could get stuck on stale assets with no refresh path.
- **Cache-first (precache everything, update on version bump).** Faster offline,
  but every content/CSS/JS change would require a manual cache-version bump or
  users stay stale — a heavy tax on the no-build workflow. Stale-while-
  revalidate self-heals instead.
- **Network-first.** Defeats the point offline and adds latency on every load
  for a catalog that rarely changes.
- **A Workbox-generated worker.** Would reintroduce a build/tool dependency
  (ADR-0001) to generate ~80 lines we can write by hand.

## Consequences

**Good**

- Installable, works offline, and self-heals stale assets without per-change
  version bumps.
- Update-on-`controllerchange` keeps installed copies current without a manual
  "new version available" prompt, and the deferral protects an active brew.

**Bad / costs we accept**

- Stale-while-revalidate means the **very first** load after a change still
  serves the old file once, then updates for next time — a one-load lag.
- A hand-written worker is easy to get subtly wrong (the auth-caching bug it
  just had is the cautionary example); it has no tests.
- Cache correctness lives in one file with no CI check — a bad `sw.js` deploy
  can strand every installed copy until `CACHE_NAME` is bumped again.

## Relationship to ADR-0001

The service worker partially mitigates the manual `?v=N` cache-busting footgun
from ADR-0001 (stale files self-heal on next request), but does not remove it —
the very-first-load lag above is exactly why `?v=N` still matters for a change
that must land immediately.

## Supersedes / superseded by

None.
