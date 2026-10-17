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

type Question = { id: string; text: string; options: string[]; answer: number; band?: string }
type Game = { kind: string; id: string; questions?: Question[] }

/** A scene's quiz questions for young players. */
export const quizFor = (scene: { games: unknown[] }) => (scene.games as Game[]).find((g) => g.kind === 'quiz')!.questions!.filter((q) => !q.band)

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
export async function answerQuiz(page: Page, rightAnswers: boolean[], questions: Question[] = quizFor(school)) {
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

type SortGame = { kind: string; id: string; bins: { id: string; label: string }[]; items: { id: string; text: string; bin: string }[] }

/** A scene's sort game. */
export const sortFor = (scene: { games: unknown[] }) => scene.games.find((g) => (g as SortGame).kind === 'sort') as SortGame

/**
 * Plays a sort game by tapping the boxes: `rightAnswers` says, card by card, whether to pick the right box.
 * With `dragFirst`, the first card is dragged onto its box with the mouse instead (the drag way).
 */
export async function sortCards(page: Page, game: SortGame, rightAnswers: boolean[], dragFirst = false) {
  await expect(page.getByRole('heading', { name: strings['sort.title'] })).toBeVisible()
  for (const [i, right] of rightAnswers.entries()) {
    const item = game.items[i]!
    const bin = right ? item.bin : game.bins.find((b) => b.id !== item.bin)!.id
    const box = page.getByRole('button', { name: strings['sort.putIn'].replace('{bin}', game.bins.find((b) => b.id === bin)!.label), exact: true })
    const card = page.getByRole('heading', { name: item.text })
    await expect(card).toBeVisible()
    if (dragFirst && i === 0) {
      await card.dragTo(box)
    } else {
      await box.click()
    }
    await expect(page.getByText(right ? strings['quiz.correct'] : strings['quiz.notQuite'])).toBeVisible()
    const isLast = i === rightAnswers.length - 1
    await page.getByRole('button', { name: isLast ? strings['quiz.finish'] : strings['sort.next'] }).click()
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
  {
    band = 'young',
    school = false,
    dhaba = false,
    home = false,
    badges = [] as string[],
    demo = false,
  }: { band?: 'young' | 'teen'; school?: boolean; dhaba?: boolean; home?: boolean; badges?: string[]; demo?: boolean } = {},
) {
  await page.goto('/')
  await page.evaluate(
    ({ band, school, dhaba, home, badges, demo }) => {
      const avatar = { skin: 'skin-4', hair: 'two-plaits', hairColor: 'black', outfit: 'salwar', outfitColor: 'peacock', headwear: 'none', headwearColor: 'navy', glasses: false, bag: false }
      // Each place opens after the one before: `dhaba` means the School and the Dhaba are finished, `home` adds Home.
      const done = { stars: 2, bestScore: 75, completed: true }
      const finished = home ? 3 : dhaba ? 2 : school ? 1 : 0
      const progress = Object.fromEntries(['school', 'dhaba', 'home'].slice(0, finished).map((id) => [id, done]))
      const cards = ['right-to-education', 'freedom-from-child-labour', 'right-to-be-safe'].slice(0, finished)
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
    { band, school, dhaba, home, badges, demo },
  )
  await page.goto('about:blank')
  await page.goto(`/#${path}`)
}
