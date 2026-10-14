import { describe, expect, it } from 'vitest'
import sandboxJson from '@content/scenes/sandbox.json'
import type { SceneDef } from '@content/types'
import { initialSceneState, sceneReducer, type SceneAction, type SceneState } from './sceneState'

// The real sandbox scene: the engine must play it from its JSON alone.
const scene = sandboxJson as SceneDef
const reduce = sceneReducer(scene)
const VIEW = 1200

let clock = 0
const tick = (dir: -1 | 0 | 1 = 0, dt = 1 / 60, calm = false): SceneAction => {
  clock += dt * 1000
  return { type: 'tick', now: clock, dt, dir, viewWidth: VIEW, calm }
}
const run = (s: SceneState, actions: SceneAction[]) => actions.reduce(reduce, s)
const ticks = (n: number, dir: -1 | 0 | 1 = 0, calm = false) => Array.from({ length: n }, () => tick(dir, 1 / 60, calm))
/** Presses "Next" until the conversation is over (or it reaches a choice). */
const talkThrough = (s: SceneState) => {
  let state = s
  for (let i = 0; i < 20 && state.dialogue && !scene.nodes[state.dialogue.nodeId]?.choices; i++) {
    state = reduce(state, { type: 'next' })
  }
  return state
}

describe('FR-02 playing a scene: walking', () => {
  it('starts at the spawn point', () => {
    expect(initialSceneState(scene).x).toBe(scene.spawn.x)
  })

  it('holding right walks right, faces right, and the camera follows', () => {
    const s = run(initialSceneState(scene), ticks(120, 1))
    expect(s.x).toBeGreaterThan(scene.spawn.x + 600)
    expect(s.facing).toBe('right')
    expect(s.walking).toBe(true)
    expect(s.camera).toBeGreaterThan(0)
  })

  it('cannot walk through the wall blocker', () => {
    const s = run(initialSceneState(scene), ticks(600, 1))
    expect(s.x).toBeLessThan(scene.blockers![0]!.x1)
  })

  it('in calm mode the camera jumps straight to the player (no smooth movement)', () => {
    const s = run(initialSceneState(scene), [...ticks(60, 1), tick(0, 1 / 60, true)])
    expect(s.camera).toBe(Math.max(0, s.x - VIEW / 2))
  })

  it('tap-to-walk walks to the tapped spot', () => {
    const s = run(initialSceneState(scene), [{ type: 'walkTo', x: 600 }, ...ticks(120)])
    expect(s.x).toBe(600)
    expect(s.target).toBeNull()
  })
})

describe('FR-03 hotspots', () => {
  it('tapping a far hotspot walks there and opens it on arrival', () => {
    let s = reduce(initialSceneState(scene), { type: 'use', hotspotId: 'ravi' })
    expect(s.dialogue).toBeNull()
    s = run(s, ticks(180))
    expect(s.dialogue?.nodeId).toBe('ravi-hello')
  })

  it('E opens the hotspot the player is standing next to, and nothing when none is near', () => {
    const start = initialSceneState(scene)
    expect(reduce(start, { type: 'interactNearby' })).toBe(start)
    const near = { ...start, x: 780 }
    expect(reduce(near, { type: 'interactNearby' }).dialogue?.nodeId).toBe('ravi-hello')
  })

  it('"Things to do here" jumps straight to a hotspot without walking', () => {
    const s = reduce(initialSceneState(scene), { type: 'jumpTo', hotspotId: 'didi' })
    expect(s.x).toBe(2300) // beside Meena Didi (at 2400), on the side the player came from
    expect(s.dialogue?.nodeId).toBe('didi-hello')
  })

  it('a hidden hotspot cannot be opened until its flag is set', () => {
    const start = initialSceneState(scene)
    expect(reduce(start, { type: 'jumpTo', hotspotId: 'notice' })).toBe(start)
    let s = talkThrough(reduce(start, { type: 'jumpTo', hotspotId: 'box' }))
    s = reduce(s, { type: 'jumpTo', hotspotId: 'notice' })
    expect(s.dialogue?.nodeId).toBe('notice')
  })

  it('the player cannot walk while talking', () => {
    const s = reduce(initialSceneState(scene), { type: 'jumpTo', hotspotId: 'ravi' })
    expect(run(s, ticks(60, 1)).x).toBe(s.x)
  })

  it('an exit hotspot ends the scene with that exit', () => {
    const s = reduce(initialSceneState(scene), { type: 'jumpTo', hotspotId: 'door' })
    expect(s.exit).toBe('door')
    expect(reduce(s, tick(1)).x).toBe(s.x) // nothing moves after leaving
  })
})

describe('FR-04 the story to the end', () => {
  const visit = (s: SceneState, id: string) => talkThrough(reduce(s, { type: 'jumpTo', hotspotId: id }))

  it('a weaker choice counts a retry; the good choice then completes the scene', () => {
    let s = visit(initialSceneState(scene), 'ravi')
    s = visit(s, 'box')
    s = visit(s, 'notice')
    expect(s.completed).toBe(false)

    s = reduce(s, { type: 'jumpTo', hotspotId: 'didi' })
    s = reduce(s, { type: 'choose', index: 0 }) // "Never mind"
    s = talkThrough(s) // consequence, Mitthu's "let's try that again", back to the choice
    expect(s.dialogue?.nodeId).toBe('didi-hello')
    expect(s.story.retries).toBe(1)

    s = talkThrough(reduce(s, { type: 'choose', index: 1 }))
    expect(s.story.reachedGood).toBe(true)
    s = reduce(s, { type: 'next' }) // close the last line
    expect(s.completed).toBe(true)
  })

  it('is not complete when the good ending comes before every objective is done', () => {
    let s = visit(initialSceneState(scene), 'didi')
    s = talkThrough(reduce(reduce(s, { type: 'jumpTo', hotspotId: 'didi' }), { type: 'choose', index: 1 }))
    s = reduce(s, { type: 'next' })
    expect(s.story.reachedGood).toBe(true)
    expect(s.completed).toBe(false)
  })

  it('a node with fx: "gasp" makes the player gasp for a moment', () => {
    let s = reduce(initialSceneState(scene), { type: 'jumpTo', hotspotId: 'box' })
    expect(s.fx?.pose).toBe('gasp')
    s = run(s, ticks(90))
    expect(s.fx).toBeNull()
  })
})

describe('FR-04 Mitthu', () => {
  it('trails behind while walking and catches up when the player stops', () => {
    const walking = run(initialSceneState(scene), ticks(120, 1))
    expect(walking.mitthuX).toBeLessThan(walking.x) // behind, while facing right
    const stopped = run(walking, ticks(180))
    expect(Math.abs(stopped.x - stopped.mitthuX - 110)).toBeLessThan(2)
  })

  it('offers a hint after 20 seconds of doing nothing, and stops when the player acts', () => {
    // The idle clock starts at the first tick; 20 seconds later the hint appears.
    let s = run(initialSceneState(scene), Array.from({ length: 40 }, () => tick(0, 0.5)))
    expect(s.hint).toBe(false)
    s = reduce(s, tick(0, 0.5))
    expect(s.hint).toBe(true)
    s = reduce(s, { type: 'activity' })
    expect(s.hint).toBe(false)
  })

  it('does not hint during a conversation', () => {
    let s = reduce(initialSceneState(scene), { type: 'jumpTo', hotspotId: 'ravi' })
    s = run(s, Array.from({ length: 50 }, () => tick(0, 0.5)))
    expect(s.hint).toBe(false)
  })
})
