# Sprint log

One entry per phase (BUILD_PLAN §12): goal, done, next. This is the process evidence for the report.

## P0 Foundation (2026-10-14)

- **Goal:** An empty but production-shaped shell. Tooling, CI, i18n, design tokens and docs are ready before any feature.
- **Done:** Vite + React + TS strict scaffold with aliases; ESLint, Vitest and Playwright with passing tests; GitHub Actions CI (lint, unit, build, e2e, gated deploy), green on GitHub; `t()` over `strings.en.json`; design tokens, Noto Serif fonts, calm mode, focus ring; docs skeleton. The build plan was regrouped into 8 phases.
- **Next:** P1 Core, starting with `content/types.ts` and the content validation script.
