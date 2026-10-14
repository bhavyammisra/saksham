# saksham

A web game that teaches Indian children (8 to 16) their legal rights. The child walks through a small town, talks to people, helps solve a problem, and earns a rights card. UCS503 Software Engineering Lab project, TIET Patiala.

Status: Phase 0 (foundation). See [docs/BUILD_PLAN.md](docs/BUILD_PLAN.md).

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
