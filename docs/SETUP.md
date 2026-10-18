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

## 4. Supabase ✅ (done 2026-10-18)

**Status:** done. The owner created the project in the dashboard (name `saksham`, ref `iggetuuoghdoyppdlppy`, Free plan; it is in Tokyo, not Mumbai, which only adds a little delay). Claude did steps 2 to 7: anonymous sign-ins on, email sign-in with confirmation, site URL `http://localhost:5173`, redirect URLs for ports 5173 and 4173, the two GitHub variables (`VITE_SUPABASE_URL` and the publishable key in `VITE_SUPABASE_ANON_KEY`) and `.env.local`. The database schema is applied (D-043). CAPTCHA (the optional step) is not turned on yet.

**Still to do before real teachers sign up** (the teacher page works for you already):
- **Try a real sign-up once:** open the app, "For teachers", "New account", with your own email; open the confirmation link (it brings you back to the teacher page, signed in) and make a class.
- **Raise the anonymous sign-in limit:** Supabase allows 30 anonymous sign-ins an hour from one internet address, and a whole class on school Wi-Fi shares one address. Before a class joins together, go to **Authentication → Rate Limits** and raise "anonymous sign-ins" (for example to 200 an hour).
- **Add an email provider:** Supabase's built-in email only sends to the people in your Supabase team, and only a few emails an hour, so other teachers would never get their confirmation link. In **Project Settings → Authentication → SMTP Settings**, connect a free email service (for example Resend or Brevo) and follow its steps. Tell Claude when it's done. The steps are kept below in case the project ever has to be made again.

The backend only adds sync and the teacher side. The game keeps working without it, so nothing breaks while this is not done. It takes about 15 minutes. Supabase moves its menus around now and then: if a name below doesn't match, look for the nearest one and tell Claude.

**Never put the service-role key (or the "secret" key) in this repository, in GitHub, in Vercel, or in a chat with Claude.** It bypasses every safety rule in the database. The app only ever needs the public key.

1. **Create the project.** Sign in at <https://supabase.com> and create a new project on the **Free** plan.
   - Name: `saksham`.
   - Region: **South Asia (Mumbai)**, the closest to the schools that will use it.
   - Database password: let Supabase generate one and save it in your password manager. Claude never needs it; don't put it in the repository or in chat.
2. **Turn on anonymous sign-ins** (children join a class without an email or password). Go to **Authentication → Sign In / Providers** and turn on **Allow anonymous sign-ins**. Save.
3. **Check email sign-in** (teachers). On the same page, make sure the **Email** provider is on and **Confirm email** is on. Leave every other provider off.
4. **Set the site URL.** Go to **Authentication → URL Configuration**.
   - **Site URL:** `http://localhost:5173` for now. When the app has a public Vercel address (section 3), change it to that address.
   - **Redirect URLs:** add `http://localhost:5173/**` and `http://localhost:4173/**` (the dev server and the test server). Add the Vercel address the same way later.
5. **Copy the two public values.** Go to **Project Settings → API Keys** (or **Data API**):
   - the **Project URL** (`https://<something>.supabase.co`);
   - the **publishable** key (it starts with `sb_publishable_`). If your project only shows the older keys, use the one labelled **anon** / **public**. Do not copy the secret or service-role key.
6. **Add them to GitHub**, so CI builds with them. In the repository, **Settings → Secrets and variables → Actions → Variables** (variables, not secrets: both values are public by design):
   - `VITE_SUPABASE_URL` = the Project URL;
   - `VITE_SUPABASE_ANON_KEY` = the publishable (or anon) key.
7. **Add them on your laptop**, so `npm run dev` uses them: copy `.env.example` to `.env.local` in the repository folder and fill in the same two values. `.env.local` is ignored by Git; never commit it.
8. **Tell Claude it's done**, and give the **project reference** (the `<something>` part of the Project URL). Claude will then write the database tables, rules and tests (the next P5 tasks) as migration files in the repository. To apply them to your project, Claude will ask you to run `npx supabase login` yourself (it opens your browser; Claude never sees your Supabase password or access token).

Optional, recommended before real classes use it: in **Authentication → Attack Protection**, turn on CAPTCHA protection, which Supabase suggests for anonymous sign-ins. It needs a free hCaptcha or Cloudflare Turnstile account; tell Claude if you turn it on, because the app then has to show the check.

## 5. Fact-check the Help Centre ⬜ (owner, before any child uses the app)

`content/help.json` holds every helpline number and sentence shown in the Help Centre. Each number lists the official page it came from under `sources`.

