# Decisions

One short entry per significant choice: context, choice, why, alternatives. Newest at the bottom.

---

## D-001 Build plan regrouped into 8 phases

- **Context:** The original plan had 15 phases, too many for the lab schedule's review points.
- **Choice:** Eight phases: P0 Foundation, P1 Core, P2 Character and scene engine, P3 School end to end, P4 Town and all buildings, P5 Backend, P6 Experience and Hindi, P7 Hardening and docs. Every task, gate and session note is kept unchanged.
- **Why:** Owner's request. Fewer, larger milestones map better onto lab evaluations.
- **Alternatives:** Keep 15 phases.

## D-002 Build tool and UI library: Vite + React + TypeScript (strict)

- **Context:** A browser game with many screens, built by one person who must explain it.
- **Choice:** Vite 8, React 19, TypeScript 6 with `strict` and `noUncheckedIndexedAccess`.
- **Why:** Vite is the standard, fast setup for a static single-page app. React is widely taught and documented. Strict TypeScript catches content and wiring mistakes at compile time. TypeScript is pinned to 6.x, the version the Vite template ships with; TypeScript 7 (the new native compiler) is too new for the lint tooling.
- **Alternatives:** Next.js (adds a server we don't need), Svelte (less familiar), plain JS (no type safety for content).

## D-003 Routing: `react-router` with `HashRouter`

- **Context:** The app must run on any static host, including ones without rewrite rules, and offline.
- **Choice:** `react-router` (the core package; `react-router-dom` is no longer needed) using `HashRouter`.
- **Why:** Routes live after `#`, so a refresh on `/#/town` never needs the server. `base: './'` in Vite keeps asset paths relative for the same reason.
- **Alternatives:** `BrowserRouter` (needs server rewrites), a hand-rolled router.

## D-004 State: `zustand` (with `persist` later)

- **Context:** Profiles, settings and progress must survive reloads and work offline.
- **Choice:** `zustand`.
- **Why:** Tiny, no boilerplate, and its `persist` middleware saves to `localStorage`. It is easy to explain: a store is a hook.
- **Alternatives:** Redux Toolkit (heavier), React context alone (no persistence, re-render issues).

## D-005 Styling: Tailwind CSS v4 with design tokens in CSS

- **Context:** One consistent visual style across every screen.
- **Choice:** Tailwind v4 via `@tailwindcss/vite`. Tokens are defined once in `src/index.css` under `@theme`.
- **Why:** Tokens become utility classes automatically (`bg-plaster`, `text-ink`), which keeps the palette and spacing consistent. There is no separate config file.
- **Alternatives:** CSS modules (more files, tokens by hand), styled-components (runtime cost).

## D-006 Animation: `motion`

- **Context:** The plan calls for character, dialogue and scene animation that respects calm mode.
- **Choice:** `motion` (formerly Framer Motion).
- **Why:** Declarative animations in React, gesture support for drag, and built-in reduced-motion handling.
- **Alternatives:** Only CSS animations (harder for sequenced scene motion), GSAP (licence and imperative style).

## D-007 Linting: ESLint 9 flat config + typescript-eslint + react-hooks + jsx-a11y

- **Context:** Code quality and accessibility mistakes should be caught before review.
- **Choice:** ESLint 9 with `@eslint/js`, `typescript-eslint`, `eslint-plugin-react-hooks` and `eslint-plugin-jsx-a11y`. `globals` supplies the browser and node global names.
- **Why:** Owner's choice. ESLint is familiar and easy to explain. jsx-a11y flags missing labels, bad roles and non-interactive click handlers, which supports the accessibility rules in CLAUDE.md. The hooks plugin catches broken effect dependencies.
- **Trade-off:** jsx-a11y 6.10 only supports ESLint up to 9, so ESLint is pinned to 9 even though ESLint 10 exists and 9 is past end-of-support. Revisit when jsx-a11y supports 10. Forcing past the peer-dependency conflict was rejected.
- **Alternatives:** oxlint (faster, but weaker accessibility rules), ESLint 10 without jsx-a11y.

## D-008 Testing: Vitest for units, Playwright for end-to-end

- **Context:** Rules, safety invariants and the demo path all need automated tests that CI runs.
- **Choice:** `vitest` for unit tests (files `*.test.ts` next to the code) and `@playwright/test` for end-to-end tests in `tests/e2e`, against the production build (`vite preview`), Chromium only.
- **Why:** Vitest reuses the Vite config, so aliases work in tests with no extra setup. Playwright drives a real browser, and axe accessibility checks plug into it later. Testing the built app proves what users actually get.
- **Alternatives:** Jest (separate transform config), Cypress (slower, heavier in CI).
