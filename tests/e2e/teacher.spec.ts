// The teacher side (BUILD_PLAN P5, FR-13, D-044): sign up, sign in and out, and classes with join codes.
// The real Supabase project is never touched: the browser's requests to it are answered by a small
// fake below, so these tests need no accounts and work in CI. The database's own rules are tested
// separately, against the real project (supabase/tests/rls.test.sql).
import { expect, test, type Page, type Route } from '@playwright/test'
import { strings } from './helpers.ts'

const PASSWORD = 'right-password'
const USER = { id: '00000000-0000-0000-0000-0000000000a1', email: 'teacher@example.test', aud: 'authenticated', role: 'authenticated', is_anonymous: false, app_metadata: {}, user_metadata: {}, created_at: '2026-10-18T00:00:00Z' }

/** A well-formed (unsigned) token, so the client can read its expiry like a real one. */
function token() {
  const part = (o: object) => Buffer.from(JSON.stringify(o)).toString('base64url')
  const now = Math.floor(Date.now() / 1000)
  return `${part({ alg: 'HS256', typ: 'JWT' })}.${part({ sub: USER.id, role: 'authenticated', aud: 'authenticated', exp: now + 3600, iat: now })}.signature`
}

/** Answers the app's Supabase requests from memory. Returns the classes it holds, to check against. */
async function fakeSupabase(page: Page) {
  const classes: { id: string; name: string; join_code: string; code_active: boolean; created_at: string }[] = []
  let next = 1
  const json = (route: Route, body: unknown, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) })

  await page.route(/supabase\.co\/auth\/v1\//, async (route) => {
    const url = new URL(route.request().url())
    const body = route.request().postDataJSON() as { password?: string } | null
    if (url.pathname.endsWith('/token')) {
      if (body?.password !== PASSWORD) return json(route, { code: 400, error_code: 'invalid_credentials', msg: 'Invalid login credentials' }, 400)
      const now = Math.floor(Date.now() / 1000)
      return json(route, { access_token: token(), token_type: 'bearer', expires_in: 3600, expires_at: now + 3600, refresh_token: 'refresh', user: USER })
    }
    if (url.pathname.endsWith('/signup')) return json(route, { ...USER, email: 'new@example.test', confirmation_sent_at: '2026-10-18T00:00:00Z' })
    if (url.pathname.endsWith('/logout')) return route.fulfill({ status: 204 })
    if (url.pathname.endsWith('/user')) return json(route, USER)
    return json(route, {}, 404)
  })

  await page.route(/supabase\.co\/rest\/v1\//, async (route) => {
    const request = route.request()
    const url = new URL(request.url())
    const id = url.searchParams.get('id')?.replace('eq.', '')
    const body = request.postDataJSON() as Record<string, unknown> | null
    if (url.pathname.endsWith('/rpc/rotate_join_code')) {
      const c = classes.find((x) => x.id === body?.class)!
      c.join_code = 'XYZ789'
      return json(route, c.join_code)
    }
    if (url.pathname.endsWith('/rpc/delete_class')) {
      classes.splice(classes.findIndex((x) => x.id === body?.class), 1)
      return route.fulfill({ status: 204 })
    }
    if (request.method() === 'GET') return json(route, classes)
    if (request.method() === 'POST') {
      classes.push({ id: `class-${next}`, name: String(body?.name), join_code: `ABC23${next}`, code_active: true, created_at: `2026-10-18T00:00:0${next}Z` })
      next++
      return route.fulfill({ status: 201 })
    }
    if (request.method() === 'PATCH') {
      Object.assign(classes.find((x) => x.id === id)!, body)
      return route.fulfill({ status: 204 })
    }
    return json(route, {}, 404)
  })
  return classes
}

/** These tests need a build with the Supabase settings (CI and .env.local have them); skip otherwise. */
const skipIfOffline = async (page: Page) => {
  test.skip(await page.getByText(strings['teacher.offline']).isVisible(), 'built without Supabase settings')
}

