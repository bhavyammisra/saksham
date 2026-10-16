// The town hub (content/scenes/town.json) through the pure engine: locked doors,
// open doors, coming back to a door, and a hub that never "completes".

import { describe, expect, it } from 'vitest'
import buildingsJson from '@content/buildings.json'
import townJson from '@content/scenes/town.json'
import type { SceneDef } from '@content/types'
import { initialSceneState, sceneReducer, type SceneState } from './sceneState'
import { isSceneComplete, visibleHotspots } from './story'

const town = townJson as SceneDef

/** Closes Mitthu's intro, so the player can act. */
function arrived(state: SceneState, reduce: ReturnType<typeof sceneReducer>): SceneState {
  let s = state
  for (let i = 0; i < 5 && s.dialogue; i++) s = reduce(s, { type: 'next' })
  return s
}

describe('FR-07 the town hub', () => {
  it('opens Mitthu’s welcome on arrival', () => {
    expect(initialSceneState(town).dialogue?.nodeId).toBe('intro')
  })

  it('a locked door plays its gentle reply and does not leave', () => {
    const reduce = sceneReducer(town, new Set(['dhaba']))
    const s = reduce(arrived(initialSceneState(town), reduce), { type: 'jumpTo', hotspotId: 'dhaba' })
    expect(s.exit).toBeNull()
    expect(s.dialogue?.nodeId).toBe('dhaba-closed')
  })

  it('an open door leaves through that exit', () => {
    const reduce = sceneReducer(town, new Set(['dhaba']))
    let s = reduce(arrived(initialSceneState(town), reduce), { type: 'jumpTo', hotspotId: 'school' })
    expect(s.entering).toBe('school') // walking to the door and going in first
    for (let i = 0; i < 300; i++) s = reduce(s, { type: 'tick', now: i * 16, dt: 1 / 60, dir: 0, viewWidth: 1200, calm: false })
    expect(s.exit).toBe('school')
  })

  it('the Help door is never locked by content: it has no locked reply', () => {
    const help = town.hotspots.find((h) => h.to === 'help')
    expect(help?.kind).toBe('exit')
    expect(help?.lockedNode).toBeUndefined()
  })

  it('coming back from a building starts outside its door (clamped to the street)', () => {
    expect(initialSceneState(town, 1550).x).toBe(1550)
    expect(initialSceneState(town, 99999).x).toBe(town.walkable.maxX)
  })

  it('never completes, even after the intro reaches a good ending', () => {
    const reduce = sceneReducer(town)
    const s = arrived(initialSceneState(town), reduce)
    expect(s.story.reachedGood).toBe(true)
    expect(isSceneComplete(town, s.story)).toBe(false)
    expect(s.completed).toBe(false)
  })

  it('starts with the flags the host sets from progress, and Lata appears once the School is done', () => {
    expect(visibleHotspots(town, initialSceneState(town).story.flags).some((h) => h.id === 'lata')).toBe(false)
    const after = initialSceneState(town, undefined, ['done:school'])
    expect(after.story.flags.has('done:school')).toBe(true)
    expect(visibleHotspots(town, after.story.flags).some((h) => h.id === 'lata')).toBe(true)
  })

  it('can skip the arrival line (coming back, not arriving)', () => {
    expect(initialSceneState(town, 700, [], true).dialogue).toBeNull()
  })

  it('only lists host flags it uses, one per building', () => {
    expect(town.hostFlags?.sort()).toEqual(buildingsJson.filter((b) => !b.teaser).map((b) => `done:${b.id}`).sort())
  })

  it('has one door per building, plus Help', () => {
    const doors = town.hotspots.filter((h) => h.kind === 'exit').map((h) => h.to)
    expect(doors.sort()).toEqual([...buildingsJson.map((b) => b.id), 'help'].sort())
  })
})
