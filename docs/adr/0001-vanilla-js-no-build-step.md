# ADR-0001 — Vanilla JS/CSS with no build step

**Status:** Accepted — retroactively recorded (2026-09-06)

## Context

Brew Book is a solo-built, design-led coffee-recipe web app, already shipped
(Phases 1–3 live). It is authored as plain `.html`, `.js`, and `.css` files
loaded with `<script>` and `<link>` tags — no bundler, transpiler, package
manager, or framework. The client is ~9,900 lines across `index.html`, seven
`js/` files, and three `css/` files. Third-party libraries (GSAP, D3,
supabase-js, Lenis) are pulled from CDNs at runtime, not installed.

This decision predates this record. It is written down now so it is not
reversed by accident in a future session.

## Decision

The frontend stays **vanilla JS/CSS with no build step.** Source files are
served as authored. No framework (React/Vue/Svelte), no bundler (Vite/webpack),
no transpiler (TypeScript/Babel), no `package.json` in the shipped app.
External libraries are loaded from CDNs by pinned URL. Cache invalidation for a
changed file is done manually with a `?v=N` query param on its `<script>` /
`<link>` in `index.html`, bumped whenever the file changes.

## Alternatives considered, and why each lost

- **Framework + bundler (React/Vite, etc.).** Adds a toolchain, a
  `node_modules`, and a build/deploy step to a project whose author is
  design-strong but not tooling-deep, for an app that is content-and-animation
  heavy but logic-light. The cost (build breakage, dependency upkeep, deploy
  complexity) buys little for a single-page recipe browser. The empty
  `brew-book-v2/` scaffold in the repo is an abandoned start down this path and
  is not being pursued.
- **A light build for bundling/minification only (e.g. esbuild).** The app
  loads fine as-is over static hosting; minification savings don't justify a
  build the author would have to maintain and debug.
- **TypeScript without a framework.** Would require a compile step — breaking
  "no build" — for type safety the project instead enforces through discipline
  and, going forward, targeted tests.

## Consequences

**Good**

- Zero toolchain to break; a fresh clone runs by serving the folder. Deploy is
  "copy files."
- No dependency-install vulnerability surface; CDN libs are pinned by URL.
- Any session (human or AI) can edit a file and see the result immediately with
  no build knowledge.

**Bad / costs we accept**

- **Manual `?v=N` cache-busting is a recurring footgun.** Forgetting to bump a
  version ships stale assets to returning users. Partly mitigated by the
  service worker (see ADR-0006).
- No type checking, no tree-shaking, no module system. Every `<script>` shares
  global scope, so name collisions are possible and load order in `index.html`
  matters.
- Large single files (`app.js` ~3,700 lines) because there is no bundling to
  make many small files ergonomic.
- CDN reliance: a CDN outage or a CSP change can break a library at runtime.

## Supersedes / superseded by

None.
