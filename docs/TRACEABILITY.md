# Traceability

Each requirement from BUILD_PLAN §11, linked to where it lives in the app and the tests that prove it. Test names start with the requirement ID, so `npx playwright test -g "FR-07"` or `npx vitest -t "FR-07"` runs exactly the tests for one requirement.

## Functional requirements

| ID | Requirement | Where in the app | Tests |
| --- | --- | --- | --- |
| FR-01 | Child creates a local profile: first name, character, age band | `/onboarding`, `Profiles`, `CharacterBuilder` | `onboarding.spec.ts`; `rules.test.ts` (name rule), `store.test.ts`, `spec.test.ts` |
| FR-02 | Child walks a character through a scene and the town | `src/engine/Scene.tsx`, `/town` | `scene.spec.ts` (keyboard, tap, W/S depth); `sceneState.test.ts`, `engine.test.ts` |
| FR-03 | Child talks to characters and examines objects | hotspots in `Scene.tsx`, "Things to do here" | `scene.spec.ts`; `sceneState.test.ts`, `engine.test.ts` |
| FR-04 | Dialogue choices with consequences and retry | `Dialogue.tsx`, `story.ts` | `scene.spec.ts`, `play.spec.ts`; `engine.test.ts`, one story test per building |
| FR-05 | Rights card with text by age band | `CardReveal`, `RightsCard`, `/book` | `play.spec.ts`, `collection.spec.ts`; `rules.test.ts`, `scenes.test.ts` |
| FR-06 | Quiz or sort game, scoring and hint round | `Quiz`, `Sort` | `play.spec.ts` (every building); `rules.test.ts` |
| FR-07 | Stars, unlocks and badges | `rules.ts`, `Results`, the town and map | `play.spec.ts`, `town.spec.ts`, `collection.spec.ts`; `rules.test.ts`, `town.test.ts`, `store.test.ts` |
| FR-08 | Help Centre reachable from every screen but itself | `HelpButton` on every frame, the Splash's own button | `safety.spec.ts` (every route), `town.spec.ts`, `splash.spec.ts` |
| FR-09 | English and Hindi | Settings › Language, `localize.ts`, `content/hi/` | `hindi.spec.ts`; `hindi.test.ts`, `localize.test.ts`, `i18n.test.ts` |
| FR-10 | Preset pledges and private Ask an Expert questions | `/community` | `community.spec.ts`, `dashboard.spec.ts` (Class Mission); `rules.test.ts`, `store.test.ts` |
| FR-11 | Join and leave a class with a code | Me › My class, `classroom.ts` | `class.spec.ts`; `classroom.test.ts`, `store.test.ts`; RLS checks |
| FR-12 | Sync when online, work offline otherwise | `sync.ts`, `store.ts` | `sync.spec.ts`, `offline.spec.ts`; `rules.test.ts` (merge), `store.test.ts` |
| FR-13 | Teacher registers, signs in, creates a class, manages its code | `/teacher` | `teacher.spec.ts`; RLS checks |
| FR-14 | Teacher dashboard: progress, mistakes, mission, remove, delete | `TeacherDashboard` | `dashboard.spec.ts`; RLS checks |
| FR-15 | Reviewer lists, approves or rejects content with a note | `/reviewer`, `review.ts` | `reviewer.spec.ts`; `review.test.ts`; RLS checks |
| FR-16 | "Reviewed" only when the exact text is published | `published.ts`, card details | `reviewer.spec.ts` (FR-16), `hindi.test.ts` (per language) |
| FR-17 | Demo mode unlocks every building | `DemoMode.tsx` | `collection.spec.ts`; `rules.test.ts`, `store.test.ts` |

## Non-functional requirements

| ID | Requirement | How it is met | Evidence |
| --- | --- | --- | --- |
| NFR-01 | Privacy: first name only, no child email, password or visible free text | Local profiles; anonymous class login; preset pledges; questions never leave the device | `safety.spec.ts`, `community.spec.ts`; `rules.test.ts`, `store.test.ts`; database name check (`DATA_MODEL.md`) |
| NFR-02 | Security: RLS on every table, no secrets, server-side checks | Row level security and checked functions (`DATA_MODEL.md`, `API.md`); only the public anon key in the client | `supabase/tests/rls.test.sql` (45 checks, two teachers and two children); Supabase advisors |
| NFR-03 | The whole child flow works offline | Local-first store; sync never blocks (D-046, D-048) | `offline.spec.ts` (network off, no backend settings, backend down), CI job `e2e-local-only`; `supabase.test.ts` |
| NFR-04 | 60 fps in scenes on a mid-range phone; first load under 3 s | D-030 rules; moving pictures on their own layers (P7) | Measured on the production build (TEST_REPORT.md): first load 2.3 to 3.0 s on a 1.5 Mbps connection; 60 fps standing, 43 to 46 fps walking on a 4× slower CPU without a GPU |
| NFR-05 | Accessibility: 48 px targets, keyboard, `aria-live`, calm mode, never colour alone | Buttons and links only; focus moves to the next thing to press; calm mode | `a11y.spec.ts` (axe WCAG 2.1 AA on every screen, 48 px targets, keyboard-only School), `sizes.spec.ts` (three screen sizes), `scene.spec.ts`, `living.spec.ts`, `splash.spec.ts` |
| NFR-06 | Safety: calm, silent Help Centre; gentle tone; no depiction of harm | Help Centre outside the shell; sound silenced there; `gentle` scenes | `safety.spec.ts` (16 invariants), `splash.spec.ts`; `sound.test.ts`, `validate-content.test.ts` |
| NFR-07 | Maintainability: data-driven engine, typed content, pure tested rules | `content/types.ts`, engine never names a building, `rules.ts` | `validate-content.test.ts`, `npm run validate` in CI |
| NFR-08 | CI runs lint, typecheck, unit, e2e and build on every push and pull request | `.github/workflows/` | Every pull request (#1 to #8) merged only with CI green |
| NFR-09 | Every UI string in English and Hindi; legal citations stay English | `strings.hi.json`, `content/hi/`, `localize()` never touches `law` | `hindi.test.ts`, `hindi.spec.ts`; the validator's Hindi checks |
| NFR-10 | Legal text exactly as authored; review status auditable | Cards render `law` as written; hashes and `content_events` log | `play.spec.ts`, `demo-path.spec.ts`, `hindi.spec.ts` (law unchanged); `review.test.ts`; RLS checks on the log |

## Not covered by automated tests

- **The BUILD_PLAN §11 evaluation targets** (children's quiz scores, time to find help, completing a module unaided). These need play-testing with children at a partner school or NGO.
- **Real-device frame rate** on an actual mid-range phone. The figures above come from Chromium with its CPU slowed down.
- **How the sound and the Hindi feel to a person.** The owner checks these (SETUP.md §7).
