// Living world (BUILD_PLAN P6, D-053): ambient life, the time of day, and calm mode.
import { expect, test } from '@playwright/test'
import home from '../../content/scenes/home.json' with { type: 'json' }
import town from '../../content/scenes/town.json' with { type: 'json' }
import { seedPlayer } from './helpers.ts'

const diyasInTown = town.ambient.filter((a) => a.kind === 'diya').length

test('P6 the town follows the clock: no diyas at noon; at 7 pm the diyas are out and the scene is evening', async ({ page }) => {
  await page.clock.setFixedTime(new Date(2026, 9, 20, 12, 0, 0))
  await seedPlayer(page, '/town')
  await expect(page.locator('.scene')).toHaveAttribute('data-light', 'day')
  await expect(page.locator('.amb[data-kind="dog"]')).toHaveCount(1)
  await expect(page.locator('.amb[data-kind="diya"]')).toHaveCount(0)

  await page.clock.setFixedTime(new Date(2026, 9, 20, 19, 0, 0))
  await page.reload()
  await expect(page.locator('.scene')).toHaveAttribute('data-light', 'evening')
  await expect(page.locator('.amb[data-kind="diya"]')).toHaveCount(diyasInTown)
})

test('P6 a story scene keeps its own time: Home is always evening, with its diyas', async ({ page }) => {
  await page.clock.setFixedTime(new Date(2026, 9, 20, 9, 0, 0))
  await seedPlayer(page, '/play/home', { dhaba: true })
  await expect(page.locator('.scene')).toHaveAttribute('data-light', 'evening')
  await expect(page.locator('.amb')).toHaveCount(home.ambient.length)
})

test('P6 ambient life moves, and pauses while the tab is hidden', async ({ page }) => {
  await seedPlayer(page, '/town')
  const dog = page.locator('.amb[data-kind="dog"]')
  await expect(dog).toHaveClass(/amb-roam/)
  expect(await dog.evaluate((el) => el.getAnimations({ subtree: true }).length)).toBeGreaterThan(0)

  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true })
    document.dispatchEvent(new Event('visibilitychange'))
  })
  await expect(page.locator('.scene')).toHaveAttribute('data-hidden', 'true')
  const states = await dog.evaluate((el) => el.getAnimations({ subtree: true }).map((a) => a.playState))
  expect(states.every((s) => s === 'paused')).toBe(true)
})

test.describe('in calm mode', () => {
  test.use({ reducedMotion: 'reduce' })

  test('NFR-05 nothing ambient moves, and no dust is kicked up', async ({ page }) => {
    await seedPlayer(page, '/town')
    await expect(page.locator('.amb').first()).toBeVisible()
    await page.waitForTimeout(200)
    const running = await page.evaluate(
      () => [...document.querySelectorAll('.amb')].flatMap((el) => el.getAnimations({ subtree: true })).filter((a) => a.playState === 'running').length,
    )
    expect(running).toBe(0)
    // The passer-by stands still instead of walking on the spot.
    await expect(page.locator('.amb[data-kind="passerby"] .ch')).toHaveAttribute('data-pose', 'idle')
    await expect(page.locator('.game-dust')).toHaveCount(0)
  })
})
