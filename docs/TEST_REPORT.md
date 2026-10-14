# Test report

Updated at the end of each phase. Test names start with the requirement IDs from BUILD_PLAN §11, so they map straight into the traceability matrix.

## Counts (Phase 2, 2026-10-15)

| Type | Tool | Files | Tests | Where |
| --- | --- | --- | --- | --- |
| Unit | Vitest | 7 | 155 | `src/**/*.test.ts`, `scripts/*.test.ts` |
| End-to-end | Playwright (Chromium) | 3 | 18 | `tests/e2e/shell.spec.ts`, `onboarding.spec.ts`, `scene.spec.ts` |
| Safety invariants | Playwright (Chromium) | 1 | 16 | `tests/e2e/safety.spec.ts` |
| Content validation | `npm run validate` (CI) | n/a | n/a | `scripts/validate-content.ts` |
| RLS (database) | | 0 | 0 | from Phase 5 |

## What the tests prove

### Unit
- **`rules.test.ts` (58).**
  - FR-07 stars: 0/1/2/3 at exactly 60% and 90%, and the retry cap.
  - FR-07 best result: replays only raise stars and score.
  - FR-07 unlocks: School always unlocked, N+1 after N is completed, teasers never.
  - FR-07 recommended building.
  - FR-05 card text by band.
  - FR-06 band filtering, first-attempt scoring, and that the hint round never changes the score.
  - FR-12 merge: max for stars and score, union for extras, order-independent.
  - FR-17 demo mode.
  - FR-01/NFR-01 first-name rule: English and Hindi names accepted; digits, symbols, emoji and more than 20 characters rejected.
- **`validate-content.test.ts` (25).**
  - NFR-07: a valid scene passes, and one broken scene per rule fails (missing targets, no reachable good end, dead ends, unset flags, out-of-bounds hotspots, card and quiz errors).
  - NFR-09: every `t()` key in code exists.
  - NFR-06: `help.json` is valid, and sources must be https `.gov.in`/`.nic.in` pages.
  - People: every hotspot `npc` and node `speaker` must exist in `npcs.json`.
- **`engine.test.ts` (24).** FR-02 walking bounds, blockers, tap-to-walk, camera clamping, parallax, and calm mode with no parallax. FR-03 the 120-unit prompt radius, `showIf`/`hideIf`, and nodes setting flags. FR-04 good choice to good ending; a weaker choice to consequence, retry and back to the choice, with retries counted; objectives; completion needs the good ending AND every objective.
- **`sceneState.test.ts` (17).** Plays the real `content/scenes/sandbox.json` through `sceneReducer`: walking, blocker, calm camera, tap-to-walk, use/jump/E on hotspots, hidden hotspots, no walking while talking, exits, a full playthrough with one retry, fx, Mitthu following, and the 20-second hint (never during a conversation).
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
- **`onboarding.spec.ts` (6).**
  - FR-01: a profile saves only id, first name, band and createdAt.
  - The player is remembered after a reload.
  - The band question uses the name and gets focus.
  - Two players can switch.
  - The character builder saves the chosen character, and it can be changed later from Me.
- **`scene.spec.ts` (6).** Plays `/dev/scene`: walk with the arrow keys and press E; "Things to do here" shows only visible hotspots; a weaker choice then the good one completes the scene with 1 retry; exits; calm mode shows whole lines at once; panel tap targets are at least 48px.

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
| 2026-10-15 | `p2-character-scene` | pushed, PR not opened yet (local: all green) | |
