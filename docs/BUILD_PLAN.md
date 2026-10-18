# SAKSHAM: Build Plan (fresh start)

Put this file at `docs/BUILD_PLAN.md` in a **new, empty repo**. `CLAUDE.md` in the repo root points here. Work top to bottom and resume at the first unchecked box. This plan is the only source of truth: there is no earlier codebase to reuse, and nothing here assumes one.

## 0. How to work

- One phase per session. Tick each box, then commit `P<n>: <task>`.
- After every task: `npm run lint`, `npm run typecheck`, `npm run test` and `npm run build` pass.
- End of each phase: append 3 to 6 lines to **Session notes** (done, hacky, next task) and give the owner a short "what I built and why" summary.
- **Owner gates** are marked 🛑. At a gate, stop, show the owner what exists (screenshot, running app, or file) and wait for approval. Do not continue past a gate on your own.
- Things only the owner can do (Supabase project, GitHub variables, legal fact-check, licence checks) go into `docs/SETUP.md`. Stop that task and tell the owner.
- Record every significant choice in `docs/DECISIONS.md` (context, choice, why, alternatives). Never add a dependency without saying why.
- There is no deadline. Quality and understanding beat speed. Do not cut corners to go faster, and do not add features that are not in this plan.

## Checkpoints (keep this current: it is the one-glance status)

Where the project stands against every phase, owner gate and owner-only task. Details are in the phase checklists (§9) and the session notes at the bottom.

**Phases**

| Phase | Status | Pull request | Decisions |
| --- | --- | --- | --- |
| P0 Foundation | ✅ merged | #1 | D-001 to D-012 |
| P1 Core | ✅ merged | #2 | D-013 to D-018 |
| P2 Character and scene engine, plus the owner's redesign | ✅ merged | #3 | D-019 to D-026 |
| P3 School end to end (**MILESTONE A**) | ✅ merged | #4 | D-027 to D-029 |
| P4 Town and all buildings | ✅ merged 2026-10-18 | #5 | D-030 to D-042 |
| P5 Backend | 🔄 branch `p5-backend`; backend core and the teacher page done (D-043, D-044), next: children joining a class | | D-043, D-044 |
| P6 Experience and Hindi | ⬜ | | |
| P7 Hardening and documentation | ⬜ | | |

**🛑 Owner gates**

| Gate | Status |
| --- | --- |
| Character look (P2) | ✅ approved 2026-10-14; reopened on feedback; ✅ re-approved 2026-10-15 after the redesign (D-024) |
| Cover screens (owner feedback, P2) | ✅ approved 2026-10-15 (D-025) |
| Title menu, new game and customiser redesign (owner feedback, P4) | ✅ owner moved on to gameplay 2026-10-16 (D-034) |
| New gameplay frame: prototype (owner feedback, P4) | ✅ approved 2026-10-16 after one revision (D-035) |
| New gameplay frame and modern scenes, built (P4) | ✅ approved 2026-10-16 (D-036) |
| Owner's play-test feedback: walk, doors, scale, voice (P4) | ✅ applied 2026-10-16 (D-038, D-039); the owner confirmed the walk and the door entry on their laptop 2026-10-18 |
| Look development, School scene style (P2) | ✅ approved 2026-10-15 after the restyle (D-026) |
| Supabase setup (P5, first task) | ✅ done 2026-10-18: the owner created the project; Claude set the rest (D-043) |

**Owner-only tasks still open** (none of these block P4; all must be done before children use the app)

| Task | Where |
| --- | --- |
| Fact-check the School rights card (Article 21A matched the Ministry of Education page; the rest is unverified) | SETUP.md §6, `content/scenes/school.json` › `card.review` |
| Fact-check the Dhaba rights card (quotes matched secondary sources only) | SETUP.md §6, `content/scenes/dhaba.json` › `card.review` |
| Fact-check the Home rights card (quotes matched secondary sources only) | SETUP.md §6, `content/scenes/home.json` › `card.review` |
| Fact-check the Panchayat rights card (quotes matched PRS and Indian Kanoon) | SETUP.md §6, `content/scenes/panchayat.json` › `card.review` |
| Fact-check the Help Centre numbers and sentences, and the Community page's places that help | SETUP.md §5, `content/help.json` and `content/community.json` › `review` |
| Confirm the three font licences (Inter added in D-034) | `docs/ASSET_LICENSES.md` |
| Vercel deploy (only when a public URL is wanted) | SETUP.md §3 |

**Phase 4 tasks** (detail in §9)

| Task | Status |
| --- | --- |
| Walkable town scene (doors, locked replies, teasers, Help door) | ✅ D-030 |
| Mitthu's guidance, return celebration, town changing with progress | ✅ D-031 |
| Book, Me, Credits, badges, demo mode | ✅ D-032 |
| Dhaba, Home and Panchayat scenes | ✅ Dhaba (D-033), Home (D-037), Panchayat (D-040). Each needs its legal text fact-checked |
| Sort game, in at least two buildings | ✅ D-041 (the Dhaba and the Panchayat) |
| Community: Pledge Wall, Class Mission, Ask an Expert, Places that help | ✅ D-042 |

## 1. Context

- Saksham is a web game that teaches Indian children (8 to 16) their legal rights. It started as a Smart India Hackathon idea (SIH1281, Ministry of Law and Justice).
- It is now the **UCS503 Software Engineering Lab project** (TIET Patiala, BE Third Year CoE/CSE). The working app and the documentation are both graded. The report (Mid-Semester Evaluation) covers: software bid, project overview, use cases (diagram and templates), activity and swimlane diagrams, DFD levels 0/1/2, an IEEE-format SRS, and user stories. It is written after the build, **from this repo**, so keep the documentation hooks in §12 current.
- The owner is building this to be fully theirs and has to explain it in a viva. Keep the architecture small, the code plain, and the decisions written down.
- Actors: **Child**, **Teacher / NGO facilitator**, **Content reviewer** (DLSA or faculty), and the **System**.

## 2. The product

**Walkable scenes, not a puppet show.** The child's own character walks through a small Indian town and its buildings, talks to people, notices things, and helps solve a problem. Each building teaches one right.

Core loop for one building:

1. **Arrive**: the child walks into the scene. Mitthu (a parrot guide) introduces the place in one line.
2. **Explore**: walk left and right, talk to characters, examine objects. Hotspots show a prompt when the player is near.
3. **Understand the problem**: conversations and clues reveal what is wrong. The child is the helper or witness, never the one harmed.
4. **Act**: dialogue choices decide how to help (who to tell, what to say). Weaker choices play a gentle consequence and Mitthu offers another try. The best choice leads to the good ending.
5. **Rights card**: a collectible card explains the right, with text matched to the age band.
6. **Mini-game**: a short quiz (a sort game comes later).
7. **Results**: stars, card goes into the Book, badges, next building unlocks.

Buildings: **School** (education), **Dhaba** (child labour), **Home** (safety, gentle tone), **Panchayat** (child marriage). Two locked teasers: Playground and Cyber Adda. A calm **Help Centre** is reachable from everywhere.

Two age bands: `young` (8 to 11) and `teen` (12 to 16). The band changes the card text and adds teen-only quiz questions.

### Art direction

Grounded and warm, **not cartoonish**: realistic proportions, layered vector scenes, golden light, subtle grain, light shafts, depth blur on far layers, real Indian materials and colours (painted plaster, tiles, wood, brass, marigold garlands). **Updated 2026-10-15 at the owner's request (D-024, D-026):** a painted game-character look, with thin ink outlines, hard-edged cel shadows and deeper colours on characters and near scenery (thinner outlines further back, none on distant hills). No big-head mascots. Mitthu is the only slightly stylised character. The visual style must be consistent across every scene: one palette family, one lighting logic.

Honest constraint: the look depends on art quality. So there is a **look-development gate** (Phase 2) where the owner approves the style on one scene before any other scene is built.

## 3. Scope

**In scope (commit)**

