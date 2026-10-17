// The walkable town (/town): doors lead into buildings, locked doors reply gently, Help has its own door.
import { expect, test, type Page } from '@playwright/test'
import town from '../../content/scenes/town.json' with { type: 'json' }
import { createPlayer, openMap, strings, talkThrough, thingsToDo } from './helpers.ts'

// These tests play whole scenes, which are heavy without a GPU when tests run in parallel.
test.describe.configure({ timeout: 60_000 })

const door = async (page: Page, id: string) => {
  const label = town.hotspots.find((h) => h.id === id)!.label
  return (await thingsToDo(page)).getByRole('button', { name: new RegExp(label) })
}
const live = (page: Page) => page.locator('[aria-live="polite"]').filter({ hasText: 'Mitthu:' }).first()

test.beforeEach(async ({ page }) => {
  await createPlayer(page, 'Asha')
  // Mitthu welcomes the player to the town.
  await expect(live(page)).toContainText(town.nodes.intro.text)
  await talkThrough(page)
})

test('FR-07 the School door is open and leads into the School, and Mitthu suggests it', async ({ page }) => {
  await expect(await door(page, 'school')).not.toContainText(strings['scene.locked'])
  await expect(await door(page, 'school')).toContainText(strings['scene.suggested'])
  await (await door(page, 'school')).click()
  await expect(page).toHaveURL(/#\/play\/school$/)
})

test('FR-07 a locked door says so, replies gently, and stays in the town', async ({ page }) => {
  await expect(await door(page, 'dhaba')).toContainText(strings['scene.locked'])
  await (await door(page, 'dhaba')).click()
  await expect(live(page)).toContainText(town.nodes['dhaba-closed'].text)
  await expect(page).toHaveURL(/#\/town$/)
})

test('FR-07 teasers say "Coming soon"', async ({ page }) => {
  await (await door(page, 'playground')).click()
  await expect(live(page)).toContainText('Coming soon!')
})

test('FR-08 the Help door opens the Help Centre, and Back returns to the town', async ({ page }) => {
  await expect(await door(page, 'help')).not.toContainText(strings['scene.locked'])
  await (await door(page, 'help')).click()
  await expect(page).toHaveURL(/#\/help$/)
  await page.getByRole('link', { name: strings['help.back'] }).click()
  await expect(page).toHaveURL(/#\/town$/)
})

test('D-036 the map travels to an open place, and says why a locked one is locked', async ({ page }) => {
  const map = await openMap(page)
  await map.getByRole('button', { name: /^The Dhaba: / }).click()
  await expect(map).toContainText(strings['town.lockedAfter'].replace('{name}', 'The School'))
  await expect(page).toHaveURL(/#\/town$/)
  await map.getByRole('button', { name: new RegExp(`^${strings['map.travel'].replace('{place}', 'The School')}`) }).click()
  await expect(page).toHaveURL(/#\/play\/school$/)
})
