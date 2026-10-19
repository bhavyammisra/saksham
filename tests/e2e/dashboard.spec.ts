// The live teacher dashboard and the real Class Mission (BUILD_PLAN P5, FR-14, D-047).
// Supabase is answered by a fake in the browser, table by table, so no real accounts are made.
// The real views and the class-total function are tested in supabase/tests/rls.test.sql.
import { expect, test, type Page, type Route } from '@playwright/test'
import school from '../../content/scenes/school.json' with { type: 'json' }
import { skipWithoutBackend, strings } from './helpers.ts'

const part = (o: object) => Buffer.from(JSON.stringify(o)).toString('base64url')
function session(userId: string, anonymous: boolean) {
  const now = Math.floor(Date.now() / 1000)
  const user = { id: userId, email: anonymous ? undefined : 'teacher@example.test', aud: 'authenticated', role: 'authenticated', is_anonymous: anonymous, app_metadata: {}, user_metadata: {} }
  const access = `${part({ alg: 'HS256', typ: 'JWT' })}.${part({ sub: userId, role: 'authenticated', is_anonymous: anonymous, exp: now + 3600 })}.signature`
  return { access_token: access, token_type: 'bearer', expires_in: 3600, expires_at: now + 3600, refresh_token: `refresh-${userId}`, user }
}
const json = (route: Route, body: unknown, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) })

const MISTAKE = school.games[0]!.questions[1]!

/** A class with two students, Asha and Ravi. Returns the data, so a test can change it and check what was removed. */
async function fakeClass(page: Page) {
  const db = {
    students: [
      { id: 's1', first_name: 'Asha' },
      { id: 's2', first_name: 'Ravi' },
    ],
    progress: [
      { student_id: 's1', building_id: 'school', stars: 3 },
      { student_id: 's1', building_id: 'dhaba', stars: 2 },
      { student_id: 's2', building_id: 'school', stars: 1 },
    ],
    mission: { total_stars: 6, mission_target: 20 },
  }
  await page.route(/supabase\.co\/auth\/v1\//, (route) => json(route, session('teacher-1', false)))
  await page.route(/supabase\.co\/rest\/v1\//, (route) => {
    const request = route.request()
    const url = new URL(request.url())
    const table = url.pathname.split('/').pop()
    if (request.method() === 'DELETE' && table === 'students') {
      const id = url.searchParams.get('id')?.replace('eq.', '')
      db.students = db.students.filter((s) => s.id !== id)
      db.progress = db.progress.filter((p) => p.student_id !== id)
      return route.fulfill({ status: 204 })
    }
    const one = (request.headers()['accept'] ?? '').includes('vnd.pgrst.object')
    switch (table) {
      case 'classes':
        return json(route, [{ id: 'c1', name: 'Class 6B', join_code: 'ABC234', code_active: true }])
      case 'students':
        return json(route, db.students)
      case 'progress':
        return json(route, db.progress)
      case 'class_progress_summary':
        return json(route, [
          { building_id: 'school', average_stars: 2, completed_count: db.students.length },
          { building_id: 'dhaba', average_stars: 2, completed_count: 1 },
        ])
      case 'class_question_stats':
        return json(route, [{ building_id: 'school', question_id: MISTAKE.id, answered: 2, wrong: 1 }])
      case 'class_mission':
        return json(route, one ? db.mission : [db.mission])
      default:
        return json(route, [], 200)
    }
  })
  return db
}

async function openDashboard(page: Page) {
  await skipWithoutBackend(page)
  await page.getByLabel(strings['teacher.email']).fill('teacher@example.test')
  await page.getByLabel(strings['teacher.password']).fill('a-long-password')
  await page.getByRole('button', { name: strings['teacher.signIn'] }).last().click()
  await page.getByRole('button', { name: strings['dashboard.show'] }).click()
}

const missionText = (n: number) => strings['community.missionProgress'].replace('{n}', String(n)).replace('{target}', '20')

