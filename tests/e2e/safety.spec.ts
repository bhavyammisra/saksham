// Safety invariants (CLAUDE.md "Non-negotiable safety rules", BUILD_PLAN §4).
// These must stay green forever. If one fails, fix the app, not the test.

import { expect, test, type Page } from '@playwright/test'
import { createPlayer, strings } from './helpers.ts'

// Every route a child, teacher or reviewer can open, except /help.
const ROUTES_WITH_HELP_BUTTON = [
  '/profiles',
  '/onboarding',
  '/town',
  '/play/school',
  '/book',
  '/community',
  '/me',
  '/me/character',
  '/credits',
  '/teacher',
  '/reviewer',
  '/dev/characters',
  '/dev/scene',
  '/dev/look',
]

test.describe('FR-08 / NFR-06 "Need help?" is on every screen except the Help Centre', () => {
  test('every route shows the Help button', async ({ page }) => {
    await createPlayer(page, 'Asha')
    for (const route of ROUTES_WITH_HELP_BUTTON) {
      await page.goto(`/#${route}`)
      await expect(page, `route ${route} should not redirect`).toHaveURL(new RegExp(`#${route}$`))
      await expect(page.getByTestId('help-button'), `Help button on ${route}`).toBeVisible()
      await expect(page.getByTestId('help-button')).toHaveText(strings['help.button'])
    }
  })

  test('the Help button opens the Help Centre, which has no Help button of its own', async ({ page }) => {
    await createPlayer(page, 'Asha')
    await page.getByTestId('help-button').click()
    await expect(page).toHaveURL(/#\/help$/)
    await expect(page.getByTestId('help-button')).toHaveCount(0)
  })

  test('the Help Centre is reachable before any player exists', async ({ page }) => {
    await page.goto('/')
    await page.getByTestId('help-button').click()
    await expect(page).toHaveURL(/#\/help$/)
  })
})

test.describe('NFR-06 the Help Centre is calm and silent', () => {
  // Count every sound that starts, by wrapping WebAudio before the app loads.
  async function countSounds(page: Page) {
    await page.addInitScript(() => {
      const w = window as unknown as { __soundsStarted: number }
      w.__soundsStarted = 0
      // Oscillators and audio buffers both inherit start() from AudioScheduledSourceNode.
      const start = AudioScheduledSourceNode.prototype.start
      AudioScheduledSourceNode.prototype.start = function (when?: number) {
        w.__soundsStarted += 1
        return start.call(this, when)
      }
    })
  }
  const soundsStarted = (page: Page) =>
    page.evaluate(() => (window as unknown as { __soundsStarted: number }).__soundsStarted)

  test('no sound plays on the Help Centre (and the counter does work elsewhere)', async ({ page }) => {
    await countSounds(page)
    await page.goto('/#/onboarding')
    // Control: a normal button does make a sound.
    await page.getByRole('button', { name: strings['onboarding.start'] }).click()
    await expect.poll(() => soundsStarted(page)).toBeGreaterThan(0)

    const before = await soundsStarted(page)
    await page.getByTestId('help-button').click()
    await expect(page).toHaveURL(/#\/help$/)
    await page.getByRole('heading', { level: 1 }).click()
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    expect(await soundsStarted(page)).toBe(before)
  })

  test('nothing moves on the Help Centre', async ({ page }) => {
    await page.goto('/#/help')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    const motion = await page.evaluate(() => {
      const moving: string[] = []
      for (const el of document.querySelectorAll('body *')) {
        const style = getComputedStyle(el)
        const transitions = style.transitionDuration.split(',').some((d) => parseFloat(d) > 0)
        if (style.animationName !== 'none' || transitions) moving.push(el.tagName)
      }
      return { running: document.getAnimations().length, moving }
    })
    expect(motion).toEqual({ running: 0, moving: [] })
  })

  test('nothing on the Help Centre is red', async ({ page }) => {
    await page.goto('/#/help')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    const reds = await page.evaluate(() => {
      const found: string[] = []
      const props = ['color', 'backgroundColor', 'borderTopColor', 'borderRightColor', 'borderBottomColor', 'borderLeftColor']
      for (const el of [document.body, ...document.querySelectorAll('body *')]) {
        const style = getComputedStyle(el) as unknown as Record<string, string>
        for (const prop of props) {
          const [r = 0, g = 0, b = 0, a = 1] = (style[prop]?.match(/[\d.]+/g) ?? []).map(Number)
          // "Red" = a visible colour where red clearly dominates green and blue.
          if (a > 0 && r > 150 && r - g > 70 && r - b > 70) found.push(`${el.tagName}.${prop}=${style[prop]}`)
        }
      }
      return found
    })
    expect(reds).toEqual([])
  })

  test('the Help Centre shows no points, stars or rewards', async ({ page }) => {
    await page.goto('/#/help')
    const text = (await page.locator('body').innerText()).toLowerCase()
    for (const word of ['point', 'star', 'badge', 'reward', 'marigold', 'score']) {
      expect(text, `"${word}" on the Help Centre`).not.toContain(word)
    }
  })
})

test.describe('NFR-01 the first name field accepts only a first name', () => {
  for (const bad of ['Asha1', '12345', 'asha@mail.com', 'Ravi!', 'R_K', '😀', 'A'.repeat(21)]) {
    test(`rejects "${bad}"`, async ({ page }) => {
      await page.goto('/#/onboarding')
      await page.getByRole('button', { name: strings['onboarding.start'] }).click()
      await page.getByLabel(strings['onboarding.nameLabel']).fill(bad)
      await page.getByRole('button', { name: strings['onboarding.next'] }).click()

      await expect(page.getByRole('alert')).toHaveText(strings['onboarding.nameError'])
      await expect(page.getByLabel(strings['onboarding.nameLabel'])).toHaveAttribute('aria-invalid', 'true')
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(strings['onboarding.nameTitle'])
      const profiles = await page.evaluate(
        () => JSON.parse(localStorage.getItem('saksham') ?? '{"state":{"profiles":[]}}').state.profiles,
      )
      expect(profiles).toEqual([])
    })
  }

  test('accepts a Hindi first name', async ({ page }) => {
    await createPlayer(page, 'आशा')
  })
})

test.describe('NFR-01 children never see another child\'s text', () => {
  test('one player\'s name appears nowhere while another player plays (except the player picker)', async ({ page }) => {
    const other = 'Zubeida'
    await createPlayer(page, other)
    await page.goto('/#/profiles')
    await page.getByRole('button', { name: strings['profiles.new'] }).click()
    await createPlayer(page, 'Ravi', 'teen')

    for (const route of [...ROUTES_WITH_HELP_BUTTON.filter((r) => r !== '/profiles'), '/help']) {
      await page.goto(`/#${route}`)
      await expect(page.locator('body')).not.toContainText(other)
    }
  })
})