const signIn = async (page: Page, password = PASSWORD) => {
  await page.getByLabel(strings['teacher.email']).fill(USER.email)
  await page.getByLabel(strings['teacher.password']).fill(password)
  await page.getByRole('button', { name: strings['teacher.signIn'] }).last().click()
}

test('FR-13 a teacher signs up, then signs in; a wrong password says so', async ({ page }) => {
  await fakeSupabase(page)
  await page.goto('/')
  await page.getByRole('link', { name: strings['title.forTeachers'] }).click()
  await expect(page).toHaveURL(/#\/teacher$/)
  await skipIfOffline(page)
  await expect(page.getByTestId('help-button')).toBeVisible()

  await page.getByRole('button', { name: strings['teacher.signUp'] }).click()
  await page.getByLabel(strings['teacher.email']).fill('new@example.test')
  await page.getByLabel(strings['teacher.password']).fill('a-long-password')
  await page.getByRole('button', { name: strings['teacher.createAccount'] }).click()
  await expect(page.getByText(strings['teacher.checkEmail'])).toBeVisible()

  await page.getByRole('button', { name: strings['teacher.signIn'] }).first().click()
  await signIn(page, 'wrong-password')
  await expect(page.getByText(strings['teacher.errorCredentials'])).toBeVisible()
  await signIn(page)
  await expect(page.getByText(strings['teacher.signedInAs'].replace('{email}', USER.email))).toBeVisible()
  await expect(page.getByText(strings['teacher.noClasses'])).toBeVisible()

  await page.getByRole('button', { name: strings['teacher.signOut'] }).click()
  await expect(page.getByLabel(strings['teacher.password'])).toBeVisible()
})

test.describe('FR-13 classes', () => {
  test.use({ permissions: ['clipboard-read', 'clipboard-write'] })

  test('create, rename, copy the code, turn it off, get a new code, and delete', async ({ page }) => {
    const classes = await fakeSupabase(page)
    await page.goto('/#/teacher')
    await skipIfOffline(page)
    await signIn(page)

    await page.getByLabel(strings['teacher.newClass']).fill('Class 6B')
    await page.getByRole('button', { name: strings['teacher.create'] }).click()
    const card = page.getByRole('listitem').filter({ hasText: 'ABC231' })
    // The code is shown large and read out letter by letter.
    await expect(card.getByLabel('A B C 2 3 1')).toBeVisible()
    await expect(card.getByText(strings['teacher.codeOn'])).toBeVisible()

    await card.getByLabel(strings['teacher.className']).fill('Class 6B (Hindi)')
    await card.getByRole('button', { name: strings['teacher.rename'] }).click()
    await expect.poll(() => classes[0]?.name).toBe('Class 6B (Hindi)')

    await card.getByRole('button', { name: strings['teacher.copy'] }).click()
    await expect(card.getByRole('button', { name: strings['teacher.copied'] })).toBeVisible()
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('ABC231')

    await card.getByRole('button', { name: strings['teacher.turnOff'] }).click()
    await expect(card.getByText(strings['teacher.codeOff'])).toBeVisible()
    await card.getByRole('button', { name: strings['teacher.turnOn'] }).click()
    await expect(card.getByText(strings['teacher.codeOn'])).toBeVisible()

    await card.getByRole('button', { name: strings['teacher.newCode'] }).click()
    const renewed = page.getByRole('listitem').filter({ hasText: 'XYZ789' })
    await expect(renewed).toBeVisible()

    // Deleting asks once more first.
    await renewed.getByRole('button', { name: strings['teacher.delete'] }).click()
    await renewed.getByRole('button', { name: strings['teacher.deleteNo'] }).click()
    await expect(renewed).toBeVisible()
    await renewed.getByRole('button', { name: strings['teacher.delete'] }).click()
    await renewed.getByRole('button', { name: strings['teacher.deleteYes'].replace('{name}', 'Class 6B (Hindi)') }).click()
    await expect(page.getByText(strings['teacher.noClasses'])).toBeVisible()
    expect(classes).toHaveLength(0)
  })
})