1. Open each source link and confirm the number, who runs it, and the hours: 1098 (Child Helpline), 112 (ERSS), 14416 (Tele-MANAS), 1930 (Cyber Crime).
2. Read the "Your rights" and "How to tell a trusted adult" sentences. Change any wording you want **in the JSON only**. The app shows it exactly as written.
3. Tele-MANAS: PIB pages print its long-form number in two different ways, so only `14416` is shown. Add the long number only if the official site confirms it.
4. When done, set `review.status` to `"verified"`, and fill in `checkedBy` and `checkedOn` (YYYY-MM-DD).

Claude could not open 112.gov.in, cybercrime.gov.in or telemanas.mohfw.gov.in from its tools (connection refused or JavaScript-only pages). The numbers were cross-checked against PIB press releases instead.

**Community page (`content/community.json`), places that help:** read the six places and their descriptions, and check the items in `review.checks` (each place is fair for children across India; 112 and 1098 match the Help Centre). When done, set `review.status` to `"verified"` and fill in `checkedBy` and `checkedOn`.

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
4. Read the card text (`kid`, `teen`, `ifItHappens`), Sunita Didi's lines (`sunita-good-2`, `sunita-good-3`), the six quiz questions and the five sort cards (`dhaba-sort`). Each must agree with points 1 to 3. Penalties are deliberately not mentioned anywhere.
5. When done, set `card.review.status` to `"verified"` and fill in `checkedBy` and `checkedOn`.

**Home (`content/scenes/home.json`), the right to be safe:**

Claude compared both quotes with secondary sources only, and both match word for word: [constitutionofindia.net](https://www.constitutionofindia.net/articles/article-39-certain-principles-of-policy-to-be-followed-by-the-state/) for Article 39, and [lawx.in](https://lawx.in/acts/section/114/1026/8855) for section 75 (the same opening also appears on courtbook.in and lawrato.com).

1. `card.law` quotes Article 39's opening words and clause (f) of the Constitution. Check the wording against the Constitution of India (https://legislative.gov.in).
2. `card.law` quotes section 75 of the Juvenile Justice (Care and Protection of Children) Act, 2015, up to "shall be punishable", with the rest (the penalties) left out and marked […]. Check it on India Code (https://www.indiacode.nic.in).
3. Confirm that section 75 covers anyone having "the actual charge of, or control over, a child", which includes family members (the card and quiz say so), and that Article 39(f) is described fairly: a Directive Principle, something the State is asked to do.
4. Read the card text (`kid`, `teen`, `ifItHappens`), Farida Aunty's lines (`farida-good` to `farida-good-3`) and the six quiz questions. Each must agree with points 1 to 3. Also read the whole story once for tone, with an 8-year-old in mind: harm is only told, never shown.
5. When done, set `card.review.status` to `"verified"` and fill in `checkedBy` and `checkedOn`.

**Panchayat (`content/scenes/panchayat.json`), freedom from child marriage:**

Claude compared both quotes word for word with two copies of the Act, and both match: [PRS Legislative Research](https://prsindia.org/files/bills_acts/acts_parliament/2006/the-prohibition-of-child-marriage-act-2006.pdf) and [Indian Kanoon](https://indiankanoon.org/doc/790355/). India Code did not load from Claude's tools.

1. `card.law` quotes section 2(a) and 2(b) of the Prohibition of Child Marriage Act, 2006 (who is a "child", and what a "child marriage" is). Check the wording on India Code (https://www.indiacode.nic.in).
2. `card.law` also quotes section 13(1) (a magistrate who is satisfied that a child marriage has been arranged or is about to happen must issue an injunction prohibiting it). Check the wording.
3. In the same Act, confirm: anyone with personal knowledge or reason to believe can complain (section 13(2)); the State appoints Child Marriage Prohibition Officers whose duty includes preventing child marriages (section 16(1), 16(3)(a)); and the State may ask an officer of the Gram Panchayat to assist them (section 16(2)), which is why the Sarpanch goes with the officer in the story.
4. Read the card text (`kid`, `teen`, `ifItHappens`), Sarpanch Kavita ji's lines (`sarpanch-good` to `sarpanch-good-3`), the six quiz questions and the five sort cards (`panchayat-sort`). Each must agree with points 1 to 3. Penalties are deliberately not mentioned anywhere. Also read the whole story once for tone, with an 8-year-old in mind: no wedding is shown, Pooja only tells the player.
5. When done, set `card.review.status` to `"verified"` and fill in `checkedBy` and `checkedOn`.
