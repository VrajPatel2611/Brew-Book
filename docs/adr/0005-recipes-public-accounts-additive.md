# ADR-0005 — Recipes are public and un-gated; accounts are additive

**Status:** Accepted — retroactively recorded (2026-09-06)

## Context

The one thing Brew Book must do is let a stranger with any brewing gear find a
coffee they can make and follow it end to end — **without gating the recipes
behind a login.** This was settled in an earlier planning decision (the "full
public reframe," Decision 1 / Option A) and is not to be relitigated; it is
recorded here so it stays settled.

The build reflects it. In `index.html` / `js/app.js`: Recipes, Recipe Detail,
the Flavor Wheel, and Brew Mode are always open; World map and Collection carry
a `.screen-gate` and are shown behind a "Sign in to…" panel until authenticated
(`refreshCurrentGate` toggles `.is-locked`). The landing is described in code as
"a front door, not a gate." The landing copy states it outright: *"All 38
recipes are free to explore — no account needed."*

## Decision

The recipe experience is **fully public, no account, no teaser wall:** the
catalog, every recipe's detail and steps, guided Brew Mode, and the Flavor
Wheel all work signed-out. **Accounts are purely additive** and unlock only the
things that are inherently personal or cross-device:

- Cloud sync of personal state (tried / rating / pinned, custom recipes, owned
  equipment, tasting notes).
- The **World map** of where recipes come from.
- The personal **Collection**.

## Alternatives considered, and why each lost

- **Gate everything behind signup.** Maximises data capture and conversion, but
  directly contradicts the product's one job — a stranger could no longer just
  read a recipe. Rejected on mission grounds.
- **Freemium teaser (show N recipes, then a wall).** Same objection in softer
  form: it still gates the recipes, which is the thing that must never be gated.
- **Gate nothing at all, including World and Collection.** Rejected: those
  features are inherently per-user and multi-device — they have no meaning
  without an identity to attach to, so requiring an account for *them* is
  honest, not a dark pattern.

## Consequences

**Good**

- Fulfils the core mission; lowest possible friction to the main use.
- Every recipe is a shareable public URL (good for sharing and discovery).
- No signup wall / dark pattern; the landing invites rather than blocks.

**Bad / costs we accept**

- Less signup pressure and lower conversion — accepted, because conversion is
  not the goal (see Q5 on commercial intent, currently portfolio-framed).
- The only incentive to sign in is the value of the map, the Collection, and
  cross-device sync, so those features have to be genuinely worth it.
- Two navigation states (locked / unlocked) that must be built and verified for
  every gated screen.

## Invariant grounding

This ADR is the source of the invariant **"the recipe catalog is never gated
behind authentication."** It is enforced by: the RLS policy "Public can read
catalog recipes" (ADR-0003), the client never routing catalog/detail through an
auth check, and the seed catalog bundled in `js/data.js` so recipes render even
with no network or no Supabase (ADR-0004). See `CLAUDE.md`.

## Supersedes / superseded by

None.
