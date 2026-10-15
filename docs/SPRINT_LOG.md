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

## P2 Character and scene engine (2026-10-14 to 2026-10-15), in progress

- **Goal:** A player character and a data-driven scene engine, with the look approved on one real scene before more scenes are built.
- **Done:**
  - SVG character rig: 10 skin tones, 8 hairstyles, 6 hair colours, 5 outfits, patka/hijab/dupatta, glasses, bag.
  - Six poses and five moods.
  - Character builder in onboarding and Me, plus portraits.
  - Scene engine as a pure reducer: walking, parallax, hotspots, "Things to do here", dialogue with retry, objectives, Mitthu.
  - Engine sandbox and the School look-dev backdrop.
  - 155 unit and 34 e2e tests.
- **Feedback:** The owner approved the character on 2026-10-14, then on 2026-10-15 said they don't like the cover page or the character design. Rework is required before Phase 3.
- **Next:** clarify the feedback, redesign the cover page and the character, re-run both gates, open and merge the P2 PR, then start P3.
