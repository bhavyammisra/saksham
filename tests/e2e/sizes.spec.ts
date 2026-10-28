// The demo path at the three screen sizes in BUILD_PLAN P7: a school laptop, a big monitor and a
// phone. On every screen: no sideways scrolling, and every button can be reached on screen.
// SHOTS=<folder> npx playwright test sizes   also saves a screenshot of each screen, to look at.
import { expect, test, type Page } from '@playwright/test'
import school from '../../content/scenes/school.json' with { type: 'json' }
import { answerQuiz, playStory, strings } from './helpers.ts'

test.describe.configure({ timeout: 90_000 })
test.use({ reducedMotion: 'reduce' }) // same game, no typewriter: lines appear at once (see demo-path.spec.ts)

const SIZES = [
  { name: 'laptop', width: 1366, height: 768 },
  { name: 'monitor', width: 1920, height: 1080 },
  { name: 'phone', width: 390, height: 844 },
]

/** Checks the screen fits: nothing scrolls sideways, and no visible button sticks out past either side. */
async function fits(page: Page, size: string, screen: string) {
  await page.waitForTimeout(300) // let the layout settle after a step
  const problems = await page.evaluate(() => {
    const out: string[] = []
    if (document.documentElement.scrollWidth > window.innerWidth + 1) out.push(`page is ${document.documentElement.scrollWidth}px wide`)
    for (const el of document.querySelectorAll<HTMLElement>('button, a[href]')) {
      const r = el.getBoundingClientRect()
      if (r.width === 0 || r.height === 0 || el.closest('[inert], [aria-hidden="true"]')) continue
      // People and doors further along the street stand off screen until you walk there: that's the game.
      if (el.closest('[data-stage]')) continue
      if (r.left < -1 || r.right > window.innerWidth + 1) out.push(`"${el.innerText.trim() || el.getAttribute('aria-label')}" sticks out (${Math.round(r.left)} to ${Math.round(r.right)})`)
    }
    return out
  })
  expect(problems, `${size}: ${screen}`).toEqual([])
  if (process.env.SHOTS) await page.screenshot({ path: `${process.env.SHOTS}/${size}-${screen}.png` })
}

for (const size of SIZES) {
  test(`P7 the demo path fits a ${size.name} (${size.width}x${size.height})`, async ({ page }) => {
    await page.setViewportSize({ width: size.width, height: size.height })
    await page.goto('/')
    await fits(page, size.name, '01-title')

    await page.getByRole('button', { name: strings['title.newGame'] }).click()
    await page.getByLabel(strings['onboarding.nameLabel']).fill('Asha')
    await page.getByRole('button', { name: strings['onboarding.bandYoung'] }).click()
    await fits(page, size.name, '02-name')
    await page.getByRole('button', { name: strings['onboarding.next'] }).click()
    await fits(page, size.name, '03-customiser')
    await page.getByRole('button', { name: strings['builder.done'] }).click()

    await expect(page).toHaveURL(/#\/town$/)
    await fits(page, size.name, '04-town')

    await page.goto('/#/play/school')
    await fits(page, size.name, '05-school')
    await playStory(page, true)
    await fits(page, size.name, '06-card')
    await page.getByRole('button', { name: strings['card.flip'] }).click()
    await expect(page.getByRole('heading', { name: school.card.title })).toBeVisible()
    await fits(page, size.name, '07-card-back')
    await page.getByRole('button', { name: strings['card.toQuiz'] }).click()
    await fits(page, size.name, '08-quiz')
    await answerQuiz(page, [true, true, true, true])
    await fits(page, size.name, '09-results')

    for (const [screen, path] of [['10-book', '/book'], ['11-me', '/me'], ['12-community', '/community'], ['13-credits', '/credits'], ['14-teacher', '/teacher'], ['15-help', '/help']] as const) {
      await page.goto(`/#${path}`)
      await fits(page, size.name, screen)
    }
  })
}