1. Walkable scene engine, driven by JSON, with keyboard, touch joystick and tap-to-walk.
2. A customisable player character (paper-doll SVG) used across scenes, dialogue portraits and results.
3. School, Dhaba, Home and Panchayat as full scenes, a walkable town hub, rights cards, quiz and sort games, Book, Me, Help Centre, badges.
4. Thin backend on Supabase: teacher accounts, class codes, live progress dashboard, live class mission, content review workflow.
5. Local-first sync and a full offline mode.
6. Unit tests, end-to-end tests, safety-invariant tests, CI.
7. English first, then Hindi with the same content structure.
8. Experience upgrade: splash, layered sound, dialogue voice pass, living scenery.

**Optional** (only after Phase 7 is green): spot-the-danger mini-game, text-size and dyslexia-friendly font settings, printable parent sheet, unlockable character items earned with stars.

**Stretch, not committed** (documented as future work in the report, do not start): a real 3D town and 3D characters (Three.js or React Three Fiber).

**Out of scope**: real child-to-child chat, real expert messaging, analytics or ad SDKs, photo upload or face scanning, native apps, payments, voice recording, realtime sockets (polling is fine).

## 4. Safety rules (non-negotiable)

- "Need help?" is visible on every screen except the Help Centre.
- The Help Centre has no animation, sound, confetti, points, badges or rewards, and is never red. Its text comes from content exactly as written.
- Children never see another child's free text. Pledges are presets. "Ask an Expert" questions stay on the device.
- The only personal data collected is a first name (letters and spaces, max 20). A child never gets an email or password.
- No streaks, no individual leaderboards, no comparing children. Class goals are cooperative.
- The child is always the helper or witness. Never show or describe harm to a child. `gentle` tone (Home, and any heavy story) uses soft sparkles, quieter sound, no screen shake, and a results note linking to Help.
- Legal text renders exactly as authored in content. Never paraphrase it in code.
- Backend: teachers see only their own classes, children see only their own rows (row-level security, tested). A teacher can rotate or disable a join code, remove a student, and delete a class with all its student data. A student can leave a class.
- No analytics, no third-party requests from the client except the Supabase project URL. No secrets in the client or repo: the Supabase **anon** key is public by design; the service-role key must never be used here.
- Privacy note for the SRS: India's Digital Personal Data Protection Act, 2023 has rules for children's data. Document data minimisation and "the teacher or school is the consenting party" as design constraints, and flag that current legal requirements must be verified. This is not legal advice.

## 5. Tech stack (decide in `docs/DECISIONS.md`, change only with a reason)

- Vite, React, TypeScript (strict), Tailwind v4, `motion` for animation, react-router (HashRouter so any static host works), zustand with persist.
- Vitest (unit), Playwright (end-to-end and accessibility via axe), oxlint or ESLint.
- Supabase (Postgres, Auth, RLS, RPC) from the browser with `@supabase/supabase-js`. Hosting on Vercel (or any static host) with preview deploys. GitHub Actions for CI.
- Fonts and assets: only licences that allow bundling (SIL OFL, MIT, CC0, CC BY with credit). Everything is committed to the repo and listed in `docs/ASSET_LICENSES.md`. Nothing loads from a CDN at runtime.
- Folders: `content/` (typed JSON), `src/engine/` (scene, dialogue, games), `src/character/`, `src/screens/`, `src/components/`, `src/lib/` (`rules.ts`, `store.ts`, `i18n.ts`, `sound.ts`, `sync.ts`, `supabase.ts`), `supabase/` (migrations, tests, seed), `tests/e2e/`, `docs/`.

## 6. Scene and content contract (`content/types.ts`)

Everything a scene needs lives in JSON. The engine never refers to a building by id.

```ts
type Tone = "normal" | "gentle";
type Mood = "neutral" | "happy" | "worried" | "surprised" | "sad";

interface SceneDef {
  id: string;                    // "school"
  title: string; right: string; tagline: string;
  tone: Tone;
  width: number;                 // scene width in design units (wider than the screen)
  layers: { id: string; art: string; speed: number }[];  // speed = parallax factor, 1 = foreground
  walkable: { minX: number; maxX: number };
  blockers?: { x1: number; x2: number }[];
  spawn: { x: number };
  ambience?: string;             // sound bed key
  hotspots: Hotspot[];
  objectives: { id: string; text: string; requires: string[] }[]; // flags that complete it
  startNode: string;
  nodes: Record<string, StoryNode>;
  card: Card;
  games: GameDef[];              // quiz first, sort later
}

interface Hotspot {
  id: string; x: number; label: string;
  kind: "npc" | "object" | "exit";
  art?: string; npc?: string;    // npc id for portraits and voice
  node?: string;                 // story node to open
  showIf?: string[]; hideIf?: string[]; // flags
}

interface StoryNode {
  id: string; speaker: string; text: string; mood?: Mood;
  set?: string[];                // flags to set when shown
  next?: string;
  choices?: { label: string; to: string; kind?: "good" | "weak" }[];
  end?: "good" | "retry";        // retry returns to the last choice node
  fx?: "push" | "cheer" | "gasp"; // optional; engine ignores unknown values
}

interface Card { id: string; title: string; kid: string; teen: string; ifItHappens: string; law: string; source: string; }
```

Rules for the engine:

- Walking: `A/D` or arrow keys, an on-screen joystick on touch, and tap-to-walk. A visible, keyboard-reachable **"Things to do here" list** lets players (and screen-reader users) jump to any hotspot without walking.
- Hotspot interaction: a prompt appears within about 120 design units; `E`, Enter or tap opens the dialogue. Dialogue uses an `aria-live="polite"` region, a typewriter that finishes on tap, and a read-aloud button.
- A scene is complete when its `end: "good"` node is reached and all objectives are satisfied. Then card, game, results.
- Mitthu follows the player and gives a hint after about 20 seconds of inactivity, using the next incomplete objective.
- Calm mode (`data-calm`): no parallax, no ambient loops, no screen movement, no confetti, instant transitions.

## 7. Game rules (`src/lib/rules.ts`, pure functions, fully unit-tested)

- **Stars (max 3 per building)**: 1 for finishing the scene; +1 if the game score is 60% or more; +1 if the game score is 90% or more **and** the scene had no retries. Keep the best result per building; replays can only raise stars.
- **Game score** = correct on the first attempt / total. For the quiz, only questions shown for the player's band count.
- **Unlocks**: School is always unlocked. Completing building N in `buildingOrder` unlocks N+1. Teasers are never playable.
- **Band rules**: `young` sees `card.kid` with a "Tell me more" that reveals `card.teen`; `teen` sees `card.teen`. Questions with `band: "teen"` appear only for `teen`.
- **Hint round**: if the quiz score is under 60%, offer Mitthu's hint round (replays the missed questions with the explanation shown first). It does not change the score.
- **Recommended building**: the first unlocked building with fewer than 3 stars.
- **Merge rule for sync**: stars and best score take the max; cards, badges, marigolds and pledges take the union.
- **Demo mode**: typing `d e m o`, or long-pressing the logo for 2 seconds, unlocks every playable building and shows a "Demo" chip.

## 8. Data model (Postgres, all tables with RLS)

