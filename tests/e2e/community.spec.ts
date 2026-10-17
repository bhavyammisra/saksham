// Community (BUILD_PLAN P4, D-042): Pledge Wall, Class Mission, Ask an Expert, Places that help.
import { expect, test } from '@playwright/test'
import community from '../../content/community.json' with { type: 'json' }
import { seedPlayer, strings } from './helpers.ts'

test('FR-10 a preset pledge is saved for this player and survives a reload', async ({ page }) => {
  await seedPlayer(page, '/community')
  const pledge = community.pledges[0]!
  await page.getByRole('button', { name: `${strings['community.pledge']}: ${pledge.text}` }).click()
  await page.reload()
  await expect(page.getByRole('listitem').filter({ hasText: pledge.text })).toContainText(strings['community.pledged'])
  // Pledges are presets only: there is no box to write your own.
  await expect(page.getByRole('region', { name: strings['community.pledges'] }).getByRole('textbox')).toHaveCount(0)
})

test('FR-10 the Class Mission is cooperative and labelled Sample', async ({ page }) => {
  await seedPlayer(page, '/community', { school: true }) // 2 stars at the School
  const mission = page.getByRole('region', { name: strings['community.mission'] })
  await expect(mission).toContainText(strings['community.sample'])
  await expect(mission).toContainText(community.mission.goal)
  await expect(mission).toContainText(strings['community.missionProgress'].replace('{n}', '2').replace('{target}', String(community.mission.target)))
  await expect(mission).not.toContainText('Asha') // no names: nobody is compared
})

test('NFR-01 an Ask an Expert question stays with the player who wrote it', async ({ page }) => {
  await seedPlayer(page, '/community')
  const ask = page.getByRole('region', { name: strings['community.ask'] })
  await ask.getByRole('button', { name: strings['community.askSave'] }).click()
  await expect(ask.getByText(strings['community.askError'].replace('{max}', '280'))).toBeVisible()
  await ask.getByLabel(strings['community.askLabel']).fill('Can a school ask for a birth certificate?')
  await ask.getByRole('button', { name: strings['community.askSave'] }).click()
  await expect(ask.getByText(strings['community.askSaved'])).toBeVisible()
  await expect(ask.getByRole('listitem')).toHaveText(/Can a school ask for a birth certificate\?/)
  await expect(ask.getByRole('link', { name: strings['community.askDangerLink'] })).toHaveAttribute('href', '#/help')

  // Another player on the same device never sees it.
  await page.goto('/#/onboarding')
  await page.getByLabel(strings['onboarding.nameLabel']).fill('Ravi')
  await page.getByRole('button', { name: strings['onboarding.bandTeen'] }).click()
  await page.getByRole('button', { name: strings['onboarding.next'] }).click()
  await page.getByRole('button', { name: strings['builder.done'] }).click()
  await page.goto('/#/community')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(strings['community.title'])
  await expect(page.getByText('Can a school ask for a birth certificate?')).toHaveCount(0)

  // Back as Asha, the question is there and can be removed.
  await page.goto('/#/profiles')
  await page.getByRole('button', { name: /Asha/ }).first().click()
  await page.goto('/#/community')
  await page.getByRole('button', { name: `${strings['community.askRemove']}: Can a school ask for a birth certificate?` }).click()
  await expect(page.getByText('Can a school ask for a birth certificate?')).toHaveCount(0)
})

test('FR-10 Places that help are listed exactly as written', async ({ page }) => {
  await seedPlayer(page, '/community')
  const places = page.getByRole('region', { name: strings['community.places'] })
  for (const p of community.places) await expect(places.getByText(p.what, { exact: true })).toBeVisible()
})
