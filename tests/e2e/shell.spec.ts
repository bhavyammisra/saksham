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

test('the "Calm motion" setting turns calm mode on and is remembered after a reload', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.goto('/')
  await expect(page.locator('html')).not.toHaveAttribute('data-calm')

  await page.getByRole('button', { name: strings['settings.open'] }).click()
  const calm = page.getByRole('switch', { name: new RegExp(strings['settings.calmMotion']) })
  await expect(calm).toHaveAttribute('aria-checked', 'false')
  await calm.click()
  await expect(calm).toHaveAttribute('aria-checked', 'true')
  await expect(page.locator('html')).toHaveAttribute('data-calm', '')

  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('data-calm', '')
})

test('the top bar fits a phone screen without sideways scrolling', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 })
  await page.goto('/')
  const width = await page.evaluate(() => document.documentElement.scrollWidth)
  expect(width).toBeLessThanOrEqual(360)
})
