# Setup (owner steps)

Steps only the owner can do: accounts, keys, repository settings. Claude stops and asks when one of these is needed.

Status key: ⬜ to do · ✅ done

---

## 1. Local development ✅

1. Install Node.js 24 or newer.
2. `npm ci`
3. `npx playwright install chromium` (once, for end-to-end tests)
4. `npm run dev` and open the printed URL.

No `.env` file is needed. The app runs fully offline. To try the backend later, copy `.env.example` to `.env.local` and fill it in (see section 4).

## 2. GitHub repository ✅

- Repository: <https://github.com/bhavyammisra/saksham>, default branch `main`.
- Each phase is built on a branch (`p0-foundation`, ...) and merged by pull request once CI is green.
- Optional: install the GitHub CLI (`winget install GitHub.cli`, then `gh auth login`) so Claude can open pull requests and read CI results from the terminal. Without it, open PRs in the GitHub web UI.
- Recommended: in **Settings → Branches**, add a rule for `main` that requires the CI checks `lint`, `unit`, `build` and `e2e` to pass before merging.

## 3. Deploying to Vercel ⬜ (when you want a public URL)

The CI `deploy` job is **skipped** until these are set, so CI stays green without them.

1. Create a free Vercel account and a new project. Import this GitHub repository, or create an empty project.
2. In the Vercel project settings:
   - **Framework preset:** Other. **Build command:** none (empty). **Output directory:** leave empty. CI uploads the already-built `dist/` folder, so Vercel must not build it again.
   - **Git:** if the project is connected to the repository, turn off automatic Git deployments to avoid double deploys. (Alternatively, keep Vercel's Git integration for preview deploys and leave the CI job skipped. Tell Claude which one you chose so `DECISIONS.md` stays accurate.)
3. Create a token at **Vercel → Account Settings → Tokens**.
4. Find the Org ID and Project ID in **Project Settings → General** (or `.vercel/project.json` after `npx vercel link`; never commit that folder).
5. In GitHub, go to **Settings → Secrets and variables → Actions**:
   - Secret `VERCEL_TOKEN` = the token.
   - Variable `VERCEL_ORG_ID` = the Org ID.
   - Variable `VERCEL_PROJECT_ID` = the Project ID.
6. The next push to `main` deploys.

## 4. Supabase ⬜ (Phase 5, Claude will stop and ask)

Filled in during Phase 5: create the project, enable anonymous sign-ins and email auth, set the site URL, and add the repository variables `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. The anon key is public by design. **The service-role key must never be put in this repository, in GitHub, or in Vercel for this project.**
