// Children joining and leaving a class (BUILD_PLAN P5, FR-11, D-045).
// As in teacher.spec.ts, the app's requests to Supabase are answered by a fake in the browser,
// so no real accounts are made. The real join_class rules are tested in supabase/tests/rls.test.sql.
import { expect, test, type Page, type Route } from '@playwright/test'
import { seedPlayer, skipWithoutBackend, strings } from './helpers.ts'

// The class features only exist in a build with the Supabase settings.
test.beforeEach(({ page }) => skipWithoutBackend(page))

const CODE = 'ABC234'
const CLASS = 'Class 6B'

const part = (o: object) => Buffer.from(JSON.stringify(o)).toString('base64url')
const subOf = (header: string | undefined) => {
  const payload = header?.replace('Bearer ', '').split('.')[1]
  return payload ? (JSON.parse(Buffer.from(payload, 'base64url').toString()) as { sub?: string }).sub : undefined
}

/** Answers anonymous sign-ins, login renewals and the two RPCs. Returns who is in the class, by user id. */
async function fakeClassServer(page: Page) {
  const members = new Map<string, string>() // user id -> first name
  const tokens = new Map<string, string>() // refresh token -> user id
  let users = 0
  const json = (route: Route, body: unknown, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) })
  const session = (userId: string) => {
    const now = Math.floor(Date.now() / 1000)
    const refresh = `refresh-${userId}-${tokens.size}`
    tokens.set(refresh, userId)
    const user = { id: userId, aud: 'authenticated', role: 'authenticated', is_anonymous: true, app_metadata: {}, user_metadata: {}, created_at: '2026-10-18T00:00:00Z' }
    const access = `${part({ alg: 'HS256', typ: 'JWT' })}.${part({ sub: userId, role: 'authenticated', is_anonymous: true, exp: now + 3600 })}.signature`
    return { access_token: access, token_type: 'bearer', expires_in: 3600, expires_at: now + 3600, refresh_token: refresh, user }
  }

  await page.route(/supabase\.co\/auth\/v1\//, async (route) => {
    const url = new URL(route.request().url())
    if (url.pathname.endsWith('/signup')) return json(route, session(`child-${++users}`))
    if (url.pathname.endsWith('/token')) {
      const userId = tokens.get((route.request().postDataJSON() as { refresh_token: string }).refresh_token)
      return userId ? json(route, session(userId)) : json(route, { code: 400, error_code: 'refresh_token_not_found', msg: 'Invalid Refresh Token' }, 400)
    }
    return json(route, {}, 404)
  })
  await page.route(/supabase\.co\/rest\/v1\/rpc\//, async (route) => {
    const request = route.request()
    const userId = subOf(request.headers()['authorization'])!
    if (request.url().endsWith('/join_class')) {
      const body = request.postDataJSON() as { code: string; first_name: string }
      if (body.code !== CODE) return json(route, { code: 'P0002', message: 'unknown or inactive code', details: null, hint: null }, 404)
      members.set(userId, body.first_name)
      return json(route, [{ class_id: 'class-1', class_name: CLASS }])
    }
    members.delete(userId) // leave_class
    return route.fulfill({ status: 204 })
  })
  return members
}

const classSection = (page: Page) => page.getByRole('region', { name: strings['class.title'] })
const join = async (page: Page, code: string) => {
  await classSection(page).getByLabel(strings['class.code']).fill(code)
  await classSection(page).getByRole('button', { name: strings['class.join'] }).click()
}

test('FR-11 a child joins with their teacher\'s code, keeps it after a reload, and can leave', async ({ page }) => {
  const members = await fakeClassServer(page)
  await seedPlayer(page, '/me')
  await expect(classSection(page)).toContainText(strings['class.hint'].replace('{name}', 'Asha'))

  await join(page, 'zzz999')
  await expect(page.getByText(strings['class.problemCode'])).toBeVisible()
  await join(page, CODE.toLowerCase()) // typed in lower case: the box makes it capitals
  await expect(classSection(page)).toContainText(strings['class.inClass'].replace('{name}', CLASS))
  expect([...members.values()]).toEqual(['Asha'])

  await page.reload()
  await expect(classSection(page)).toContainText(strings['class.inClass'].replace('{name}', CLASS))

  // Leaving asks once more, and the game keeps everything.
  await classSection(page).getByRole('button', { name: strings['class.leave'] }).click()
  await expect(classSection(page)).toContainText(strings['class.leaveNote'])
  await classSection(page).getByRole('button', { name: strings['class.leaveYes'] }).click()
  await expect(classSection(page).getByLabel(strings['class.code'])).toBeVisible()
  expect(members.size).toBe(0)
})

test('FR-11 two players on one device are two different students', async ({ page }) => {
  const members = await fakeClassServer(page)
  await seedPlayer(page, '/me')
  await join(page, CODE)
  await expect(classSection(page)).toContainText(CLASS)

  // A second player on the same device joins as themselves.
  await page.goto('/#/onboarding')
  await page.getByLabel(strings['onboarding.nameLabel']).fill('Ravi')
  await page.getByRole('button', { name: strings['onboarding.bandTeen'] }).click()
  await page.getByRole('button', { name: strings['onboarding.next'] }).click()
  await page.getByRole('button', { name: strings['builder.done'] }).click()
  await page.goto('/#/me')
  await expect(classSection(page).getByLabel(strings['class.code'])).toBeVisible() // Asha's class isn't Ravi's
  await join(page, CODE)
  await expect(classSection(page)).toContainText(CLASS)
  expect([...members.values()].sort()).toEqual(['Asha', 'Ravi'])

  // Back as Asha, leaving uses Asha's own login: Ravi stays in the class.
  await page.goto('/#/profiles')
  await page.getByRole('button', { name: /Asha/ }).first().click()
  await page.goto('/#/me')
  await classSection(page).getByRole('button', { name: strings['class.leave'] }).click()
  await classSection(page).getByRole('button', { name: strings['class.leaveYes'] }).click()
  await expect(classSection(page).getByLabel(strings['class.code'])).toBeVisible()
  expect([...members.values()]).toEqual(['Ravi'])
})

test('FR-11 with no connection, joining says so calmly and the game carries on', async ({ page, context }) => {
  await fakeClassServer(page)
  await seedPlayer(page, '/me')
  await context.setOffline(true)
  await join(page, CODE)
  await expect(page.getByText(strings['class.problemOffline'])).toBeVisible()
  await context.setOffline(false)
})
