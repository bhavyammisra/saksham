import { describe, expect, it } from 'vitest'
import { cardsInTown, getBuildings, getScene, nextBuilding } from './scenes'

describe('FR-05 the content registry', () => {
  it('lists one card slot per playable building, in town order (teasers have none)', () => {
    const slots = cardsInTown()
    expect(slots.map((s) => s.building.id)).toEqual(getBuildings().filter((b) => !b.teaser).map((b) => b.id))
  })

  it('gives a slot its card once the building\'s story exists, and null until then', () => {
    for (const { building, card } of cardsInTown()) {
      expect(card).toEqual(getScene(building.id)?.card ?? null)
    }
    expect(cardsInTown().find((s) => s.building.id === 'school')?.card?.id).toBe('right-to-education')
  })

  it('knows the next building in the unlock order', () => {
    expect(nextBuilding('school')).toBe('dhaba')
    expect(nextBuilding('panchayat')).toBeNull()
  })
})
