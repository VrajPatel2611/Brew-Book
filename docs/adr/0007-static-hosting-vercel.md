# ADR-0007 — Static hosting on Vercel (zero-config)

**Status:** Accepted — retroactively recorded (2026-09-06)

## Context

The app is a set of static files with no build step (ADR-0001) and no server
(ADR-0002), so it can be served by any static host. It was originally *designed
and documented* for **GitHub Pages** (README still describes a Pages setup and
references a `.nojekyll` file — which is not actually present in the repo). It is
now **deployed on Vercel** at `brew-book-xi.vercel.app`, with **no
`vercel.json`** — i.e. Vercel's zero-config static hosting, wired to the GitHub
repo (`VrajPatel2611/Brew-Book`) so a push to `main` deploys.

The exact reason for choosing Vercel over finishing the GitHub Pages setup is
not recorded; this ADR captures the state as it now is.

## Decision

Host the static site on **Vercel with zero configuration** (no `vercel.json`),
deploying automatically from the GitHub `main` branch. GitHub remains the source
repository; Vercel is the deploy/CDN layer.

## Alternatives considered, and why each lost

- **GitHub Pages** (the original target). Works, and needs no second vendor, but
  lacks per-branch preview deploys and push-button rollback, and its custom-
  domain / config story is thinner. Vercel's auto-deploy-on-push and preview
  URLs fit the solo trunk-based workflow (ADR-0008) better.
- **Netlify / Cloudflare Pages.** Roughly equivalent static hosts; no strong
  reason to prefer one, and Vercel is already set up and working.
- **Self-hosting / a VPS.** Reintroduces a server to run and secure — the exact
  thing ADR-0002 avoids — for files a CDN serves for free.

## Consequences

**Good**

- Push to `main` deploys with no manual step (matches ADR-0008); HTTPS + CDN out
  of the box; instant rollback; per-branch preview URLs.
- Zero config to maintain — nothing to keep in sync as long as defaults suffice.

**Bad / costs we accept**

- **Changing the origin broke auth.** Moving off the originally-intended Pages
  origin to `*.vercel.app` meant the Supabase **Site URL / redirect allowlist**
  no longer matched, which silently broke sign-in until the dashboard config was
  corrected. Origin is now coupled to Supabase auth config — any future domain
  change must update Supabase too.
- **The README is now stale** — it still documents GitHub Pages as the host and
  references a non-existent `.nojekyll`. Doc-drift; a candidate to fix.
- The public URL is `*.vercel.app` until a custom domain is added.
- With no `vercel.json`, any future need for custom headers, redirects, or a
  security policy (e.g. a CSP) means introducing that config surface.

## Supersedes / superseded by

None. (If a custom domain or `vercel.json` is later adopted, that is a change to
deployment config, not a reversal of this decision — note it here or in a
successor if it rises to the level of a decision.)
