// The playable scenes, by building id. Like the art registry, this is the one place
// that lists content files; the engine itself never refers to a building by id.

import dhabaJson from '@content/scenes/dhaba.json'
import homeJson from '@content/scenes/home.json'
import panchayatJson from '@content/scenes/panchayat.json'
import schoolJson from '@content/scenes/school.json'
import townJson from '@content/scenes/town.json'
import buildingsJson from '@content/buildings.json'
import helpJson from '@content/help.json'
import type { BuildingInfo, Card, HelpContent, SceneDef } from '@content/types'
import { reviewItems, type ReviewItem } from './review'

export const buildings = buildingsJson as BuildingInfo[]

const scenes: Record<string, SceneDef> = {
  school: schoolJson as SceneDef,
  dhaba: dhabaJson as SceneDef,
  home: homeJson as SceneDef,
  panchayat: panchayatJson as SceneDef,
}

/** The town: the walkable hub that links to every building. */
export const townScene = townJson as SceneDef

/** The scene for a building, or null if it isn't written yet. */
export function getScene(id: string): SceneDef | null {
  return scenes[id] ?? null
}

/** The next playable building after `id` in the unlock order, or null if it is the last. */
export function nextBuilding(id: string): string | null {
  const playable = buildings.filter((b) => !b.teaser)
  const i = playable.findIndex((b) => b.id === id)
  return i >= 0 ? (playable[i + 1]?.id ?? null) : null
}

/** Every playable building with its rights card (null while its story isn't written), in town order. */
export function cardsInTown(): { building: BuildingInfo; card: Card | null }[] {
  return buildings.filter((b) => !b.teaser).map((building) => ({ building, card: getScene(building.id)?.card ?? null }))
}

/** Every reviewable item in this build (D-049): the same list scripts/content-hashes.ts prints. */
export function reviewableContent(): ReviewItem[] {
  const playable = buildings.filter((b) => !b.teaser).map((b) => ({ id: b.id, name: b.name, card: getScene(b.id)?.card, games: getScene(b.id)?.games }))
  return reviewItems(playable, helpJson as HelpContent)
}
