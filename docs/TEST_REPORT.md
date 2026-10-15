# Test report

Updated at the end of each phase. Test names start with the requirement IDs from BUILD_PLAN §11, so they map straight into the traceability matrix.

## Counts (Phase 3, 2026-10-15)

| Type | Tool | Files | Tests | Where |
| --- | --- | --- | --- | --- |
| Unit | Vitest | 9 | 171 | `src/**/*.test.ts`, `scripts/*.test.ts` |
| End-to-end | Playwright (Chromium) | 5 | 25 | `tests/e2e/shell.spec.ts`, `onboarding.spec.ts`, `scene.spec.ts`, `play.spec.ts`, `demo-path.spec.ts` |
| Safety invariants | Playwright (Chromium) | 1 | 16 | `tests/e2e/safety.spec.ts` |
| Content validation | `npm run validate` (CI) | n/a | n/a | `scripts/validate-content.ts` |
| RLS (database) | | 0 | 0 | from Phase 5 |

## What the tests prove

### Unit
- **`rules.test.ts` (46 cases; some cover several rules).**
  - FR-07 stars: 0/1/2/3 at exactly 60% and 90%, and the retry cap.
  - FR-07 best result: replays only raise stars and score.
  - FR-07 unlocks: School always unlocked, N+1 after N is completed, teasers never.
  - FR-07 recommended building.
  - FR-05 card text by band.
  - FR-06 band filtering, first-attempt scoring, and that the hint round never changes the score.
  - FR-12 merge: max for stars and score, union for extras, order-independent.
  - FR-17 demo mode.
  - FR-07 badges: none for an unfinished building; first steps, right first time and quiz whiz when earned; kind helper after two buildings; town hero after every playable one (teasers don't count).
  - FR-01/NFR-01 first-name rule: English and Hindi names accepted; digits, symbols, emoji and more than 20 characters rejected.
- **`validate-content.test.ts` (30).**
  - NFR-07: a valid scene passes, and one broken scene per rule fails (missing targets, no reachable good end, dead ends, unset flags, out-of-bounds hotspots, card and quiz errors).
  - NFR-09: every `t()` key in code exists.
  - NFR-06: `help.json` is valid, and sources must be https `.gov.in`/`.nic.in` pages.
  - People: every hotspot `npc` and node `speaker` must exist in `npcs.json`.
  - NFR-10: every rights card has a fact-check `review`; `"verified"` needs a name and a date.
  - `buildings.json`: unique ids, a name and a right each, and a playable first building.
- **`engine.test.ts` (24).** FR-02 walking bounds, blockers, tap-to-walk, camera clamping, parallax, and calm mode with no parallax. FR-03 the 120-unit prompt radius, `showIf`/`hideIf`, and nodes setting flags. FR-04 good choice to good ending; a weaker choice to consequence, retry and back to the choice, with retries counted; objectives; completion needs the good ending AND every objective.
- **`sceneState.test.ts` (17).** Plays the real `content/scenes/sandbox.json` through `sceneReducer`: walking, blocker, calm camera, tap-to-walk, use/jump/E on hotspots, hidden hotspots, no walking while talking, exits, a full playthrough with one retry, fx, Mitthu following, and the 20-second hint (never during a conversation).
- **`school.test.ts` (7).** Plays the real `content/scenes/school.json`: Mitthu's intro opens on arrival; Meena Didi takes the request only after the player has met Lata; both weaker choices lead back to the choice and count retries; the good choice completes the scene; it isn't complete until the notice is read; both age bands have questions; the card stays marked for the fact check until verified.
- **`spec.test.ts` (9).** Character option counts match the plan; "Surprise me" always makes a valid character; damaged saved characters are repaired.
- **`store.test.ts` (13).** FR-01 profiles: names are cleaned and invalid names saved nothing; progress is separate per profile; switching and removing profiles work; FR-07 results go through the rules; extras are added once; settings and demo mode; each player's character is saved, changed only for the active player, and repaired if invalid.
- **`sound.test.ts` (4).** NFR-06: full volume, half volume when gentle, silent when sound effects are off, and always silent on the Help Centre.
- **`i18n.test.ts` (5).** Lookup, `{placeholders}`, a missing key, and the shape of the strings file.

### End-to-end
- **`shell.spec.ts` (6).**
  - A new visitor goes to onboarding.
  - Guarded and unknown routes go back to the start.
  - Calm mode follows the system setting, and the "Calm motion" setting survives a reload.
  - No sideways scrolling at 360px wide.
- **`onboarding.spec.ts` (7).**
  - FR-01: a profile saves only id, first name, band and createdAt.
  - The player is remembered after a reload.
  - The band question uses the name and gets focus.
  - Two players can switch.
  - The character builder saves the chosen character, and it can be changed later from Me.
  - The builder's part tabs work with the arrow keys.
- **`scene.spec.ts` (6).** Plays `/dev/scene`: walk with the arrow keys (in short taps, so a busy machine can't walk past the prompt) and press E; "Things to do here" shows only visible hotspots; a weaker choice then the good one completes the scene with 1 retry; exits; calm mode shows whole lines at once; panel tap targets are at least 48px.

- **`play.spec.ts` (5).** FR-05/06/07, plays School at `/play/school`. The card flips, "Tell me more" shows the teen text, and the law matches content exactly. 3 of 4 right with one retry gives 2 stars, the first-steps badge and the Dhaba unlocked; the town shows it all and it survives a reload. A 25% score offers the hint round, which replays the 3 missed questions and leaves the score at 1 of 4. Teen players see the teen card and all 6 questions. A locked building can't be played. A new player's town has only School open.
- **`demo-path.spec.ts` (1).** MILESTONE A, the whole journey through the real UI: welcome, name, age, customiser, town, School story with a retry, card flip, a perfect quiz (2 stars, quiz whiz), back to the town, reload, then "Need help?" to a calm Help Centre with no Help button.

### Safety invariants (`safety.spec.ts`, 16)
| Test | What it proves |
| --- | --- |
| Help button on every route | All 14 routes except `/help` (including `/me/character` and the dev pages) show "Need help?" (FR-08) |
| Help Centre has no Help button | The Help button opens `/help`, and `/help` has none |
| Help reachable with no player | A first-time visitor can reach help |
| No sound on Help | Counts every WebAudio `start()`: a normal button increments it (control); on `/help` the count doesn't change |
| Nothing moves on Help | No running animations, no CSS animation or transition on any element |
| Nothing red on Help | No text, background or border colour where red dominates |
| No rewards on Help | No "point", "star", "badge", "reward", "marigold", "score" text |
| Name field (×7) | Digits, symbols, email, underscore, emoji and 21 letters are rejected, with nothing saved |
| Hindi name | A Devanagari first name is accepted |
| No other child's text | One player's name appears on no screen while another plays (except the player picker) |

## Latest CI run

| Date | Branch | Result | Link |
| --- | --- | --- | --- |
| 2026-10-14 | `p0-foundation` (PR #1) | ✅ lint, unit, build, e2e; deploy skipped | [run 38567125652](https://github.com/bhavyammisra/saksham/actions/runs/38567125652) |
| 2026-10-14 | `p1-core` (PR #2) | ✅ green, merged | |
| 2026-10-15 | `p2-character-scene` (PR #3) | ✅ green, merged | |
| 2026-10-15 | `p3-school` (PR #4) | ✅ green, merged | [run 38701159641](https://github.com/bhavyammisra/saksham/actions/runs/38701159641) |
