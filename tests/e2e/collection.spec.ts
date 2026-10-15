// The Book, Me, Credits and demo mode (BUILD_PLAN P4).
import { expect, test } from '@playwright/test'
import school from '../../content/scenes/school.json' with { type: 'json' }
import { seedPlayer, strings } from './helpers.ts'

test('FR-05 the Book shows collected cards, and each reads exactly as written', async ({ page }) => {
  await seedPlayer(page, '/book', { school: true })
  await expect(page.getByText(strings['book.count'].replace('{n}', '1').replace('{total}', '1'))).toBeVisible()
  await page.getByRole('button', { name: strings['book.read'].replace('{title}', school.card.title) }).click()
  await expect(page.getByRole('heading', { name: school.card.title })).toBeVisible()
  await expect(page.locator('blockquote')).toHaveText(school.card.law)
  await page.getByRole('button', { name: strings['book.close'] }).click()
  await expect(page.locator('blockquote')).toHaveCount(0)
})

test('FR-05 a new player\'s Book is empty and says how to collect the School card', async ({ page }) => {
  await seedPlayer(page, '/book')
  await expect(page.getByText(strings['book.count'].replace('{n}', '0').replace('{total}', '1'))).toBeVisible()
  await expect(page.getByText(strings['book.helpAt'].replace('{place}', 'The School'))).toBeVisible()
  await expect(page.getByRole('button', { name: /Read the card/ })).toHaveCount(0)
})

test('FR-07 Me shows this player\'s own badges, settings and a way to switch player', async ({ page }) => {
  await seedPlayer(page, '/me', { school: true, badges: ['first-steps'] })
  await expect(page.getByText(strings['me.stars'].replace('{n}', '2'))).toBeVisible()
  const badges = page.getByRole('region', { name: strings['me.badges'] })
  await expect(badges.getByRole('listitem').filter({ hasText: strings['badge.firstSteps'] })).toContainText(strings['me.earned'])
  await expect(badges.getByRole('listitem').filter({ hasText: strings['badge.quizWhiz'] })).toContainText(strings['me.notYet'])

  // The settings work from here too: calm motion.
  const settings = page.getByRole('region', { name: strings['me.settings'] })
  await settings.getByRole('switch', { name: new RegExp(strings['settings.calmMotion']) }).click()
  await expect(page.locator('html')).toHaveAttribute('data-calm', '')

  await page.getByRole('button', { name: strings['me.switchPlayer'] }).click()
  await expect(page).toHaveURL(/#\/profiles$/)
})

test('Credits lists the fonts and the legal source of every card, exactly as written', async ({ page }) => {
  await seedPlayer(page, '/me')
  await page.getByRole('link', { name: strings['credits.title'] }).click()
  await expect(page).toHaveURL(/#\/credits$/)
  await expect(page.getByText('Noto Serif Devanagari')).toBeVisible()
  await expect(page.getByText(school.card.source, { exact: true })).toBeVisible()
})

test('FR-17 typing "demo" opens every playable place, and the chip turns it off', async ({ page }) => {
  await seedPlayer(page, '/town')
  const home = page.locator('article').filter({ has: page.getByRole('heading', { name: 'Home', exact: true }) })
  await expect(home).toContainText(strings['town.lockedAfter'].replace('{name}', 'The Dhaba'))
  await page.locator('h1').click()
  await page.keyboard.type('demo')
  await expect(page.getByRole('button', { name: new RegExp(strings['demo.chip']) })).toBeVisible()
  await expect(home).toContainText(strings['town.beingBuilt'])
  await page.getByRole('button', { name: new RegExp(strings['demo.chip']) }).click()
  await expect(page.getByRole('button', { name: new RegExp(strings['demo.chip']) })).toHaveCount(0)
  await expect(home).toContainText(strings['town.lockedAfter'].replace('{name}', 'The Dhaba'))
})

test('FR-17 holding the logo for 2 seconds turns demo mode on (and doesn\'t follow the link)', async ({ page }) => {
  await seedPlayer(page, '/book')
  const logo = page.getByRole('link', { name: strings['shell.home'] })
  await logo.hover()
  await page.mouse.down()
  await page.waitForTimeout(2300)
  await page.mouse.up()
  await expect(page.getByRole('button', { name: new RegExp(strings['demo.chip']) })).toBeVisible()
  await expect(page).toHaveURL(/#\/book$/)
})

test('FR-17 typing "demo" in a text box does not turn demo mode on', async ({ page }) => {
  await page.goto('/#/onboarding')
  await page.getByRole('button', { name: strings['onboarding.start'] }).click()
  await page.getByLabel(strings['onboarding.nameLabel']).fill('')
  await page.getByLabel(strings['onboarding.nameLabel']).pressSequentially('demo')
  await expect(page.getByRole('button', { name: new RegExp(strings['demo.chip']) })).toHaveCount(0)
})
