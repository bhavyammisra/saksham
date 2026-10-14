# Saksham

A web game that teaches Indian children (8 to 16) their legal rights. The child walks through explorable scenes, talks to characters, helps solve a problem, and earns a rights card. This is a **UCS503 Software Engineering Lab project** (TIET Patiala), so both the working app and the documentation are graded.

**Current work is governed by `docs/BUILD_PLAN.md`. Read it first. Resume at the first unchecked box.**

## Owner and ownership

This project is being built from scratch and must end up **fully understood by its owner**, who will have to explain it in a viva.

- Keep code simple and readable. Prefer plain, boring solutions over clever ones.
- At the end of each task, give a 3-line "what I built and why" so the owner can learn from it.
- Record every significant choice in `docs/DECISIONS.md` (one short entry each: context, choice, why, alternatives).
- Never add a dependency without saying why it is needed.

## Commands

(Fill these in during Phase 0 and keep them accurate.)

- `npm run dev`, `npm run build`, `npm run lint`, `npm run typecheck`, `npm run test`, `npm run e2e`

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
