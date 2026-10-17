# saksham

A web game that teaches Indian children (8 to 16) their legal rights. The child walks through a small town, talks to people, helps solve a problem, and earns a rights card. UCS503 Software Engineering Lab project, TIET Patiala.

Status: Phase 4 (town and all buildings) in progress. Playable now: the title menu, a new game with the character customiser, the full-screen walkable town, the School, the Dhaba, Home and the Panchayat (story, rights card, quiz, results), the Book, Me, Credits and the Help Centre. Next: the sort game and Community. See [docs/BUILD_PLAN.md](docs/BUILD_PLAN.md).

## Run it

Needs Node.js 24+.

```bash
npm ci
npm run dev
```

No accounts or `.env` file needed: the app works fully offline.

## Check it

```bash
npm run lint && npm run typecheck && npm run test && npm run build
npx playwright install chromium   # once
npm run e2e
```

## Docs

- [Build plan](docs/BUILD_PLAN.md) · [Decisions](docs/DECISIONS.md) · [Architecture](docs/ARCHITECTURE.md)
- [Setup (owner steps)](docs/SETUP.md) · [Asset licences](docs/ASSET_LICENSES.md) · [Test report](docs/TEST_REPORT.md) · [Sprint log](docs/SPRINT_LOG.md)
