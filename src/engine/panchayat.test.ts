// The real Panchayat scene (content/scenes/panchayat.json), played through the pure engine.
// The child is the helper: they listen to Pooja, notice her admit card and tell a trusted adult. No wedding is shown.

import { describe, expect, it } from 'vitest'
import panchayatJson from '@content/scenes/panchayat.json'
import type { SceneDef } from '@content/types'
import { initialSceneState } from './sceneState'
import { advance, choose, isSceneComplete, startDialogue, visibleHotspots, type DialogueState, type StoryState } from './story'

const panchayat = panchayatJson as SceneDef
type Talk = { story: StoryState; dialogue: DialogueState | null }
const fresh = (): StoryState => ({ flags: new Set(), retries: 0, reachedGood: false })

/** Presses "Next" until the conversation ends or reaches a choice. */
function untilChoice(state: Talk): Talk {
  let s = state
  while (s.dialogue && !panchayat.nodes[s.dialogue.nodeId]?.choices) s = advance(panchayat, s.dialogue, s.story)
  return s
}
function talk(story: StoryState, hotspotId: string): Talk {
  const h = visibleHotspots(panchayat, story.flags).find((x) => x.id === hotspotId)
  if (!h?.node) throw new Error(`hotspot "${hotspotId}" is not visible`)
  return untilChoice(startDialogue(panchayat, h.node, story))
}
function pick(state: Talk, kind: 'good' | 'weak', nth = 0): Talk {
  const choices = panchayat.nodes[state.dialogue!.nodeId]!.choices!
  const index = choices.map((c, i) => (c.kind === kind ? i : -1)).filter((i) => i >= 0)[nth]!
  return untilChoice(choose(panchayat, state.dialogue!, index, state.story))
}
const explore = () => talk(talk(fresh(), 'pooja').story, 'admit-card').story

describe('Panchayat scene story', () => {
  it('is a gentle scene, and opens with Mitthu on arrival', () => {
    expect(panchayat.tone).toBe('gentle')
    expect(initialSceneState(panchayat).dialogue?.nodeId).toBe('intro')
  })

  it('the Sarpanch takes the request only after the player has met Pooja', () => {
    expect(visibleHotspots(panchayat, fresh().flags).map((h) => h.id)).toContain('sarpanch-busy')
    const after = visibleHotspots(panchayat, explore().flags).map((h) => h.id)
    expect(after).toContain('sarpanch')
    expect(after).not.toContain('sarpanch-busy')
  })

  it('both weaker choices come back to the choice and count retries', () => {
    let s = talk(explore(), 'sarpanch')
    s = pick(s, 'weak', 0)
    s = pick(s, 'weak', 1)
    expect(s.dialogue?.nodeId).toBe('sarpanch-hello')
    expect(s.story.retries).toBe(2)
  })

  it('the good choice completes the scene once every objective is done', () => {
    const s = pick(talk(explore(), 'sarpanch'), 'good')
    expect(s.dialogue).toBeNull()
    expect(isSceneComplete(panchayat, s.story)).toBe(true)
  })

  it('never stages harm: no node uses the "push" effect (a gentle scene never shakes)', () => {
    expect(Object.values(panchayat.nodes).some((n) => n.fx === 'push')).toBe(false)
  })

  it('keeps its legal text marked for the owner\'s fact check until it is verified', () => {
    const review = panchayat.card!.review
    if (review.status === 'verified') expect(review.checkedBy && review.checkedOn).toBeTruthy()
    else expect(review.checks?.length).toBeGreaterThan(0)
  })
})
