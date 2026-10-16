// The whole state of a scene being played, and one pure reducer that changes it.
// The React component only sends actions (a frame tick, a key, a tap) and draws the state.
//
//   state + action -> new state      (no timers, no DOM, so it is unit-tested)

import type { Hotspot, SceneDef } from '@content/types'
import { cameraLeft, clampDepth, DEPTH_SPEED, moveBy, moveDepthToward, moveToward, WALK_SPEED } from './movement'
import {
  advance,
  choose,
  getNode,
  goBack,
  isHotspotVisible,
  isSceneComplete,
  nearbyHotspot,
  PROMPT_RADIUS,
  startDialogue,
  type DialogueState,
  type StoryState,
} from './story'

export const HINT_AFTER = 20 // seconds of doing nothing before Mitthu offers a hint
const MITTHU_DISTANCE = 110 // Mitthu flies this far behind the player
const FX_SECONDS = 1.2 // how long a cheer or gasp lasts
const STAND_BESIDE = 100 // how far from a hotspot the player stops, so they don't overlap
const START_DEPTH = 0.6 // the player arrives a little in front of the middle of the walkway
const NPC_DEPTH = 0.35 // where people stand when the scene doesn't say

/** How near the viewer a hotspot stands (0 = against the wall). */
export function hotspotDepth(h: Hotspot): number {
  return h.depth ?? (h.kind === 'npc' ? NPC_DEPTH : 0)
}

export type Facing = 'left' | 'right'
export type FxPose = 'cheer' | 'gasp'

export interface SceneState {
  x: number
  depth: number // 0 = far edge of the walkway, 1 = nearest the viewer (W and S, D-036)
  facing: Facing
  walking: boolean
  camera: number // left edge of the view, in design units
  mitthuX: number
  target: number | null // tap-to-walk destination
  targetDepth: number | null // and how near or far it is
  pending: string | null // hotspot to open on arrival
  story: StoryState
  dialogue: DialogueState | null
  fx: { pose: FxPose; left: number } | null // player reaction, seconds left
  shake: number // seconds of a small screen nudge left ("push" fx; never in gentle or calm)
  idleSince: number | null // time (ms) the player last did something; null = restart the clock
  hint: boolean // Mitthu offers a hint after HINT_AFTER seconds of doing nothing
  exit: string | null // an exit hotspot was used
  completed: boolean
  seen: string[] // every line shown in this visit, in order (the History panel)
}

export type SceneAction =
  | { type: 'tick'; now: number; dt: number; dir: -1 | 0 | 1; dirDepth?: -1 | 0 | 1; viewWidth: number; calm: boolean }
  | { type: 'walkTo'; x: number; depth?: number }
  | { type: 'use'; hotspotId: string } // tap a hotspot: walk to it, then open it
  | { type: 'jumpTo'; hotspotId: string } // "Things to do here": go there at once and open it
  | { type: 'interactNearby' } // E or Enter
  | { type: 'next' }
  | { type: 'back' } // the line before, again
  | { type: 'choose'; index: number }
  | { type: 'activity' }

/**
 * `startX` puts the player somewhere other than the scene's spawn point (e.g. back outside a door).
 * `startFlags` are flags the host sets before anything happens (e.g. "done:school" from saved progress).
 * `skipIntro` leaves out the arrival line (e.g. coming back to the town, not arriving for the first time).
 */
export function initialSceneState(scene: SceneDef, startX?: number, startFlags: readonly string[] = [], skipIntro = false): SceneState {
  const x = startX !== undefined ? Math.min(scene.walkable.maxX, Math.max(scene.walkable.minX, startX)) : scene.spawn.x
  const story: StoryState = { flags: new Set(startFlags), retries: 0, reachedGood: false }
  // Arriving: Mitthu introduces the place in one line, if the scene has an intro.
  const arrival = scene.intro && !skipIntro ? startDialogue(scene, scene.intro, story) : { dialogue: null, story }
  return {
    x,
    depth: START_DEPTH,
    facing: 'right',
    walking: false,
    camera: 0,
    mitthuX: x - MITTHU_DISTANCE,
    target: null,
    targetDepth: null,
    pending: null,
    story: arrival.story,
    dialogue: arrival.dialogue,
    fx: null,
    shake: 0,
    idleSince: null,
    hint: false,
    exit: null,
    completed: false,
    seen: arrival.dialogue ? [arrival.dialogue.nodeId] : [],
  }
}

