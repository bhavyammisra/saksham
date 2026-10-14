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

Grounded and warm, **not cartoonish**: semi-realistic proportions, painterly layered vector scenes, soft golden light, subtle grain, light shafts, depth blur on far layers, real Indian materials and colours (painted plaster, tiles, wood, brass, marigold garlands). No thick outlines, no big-head mascots. Mitthu is the only slightly stylised character. The visual style must be consistent across every scene: one palette family, one lighting logic.

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
- [ ] Safety-invariant e2e tests: Help button on every route except `/help`; `/help` is calm and silent; the name field rejects digits and symbols; no screen shows free text from another child.

### Phase 2: Character and scene engine

#### Character

- [ ] Paper-doll SVG character: shared rig (head, hair, body, outfit, headwear) with realistic proportions. Options: 8 to 10 skin tones, 6 to 8 hairstyles, 5 or more hair colours, a few outfits (school uniform, kurta, salwar kameez, casual), headwear (patka, hijab, dupatta), glasses, school bag. Spec is a small JSON object.
- [ ] Animations on the shared rig (CSS or `motion`): idle, walk, talk, wave, react (gasp, cheer). Facing left or right.
- [ ] Character builder screen (preview, rows of choices, "Surprise me"), added to onboarding and Me. Dev route `/dev/characters` showing every outfit and headwear combination for alignment checks.
- [ ] Portrait renderer (head and shoulders with a mood) for dialogue and results.

🛑 **Gate:** owner approves the character look before scene art starts.

#### Scene engine and look development

- [ ] Engine core: scene renderer with parallax layers, camera follow, walking with bounds and blockers, collision, facing, input (keyboard, joystick, tap-to-walk).
- [ ] Hotspots: proximity prompts, "Things to do here" list, interaction, flags.
- [ ] Dialogue overlay: portraits, typewriter, choices, `aria-live`, read-aloud, retry-to-last-choice, `gentle` handling.
- [ ] Objectives panel and Mitthu (follow, perch, idle hint).
- [ ] **Sandbox scene** (`/dev/scene`): one test scene with placeholder art that exercises every engine feature. Add engine unit tests for walking bounds, hotspot proximity, flag logic and retry.
- [ ] **Look development:** build the first real School backdrop (4 to 5 parallax layers, golden-hour light, light shafts, grain, depth blur, ambient life such as birds and drifting dust) and put the finished character in it.

🛑 **Gate:** owner approves the visual style on this one scene. If it does not look good enough, change the approach here, before more scenes exist.

### Phase 3: School end to end (MILESTONE A)

- [ ] Author `content/scenes/school.json`: hotspots, objectives, dialogue nodes, a good ending, weaker choices with gentle consequences, and the `card`. Write in the voice described in §10. Legal fields (`law`, `source`) must be accurate and sourced; mark them for the owner's fact check.
- [ ] Card reveal (flippable, band-aware), quiz game (band filtering, hint round, explanations), results (stars rule, badges, saving progress).
- [ ] Temporary simple hub (a list of buildings with lock states) so School can start and finish, with unlock saved across reloads.
- [ ] Demo-path e2e test: profile, character, School, card flip, quiz, results, Help Centre.

Done when: School plays from start to results, progress survives a reload, and the demo-path test passes. Write session notes.

### Phase 4: Town and all buildings

#### Town hub and progression

- [ ] Walkable town scene using the same engine: buildings are `exit` hotspots, locked buildings stay shut with a gentle reply, teasers show "Coming soon", Help has its own door.
- [ ] Recommended-building guidance (Mitthu points the way), return celebration, town changes as buildings are completed (lanterns, bunting, more villagers).
- [ ] Book (card album), Me (character, badges, settings, switch player), Credits (assets and the legal source of every card), badges, demo mode.

#### Remaining buildings

- [ ] Dhaba, Home and Panchayat as scenes. This should be content and art only. If one needs engine changes, fix the engine, not the content. Home and any heavy story use `gentle` tone and are handled through conversation and witnessing, never by showing harm.
- [ ] Sort game (drag plus a tap alternative) and add one to at least two buildings.

#### Community

- [ ] Pledge Wall (preset pledges only), Class Mission (cooperative), Ask an Expert (private, stays on device), Places that help. Labelled "Sample" where the data is not live.

### Phase 5: Backend

#### Backend core

- [ ] `docs/SETUP.md` with the owner's manual steps: create the Supabase project, enable anonymous sign-ins, enable email auth, set the site URL, add the two GitHub repository variables. 🛑 **Stop and ask the owner to do these.**
- [ ] Migrations for §8: tables, constraints (stars 0..3, name length, code format), views, RPC, RLS policies.
- [ ] `supabase/tests/`: RLS tests (a child cannot read another child, a teacher cannot read another teacher's class, a child cannot call reviewer RPCs, `join_class` rejects bad codes and names).
- [ ] `src/lib/supabase.ts` returns `null` when env vars are missing; generated types.

#### Teacher, class and sync

- [ ] Teacher sign up, sign in, sign out. Create, rename and delete a class; join code shown large and copyable; rotate or disable it.
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
