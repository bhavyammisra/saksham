// The demo path (BUILD_PLAN P3, MILESTONE A): one test that walks the whole child journey
// through the real UI, as it would be shown in the viva:
// new profile -> character -> town -> School story -> card flip -> quiz -> results -> town -> Help Centre.
import { expect, test } from '@playwright/test'
import help from '../../content/help.json' with { type: 'json' }
import school from '../../content/scenes/school.json' with { type: 'json' }
import { answerQuiz, openMap, playStory, strings } from './helpers.ts'

// These tests play whole scenes, which are heavy without a GPU when tests run in parallel.
test.describe.configure({ timeout: 60_000 })
// They run in calm mode (a real setting: no typewriter, nothing ambient moving), so lines appear
// at once and the page holds still. The game logic is the same; motion is covered by
// scene.spec.ts and town.spec.ts, which run with it on.
test.use({ reducedMotion: 'reduce' })

test('Demo path: profile, character, School, card flip, quiz, results, Help Centre', async ({ page }) => {
  // 1. A new player: the title menu, then first name and age.
  await page.goto('/')
  await page.getByRole('button', { name: strings['title.newGame'] }).click()
  await expect(page).toHaveURL(/#\/onboarding$/)
  await page.getByLabel(strings['onboarding.nameLabel']).fill('Asha')
  await page.getByRole('button', { name: strings['onboarding.bandYoung'] }).click()
  await page.getByRole('button', { name: strings['onboarding.next'] }).click()

  // 2. The character: boy or girl, a hairstyle and a top in the customiser.
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(strings['builder.title'])
  await page.getByRole('button', { name: strings['gender.girl'] }).click()
  await page.getByRole('tab', { name: strings['builder.hair'] }).click()
  await page.getByRole('button', { name: strings['hair.ponytail'] }).click()
  await page.getByRole('tab', { name: strings['builder.top'] }).click()
  await page.getByRole('button', { name: strings['outfit.hoodie'] }).click()
  await page.getByRole('button', { name: strings['builder.done'] }).click()

  // 3. The town: only the School is open, and Mitthu suggests it.
  await expect(page).toHaveURL(/#\/town$/)
  const map = await openMap(page)
  await expect(map.getByRole('button', { name: new RegExp(`^${strings['map.travel'].replace('{place}', 'The School')}`) })).toHaveAccessibleName(new RegExp(strings['town.suggest']))
  await map.getByRole('button', { name: new RegExp(`^${strings['map.travel'].replace('{place}', 'The School')}`) }).click()

  // 4. The School story, with one weaker choice and a retry, to the good ending.
  await expect(page).toHaveURL(/#\/play\/school$/)
  await playStory(page, true)

  // 5. The rights card turns over; the law is shown exactly as written.
  await page.getByRole('button', { name: strings['card.flip'] }).click()
  await expect(page.getByRole('heading', { name: school.card.title })).toBeVisible()
  await expect(page.locator('blockquote')).toHaveText(school.card.law)
  await page.getByRole('button', { name: strings['card.toQuiz'] }).click()

  // 6. The quiz: every answer right on the first try.
  await answerQuiz(page, [true, true, true, true])

  // 7. Results: 2 stars (100% but one retry), with the card and badges saved.
  await expect(page.getByRole('heading', { name: strings['results.title'].replace('{name}', 'Asha') })).toBeVisible()
  await expect(page.getByText(strings['results.stars'].replace('{n}', '2')).last()).toBeVisible()
  await expect(page.getByText(strings['badge.quizWhiz'])).toBeVisible()

  // 8. Back in the town, the progress shows and survives a reload.
  await page.getByRole('link', { name: strings['play.backToTown'] }).click()
  await page.reload()
  const after = await openMap(page)
  await expect(after.getByRole('button', { name: new RegExp(`^${strings['map.travel'].replace('{place}', 'The School')}`) })).toHaveAccessibleName(new RegExp(strings['town.stars'].replace('{n}', '2')))
  await expect(after.getByRole('button', { name: new RegExp(`^${strings['map.travel'].replace('{place}', 'The Dhaba')}`) })).toBeVisible() // the Dhaba is open now
  await after.getByRole('button', { name: strings['hud.close'] }).click()

  // 9. Help is one tap away, and the Help Centre is calm (no Help button of its own).
  await page.getByTestId('help-button').click()
  await expect(page).toHaveURL(/#\/help$/)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(help.title)
  await expect(page.getByTestId('help-button')).toHaveCount(0)
})