/**
 * `locked` lists exit hotspots the host has locked right now (e.g. a building not yet unlocked).
 * Opening a locked exit plays its `lockedNode` instead of leaving. The engine doesn't know why it is locked.
 */
export function sceneReducer(scene: SceneDef, locked: ReadonlySet<string> = new Set()) {
  const find = (id: string) => scene.hotspots.find((h) => h.id === id) ?? null

  /** Where to stand to use a hotspot: beside it, on the side the player is coming from. */
  const besideSpot = (h: Hotspot, fromX: number) => {
    const side = fromX <= h.x ? -1 : 1
    return Math.min(scene.walkable.maxX, Math.max(scene.walkable.minX, h.x + side * STAND_BESIDE))
  }

  /** How near to stand when using a hotspot: just in front of it. */
  const standDepth = (h: Hotspot) => clampDepth(hotspotDepth(h) + 0.15)

  /** Opens a hotspot: an exit ends the scene, anything else starts its conversation. */
  const open = (s: SceneState, h: Hotspot): SceneState => {
    if (!isHotspotVisible(h, s.story.flags)) return s
    const facing: Facing = h.x < s.x ? 'left' : h.x > s.x ? 'right' : s.facing
    if (h.kind === 'exit' && locked.has(h.id)) {
      if (!h.lockedNode) return { ...s, facing }
      const reply = startDialogue(scene, h.lockedNode, s.story)
      return withFx({ ...s, facing, target: null, pending: null, idleSince: null, hint: false, walking: false, ...reply }, h.lockedNode)
    }
    if (h.kind === 'exit') return { ...s, facing, exit: h.id, target: null, targetDepth: null, pending: null }
    if (!h.node) return s
    const started = startDialogue(scene, h.node, s.story)
    return withFx({ ...s, facing, target: null, pending: null, idleSince: null, hint: false, walking: false, ...started }, h.node)
  }

  /** Starts a cheer, gasp or push when a node has one. Unknown fx values are ignored. */
  const withFx = (s: SceneState, nodeId: string): SceneState => {
    const fx = getNode(scene, nodeId).fx
    if (fx === 'cheer' || fx === 'gasp') return { ...s, fx: { pose: fx, left: FX_SECONDS } }
    if (fx === 'push' && scene.tone !== 'gentle') return { ...s, shake: 0.4 }
    return s
  }

  /** After a conversation ends: is the whole scene now complete? */
  const finishDialogue = (s: SceneState, story: StoryState): SceneState => ({
    ...s,
    story,
    idleSince: null,
    hint: false,
    dialogue: null,
    completed: s.completed || isSceneComplete(scene, story),
  })

  /** Every action, then: a new line on screen is added to the History. */
  return function reduce(s: SceneState, action: SceneAction): SceneState {
    const next = step(s, action)
    const line = next.dialogue?.nodeId
    if (!line || line === s.dialogue?.nodeId || action.type === 'back') return next
    return { ...next, seen: [...next.seen, line] }
  }

  function step(s: SceneState, action: SceneAction): SceneState {
    if (s.exit || s.completed) return s // the scene is over

    switch (action.type) {
      case 'tick': {
        const { now, dt, viewWidth, calm } = action
        const talking = s.dialogue !== null
        const dir = talking ? 0 : action.dir
        const dirDepth = talking ? 0 : (action.dirDepth ?? 0)

        // Walk: held keys or the walk pad win over tap-to-walk.
        let { x, depth, target, targetDepth, pending, facing } = s
        if (dir !== 0 || dirDepth !== 0) {
          target = null
          targetDepth = null
          pending = null
          x = moveBy(s.x, dir * WALK_SPEED * dt, scene.walkable, scene.blockers)
          depth = clampDepth(s.depth + dirDepth * DEPTH_SPEED * dt)
        } else if ((target !== null || targetDepth !== null) && !talking) {
          if (target !== null) {
            x = moveToward(s.x, target, WALK_SPEED * dt, scene.walkable, scene.blockers)
            if (x === s.x) target = null // arrived, or stopped by a blocker
          }
          if (targetDepth !== null) {
            depth = moveDepthToward(s.depth, targetDepth, DEPTH_SPEED * dt)
            if (depth === targetDepth) targetDepth = null
          }
        }
        if (x !== s.x) facing = x > s.x ? 'right' : 'left'
        const walking = x !== s.x || depth !== s.depth

        // Camera follows smoothly (instantly in calm mode).
        const aim = cameraLeft(x, viewWidth, scene.width)
        const camera = calm ? aim : s.camera + (aim - s.camera) * Math.min(1, dt * 6)

        // Mitthu flies a little behind the player.
        const mitthuAim = x + (facing === 'right' ? -MITTHU_DISTANCE : MITTHU_DISTANCE)
        const mitthuX = calm ? mitthuAim : s.mitthuX + (mitthuAim - s.mitthuX) * Math.min(1, dt * 3)

        const fx = s.fx && s.fx.left - dt > 0 ? { ...s.fx, left: s.fx.left - dt } : null
        const shake = calm ? 0 : Math.max(0, s.shake - dt)
        // Idle clock: restarts while walking; Mitthu's hint shows after HINT_AFTER quiet seconds.
        const idleSince = walking || s.idleSince === null ? now : s.idleSince
        const hint = !talking && !walking && now - idleSince >= HINT_AFTER * 1000

        let next: SceneState = { ...s, x, depth, facing, walking, camera, mitthuX, target, targetDepth, pending, fx, shake, idleSince, hint }

        // Arrived at a tapped hotspot: open it.
        if (pending && target === null && targetDepth === null) {
          const h = find(pending)
          next = { ...next, pending: null }
          if (h && Math.abs(h.x - x) <= PROMPT_RADIUS) next = open(next, h)
        }
        return sameAs(s, next) ? s : next
      }

      case 'walkTo':
        if (s.dialogue) return s
        return {
          ...s,
          target: action.x,
          targetDepth: action.depth === undefined ? null : clampDepth(action.depth),
          pending: null,
          idleSince: null,
          hint: false,
        }

      case 'use': {
        const h = find(action.hotspotId)
        if (!h || s.dialogue) return s
        if (Math.abs(h.x - s.x) <= PROMPT_RADIUS) return open(s, h)
        // Walk beside it, and to about the same distance from the viewer, so the two stand together.
        return { ...s, target: besideSpot(h, s.x), targetDepth: standDepth(h), pending: h.id, idleSince: null, hint: false }
      }

      case 'jumpTo': {
        const h = find(action.hotspotId)
        if (!h || s.dialogue || !isHotspotVisible(h, s.story.flags)) return s
        // Stand beside it, then open it.
        const x = besideSpot(h, s.x)
        return open({ ...s, x, depth: standDepth(h), mitthuX: x - MITTHU_DISTANCE, target: null, targetDepth: null, pending: null }, h)
      }

      case 'interactNearby': {
        if (s.dialogue) return s
        const h = nearbyHotspot(scene, s.x, s.story.flags)
        return h ? open(s, h) : s
      }

      case 'next': {
        if (!s.dialogue) return s
        const result = advance(scene, s.dialogue, s.story)
        if (!result.dialogue) return finishDialogue(s, result.story)
        return withFx({ ...s, dialogue: result.dialogue, story: result.story }, result.dialogue.nodeId)
      }

      case 'back': {
        if (!s.dialogue) return s
        const dialogue = goBack(scene, s.dialogue)
        return dialogue === s.dialogue ? s : { ...s, dialogue }
      }

      case 'choose': {
        if (!s.dialogue) return s
        const result = choose(scene, s.dialogue, action.index, s.story)
        return withFx({ ...s, dialogue: result.dialogue, story: result.story, idleSince: null, hint: false }, result.dialogue.nodeId)
      }

      case 'activity':
        return s.idleSince === null && !s.hint ? s : { ...s, idleSince: null, hint: false }
    }
  }
}

/** True when a tick changed nothing visible (so React can skip re-drawing). */
function sameAs(a: SceneState, b: SceneState): boolean {
  return (
    a.x === b.x &&
    a.depth === b.depth &&
    a.facing === b.facing &&
    a.walking === b.walking &&
    Math.abs(a.camera - b.camera) < 0.05 &&
    Math.abs(a.mitthuX - b.mitthuX) < 0.05 &&
    a.target === b.target &&
    a.targetDepth === b.targetDepth &&
    a.pending === b.pending &&
    a.fx === b.fx &&
    a.shake === b.shake &&
    a.idleSince === b.idleSince &&
    a.hint === b.hint &&
    a.dialogue === b.dialogue
  )
}
