import { describe, expect, it } from 'vitest'
import type { SceneDef } from '@content/types'
import { cameraLeft, layerOffset, layerWidth, moveBy, moveToward } from './movement'
import {
  advance,
  choose,
  isHotspotVisible,
  isSceneComplete,
  nearbyHotspot,
  nextObjective,
  startDialogue,
  visibleHotspots,
  type StoryState,
} from './story'

// A small scene: talk to Ravi, choose how to help (one weak choice, one good one).
const scene: SceneDef = {
  id: 'test',
  title: 'Test',
  right: 'Right',
  tagline: 'Tag',
  tone: 'normal',
  width: 2000,
  layers: [{ id: 'bg', art: 'none', speed: 0.3 }],
  walkable: { minX: 100, maxX: 1900 },
  blockers: [{ x1: 1000, x2: 1100 }],
  spawn: { x: 200 },
  hotspots: [
    { id: 'ravi', x: 500, label: 'Talk to Ravi', kind: 'npc', npc: 'ravi', node: 'hello' },
    { id: 'note', x: 560, label: 'Look at the note', kind: 'object', node: 'note', showIf: ['met'] },
    { id: 'old-note', x: 600, label: 'Old note', kind: 'object', node: 'note', hideIf: ['met'] },
    { id: 'door', x: 1850, label: 'Leave', kind: 'exit' },
  ],
  objectives: [
    { id: 'meet', text: 'Talk to Ravi', requires: ['met'] },
    { id: 'help', text: 'Help Ravi', requires: ['helped'] },
  ],
  startNode: 'hello',
  nodes: {
    hello: {
      id: 'hello',
      speaker: 'ravi',
      text: 'Hi',
      set: ['met'],
      choices: [
        { label: 'Ignore it', to: 'weak', kind: 'weak' },
        { label: 'Tell the teacher', to: 'tell', kind: 'good' },
      ],
    },
    weak: { id: 'weak', speaker: 'ravi', text: 'Oh.', next: 'mitthu' },
    mitthu: { id: 'mitthu', speaker: 'mitthu', text: "Let's try that again.", end: 'retry' },
    tell: { id: 'tell', speaker: 'ravi', text: 'Thanks!', set: ['helped'], next: 'good' },
    good: { id: 'good', speaker: 'ravi', text: 'Yay', end: 'good' },
    note: { id: 'note', speaker: 'mitthu', text: 'A note', end: 'good' },
  },
  card: { id: 'c', title: 'T', kid: 'k', teen: 't', ifItHappens: 'i', law: 'l', source: 's' },
  games: [],
}

const fresh = (): StoryState => ({ flags: new Set(), retries: 0, reachedGood: false })

describe('FR-02 walking', () => {
  it('moves by the given amount inside the walkable area', () => {
    expect(moveBy(200, 50, scene.walkable)).toBe(250)
  })

  it('stops at the edges of the walkable area', () => {
    expect(moveBy(120, -100, scene.walkable)).toBe(100)
    expect(moveBy(1890, 100, scene.walkable)).toBe(1900)
  })

  it('cannot walk through a blocker from either side', () => {
    expect(moveBy(980, 100, scene.walkable, scene.blockers)).toBe(996)
    expect(moveBy(1120, -100, scene.walkable, scene.blockers)).toBe(1104)
  })

  it('stays put when already against a blocker', () => {
    expect(moveBy(996, 10, scene.walkable, scene.blockers)).toBe(996)
  })

  it('tap-to-walk moves toward the target and stops on it', () => {
    expect(moveToward(200, 500, 100, scene.walkable)).toBe(300)
    expect(moveToward(480, 500, 100, scene.walkable)).toBe(500)
    expect(moveToward(500, 500, 100, scene.walkable)).toBe(500)
  })

  it('tap-to-walk also respects blockers', () => {
    expect(moveToward(990, 1500, 100, scene.walkable, scene.blockers)).toBe(996)
  })
})

describe('FR-02 camera and parallax', () => {
  it('keeps the player in the middle of the view', () => {
    expect(cameraLeft(1000, 800, 2000)).toBe(600)
  })

  it('never shows past either end of the scene', () => {
    expect(cameraLeft(100, 800, 2000)).toBe(0)
    expect(cameraLeft(1950, 800, 2000)).toBe(1200)
  })

  it('a scene narrower than the view does not move', () => {
    expect(cameraLeft(500, 2400, 2000)).toBe(0)
  })

  it('far layers move less than near layers', () => {
    expect(layerOffset(1000, 0.2, false)).toBe(200)
    expect(layerOffset(1000, 1, false)).toBe(1000)
  })

  it('calm mode turns parallax off: every layer moves together', () => {
    expect(layerOffset(1000, 0.2, true)).toBe(1000)
    expect(layerWidth(0.2, 800, 2000, true)).toBe(2000)
  })

  it('a layer is wide enough for the whole camera range', () => {
    expect(layerWidth(0.5, 800, 2000, false)).toBe(1400)
  })
})

