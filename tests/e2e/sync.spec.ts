// Sending progress and answers to the class (BUILD_PLAN P5, FR-12, D-046).
// The class server is a fake in the browser that keeps what it is sent, so these tests check what
// actually arrives. The real merge rules (max for progress, union for extras) are tested in
// supabase/tests/rls.test.sql; this fake applies the same rules.
import { expect, test, type Page, type Route } from '@playwright/test'
import school from '../../content/scenes/school.json' with { type: 'json' }
import { answerQuiz, playStory, skipWithoutBackend, strings } from './helpers.ts'

// The class features only exist in a build with the Supabase settings.
test.beforeEach(({ page }) => skipWithoutBackend(page))

const USER = 'child-1'

interface Server {
  progress: Map<string, { stars: number; best_score: number; completed: boolean }>
  extras: { cards: string[]; badges: string[]; marigolds: string[]; pledges: string[] }
  attempts: { building_id: string; question_id: string; correct: boolean }[]
  restCalls: number
  down: boolean // answer every data request with an error
}

async function fakeClassServer(page: Page, start: Partial<Server> = {}): Promise<Server> {
  const server: Server = { progress: new Map(), extras: { cards: [], badges: [], marigolds: [], pledges: [] }, attempts: [], restCalls: 0, down: false, ...start }
  const json = (route: Route, body: unknown, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) })
  const part = (o: object) => Buffer.from(JSON.stringify(o)).toString('base64url')

  await page.route(/supabase\.co\/auth\/v1\/token/, (route) => {
    const now = Math.floor(Date.now() / 1000)
    const user = { id: USER, aud: 'authenticated', role: 'authenticated', is_anonymous: true, app_metadata: {}, user_metadata: {} }
    const access = `${part({ alg: 'HS256', typ: 'JWT' })}.${part({ sub: USER, role: 'authenticated', is_anonymous: true, exp: now + 3600 })}.signature`
    return json(route, { access_token: access, token_type: 'bearer', expires_in: 3600, expires_at: now + 3600, refresh_token: `renewed-${now}`, user })
  })
  await page.route(/supabase\.co\/rest\/v1\//, (route) => {
    server.restCalls++
    if (server.down) return json(route, { message: 'unavailable' }, 503)
    const request = route.request()
    const table = new URL(request.url()).pathname.split('/').pop()
    const body = request.postDataJSON() as unknown
    const one = (request.headers()['accept'] ?? '').includes('vnd.pgrst.object')
    if (request.method() === 'POST' && table === 'progress') {
      for (const r of body as { building_id: string; stars: number; best_score: number; completed: boolean }[]) {
        const old = server.progress.get(r.building_id)
        server.progress.set(r.building_id, {
          stars: Math.max(old?.stars ?? 0, r.stars),
          best_score: Math.max(old?.best_score ?? 0, r.best_score),
          completed: Boolean(old?.completed || r.completed),
        })
      }
      return route.fulfill({ status: 201 })
    }
    if (request.method() === 'POST' && table === 'student_extras') {
      const r = body as Server['extras']
      for (const k of ['cards', 'badges', 'marigolds', 'pledges'] as const) server.extras[k] = [...new Set([...server.extras[k], ...r[k]])]
      return route.fulfill({ status: 201 })
    }
    if (request.method() === 'POST' && table === 'quiz_attempts') {
      server.attempts.push(...(body as Server['attempts']))
      return route.fulfill({ status: 201 })
    }
    if (table === 'progress') return json(route, [...server.progress].map(([building_id, p]) => ({ building_id, ...p })))
    if (table === 'student_extras') return json(route, one ? server.extras : [server.extras])
    return json(route, {}, 404)
  })
  return server
}

