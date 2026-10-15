// The real School scene (content/scenes/school.json), played through the pure engine.
// Checks the story works as written: each weaker choice leads to a retry, the good
// choice finishes the scene, and the scene is not complete until every objective is done.

import { describe, expect, it } from 'vitest'
import schoolJson from '@content/scenes/school.json'
import type { SceneDef } from '@content/types'
import { advance, choose, isSceneComplete, startDialogue, visibleHotspots, type DialogueState, type StoryState } from './story'

const school = schoolJson as SceneDef
const fresh = (): StoryState => ({ flags: new Set(), retries: 0, reachedGood: false })

/** Opens a hotspot's conversation and presses "Next" until it ends or reaches a choice. */
function talk(story: StoryState, hotspotId: string): { story: StoryState; dialogue: DialogueState | null } {
  const hotspot = visibleHotspots(school, story.flags).find((h) => h.id === hotspotId)
  if (!hotspot?.node) throw new Error(`hotspot "${hotspotId}" is not visible`)
  let state: { story: StoryState; dialogue: DialogueState | null } = startDialogue(school, hotspot.node, story)
  while (state.dialogue && !school.nodes[state.dialogue.nodeId]?.choices) state = advance(school, state.dialogue, state.story)
  return state
}

/** Picks the choice with the given kind, then presses "Next" until the conversation ends or comes back to a choice. */
function pick(state: { story: StoryState; dialogue: DialogueState | null }, kind: 'good' | 'weak', nth = 0) {
  if (!state.dialogue) throw new Error('no conversation open')
  const choices = school.nodes[state.dialogue.nodeId]?.choices ?? []
  const index = choices.map((c, i) => (c.kind === kind ? i : -1)).filter((i) => i >= 0)[nth]!
  let next: { story: StoryState; dialogue: DialogueState | null } = choose(school, state.dialogue, index, state.story)
  while (next.dialogue && !school.nodes[next.dialogue.nodeId]?.choices) next = advance(school, next.dialogue, next.story)
  return next
}

/** Everything a player does before asking Meena Didi. */
function explore(): StoryState {
  let story = fresh()
  story = talk(story, 'ravi').story
  story = talk(story, 'lata').story
  story = talk(story, 'notice').story
  return story
}

describe('School scene story', () => {
  it('Meena Didi only takes the request after the player has met Lata', () => {
    const before = visibleHotspots(school, fresh().flags).map((h) => h.id)
    expect(before).toContain('didi-busy')
    expect(before).not.toContain('didi')
    const after = visibleHotspots(school, explore().flags).map((h) => h.id)
    expect(after).toContain('didi')
    expect(after).not.toContain('didi-busy')
    expect(after).toContain('lata-again')
  })

  it('both weaker choices lead back to the choice ("let\'s try that again"), and count a retry', () => {
    let state = talk(explore(), 'didi')
    state = pick(state, 'weak', 0)
    expect(state.dialogue?.nodeId).toBe('didi-hello')
    state = pick(state, 'weak', 1)
    expect(state.dialogue?.nodeId).toBe('didi-hello')
    expect(state.story.retries).toBe(2)
    expect(isSceneComplete(school, state.story)).toBe(false)
  })

  it('the good choice finishes the scene once every objective is done', () => {
    const state = pick(talk(explore(), 'didi'), 'good')
    expect(state.dialogue).toBeNull()
    expect(state.story.retries).toBe(0)
    expect(isSceneComplete(school, state.story)).toBe(true)
  })

  it('is not complete if the notice board was never read', () => {
    let story = fresh()
    story = talk(story, 'ravi').story
    story = talk(story, 'lata').story
    const state = pick(talk(story, 'didi'), 'good')
    expect(isSceneComplete(school, state.story)).toBe(false)
    // Reading the notice afterwards completes it.
    expect(isSceneComplete(school, talk(state.story, 'notice').story)).toBe(true)
  })

  it('has quiz questions for both age bands', () => {
    const quiz = school.games[0]!
    expect(quiz.questions.filter((q) => !q.band).length).toBeGreaterThanOrEqual(3)
    expect(quiz.questions.some((q) => q.band === 'teen')).toBe(true)
  })

  it('keeps its legal text marked for the owner\'s fact check until it is verified', () => {
    const review = school.card.review
    if (review.status === 'verified') expect(review.checkedBy && review.checkedOn).toBeTruthy()
    else expect(review.checks?.length).toBeGreaterThan(0)
  })
})
