// Walking and camera maths for scenes. Pure functions, in scene design units.
// The engine never knows which building it is showing: everything comes from the SceneDef.

import type { SceneDef } from '@content/types'

export const WALK_SPEED = 360 // design units per second
/** How close the player stops to a blocker edge. */
const BLOCKER_GAP = 4

type Walkable = SceneDef['walkable']
type Blocker = NonNullable<SceneDef['blockers']>[number]

/**
 * Moves the player from `x` by `dx`, staying inside the walkable area and
 * never passing through a blocker (a table, a wall). Returns the new x.
 */
export function moveBy(x: number, dx: number, walkable: Walkable, blockers: Blocker[] = []): number {
  let next = Math.min(walkable.maxX, Math.max(walkable.minX, x + dx))
  for (const b of blockers) {
    if (dx > 0 && x <= b.x1 && next > b.x1 - BLOCKER_GAP) next = Math.min(next, b.x1 - BLOCKER_GAP)
    if (dx < 0 && x >= b.x2 && next < b.x2 + BLOCKER_GAP) next = Math.max(next, b.x2 + BLOCKER_GAP)
  }
  // Never move backwards because of a blocker we were already touching.
  return dx > 0 ? Math.max(x, next) : dx < 0 ? Math.min(x, next) : x
}

/** One step of tap-to-walk: moves toward `target` by at most `maxStep`. */
export function moveToward(x: number, target: number, maxStep: number, walkable: Walkable, blockers: Blocker[] = []) {
  const distance = target - x
  if (Math.abs(distance) <= 1) return x
  const dx = Math.sign(distance) * Math.min(Math.abs(distance), maxStep)
  return moveBy(x, dx, walkable, blockers)
}

/** Camera left edge: keeps the player centred, but never shows past the scene's ends. */
export function cameraLeft(playerX: number, viewWidth: number, sceneWidth: number): number {
  if (viewWidth >= sceneWidth) return 0
  return Math.min(sceneWidth - viewWidth, Math.max(0, playerX - viewWidth / 2))
}

/**
 * How far a layer slides for a given camera position. speed 1 = foreground
 * (moves with the camera); smaller = further away (moves less).
 * In calm mode there is no parallax: every layer moves together.
 */
export function layerOffset(camera: number, speed: number, calm: boolean): number {
  return camera * (calm ? 1 : speed)
}

/**
 * Width a layer's art must cover so it never runs out while the camera
 * moves across the whole scene.
 */
export function layerWidth(speed: number, viewWidth: number, sceneWidth: number, calm: boolean): number {
  const s = calm ? 1 : speed
  return Math.ceil(viewWidth + Math.max(0, sceneWidth - viewWidth) * s)
}
