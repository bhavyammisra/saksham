// The scene engine, played end to end in the sandbox (/dev/scene).
import { expect, test, type Page } from '@playwright/test'
import sandbox from '../../content/scenes/sandbox.json' with { type: 'json' }
import { doThing, strings, thingsToDo } from './helpers.ts'

const live = (page: Page) => page.locator('[aria-live="polite"]').filter({ hasText: ':' }).first()
const next = (page: Page) => page.getByRole('button', { name: strings['scene.next'], exact: true })

/** Moves on by exactly one line (the first press may only finish the typewriter). */
async function nextLine(page: Page) {
  const before = await live(page).textContent()
  for (let i = 0; i < 3 && (await live(page).textContent()) === before; i++) await next(page).click()
}

/** Presses Next until a choice appears or the conversation closes. */
async function talkThrough(page: Page) {
  for (let i = 0; i < 12; i++) {
    if (!(await next(page).isVisible())) return
    await next(page).click() // first press finishes the typewriter, second moves on
  }
}

test.beforeEach(async ({ page }) => {
  await page.goto('/#/dev/scene')
  await expect(page.getByRole('region', { name: /Scene:/ })).toBeVisible()
})

test('FR-02 / FR-03 keyboard: walk with the arrow keys, see the prompt, press E to talk', async ({ page }) => {
  await page.getByRole('region', { name: /Scene:/ }).focus()
  const prompt = page.locator('.scene-prompt', { hasText: 'Talk to Ravi' })
  // Walk in short taps (about 36 units each) and check between them. Holding the key while
  // waiting could walk straight past Ravi on a busy machine: his prompt only shows within 120 units.
  for (let i = 0; i < 60 && !(await prompt.isVisible()); i++) {
    await page.keyboard.down('ArrowRight')
    await page.waitForTimeout(100)
    await page.keyboard.up('ArrowRight')
  }
  await expect(prompt).toBeVisible()
  await page.keyboard.press('e')
  // The line is announced through the aria-live region.
  await expect(live(page)).toHaveText(`Ravi: ${sandbox.nodes['ravi-hello'].text}`)
})

test('FR-03 "Things to do here" lists only visible hotspots and opens them without walking', async ({ page }) => {
  await expect((await thingsToDo(page)).getByRole('button', { name: 'Read the notice' })).toHaveCount(0) // needs the box first
  await doThing(page, 'Look at the box')
  await expect(live(page)).toContainText('A blue cover')
  await talkThrough(page)
  await expect((await thingsToDo(page)).getByRole('button', { name: 'Read the notice' })).toBeVisible()
})

test('FR-04 a weaker choice says "let\'s try that again", then the good choice completes the scene', async ({ page }) => {
  for (const label of ['Talk to Ravi', 'Look at the box', 'Read the notice']) {
    await doThing(page, label)
    await talkThrough(page)
  }
  // Objectives update as flags are set.
  await expect(page.getByRole('region', { name: strings['scene.objectives'] }).getByText(/done\)$/)).toHaveCount(2)

  await doThing(page, 'Talk to Meena Didi')
  await talkThrough(page)
  await page.getByRole('button', { name: 'Never mind, it is not important.' }).click()
  await expect(live(page)).toContainText('Come back if you change your mind') // the consequence
  await nextLine(page)
  await expect(live(page)).toContainText("Let's try that again") // Mitthu, never "wrong"
  await nextLine(page)
  await expect(live(page)).toContainText(sandbox.nodes['didi-hello'].text) // back to the choice
  await page.getByRole('button', { name: "Ravi's book is in the lost box. Can you help him?" }).click()
  await talkThrough(page)

  await expect(page.getByRole('status')).toHaveText(strings['dev.sceneComplete'].replace('{retries}', '1'))
})

test('FR-03 an exit hotspot leaves the scene', async ({ page }) => {
  await doThing(page, 'Leave the sandbox')
  await expect(page.getByRole('status')).toHaveText(strings['dev.sceneExit'].replace('{label}', 'Leave the sandbox'))
})

test('NFR-05 calm mode: no typewriter, the whole line shows at once', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.reload()
  await doThing(page, 'Talk to Ravi')
  const text = page.getByRole('region', { name: strings['scene.conversation'] }).locator('p[aria-hidden="true"]')
  await expect(text).toHaveText(sandbox.nodes['ravi-hello'].text)
  // One press moves on, because there is nothing left to type.
  await next(page).click()
  await expect(live(page)).toContainText(sandbox.nodes['player-reply'].text)
})

test('NFR-05 tap targets in the scene panels are at least 48px tall', async ({ page }) => {
  const heights = await (await thingsToDo(page))
    .getByRole('button')
    .evaluateAll((buttons) => buttons.map((b) => b.getBoundingClientRect().height))
  for (const h of heights) expect(h).toBeGreaterThanOrEqual(48)
})

test('D-036 W and S walk nearer and further; Back shows the line before; History lists the lines', async ({ page }) => {
  const player = page.locator('.game-person').last()
  const before = await player.boundingBox()
  await page.getByRole('region', { name: /Scene:/ }).focus()
  await page.keyboard.down('s')
  await page.waitForTimeout(400)
  await page.keyboard.up('s')
  const after = await player.boundingBox()
  expect(after!.y + after!.height).toBeGreaterThan(before!.y + before!.height) // feet lower on screen: nearer

  await doThing(page, 'Talk to Ravi')
  const first = await live(page).textContent()
  await nextLine(page)
  await expect(live(page)).not.toHaveText(first!)
  await page.getByRole('navigation', { name: strings['hud.menu'] }).getByRole('button', { name: strings['hud.back'] }).click()
  await expect(live(page)).toHaveText(first!)

  await page.getByRole('navigation', { name: strings['hud.menu'] }).getByRole('button', { name: strings['hud.history'] }).click()
  const history = page.getByRole('dialog', { name: strings['hud.history'] })
  await expect(history).toContainText(sandbox.nodes['ravi-hello'].text)
  await history.getByRole('button', { name: strings['hud.close'] }).click()
  await expect(history).toHaveCount(0)
})

test('D-039 the legs step while walking, even with reduced motion (no sliding)', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.reload()
  await page.getByRole('region', { name: /Scene:/ }).focus()
  await page.keyboard.down('d')
  const leg = () => page.locator('.game-person svg.ch .ch-leg-l').last().evaluate((el) => getComputedStyle(el).transform)
  const seen = new Set<string>()
  for (let i = 0; i < 6; i++) {
    await page.waitForTimeout(120)
    seen.add(await leg())
  }
  await page.keyboard.up('d')
  expect(seen.size).toBeGreaterThan(2) // the leg's angle keeps changing
})
