import { expect, test } from '@playwright/test'
import { createPlayer, strings } from './helpers.ts'

test('FR-01 a new player gives a first name and age band and arrives in the town', async ({ page }) => {
  await createPlayer(page, '  Asha  ')
  // The cleaned name is saved, with the band and character, and nothing else personal.
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('saksham') ?? '{}').state)
  expect(saved.profiles).toHaveLength(1)
  expect(saved.profiles[0]).toMatchObject({ firstName: 'Asha', band: 'young' })
  expect(Object.keys(saved.profiles[0]).sort()).toEqual(['avatar', 'band', 'createdAt', 'firstName', 'id'])
})

test('FR-01 the player is remembered: the title menu offers to continue', async ({ page }) => {
  await createPlayer(page, 'Ravi', 'teen')
  await page.goto('/')
  await expect(page.getByText(strings['title.continueAs'].replace('{name}', 'Ravi'))).toBeVisible()
  await page.getByRole('button', { name: new RegExp(strings['title.continue']) }).click()
  await expect(page).toHaveURL(/#\/town$/)
})

test('FR-01 the age is asked under the name, and is needed before the character', async ({ page }) => {
  await page.goto('/#/onboarding')
  await page.getByLabel(strings['onboarding.nameLabel']).fill('Meera')
  await page.getByRole('button', { name: strings['onboarding.next'] }).click()
  await expect(page.getByRole('alert')).toHaveText(strings['onboarding.bandError'])
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(strings['onboarding.nameTitle'])

  await page.getByRole('button', { name: strings['onboarding.bandTeen'] }).click()
  await page.getByRole('button', { name: strings['onboarding.next'] }).click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(strings['builder.title'])
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

test('FR-01 the character builder: choices change the preview, and the character is saved', async ({ page }) => {
  await page.goto('/#/onboarding')
  await page.getByLabel(strings['onboarding.nameLabel']).fill('Asha')
  await page.getByRole('button', { name: strings['onboarding.bandYoung'] }).click()
  await page.getByRole('button', { name: strings['onboarding.next'] }).click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(strings['builder.title'])

  // Boy or girl first: it decides which hairstyles are offered.
  await page.getByRole('button', { name: strings['gender.girl'] }).click()
  await expect(page.getByRole('button', { name: strings['gender.girl'] })).toHaveAttribute('aria-pressed', 'true')
  // Parts are grouped in tabs, like a game's character customiser.
  await page.getByRole('tab', { name: strings['builder.hair'] }).click()
  await page.getByRole('button', { name: strings['hair.longCurly'] }).click()
  await expect(page.getByRole('button', { name: strings['hair.longCurly'] })).toHaveAttribute('aria-pressed', 'true')
  await page.getByRole('tab', { name: strings['builder.top'] }).click()
  await page.getByRole('button', { name: strings['outfit.hoodie'] }).click()
  await page.getByRole('tab', { name: strings['builder.bottom'] }).click()
  await page.getByRole('button', { name: strings['bottom.joggers'] }).click()
  await page.getByRole('tab', { name: strings['builder.skin'] }).click()
  await page.getByRole('button', { name: strings['builder.skin8'], exact: true }).click()
  await page.getByRole('tab', { name: strings['builder.extras'] }).click()
  await page.getByRole('group', { name: strings['builder.glasses'] }).getByRole('button', { name: strings['builder.yes'] }).click()
  await page.getByRole('button', { name: strings['builder.done'] }).click()

  await expect(page).toHaveURL(/#\/town$/)
  const avatar = await page.evaluate(() => JSON.parse(localStorage.getItem('saksham') ?? '{}').state.profiles[0].avatar)
  expect(avatar).toMatchObject({ gender: 'girl', hair: 'long-curly', outfit: 'hoodie', bottom: 'joggers', skin: 'skin-8', glasses: true })
})

test('FR-01 the character can be changed later from Me', async ({ page }) => {
  await createPlayer(page, 'Ravi', 'teen')
  await page.goto('/#/me')
  await page.getByRole('link', { name: strings['me.changeCharacter'] }).click()
  await page.getByRole('tab', { name: strings['builder.extras'] }).click()
  await page.getByRole('button', { name: strings['headwear.patka'] }).click()
  await page.getByRole('button', { name: strings['builder.done'] }).click()
  await expect(page).toHaveURL(/#\/me$/)
  const headwear = await page.evaluate(() => JSON.parse(localStorage.getItem('saksham') ?? '{}').state.profiles[0].avatar.headwear)
  expect(headwear).toBe('patka')
})

test('the builder tabs can be used with the arrow keys', async ({ page }) => {
  await createPlayer(page, 'Ravi')
  await page.goto('/#/me/character')
  await page.getByRole('tab', { name: strings['builder.skin'] }).focus()
  await page.keyboard.press('ArrowRight')
  await expect(page.getByRole('tab', { name: strings['builder.hair'] })).toBeFocused()
  await expect(page.getByRole('tab', { name: strings['builder.hair'] })).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByRole('group', { name: strings['builder.style'] })).toBeVisible()
})
