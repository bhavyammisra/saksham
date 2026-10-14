import { expect, test } from '@playwright/test'
import strings from '../../content/strings.en.json' with { type: 'json' }

test('the app shell loads and shows text from the strings file', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle(strings['app.name'])
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(strings['app.name'])
  await expect(page.getByText(strings['app.tagline'])).toBeVisible()
})
