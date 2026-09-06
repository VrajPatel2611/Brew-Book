# ADR-0009 — Email + password is the only auth method for now

**Status:** Accepted (2026-09-06)

## Context

Three sign-in methods were built: **email + password** (the main path),
**Google OAuth** (`signInWithOAuth`), and **magic link** (`signInWithOtp`).
Supabase has both the Google and email providers enabled. Google's redirect
flow was also entangled in a recent production auth incident (origin / redirect
allowlist mismatch after the Vercel move — see ADR-0007).

Decision (Q7): while the app is still being built out, narrow to the smallest
auth surface that works, and add the others back later.

## Decision

**Email + password is the only user-facing auth method for now.** The Google
and magic-link entry points are removed from the UI. Their handler functions
(`handleGoogleSignIn`, `handleMagicLinkSubmit`) are kept in the code but
**dormant and clearly marked**, so re-integration is cheap. No Supabase
dashboard change is required to remove them from the product — with no UI
reaching those flows, leaving the providers enabled server-side is harmless;
they can be disabled later if desired.

Re-integration of magic link and/or Google is planned for "when the app is more
advanced," via a superseding ADR.

## Alternatives considered, and why each lost

- **Keep all three now.** More surface to keep configured and verified — each
  redirect flow needs the Site URL / allowlist correct per ADR-0007, and Google
  + magic link were the ones tangled in the auth incident. Email + password is
  self-contained by comparison.
- **Delete the Google/magic-link code entirely.** Re-integration is planned, so
  deleting now just means rewriting later. Parking the handlers dormant (git
  history also retains them) is cheaper. A mild preference, not absolute.

## Consequences

**Good**

- Smallest auth surface to keep working; one flow to verify.
- Fewer redirect-config footguns while the app stabilises on Vercel.

**Bad / costs we accept**

- Email + password still requires email confirmation (`mailer_autoconfirm` is
  off), so new users click a confirmation link that depends on the Site URL
  being correct (ADR-0007). Email is **not** free of the redirect-config
  dependency — it is just simpler than OAuth.
- No one-tap Google convenience for now.
- The dormant handlers are mild dead weight until re-integrated.

## Supersedes / superseded by

None. (A future ADR re-adding magic link / Google will supersede this.)
