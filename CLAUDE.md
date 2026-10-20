# Saksham

A web game that teaches Indian children (8 to 16) their legal rights. The child walks through explorable scenes, talks to characters, helps solve a problem, and earns a rights card. This is a **UCS503 Software Engineering Lab project** (TIET Patiala), so both the working app and the documentation are graded.

**Current work is governed by `docs/BUILD_PLAN.md`. Read it first. Resume at the first unchecked box.**

## Where we are (update this at the end of every session)

- **Phase:** 6 of 0–7 (Experience and Hindi), on branch `p6-experience`. Phases 4 and 5 are merged (PRs #5 and #6). Done in P4: the walkable town (D-030), its guidance, celebration and decorations (D-031), the Book, Me, Credits and demo mode (D-032), and the Dhaba scene (D-033). Then, from owner feedback, a new title menu, new-game flow and modern customiser (D-034), and the full-screen game with modern scenes (prototype D-035, built D-036). The owner approved it, the Home scene is done (D-037), a knee-bending walk and no voice (D-038), and going in through doors, with the scale kept as in D-036 (D-039), the Panchayat scene (D-040), so all four buildings are written, the sort game at the Dhaba and the Panchayat (D-041), and Community (D-042), so every P4 task is done. In P5 so far: the Supabase project, its auth settings, the database schema with RLS, the RLS tests and the app's Supabase client (D-043). Then the teacher page: accounts and classes with join codes (D-044), and children joining a class from Me, each player with their own anonymous login (D-045), syncing progress and answers to the class (D-046), the live teacher dashboard with the real Class Mission (D-047), proof that the game works with no backend and offline, checked in CI too (D-048), and content review (hashes, `/reviewer`, the "Reviewed" tick; D-049). Phase 5 is merged (PR #6). Splash v2 is done (D-050). **Next: P6 › Sound v2.** The Lab Eval I report is built from `tmp-report/` (git-ignored; see the handoff note).
- **Checkpoints:** the table at the top of `docs/BUILD_PLAN.md` shows every phase, 🛑 gate and owner-only task at a glance. All gates so far are approved. Owner still to do: fact-check the School, Dhaba, Home and Panchayat cards (SETUP.md §6) and the Help Centre and Community places (§5), become a reviewer and publish them (§4), confirm the font licences.
- **Merged to `main`:** P0 (PR #1), P1 (PR #2), P2 (PR #3, including the owner's redesign of the cover screens, character, customiser and School scene style; D-024 to D-026) P3 (PR #4, School end to end, MILESTONE A; D-027 to D-029) P4 (PR #5, the town, all four buildings, the full-screen redesign, the sort game and Community; D-030 to D-042) and P5 (PR #6, the backend: classes, sync, the teacher dashboard and content review; D-043 to D-049).
- **Latest session notes:** bottom of `docs/BUILD_PLAN.md` (the "Handoff" note has the exact next task and the rules learned so far). **Every decision so far:** `docs/DECISIONS.md` (D-001 to D-050).

## Start of every session

1. Read this file, then `docs/BUILD_PLAN.md`, from the top through the latest session notes.
2. `git status` and `git log --oneline -5`. Make sure you are on the phase branch, not `main`.
3. `npm ci` if needed, then run lint, typecheck, validate, test and e2e, so you start from green.
4. Resume at the **first unchecked box** in BUILD_PLAN. Stop at every 🛑 gate.

## Map of the code (details in docs/ARCHITECTURE.md)

- `content/`: typed JSON. `types.ts` is the contract, plus `strings.en.json`, `help.json`, `npcs.json`, `buildings.json`, `credits.json`, `community.json` and `scenes/*.json` (`sandbox`, `school`, `dhaba`, `home`, `panchayat`, and the `town` hub).
- `src/lib/`: `rules.ts` (pure game rules), `store.ts` (persisted zustand, version 2), `i18n.ts`, `calm.ts`, `sound.ts`, `supabase.ts` (client or null), `classroom.ts` (join and leave a class, per player), `sync.ts` (background sync to the class), `review.ts` and `published.ts` (content review and the "Reviewed" tick) and `database.types.ts` (generated).
- `supabase/`: `migrations/` (schema, RLS, RPCs, views) and `tests/rls.test.sql`. The project is `iggetuuoghdoyppdlppy`; apply migrations and run the tests through the Supabase MCP (`apply_migration`, `execute_sql`), then check `get_advisors`.
- `src/character/`: the SVG character rig (`Character.tsx`, `spec.ts`, `character.css`), `CharacterBuilder`, `Portrait`, `Mitthu`.
- `src/engine/`: the pure scene logic (`movement.ts`, `story.ts`, `sceneState.ts` = `sceneReducer`; the player has `x` and a `depth`), plus `Scene.tsx` (the full-screen frame: camera, HUD, menu words, History, map), `Dialogue.tsx` (the strip) and `WalkPad.tsx`. The hosting screen can pass `locked` exits, `startX`, `startFlags`, `skipIntro`, a Mitthu `guide` and the `map` places; the engine never knows why.
- `src/art/`: scene art by key (`index.ts` registry; `modern.tsx` the shared kit and lighting rules: sky, clouds, distance, paving, trees, windows; `school.tsx`, `dhaba.tsx`, `home.tsx`, `panchayat.tsx`, `town.tsx`; `sandbox.tsx` and `style.tsx` are the old style, kept for the dev sandbox). The cover screens are plain CSS (`src/components/cover.css`).
- `src/play/`: `CardReveal`, `Quiz`, `Sort`, `Results` (the end of a building; its games play in order), `RightsCard` (card front, back and details, shared with the Book), `badgeText`, `useMap` (the map's places and travel). `src/lib/scenes.ts`: building id → scene, `cardsInTown()`.
- `src/screens/` (Title (the main menu at `/`), Onboarding, Profiles, Town, Play, Book, Me, Community, Teacher and TeacherDashboard, Reviewer, Credits, HelpCentre, dev pages), `src/components/` (Shell, Splash, HelpButton, SettingsDialog + SettingsControls, DemoMode, Button, Page, CoverScreen, ReturnCelebration, AreaMap, GameFrame).
- `scripts/validate-content.ts`: `npm run validate`, also run in CI.
- Dev pages: `/#/dev/characters` (every character combination), `/#/dev/scene` (engine sandbox).

## Tooling notes (Windows machine)

- GitHub CLI is installed at `C:\Program Files\GitHub CLI\gh.exe`. Old terminals may not have it on PATH, so call it by full path if `gh` isn't found. Auto-merge is turned off for this repo: after CI is green, merge with `gh pr merge <n> --merge`. The owner prefers merge commits, so the `P<n>:` commits stay in history.
- In Git Bash, arguments that start with `/` (such as `/dev/characters`) are rewritten into Windows paths. Prefix the command with `MSYS_NO_PATHCONV=1`, and pass Windows paths (`cygpath -w`) for output files.
- The browser pane's screenshots can be stale or time out. For reliable visual checks, take screenshots with a small throwaway Playwright script against `npm run dev` (keep such scripts out of the repo).
- Vite's file watcher can miss two writes to the same file in quick succession. If the page shows old code, restart the dev server.
- Scale (D-039): the owner prefers the D-036 scale (people 400 units, buildings fully in view). Keep new scenes at that scale.
- Calm mode stops every animation except a character's walk (`:not(.ch[data-pose='walk'] *)` in `index.css`, `scene.css`, `character.css`). Keep that exception in all three if you touch them.
- Performance rule (D-030): no full-screen `mix-blend-mode`, no `backdrop-filter`, no `filter: blur` on animated pictures, and no animations inside very wide SVG layers. Without a GPU each one halves the frame rate.

## Owner and ownership

This project is being built from scratch and must end up **fully understood by its owner**, who will have to explain it in a viva.

- Keep code simple and readable. Prefer plain, boring solutions over clever ones.
- At the end of each task, give a 3-line "what I built and why" so the owner can learn from it.
- Record every significant choice in `docs/DECISIONS.md` (one short entry each: context, choice, why, alternatives).
- Never add a dependency without saying why it is needed.

## Commands

(Filled in during Phase 0. Keep them accurate.) Node 24+. First run: `npm ci` and `npx playwright install chromium`.

- `npm run dev`: Vite dev server
- `npm run build`: `tsc -b && vite build` into `dist/`
- `npm run lint`: ESLint (typescript-eslint, react-hooks, jsx-a11y)
- `npm run typecheck`: `tsc -b` (app, configs and e2e tests)
- `npm run test`: Vitest unit tests (`src/**/*.test.ts`, `scripts/*.test.ts`)
- `npm run validate`: content validator (scene graphs, flags, NPCs, UI string keys, Help Centre sources)
- `npm run content:hashes`: prints every reviewable content item with its SHA-256 hash (the same ones `/reviewer` sends)
- `npm run e2e`: Playwright against the built app (`tests/e2e/`). It builds and serves on port 4173 itself. Locally it runs 3 browsers at once; close heavy apps if tests time out. To test a build without the backend (as CI's `e2e-local-only` does): `VITE_SUPABASE_URL= VITE_SUPABASE_ANON_KEY= npx playwright test`.

Before saying a task is done: lint, typecheck, test and build must all pass.

## Non-negotiable safety rules

- "Need help?" is reachable from every screen except the Help Centre itself.
- The Help Centre is calm: no motion, sound, rewards, points, and never red. Its copy comes from content exactly as written.
- Children never see other children's free text. Pledges are presets; "Ask an Expert" questions stay on the device.
- The only personal data collected is a first name. No child email or password, ever.
- No streaks, no individual leaderboards, no comparing children. Class goals are cooperative.
- The child is always the helper or witness. Never stage or depict harm to a child. Sensitive stories use the `gentle` tone.
- Legal text renders exactly as authored in content. Never paraphrase it in code.
- No analytics SDKs, no third-party tracking, no secrets in the client or the repo. The Supabase service-role key never goes near this project.

## Architecture rules

- TypeScript strict. Content is typed by `content/types.ts`; game rules are pure functions in `src/lib/rules.ts` with unit tests.
- The scene and dialogue engines are data-driven: a scene plays from its JSON alone, and **no engine code may refer to a building by id**.
- Every user-facing string goes through `t()` from day one (English first, Hindi later). Never hard-code UI text in components.
- Everything interactive is a `<button>` or `<a>`; tap targets at least 48px; dialogue in an `aria-live` region; every drag or walk interaction has a keyboard and tap alternative.
- `prefers-reduced-motion` and the "Calm motion" setting set `data-calm` on `<html>`; calm mode disables ambient motion, parallax, screen movement, and confetti.
- Local-first: every feature must work with no network and with no Supabase env vars. The backend only adds sync.

## Git

- Small commits: `P<n>: <task>`. Never commit secrets or `.env` files.
- Work on a feature branch per phase and open a pull request; CI must be green before merging.

## When blocked on something only the owner can do

Creating the Supabase project, GitHub repository variables, licence checks, and legal fact-checks are the owner's job. Write the step in `docs/SETUP.md`, stop that task, and tell the owner.
