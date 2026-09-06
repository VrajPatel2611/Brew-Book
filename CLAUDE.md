# Brew Book — session context

**What this is.** A public coffee-recipe web app ("coffee passport"): ~38 recipes
from 22 countries, boarding-pass theme, world map, flavor wheel, tasting journal,
guided brew timer. Vanilla JS/CSS with **no build step**, Supabase (Postgres +
Auth) as the only backend accessed directly from the browser under RLS, shipped
as a PWA on Vercel. Aimed at real users at some scale — not a portfolio piece.

**How we work.** Spec before code. One task at a time, with a full stop between.
Don't write application code that has no written, agreed spec — stop and ask.
Decisions live in `docs/adr/` and are **never edited** — supersede with a new ADR.

---

## Invariants — must never break

1. **The recipe catalog is never gated behind auth.** (ADR-0005)
   *Enforced by:* RLS `Public can read catalog recipes`; the client never routes
   catalog/detail through an auth check; seed catalog bundled in `js/data.js` so
   recipes render with no network/Supabase.
2. **Guest data is never lost; the app works without the backend.** (ADR-0004)
   *Enforced by:* localStorage is primary; guest keys are never overwritten while
   signed in, so sign-out is lossless.
3. **RLS correctly isolates each user's rows.** (ADR-0003)
   *Enforced by:* policies keyed on `auth.uid()`. **Not yet mechanically tested**
   — invariant tests are accepted (ADR-0010) but unbuilt; today this rests on the
   policies + manual review. Highest-risk invariant.
4. **The `service_role` secret never ships to the client.** (ADR-0002)
   *Enforced by:* only the anon key is in `js/config.js`.

> Enforcement is currently policy + discipline + manual verification. Automated
> enforcement (ADR-0010) is pending its BUILD_PLAN task.

## If your task is X, read Y

| Task | Read |
| --- | --- |
| Why vanilla / no build, `?v=N` | ADR-0001 |
| Backend / why no server | ADR-0002 |
| Database schema, RLS, policies | `supabase/*.sql`, ADR-0003, DATA_MODEL *(unwritten)* |
| Offline / guest / cloud sync | ADR-0004 |
| Auth, sign-in/up, account screen | ADR-0003, ADR-0009 |
| Anything about the catalog being public | ADR-0005 |
| PWA / caching / service worker | ADR-0006, `sw.js` |
| Deploy / hosting / domains | ADR-0007 |
| How to ship / workflow | ADR-0008, ADR-0010 |
| Tests / CI | ADR-0010, TEST_STRATEGY *(unwritten)* |
| Add a feature | write a mini PRD + UX note first, then BUILD_PLAN *(unwritten)* |

## Rules easy to break by accident

- **Bump `?v=N`** on a JS/CSS `<script>`/`<link>` in `index.html` whenever you
  change that file — else returning users get stale assets. (ADR-0001)
- **Never** put the `service_role` key (or any secret) in `js/config.js` or any
  shipped file. Only the anon key. (ADR-0002)
- **Don't gate recipes** behind sign-in. Only World map + Collection are gated.
  (ADR-0005)
- **Don't overwrite guest localStorage keys** (`brewbook-*`) while signed in —
  the per-user cloud cache is separate. (ADR-0004)
- All `<script>`s share **global scope**; load order in `index.html` matters.
  (ADR-0001)
- **ADRs are never edited** — write a superseding one and link it.
- Changing the deploy origin means updating **Supabase Site URL + redirect
  allowlist** or auth breaks. (ADR-0007)
- `js/animations.js` is **not loaded** by `index.html` — `BREW_ANIM`/`runSplash`
  are undefined; every call is a guarded no-op. Don't assume it runs.
- **`main` is production** (Vercel auto-deploys). Verify UI changes in the browser
  before committing. (ADR-0008)

## Repository layout

```
index.html            app shell; all <script>/<link> tags + ?v=N live here
css/  tokens.css       design tokens (light/dark)
      base.css
      components.css    ~all component styles
js/   config.js         Supabase URL + anon key (public)
      data.js           38 seed recipes + taxonomies (offline source of truth)
      app.js            ~3,700 lines: screens, auth, sync, most logic
      icons.js          SVG icon/bean helpers
      worldmap.js       D3 world map screen
      flavorwheel.js    SCA flavor wheel screen
      animations.js     NOT loaded (dead) — see rule above
sw.js                 service worker (stale-while-revalidate)
manifest.json         PWA manifest
supabase/*.sql        schema, seed, phase2, phase3-* migrations
docs/adr/             decision records (never edited)
docs/build-log/       one log per finished task
brew-book-v2/         abandoned empty scaffold — ignore/delete
```

## Commands

- **Run:** `python3 -m http.server 4321` (see `.claude/launch.json`), open
  `http://localhost:4321`.
- **Test:** none yet — planned (ADR-0010).
- **Lint:** none.
- **Deploy:** `git push origin main` → Vercel auto-deploys.

## Current state / still undecided

- **Prod auth is broken:** Supabase **Site URL still `localhost:3000`** (not the
  Vercel URL) → new-user email confirmation links are dead. Dashboard fix, user
  only. Top priority. (Q6)
- **Phase-3 migrations not run** (`phase3-foundation/-pinned/-tasting-notes`,
  re-seed) → equipment/pinned/tasting-notes cloud sync no-ops; their RLS not live.
- **Not yet written:** DATA_MODEL, TEST_STRATEGY, BUILD_PLAN. Tests/CI accepted
  (ADR-0010) but unbuilt.
- **UX/UI improvement** is a wanted theme — needs a screen-by-screen UX audit to
  become concrete tasks, not one vague task.
- **Deferred features:** re-add magic link / Google (ADR-0009), tasting-journal
  flavor-wheel picker, India-specific roaster picks.
- **Open question for scale:** custom user recipes live in the public `recipes`
  table and are world-readable — moderation/abuse is unaddressed. Decide before
  real users can publish.
- Dead weight to clean up: `js/animations.js`, dormant auth handlers, unused
  `.account-divider`/`.account-google-btn` CSS, stale README (says GitHub Pages).