| Table | Key columns | Notes |
| --- | --- | --- |
| `user_roles` | `user_id`, `role` (`teacher`, `reviewer`, `admin`) | Teachers self-register as `teacher`; `reviewer` is granted by SQL. |
| `classes` | `id`, `teacher_id`, `name`, `join_code` (unique, 6 chars, no 0/O/1/I), `code_active`, `mission_target`, `created_at` | Teacher owns. |
| `students` | `id` (= child's `auth.uid()`), `class_id`, `first_name`, `band`, `avatar` (jsonb), `created_at` | Created only through `join_class`. |
| `progress` | `student_id`, `building_id`, `stars` (0..3), `best_score`, `completed`, `updated_at` | Primary key (`student_id`, `building_id`); max-merge. |
| `student_extras` | `student_id`, `cards[]`, `badges[]`, `marigolds[]`, `pledges[]` | Union merge. |
| `quiz_attempts` | `id`, `student_id`, `building_id`, `question_id`, `correct`, `at` | No free text. |
| `content_items` | `id`, `kind`, `lang`, `content_hash`, `status` (`draft`, `in_review`, `published`, `rejected`), `submitted_by`, `reviewed_by`, `reviewed_at`, `reviewer_note` | Text is not stored here. |
| `content_events` | `id`, `item_id`, `actor_id`, `from_status`, `to_status`, `note`, `at` | Append-only audit log. |

Views (`security_invoker`): `class_progress_summary`, `class_question_stats`, `class_mission`.

RPC (`security definer`, `set search_path = ''`, validate inputs): `join_class(code, first_name, band, avatar)`, `leave_class()`, `rotate_join_code(class_id)`, `delete_class(class_id)`, `submit_content_for_review`, `review_content(item_id, decision, note)`.

RLS summary: a child reads and writes only their own rows; a teacher reads rows in their own classes and manages their own classes; a reviewer reads content tables and acts only through the review RPC; children read content `status` only. Every policy has a test in `supabase/tests/` using two teachers and two child sessions.

**Content hash rule**: a script hashes each reviewable item (card text, quiz set, help copy) and upserts it as `draft`. A changed hash resets the item to `draft`. The app shows "Reviewed ✓" only when the bundled hash matches a `published` row. Hindi items are separate rows and stay `draft` until a fluent reviewer approves them.

## 9. Phases

### Phase 0: Foundation

- [x] Create the Vite React TypeScript project in the empty repo. Add Tailwind v4, react-router (HashRouter), zustand, `motion`. Set path aliases `@` (src) and `@content`.
- [x] Add scripts `dev`, `build`, `lint`, `typecheck`, `test`, `e2e`. Set up Vitest and Playwright with one trivial passing test each.
- [x] CI workflow: jobs `lint`, `unit` (typecheck + vitest), `build`, `e2e`, then `deploy` on `main` only. Add `.env.example` (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).
- [x] `src/lib/i18n.ts` with `t(key, vars)` and `content/strings.en.json`. From now on **no hard-coded UI text**.
- [x] Design tokens in the stylesheet (palette, type scale, spacing, radii, shadows) following the art direction in §2, plus the calm rules and a visible focus ring. Set the owner-approved font (an open-licence font that supports Devanagari).
- [x] Create `docs/` skeleton: `DECISIONS.md`, `ARCHITECTURE.md`, `SETUP.md`, `ASSET_LICENSES.md`, `TEST_REPORT.md`.

Done when: CI is green and the app shows an empty shell.

### Phase 1: Core

#### Rules and content contract

- [x] `content/types.ts` from §6. A validation script that checks every scene JSON (all node targets exist, a `good` end exists, flags used in `showIf` are set somewhere, every UI key exists in the strings file).
- [x] `src/lib/rules.ts` from §7 with unit tests for every rule (stars thresholds, retries, best-of replay, unlocks, band filtering, hint round does not change the score, recommended building, merge rule). Name tests with the requirement IDs from §11.
- [x] `src/lib/store.ts`: persisted zustand store (profiles, active profile, settings, per-profile progress). The store only calls `rules.ts`.

#### App shell and safety basics

- [x] Routes: `/` redirect, `/profiles`, `/onboarding`, `/town`, `/play/:id`, `/book`, `/help`, `/community`, `/me`, `/credits`, `/teacher`, `/reviewer`.
- [x] Shell: top bar and mobile bottom nav, a **Help button on every screen except `/help`**, settings (sound, music, narration, calm motion, language). `data-calm` syncs with settings and `prefers-reduced-motion`.
- [x] **Help Centre** (calm): helplines, "how to tell a trusted adult" steps, rights list, disclaimer, all from `content/help.json` exactly as written. Source every number from an official page and put the source in the file.
- [x] Profile picker and onboarding (hello, first name with validation, age band). The avatar step is added in Phase 2.
- [x] Sound manager (`src/lib/sound.ts`): a WebAudio context created on the first user gesture, one `sound.play(name)` API, respects settings, plays nothing on `/help`, half gain in `gentle` scenes.
- [x] Safety-invariant e2e tests: Help button on every route except `/help`; `/help` is calm and silent; the name field rejects digits and symbols; no screen shows free text from another child.

### Phase 2: Character and scene engine

#### Character

- [x] Paper-doll SVG character: shared rig (head, hair, body, outfit, headwear) with realistic proportions. Options: 8 to 10 skin tones, 6 to 8 hairstyles, 5 or more hair colours, a few outfits (school uniform, kurta, salwar kameez, casual), headwear (patka, hijab, dupatta), glasses, school bag. Spec is a small JSON object.
- [x] Animations on the shared rig (CSS or `motion`): idle, walk, talk, wave, react (gasp, cheer). Facing left or right.
- [x] Character builder screen (preview, rows of choices, "Surprise me"), added to onboarding and Me. Dev route `/dev/characters` showing every outfit and headwear combination for alignment checks.
- [x] Portrait renderer (head and shoulders with a mood) for dialogue and results.

🛑 **Gate:** owner approves the character look before scene art starts. ✅ Approved 2026-10-14. ⚠️ Reopened 2026-10-15 on owner feedback (see "Owner feedback rework" below). ✅ **Re-approved 2026-10-15** after the redesign (D-024).

#### Scene engine and look development

- [x] Engine core: scene renderer with parallax layers, camera follow, walking with bounds and blockers, collision, facing, input (keyboard, joystick, tap-to-walk).
- [x] Hotspots: proximity prompts, "Things to do here" list, interaction, flags.
- [x] Dialogue overlay: portraits, typewriter, choices, `aria-live`, read-aloud, retry-to-last-choice, `gentle` handling.
- [x] Objectives panel and Mitthu (follow, perch, idle hint).
- [x] **Sandbox scene** (`/dev/scene`): one test scene with placeholder art that exercises every engine feature. Add engine unit tests for walking bounds, hotspot proximity, flag logic and retry.
- [x] **Look development:** build the first real School backdrop (4 to 5 parallax layers, golden-hour light, light shafts, grain, depth blur, ambient life such as birds and drifting dust) and put the finished character in it.

🛑 **Gate:** owner approves the visual style on this one scene. If it does not look good enough, change the approach here, before more scenes exist. ✅ Approved 2026-10-15 after the restyle (D-026).

#### Owner feedback rework (added 2026-10-15, must be done before Phase 3)

The owner said they do **not like the cover page or the character design**. Both must change, and be approved, before Phase 3 starts.

- [x] **Clarify the feedback first.** ✅ 2026-10-15: "cover page" = the screens before the game (welcome and name, also age and the player picker), too blank and plain. Character: wanted realistic proportions, colour, shadows and depth like *Attack on Titan* / *GTA V*; customiser like a game's (BGMI). Ask the owner (a) what "cover page" means. It is most likely the first screen a child sees (`/#/onboarding` "Hello!", or the profile picker), but it could also be the School look-dev scene at `/#/dev/look`. (b) What exactly they dislike about each, and what they would like instead (references or examples help). Do not redesign before this is answered.
- [x] **Redesign the cover page** to the owner's direction (D-025). ✅ Approved by the owner 2026-10-15. All text through `t()`, Help button still present, calm mode respected. Show screenshots and get approval.
- [x] **Redesign the character** (and the customiser) to the owner's direction (D-024, D-025). ✅ 🛑 Character gate approved by the owner 2026-10-15. Was: Redesign the character to the owner's direction (`src/character/Character.tsx`, `spec.ts`, `character.css`). Keep the `CharacterSpec` shape, or migrate saved profiles in `store.ts` (bump the persist `version`). Keep every option the plan requires. Check every combination on `/#/dev/characters`. 🛑 Re-run the character gate.
- [x] 🛑 **Re-run the look-development gate** (2026-10-15: the owner asked for the scene to match the characters; restyled per D-026). ✅ Approved by the owner 2026-10-15. on `/#/dev/look` with the new character, and get the owner's approval of the scene style.
- [x] **Open the Phase 2 pull request** ✅ PR #3, CI green, merged with a merge commit on 2026-10-15. Phase 3 started on branch `p3-school`. Was: Open the Phase 2 pull request from `p2-character-scene` to `main`, wait for green CI, merge with a merge commit (owner preference), then start Phase 3 on a new branch.

### Phase 3: School end to end (MILESTONE A)

- [x] Author `content/scenes/school.json`: ✅ 2026-10-15 (D-027). Lata's story, rights card and a 6-question quiz. Legal text is marked `unverified` for the owner's fact check (SETUP.md §6). Was: Author `content/scenes/school.json`: hotspots, objectives, dialogue nodes, a good ending, weaker choices with gentle consequences, and the `card`. Write in the voice described in §10. Legal fields (`law`, `source`) must be accurate and sourced; mark them for the owner's fact check.
- [x] Card reveal (flippable, band-aware), quiz game (band filtering, hint round, explanations), results (stars rule, badges, saving progress). ✅ 2026-10-15 (D-028): `/play/:id` runs scene → card → quiz → results; Mitthu's arrival line (`intro`).
- [x] Temporary simple hub (a list of buildings with lock states) so School can start and finish, with unlock saved across reloads. ✅ 2026-10-15 (D-029): `/town`.
- [x] Demo-path e2e test: profile, character, School, card flip, quiz, results, Help Centre. ✅ 2026-10-15: `tests/e2e/demo-path.spec.ts`.

Done when: School plays from start to results, progress survives a reload, and the demo-path test passes. Write session notes.

### Phase 4: Town and all buildings

#### Town hub and progression

- [x] Walkable town scene using the same engine: buildings are `exit` hotspots, locked buildings stay shut with a gentle reply, teasers show "Coming soon", Help has its own door. ✅ 2026-10-15 (D-030).
- [x] Recommended-building guidance (Mitthu points the way), return celebration, town changes as buildings are completed (lanterns, bunting, more villagers). ✅ 2026-10-15 (D-031).
- [x] Book (card album), Me (character, badges, settings, switch player), Credits (assets and the legal source of every card), badges, demo mode. ✅ 2026-10-15 (D-032).

#### Remaining buildings

- [x] Dhaba, Home and Panchayat as scenes. ✅ 2026-10-18 (D-033, D-037, D-040). This should be content and art only. If one needs engine changes, fix the engine, not the content. Home and any heavy story use `gentle` tone and are handled through conversation and witnessing, never by showing harm.
- [x] Sort game (drag plus a tap alternative) and add one to at least two buildings. ✅ 2026-10-18 (D-041).

#### Community

- [x] Pledge Wall (preset pledges only), Class Mission (cooperative), Ask an Expert (private, stays on device), Places that help. Labelled "Sample" where the data is not live. ✅ 2026-10-18 (D-042).

### Phase 5: Backend

#### Backend core

- [x] `docs/SETUP.md` with the owner's manual steps: create the Supabase project, enable anonymous sign-ins, enable email auth, set the site URL, add the two GitHub repository variables. 🛑 **Stop and ask the owner to do these.** ✅ done 2026-10-18 (the owner created the project; Claude did the rest).
- [x] Migrations for §8: tables, constraints (stars 0..3, name length, code format), views, RPC, RLS policies. ✅ 2026-10-18 (D-043).
- [x] `supabase/tests/`: RLS tests (a child cannot read another child, a teacher cannot read another teacher's class, a child cannot call reviewer RPCs, `join_class` rejects bad codes and names). ✅ 2026-10-18 (37 checks, all passing).
- [x] `src/lib/supabase.ts` returns `null` when env vars are missing; generated types. ✅ 2026-10-18.

#### Teacher, class and sync

- [x] Teacher sign up, sign in, sign out. Create, rename and delete a class; join code shown large and copyable; rotate or disable it. ✅ 2026-10-18 (D-044).
- [ ] Optional "Join a class" step for children (code plus first name), "Leave class" in Me. Handle wrong code, inactive code and offline with calm, child-friendly messages in the strings file.
- [ ] `src/lib/sync.ts`: queue progress and quiz attempts, flush on change, on reconnect and on start, apply the merge rule, never block the UI, no error toasts for background failures.
- [ ] Live teacher dashboard (heatmap of students by buildings, class averages, common mistakes, remove student) and live Class Mission. Manual refresh plus a 30 s poll. Show a "Sample" label only when logged out or empty.
- [ ] Verify the whole demo path works with env vars unset and with the network off.

#### Content review workflow

- [ ] Hash-and-seed script for reviewable items (English now, Hindi later).
- [ ] `/reviewer` screen (reviewer role only): list by status and language, bundled text next to its hash, approve, reject with a note, send back. Writes `content_events`.
- [ ] "Reviewed ✓" with date on the card back when the hash matches a published row. Never block the card if offline or unmatched.

### Phase 6: Experience and Hindi

#### Experience upgrade

- [ ] **Splash v2**: a pop-up storybook opens, the town builds itself layer by layer, lanterns light one by one, Mitthu flies across carrying the Saksham banner, tap to continue. About 4 s on the first load, 1 s after that, a static fade in calm mode, always skippable, never over `/help`.
- [ ] **Sound v2**: layered ambience per scene (short compressed loops, CC0 or permissive, committed and listed in `ASSET_LICENSES.md`), a soft music loop with its own toggle, footsteps on different surfaces, per-character typing blips, richer UI sounds. If a licence cannot be confirmed, use synthesised sound only and tell the owner.
- [ ] **Dialogue voice pass**: a `docs/VOICES.md` voice bible (one paragraph and three sample lines per character; Mitthu is warm, curious, a little funny, never preachy). Short lines (aim for 18 words or fewer), natural spoken Indian English, specific details, consequences that feel real but are never graphic. The legal text does not change.
- [ ] **Living world**: ambient characters, animals, wind in cloth and foliage, dust when walking, time-of-day light, glowing windows and diyas in the evening. Cap ambient elements, pause when `document.hidden`, keep 60 fps on a mid-range phone.
- [ ] Re-check calm mode, gentle tone and Help Centre silence after each item.

#### Hindi

- [ ] `strings.hi.json` and Hindi overlays for scenes, cards, quizzes and help, laid over the English by a `localize()` function. Only text changes: ids, wiring, answers, `law`, `source` and helpline numbers always come from English. Read-aloud picks a `hi-IN` voice in Hindi. The typewriter types by grapheme (`Intl.Segmenter`).
- [ ] The Hindi is machine-authored and **unreviewed**. Flag it that way in the session notes and in the app credits until a fluent speaker has reviewed it.

### Phase 7: Hardening and documentation

- [ ] Walk the demo path at 1366×768, 1920×1080 and 390×844; fix every rough edge. Offline check and a "backend down" check.
- [ ] Accessibility pass: keyboard-only path, 48 px targets, `aria-live`, reduced motion, axe checks in Playwright.
- [ ] Performance check (town and School at 60 fps on a mid-range phone profile; first load under 3 s on a school connection).
- [ ] Documentation sweep (§12) and `ASSET_LICENSES.md` complete. Update the README with how to run, test and deploy.

## 10. Writing rules for scenes and dialogue

- Short lines, one idea each. Real details (a torn notebook, a missed bus) over generalities.
- The child learns **who to ask and how to ask**. Adults in the scenes model good answers. Nobody mocks a child.
- A weaker choice has a believable consequence and Mitthu says "let's try that again", never "wrong".
- Heavy topics are handled through conversation and witnessing. Never depict harm.
- Legal wording lives in `card` fields only, exactly as written and sourced. Do not invent penalties, ages or section numbers: look them up from official sources, cite them, and flag every figure for the owner's fact check.

## 11. Requirements baseline (reuse these IDs in the SRS, user stories and test names)

Functional:

- FR-01 Child creates a local profile with a first name, character and age band.
- FR-02 Child walks a character through a scene and the town.
- FR-03 Child talks to characters and examines objects through hotspots.
- FR-04 Child makes dialogue choices with consequences and retry.
- FR-05 Child receives a rights card whose text depends on the age band.
- FR-06 Child plays a quiz or sort game; scoring and hint round per §7.
- FR-07 System awards stars, unlocks the next building and checks badges.
- FR-08 Child can reach the Help Centre from every screen except itself.
- FR-09 Child can switch between English and Hindi.
- FR-10 Child can take preset pledges and send private Ask an Expert questions (local only).
- FR-11 Child can join and leave a class with a code.
- FR-12 System syncs progress to the class when online and works offline otherwise.
- FR-13 Teacher can register, sign in, create a class and manage its join code.
- FR-14 Teacher can view class progress, common mistakes and Class Mission, remove a student and delete a class.
- FR-15 Reviewer can list, approve or reject content items with a note.
- FR-16 System shows "Reviewed" on a card only when its hash matches a published item.
- FR-17 Demo mode unlocks all buildings.

Non-functional:

- NFR-01 Privacy: first name only; no child email, password or visible free text.
- NFR-02 Security: RLS on every table; no secrets in the client; teacher and reviewer actions enforced on the server.
- NFR-03 Availability: the full child flow works offline.
- NFR-04 Performance: 60 fps in scenes on a mid-range phone; first load under 3 s.
- NFR-05 Accessibility: 48 px targets, keyboard operable (including a non-walking alternative), `aria-live` dialogue, calm mode, never colour-only signals.
- NFR-06 Safety: calm Help Centre, always reachable; gentle tone for sensitive stories; no depiction of harm.
- NFR-07 Maintainability: data-driven engine, typed content, pure rules with tests.
- NFR-08 Quality: CI runs lint, typecheck, unit, end-to-end and build on every push and pull request.
- NFR-09 Localisation: every UI string exists in English and Hindi; legal citations stay in English.
- NFR-10 Content integrity: legal text displays exactly as authored and its review status is auditable.

Evaluation targets: at least 70% of at least 20 test children score at least 70% on the first quiz attempt; the Help Centre is found in under 10 s; at least 80% complete a module without adult help; one new module shipped per sprint per the CI log; 100% of legal content reviewed before release. Play-testing depends on access to a partner school or NGO; peer-simulated testing is the disclosed fallback.

## 12. Documentation hooks (the report is written from these)

- `docs/ARCHITECTURE.md`: component diagram, the sync sequence and the join-class sequence as Mermaid diagrams.
- `docs/DATA_MODEL.md`: ER diagram (Mermaid) and the RLS table.
- `docs/API.md`: each RPC with inputs, outputs and who may call it.
- `docs/TEST_REPORT.md`: test counts by type, what each safety-invariant test proves, the latest CI run.
- `docs/TRACEABILITY.md`: a matrix linking each FR/NFR to a screen and a test.
- `docs/adr/` or `docs/DECISIONS.md`, `docs/ASSET_LICENSES.md`, `docs/VOICES.md`, `docs/SETUP.md`.
- Keep a short sprint log (goal, done, next) per phase for the process evidence in the report.

## 13. Owner-only tasks

- Create the Supabase project, enable anonymous sign-ins and email auth, set the GitHub repository variables (Phase 5).
- Approve the character look (Phase 2 character gate) and the scene style (Phase 2 look-development gate).
- Fact-check every legal statement, age, penalty and helpline number against official sources.
- Grant the `reviewer` role to a real faculty reviewer; arrange real play-testing.
- Have a fluent Hindi speaker review the Hindi content.
- Confirm licences for any audio or art added.
- Provide team names, roll numbers and the group number for the report cover page.

## Session notes

(Append at the end of every phase and before stopping: three to six lines on what's done, what's hacky, and the exact next task.)

**P0 Foundation (2026-10-14)**
- Done: all six P0 tasks. CI green on GitHub (lint, unit, build, e2e; deploy skipped until Vercel vars exist). Plan regrouped into 8 phases (D-001).
- Hacky / watch: ESLint pinned to 9 (past end-of-support) because jsx-a11y doesn't support 10 yet (D-007). Calm mode only follows the system setting until the P1 settings store. The deploy job is untested until the owner sets up Vercel (SETUP.md §3).
- Owner: check the two font licences in ASSET_LICENSES.md. Optionally install `gh` and protect `main`.
- Next task: P1 › Rules and content contract › `content/types.ts` from §6 plus the validation script.

**P1 Core (2026-10-14)**
- Done: all 9 P1 tasks. 100 unit, 10 e2e and 16 safety tests, all green locally. The validator runs in CI.
- Hacky / watch: Help Centre numbers are sourced from PIB pages but **not yet owner-verified** (`help.json` → `review.status: "unverified"`, SETUP.md §5). Language picker shows English only until P6. `t()` doesn't re-render on a language change yet (P6). Names with hyphens or apostrophes are rejected per §4 (D-014). Sounds are synthesised placeholders.
- Owner: fact-check `content/help.json` (SETUP.md §5) and the font licences.
- Next task: P2 › Character › paper-doll SVG character rig and options.

**P2 Character and scene engine: paused at 🛑 character gate (2026-10-14)**
- Done: the four Character tasks (SVG rig with 10 skin tones, 8 hairstyles, 6 hair colours, 5 outfits, patka/hijab/dupatta, glasses, bag; idle/walk/talk/wave/gasp/cheer; builder in onboarding and `/me/character`; portraits; `/dev/characters`). The profile store moved to v2 with `avatar`.
- Hacky / watch: front-facing body with a walk-in-place stride (no true side view). The school bag shows mostly as straps. The shoulders are a little boxy.
- ✅ Owner approved the character look on 2026-10-14. Next: P2 › Scene engine › engine core.

**P2: paused at 🛑 look-development gate (2026-10-14)**
- Done: every P2 task. Scene engine (pure `sceneReducer` + `Scene` player): parallax, camera, walking with blockers, keyboard/walk pad/tap-to-walk, hotspots with prompts, "Things to do here", dialogue (portraits, typewriter, choices, aria-live, read aloud, retry), objectives, Mitthu (follow, perch, 20 s hint). `/dev/scene` sandbox. School look-dev at `/dev/look`. 155 unit and 34 e2e tests green.
- Hacky / watch: the look-dev page reuses the sandbox story and placeholder props (the box and notice). The real School story and props come in P3. Phone walk pad is only checked through `pointer: coarse`, not on a real device yet. No per-frame performance profiling yet (P7).
- Waiting for: owner approval of the visual style at `/dev/look`. Then the next task is P3 › author `content/scenes/school.json`.

**Handoff (2026-10-15), superseded: use "Handoff for the next session (updated 2026-10-17)" below**
- State: P0 and P1 are merged to `main` (PRs #1, #2). All of P2 is built and pushed on branch `p2-character-scene` (no PR yet). 155 unit and 34 e2e tests green locally.
- Owner feedback: they do **not like the cover page or the character design**. The character gate is reopened, and the look-dev gate is not approved. Phase 3 must not start until both are redesigned and approved.
- Exact next task: P2 › Owner feedback rework › "Clarify the feedback first". Ask the owner before changing any art.

**P2 rework: paused at 🛑 character gate and cover approval (2026-10-15)**
- Done: owner feedback clarified. New painted cover backdrop and immersive welcome, name, age and player-picker screens (D-025). Character rig redrawn with realistic proportions, ink outlines and cel shading (D-024); same `CharacterSpec`, no store migration. Customiser rebuilt as a dark game-style studio with part tabs. 155 unit and 35 e2e tests green.
- Hacky / watch: still a front view (no true side view for walking). The raised-arm wave is a straight arm (no elbow bend). The welcome-screen explorers are hidden behind the text on very short phone screens.
- ✅ Owner approved the cover screens and the character on 2026-10-15. Now at the 🛑 look-dev gate on `/#/dev/look` (presented 2026-10-15). After approval: open the P2 pull request.
- Look-dev gate, round 2 (2026-10-15): the owner asked for the School scene to match the new characters. Restyled with outlines, hard cel shadows and deeper colours, and rescaled the building so a child is shorter than a door (D-026). Characters in scenes are now 400 units tall (adults 470). All checks green. ✅ Owner approved 2026-10-15; P2 pull request opened. The sandbox props (box, notice) are still flat placeholders until P3.

**P2 done, P3 started (2026-10-15)**
- Done: PR #3 (all of Phase 2, including the owner-feedback rework) merged to `main` with a merge commit after green CI. Branch `p3-school` created from `main`; lint, typecheck, validate, 155 unit and 35 e2e tests green.
- Next task: P3 › author `content/scenes/school.json` (theme: education). Legal fields must be sourced and marked for the owner's fact check.

**P3: School story written (2026-10-15)**
- Done: `content/scenes/school.json`. Lata, 9, watches from the gate because her family thinks school costs money and that she can't be admitted without a birth certificate. The player hears about her from Ravi, talks to her, reads the admissions notice and asks Meena Didi. There are two weaker choices with gentle retries, and a good ending. The rights card quotes Article 21A and RTE Act section 14(2). The quiz has 4 questions for everyone plus 2 for teens. New: Lata (`npcs.json`); notice board and signpost props; a `review` block on every card, which the validator enforces; `/dev/look` now plays the real School story. 6 new story tests.
- Hacky / watch: the engine never opens `startNode` by itself, so there is no Mitthu arrival line yet (§2 step 1); add it with the card and quiz work. `ambience: "school"` has no sound until P6.
- Owner: fact-check the School card (SETUP.md §6). Article 21A matched the Ministry of Education page; the rest is unverified.
- Next task: P3 › card reveal, quiz game and results.

**P3: card, quiz and results (2026-10-15)**
- Done: `/play/:id` (`src/screens/Play.tsx`) plays a building's whole loop: scene, rights card (flips; young band gets "Tell me more"; law shown exactly as written), quiz (band-filtered, an explanation after each answer, Mitthu's hint round under 60% that never changes the score), and results (stars with the reason for each, score, card saved to the Book, new badges, "a new place is open"). Results are saved and survive a reload. Badges are a pure rule (`badgesFor`, D-028). Scenes can have an `intro` node that opens on arrival (School has Mitthu's line). Locked buildings can't be played. 169 unit and 39 e2e tests green.
- Hacky / watch: the "Back to the town" button goes to the placeholder `/town` until the temporary hub (next task). The badge icon is one generic shape for now. One older e2e test (keyboard walking) was flaky under load; the real cause and fix are in the next note.
- Next task: P3 › temporary simple hub (a list of buildings with lock states).

**P3: temporary town hub (2026-10-15)**
- Done: `/town` (`src/screens/Town.tsx`) lists every building from `content/buildings.json` (which gained `name` and `right`, checked by the validator). Each card shows its state: playable, stars once finished, "Locked. Finish X first.", "Being built" (unlocked but no scene yet), or "Coming soon" (teasers). Mitthu suggests the recommended building. Unlocks come from saved progress, so they survive a reload. The rules now take `BuildingRef` (just id and teaser). 171 unit and 40 e2e tests green.
- Fixed a flaky test: the keyboard-walking e2e held the arrow key while waiting for Ravi's prompt. On a busy machine it walked past the 240-unit prompt zone before releasing, so E did nothing. It now walks in short taps (`tests/e2e/scene.spec.ts`). It wasn't an app bug.
- Next task: P3 › demo-path e2e test (profile, character, School, card flip, quiz, results, Help Centre).

**P3 School end to end: done (MILESTONE A, 2026-10-15)**
- Done: every P3 task. "Done when" is met: School plays from start to results, progress survives a reload, and the demo-path test passes (`tests/e2e/demo-path.spec.ts`; shared School steps now live in `tests/e2e/helpers.ts`). 171 unit and 41 e2e tests, lint, typecheck, validate and build all green. Sprint log, test report and architecture map updated.
- Hacky / watch: the School card's legal text is still `unverified` (SETUP.md §6). The hub is temporary (Phase 4 makes the town walkable). Demo mode exists in the store but has no on-screen switch yet (Phase 4). One badge icon for every badge.
- Next task: open the P3 pull request (`p3-school` → `main`), merge with a merge commit after green CI, then P4 › walkable town scene on a new branch. ✅ PR #4 merged 2026-10-15.

**P3 merged, P4 started (2026-10-15)**
- Done: PR #4 (all of Phase 3) merged to `main` with a merge commit after green CI (lint, unit, build and e2e in both the push and pull-request runs; deploy skipped until Vercel is set up). Branch `p4-town` created from `main`; lint, typecheck, validate, 171 unit and 41 e2e tests green.
- Next task: P4 › walkable town scene (buildings as `exit` hotspots, locked buildings stay shut with a gentle reply, teasers say "Coming soon", Help has its own door). It replaces the temporary list at `/town`.

**P4: walkable town (2026-10-15)**
- Done: `/town` is now a walkable street (`content/scenes/town.json`, art `src/art/town.tsx`) with a door per building plus a calm teal Help kiosk. Locked doors show a padlock and Mitthu's gentle reply; teasers say "Coming soon"; the Help door opens the Help Centre, and Back returns to the town. Coming back from a building starts you outside its door. The building cards stay below the street as a summary. Engine: `hub` scenes, host-controlled `locked` exits, `startX`. Validator: hub rules and hub door targets.
- Performance: removed two full-screen blend modes (light shafts, film grain). Town 33 → 59 fps and School 30 → 47 fps in headless Chromium, with no visible change (D-030).
- Performance, cover screens (my own P2 redesign): no blur behind forms or on glass panels, the picture holds still behind forms, and the tiny twinkles are still. Forms 10–15 → 60 fps, welcome 21 → 36 fps (D-030). This, not the town, was why journey tests timed out: they spend most of their time on those screens.
- Tests: `src/engine/town.test.ts` (7), validator tests for hubs, `tests/e2e/town.spec.ts` (4). The two long journey tests (`play.spec.ts`, `demo-path.spec.ts`) allow 60 s and run in calm mode (no typewriter or ambient motion; same game logic, motion is covered by `scene.spec.ts` and `town.spec.ts`). Locally, Playwright runs at most 3 browsers at once: with up to 6, a busy laptop (another app was using a lot of CPU) starved them into timeouts, even on trivial steps. After these changes: 45/45 e2e in two consecutive full runs.
- Hacky / watch: the engine's hotspot markers (soft glowing circles) show on every door, open or locked. The Dhaba, Home and Panchayat doors stay locked with "isn't open yet" until their stories exist. No real-device frame-rate check yet (P7).
- Next task: P4 › recommended-building guidance (Mitthu points the way), return celebration, town changes as buildings are completed.

**P4: a living town (2026-10-15)**
- Done: Mitthu bobs above the suggested door, "Mitthu suggests" shows in "Things to do here", and his 20-second hint says where to go. Coming back from a building: you start outside its door without the welcome repeating, and Mitthu celebrates once (stars, any newly open place; confetti, gentle sparkles, or nothing in calm mode). Finished buildings get a marigold garland and lanterns, the bunting fills in, and Lata stands outside the School after you help her. Engine: `startFlags`/`hostFlags`, `guide`, `skipIntro`; layer art receives flags. "A new place is open" now appears only when that place's story exists.
- Tests: town engine tests (flags, Lata, skip intro, host flags), validator test for host flags, e2e for the celebration (shown once, not after reload), Lata, and "Mitthu suggests".
- Hacky / watch: more villagers come with each new building (only Lata so far). Mitthu's marker sits at a fixed height above doors.
- Next task: P4 › Book (card album), Me (character, badges, settings, switch player), Credits, badges, demo mode.

**Handoff for the next session (updated 2026-10-17)**
- **State:** P0 to P4 are merged to `main` (PRs #1 to #5). Phase 5 is on `p5-backend`: the backend core (D-043) and the teacher page (D-044) are done. 228 unit tests (15 files) and 64 e2e tests (10 files, 16 of them safety) are green; lint, typecheck, validate and build pass. See **Checkpoints** at the top.
- **Exact next task:** P5 › the optional "Join a class" step for children (class code plus first name, through `join_class` after an anonymous sign-in) and "Leave class" in Me, with calm, child-friendly messages for a wrong code, a switched-off code and no connection. The database is ready (D-043); the teacher page (D-044) makes classes and codes. Apply any new migration with the Supabase MCP `apply_migration` (and save the same SQL in `supabase/migrations/`), run `supabase/tests/rls.test.sql` through `execute_sql`, and check the advisors. For e2e, answer Supabase requests with a fake in the browser, as `tests/e2e/teacher.spec.ts` does.
- **How the game is put together now (D-036 to D-039):**
  - `/town` and `/play/:id` are outside the top-bar Shell: `Scene.tsx` is a full-screen frame with its own Need help?, menu words (Back, History, Things to do, Map, Book, Settings, Exit) and the area map (`src/components/AreaMap.tsx`, places from `src/play/useMap.ts`, pin positions in `content/buildings.json` › `map`). Card, quiz, results and the "still locked" page sit in `GameFrame`. Every new full-screen screen needs its own HelpButton.
  - The reducer (`sceneState.ts`) knows `depth` (W/S), `trail` (Back), `seen` (History) and `entering` (walk to an open door, turn, go in, then `exit`). Hotspots may set `depth` in content.
  - `Character` has a `back` view and knees (`ch-shin-*`, `ch-knee` in `character.css`). The voice is gone (no `speech.ts`, no narration setting).
- **Rules learned the hard way (keep them):**
  - No full-screen `mix-blend-mode`, no `backdrop-filter`, and no `filter: blur` on animated pictures (D-030). Moving things go in their own small layer (clouds: `"drift": true`).
  - Calm mode is set by the system's "reduce motion" too, and three files stop animations in it (`index.css`, `scene.css`, `character.css`). All three keep the walk exception `:not(.ch[data-pose='walk'] *)`; `scene.spec.ts` tests it.
  - Scale: the owner tried true scale (D-038) and preferred the D-036 scale. Don't change it again without asking.
  - Long journey e2e tests run in calm mode; motion is tested by `scene.spec.ts` and `town.spec.ts`. If tests time out everywhere at once, the laptop is busy; re-run first.
  - Screenshots: a throwaway Playwright script against the dev server (port 5174 when 5173 is taken).
  - Tooling on this machine: the Bash tool mangles heredocs (and `python -` waits for input forever), so write scripts to the scratchpad with the Write tool and run them. Write files with `newline='\n'` (the repo is LF).
- **The Lab Eval I report** (not in git): `tmp-report/` (ignored via `.git/info/exclude`), built with `node tmp-report/build.ts "C:\SEM 5\Software Engineering\Project"`; notes in `tmp-report/NEXT.md`. Diagrams are SVG drawn in `tmp-report/figures.js` with helpers in `diagrams.js`; `node tmp-report/shot-uc.ts <figure-id>...` screenshots figures into `tmp-report/prev/`.
- **Owner:** the fact checks (School, Dhaba, Home cards; Help Centre) are the most important open items before any child plays.

**P4: Book, Me, Credits and demo mode (2026-10-15)**
- Done: `/book` (card album, read any collected card again), Me (stars, all badges earned or not yet, settings, switch player, link to Credits), `/credits` (made-in-code art, fonts from `content/credits.json`, every card's source exactly as written), and demo mode (type "demo" or hold the logo 2 s; a top-bar chip turns it off). Shared card pieces in `src/play/RightsCard.tsx`; badge names in `src/play/badgeText.ts`; `SettingsControls` shared by the dialog and Me. Removed the last live blurs (D-030 rule).
- Tests: `tests/e2e/collection.spec.ts` (7: Book collected and empty, Me, Credits, demo by typing, by long press, not from a text box), `src/lib/scenes.test.ts` (3), and a `seedPlayer` e2e helper that loads a saved player without playing.
- Hacky / watch: the Book has only one real card until the other buildings exist. Badges use one shared icon. `/community` is still a placeholder (its own P4 task).
- Next task: P4 › Dhaba, Home and Panchayat as scenes (content and art only; Home uses the `gentle` tone; every legal claim goes to the owner's fact check, like School in SETUP.md §6).

**P4: the Dhaba (2026-10-15)**
- Done: `content/scenes/dhaba.json` (gentle tone): Raju, 12, works at the dhaba instead of school; the player listens, finds his notebook, and tells Sunita Didi (anganwadi worker). Two gentle retries, a good ending, a rights card (Article 24 and section 3(1) of the 2016-amended Act; no penalties), and a 4 + 2 question quiz. New characters (Raju, Mohan Bhaiya, Sunita Didi), stage art `src/art/dhaba.tsx` and a notebook prop. Registered in `src/lib/scenes.ts`, so the town's Dhaba door now opens after the School, and the results and celebration say so. D-033.
- Tests: `src/engine/dhaba.test.ts` (6), a Dhaba play-through e2e in `play.spec.ts` (gentle note links to Help), and updated expectations now that the Dhaba exists (Book shows 2 cards, the Dhaba is "Visit", not "Being built").
- Owner: fact-check the Dhaba card (SETUP.md §6). The official PDFs did not open from Claude's tools; the quotes match secondary sources only.
- Next task: P4 › the Home scene (`gentle` tone, safety at home; handled only through conversation and witnessing, never by showing harm). Then the Panchayat.

**P4: owner feedback, title menu and customiser (2026-10-16)**
- Done: `/` is now a title menu (`src/screens/Title.tsx`): logo, one line, and Continue / New game / Change character / Switch player / Settings on the left, the character on the right. New game is two steps: name with age under it, then the customiser. The customiser is rebuilt with Boy / Girl, modern hair, tops (T-shirt, shirt, hoodie, jacket) and bottoms (jeans, trousers, joggers). Beige look with Inter for menus; the dusk cover art is deleted. D-034.
- Tests: spec unit tests (modern lists, gender, older saves), e2e updated for the new flow (title menu, age required, gender and bottoms in the customiser, Continue after reload). Me's "Switch player" no longer clears the player first (the screen's guard jumped to `/` before the list opened).
- Watch: the game screens (town, scenes, Me, Book) still use the old warm serif look; the owner reviews them next. The Me › character page is narrower than the new-game one.
- Next task: wait for the owner's review of these screens and their gameplay changes (🛑). Then, unless they say otherwise, the Home scene.

**P4: the full-screen game and the modern scenes (2026-10-16)**
- Done: the owner approved the prototype (D-035), and the real game now plays full screen (D-036): W A S D walking (with depth), the dialogue strip, the menu words (Back, History, Things to do, Map, Book, Settings, Exit), the area map with travel, and the School, Dhaba and town redrawn in the modern look (`src/art/modern.tsx` kit). Card, quiz and results sit in `GameFrame`. The title picture is the real School.
- Tests: reducer tests for depth, Back and History; e2e helpers `thingsToDo` (opens the panel), `doThing` and `openMap`; town and play tests now check places on the map; a new test for W/S, Back and History. 202 unit and 55 e2e tests green.
- Watch: the sandbox (`/dev/scene`) still uses its old flat art. People in the stories keep their traditional clothes (the owner only asked about the player). The Book, Me and Credits pages still have the old warm look; the owner may want them restyled next.
- Next task: 🛑 the owner reviews the new game. Then, unless they say otherwise, the Home scene (gentle tone), drawn with the modern kit.

**P4: Home (2026-10-16)**
- Done: the owner approved the full-screen game (D-036) and it is pushed. `content/scenes/home.json` (gentle tone): Anu tells the player that her uncle hits her and told her to keep it secret; the player listens, sees her drawing, and tells Farida Aunty, who explains that no one may hurt a child and makes a plan (1098 if needed). Two gentle retries, a good ending, a rights card (Article 39(f) and section 75 of the JJ Act, 2015; no penalties), and a 4 + 2 question quiz. New characters Anu, Kabir and Farida Aunty; art `src/art/home.tsx`. Registered in `src/lib/scenes.ts`, so the Home door and map pin open after the Dhaba. D-037.
- Tests: `src/engine/home.test.ts` (6), a Home play-through in `play.spec.ts` (with a new `dhaba` option for `seedPlayer`), and the Book now counts 3 written cards.
- Owner: fact-check the Home card (SETUP.md §6), and read the story once for tone.
- Next task: P4 › the Panchayat (child marriage, `gentle` tone), the same way.

**P4: owner feedback after playing (2026-10-16)**
- Done: true scale (children 300 units, doors 400, every scene and the town redrawn; camera closer), a walk with bending knees (and walking still animates in calm mode), a new ponytail, and the read-aloud voice removed. D-038.
- Tests: all 208 unit and 56 e2e tests green; no test needed changing.
- Next task: P4 › the Panchayat (child marriage, `gentle` tone), drawn at true scale with the modern kit.

**P4: owner feedback, round 2 (2026-10-16)**
- Done: scale back to D-036; the player walks to a door, turns (new back view) and goes in; the walk now steps with "reduce motion" on (a global calm rule was stopping it); the locked-building page has Need help? and says which place to finish first. D-039.
- Tests: reducer tests for going in, town and sandbox tests wait for the player to go in, an e2e test for the walk with reduced motion, and the locked page shows Need help?. 210 unit and 57 e2e tests green.
- Next task: P4 › the Panchayat (child marriage, `gentle` tone).

**Lab Eval I report fixes (2026-10-17, report only, not in git)**
- Done: the three use case diagrams became one (Figure 5, page 11), with «include» and «extend», arrows on associations, the class backend as a «system» box (not a stick figure) and no "System" actor; the Actors table and UC-18 template were corrected to match. Figure 7 (swimlane: joining a class) now labels the offline loop "on reconnect: check again"; Figure 8 (swimlane: content review) has a straight, labelled arrow from "Status: published" to the Child app's hash check. PDF rebuilt (41 pages) in `C:\SEM 5\Software Engineering\Project\`.
- Next task: unchanged, P4 › the Panchayat.

**Lab Eval I report: new screenshots (2026-10-17, report only, not in git)**
- Done: every app screenshot retaken after the redesign (title menu, new game, customiser, full-screen town and School, card, quiz, results, Book, Me, Help Centre) plus a new Map figure; section 3.1.1, UC-01, UC-02, the Help use case, FR-02 and the 1.2.6 status rewritten to match. Still 41 pages. Old shots in `tmp-report/shots-pre-redesign/`.

**P4: the Panchayat (2026-10-18)**
- Done: the owner chose to finish Phase 4 before Phase 5. `content/scenes/panchayat.json` (gentle tone): Pooja, 15, tells the player her wedding has been fixed for after her exams; Sonu (her brother) and her admit card are the clues; the player tells Sarpanch Kavita ji, who explains the ages and visits the family with the Child Marriage Prohibition Officer. Two gentle retries, a good ending (the wedding is called off), a card quoting sections 2(a), 2(b) and 13(1) of the Prohibition of Child Marriage Act, 2006 (no penalties), and a 4 + 2 question quiz. Art `src/art/panchayat.tsx`, three new people. D-040. All four written buildings now open in order.
- Tests: `src/engine/panchayat.test.ts` (6), a Panchayat play-through in `play.spec.ts` (`seedPlayer` has a `home` option now), the Book counts 4 cards, and demo mode opens the Panchayat. 216 unit and 58 e2e tests green.
- Owner: fact-check the Panchayat card (SETUP.md §6) and read the story once for tone. Still to confirm from last time: the walk and going in through doors (D-039) on your laptop.
- Next task: P4 › the Sort game, then Community.

**P4: the sort game (2026-10-18)**
- Done: the owner confirmed the walk and going in through doors (D-039) on their laptop. A sort game (`SortGame` in `content/types.ts`, `src/play/Sort.tsx`): one card at a time, dragged or tapped into one of two boxes, with the explanation after each card. A building plays its games in order and adds their scores (`addScores` in `rules.ts`). Added to the Dhaba ("Is this work allowed for this child?") and the Panchayat ("Is this wedding allowed?"), five cards each, with each card's claims added to its fact-check list. The validator checks sort games. D-041.
- Tests: rules (sort scoring, adding scores), validator (a good sort game, wrong or unused boxes, too few cards or boxes, a sort game alone), and the Dhaba and Panchayat play-throughs now sort every card (the Panchayat drags its first card with the mouse). 222 unit and 58 e2e tests green; checked by screenshot at 1280 and 390 wide.
- Watch: the "Quiz whiz" badge now needs every quiz and sort answer right on the first try in that building.
- Next task: P4 › Community (the last P4 task), then open the P4 pull request.

**P4: Community (2026-10-18)**
- Done: `/community` (`src/screens/Community.tsx`, words in `content/community.json`): a Pledge Wall of six preset pledges (saved in `extras.pledges`), a cooperative Class Mission (all this device's stars as one total, no names, labelled "Sample"), Ask an Expert (questions saved only for the player who wrote them, at most 280 letters, removable, never sent anywhere, with a link to Need help?), and Places that help (with a fact-check `review`). D-042. Every Phase 4 task is now done.
- Tests: `cleanQuestion` (rules), questions per player and removal (store), and `tests/e2e/community.spec.ts` (4): a pledge survives a reload and there is no free-text pledge; the mission is labelled Sample, counts the stars, and names nobody; a question is refused when empty, saved, hidden from another player on the same device, and removed; places are shown exactly as written. 226 unit and 62 e2e tests green; checked by screenshot at 1280 and 390 wide.
- Owner: fact-check the places that help (SETUP.md §5).
- Next task: open the P4 pull request (with the owner's go-ahead), then Phase 5's first 🛑 gate.

**P4 merged (2026-10-18)**
- PR #5 (`p4-town` into `main`) merged with a merge commit (`bf0240b`) after CI went green (8 checks passing). Phase 4 is complete.
- Next task: P5 › write SETUP.md §4 (Supabase), then 🛑 stop for the owner.

**P5: Supabase setup steps (2026-10-18)**
- Done: SETUP.md §4 written: create the project (Free plan, Mumbai), turn on anonymous sign-ins, keep email sign-in with confirmation, set the site URL and redirect URLs, copy the public URL and publishable (or anon) key into two GitHub variables and `.env.local`, and give Claude the project reference. The service-role and secret keys never come near the project. Optional CAPTCHA noted.
- Next task: 🛑 the owner does SETUP.md §4. Then P5 › migrations.

**P5: the backend core (2026-10-18)**
- Done: the owner created the Supabase project `saksham` (ref `iggetuuoghdoyppdlppy`, Free plan, Tokyo) after Claude's own attempt was blocked by the session's safety settings. Claude turned on anonymous sign-ins, set the site and redirect URLs, put the URL and publishable key in GitHub variables and `.env.local`, applied the schema (`supabase/migrations/`: core and hardening), and added `src/lib/supabase.ts` (null without env vars) with generated types. New dependency `@supabase/supabase-js`. D-043.
- Tests: `supabase/tests/rls.test.sql` (37 checks, all passing, rolled back so nothing is left), `src/lib/supabase.test.ts` (2). 228 unit and 62 e2e tests green. Supabase advisors: only intended warnings left (anonymous children; RPCs that check their callers).
- Watch: the RLS tests need the live project, so CI doesn't run them; run them after every migration. The project is in Tokyo, not Mumbai.
- Next task: P5 › teacher sign up and classes (`/teacher`).

**P5: the teacher page (2026-10-18)**
- Done: `/teacher` ("For teachers" under the title menu): sign up with email confirmation, sign in, sign out; create, rename and delete a class; the join code large, copyable and read out letter by letter; switch the code off and on; get a new code. PKCE sign-in so the email link works with hash routes. D-044.
- Tests: `tests/e2e/teacher.spec.ts` (2), with Supabase answered by a fake in the browser. 228 unit and 64 e2e tests green. Checked by screenshot at 1280 and 390 wide, and the real page loads against the live project with no console errors.
- Not checked: a real sign-up and confirmation email (Claude has no inbox and doesn't sign in on real services). Owner: try it once with your own email.
- Owner, before real teachers use it: add an email provider (SMTP) in Supabase; the built-in one only sends to the project team, a few emails an hour (SETUP.md §4).
- Next task: P5 › children join a class, and "Leave class" in Me.
