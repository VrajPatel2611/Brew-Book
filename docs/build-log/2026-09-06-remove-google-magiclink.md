# Build log — Remove Google + magic-link sign-in from the UI

**Date:** 2026-09-06
**Task id:** T-AUTH-01 (provisional — predates the BUILD_PLAN; reconcile when it exists)
**Spec:** docs/adr/0009-auth-email-password-only-for-now.md

## 1. Summary
Removed the "Continue with Google" and "Email me a sign-in link instead"
buttons from the account panel. Email + password is now the only sign-in
method in the UI. The two handler functions are kept in the code, dormant.

## 2. The problem
Google OAuth and magic link add auth surface (each needs a correct Supabase
redirect/Site-URL config) while the app is still being built, and Google was
tangled in the recent Vercel auth incident. Decision (Q7 / ADR-0009): ship the
smallest working auth surface now, re-add the others later.

## 3. Definition of done (verbatim from the agreed plan)
- Remove: the `gsvg` Google-icon const, the `account-divider` "or", the
  "Continue with Google" button, the "Email me a sign-in link instead" button,
  and the two onclick wirings (`gBtn`, `mlBtn`).
- Keep, dormant: `handleGoogleSignIn` and `handleMagicLinkSubmit`, commented,
  pointing to ADR-0009.
- Leave alone: Supabase providers, `reportAuthErrorFromUrl`, the unused
  `.account-divider` / `.account-google-btn` CSS.
- Prove: account panel shows only email + password + "Create one", no console
  errors, email sign-up/sign-in still wires up.
- Ship: bump `app.js?v=61`, commit.

## 4. What was built
The account dropdown (`renderAccountDropdownBody` in `js/app.js`) now renders:
email field → password field → primary Sign in/Create account → switch link →
hint → edit-equipment → units. No third-party auth affordances.

## 5. Step by step
- Deleted the `gsvg` const (only the Google button used it).
- Deleted the `.account-divider` "or", the Google button, and the magic-link
  button from the panel's `innerHTML`.
- Deleted the `gBtn` and `mlBtn` lookups + onclick wirings.
- Added a `DORMANT — … see docs/adr/0009` comment above each of the two
  handler functions so they read as parked, not forgotten (the difference
  from real dead code).
- Bumped `index.html` to `app.js?v=61`.

## 6. Where we diverged from the spec
No divergence. Built exactly as planned. The dormant-handlers choice is a
deliberate call recorded in ADR-0009 (parking beats delete-then-rewrite given
planned re-integration).

## 7. Problems hit
None.

## 8. Verification (what was run, what it printed)
- `node -e "new Function(fs.readFileSync('js/app.js'))"` → "app.js parses OK".
- `grep` for `acctGoogleBtn|acctMagicLinkBtn|gsvg|account-divider|Continue with
  Google|sign-in link instead` in js/app.js → "none — all UI refs gone".
- Browser (localhost:4321), account panel opened via DOM state:
  `hasGoogleBtn:false, hasMagicBtn:false, hasDivider:false, hasEmail:true,
  hasPw:true, hasPwBtn:true, hasSwitch:true, handlersDormantPresent:true`.
- Screenshot confirmed the panel shows only Email / Password / Sign in /
  "Create one", no gap where the buttons were.
- Console errors: only 6× `ERR_NAME_NOT_RESOLVED` for external hosts (fonts,
  CDN, Supabase) the offline sandbox can't reach — unrelated to this change;
  all local assets incl. `app.js?v=61` loaded 200.

## 9. What this changes for you
Signed-out users now see only email + password in the account menu. Nothing
about existing sessions or stored data changes. Google/magic-link users (if
any created accounts that way) can still sign in via email + password if they
have a password; a pure-OAuth account would need magic link or Google re-added
to get back in — worth knowing before this goes to real users.

## 10. Known debt left behind
- `handleGoogleSignIn` / `handleMagicLinkSubmit` are dormant code until
  re-integrated (closed by the future ADR that re-adds them).
- `.account-divider` / `.account-google-btn` CSS is now unused — left in place
  intentionally; a later cleanup task can remove it.

## 11. How to undo it
`git revert <this commit>` restores both buttons and their wiring. Or, since
the handlers still exist, re-add the two `<button>` lines and their onclick
wirings in `renderAccountDropdownBody`.
