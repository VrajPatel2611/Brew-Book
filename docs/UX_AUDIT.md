# UX audit — 2026-09-06 (T-06)

A screen-by-screen review to turn "the UI/UX is still lacking" into concrete,
ranked fixes you can pick from. **Nothing here is implemented.** Each item you
choose becomes its own task with a mini PRD/UX note before any code.

## Method / honesty

Inspected **live this pass:** Landing (desktop), Recipes home (desktop +
mobile 375×812), Recipe Detail (desktop + mobile), account dropdown (mobile).
Measurements via `getBoundingClientRect`, not eyeballing. Reviewed **earlier
this session:** Flavor Wheel, World Map, Brew Mode, Collection. **Not audited
yet** (listed as low-priority items below): light theme, tablet width, the
signed-in state of the gated screens.

Overall: **desktop is strong** — the landing, brew-of-the-day hero, and Recipe
Detail all read well and look intentional. The problems are concentrated on
**mobile**, which matters because a real-users coffee app skews mobile.

---

## P1 — High (fix first)

### UX-01 · Mobile header eats 35% of the screen; nav wraps to two rows
- **Evidence:** at 375×812 the header bottom sits at **283px = 35% of the
  viewport**; the four nav tabs wrap onto **2 rows** (Recipes / World Map /
  Flavor Wheel, then Collection), followed by a row of 6 icon buttons and a
  "0 BREWED" pill. Same header on every screen, so Recipe Detail loses the same
  35% before its title.
- **Why it matters:** the primary content (hero, recipe title) is pushed far
  down on first paint on the most common device class.
- **Proposed fix (pick one):** (a) a **bottom tab bar** on mobile for the 4
  screens + move the icon actions into an overflow/account sheet — the app-native
  pattern; or (b) a **hamburger** that collapses nav + actions into one menu,
  leaving a slim top bar. Either should get the header under ~15% of the
  viewport. *Recommend (a) bottom tab bar* — it also puts navigation in thumb
  reach.

### UX-02 · Touch targets below the 44px minimum
- **Evidence:** nav tabs **32px** tall, filter pills **26px**, "Start Brewing"
  **37px**; **55** interactive elements measure under 40px on the home screen.
- **Why it matters:** WCAG 2.5.5 / platform guidance is ~44px; 26px pills are
  fiddly to tap, especially the filter row.
- **Proposed fix:** enforce `min-height:44px` (and adequate horizontal padding)
  on interactive controls on touch widths; bump filter-pill and nav-tab hit
  areas. Mostly a CSS pass.

## P2 — Medium

### UX-03 · Recipe Detail hero: the decorative sphere dominates mobile
- **Evidence:** on mobile the large gradient sphere sits above the title, so the
  recipe name / ratio / method land well down the page after the 35% header +
  breadcrumb + portrait.
- **Proposed fix:** on mobile, shrink or inline the portrait (or move it beside
  a more compact hero) so the title + ratio + "Start brewing" are near the top.

### UX-04 · Account / sign-in dropdown clips off the left edge on mobile
- **Evidence:** dropdown `left: -5px` at 375px wide (width 294) — hangs ~5px
  off-screen. This is the sign-in surface, which matters more now that email +
  password is the only method (ADR-0009) and real users are the goal.
- **Proposed fix:** clamp within the viewport, or make it a **centered bottom
  sheet / full-width panel** on mobile rather than a dropdown.

### UX-05 · Filter controls: two small rows that can feel cramped
- **Evidence:** serve (All/Hot/Iced) + difficulty (Any/Easy/Medium) on one row,
  category chips on another; pills are 26px with small mono text.
- **Proposed fix:** consolidate into clearer, larger, horizontally-scrollable
  rows (tie into UX-02 sizing); make sure they scroll rather than wrap.

## P3 — Low / verify (not inspected this pass)

### UX-06 · Light-theme sweep
- Tokens exist for light mode (ADR/`tokens.css`), but it wasn't audited here.
  Past bugs were "invisible/clipped" shapes (a border-opacity token used as text
  color). Do a dedicated light-mode pass across all screens.

### UX-07 · Tablet (≈768px) width
- Only mobile and desktop were measured. Verify the grid column count and header
  behaviour at the tablet breakpoint.

### UX-08 · Gated screens, signed-in
- World Map and Collection were reviewed signed-out (gate state) / earlier this
  session. Re-audit their populated, signed-in state.

---

## Suggested order

UX-01 first (biggest visible win, and it changes the shell every other screen
sits in), then UX-02 (a CSS pass that also touches the filter pills in UX-05),
then UX-03/04. UX-06/07/08 are quick verification passes to schedule after.

Tell me which of these to turn into tasks and I'll write the mini PRD/UX note
for the first one before touching code.
