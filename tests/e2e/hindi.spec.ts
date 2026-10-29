// Hindi (BUILD_PLAN P6, D-054): switching language, and what must never change in Hindi.
import { expect, test } from '@playwright/test'
import help from '../../content/help.json' with { type: 'json' }
import hiTown from '../../content/hi/scenes/town.json' with { type: 'json' }
import school from '../../content/scenes/school.json' with { type: 'json' }
import hi from '../../content/strings.hi.json' with { type: 'json' }
import { seedPlayer, strings } from './helpers.ts'

test('FR-09 / NFR-09 switching to Hindi changes the whole game, and is remembered after a reload', async ({ page }) => {
  await seedPlayer(page, '/')
  await page.getByRole('button', { name: strings['title.settings'] }).click()
  await page.getByRole('button', { name: hi['lang.hi'] }).click()
  // The screen redraws in Hindi at once (the settings dialog closes as it does).
  await expect(page.locator('dialog[open]')).toHaveCount(0)

  await expect(page.locator('html')).toHaveAttribute('lang', 'hi')
  await expect(page.getByRole('button', { name: new RegExp(`^${hi['title.continue']}`) })).toBeVisible()
  await page.reload()
  await expect(page.getByRole('button', { name: new RegExp(`^${hi['title.continue']}`) })).toBeVisible()

  // The town: Mitthu welcomes you in Hindi.
  await page.goto('/#/town')
  await expect(page.locator('[aria-live="polite"]').filter({ hasText: 'मिट्ठू' }).first()).toContainText(hiTown['nodes.intro.text'])
})

test('FR-09 / NFR-10 in Hindi, the law on a card and the helpline numbers stay exactly as written', async ({ page }) => {
  await seedPlayer(page, '/', { school: true })
  await page.evaluate(() => {
    const saved = JSON.parse(localStorage.getItem('saksham') ?? '{}')
    saved.state.settings = { ...saved.state.settings, lang: 'hi' }
    localStorage.setItem('saksham', JSON.stringify(saved))
  })
  await page.goto('about:blank')
  await page.goto('/#/book')
  await page.getByRole('button', { name: new RegExp(hi['book.read'].replace(': {title}', '')) }).first().click()
  await expect(page.locator('blockquote')).toHaveText(school.card.law)

  await page.goto('/#/help')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(hi['help.button'])
  for (const line of help.helplines) await expect(page.getByText(line.number, { exact: true }).first()).toBeVisible()
  // And the credits say plainly that the Hindi hasn't been checked by a fluent speaker yet.
  await page.goto('/#/credits')
  await expect(page.getByText(hi['credits.hindi'])).toBeVisible()
})
