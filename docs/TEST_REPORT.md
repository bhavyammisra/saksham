# Test report

Updated at the end of each phase. Test names reuse the requirement IDs from BUILD_PLAN §11 once real requirements are tested (Phase 1 onwards).

## Counts

| Type | Tool | Files | Tests | Where |
| --- | --- | --- | --- | --- |
| Unit | Vitest | 1 | 5 | `src/**/*.test.ts` |
| End-to-end | Playwright (Chromium) | 1 | 2 | `tests/e2e/` |
| Safety invariants | Playwright | 0 | 0 | from Phase 1 |
| RLS (database) | | 0 | 0 | from Phase 5 |

## What the tests prove

### Unit
- `src/lib/i18n.test.ts`: `t()` returns English text, fills `{placeholders}`, leaves unknown placeholders alone, returns the key when a string is missing, and the strings file is a flat map of non-empty strings.

### End-to-end
- `tests/e2e/shell.spec.ts`
  - The built app loads, and its title and heading come from the strings file.
  - Calm mode (`data-calm` on `<html>`) turns on when the system asks for reduced motion and off when it doesn't.

### Safety invariants
None yet. Phase 1 adds: Help button on every route except `/help`; `/help` is calm and silent; the name field rejects digits and symbols; no screen shows another child's free text.

## Latest CI run

| Date | Branch | Commit | Result | Link |
| --- | --- | --- | --- | --- |
| 2026-10-14 | `p0-foundation` | `4287310` | ✅ lint, unit, build, e2e passed; deploy skipped (no Vercel vars) | [run 38564599948](https://github.com/bhavyammisra/saksham/actions/runs/38564599948) |
