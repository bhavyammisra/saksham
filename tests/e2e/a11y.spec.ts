// Accessibility (BUILD_PLAN P7, NFR-05): axe checks every screen against WCAG 2.1 AA, and every
// button and link a child can press is at least 48 px tall or wide enough to hit.
import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import { seedPlayer, strings } from './helpers.ts'

test.describe.configure({ timeout: 60_000 })
test.use({ reducedMotion: 'reduce' })

const SCREENS = ['/', '/onboarding', '/town', '/play/school', '/book', '/me', '/community', '/credits', '/teacher', '/reviewer', '/help']

/** WCAG 2.1 A and AA problems on the screen, as short lines a person can read. */
async function axeProblems(page: Page) {
  const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
  return violations.map((v) => `${v.id} (${v.impact}): ${v.help}. ${v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join(' | ')}`)
}

for (const path of SCREENS) {
  test(`NFR-05 axe finds no WCAG 2.1 AA problems on ${path}`, async ({ page }) => {
    await seedPlayer(page, path, { school: true })
    await page.waitForTimeout(500)
    expect(await axeProblems(page)).toEqual([])
  })
}

test('NFR-05 every button and link on the main screens is a 48 px target', async ({ page }) => {
  const small: string[] = []
  for (const path of SCREENS) {
    await seedPlayer(page, path, { school: true })
    await page.waitForTimeout(300)
    const found = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>('button, a[href], input, select, summary')]
        .filter((el) => {
          const r = el.getBoundingClientRect()
          // Links inside a sentence are exempt (WCAG 2.5.8); so is anything hidden or off screen.
          const inline = el.tagName === 'A' && getComputedStyle(el).display === 'inline'
          return r.width > 1 && r.height > 1 && !inline && !el.closest('[inert], [aria-hidden="true"]') && (r.height < 47.5 || r.width < 23.5)
        })
        .map((el) => `${el.tagName.toLowerCase()} "${(el.innerText || el.getAttribute('aria-label') || '').trim().slice(0, 30)}" ${Math.round(el.getBoundingClientRect().width)}x${Math.round(el.getBoundingClientRect().height)}`),
    )
    small.push(...found.map((f) => `${path}: ${f}`))
  }
  expect(small).toEqual([])
})

test('NFR-05 the School can be played with the keyboard alone', async ({ page }) => {
  await seedPlayer(page, '/play/school')
  const next = page.getByRole('button', { name: strings['scene.next'] })
  /** Each line's Next button takes focus by itself, so Enter alone keeps a conversation going. */
  const talkWithEnter = async () => {
    for (let i = 0; i < 12 && (await next.isVisible()); i++) {
      await expect(next).toBeFocused()
      await page.keyboard.press('Enter')
    }
  }
  await talkWithEnter() // Mitthu's arrival line
  await expect(page.getByText(strings['hud.controls'])).toBeVisible()

  // "Things to do here" lists every place to go: Tab reaches it, Enter opens it and goes there.
  const things = page.getByRole('button', { name: strings['hud.things'] })
  for (let i = 0; i < 20 && !(await things.evaluate((el) => el === document.activeElement)); i++) await page.keyboard.press('Tab')
  await expect(things).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('heading', { name: strings['scene.thingsToDo'] })).toBeVisible()
  // Focus moves into the panel by itself, so Enter goes straight to the first thing to do and talks.
  await expect(page.locator('#things-panel button').first()).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(next).toBeVisible()
  await talkWithEnter()
  await expect(page.getByText(strings['hud.controls'])).toBeVisible()
})
