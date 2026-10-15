// The walkable town (/town): doors lead into buildings, locked doors reply gently, Help has its own door.
import { expect, test, type Page } from '@playwright/test'
import town from '../../content/scenes/town.json' with { type: 'json' }
import { createPlayer, strings, talkThrough, thingsToDo } from './helpers.ts'

// These tests play whole scenes, which are heavy without a GPU when tests run in parallel.
test.describe.configure({ timeout: 60_000 })

const door = (page: Page, id: string) => {
  const label = town.hotspots.find((h) => h.id === id)!.label
  return thingsToDo(page).getByRole('button', { name: new RegExp(label) })
}
const live = (page: Page) => page.locator('[aria-live="polite"]').filter({ hasText: 'Mitthu:' }).first()

test.beforeEach(async ({ page }) => {
  await createPlayer(page, 'Asha')
  // Mitthu welcomes the player to the town.
  await expect(live(page)).toContainText(town.nodes.intro.text)
  await talkThrough(page)
})

test('FR-07 the School door is open and leads into the School, and Mitthu suggests it', async ({ page }) => {
  await expect(door(page, 'school')).not.toContainText(strings['scene.locked'])
  await expect(door(page, 'school')).toContainText(strings['scene.suggested'])
  await door(page, 'school').click()
  await expect(page).toHaveURL(/#\/play\/school$/)
})

test('FR-07 a locked door says so, replies gently, and stays in the town', async ({ page }) => {
  await expect(door(page, 'dhaba')).toContainText(strings['scene.locked'])
  await door(page, 'dhaba').click()
  await expect(live(page)).toContainText(town.nodes['dhaba-closed'].text)
  await expect(page).toHaveURL(/#\/town$/)
})

test('FR-07 teasers say "Coming soon"', async ({ page }) => {
  await door(page, 'playground').click()
  await expect(live(page)).toContainText('Coming soon!')
})

test('FR-08 the Help door opens the Help Centre, and Back returns to the town', async ({ page }) => {
  await expect(door(page, 'help')).not.toContainText(strings['scene.locked'])
  await door(page, 'help').click()
  await expect(page).toHaveURL(/#\/help$/)
  await page.getByRole('link', { name: strings['help.back'] }).click()
  await expect(page).toHaveURL(/#\/town$/)
})
