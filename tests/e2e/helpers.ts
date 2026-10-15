import { expect, type Page } from '@playwright/test'
import strings from '../../content/strings.en.json' with { type: 'json' }

export { strings }

/** Goes through onboarding (name, band, character) as a new player and lands in the town. */
export async function createPlayer(page: Page, name: string, band: 'young' | 'teen' = 'young') {
  await page.goto('/#/onboarding')
  await page.getByRole('button', { name: strings['onboarding.start'] }).click()
  await page.getByLabel(strings['onboarding.nameLabel']).fill(name)
  await page.getByRole('button', { name: strings['onboarding.next'] }).click()
  const label = band === 'young' ? strings['onboarding.bandYoung'] : strings['onboarding.bandTeen']
  await page.getByRole('button', { name: label }).click()
  await page.getByRole('button', { name: strings['builder.done'] }).click()
  await expect(page).toHaveURL(/#\/town$/)
}
