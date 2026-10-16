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

## 5. Fact-check the Help Centre ⬜ (owner, before any child uses the app)

`content/help.json` holds every helpline number and sentence shown in the Help Centre. Each number lists the official page it came from under `sources`.

1. Open each source link and confirm the number, who runs it, and the hours: 1098 (Child Helpline), 112 (ERSS), 14416 (Tele-MANAS), 1930 (Cyber Crime).
2. Read the "Your rights" and "How to tell a trusted adult" sentences. Change any wording you want **in the JSON only**. The app shows it exactly as written.
3. Tele-MANAS: PIB pages print its long-form number in two different ways, so only `14416` is shown. Add the long number only if the official site confirms it.
4. When done, set `review.status` to `"verified"`, and fill in `checkedBy` and `checkedOn` (YYYY-MM-DD).

Claude could not open 112.gov.in, cybercrime.gov.in or telemanas.mohfw.gov.in from its tools (connection refused or JavaScript-only pages). The numbers were cross-checked against PIB press releases instead.

## 6. Fact-check each rights card ⬜ (owner, before any child uses the app)

Every scene's rights card (`card` in `content/scenes/<id>.json`) has a `review` block, which is never shown in the app. `review.checks` lists each claim to verify. The validator refuses `"verified"` unless `checkedBy` and `checkedOn` are filled in.

**School (`content/scenes/school.json`), the right to education:**

1. `card.law` quotes Article 21A of the Constitution. Claude compared this with the Ministry of Education page (https://www.education.gov.in/en/fundamental_rights_article-21A), and it matches. Confirm it once more.
2. `card.law` also quotes RTE Act section 14(2): "No child shall be denied admission in a school for lack of age proof." Claude found this wording only in secondary sources. Check it against the Act on India Code (https://www.indiacode.nic.in, search "Right of Children to Free and Compulsory Education Act").
3. In the same Act, confirm: ages 6 to 14 (section 3); "elementary education" means Classes 1 to 8 (section 2(f)); no fee may stop a child finishing elementary education (section 3(2)); private unaided schools keep at least 25% of entry-class seats for weaker and disadvantaged groups (section 12(1)(c)).
4. Read the card text (`kid`, `teen`, `ifItHappens`), Meena Didi's lines (`didi-good-2`) and the six quiz questions. Each must agree with points 1 to 3. Change any wording **in the JSON only**: the app shows it exactly as written.
5. When done, set `card.review.status` to `"verified"` and fill in `checkedBy` and `checkedOn` (YYYY-MM-DD).

**Dhaba (`content/scenes/dhaba.json`), freedom from child labour:**

Claude could not open the official PDFs (labour.gov.in, indiacode.nic.in) from its tools, so both quotes were matched only against secondary sources: [constitutionofindia.net](https://www.constitutionofindia.net/constitution_of_india/fundamental_rights/articles/Article%2024) for Article 24, and [lawx.in](https://lawx.in/acts/section/74/660/6272) for section 3(1).

1. `card.law` quotes Article 24 of the Constitution. Check the wording against the Constitution of India (https://legislative.gov.in).
2. `card.law` quotes section 3(1) of the Child and Adolescent Labour (Prohibition and Regulation) Act, 1986, **as amended in 2016**: "No child shall be employed or permitted to work in any occupation or process." Check it on India Code (https://www.indiacode.nic.in) or the Ministry of Labour and Employment (https://labour.gov.in). The wording before 2016 was different.
3. In the same Act, confirm: a "child" is under 14 (section 2); the family exception: helping one's family or family enterprise only after school hours or in vacations, and never in hazardous work (section 3(2)(a)); adolescents aged 14 to 18 must not work in hazardous occupations or processes (section 3A).
4. Read the card text (`kid`, `teen`, `ifItHappens`), Sunita Didi's lines (`sunita-good-2`, `sunita-good-3`) and the six quiz questions. Each must agree with points 1 to 3. Penalties are deliberately not mentioned anywhere.
5. When done, set `card.review.status` to `"verified"` and fill in `checkedBy` and `checkedOn`.

**Home (`content/scenes/home.json`), the right to be safe:**

Claude compared both quotes with secondary sources only, and both match word for word: [constitutionofindia.net](https://www.constitutionofindia.net/articles/article-39-certain-principles-of-policy-to-be-followed-by-the-state/) for Article 39, and [lawx.in](https://lawx.in/acts/section/114/1026/8855) for section 75 (the same opening also appears on courtbook.in and lawrato.com).

1. `card.law` quotes Article 39's opening words and clause (f) of the Constitution. Check the wording against the Constitution of India (https://legislative.gov.in).
2. `card.law` quotes section 75 of the Juvenile Justice (Care and Protection of Children) Act, 2015, up to "shall be punishable", with the rest (the penalties) left out and marked […]. Check it on India Code (https://www.indiacode.nic.in).
3. Confirm that section 75 covers anyone having "the actual charge of, or control over, a child", which includes family members (the card and quiz say so), and that Article 39(f) is described fairly: a Directive Principle, something the State is asked to do.
4. Read the card text (`kid`, `teen`, `ifItHappens`), Farida Aunty's lines (`farida-good` to `farida-good-3`) and the six quiz questions. Each must agree with points 1 to 3. Also read the whole story once for tone, with an 8-year-old in mind: harm is only told, never shown.
5. When done, set `card.review.status` to `"verified"` and fill in `checkedBy` and `checkedOn`.
