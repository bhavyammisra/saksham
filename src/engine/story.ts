// Hotspots, flags, dialogue and objectives. Pure functions over a SceneDef.

import type { Hotspot, SceneDef, StoryNode } from '@content/types'

export const PROMPT_RADIUS = 120 // design units: a hotspot's prompt shows within this distance

export type Flags = ReadonlySet<string>

// ---------------------------------------------------------------- hotspots

/** A hotspot shows when all of its showIf flags are set and none of its hideIf flags are. */
export function isHotspotVisible(h: Hotspot, flags: Flags): boolean {
  return (h.showIf ?? []).every((f) => flags.has(f)) && !(h.hideIf ?? []).some((f) => flags.has(f))
}

export function visibleHotspots(scene: SceneDef, flags: Flags): Hotspot[] {
  return scene.hotspots.filter((h) => isHotspotVisible(h, flags))
}

/** The closest visible hotspot within PROMPT_RADIUS of the player, or null. */
export function nearbyHotspot(scene: SceneDef, playerX: number, flags: Flags): Hotspot | null {
  let best: Hotspot | null = null
  for (const h of visibleHotspots(scene, flags)) {
    const d = Math.abs(h.x - playerX)
    if (d <= PROMPT_RADIUS && (!best || d < Math.abs(best.x - playerX))) best = h
  }
  return best
}

// ---------------------------------------------------------------- dialogue

/**
 * Where a conversation is. `lastChoice` is the most recent node with choices,
 * so a `retry` ending can return there.
 */
export interface DialogueState {
  nodeId: string
  lastChoice: string | null
  trail?: string[] // the lines shown before this one in this conversation, for "Back"
}

export interface StoryState {
  flags: Flags
  retries: number // how many times a weaker choice led to "let's try that again"
  reachedGood: boolean // an end: "good" node has been shown
}

export function getNode(scene: SceneDef, id: string): StoryNode {
  const node = scene.nodes[id]
  if (!node) throw new Error(`Scene "${scene.id}" has no node "${id}"`)
  return node
}

/** Shows a node: sets its flags and notes a good ending. */
export function enterNode(scene: SceneDef, nodeId: string, story: StoryState): StoryState {
  const node = getNode(scene, nodeId)
  const flags = new Set(story.flags)
  for (const f of node.set ?? []) flags.add(f)
  return { ...story, flags, reachedGood: story.reachedGood || node.end === 'good' }
}

export function startDialogue(scene: SceneDef, nodeId: string, story: StoryState) {
  const node = getNode(scene, nodeId)
  return {
    dialogue: { nodeId, lastChoice: node.choices ? nodeId : null } as DialogueState,
    story: enterNode(scene, nodeId, story),
  }
}

/**
 * "Next" on a node without choices. Returns the new dialogue state, or null
 * when the conversation is over. A `retry` ending goes back to the last choice
 * and counts a retry.
 */
export function advance(scene: SceneDef, dialogue: DialogueState, story: StoryState) {
  const node = getNode(scene, dialogue.nodeId)
  if (node.end === 'retry' && dialogue.lastChoice) {
    return {
      dialogue: { nodeId: dialogue.lastChoice, lastChoice: dialogue.lastChoice },
      story: enterNode(scene, dialogue.lastChoice, { ...story, retries: story.retries + 1 }),
    }
  }
  if (node.end || !node.next) return { dialogue: null, story }
  return goTo(scene, node.next, dialogue, story)
}

/** Picking one of the current node's choices. */
export function choose(scene: SceneDef, dialogue: DialogueState, index: number, story: StoryState) {
  const choice = getNode(scene, dialogue.nodeId).choices?.[index]
  if (!choice) return { dialogue, story }
  return goTo(scene, choice.to, dialogue, story)
}

function goTo(scene: SceneDef, nodeId: string, dialogue: DialogueState, story: StoryState) {
  const node = getNode(scene, nodeId)
  return {
    dialogue: { nodeId, lastChoice: node.choices ? nodeId : dialogue.lastChoice, trail: [...(dialogue.trail ?? []), dialogue.nodeId] },
    story: enterNode(scene, nodeId, story),
  }
}

/**
 * "Back": shows the line before this one again. Flags already set stay set (they only record
 * what the player has seen), so going back can never undo progress or unlock anything new.
 * Returns the same dialogue when there is nothing to go back to.
 */
export function goBack(scene: SceneDef, dialogue: DialogueState): DialogueState {
  const trail = dialogue.trail ?? []
  const previous = trail[trail.length - 1]
  if (!previous) return dialogue
  const lastChoice = getNode(scene, previous).choices ? previous : dialogue.lastChoice
  return { nodeId: previous, lastChoice, trail: trail.slice(0, -1) }
}

// ---------------------------------------------------------------- objectives

export function isObjectiveDone(objective: SceneDef['objectives'][number], flags: Flags): boolean {
  return objective.requires.every((f) => flags.has(f))
}

/** The first objective not yet done (used for Mitthu's hint), or null. */
export function nextObjective(scene: SceneDef, flags: Flags) {
  return scene.objectives.find((o) => !isObjectiveDone(o, flags)) ?? null
}

/** A scene is complete when its good ending was reached and every objective is done. */
export function isSceneComplete(scene: SceneDef, story: StoryState): boolean {
  if (scene.hub) return false // a hub (the town) is a place to come back to, never "finished"
  return story.reachedGood && scene.objectives.every((o) => isObjectiveDone(o, story.flags))
}
