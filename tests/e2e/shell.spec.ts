import { expect, test } from '@playwright/test'
import strings from '../../content/strings.en.json' with { type: 'json' }

test('the app loads, takes a new player to onboarding, and uses the strings file', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveURL(/#\/onboarding$/)
  await expect(page).toHaveTitle(strings['app.name'])
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(strings['onboarding.title'])
})

test('screens that need a player send a new visitor back to the start', async ({ page }) => {
  await page.goto('/#/town')
  await expect(page).toHaveURL(/#\/onboarding$/)
})

test('unknown routes go back to the start', async ({ page }) => {
  await page.goto('/#/no-such-page')
  await expect(page).toHaveURL(/#\/onboarding$/)
})

test('calm mode follows the system "reduce motion" setting', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await expect(page.locator('html')).toHaveAttribute('data-calm', '')

  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await expect(page.locator('html')).not.toHaveAttribute('data-calm')
})
