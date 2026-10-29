// Content review (BUILD_PLAN P5, FR-15, D-049): /reviewer and the "Reviewed" tick on cards.
// Supabase is answered by a fake in the browser; the real review functions are tested in
// supabase/tests/rls.test.sql. The hashes here are worked out in Node from the same content files,
// so a pass also proves the app and scripts/content-hashes.ts agree.
import { expect, test, type Page, type Route } from '@playwright/test'
import school from '../../content/scenes/school.json' with { type: 'json' }
import type { Card } from '../../content/types.ts'
import { cardText, sha256 } from '../../src/lib/review.ts'
import { seedPlayer, skipWithoutBackend, strings } from './helpers.ts'

test.beforeEach(({ page }) => skipWithoutBackend(page))

const part = (o: object) => Buffer.from(JSON.stringify(o)).toString('base64url')
const json = (route: Route, body: unknown, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) })
const SCHOOL_CARD = 'card:right-to-education:en'

async function fakeReviewServer(page: Page, roles: string[]) {
  const rows = new Map<string, { status: string; content_hash: string; reviewer_note: string | null }>()
  await page.route(/supabase\.co\/auth\/v1\//, (route) => {
    const now = Math.floor(Date.now() / 1000)
    const user = { id: 'r1', email: 'reviewer@example.test', aud: 'authenticated', role: 'authenticated', is_anonymous: false, app_metadata: {}, user_metadata: {} }
    return json(route, { access_token: `${part({ alg: 'HS256' })}.${part({ sub: 'r1', exp: now + 3600 })}.x`, token_type: 'bearer', expires_in: 3600, expires_at: now + 3600, refresh_token: 'r', user })
  })
  await page.route(/supabase\.co\/rest\/v1\//, (route) => {
    const request = route.request()
    const name = new URL(request.url()).pathname.split('/').pop()
    const body = request.postDataJSON() as Record<string, string> | null
    if (name === 'user_roles') return json(route, roles.map((role) => ({ role })))
    if (name === 'content_items') return json(route, [...rows].map(([id, r]) => ({ id, ...r })))
    if (name === 'submit_content_for_review') {
      rows.set(body!.item!, { status: 'in_review', content_hash: body!.hash!, reviewer_note: null })
      return route.fulfill({ status: 204 })
    }
    if (name === 'review_content') {
      const row = rows.get(body!.item!)!
      rows.set(body!.item!, { ...row, status: body!.decision!, reviewer_note: body!.note ?? null })
      return route.fulfill({ status: 204 })
    }
    return json(route, [])
  })
  return rows
}

async function signIn(page: Page) {
  await page.goto('/#/reviewer')
  await page.getByLabel(strings['teacher.email']).fill('reviewer@example.test')
  await page.getByLabel(strings['teacher.password']).fill('a-long-password')
  await page.getByRole('button', { name: strings['teacher.signIn'] }).last().click()
}

test('FR-15 an account that isn\'t a reviewer is told so, and can\'t see the queue', async ({ page }) => {
  await fakeReviewServer(page, ['teacher'])
  await signIn(page)
  await expect(page.getByText(strings['reviewer.notReviewer'].replace('{email}', 'reviewer@example.test'))).toBeVisible()
  await expect(page.getByRole('button', { name: strings['reviewer.send'] })).toHaveCount(0)
})

test('FR-15 a reviewer sends the content, reads it next to its hash, and publishes, rejects or sends it back', async ({ page }) => {
  const rows = await fakeReviewServer(page, ['teacher', 'reviewer'])
  await signIn(page)
  await page.getByRole('button', { name: strings['reviewer.send'] }).click()
  await expect(page.getByText(strings['reviewer.sent'].replace('{n}', '18'))).toBeVisible()

  // The hash the app shows is the one Node works out from the same card.
  const expected = await sha256(cardText(school.card as Card))
  expect(rows.get(SCHOOL_CARD)?.content_hash).toBe(expected)
  const card = page.getByRole('listitem').filter({ hasText: SCHOOL_CARD })
  await expect(card).toContainText(expected)
  await card.getByText(strings['reviewer.read']).click()
  await expect(card.locator('pre')).toContainText(school.card.law.split('\n')[0]!.slice(0, 40))

  await card.getByRole('button', { name: strings['reviewer.publish'] }).click()
  await expect(card).toContainText(strings['reviewer.published'])
  expect(rows.get(SCHOOL_CARD)?.status).toBe('published')

  const quiz = page.getByRole('listitem').filter({ hasText: 'quiz:school:en' })
  await quiz.getByRole('button', { name: strings['reviewer.reject'] }).click()
  await quiz.getByLabel(strings['reviewer.noteLabel']).fill('Question 2 needs a source.')
  await quiz.getByRole('button', { name: strings['reviewer.rejectYes'] }).click()
  await expect(quiz).toContainText(strings['reviewer.note'].replace('{note}', 'Question 2 needs a source.'))

  await card.getByRole('button', { name: strings['reviewer.sendBack'] }).click()
  await expect(card).toContainText(strings['reviewer.inReview'])

  await page.getByRole('button', { name: strings['reviewer.send'] }).click()
  await expect(page.getByText(strings['reviewer.nothingNew'])).toBeVisible()
})

test('FR-16 a card shows "Reviewed" only when its exact text was published', async ({ page }) => {
  const hash = await sha256(cardText(school.card as Card))
  let published = [{ id: SCHOOL_CARD, content_hash: hash, reviewed_at: '2026-10-18T10:00:00Z' }]
  await page.route(/supabase\.co\/rest\/v1\/rpc\/published_content/, (route) => json(route, published))
  await seedPlayer(page, '/book', { school: true })
  await page.getByRole('button', { name: new RegExp(`^${strings['book.read']}.*${school.card.title}`) }).click()
  await expect(page.getByText(strings['card.reviewedOn'].replace('{date}', '18 October 2026'))).toBeVisible()

  // A different text (the card changed after it was reviewed): no tick, and the card is still there.
  published = [{ id: SCHOOL_CARD, content_hash: 'f'.repeat(64), reviewed_at: '2026-10-18T10:00:00Z' }]
  await page.reload()
  await page.getByRole('button', { name: new RegExp(`^${strings['book.read']}.*${school.card.title}`) }).click()
  await expect(page.locator('blockquote')).toHaveText(school.card.law)
  await expect(page.getByText(strings['card.reviewed'], { exact: false })).toHaveCount(0)
})
