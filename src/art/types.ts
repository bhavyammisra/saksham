import type { ComponentType } from 'react'

// Scene art is plain SVG drawn in design units. Every scene is 1000 units tall,
// with the ground line (where feet stand) at GROUND_Y.
export const SCENE_HEIGHT = 1000
export const GROUND_Y = 900

/** A parallax layer. It must fill `width` x SCENE_HEIGHT. `flags` are the scene's current
 * story flags (including any the host set), so art can change, e.g. lanterns once a building is done. */
export type LayerArt = ComponentType<{ width: number; flags?: ReadonlySet<string> }>

/** An object hotspot's picture: drawn in a `width` x `height` box standing on the ground. */
export interface PropArt {
  width: number
  height: number
  Art: ComponentType
}
