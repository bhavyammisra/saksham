import { expect, test } from '@playwright/test'
import { createPlayer, strings } from './helpers.ts'

test('FR-01 a new player gives a first name and age band and arrives in the town', async ({ page }) => {
  await createPlayer(page, '  Asha  ')
  // The cleaned name is saved, along with the band, and nothing else personal.
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('saksham') ?? '{}').state)
  expect(saved.profiles).toHaveLength(1)
  expect(saved.profiles[0]).toMatchObject({ firstName: 'Asha', band: 'young' })
  expect(Object.keys(saved.profiles[0]).sort()).toEqual(['band', 'createdAt', 'firstName', 'id'])
})

test('FR-01 the player is remembered after a reload', async ({ page }) => {
  await createPlayer(page, 'Ravi', 'teen')
  await page.goto('/')
  await expect(page).toHaveURL(/#\/town$/)
})

test('FR-01 the band question uses the name just given', async ({ page }) => {
  await page.goto('/#/onboarding')
  await page.getByRole('button', { name: strings['onboarding.start'] }).click()
  await page.getByLabel(strings['onboarding.nameLabel']).fill('Meera')
  await page.getByRole('button', { name: strings['onboarding.next'] }).click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    strings['onboarding.bandTitle'].replace('{name}', 'Meera'),
  )
  await expect(page.getByRole('heading', { level: 1 })).toBeFocused()
})

test('two players on one device can switch from the profile picker', async ({ page }) => {
  await createPlayer(page, 'Asha')
  await page.goto('/#/profiles')
  await page.getByRole('button', { name: strings['profiles.new'] }).click()
  await createPlayer(page, 'Ravi', 'teen')

  await page.goto('/#/profiles')
  await page.getByRole('button', { name: strings['profiles.playAs'].replace('{name}', 'Asha') }).click()
  await expect(page).toHaveURL(/#\/town$/)
  const activeName = await page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem('saksham') ?? '{}').state
    return s.profiles.find((p: { id: string }) => p.id === s.activeProfileId)?.firstName
  })
  expect(activeName).toBe('Asha')
})
