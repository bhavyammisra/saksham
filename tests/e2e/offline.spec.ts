// Local-first (BUILD_PLAN P5, NFR-03, D-048): the game works with the network off, and a build
// without the Supabase settings is the same game with the class features simply absent.
import { expect, test } from '@playwright/test'
import school from '../../content/scenes/school.json' with { type: 'json' }
import { answerQuiz, createPlayer, playStory, seedPlayer, skipWithoutBackend, strings } from './helpers.ts'

test.describe.configure({ timeout: 60_000 })
test.use({ reducedMotion: 'reduce' })

test('NFR-03 with the network off, a new player plays the School to the end and keeps the card', async ({ page, context }) => {
  await page.goto('/')
  await context.setOffline(true) // everything after this point has no network at all
  await createPlayer(page, 'Asha')
  await playStory(page)
  await page.getByRole('button', { name: strings['card.flip'] }).click()
  await expect(page.locator('blockquote')).toHaveText(school.card.law)
  await page.getByRole('button', { name: strings['card.toQuiz'] }).click()
  await answerQuiz(page, [true, true, true, true])
  await expect(page.getByRole('heading', { name: strings['results.title'].replace('{name}', 'Asha') })).toBeVisible()

  // Moving around inside the open app needs no network either. (Opening the app from scratch does:
  // there is no offline install yet, D-048.)
  await page.getByRole('link', { name: strings['play.backToTown'] }).click()
  await page.evaluate(() => (location.hash = '#/book'))
  await expect(page.getByText(strings['book.count'].replace('{n}', '1').replace('{total}', '4'))).toBeVisible()
  await page.getByTestId('help-button').click()
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await context.setOffline(false)
})

test('NFR-03 without the Supabase settings, the class features are simply not there', async ({ page }) => {
  await page.goto('/#/teacher')
  await page.getByRole('heading', { level: 1, name: strings['teacher.title'] }).waitFor()
  test.skip(!(await page.getByText(strings['teacher.offline']).isVisible()), 'only for a build without Supabase settings')

  await createPlayer(page, 'Asha')
  await page.goto('/#/me')
  await expect(page.getByRole('heading', { name: strings['me.badges'] })).toBeVisible()
  await expect(page.getByRole('region', { name: strings['class.title'] })).toHaveCount(0)
  await page.goto('/#/community')
  await expect(page.getByRole('region', { name: strings['community.mission'] })).toContainText(strings['community.sample'])
})

test('NFR-03 with the class server down, the game still plays and only says so calmly', async ({ page }) => {
  await skipWithoutBackend(page)
  const crashes: string[] = []
  page.on('pageerror', (error) => crashes.push(String(error)))
  // Every request to the class server fails, as if it were down.
  await page.route(/supabase\.co/, (route) => route.fulfill({ status: 503, contentType: 'application/json', body: '{"message":"unavailable"}' }))

  await seedPlayer(page, '/play/school')
  await playStory(page, true)
  await page.getByRole('button', { name: strings['card.flip'] }).click()
  await page.getByRole('button', { name: strings['card.toQuiz'] }).click()
  await answerQuiz(page, [true, true, true, true])
  await expect(page.getByText(strings['results.cardSaved'])).toBeVisible()

  // Joining a class says something went wrong, in plain words, and the game carries on.
  await page.goto('/#/me')
  await page.getByLabel(strings['class.code']).fill('ABCDEF')
  await page.getByRole('button', { name: strings['class.join'] }).click()
  await expect(page.getByText(strings['class.problemGeneral'])).toBeVisible()
  await page.goto('/#/book')
  await expect(page.getByRole('heading', { name: school.card.title }).or(page.getByText(strings['book.count'].replace('{n}', '1').replace('{total}', '4')))).toBeVisible()

  // A teacher signing in is told to check their connection.
  await page.goto('/#/teacher')
  await page.getByLabel(strings['teacher.email']).fill('teacher@example.com')
  await page.getByLabel(strings['teacher.password']).fill('a-long-password')
  await page.getByRole('main').getByRole('button', { name: strings['teacher.signIn'] }).last().click()
  await expect(page.getByText(strings['teacher.errorGeneral'])).toBeVisible()

  expect(crashes).toEqual([])
})
