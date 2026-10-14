import { expect, test } from '@playwright/test'
import strings from '../../content/strings.en.json' with { type: 'json' }

test('the app shell loads and shows text from the strings file', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle(strings['app.name'])
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(strings['app.name'])
  await expect(page.getByText(strings['app.tagline'])).toBeVisible()
})

test('calm mode follows the system "reduce motion" setting', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await expect(page.locator('html')).toHaveAttribute('data-calm', '')

  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await expect(page.locator('html')).not.toHaveAttribute('data-calm')
})
