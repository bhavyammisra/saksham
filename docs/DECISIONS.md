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

## D-009 CI on GitHub Actions; deploy from CI to Vercel

- **Context:** NFR-08 requires lint, typecheck, unit, end-to-end and build to run on every push and pull request. The plan also asks for a `deploy` job on `main`.
- **Choice:** One workflow (`.github/workflows/ci.yml`) with jobs `lint`, `unit` (typecheck + vitest), `build` (uploads `dist/`), `e2e` (after build), and `deploy`. `deploy` runs only on pushes to `main`, after all other jobs pass. It uploads the tested `dist/` with a pinned Vercel CLI. It is skipped until the owner sets the Vercel variables (docs/SETUP.md §3).
- **Why:** The exact build that passed the tests is what gets deployed. Skipping instead of failing keeps CI green before hosting exists. Supabase URL and anon key come from repository *variables*, not secrets, because they are public by design.
- **Alternatives:** Vercel's own Git integration (simpler, gives preview deploys, but deploys without waiting for our tests). Netlify or GitHub Pages work the same way with HashRouter.

## D-010 i18n: a tiny `t()` over flat JSON, keys typed from English

- **Context:** Every UI string must go through `t()` from day one, English first and Hindi later (Phase 6).
- **Choice:** `src/lib/i18n.ts` holds about 30 lines of our own code. `content/strings.en.json` is a flat `"area.thing": "Text"` map with `{name}` placeholders. `StringKey` is derived from the English file's keys.
- **Why:** No dependency, and every line can be explained in the viva. Typed keys mean a misspelled key is a compile error, not a blank on screen. A missing key at runtime shows the key itself and warns in development. Hindi will fall back to English per key.
- **Alternatives:** i18next or react-intl (plural rules and ICU formatting we don't need yet, and more to explain).

## D-011 Font: Noto Serif + Noto Serif Devanagari, self-hosted

- **Context:** The UI needs one family that covers English and Hindi, with a licence that allows bundling, and no runtime CDN.
- **Choice:** `@fontsource-variable/noto-serif` and `@fontsource-variable/noto-serif-devanagari` (variable weight axis), imported in `src/index.css`. The CSS stack is `'Noto Serif Variable', 'Noto Serif Devanagari Variable', Georgia, serif`.
- **Why:** Owner's choice. Both are SIL OFL 1.1 (licence files checked in the packages). They are designed as a matched pair, so English and Hindi look like one family. Vite bundles the files into `dist/`. The browser downloads only the subsets a page uses (Latin, Devanagari), via `unicode-range`.
- **Note:** A serif face suits the storybook feel. If play-testing shows young readers struggle, the optional dyslexia-friendly font setting in §3 is the fix.
- **Alternatives:** Mukta or Noto Sans (sans-serif), Google Fonts CDN (not allowed: third-party request).

## D-012 Design tokens and calm mode in CSS

- **Context:** One palette and one lighting logic across every screen. Calm mode must stop motion everywhere.
- **Choice:** All tokens live in `@theme` in `src/index.css`: warm palette, a separate cool Help palette with no reds, an enlarged type scale, `--spacing-tap` = 48px, radii and warm shadows. Calm mode is the `data-calm` attribute on `<html>`, set by `src/lib/calm.ts` from `prefers-reduced-motion` (the setting joins in Phase 1). Under it, a CSS rule cuts all animations and transitions to near zero.
- **Why:** One file to change the look. Tailwind generates the utilities. An attribute on `<html>` is something both CSS and engine code can check. The focus ring is blue, so it contrasts with the warm palette, with a white halo for dark art.
- **Alternatives:** A JS theme object (duplicates CSS), relying on `prefers-reduced-motion` alone (can't be switched on in-app).

## D-013 Content contract and a hand-written validator

- **Context:** Scenes are JSON written by hand. A typo in a node id or flag would only show up as a stuck game. JSON imports lose TypeScript's literal types, so the compiler can't check scene files.
- **Choice:** `content/types.ts` is the contract (§6). `GameDef` is quiz-only until the sort game in Phase 4, and `BuildingInfo` lists the unlock order in `content/buildings.json`. `scripts/validate-content.ts` (`npm run validate`, in CI) checks every `content/scenes/*.json`: required fields, enum values, every `next`/`to`/`node`/`startNode` exists, no dead ends, a reachable `end: "good"`, every `showIf`/`hideIf`/`requires` flag is set by some node, hotspots and spawn inside `walkable`, card fields, quiz answers in range, and a non-teen question exists. It also checks that every `t('key')` in `src/` exists in `strings.en.json`.
- **Why:** Plain functions, unit-tested with one broken scene per rule, and readable in the viva. Node 24 runs the TypeScript file directly (type stripping), so no build step or extra tool is needed.
- **Alternatives:** JSON Schema with ajv, or zod (new dependencies; they can't express graph rules like "reachable good end" anyway).

## D-014 Game rules as pure functions over whole-number scores

- **Context:** Stars, unlocks, band filtering, hint rounds and the sync merge must be exact and testable (§7), and they're graded through the SRS and the tests.
- **Choice:** `src/lib/rules.ts` holds pure functions only, with no React, storage or clock. A score is kept as `{ correct, total }`, and thresholds are checked as `correct × 100 ≥ total × percent`. Saved `bestScore` is a whole percentage, which matches the `best_score` column later. Only the first attempt per question counts, so the hint round can't change the score by construction. The first-name rule (letters, Hindi vowel signs, single spaces, ≤ 20 characters) lives here too, so the UI, store and later the database agree.
- **Why:** Pure functions are the easiest code to test and explain. Whole numbers avoid `0.6 * 5 = 2.9999…` bugs at exactly 60% and 90%. Test names start with requirement IDs (FR-05, FR-06, FR-07, FR-12, FR-17, NFR-01) for the traceability matrix.
- **Note:** Hyphens and apostrophes in names (Asha-Rani, D'Souza) are rejected because §4 says "letters and spaces". Change `isValidFirstName` if the owner wants them.
- **Alternatives:** Fractions (rounding bugs), rules inside the store (harder to test).

## D-015 One persisted zustand store; device-level settings

- **Context:** Several children may share one device. Each needs separate progress, and everything must survive reloads offline.
- **Choice:** `src/lib/store.ts` is a single zustand store saved to `localStorage` under the key `saksham` (version 1). It holds `profiles`, `activeProfileId`, `settings`, `data[profileId] = { progress, extras }` and `demo`. Settings and demo mode belong to the device, not to a profile. Every change to progress goes through `rules.ts` (`progressFromResult`, `bestProgress`), and names through `isValidFirstName`.
- **Why:** One store is easy to reason about and to sync later (Phase 5). Device-level settings mean a teacher can turn on calm mode once for a shared tablet. If `localStorage` is unavailable (private window, blocked storage, tests), the store falls back to memory instead of crashing. A `merge` step fills in defaults for settings added later.
- **Alternatives:** One store per profile (harder switching), IndexedDB (more code for small data).

## D-016 App shell: one layout component, native `<dialog>` for settings

- **Context:** Every screen except `/help` needs the Help button. Some screens also need the main navigation. Settings must be keyboard- and screen-reader-friendly.
- **Choice:** `Shell` is a layout route: a top bar with logo, "Need help?" and Settings. `<Shell nav />` adds the navigation, in the top bar on wide screens and as a bottom bar on phones. `/help` sits outside every shell. Settings is a native `<dialog>` opened with `showModal()`. Toggles are `<button role="switch">` that also show "On"/"Off" as words, so state is never colour-only. On phones the Settings button shows only a gear icon, and its label stays readable by screen readers. `data-calm` is on when the system asks for reduced motion OR the "Calm motion" setting is on. `main.tsx` keeps it, and the page language, in sync with the store.
- **Why:** Putting the Help button in the layout, not in each screen, means a new screen can't forget it. The native dialog gives focus trapping, Escape-to-close and focus return without a library.
- **Alternatives:** A Help button in each screen (easy to miss one), a dialog library such as Radix (a dependency for something the browser already does).

## D-017 Help Centre content in JSON, with official sources enforced by the validator

- **Context:** The Help Centre is the most safety-critical screen. Its words must be exactly as authored, and every number must come from an official page.
- **Choice:** `content/help.json` (typed as `HelpContent`) holds every sentence and number, with `sources` per helpline and a `review` block for the owner's sign-off. The screen only lays the content out. The words around it ("Back", "Call {number}") come from `t()`. The validator rejects a helpline whose number isn't digits only, or whose sources aren't `https` pages on `.gov.in` or `.nic.in`. Helplines included: 1098, 112, 14416, 1930.
- **Why:** Copy and code stay separate, so the owner can fix wording without touching code, and a reviewer can check one file. Enforcing government domains means a blog or news page can't slip in as a "source". Styling uses only the `help-*` colours (teal and cool grey, never red) and no transitions.
- **Alternatives:** Copy in the component (mixes code and safety text), a hand-kept list of sources in a document (drifts out of date).

## D-018 Sound: one synthesised WebAudio manager

- **Context:** §2 P1 asks for a sound manager that starts on the first gesture, respects settings, is silent on `/help`, and plays at half volume in `gentle` scenes.
- **Choice:** `src/lib/sound.ts` exposes `sound.play(name)` with three short synthesised sounds (`tap`, `soft`, `success`) made from oscillators. The volume rule is the pure function `soundGain()`, which is unit-tested. `main.tsx` passes the "Sound effects" setting in. `SoundRouteSync` silences everything while the route is `/help`. The standard `Button` plays `tap`.
- **Why:** Synthesised sound needs no audio files, so there is no licence to check and no download. The audio context is created only after a tap or key press, as browsers require. Recorded ambience and music come in Phase 6.
- **Alternatives:** Howler.js (a dependency we don't need yet), `<audio>` tags (needs files, and is harder to mix).

## D-019 Player character: one hand-written SVG rig, CSS animations

- **Context:** The plan asks for a paper-doll character with realistic proportions, many options and several animations, shared by scenes, dialogue portraits and results.
- **Choice:** `src/character/Character.tsx` is one SVG rig in a 120 × 360 design space. Its parts are groups that pivot at the neck, shoulders and hips. Outfits, hairstyles and head coverings are drawn onto the same parts, so every combination moves the same way. The head is scaled up 12% to read as a child (about 6 heads tall). Shading is a light-to-shadow gradient on each shape, lit from the upper left, with warm-brown shadows (`color.ts`) and no outlines. The choices are a small JSON object (`CharacterSpec`, in `spec.ts`): 10 skin tones, 8 hairstyles, 6 hair colours, 5 outfits (two school uniforms, kurta pyjama, salwar kameez, T-shirt and jeans), 6 clothing colours, patka, hijab or dupatta in 6 colours, glasses, and a school bag. Poses (idle, walk, talk, wave, gasp, cheer) are CSS in `character.css`: each is a static position plus an optional animation. Calm mode removes the animations and keeps the positions. Facing left mirrors the `<svg>` with CSS, so the pivots stay correct. The portrait view is the same drawing with a head-and-shoulders `viewBox`.
- **Why:** One file of plain shapes the owner can read and tweak. There are no image assets to licence, and it stays sharp at any size. CSS keyframes are simpler than JavaScript animation for loops like walking and blinking.
- **Alternatives:** Raster sprites (a licence for every frame, blurry when scaled), Rive or Spine rigs (new tools and dependencies), the `motion` library for every loop (more code for the same result).

## D-020 Character builder, portraits, and the character saved per profile

- **Context:** Players pick a character during onboarding and can change it in Me. Dialogue and results need a head-and-shoulders portrait.
- **Choice:** `CharacterBuilder` is a controlled component: a live preview that waves after each change, a row per part (thumbnails for styles, swatches for colours, Yes/No for glasses and bag), and "Surprise me". Selected choices get a dark ring and a tick (never colour alone). Onboarding starts from a random character. `/me/character` edits a draft and saves on "This is me!". `Portrait` reuses the same drawing with a portrait `viewBox`. Each profile now stores `avatar`. The saved state moved to version 2, with a migration that gives older profiles the default character, and loading repairs any invalid avatar with `normalizeSpec`.
- **Why:** One drawing everywhere means the player always looks like themselves. Thumbnails show the actual result, which young players understand better than words.
- **Alternatives:** Text-only option lists (harder for 8-year-olds), a separate portrait drawing (two things to keep in sync).

## D-021 Scene engine: one pure reducer, drawn by React

- **Context:** The engine must play any scene from its JSON alone, never refer to a building by id, work with keyboard, touch and tap, and be testable.
- **Choice:**
  - **Logic** (`src/engine/movement.ts`, `story.ts`, `sceneState.ts`) is pure. `sceneReducer(scene)` turns actions (`tick`, `walkTo`, `use`, `jumpTo`, `interactNearby`, `next`, `choose`, `activity`) into a new `SceneState`: position, camera, Mitthu, dialogue, flags, retries, hint, exit, completed. A `tick` carries the elapsed time and the current time, so walking speed doesn't depend on frame rate and Mitthu's 20-second hint is measured, not counted. When nothing visible changes, the reducer returns the same state object, so an idle scene doesn't redraw.
  - **Drawing** (`Scene.tsx`) runs a `requestAnimationFrame` loop that only sends `tick`s. Keys (arrows/A/D, E, Enter), the touch walk pad and tap-to-walk send actions. Layers come from the art registry (`src/art`) by key: speed < 1 is behind the stage, speed > 1 is in front. People come from `content/npcs.json`.
  - **Accessibility:** "Things to do here" jumps straight to any visible hotspot. The dialogue sits below the scene (never covering the speakers), types by grapheme, and announces each full line through `aria-live`. Read-aloud uses the browser's own speech.
  - **Calm mode** turns off parallax, camera smoothing, the typewriter, bobbing and screen nudges. **Gentle** scenes play sounds at half volume and never nudge the screen.
- **Why:** A pure reducer is the simplest way to make a game loop testable and explainable: 41 unit tests play the real sandbox JSON, including a full walkthrough with a retry. React only draws.
- **Alternatives:** A canvas game engine such as Phaser or PixiJS (a big dependency, and canvas is invisible to screen readers), game state kept in refs and mutated (fast but hard to test).

## D-022 Scene art: hand-drawn SVG layers with one lighting logic

- **Context:** The art direction asks for grounded, warm, painterly scenes with golden-hour light, light shafts, grain, depth blur and ambient life, kept consistent across every building. The Phase 2 gate decides whether this approach is good enough.
- **Choice:** Each scene's art is plain SVG components in `src/art/<scene>.tsx`, registered by key in `src/art/index.ts`. The School look-dev has seven layers: sky 0.05, far hills 0.15 (blurred), town 0.4 (lightly blurred), trees 0.65, school and courtyard 1 (the stage), a light layer fixed to the screen and drawn in front, and blurred foreground leaves at 1.35.
  - **One lighting logic everywhere:** the sun is low on the right, warm light falls on right-facing surfaces, and the left side gets cool violet-grey shade. Shadows are cast long to the left, and colours fade into a warm haze with distance (`HAZE`).
  - **The light layer** (warm colour grade, three soft shafts, dust, vignette) sits in front of the characters, so they share the same light. For that, layers gained an optional `front` flag in `content/types.ts`.
  - **Film grain** is an engine-level overlay, so every scene has the same texture.
  - **Ambient life** (birds, dust, a slow shaft glow) is CSS animation that stops in calm mode. Seeded random numbers keep each scene identical on every visit.
- **Why:** No image files to licence, sharp at any screen size, small to download (the whole School backdrop is code), and it shares the character's style. The light layer is the cheapest way to make every element feel lit by the same sun.
- **Alternatives:** Painted raster backdrops (would look richer, but need an artist and licences, are heavy on school connections, and blur when scaled), WebGL or 3D (out of scope; a stretch goal in §3).

## D-023 Character design and cover page reopened on owner feedback

- **Context:** On 2026-10-15 the owner said they do not like the cover page or the character design (D-019, D-020). The character gate had been approved on 2026-10-14; the look-dev gate (D-022) was still waiting.
- **Choice:** Phase 2 gets an "Owner feedback rework" section in BUILD_PLAN: clarify the feedback, redesign the cover page, redesign the character, then re-run both 🛑 gates. Phase 3 does not start until both are approved.
- **Why:** The plan's rule is to change the look before more scenes depend on it. Every later scene, portrait and result screen reuses the character.
- **Still open:** what "cover page" refers to (most likely the first screen, `/#/onboarding`). The next session asks the owner first. The engine (D-021) is unaffected; only art and the first screen change.

## D-024 Character redesign: painted game-character look

- **Context:** The owner found the first character (D-019) fake-looking and asked for the feel of *Attack on Titan* or *GTA V* characters: realistic body proportions, colour, shadows and depth, without copying either.
- **Choice:** The same single SVG rig, `CharacterSpec` and options (so saved profiles and the scene engine are unchanged), redrawn: about 6.5 heads tall with real anatomy (shoulder caps, tapering arms and legs, knees, hands with thumbs, a defined jaw and chin, almond eyes with irises, lash lines and lid shadows, a shaped nose and lips). Shading is "cel" style: a thin ink outline in a dark version of each colour, a hard edge between the lit side and a cool plum shadow (`shade()` in `color.ts`), a bright rim on the lit edge, and painted cast shadows (hair on the forehead, chin on the neck, arms on the body, sleeves on arms). Trousers are joined by a still hip piece so the legs can swing. The SVG may draw outside its box, so a raised arm isn't cut off.
- **Why:** Anime and game characters read as "real" mostly through proportions, hard-edged light and shadow, and outlines, all of which SVG does cheaply. Keeping the rig means no migration and every pose, portrait and scene keeps working.
- **Alternatives:** 3D models or raster art (needs an artist, licences, much heavier downloads); a full 3/4 view (twice the drawing work for every option; may come later).

## D-025 Cover screens and a game-style character customiser

- **Context:** The owner said the screens before the game (welcome, name, then age and the player picker) were blank plain text, and asked for the customiser to feel like a game's (e.g. BGMI).
- **Choice:** A painted cover backdrop (`src/art/cover.tsx`): a golden-hour rooftop view over an Indian town with a skyline, kites, birds, marigold lights and dust, all SVG and CSS. The welcome screen shows a gold game title, Mitthu's greeting in a glass panel, a glowing start button and three explorers on the roof. The name and age steps use glass cards over a dimmed backdrop with a "Step n of 3" bar; the player picker uses portrait cards. These screens use `Shell immersive` (a see-through top bar; "Need help?" stays). The customiser is a dark studio: the character large on a lit platform with "Try a pose" buttons, part tabs (Face, Hair, Clothes, Head covering, Extras; a proper ARIA tab list with arrow keys), and item tiles with a gold frame and a tick for the chosen one.
- **Why:** The first screens set the tone for the whole game. No new dependencies; every string goes through `t()`; calm mode stops all of the motion.
- **Alternatives:** A video or raster title screen (heavy, needs licences); keeping one long scrolling list in the customiser (simple, but did not feel like a game).

## D-026 School scene restyled to match the characters

- **Context:** After the character redesign (D-024), the owner chose to restyle the School look-dev scene rather than approve it, because the soft, outline-free backdrop (D-022) didn't match the outlined, cel-shaded characters. The building was also too small: doors came up to a child's shoulders.
- **Choice:** Same layers and parallax, redrawn with the character rules: ink outlines in the characters' dark plum (3 units on the stage, thinner further back, none on the hazy hills), flat colours with hard-edged shadow shapes instead of soft gradients and blur (only the nearest leaves and the light shafts stay soft, for depth), and deeper colours. The building, wall, trees and planters are rescaled so a child (now 400 units tall in scenes, adults 470) is shorter than a door. Character outlines got slightly thicker (1.05 units) so they hold up at scene size.
- **Why:** One consistent look across the characters and every scene. Later buildings copy this scene's rules.
- **Alternatives:** Keeping the soft painted backdrop with only the characters outlined (approved by nobody; looked like stickers on a painting).

## D-027 School story, and a fact-check record on every rights card

- **Context:** Phase 3 starts with the School scene (right to education). The plan says legal fields must be accurate, sourced and flagged for the owner's fact check, and the child must be the helper, never the one harmed.
- **Choice:** The story is about access, not harm. Lata, 9, new in town, watches from the gate because her family believes school costs money and that she needs a birth certificate. The player listens (Ravi, Lata), finds evidence (the admissions notice) and asks the right adult (Meena Didi). The two weaker choices ("not my business", "maybe next year") get a believable reply and Mitthu's "let's try that again". The card quotes Article 21A and RTE Act section 14(2) word for word. `Card` gained a `review` block (the same `ContentReview` shape the Help Centre uses) with a list of `checks`. The validator requires it on every card, and refuses `"verified"` without a name and date.
- **Why:** A birth certificate is a real, common barrier that the law speaks to directly, and the fix (tell a teacher, who helps with admission) is something a child can actually do. Putting the review record in the content file keeps the fact check next to the words it covers, and makes it testable.
- **Alternatives:** A separate fact-check spreadsheet (would drift from the content); a story about a child being kept home to work (that belongs to the Dhaba building, child labour).

## D-028 The play loop: card, quiz, results, badges and the arrival line

- **Context:** Phase 3 needs a building to play from start to results (BUILD_PLAN §2 steps 1 and 5 to 7, §7 rules). The plan names badges but never defines them.
- **Choice:** One screen, `/play/:id`, steps through scene → card → quiz → results with plain React state. `src/lib/scenes.ts` is the content registry (building id → scene file), like the art registry, so the engine still never names a building. The card arrives face down and flips (CSS 3D, instant in calm mode). The quiz shows one question at a time with words and an icon for right or wrong (never colour alone), then the explanation. Under 60%, Mitthu offers a hint round of only the missed questions, explanation first; it can't change the score, because `scoreQuiz` only counts first attempts. Results show each star with the rule that earned it. Saving happens once, in the quiz's finish handler: `recordResult`, the card, and any new badges. Five badges, all about the child's own play, never a comparison: `first-steps`, `right-first-time`, `quiz-whiz`, `kind-helper` (two buildings), `all-buildings`. Scenes gained an optional `intro` node that opens on arrival (step 1 of the core loop).
- **Why:** Keeping the flow in one screen with a `stage` value is the simplest thing a reader can follow in a viva. Badges as a pure function are testable and can't award anything competitive by accident.
- **Alternatives:** A route per step (`/play/school/card`, …) would let a child deep-link past the story; a state-machine library would be more to learn for little gain.

## D-029 Temporary town hub, driven by content

- **Context:** Phase 3 needs somewhere to start and finish School, with unlocks saved, before the walkable town of Phase 4.
- **Choice:** `/town` is a plain list of building cards. Names and rights live in `content/buildings.json` (validated), not in code. Each card's state comes from `isUnlocked` and saved progress, plus whether the building's scene exists yet (`getScene`): playable, locked ("Finish X first"), being built, or coming soon (teasers). Mitthu points to `recommendedBuilding`, but only when it can be played. The rules now take a `BuildingRef` (id and teaser), since that is all they use.
- **Why:** It is the smallest screen that proves the unlock rules end to end, and it will be replaced, so it stays simple. Keeping names in content means Hindi (P6) only changes JSON.
- **Alternatives:** Waiting for the walkable town (would block the Phase 3 milestone); hard-coding names in the screen (breaks the "content in JSON" rule).

## D-030 The walkable town: a hub scene, locked exits, and no full-screen blend modes

- **Context:** Phase 4 replaces the temporary list with a walkable town played by the same engine. Buildings are doors; locked ones must stay shut with a gentle reply; teasers say "Coming soon"; Help has its own door. The engine must still never name a building.
- **Choice:**
  - `content/scenes/town.json` is a **hub** scene (`hub: true`): no card or quiz, and it never "completes", so the engine keeps running. Each building is an `exit` hotspot with `to` (the building id, or `help`) and a `lockedNode` (Mitthu's gentle reply).
  - The **host decides locks**: `Scene` takes a `locked` set of hotspot ids, and the reducer plays an exit's `lockedNode` instead of leaving. `Town.tsx` builds the set from `isUnlocked` and whether the building's scene exists. Locked doors show a padlock, and the words say "locked" for screen readers.
  - `Scene` also takes `startX`, so coming back from a building starts you outside its door (`Results` and an early exit pass `{ from: id }` in the route state).
  - The validator checks hubs (no card or games), `lockedNode` targets, and that every hub door leads to a building or `help`.
  - Shared drawing helpers moved to `src/art/style.tsx`; the town reuses the School's sky, hills, houses, light and leaves layers.
- **Performance finding (scenes):** the town and School ran at about 30 fps in headless Chromium, against 60 for the plain sandbox. The cause was two full-screen **blend modes** (the light shafts' "screen" and the film grain's "overlay"): without a GPU, they are recombined on every frame in which anything animates. Plain transparency looks almost identical and brought the town to 59 fps and the School to 47. Moving things also now sit in their own small SVGs (birds, dust, shafts' glow), and the town street is static.
- **Performance finding (cover screens, D-025):** the screens I built for the owner's redesign ran at 10–22 fps there. Two causes: a blur over the whole animated picture behind forms, plus a live "frosted glass" blur on the panels; and dozens of tiny animations (stars, windows, bulbs) that each made the big picture repaint. Now: behind forms the picture is dimmed and holds still (no blur); panels are a plain tinted see-through; the small twinkles are still. Forms went from 10–15 to 60 fps, and the welcome screen from 21 to 36, with the kites, birds, flag, light rays and waving characters still moving.
- **Why:** Locks are progress, not content, so the host owns them, and the engine stays building-agnostic. The blend modes were a large cost for almost no visual gain, and slow devices are exactly the school machines this is for.
- **Alternatives:** A special "town engine" (duplicates the scene engine); locks written into content (they change with progress); keeping the blends and turning effects off in tests (would hide a real cost from the children's devices).

## D-031 A living town: Mitthu's guidance, the return celebration, and progress you can see

- **Context:** BUILD_PLAN P4 asks for Mitthu to point the way, a celebration when the player comes back, and a town that changes as buildings are completed (lanterns, bunting, more villagers). The engine must still not know about buildings or progress.
- **Choice:** Three small, general things the hosting screen can give a scene:
  - `startFlags`: flags set from the start. The town lists the ones it accepts in `hostFlags` ("done:school" and so on), so the validator knows them. Content uses them like any flag (Lata appears outside the School with `showIf: ["done:school"]`), and layer art now receives the flags too (the street hangs a marigold garland and paper lanterns over each finished building, and adds bunting as more are done).
  - `guide`: a hotspot Mitthu points at (a bobbing Mitthu and arrow over the door; "Mitthu suggests" in "Things to do here") plus the text for his 20-second idle hint, for scenes without objectives. The town guides to `recommendedBuilding`.
  - `skipIntro`: coming back from a building doesn't replay the first-visit welcome.
  - **Return celebration:** when the quiz ends, Play works out what to celebrate (stars, and a place that opened). Results passes it to the town through the route state, and the town shows it once: Mitthu's card, confetti in normal scenes, soft rising sparkles in gentle ones, nothing moving in calm mode. The town then clears it from the history entry, so a reload or Back never repeats it.
  - **Honest announcements:** "A new place is open" (results and celebration) appears only if that building's story exists, so the door really opens. Until the Dhaba is written, unlocking shows as "Being built" on its card.
- **Why:** Progress belongs to the host; content and art just react to flags, the same tool scenes already use. Keeping the celebration in route state, not saved data, means it can never show twice or leak into another player's town.
- **Alternatives:** Celebration saved in the store (needs clean-up, can show twice); a separate "town state" passed to art (a second mechanism next to flags); announcing every rule-level unlock (told children a door was open when it wasn't).

## D-032 Book, Me, Credits and demo mode

- **Context:** BUILD_PLAN P4 asks for the Book (card album), Me (character, badges, settings, switch player), Credits (assets and the legal source of every card), badges and demo mode. The data already existed: `extras.cards`, `extras.badges`, progress, and the demo-mode rules.
- **Choice:**
  - **Book** (`/book`): one slot per playable building, in town order (`cardsInTown()` in `src/lib/scenes.ts`). A collected card shows its front and opens to read again; others lie face down and say how to collect them ("Help at The School…", or "still being written"). The card's front, back and details are now shared pieces (`src/play/RightsCard.tsx`) used by both the card reveal and the Book, so a card always reads the same.
  - **Me**: portrait and the player's own star total, all five badges marked "Earned" or "Not earned yet" (words, not just colour), the settings (`SettingsControls`, the same switches as the Settings dialog), "Switch player", and a link to Credits. Badge names live in one place (`src/play/badgeText.ts`).
  - **Credits** (`/credits`): art and sound are made in code for this project; the fonts come from `content/credits.json` (keep in step with `docs/ASSET_LICENSES.md`); and every card's `source` is shown exactly as written.
  - **Demo mode** (`src/components/DemoMode.tsx`, in the Shell, so it works on every screen): type d-e-m-o anywhere except a text box, or press and hold the logo for 2 seconds (a long press doesn't also follow the link). A "Demo mode" chip in the top bar turns it off, and screen readers hear when it turns on. Demo mode opens every playable building by the existing `isUnlocked` rule; a building whose story isn't written still says "Being built".
  - Removed the last live blurs (the top bar, a customiser button, a profile card), following the performance rule from D-030.
- **Why:** Everything reads from data that already exists, so there is no new saved state and nothing to migrate. Sharing the card pieces keeps legal text identical wherever it appears.
- **Alternatives:** A separate Book card design (risks the law reading differently in two places); demo mode as a hidden route (harder to show in a viva, and the plan names the key sequence and the long press).

## D-033 The Dhaba: child labour, told gently

- **Context:** The second building teaches freedom from child labour. The safety rules say the child is always the helper or witness, harm is never shown, and heavy stories use the `gentle` tone. Legal text must be quoted exactly, sourced, and fact-checked by the owner.
- **Choice:** Raju, 12, washes glasses at the roadside dhaba because his father is ill. Nobody is cruel to him: Mohan Bhaiya is simply busy, and Raju says he misses school and maths. The player listens to Raju, notices his last Class 6 notebook, and tells Sunita Didi, the local anganwadi worker. Two weaker choices ("he's just helping out", "he should work faster") get a gentle reply and Mitthu's retry. The good choice: Sunita explains that no child under 14 may be made to work, says she'll visit the family (help exists when a parent is ill), talk to the owner, and call 1098 if needed; Raju returns to Class 6. The scene uses the `gentle` tone (quieter sound, soft sparkles, never a screen shake, and a results note linking to Help). The card quotes Article 24 and section 3(1) of the 2016-amended Act. The teen text adds the family exception and the rule for 14 to 18-year-olds. **Penalties are left out on purpose**, so there are no figures to get wrong; all legal claims are listed in `card.review.checks` (SETUP.md §6). New art: `src/art/dhaba.tsx` (a painted truck, the dhaba with awning, tandoor, chai counter, charpai, shelf and washing corner) and a notebook prop; new characters Raju, Mohan Bhaiya and Sunita Didi.
- **Why:** A child at work, seen and listened to rather than shown suffering, is enough to teach the right, and the action a child can take is the same as at School: tell a trusted adult. Gentle tone matches the weight of the topic.
- **Alternatives:** An angry confrontation with the owner (puts the child in a risky role); a factory setting (harder to make gentle, and the dhaba is the building in the plan); quoting penalty amounts (more to verify, and not what a child needs to act).

## D-034 A quiet title menu, and a modern character customiser (owner feedback)

- **Context:** The owner found the cover screens "too Diwali-like" (purple dusk, string lights, kites, gold lettering) and the customiser cluttered (full-body thumbnails overlapping, traditional clothes, no boy or girl choice). They asked for a professional, minimal look in rich beige, a game-style main menu (like aidungeon.com: logo, one short line, plain choices), a new game that asks the name first and then the character, modern clothes and haircuts, and a gender choice.
- **Choice:**
  - **Title menu** (`src/screens/Title.tsx`, now the page at `/`): the word SAKSHAM in the serif, spaced wide, a short rust rule and one line ("Know your rights. Play your part."), then the menu on the left: Continue (as the current player), New game, Change character, Switch player, Settings. On the right, the player's character (or two explorers) on a soft beige circle. Nothing animates. `StartRedirect` is gone: a returning player now sees Continue instead of being sent straight to the town.
  - **New game** (`src/screens/Onboarding.tsx`): two steps instead of four. Step 1 is one card: first name, with "How old are you?" (8 to 11, 12 to 16) under it; both are needed. Step 2 is the customiser. The Mitthu welcome screen is removed (Mitthu still guides in the town).
  - **Look**: new tokens `cream`, `linen`, `oat`, `espresso`, `umber`, `rust` (`src/index.css`) and `src/components/cover.css`. The painted dusk backdrop (`src/art/cover.tsx`) is deleted. Menus and forms use **Inter** (`@fontsource-variable/inter`, SIL OFL 1.1, bundled like the Noto fonts); the logo stays in Noto Serif. The game screens keep their look for now; the owner will review them next.
  - **Customiser** (`src/character/CharacterBuilder.tsx`): the character large on the left; on the right "Play as Boy / Girl", then tabs Skin, Hair, Top, Bottoms, Extras with word chips and round colour dots. No small character pictures, so nothing can overlap. Selected = dark fill plus a tick (never colour alone).
  - **Character spec** (`src/character/spec.ts`): new fields `gender`, `bottom` and `bottomColor`. Players choose from modern lists only: hair by gender (boy: short, side parting, fade, buzz cut, curly; girl: long, ponytail, bob, long curls, bun), tops (T-shirt, shirt, hoodie, jacket), bottoms (jeans, trousers, joggers) and calm colours. Girls' eyes get a small lash flick; bodies are the same. The drawing still knows the uniforms, kurta, salwar kameez, plaits and dupatta, because the people in the stories wear them (`content/npcs.json`). Patka and hijab stay as choices under Extras: they are religious head coverings rather than traditional dress, and removing them would leave some children unable to look like themselves.
  - **Saved players:** no store migration. `normalizeSpec` fills the new fields, guessing the gender of older characters from their hairstyle; an old kurta or salwar stays until the player changes it.
- **Why:** The owner's direction, and it suits a project that will be shown in a viva: calm, readable and clearly "a game menu". Word chips are smaller, clearer and cheaper to draw than a grid of characters.
- **Alternatives:** Restyling the dusk art in beige (still busy); keeping the four-step onboarding (the owner asked for name then character); removing patka and hijab (excludes Sikh and Muslim children); a gender toggle that also changes body shape (much more drawing for little gain at ages 8 to 16).

## D-035 Prototype of the new gameplay frame (proposed, waiting for the owner)

- **Context:** The owner wants the game itself rebuilt in the new modern look: full screen, W A S D to walk, dialogue in a see-through strip at the bottom (name, then the line, click to go on, like a visual novel), small menu words underneath, and an area map to travel between places once they open. They asked for a prototype to approve before the real rebuild. They also asked for a picture, Mitthu and a little more colour on the title screen.
- **Choice:** A self-contained prototype at `/proto` (`src/proto/`), linked from the title menu: one scene, the School yard, drawn in the new flat style (`src/art/schoolYard.tsx`), with walking along and into the yard (W A S D, arrows or tapping the ground), the real School lines from `content/scenes/school.json`, Back, History, Map, Book, Settings and Exit along the bottom, and an illustrated area map (`AreaMap.tsx`). Need help? stays in the top-right corner. The title screen now shows the School yard as a framed picture, with Mitthu perched on the heading and teal and marigold accents.
- **Why:** Showing the frame on one scene is cheap to change. The existing engine and scenes stay untouched until the owner approves.
- **Next, if approved:** move this frame into `Scene.tsx` and `Dialogue.tsx` (2D walking needs a depth value in `movement.ts`), redraw the town, School and Dhaba in this style, replace the street-style town with the map, then delete `src/proto/`.
- **Revision 1 (owner feedback, option A of three: keep React and SVG, raise the art):** darker late-afternoon light with cast shadows, shading where walls meet the ground, haze in the distance and a colour grade with darker edges; a modern school in concrete, glass, timber and brick (like a new European campus); soft noise-based clouds on their own drifting layer behind the school; the camera zoomed in and gliding after the player, whose speed now eases in and out; and a real walk cycle in `character.css` (reach, weight, push off, lift; arms against legs; body dip and lean), shared with the existing game. The other options were painted background images (more realistic, but the images have to come from somewhere, with a licence for each) and a game engine (big rewrite, slow without a GPU).
- **Approved** by the owner on 2026-10-16, then built for real in D-036. `src/proto/` was deleted.

## D-036 The full-screen game frame and the modern scenes

- **Context:** The owner approved the prototype (D-035) and asked for the real game in that style: full screen, W A S D, the dialogue strip, the menu words, the map, and every scene redrawn.
- **Choice:**
  - **Engine** (`src/engine/`): the player now also has a `depth` (0 = the far edge of the walkway, 1 = nearest the viewer). W and S (or up and down) change it, tapping the ground walks to a spot and a depth, and using a hotspot walks to stand beside it at about its depth. Hotspots may give a `depth` in content (default: people 0.35, things 0). People are drawn a little bigger when nearer, in front of those further away, each with a shadow cast to the right. Being near a hotspot still depends on x only, so the story logic is unchanged. A conversation now keeps a `trail`, so **Back** shows the line before (flags already set stay set, so Back can never undo progress), and the state keeps `seen`, every line shown, for **History**. All of this is in the pure reducer, with unit tests.
  - **Scene player** (`Scene.tsx`, `scene.css`): fixed to the whole screen, the camera closer (780 of the 1000 units of height fill the screen) and gliding after the player. Top left: the main menu, the place's name and its objectives as a small checklist. Top right: Need help? (always). Bottom: the dialogue strip (`Dialogue.tsx`: the speaker's name in their colour, the line, Next or choices; clicking the line also goes on), then the menu words: Back, History, Things to do (the old "Things to do here" list, now a panel), Map, Book, Settings, Exit. M opens the map, Escape closes panels. A colour grade (darker corners) and a slight darkening of people keep everything in the same light; no blurs or blend modes (D-030).
  - **Map** (`src/components/AreaMap.tsx`, `src/play/useMap.ts`): a drawing of the neighbourhood with a pin for the town square, each building (from `buildings.json`, which now gives each one a map position) and the Help Centre. Open places travel there; locked ones say why ("Finish The School first", "Coming soon"); finished ones show their stars; Mitthu's suggestion is marked. It replaces the building cards that used to sit below the town.
  - **Art**: a shared kit (`src/art/modern.tsx`: sky, an evening sky for gentle scenes, noise clouds on a drifting layer, the hazy distance, paving, window bands, trees, lamps, benches, railings, cast shadows, facade light). The School (`school.tsx`), the Dhaba (`dhaba.tsx`, at dusk with warm bulbs) and the town street (`town.tsx`, a front for every place; warm lights over finished ones, boards across places still to come) are redrawn with it. Scene JSON now lists five layers: sky, clouds (`"drift": true`), far, stage, front.
  - **Screens**: `/town` and `/play/:id` (and `/dev/scene`) are outside the top-bar Shell. The card, quiz and results show in `GameFrame`: the scene's picture, dimmed, behind a light panel, with the main menu and Need help? in the corners. Travelling from one building to another restarts `Play` cleanly (it is keyed by the building id). The title picture is now the real School (`ScenePicture`). `/dev/look` is removed (it was the School scene, now at `/play/school`).
- **Why:** The owner's direction. Keeping the reducer, story and content format means every story, rule and test of the game logic still holds; only how it is shown changed.
- **Alternatives:** Real depth for the story (being near in x and depth) would mean re-placing every hotspot and changing the story rules, for little gain. A canvas or game engine was ruled out in D-035. Keeping the building cards under the town would not fit a full-screen game; the map shows the same facts.

## D-037 Home: the right to be safe, told gently

- **Context:** The third building teaches that no one may hurt a child. The safety rules say the child is always the helper or witness, harm is never staged or shown, and heavy stories use the `gentle` tone. Legal text must be quoted exactly, sourced, and fact-checked by the owner.
- **Choice:** The courtyard of the player's block of flats at dusk. Kabir mentions that Anu (10) has stopped playing cricket. Anu, by the stairs, tells the player in words that her uncle hits her when she makes mistakes and told her to keep it secret; the player listens and says it isn't her fault. Her drawing by the letterboxes (her family big and colourful, herself small under a grey cloud) is the one visual clue, and it shows no harm. The player tells Farida Aunty, a neighbour who works at the health centre. Two weaker choices ("it's a family thing", "Anu should be more careful") get a kind reply and Mitthu's retry; the good choice brings the message that nobody, not even family, may hurt a child and it is never the child's fault, with a plan (sit with Anu, talk to her mother, call 1098 together if needed). The card quotes Article 39(f) and section 75 of the Juvenile Justice Act, 2015, stopping before the penalties, as on the Dhaba card. Every legal claim is in `card.review.checks` (SETUP.md §6). New characters Anu, Kabir (children in modern clothes, matching the new style) and Farida Aunty; new art `src/art/home.tsx` (the courtyard, built from the modern kit) and the letterbox prop with the drawing.
- **Why:** A disclosure heard by a friend, and the friend telling a trusted adult, is the action a child can safely take; it is the same pattern as the School and the Dhaba, so the game teaches one clear habit. Physical harm is the most widely understood form for ages 8 to 16; sexual abuse needs more care than a short game scene allows and is not attempted here.
- **Alternatives:** A "safe and unsafe secrets" story with no named harm (too vague to teach the right); quoting POCSO (a different topic, needing much more care); showing an adult being angry (would stage harm).

## D-038 True scale, knees, a new ponytail, and no voice (owner feedback)

- **Context:** After playing the new game the owner said: the player seems to slide instead of walk; every door looks far too small next to the people; the ponytail looks off; and the read-aloud voice sounds too robotic, so remove it.
- **Choice:**
  - **True scale.** Buildings were drawn at about a third of the people's size (a storey of 170 units next to a 400-unit child). Now a child is 300 units (adults 350), a door is 400 units (`DOOR_TOP` in `modern.tsx`), the ground floor ends at `SLAB` (360), and benches, bikes, lamps, planters, trees, tables and props are drawn at the same scale (the kit pieces scale around their base with `scaleAt`). The School, the Dhaba, Home and every front in the town are redrawn to these heights; positions along the street are unchanged, so the content files did not change. The camera shows the lowest 660 units (it was 780), so the people stay about as big on screen and the upper floors mostly leave the picture, as when you stand in a street.
  - **Knees.** Each leg is drawn twice and cut at the knee with a clip path: the thigh swings from the hip and the shin bends at the knee (`ch-shin-l/r` and `ch-knee` in `character.css`). The arms swing a little less. Walking is the one animation calm mode keeps, because the child moves the character themselves; idle breathing, looking around and everything ambient still stop.
  - **Ponytail.** A high ponytail: volume and a hair tie at the crown, a fuller tail falling behind the head to the shoulder, and a side-parted front with loose strands by the face.
  - **No voice.** The "Read aloud" setting, the button in the dialogue strip and `src/engine/speech.ts` are removed. Saved settings that still contain `narration` are harmless (the key is ignored).
  - Doors without a picture now show a flat glow on the ground in front of them instead of a ball in mid-air.
- **Why:** The owner's feedback. Real proportions make the places feel like places; knees are what makes a walk read as a walk.
- **Alternatives:** Keeping the art and only shrinking the people (the doors would still be smaller than the children unless the people became tiny); recorded voices (would need a voice actor and licences, and Hindi later; can be added in Phase 6 if wanted).

## D-039 Back to the earlier scale; going in through doors; the walk fixed for reduced motion

- **Context:** The owner preferred the scale before D-038: with whole buildings in view you can tell at a glance which place is the School and which the Dhaba. They asked instead that choosing a door makes the player walk to it, turn and go in. They also still saw the player sliding.
- **Choice:**
  - The scene art, people's sizes and the camera are back to D-036 (`school.tsx`, `dhaba.tsx`, `home.tsx`, `town.tsx`, `modern.tsx` and the constants in `Scene.tsx`). The knees, the new ponytail and the removed voice from D-038 stay.
  - **Going in** (in the pure reducer): opening an unlocked exit no longer leaves at once. It sets `entering`; the player walks to the door's x, then turns and walks up to it (depth 0), and after `ENTER_SECONDS` (0.6 s) the scene sets `exit`. While going in, the walking keys, taps and other hotspots are ignored. `Character` has a `back` view (the back of the head, hair or head covering, and the bag and ponytail over the back), used for the player once they reach the door, and the player fades into the doorway.
  - **The sliding:** with the system's "reduce motion" on (Windows turns it on when animation effects are off), a global calm rule in `index.css` shortened every animation to 0.01 ms, which overrode the D-038 exception. The walk is now excluded there too, and an e2e test checks that the legs move while walking with reduced motion.
  - The "still locked" page for a building (e.g. `/play/dhaba` before the School is finished) now sits in the game frame, so Need help? is there, and it names the place to finish first. The Dhaba is written and opens as soon as the School is finished (or in demo mode).
- **Why:** The owner's feedback; and Need help? must be on every screen.
- **Alternatives:** A cut to black on entering (no sense of going in); drawing a full back view of every outfit (the front of the clothes shows from behind, which is hardly noticeable at game size).

## D-040 The Panchayat: freedom from child marriage, told gently

- **Context:** The fourth and last written building teaches that children may not be married. The safety rules say the child is always the helper or witness, harm is never staged or shown, and heavy stories use the `gentle` tone. Legal text must be quoted exactly, sourced, and fact-checked by the owner.
- **Choice:** The village square in front of the Panchayat Bhawan, in daylight. Sonu says his sister Pooja keeps crying when she thinks no one is looking. Pooja (15, studying under the neem tree) tells the player in words that her family has fixed her wedding for right after her Class 10 exams, and that she wants to finish school and become a nurse. Her exam admit card on a bench shows she is fifteen (the one visual clue; no wedding is ever shown). The player tells Sarpanch Kavita ji. Two weaker choices ("weddings are a family matter", "she can still study until the wedding") get a kind reply and Mitthu's retry; the good choice brings the ages (a girl 18, a boy 21) and a plan: the Sarpanch visits Pooja's parents with the Child Marriage Prohibition Officer, and anyone can call 1098. The ending: the wedding is called off and Pooja is in Class 11. The card quotes sections 2(a), 2(b) and 13(1) of the Prohibition of Child Marriage Act, 2006 (what a child and a child marriage are, and that a magistrate must stop an arranged child marriage). No penalties are quoted. Both quotes were compared word for word with the PRS Legislative Research copy of the Act and Indian Kanoon; India Code timed out. Every legal claim is in `card.review.checks` (SETUP.md §6). New characters Pooja, Sonu (children in modern clothes) and Sarpanch Kavita ji; new art `src/art/panchayat.tsx` (the square, a hand pump, the neem tree on its platform, the Bhawan with its flag) and the bench prop with the admit card, all from the modern kit at the D-036 scale.
- **Why:** The same habit as the other three buildings (notice, listen, tell a trusted adult), so the game teaches one clear action. The Sarpanch is the natural trusted adult at a Panchayat, and section 16(2) lets the State ask a Gram Panchayat officer to assist the Child Marriage Prohibition Officer. Section 13 (an injunction stops a child marriage before it happens) is more useful to a child than section 3 (a child marriage can be annulled afterwards), because the story is about stopping one.
- **Alternatives:** Quoting the penalty sections (left out, as on the Dhaba and Home cards); showing wedding preparations (a tent, an invitation) as clues (would stage the harm); a teacher as the trusted adult (already used at the School).

## D-041 The sort game: two boxes, drag or tap, one card at a time

- **Context:** The plan asks for a sort game (drag plus a tap alternative) in at least two buildings, scored like the quiz (BUILD_PLAN §7: correct on the first attempt out of the total).
- **Choice:** A new game kind next to the quiz in `content/types.ts`: `SortGame` has a `prompt`, exactly two `bins` and a list of `items` (each with its right `bin` and an `explanation`). `src/play/Sort.tsx` shows one card at a time above the two boxes. The child drags the card onto a box (pointer events: the card follows the finger or mouse, and letting go over a box places it), or taps a box; the tap is also the keyboard and screen-reader way (each box is a button, "Put it in: Allowed"). The feedback then takes the card's place (so it is in view on a phone), says whether it was right, gives the right box and the explanation, and the card is listed in its right box. Only the first placement counts. A building plays its games in the order written (the quiz first, then the sort game), and `addScores` adds them into one game score, so the stars rules are unchanged: the Dhaba and the Panchayat now score out of 9 (4 quiz questions and 5 cards). The results line now says "answers right" and the star reason "in the games". The validator checks every sort game (two boxes with different ids, at least 3 cards, every card in one of the boxes, both boxes used) and still requires a quiz in every building. The two sort games: "Is this work allowed for this child?" at the Dhaba and "Is this wedding allowed?" at the Panchayat, five cards each, built only from points already on each card (and added to the card's fact-check list).
- **Why:** Two boxes and one card at a time is the simplest sort an 8-year-old can read, and it works the same with a mouse, a finger, a keyboard or a screen reader. Adding the scores keeps one score per building, so saved progress, badges and the stars rules need no change.
- **Alternatives:** All cards on the table at once (harder to read on a phone, and harder for a screen reader); a drag-and-drop library (not needed for one draggable card; no new dependency); scoring the sort game on its own (would need a second score in saved progress).

## D-042 Community: pledges, a cooperative mission, private questions, places that help

- **Context:** The last Phase 4 task (FR-10): a Pledge Wall (preset pledges only), a Class Mission (cooperative), Ask an Expert (private, stays on the device) and Places that help, labelled "Sample" where the data is not live. The backend (classes) only arrives in Phase 5, and the app must work with no network. The safety rules say children never see another child's free text, and nobody is compared.
- **Choice:** One page at `/community` (`src/screens/Community.tsx`) with four sections, all local. Every word comes from `content/community.json` (`CommunityContent` in `types.ts`) or the strings file.
  - **Pledge Wall:** six preset pledges; "I pledge this" saves the pledge's id in the player's `extras.pledges` (which already existed and is union-merged later). There is nowhere to type your own.
  - **Class Mission:** one goal in stars ("Together, collect 20 stars"). For now it adds up the stars of every player on this device, as one number with no names, and is labelled "Sample" with a line saying the whole class will count once the class joins. No made-up numbers are shown.
  - **Ask an Expert:** a text box (at most 280 letters, tidied by `cleanQuestion` in `rules.ts`) saves the question under the active player only (`questions` in `ProfileData`, optional so older saves still load). Only that player sees their questions, and can remove them. It is never synced. The page says plainly that Saksham doesn't send it anywhere and suggests showing it to a trusted adult, with a link to Need help? for anyone in danger now.
  - **Places that help:** six kinds of places (teacher, anganwadi, Gram Panchayat, health centre, police, 1098), with a `review` block for the owner's fact check (SETUP.md §5).
- **Why:** Everything works offline and needs no backend; the only free text a child writes stays with that child. Counting real stars from this device keeps the mission honest instead of showing a fake class total.
- **Alternatives:** A sample class total with made-up classmates (fake data, and it invites comparison); sending questions to an expert service (would send a child's words off the device, against the safety rules); a separate page for each section (more screens and routes for little gain).

## D-043 The Supabase project and the database schema

- **Context:** Phase 5 adds a thin backend (BUILD_PLAN §8): teachers with email accounts, children who join a class anonymously with a code and a first name, progress sync, a teacher dashboard, a cooperative class mission and a content review workflow. The owner asked Claude to set it up. Creating the project from Claude's tools was blocked by the session's safety settings, so the owner created it in the dashboard (Free plan, $0 a month; named `saksham`, ref `iggetuuoghdoyppdlppy`; it ended up in Tokyo rather than Mumbai, which only adds a little delay). Claude then set the auth options in the dashboard, the GitHub variables and `.env.local`, and applied the schema through the Supabase MCP.
- **Choice:**
  - **Auth:** anonymous sign-ins on (children), email sign-in with confirmation (teachers); site URL `http://localhost:5173`, redirect URLs for ports 5173 and 4173. In the project, "Automatically expose new tables" is off and "automatic RLS" is on, so nothing is reachable until a migration grants it.
  - **Schema** (`supabase/migrations/20261018080000_core.sql`): the eight tables of §8, all with RLS; checks for stars 0 to 3, scores 0 to 100, name rules and the join-code format (6 characters, no 0/O/1/I, made from random bytes). A trigger makes every new email user a teacher (anonymous users get no role). Progress only goes up and extras only grow (triggers apply the §7 merge rules on update). Helper functions live in a `private` schema that the API doesn't expose.
  - **Rights:** signed-out visitors can do nothing. A child reads and writes only their own rows and sees only the class they joined. A teacher reads only their own classes and students (and can remove a student), and can change only a class's name, code switch and mission target. Students are created only by `join_class`. Join codes change only through `rotate_join_code`. Content status changes only through the reviewer RPCs, and every step is logged.
  - **RPCs** (`security definer`, empty `search_path`, each checks its inputs): `join_class` (anonymous accounts only; wrong and switched-off codes give the same error), `leave_class`, `rotate_join_code`, `delete_class`, `submit_content_for_review`, `review_content` (a rejection needs a note).
  - **Views** (`security_invoker`, so the caller's own rights apply): `class_progress_summary`, `class_question_stats` (first attempts only) and `class_mission` (one class total, never per child).
  - **Hardening** (`20261018081000_hardening.sql`), from the Supabase advisors: Supabase's own `rls_auto_enable()` is no longer callable over the API, and the content-review foreign keys get indexes. The remaining advisor warnings are intended: anonymous users are the children, and signed-in users may call the RPCs because each one checks who is calling.
  - **Tests** (`supabase/tests/rls.test.sql`): one SQL script, run in a transaction that is rolled back, with two teachers and two children "signed in" through the JWT claims. It checks every rule above (37 checks). It runs in the SQL editor or through the Supabase MCP; it needs the project, so it is not part of CI yet.
  - **App:** `src/lib/supabase.ts` returns `null` without the two env vars, so the game stays fully local; `src/lib/database.types.ts` holds the generated types. New dependency: `@supabase/supabase-js`, the official client named in the plan's tech stack (§5), used for auth, tables and RPCs.
- **Why:** Rights are enforced in the database, not trusted to the app, so a child can never read another child's data even with a modified app. Keeping the backend optional means nothing in Phases 1 to 4 changes.
- **Alternatives:** Writing everything through RPCs with no table access (more code for simple reads); a teacher role granted by hand (an extra owner step for every teacher); pgTAP tests run by the Supabase CLI (needs Docker locally, which this laptop doesn't have).

## D-044 The teacher page: accounts and classes

- **Context:** BUILD_PLAN P5 asks for teacher sign up, sign in and sign out, and for classes that can be created, renamed and deleted, with a join code shown large, copyable, and able to be renewed or switched off. The database and its rules already exist (D-043).
- **Choice:** `/teacher` (`src/screens/Teacher.tsx`), linked as "For teachers" under the title menu. Email and password accounts through Supabase Auth, with email confirmation. The client uses the PKCE flow, so the confirmation link comes back as `?code=` rather than tokens after `#` (which the app's hash routes use); `main.tsx` sends a link with `?code=` to `#/teacher`, where the client signs the teacher in. Classes are read and changed straight on the `classes` table (the database only lets a teacher see and change their own, and only the name, code switch and mission target); a new code and deleting a class go through `rotate_join_code` and `delete_class`. After every change the list is loaded again from the server, so the screen always shows what is really saved. The code is shown in large letters, read out letter by letter to screen readers, can be copied, and deleting a class asks once more first. A child's anonymous session on a shared device is not treated as a teacher. Without the Supabase settings the page just says classes aren't available.
- **Tests:** `tests/e2e/teacher.spec.ts` answers the app's Supabase requests from a fake in the browser, so CI never makes accounts or touches the real project; the database's own rules stay covered by `supabase/tests/rls.test.sql`.
- **Why:** The database already enforces who may do what, so the screen stays simple and can't give a teacher more than the rules allow.
- **Alternatives:** Magic-link sign-in with no password (one less thing for teachers, but every sign-in needs an email, and Supabase's built-in email is heavily rate-limited); a separate teacher app (more to build and deploy for no gain).
- **Known limit:** Supabase's built-in email service only sends to the project team's own addresses and only a few emails an hour. Before real teachers sign up, the owner needs to add an email provider (SMTP) in Supabase (SETUP.md §4).

## D-045 Children joining a class: one anonymous login per player

- **Context:** BUILD_PLAN P5 asks for an optional "Join a class" step (class code plus first name), "Leave class" in Me, and calm messages for a wrong code, a switched-off code and no connection. A child has no email or password; the database makes a student from the anonymous login that calls `join_class` (D-043). A classroom tablet often has several players, but the Supabase client keeps one login at a time.
- **Choice:** A "My class" section on Me (`MyClass` in `src/screens/Me.tsx`), shown only when the class server is set up. The child types the code; their saved first name, age band and character go with it, nothing else. `src/lib/classroom.ts` does the work for the active player only. Each player keeps **their own** anonymous login (`cloud`: user id and refresh token) with their saved data, plus the class they joined (`classInfo`). Before joining or leaving, the app switches the client to that player's login (or makes a new anonymous one the first time), so two players on one device are two different students. Whenever Supabase renews a child's login in the background, `supabase.ts` saves the new token for the player it belongs to (`refreshCloud`), because each renewal replaces the old token. Leaving asks once more and says the game keeps everything. A wrong code and a switched-off code get one message (the server answers both the same way on purpose, so codes can't be guessed); no connection is checked first and gets its own message at once.
- **Why:** On a shared device, one login for everyone would make every child the same student. Saving each player's own login is the smallest way to keep them apart without asking a child for anything more than a code.
- **Alternatives:** Joining during the new-game steps (adds a step every child must pass, when most will play without a class); one login per device (players would overwrite each other's class); remembering only the user id (a lost session could never be used again).
- **Known limit:** Supabase allows 30 anonymous sign-ins an hour from one internet address by default, and a whole class on school Wi-Fi shares one address. Before a full class joins at once, the owner should raise that limit (SETUP.md §4).