describe('FR-03 hotspots and flags', () => {
  it('shows a prompt for the closest hotspot within reach', () => {
    expect(nearbyHotspot(scene, 450, new Set())?.id).toBe('ravi')
    expect(nearbyHotspot(scene, 200, new Set())).toBeNull()
  })

  it('reach is 120 design units', () => {
    expect(nearbyHotspot(scene, 380, new Set())?.id).toBe('ravi')
    expect(nearbyHotspot(scene, 379, new Set())).toBeNull()
  })

  it('showIf hotspots appear only after their flag is set', () => {
    const note = scene.hotspots[1]!
    expect(isHotspotVisible(note, new Set())).toBe(false)
    expect(isHotspotVisible(note, new Set(['met']))).toBe(true)
  })

  it('hideIf hotspots disappear once their flag is set', () => {
    expect(visibleHotspots(scene, new Set()).map((h) => h.id)).toEqual(['ravi', 'old-note', 'door'])
    expect(visibleHotspots(scene, new Set(['met'])).map((h) => h.id)).toEqual(['ravi', 'note', 'door'])
  })

  it('hidden hotspots never get a prompt', () => {
    expect(nearbyHotspot(scene, 560, new Set())?.id).toBe('old-note')
  })

  it('showing a node sets its flags', () => {
    const { story } = startDialogue(scene, 'hello', fresh())
    expect(story.flags.has('met')).toBe(true)
  })
})

describe('FR-04 dialogue choices and retry', () => {
  it('a good choice leads to the good ending', () => {
    let { dialogue, story } = startDialogue(scene, 'hello', fresh())
    ;({ dialogue, story } = choose(scene, dialogue, 1, story))
    expect(dialogue.nodeId).toBe('tell')
    ;({ dialogue, story } = advance(scene, dialogue, story) as { dialogue: typeof dialogue; story: StoryState })
    expect(dialogue.nodeId).toBe('good')
    expect(story.reachedGood).toBe(true)
    expect(advance(scene, dialogue, story).dialogue).toBeNull()
  })

  it('a weaker choice plays its consequence, then returns to the last choice and counts a retry', () => {
    let { dialogue, story } = startDialogue(scene, 'hello', fresh())
    ;({ dialogue, story } = choose(scene, dialogue, 0, story))
    expect(dialogue.nodeId).toBe('weak')
    const step1 = advance(scene, dialogue, story)
    expect(step1.dialogue?.nodeId).toBe('mitthu')
    const step2 = advance(scene, step1.dialogue!, step1.story)
    expect(step2.dialogue?.nodeId).toBe('hello')
    expect(step2.story.retries).toBe(1)
    expect(step2.story.reachedGood).toBe(false)
  })

  it('retries add up', () => {
    let state = startDialogue(scene, 'hello', fresh())
    for (let i = 0; i < 2; i++) {
      const picked = choose(scene, state.dialogue, 0, state.story)
      const toMitthu = advance(scene, picked.dialogue, picked.story)
      const back = advance(scene, toMitthu.dialogue!, toMitthu.story)
      state = { dialogue: back.dialogue!, story: back.story }
    }
    expect(state.story.retries).toBe(2)
  })

  it('an unknown choice index changes nothing', () => {
    const start = startDialogue(scene, 'hello', fresh())
    expect(choose(scene, start.dialogue, 9, start.story)).toEqual(start)
  })
})

describe('FR-04 objectives and completion', () => {
  it('Mitthu hints at the first objective not yet done', () => {
    expect(nextObjective(scene, new Set())?.id).toBe('meet')
    expect(nextObjective(scene, new Set(['met']))?.id).toBe('help')
    expect(nextObjective(scene, new Set(['met', 'helped']))).toBeNull()
  })

  it('a scene is complete only with the good ending AND every objective done', () => {
    // A good ending reached without helping (the note) does not complete the scene.
    expect(isSceneComplete(scene, { flags: new Set(['met']), retries: 0, reachedGood: true })).toBe(false)
    expect(isSceneComplete(scene, { flags: new Set(['met', 'helped']), retries: 0, reachedGood: false })).toBe(false)
    expect(isSceneComplete(scene, { flags: new Set(['met', 'helped']), retries: 0, reachedGood: true })).toBe(true)
  })
})
