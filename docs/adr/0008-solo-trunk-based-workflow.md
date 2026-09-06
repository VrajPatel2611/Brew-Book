# ADR-0008 — Solo trunk-based workflow: push to main, no PR/CI

**Status:** Accepted — retroactively recorded (2026-09-06)

## Context

Brew Book has one developer. There is no team to review changes, and the repo
has no `.github/` — no pull-request process and no CI. Commits go straight to
`main`, and `main` is what Vercel auto-deploys (ADR-0007), so **`main` is
production.** The release ritual is manual: verify the change in the browser,
bump the affected file's `?v=N` (ADR-0001), commit, push.

## Decision

Work **trunk-based**: commit directly to `main`, no feature branches required,
no pull requests, no CI pipeline. The quality gate is **manual verification
before commit** — run it, look at it in the browser, check for console errors —
not an automated check. Deploy happens by pushing `main`.

## Alternatives considered, and why each lost

- **PR-based flow with required review.** The value of a PR is a second
  reviewer; with one developer there is none, so it would add ceremony and slow
  iteration for no gain. (AI-assisted review before a commit provides some of
  the "second set of eyes" without the process.)
- **Feature branches + Vercel preview deploys.** Available and occasionally
  useful for a risky change (Vercel builds a preview URL per branch), but as a
  *standing* rule it is overhead a solo developer rarely needs. Left as an
  option to reach for, not a requirement.
- **A CI pipeline (tests / lint on push).** The natural place to enforce the
  project invariants mechanically — but there are no tests yet (see Q4). Until
  that is decided, CI would only run a linter, which is not worth wiring alone.

## Consequences

**Good**

- Minimal ceremony; fast iteration that fits a solo student with no deadline.
- One branch to reason about; no merge overhead.

**Bad / costs we accept**

- **`main` is production with no gate in front of it.** A broken push is live on
  Vercel immediately; the only safety net is manual verification and Vercel's
  one-click rollback.
- **Nothing mechanical protects the invariants.** With no CI and no tests, the
  project's must-never-break properties (ADR-0003 RLS, ADR-0004 guest data,
  ADR-0005 un-gated catalog) rest entirely on the developer remembering to
  check them. This is the gap Q4 exists to close.
- No review means single-person blind spots reach production unfiltered.
- A mistaken commit affects the only branch there is.

## When this would change

If Q4 is answered "add tests," the natural follow-on is a minimal CI gate on
push (run the smoke tests, block a red deploy) — which would amend or supersede
the "no CI" half of this decision via a new ADR. The "solo, no PR" half is
expected to hold as long as it is a solo project.

## Supersedes / superseded by

None.
