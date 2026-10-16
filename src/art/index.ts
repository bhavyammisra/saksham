// The art registry: maps the `art` keys used in scene JSON to SVG components.
// The engine looks art up here by key, so it never needs to know which scene it is.
// Each scene's art lives in its own file and is added below.

import { dhabaLayers, dhabaProps } from './dhaba'
import { modernLayers } from './modern'
import { sandboxLayers, sandboxProps } from './sandbox'
import { schoolLayers, schoolProps } from './school'
import { townLayers } from './town'
import type { LayerArt, PropArt } from './types'

export const layerArt: Record<string, LayerArt> = {
  ...modernLayers,
  ...sandboxLayers,
  ...schoolLayers,
  ...townLayers,
  ...dhabaLayers,
}

export const propArt: Record<string, PropArt> = {
  ...sandboxProps,
  ...schoolProps,
  ...dhabaProps,
}

export { GROUND_Y, SCENE_HEIGHT } from './types'
export type { LayerArt, PropArt } from './types'
