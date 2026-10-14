// Tiny colour helpers for shading: mix a colour toward white (light) or a dark tone (shadow).

function toRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace('#', ''), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

/** Mixes colour `a` toward colour `b` by `amount` (0 = a, 1 = b). */
export function mix(a: string, b: string, amount: number): string {
  const [r1, g1, b1] = toRgb(a)
  const [r2, g2, b2] = toRgb(b)
  const c = (x: number, y: number) => Math.round(x + (y - x) * amount).toString(16).padStart(2, '0')
  return `#${c(r1, r2)}${c(g1, g2)}${c(b1, b2)}`
}

export const lighten = (hex: string, amount: number) => mix(hex, '#ffffff', amount)
// Warm brown shadow, used by the scene art.
export const darken = (hex: string, amount: number) => mix(hex, '#2a160c', amount)
// Character shadows lean cool (a dark plum), like painted game art: warm light, cool shade.
export const shade = (hex: string, amount: number) => mix(hex, '#2b1d33', amount)
/** Outline colour for a shape: a very dark version of its own colour (never pure black). */
export const ink = (hex: string) => mix(hex, '#160d12', 0.72)
