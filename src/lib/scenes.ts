// The playable scenes, by building id. Like the art registry, this is the one place
// that lists content files; the engine itself never refers to a building by id.

import schoolJson from '@content/scenes/school.json'
import buildingsJson from '@content/buildings.json'
import type { BuildingInfo, SceneDef } from '@content/types'

export const buildings = buildingsJson as BuildingInfo[]

const scenes: Record<string, SceneDef> = {
  school: schoolJson as SceneDef,
}

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
