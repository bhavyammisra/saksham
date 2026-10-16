import { expect, type Page } from '@playwright/test'
import school from '../../content/scenes/school.json' with { type: 'json' }
import strings from '../../content/strings.en.json' with { type: 'json' }

export { strings }

/** Starts a new game (name and age, then the character) and lands in the town. */
export async function createPlayer(page: Page, name: string, band: 'young' | 'teen' = 'young') {
  await page.goto('/#/onboarding')
  await page.getByLabel(strings['onboarding.nameLabel']).fill(name)
  const label = band === 'young' ? strings['onboarding.bandYoung'] : strings['onboarding.bandTeen']
  await page.getByRole('button', { name: label }).click()
  await page.getByRole('button', { name: strings['onboarding.next'] }).click()
  await page.getByRole('button', { name: strings['builder.done'] }).click()
  await expect(page).toHaveURL(/#\/town$/)
}

// ---------------------------------------------------------------- playing the School

// ---------------------------------------------------------------- the game frame (D-036)

const menu = (page: Page) => page.getByRole('navigation', { name: strings['hud.menu'] })

/** "Things to do here": opens it from the menu words if it isn't open, and returns it. */
export async function thingsToDo(page: Page) {
  const panel = page.getByRole('region', { name: strings['scene.thingsToDo'] })
  if (!(await panel.isVisible())) await menu(page).getByRole('button', { name: strings['hud.things'], exact: true }).click()
  return panel
}

/** Goes straight to a hotspot through "Things to do here" (which closes again). */
export async function doThing(page: Page, name: string | RegExp) {
  await (await thingsToDo(page)).getByRole('button', { name }).click()
}

/** Opens the area map (if it isn't open) and returns it. Each place is a button named after it. */
export async function openMap(page: Page) {
  const map = page.getByRole('dialog', { name: strings['map.title'] })
  if (!(await map.isVisible())) await menu(page).getByRole('button', { name: strings['hud.map'], exact: true }).click()
  return map
}
const next = (page: Page) => page.getByRole('button', { name: strings['scene.next'], exact: true })

/** Presses Next until a choice appears or the conversation closes. */
export async function talkThrough(page: Page) {
  for (let i = 0; i < 16; i++) {
    if (!(await next(page).isVisible())) return
    await next(page).click()
  }
}

/**
 * Plays the School story to the good ending, with one weaker choice first (one retry).
 * Opens /play/school first unless `alreadyThere` (e.g. the player arrived from the town).
 */
export async function playStory(page: Page, alreadyThere = false) {
  if (!alreadyThere) await page.goto('/#/play/school')
  // Arriving: Mitthu's intro line opens by itself.
  await expect(page.locator('[aria-live="polite"]').filter({ hasText: 'Mitthu:' }).first()).toContainText(school.nodes.intro.text)
  await talkThrough(page)
  for (const label of ['Talk to Ravi', 'Talk to the girl at the gate', 'Read the notice board']) {
    await doThing(page, label)
    await talkThrough(page)
  }
  await doThing(page, 'Ask Meena Didi for help')
  await talkThrough(page)
  await page.getByRole('button', { name: /^Never mind/ }).click()
  await talkThrough(page)
  await page.getByRole('button', { name: /wants to study here/ }).click()
  await talkThrough(page)
}

/** Answers the quiz: `rightAnswers` says, question by question, whether to pick the right option. */
export async function answerQuiz(page: Page, rightAnswers: boolean[], questions = school.games[0]!.questions.filter((q) => !q.band)) {
  for (const [i, right] of rightAnswers.entries()) {
    const q = questions[i]!
    await expect(page.getByRole('heading', { name: q.text })).toBeVisible()
    const option = right ? q.answer : (q.answer + 1) % q.options.length
    await page.getByRole('button', { name: q.options[option], exact: true }).click()
    await expect(page.getByText(right ? strings['quiz.correct'] : strings['quiz.notQuite'])).toBeVisible()
    const isLast = i === rightAnswers.length - 1
    await page.getByRole('button', { name: isLast ? strings['quiz.finish'] : strings['quiz.next'] }).click()
  }
}

// ---------------------------------------------------------------- a saved player, without playing

/**
 * Loads a player straight into saved storage (the same shape the app saves), then opens `path`.
 * Much faster than playing a building when a test only needs the result.
 */
export async function seedPlayer(
  page: Page,
  path: string,
  { band = 'young', school = false, badges = [] as string[], demo = false }: { band?: 'young' | 'teen'; school?: boolean; badges?: string[]; demo?: boolean } = {},
) {
  await page.goto('/')
  await page.evaluate(
    ({ band, school, badges, demo }) => {
      const avatar = { skin: 'skin-4', hair: 'two-plaits', hairColor: 'black', outfit: 'salwar', outfitColor: 'peacock', headwear: 'none', headwearColor: 'navy', glasses: false, bag: false }
      const progress = school ? { school: { stars: 2, bestScore: 75, completed: true } } : {}
      const cards = school ? ['right-to-education'] : []
      localStorage.setItem(
        'saksham',
        JSON.stringify({
          version: 2,
          state: {
            profiles: [{ id: 'p1', firstName: 'Asha', band, createdAt: 1, avatar }],
            activeProfileId: 'p1',
            settings: {},
            demo,
            data: { p1: { progress, extras: { cards, badges, marigolds: [], pledges: [] } } },
          },
        }),
      )
    },
    { band, school, badges, demo },
  )
  await page.goto('about:blank')
  await page.goto(`/#${path}`)
}
