// The real Dhaba scene (content/scenes/dhaba.json), played through the pure engine.
// The child is the helper: they listen to Raju, notice his notebook and tell a trusted adult.

import { describe, expect, it } from 'vitest'
import dhabaJson from '@content/scenes/dhaba.json'
import type { SceneDef } from '@content/types'
import { initialSceneState } from './sceneState'
import { advance, choose, isSceneComplete, startDialogue, visibleHotspots, type DialogueState, type StoryState } from './story'

const dhaba = dhabaJson as SceneDef
type Talk = { story: StoryState; dialogue: DialogueState | null }
const fresh = (): StoryState => ({ flags: new Set(), retries: 0, reachedGood: false })

/** Presses "Next" until the conversation ends or reaches a choice. */
function untilChoice(state: Talk): Talk {
  let s = state
  while (s.dialogue && !dhaba.nodes[s.dialogue.nodeId]?.choices) s = advance(dhaba, s.dialogue, s.story)
  return s
}
function talk(story: StoryState, hotspotId: string): Talk {
  const h = visibleHotspots(dhaba, story.flags).find((x) => x.id === hotspotId)
  if (!h?.node) throw new Error(`hotspot "${hotspotId}" is not visible`)
  return untilChoice(startDialogue(dhaba, h.node, story))
}
function pick(state: Talk, kind: 'good' | 'weak', nth = 0): Talk {
  const choices = dhaba.nodes[state.dialogue!.nodeId]!.choices!
  const index = choices.map((c, i) => (c.kind === kind ? i : -1)).filter((i) => i >= 0)[nth]!
  return untilChoice(choose(dhaba, state.dialogue!, index, state.story))
}
const explore = () => talk(talk(fresh(), 'raju').story, 'notebook').story

describe('Dhaba scene story', () => {
  it('is a gentle scene, and opens with Mitthu on arrival', () => {
    expect(dhaba.tone).toBe('gentle')
    expect(initialSceneState(dhaba).dialogue?.nodeId).toBe('intro')
  })

  it('Sunita Didi takes the request only after the player has met Raju', () => {
    expect(visibleHotspots(dhaba, fresh().flags).map((h) => h.id)).toContain('sunita-busy')
    const after = visibleHotspots(dhaba, explore().flags).map((h) => h.id)
    expect(after).toContain('sunita')
    expect(after).not.toContain('sunita-busy')
  })

  it('both weaker choices come back to the choice and count retries', () => {
    let s = talk(explore(), 'sunita')
    s = pick(s, 'weak', 0)
    s = pick(s, 'weak', 1)
    expect(s.dialogue?.nodeId).toBe('sunita-hello')
    expect(s.story.retries).toBe(2)
  })

  it('the good choice completes the scene once every objective is done', () => {
    const s = pick(talk(explore(), 'sunita'), 'good')
    expect(s.dialogue).toBeNull()
    expect(isSceneComplete(dhaba, s.story)).toBe(true)
  })

  it('never stages harm: no node uses the "push" effect (a gentle scene never shakes)', () => {
    expect(Object.values(dhaba.nodes).some((n) => n.fx === 'push')).toBe(false)
  })

  it('keeps its legal text marked for the owner\'s fact check until it is verified', () => {
    const review = dhaba.card!.review
    if (review.status === 'verified') expect(review.checkedBy && review.checkedOn).toBeTruthy()
    else expect(review.checks?.length).toBeGreaterThan(0)
  })
})
