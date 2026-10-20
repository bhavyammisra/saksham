// Splash v2 (BUILD_PLAN P6, D-050): the storybook opening.
import { expect, test } from '@playwright/test'
import { strings } from './helpers.ts'

// These tests start as a brand-new player (the config gives every other test the "seen" flag).
test.use({ storageState: { cookies: [], origins: [] } })

test('P6 the first load plays the long splash, and it ends by itself on the title menu', async ({ page }) => {
  await page.goto('/')
  const splash = page.getByTestId('splash')
  await expect(splash).toBeVisible()
  await expect(splash.getByText(strings['splash.tap'])).toBeVisible()
  // The title menu behind it can't be reached with the keyboard until it has gone.
  await expect(page.locator('#root > [inert]')).toHaveCount(1)
  // Still there after 2 s: the first load is about 4 s long.
  await page.waitForTimeout(2000)
  await expect(splash).toBeVisible()
  await expect(splash).toBeHidden({ timeout: 5000 })
  await expect(page.locator('#root > [inert]')).toHaveCount(0)
  await expect(page.getByRole('button', { name: strings['title.newGame'] })).toBeVisible()
})

test('P6 a tap, a click or Escape skips it at once, and the next load is the short one', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: strings['splash.label'] }).click()
  await expect(page.getByTestId('splash')).toBeHidden({ timeout: 1000 })

  await page.reload()
  await expect(page.getByTestId('splash')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByTestId('splash')).toBeHidden({ timeout: 1000 })

  // A returning player's splash is about 1 s, so it is gone well before 2 s.
  await page.reload()
  await expect(page.getByTestId('splash')).toBeVisible()
  await expect(page.getByTestId('splash')).toBeHidden({ timeout: 2000 })
})

test('NFR-06 the splash has its own Need help?, and never shows over the Help Centre', async ({ page }) => {
  await page.goto('/')
  await page.getByTestId('splash-help-button').click()
  await expect(page).toHaveURL(/#\/help$/)
  await expect(page.getByTestId('splash')).toHaveCount(0)

  // Opening the game straight on the Help Centre (or any page but the title menu): no splash.
  await page.goto('/#/help')
  await page.reload()
  await expect(page.getByTestId('splash')).toHaveCount(0)
  await page.goto('/#/credits')
  await page.reload()
  await expect(page.getByTestId('splash')).toHaveCount(0)
})

test.describe('in calm mode', () => {
  test.use({ reducedMotion: 'reduce' })

  test('NFR-05 it is a still picture, with every lantern lit and the cover gone, then it fades', async ({ page }) => {
    await page.goto('/')
    const splash = page.getByTestId('splash')
    await expect(splash).toBeVisible()
    await expect(splash.locator('.splash-cover')).toBeHidden()
    const moving = await splash.evaluate((el) => el.getAnimations({ subtree: true }).filter((a) => a instanceof CSSAnimation).length)
    expect(moving).toBe(0)
    await expect(splash).toBeHidden({ timeout: 3000 })
  })
})
