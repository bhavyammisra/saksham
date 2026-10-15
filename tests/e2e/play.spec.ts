// Playing the School building end to end at /play/school: story, rights card, quiz, results.
import { expect, test, type Page } from '@playwright/test'
import school from '../../content/scenes/school.json' with { type: 'json' }
import { createPlayer, strings } from './helpers.ts'

const thingsToDo = (page: Page) => page.getByRole('region', { name: strings['scene.thingsToDo'] })
const next = (page: Page) => page.getByRole('button', { name: strings['scene.next'], exact: true })

/** Presses Next until a choice appears or the conversation closes. */
async function talkThrough(page: Page) {
  for (let i = 0; i < 16; i++) {
    if (!(await next(page).isVisible())) return
    await next(page).click()
  }
}

/** Plays the School story to the good ending, with one weaker choice first (one retry). */
async function playStory(page: Page) {
  await page.goto('/#/play/school')
  // Arriving: Mitthu's intro line opens by itself.
  await expect(page.locator('[aria-live="polite"]').filter({ hasText: 'Mitthu:' }).first()).toContainText(school.nodes.intro.text)
  await talkThrough(page)
  const list = thingsToDo(page)
  for (const label of ['Talk to Ravi', 'Talk to the girl at the gate', 'Read the notice board']) {
    await list.getByRole('button', { name: label }).click()
    await talkThrough(page)
  }
  await list.getByRole('button', { name: 'Ask Meena Didi for help' }).click()
  await talkThrough(page)
  await page.getByRole('button', { name: /^Never mind/ }).click()
  await talkThrough(page)
  await page.getByRole('button', { name: /wants to study here/ }).click()
  await talkThrough(page)
}

/** Answers the quiz: `rightAnswers` says, question by question, whether to pick the right option. */
async function answerQuiz(page: Page, rightAnswers: boolean[], questions = school.games[0]!.questions.filter((q) => !q.band)) {
  for (const [i, right] of rightAnswers.entries()) {
    const q = questions[i]!
    await expect(page.getByRole('heading', { name: q.text })).toBeVisible()
    const option = right ? q.answer : (q.answer + 1) % q.options.length
    await page.getByRole('button', { name: q.options[option], exact: true }).click()
    await expect(page.getByText(right ? strings['quiz.correct'] : strings['quiz.notQuite'])).toBeVisible()
    const isLast = i === rightAnswers.length - 1
    await page.getByRole('button', { name: isLast ? strings['quiz.finish'] : strings['quiz.next'] }).click()
  }
}

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
  await expect(page.getByText(strings['results.unlocked'])).toBeVisible()

  // Back in the town: School shows its stars, the Dhaba is now open, Home is still locked.
  await page.getByRole('link', { name: strings['play.backToTown'] }).click()
  await expect(page).toHaveURL(/#\/town$/)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(strings['town.title'])
  await expect(page.getByText(strings['town.stars'].replace('{n}', '2'))).toBeAttached()
  await expect(page.getByText(strings['town.beingBuilt'])).toBeVisible()
  await expect(page.getByText(strings['town.lockedAfter'].replace('{name}', 'The Dhaba'))).toBeVisible()

  await page.reload()
  await expect(page.getByRole('link', { name: strings['town.playAgain'].replace('{name}', 'The School') })).toBeVisible()
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
