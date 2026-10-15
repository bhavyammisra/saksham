// Placeholder art for the engine sandbox (/dev/scene). Deliberately plain:
// flat shapes and labels-by-shape, just enough to see every engine feature.

import { GROUND_Y, SCENE_HEIGHT, type LayerArt, type PropArt } from './types'

const Sky: LayerArt = ({ width }) => (
  <svg viewBox={`0 0 ${width} ${SCENE_HEIGHT}`} preserveAspectRatio="none" className="size-full">
    <rect width={width} height={SCENE_HEIGHT} fill="#cfe3e8" />
    <circle cx={width * 0.7} cy="180" r="70" fill="#f6d79a" />
  </svg>
)

const Hills: LayerArt = ({ width }) => {
  const bumps = Math.ceil(width / 400)
  return (
    <svg viewBox={`0 0 ${width} ${SCENE_HEIGHT}`} preserveAspectRatio="none" className="size-full">
      {Array.from({ length: bumps }, (_, i) => (
        <ellipse key={i} cx={i * 400 + 200} cy={GROUND_Y - 40} rx="260" ry="200" fill={i % 2 ? '#9cb88a' : '#8aa878'} />
      ))}
    </svg>
  )
}

const Ground: LayerArt = ({ width }) => (
  <svg viewBox={`0 0 ${width} ${SCENE_HEIGHT}`} preserveAspectRatio="none" className="size-full">
    <rect y={GROUND_Y - 20} width={width} height={SCENE_HEIGHT - GROUND_Y + 20} fill="#d9bc8c" />
    {/* A wall that blocks walking, between x 1900 and 2000. */}
    <rect x="1900" y={GROUND_Y - 260} width="100" height="280" fill="#a97a4f" />
    {Array.from({ length: Math.ceil(width / 200) }, (_, i) => (
      <rect key={i} x={i * 200} y={GROUND_Y + 30} width="100" height="12" fill="#c9a874" />
    ))}
  </svg>
)

const Front: LayerArt = ({ width }) => (
  <svg viewBox={`0 0 ${width} ${SCENE_HEIGHT}`} preserveAspectRatio="none" className="size-full">
    {Array.from({ length: Math.ceil(width / 900) }, (_, i) => (
      <ellipse key={i} cx={i * 900 + 450} cy={SCENE_HEIGHT + 30} rx="160" ry="110" fill="#5f7a4a" opacity="0.85" />
    ))}
  </svg>
)

const Box: PropArt = {
  width: 160,
  height: 120,
  Art: () => (
    <svg viewBox="0 0 160 120" className="size-full">
      <rect y="20" width="160" height="100" rx="6" fill="#b08a5a" />
      <rect x="40" y="2" width="70" height="30" rx="3" fill="#404d8c" />
    </svg>
  ),
}

const Notice: PropArt = {
  width: 140,
  height: 260,
  Art: () => (
    <svg viewBox="0 0 140 260" className="size-full">
      <rect x="64" y="100" width="12" height="160" fill="#6b4528" />
      <rect y="0" width="140" height="110" rx="6" fill="#efe6d4" stroke="#6b4528" strokeWidth="6" />
      <rect x="20" y="25" width="100" height="8" fill="#a99a80" />
      <rect x="20" y="45" width="80" height="8" fill="#a99a80" />
      <rect x="20" y="65" width="90" height="8" fill="#a99a80" />
    </svg>
  ),
}

const Door: PropArt = {
  width: 170,
  height: 320,
  Art: () => (
    <svg viewBox="0 0 170 320" className="size-full">
      <rect width="170" height="320" rx="80" fill="#2f6f73" />
      <circle cx="140" cy="180" r="8" fill="#e8a33d" />
    </svg>
  ),
}

export const sandboxLayers: Record<string, LayerArt> = {
  'sandbox.sky': Sky,
  'sandbox.hills': Hills,
  'sandbox.ground': Ground,
  'sandbox.front': Front,
}

export const sandboxProps: Record<string, PropArt> = {
  'sandbox.box': Box,
  'sandbox.notice': Notice,
  'sandbox.door': Door,
}
