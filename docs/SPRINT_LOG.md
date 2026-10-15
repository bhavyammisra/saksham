# Sprint log

One entry per phase (BUILD_PLAN §12): goal, done, next. This is the process evidence for the report.

## P0 Foundation (2026-10-14)

- **Goal:** An empty but production-shaped shell. Tooling, CI, i18n, design tokens and docs are ready before any feature.
- **Done:** Vite + React + TS strict scaffold with aliases; ESLint, Vitest and Playwright with passing tests; GitHub Actions CI (lint, unit, build, e2e, gated deploy), green on GitHub; `t()` over `strings.en.json`; design tokens, Noto Serif fonts, calm mode, focus ring; docs skeleton. The build plan was regrouped into 8 phases.
- **Next:** P1 Core, starting with `content/types.ts` and the content validation script.

## P1 Core (2026-10-14)

- **Goal:** The rules, the content contract and a safe app shell, all tested, before any game art.
- **Done:** `content/types.ts` plus a validator in CI; `rules.ts` with 58 requirement-named tests; persisted store; all 12 routes with start redirect and profile guard; shell with Help button, nav and settings (calm motion persists); calm Help Centre from `help.json` with government sources; onboarding and profile picker; synthesised sound manager; 16 safety-invariant e2e tests.
- **Next:** P2 Character and scene engine, starting with the paper-doll SVG character (ends at the 🛑 character gate).

## P2 Character and scene engine (2026-10-14 to 2026-10-15)

- **Goal:** A player character and a data-driven scene engine, with the look approved on one real scene before more scenes are built.
- **Done:**
  - SVG character rig: 10 skin tones, 8 hairstyles, 6 hair colours, 5 outfits, patka/hijab/dupatta, glasses, bag.
  - Six poses and five moods.
  - Character builder in onboarding and Me, plus portraits.
  - Scene engine as a pure reducer: walking, parallax, hotspots, "Things to do here", dialogue with retry, objectives, Mitthu.
  - Engine sandbox and the School look-dev backdrop.
  - 155 unit and 34 e2e tests.
- **Feedback:** The owner approved the character on 2026-10-14, then on 2026-10-15 said they don't like the cover page or the character design. Rework is required before Phase 3.
- **Rework (2026-10-15):** cover screens, character and customiser redesigned (D-024, D-025); School scene restyled to match (D-026). The owner approved all three; both gates passed. PR #3 merged.
- **Next:** P3 School end to end.

## P3 School end to end, MILESTONE A (2026-10-15)

- **Goal:** One building playable from the town to results, saved across reloads, proven by a demo-path test.
- **Done:**
  - School story (Lata at the gate, two gentle retries, a good ending), rights card and a 6-question quiz (D-027). Every card carries a fact-check record.
  - `/play/:id`: Mitthu's arrival line, scene, card flip, quiz with explanations and the hint round, results with stars, badges and unlocks (D-028).
  - Temporary town hub from `buildings.json` (D-029).
  - 171 unit and 41 e2e tests (including the demo path), all green. Found and fixed the real cause of a flaky walking test.
- **Waiting on the owner:** fact-check the School card (SETUP.md §6).
- **Merged:** PR #4, 2026-10-15.
- **Next:** P4 Town and all buildings, on branch `p4-town`.

## P4 Town and all buildings (from 2026-10-15), in progress

- **Goal:** A walkable town linking every building, all four buildings playable, plus the Book, Me, Credits, demo mode, the sort game and the community screens.
- **Done so far:**
  - Walkable town on the same engine: hub scenes, host-controlled locked doors with gentle replies, teasers, a Help door, start outside the last door (D-030).
  - Mitthu points the way; a once-only return celebration; finished places get garlands, lanterns and more bunting; Lata appears after the School (D-031).
  - Performance: removing full-screen blend modes and live blurs took the town from 33 to 59 fps, the School from 30 to 47, and the cover forms from 10–15 to 60 (headless Chromium).
  - Book, Me (badges, settings, switch player), Credits and demo mode (D-032).
  - 189 unit and 52 e2e tests green.
- **Next:** Dhaba, Home and Panchayat scenes.
