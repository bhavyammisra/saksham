// Shared drawing rules for scene art (D-024, D-026): ink outlines, hard cel shadows,
// deeper colours, and distant things fading into a warm haze. Every scene uses these,
// so the town, the School and later buildings look like one world.

import { SCENE_HEIGHT } from './types'

const H = SCENE_HEIGHT
export const HAZE = '#f0b97c' // the warm air colour that distant things fade into
export const INK = '#3a2230' // outline colour, the same dark plum as the characters' shadows
export const SHADE = '#4a2f52' // shadow tint mixed into lit colours

/** Small seeded random numbers, so the same scene always looks the same. */
export function seeded(seed: number) {
  let s = seed | 0
  return () => {
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function mixHex(a: string, b: string, k: number) {
  const pa = parseInt(a.slice(1), 16)
  const pb = parseInt(b.slice(1), 16)
  const ch = (shift: number) => Math.round(((pa >> shift) & 255) * (1 - k) + ((pb >> shift) & 255) * k)
  return `#${((ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).padStart(6, '0')}`
}

/** The shadow version of a lit colour (cool and darker, like the characters' cel shadows). */
export const shadow = (c: string, k = 0.32) => mixHex(c, SHADE, k)
/** Outline props. `w` is in scene units (the stage uses 3; layers further back use less). */
export const ink = (w: number, color = INK) => ({ stroke: color, strokeWidth: w, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const })

export const svgProps = (width: number) => ({
  viewBox: `0 0 ${width} ${H}`,
  preserveAspectRatio: 'none',
  className: 'size-full',
})

/** A neem tree: outlined leaf clusters in three hard-edged tones, lit from the right. */
export function Neem({ x, base, size, seed, haze = 0, line = 3 }: { x: number; base: number; size: number; seed: number; haze?: number; line?: number }) {
  const r = seeded(seed)
  const outline = ink(line, mixHex(INK, HAZE, haze))
  const dark = mixHex('#2f4f35', HAZE, haze)
  const mid = mixHex('#4f7a3c', HAZE, haze)
  const lit = mixHex('#93a845', HAZE, haze)
  const bark = mixHex('#5a3f30', HAZE, haze)
  const blobs = Array.from({ length: 22 }, () => [x + (r() - 0.5) * size * 1.6, base - size * 1.15 - r() * size * 1.0, size * (0.2 + r() * 0.2)] as const)
  return (
    <g>
      <path
        d={`M${x - size * 0.08} ${base} Q${x - size * 0.02} ${base - size * 0.6} ${x - size * 0.13} ${base - size * 1.1} L${x + size * 0.1} ${base - size * 1.1} Q${x + size * 0.06} ${base - size * 0.6} ${x + size * 0.1} ${base} Z`}
        fill={bark}
        {...outline}
      />
      {/* Shaded left side of the trunk. */}
      <path d={`M${x - size * 0.08} ${base} Q${x - size * 0.02} ${base - size * 0.6} ${x - size * 0.13} ${base - size * 1.1} L${x - size * 0.03} ${base - size * 1.1} Q${x + size * 0.01} ${base - size * 0.6} ${x - size * 0.01} ${base} Z`} fill={shadow(bark, 0.4)} />
      {blobs.map(([bx, by, br], i) => (
        <circle key={i} cx={bx} cy={by} r={br} fill={dark} {...outline} />
      ))}
      {blobs.map(([bx, by, br], i) => (
        <circle key={`m${i}`} cx={bx + br * 0.18} cy={by - br * 0.12} r={br * 0.78} fill={mid} />
      ))}
      {/* Hard-edged light on the sun side of each cluster. */}
      {blobs.map(([bx, by, br], i) => (
        <circle key={`l${i}`} cx={bx + br * 0.46} cy={by - br * 0.32} r={br * 0.34} fill={lit} />
      ))}
    </g>
  )
}

