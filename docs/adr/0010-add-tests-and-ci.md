# ADR-0010 — Add a minimal test suite + CI gate for the invariants

**Status:** Accepted (2026-09-06)
**Supersedes:** the "no CI" decision in ADR-0008 (the "solo, no PR" half of
ADR-0008 still stands; ADR-0008 is left unedited per the never-edit-ADRs rule).

## Context

The app is now aimed at real users at some scale (Q5), not a portfolio piece.
ADR-0008 recorded "no CI, no tests," and stated outright that nothing mechanical
protects the project's invariants — they rest on the developer remembering to
check them. For a product with real users, an unenforced **security** invariant
(RLS per-user isolation) or a regression that gates the public catalog is no
longer an acceptable risk. Q4 decision: add tests + CI.

## Decision

Introduce a **minimal automated test suite** and a **CI gate that runs on push
to `main`**, scoped to the invariants and a few high-value smoke checks — **not**
broad coverage. A failing gate blocks the deploy. Detail lands in TEST_STRATEGY
and a BUILD_PLAN task; the shape:

- **Invariant tests first:** RLS actually isolates per-user rows; the recipe
  catalog is readable with no auth; guest data survives sign-out.
- **A boot smoke test:** the app loads and the core screens render.
- **CI:** GitHub Actions on push / PR to `main`.

**Key boundary:** this needs a test runner, which is the first thing to touch
the "no `package.json`" line of ADR-0001. It does **not** reverse ADR-0001 for
the shipped app. Test + CI tooling lives in **dev/CI only** — a dev-only
`package.json` / `node_modules`, never shipped to the browser. The app itself
stays vanilla, no build. Keeping that line clean is the constraint.

## Alternatives considered, and why each lost

- **Keep manual verification (status quo).** Rejected given Q5: real users make
  an unenforced security invariant an unacceptable risk.
- **Full test coverage.** Disproportionate for a solo project; invariant-focused
  tests give most of the protection for a fraction of the effort.
- **Tests without CI.** Tests nobody runs decay; the gate on push is what makes
  them real.

## Consequences

**Good**

- The invariants become mechanically enforced — the whole point.
- Regressions in auth isolation, catalog access, or guest data are caught before
  they deploy to real users.

**Bad / costs we accept**

- Introduces a dev toolchain (test runner, dev `node_modules`, a CI workflow) —
  the first crack in ADR-0001's zero-tooling simplicity, confined to dev/CI.
- The tests and workflow must be maintained.
- **RLS testing is the hard part:** verifying policies needs a test Supabase
  project (or a way to run queries under different JWTs). That setup cost is
  real and gets worked out in TEST_STRATEGY, not hand-waved here.

## Supersedes / superseded by

Supersedes the CI portion of ADR-0008.
