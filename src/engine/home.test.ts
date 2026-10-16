// The real Dhaba scene (content/scenes/home.json), played through the pure engine.
// The child is the helper: they listen to Anu, notice her drawing and tell a trusted adult. Nothing harmful is shown.

import { describe, expect, it } from 'vitest'
import homeJson from '@content/scenes/home.json'
import type { SceneDef } from '@content/types'
import { initialSceneState } from './sceneState'
import { advance, choose, isSceneComplete, startDialogue, visibleHotspots, type DialogueState, type StoryState } from './story'

const home = homeJson as SceneDef
type Talk = { story: StoryState; dialogue: DialogueState | null }
const fresh = (): StoryState => ({ flags: new Set(), retries: 0, reachedGood: false })

/** Presses "Next" until the conversation ends or reaches a choice. */
function untilChoice(state: Talk): Talk {
  let s = state
  while (s.dialogue && !home.nodes[s.dialogue.nodeId]?.choices) s = advance(home, s.dialogue, s.story)
  return s
}
function talk(story: StoryState, hotspotId: string): Talk {
  const h = visibleHotspots(home, story.flags).find((x) => x.id === hotspotId)
  if (!h?.node) throw new Error(`hotspot "${hotspotId}" is not visible`)
  return untilChoice(startDialogue(home, h.node, story))
}
function pick(state: Talk, kind: 'good' | 'weak', nth = 0): Talk {
  const choices = home.nodes[state.dialogue!.nodeId]!.choices!
  const index = choices.map((c, i) => (c.kind === kind ? i : -1)).filter((i) => i >= 0)[nth]!
  return untilChoice(choose(home, state.dialogue!, index, state.story))
}
const explore = () => talk(talk(fresh(), 'anu').story, 'drawing').story

describe('Home scene story', () => {
  it('is a gentle scene, and opens with Mitthu on arrival', () => {
    expect(home.tone).toBe('gentle')
    expect(initialSceneState(home).dialogue?.nodeId).toBe('intro')
  })

  it('Farida Aunty takes the request only after the player has met Anu', () => {
    expect(visibleHotspots(home, fresh().flags).map((h) => h.id)).toContain('farida-busy')
    const after = visibleHotspots(home, explore().flags).map((h) => h.id)
    expect(after).toContain('farida')
    expect(after).not.toContain('farida-busy')
  })

  it('both weaker choices come back to the choice and count retries', () => {
    let s = talk(explore(), 'farida')
    s = pick(s, 'weak', 0)
    s = pick(s, 'weak', 1)
    expect(s.dialogue?.nodeId).toBe('farida-hello')
    expect(s.story.retries).toBe(2)
  })

  it('the good choice completes the scene once every objective is done', () => {
    const s = pick(talk(explore(), 'farida'), 'good')
    expect(s.dialogue).toBeNull()
    expect(isSceneComplete(home, s.story)).toBe(true)
  })

  it('never stages harm: no node uses the "push" effect (a gentle scene never shakes)', () => {
    expect(Object.values(home.nodes).some((n) => n.fx === 'push')).toBe(false)
  })

  it('keeps its legal text marked for the owner\'s fact check until it is verified', () => {
    const review = home.card!.review
    if (review.status === 'verified') expect(review.checkedBy && review.checkedOn).toBeTruthy()
    else expect(review.checks?.length).toBeGreaterThan(0)
  })
})
