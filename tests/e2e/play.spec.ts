// Playing the School building end to end at /play/school: story, rights card, quiz, results.
import { expect, test } from '@playwright/test'
import school from '../../content/scenes/school.json' with { type: 'json' }
import { answerQuiz, createPlayer, playStory, strings, thingsToDo } from './helpers.ts'

// These tests play whole scenes, which are heavy without a GPU when tests run in parallel.
test.describe.configure({ timeout: 60_000 })
// They run in calm mode (a real setting: no typewriter, nothing ambient moving), so lines appear
// at once and the page holds still. The game logic is the same; motion is covered by
// scene.spec.ts and town.spec.ts, which run with it on.
test.use({ reducedMotion: 'reduce' })

test('FR-05 / FR-06 / FR-07 School: story, card flip, quiz, and saved results that survive a reload', async ({ page }) => {
  await createPlayer(page, 'Asha') // young band: 4 questions
  await playStory(page)

  // The card arrives face down and turns over.
  await expect(page.getByText(strings['card.new'])).toBeVisible()
  await page.getByRole('button', { name: strings['card.flip'] }).click()
  await expect(page.getByRole('heading', { name: school.card.title })).toBeVisible()
  await expect(page.getByText(school.card.kid)).toBeVisible()
  await page.getByRole('button', { name: strings['card.tellMore'] }).click()
  await expect(page.getByText(school.card.teen)).toBeVisible()
  // Legal text is shown exactly as written in content.
  await expect(page.locator('blockquote')).toHaveText(school.card.law)
  await page.getByRole('button', { name: strings['card.toQuiz'] }).click()

  // 3 of 4 right: 75%, no hint round. One retry in the story, so 2 stars.
  await answerQuiz(page, [true, true, true, false])
  await expect(page.getByText(strings['results.stars'].replace('{n}', '2')).last()).toBeVisible()
  await expect(page.getByText(strings['badge.firstSteps'])).toBeVisible()
  // The Dhaba is unlocked by the rules, but its story isn't written yet, so nothing claims it is open.
  await expect(page.getByText(strings['results.unlocked'])).toHaveCount(0)

  // Back in the town: Mitthu celebrates once; School shows its stars, the Dhaba is now open, Home is still locked.
  await page.getByRole('link', { name: strings['play.backToTown'] }).click()
  await expect(page).toHaveURL(/#\/town$/)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(strings['town.title'])
  const celebration = page.getByRole('status').filter({ hasText: strings['town.welcomeBack'].replace('{name}', 'Asha') })
  await expect(celebration).toContainText(strings['town.earned'].replace('{n}', '2').replace('{place}', 'The School'))
  await page.getByRole('button', { name: strings['town.celebrateClose'] }).click()
  await expect(celebration).toHaveCount(0)
  // Lata now stands outside the School, and the town has changed.
  await expect(thingsToDo(page).getByRole('button', { name: 'Talk to Lata' })).toBeVisible()
  await expect(page.getByText(strings['town.stars'].replace('{n}', '2'))).toBeAttached()
  await expect(page.getByText(strings['town.beingBuilt'])).toBeVisible()
  await expect(page.getByText(strings['town.lockedAfter'].replace('{name}', 'The Dhaba'))).toBeVisible()

  await page.reload()
  await expect(page.getByRole('link', { name: strings['town.playAgain'].replace('{name}', 'The School') })).toBeVisible()
  await expect(page.getByRole('button', { name: strings['town.celebrateClose'] })).toHaveCount(0) // only once
  const saved = await page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem('saksham') ?? '{}').state
    return s.data[s.activeProfileId]
  })
  expect(saved.progress.school).toEqual({ stars: 2, bestScore: 75, completed: true })
  expect(saved.extras.cards).toEqual(['right-to-education'])
  expect(saved.extras.badges).toEqual(['first-steps'])
})

test('FR-06 a low score offers Mitthu\'s hint round, which does not change the score', async ({ page }) => {
  await createPlayer(page, 'Ravi')
  await playStory(page)
  await page.getByRole('button', { name: strings['card.flip'] }).click()
  await page.getByRole('button', { name: strings['card.toQuiz'] }).click()
  await answerQuiz(page, [false, false, true, false]) // 25%

  await expect(page.getByText(strings['quiz.hintOffer'])).toBeVisible()
  await page.getByRole('button', { name: strings['quiz.hintStart'] }).click()
  // The hint shows first, then the missed questions are asked again (3 of them).
  await expect(page.getByText(strings['quiz.progress'].replace('{n}', '1').replace('{total}', '3'))).toBeVisible()
  await expect(page.getByText(`${strings['quiz.hintLead']}:`)).toBeVisible()
  const missed = school.games[0]!.questions.filter((q) => !q.band).filter((_, i) => i !== 2)
  await answerQuiz(page, [true, true, true], missed)

  await expect(page.getByText(strings['results.score'].replace('{correct}', '1').replace('{total}', '4'))).toBeVisible()
})

test('FR-05 / FR-06 teen players see the teen card text and the teen-only questions', async ({ page }) => {
  await createPlayer(page, 'Meera', 'teen')
  await playStory(page)
  await page.getByRole('button', { name: strings['card.flip'] }).click()
  await expect(page.getByText(school.card.teen)).toBeVisible()
  await expect(page.getByRole('button', { name: strings['card.tellMore'] })).toHaveCount(0)
  await page.getByRole('button', { name: strings['card.toQuiz'] }).click()
  const total = school.games[0]!.questions.length
  await expect(page.getByText(strings['quiz.progress'].replace('{n}', '1').replace('{total}', String(total)))).toBeVisible()
})

test('FR-07 a locked building cannot be played', async ({ page }) => {
  await createPlayer(page, 'Asha')
  await page.goto('/#/play/dhaba')
  await expect(page.getByText(strings['play.locked'])).toBeVisible()
})

test('FR-07 the town starts with only the School open, and links to it', async ({ page }) => {
  await createPlayer(page, 'Asha')
  await expect(page.getByText(strings['town.suggest'])).toBeVisible()
  await expect(page.getByText(strings['town.comingSoon'])).toHaveCount(2)
  await expect(page.getByText(strings['town.lockedAfter'].replace('{name}', 'The School'))).toBeVisible()
  await page.getByRole('link', { name: strings['town.visit'].replace('{name}', 'The School') }).click()
  await expect(page).toHaveURL(/#\/play\/school$/)
})