/** A saved player, as the app saves it. `inClass` adds a class and that player's class login. */
async function savedPlayer(page: Page, path: string, { inClass = true, school = false, outbox = [] as object[] } = {}) {
  await page.goto('/')
  await page.evaluate(
    ({ inClass, school, outbox }) => {
      const avatar = { skin: 'skin-4', hair: 'two-plaits', hairColor: 'black', outfit: 'salwar', outfitColor: 'peacock', headwear: 'none', headwearColor: 'navy', glasses: false, bag: false }
      const progress = school ? { school: { stars: 2, bestScore: 75, completed: true } } : {}
      const cards = school ? ['right-to-education'] : []
      const cls = inClass ? { cloud: { userId: 'child-1', refreshToken: 'saved-token' }, classInfo: { id: 'class-1', name: 'Class 6B' }, outbox } : {}
      localStorage.setItem(
        'saksham',
        JSON.stringify({
          version: 2,
          state: {
            profiles: [{ id: 'p1', firstName: 'Asha', band: 'young', createdAt: 1, avatar }],
            activeProfileId: 'p1',
            settings: {},
            demo: false,
            data: { p1: { progress, extras: { cards, badges: [], marigolds: [], pledges: [] }, ...cls } },
          },
        }),
      )
    },
    { inClass, school, outbox },
  )
  await page.goto('about:blank')
  await page.goto(`/#${path}`)
}

test('FR-12 on start, progress goes to the class, and progress saved on another device comes back', async ({ page }) => {
  const server = await fakeClassServer(page, {
    progress: new Map([['dhaba', { stars: 3, best_score: 100, completed: true }]]),
    extras: { cards: ['freedom-from-child-labour'], badges: [], marigolds: [], pledges: [] },
  })
  await savedPlayer(page, '/book', { school: true })
  await expect.poll(() => server.progress.get('school')?.stars).toBe(2)
  await expect.poll(() => server.extras.cards).toContain('right-to-education') // sent just after the progress
  // The Dhaba card, finished on another device, is now in this device's Book too.
  await expect(page.getByText(strings['book.count'].replace('{n}', '2').replace('{total}', '4'))).toBeVisible()
})

test('FR-12 every answer in a building reaches the class', async ({ page }) => {
  test.setTimeout(60_000)
  const server = await fakeClassServer(page)
  await savedPlayer(page, '/town')
  await playStory(page)
  await page.getByRole('button', { name: strings['card.flip'] }).click()
  await page.getByRole('button', { name: strings['card.toQuiz'] }).click()
  await answerQuiz(page, [true, false, true, true])
  const ids = school.games[0]!.questions.filter((q) => !q.band).map((q) => q.id)
  await expect.poll(() => server.attempts.map((a) => a.question_id)).toEqual(ids)
  expect(server.attempts.map((a) => a.correct)).toEqual([true, false, true, true])
  expect(server.attempts.every((a) => a.building_id === 'school')).toBe(true)
})

test('FR-12 when the class server can\'t be reached, nothing is lost: it is sent once the connection is back', async ({ page }) => {
  const server = await fakeClassServer(page, { down: true })
  const waiting = [{ buildingId: 'school', questionId: 'age', correct: true }]
  await savedPlayer(page, '/town', { school: true, outbox: waiting })
  await expect.poll(() => server.restCalls).toBeGreaterThan(0) // it tried
  expect(server.attempts).toHaveLength(0)
  await expect(page.getByTestId('help-button')).toBeVisible() // and the game carried on, with no error shown

  server.down = false
  await page.evaluate(() => window.dispatchEvent(new Event('online')))
  await expect.poll(() => server.attempts).toEqual([{ student_id: USER, building_id: 'school', question_id: 'age', correct: true }])
})

test('NFR-03 a player who is not in a class sends nothing', async ({ page }) => {
  const server = await fakeClassServer(page)
  await savedPlayer(page, '/book', { inClass: false, school: true })
  await expect(page.getByText(strings['book.count'].replace('{n}', '1').replace('{total}', '4'))).toBeVisible()
  await page.waitForTimeout(2500) // longer than the sync delay
  expect(server.restCalls).toBe(0)
})