test('FR-14 the dashboard shows stars by place, class averages, questions to talk about and the class mission', async ({ page }) => {
  await fakeClass(page)
  await openDashboard(page)
  const table = page.getByRole('table', { name: strings['dashboard.progress'] })
  const asha = table.getByRole('row', { name: /^Asha/ })
  await expect(asha.getByRole('cell').nth(0)).toContainText(strings['results.stars'].replace('{n}', '3'))
  await expect(asha.getByRole('cell').nth(1)).toContainText(strings['results.stars'].replace('{n}', '2'))
  await expect(asha.getByRole('cell').nth(2)).toContainText(strings['dashboard.notStarted'])
  await expect(table.getByRole('row', { name: new RegExp(`^${strings['dashboard.average']}`) })).toContainText(
    strings['dashboard.averageCell'].replace('{stars}', '2.0').replace('{done}', '2'),
  )
  // The question's words come from content, with how many got it wrong the first time.
  await expect(page.locator('ol > li').filter({ hasText: MISTAKE.text })).toContainText(strings['dashboard.wrongCount'].replace('{wrong}', '1').replace('{answered}', '2'))
  await expect(page.getByText(missionText(6))).toBeVisible()
})

test('FR-14 removing a student asks once more, and only that student goes', async ({ page }) => {
  const db = await fakeClass(page)
  await openDashboard(page)
  await page.getByRole('button', { name: strings['dashboard.removeName'].replace('{name}', 'Ravi') }).click()
  await page.getByRole('button', { name: strings['dashboard.removeNo'] }).click()
  expect(db.students).toHaveLength(2)
  await page.getByRole('button', { name: strings['dashboard.removeName'].replace('{name}', 'Ravi') }).click()
  await page.getByRole('button', { name: strings['dashboard.removeYes'].replace('{name}', 'Ravi') }).click()
  await expect(page.getByRole('row', { name: /^Ravi/ })).toHaveCount(0)
  await expect(page.getByRole('row', { name: /^Asha/ })).toBeVisible()
  expect(db.students.map((s) => s.first_name)).toEqual(['Asha'])
})

test('FR-14 the dashboard updates every 30 seconds, and at once with Refresh', async ({ page }) => {
  await page.clock.install()
  const db = await fakeClass(page)
  await openDashboard(page)
  await expect(page.getByText(missionText(6))).toBeVisible()

  db.mission.total_stars = 9
  await page.clock.fastForward(31_000)
  await expect(page.getByText(missionText(9))).toBeVisible()

  db.mission.total_stars = 11
  await page.getByRole('button', { name: strings['dashboard.refresh'] }).click()
  await expect(page.getByText(missionText(11))).toBeVisible()
})

test('FR-10 a player in a class sees the real class total on Community, with no Sample label', async ({ page }) => {
  await page.route(/supabase\.co\/auth\/v1\//, (route) => json(route, session('child-1', true)))
  await page.route(/supabase\.co\/rest\/v1\/rpc\/my_class_mission/, (route) => json(route, [{ class_name: 'Class 6B', mission_target: 30, total_stars: 14 }]))
  await page.route(/supabase\.co\/rest\/v1\/(?!rpc)/, (route) => route.fulfill({ status: 201 })) // background sync: not checked here
  await skipWithoutBackend(page)
  await page.goto('/')
  await page.evaluate(() => {
    const avatar = { skin: 'skin-4', hair: 'two-plaits', hairColor: 'black', outfit: 'salwar', outfitColor: 'peacock', headwear: 'none', headwearColor: 'navy', glasses: false, bag: false }
    const data = { progress: {}, extras: { cards: [], badges: [], marigolds: [], pledges: [] }, cloud: { userId: 'child-1', refreshToken: 'saved' }, classInfo: { id: 'c1', name: 'Class 6B' } }
    localStorage.setItem('saksham', JSON.stringify({ version: 2, state: { profiles: [{ id: 'p1', firstName: 'Asha', band: 'young', createdAt: 1, avatar }], activeProfileId: 'p1', settings: {}, demo: false, data: { p1: data } } }))
  })
  await page.goto('about:blank')
  await page.goto('/#/community')
  const mission = page.getByRole('region', { name: strings['community.mission'] })
  await expect(mission).toContainText(strings['community.classGoal'].replace('{name}', 'Class 6B').replace('{target}', '30'))
  await expect(mission).toContainText(strings['community.missionProgress'].replace('{n}', '14').replace('{target}', '30'))
  await expect(mission).not.toContainText(strings['community.sample'])
})
