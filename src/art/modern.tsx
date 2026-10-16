// The shared kit for the modern look (D-035, D-036): sky, drifting clouds, the far distance,
// the ground, and pieces every scene reuses (window bands, trees, bikes, benches, lamps).
//
// Lighting rules, so every scene looks like one world:
//   - the sun is low on the upper left: left faces are lit, shadows fall to the right and towards us,
//   - where a wall meets the ground there is a dark band (ambient occlusion),
//   - the distance fades into a warm grey haze,
//   - colours are a little dark and muted; the grade over the whole picture is in scene.css.
//
// Scene units: 1000 tall. Buildings stand on y = GROUND (830); people walk between 850 and 962.
//
// Scale (D-038): a child is about 300 units tall, so 1 metre is roughly 215 units. A door is
// 400 tall (its top at DOOR_TOP), the ground floor ends at SLAB, and furniture, bikes and lamps
// are drawn at the same scale. The camera shows about the lowest 660 units, so upper floors
// are mostly out of view, as when you stand in a street.

import type { ReactNode } from 'react'
import { seeded } from './style'
import { SCENE_HEIGHT } from './types'

export const GROUND = 830
export const DOOR_TOP = 430 // a door is 400 units tall
export const SLAB = 360 // where the ground floor ends and the first floor begins
const H = SCENE_HEIGHT

/** Scales a piece by `k` around a point on its base, so it stays standing where it was. */
export const scaleAt = (x: number, y: number, k: number) => `translate(${x} ${y}) scale(${k}) translate(${-x} ${-y})`

export const FRAME = '#26292c'
export const LEAF_DARK = '#2f4630'
export const LEAF = '#46623f'
export const LEAF_LIT = '#6f8a55'

/** An SVG that fills a layer `width` x 1000 units. */
export function LayerSvg({ width, children }: { width: number; children: ReactNode }) {
  return (
    <svg viewBox={`0 0 ${width} ${H}`} preserveAspectRatio="none" className="size-full" aria-hidden="true">
      <SharedDefs />
      {children}
    </svg>
  )
}

/** Gradients used by every scene (the same ids in each picture, with the same content). */
function SharedDefs() {
  return (
    <defs>
      <linearGradient id="m-glass" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#8fa6b4" />
        <stop offset="0.35" stopColor="#56697a" />
        <stop offset="1" stopColor="#252e36" />
      </linearGradient>
      <linearGradient id="m-glass-warm" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#c9a77a" />
        <stop offset="0.4" stopColor="#7a5c43" />
        <stop offset="1" stopColor="#2e221b" />
      </linearGradient>
      <linearGradient id="m-ao" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#000000" stopOpacity="0" />
        <stop offset="1" stopColor="#000000" stopOpacity="0.38" />
      </linearGradient>
      <linearGradient id="m-lit" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#ffd9a0" stopOpacity="0.2" />
        <stop offset="0.55" stopColor="#ffd9a0" stopOpacity="0" />
        <stop offset="1" stopColor="#1b2230" stopOpacity="0.22" />
      </linearGradient>
      <radialGradient id="m-lamp">
        <stop offset="0" stopColor="#ffd28a" stopOpacity="0.55" />
        <stop offset="1" stopColor="#ffd28a" stopOpacity="0" />
      </radialGradient>
    </defs>
  )
}

// ---------------------------------------------------------------- sky, clouds, distance

/** The sky, with the glow of the low sun. `evening` is warmer and darker (gentle scenes). */
function Sky({ width, evening = false }: { width: number; evening?: boolean }) {
  const stops = evening ? ['#33405a', '#6d6f86', '#b98f7a', '#e0a77a'] : ['#4d6a82', '#8aa0b0', '#c9bfae', '#e2c39b']
  return (
    <svg viewBox={`0 0 ${width} ${H}`} preserveAspectRatio="none" className="size-full" aria-hidden="true">
      <defs>
        <linearGradient id={evening ? 'm-sky-e' : 'm-sky'} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={stops[0]} />
          <stop offset="0.4" stopColor={stops[1]} />
          <stop offset="0.72" stopColor={stops[2]} />
          <stop offset="0.85" stopColor={stops[3]} />
        </linearGradient>
        <radialGradient id="m-sun" cx="0.1" cy="0.38" r="0.6">
          <stop offset="0" stopColor="#ffe3b3" stopOpacity={evening ? 0.6 : 0.7} />
          <stop offset="1" stopColor="#ffe3b3" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width={width} height={H} fill={`url(#${evening ? 'm-sky-e' : 'm-sky'})`} />
      <rect width={width} height={H} fill="url(#m-sun)" />
    </svg>
  )
}

/**
 * Clouds with soft, uneven edges made from noise. The layer is drawn once and then only
 * slid by the browser (the `drift` layer setting), which stays cheap without a GPU.
 */
function Clouds({ width }: { width: number }) {
  const r = seeded(5)
  const clouds = Array.from({ length: Math.ceil(width / 520) }, (_, i) => ({
    x: i * 520 + r() * 260,
    y: 260 + r() * 260,
    s: 0.8 + r() * 0.7,
  }))
  return (
    <svg viewBox={`0 0 ${width} ${H}`} preserveAspectRatio="none" className="size-full" aria-hidden="true">
      <defs>
        <filter id="m-cloud" x="-20%" y="-40%" width="140%" height="180%">
          <feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="4" seed="7" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="70" xChannelSelector="R" yChannelSelector="G" result="ragged" />
          <feGaussianBlur in="ragged" stdDeviation="9" />
        </filter>
        <linearGradient id="m-cloud-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f6ede0" />
          <stop offset="0.6" stopColor="#d2ccc4" />
          <stop offset="1" stopColor="#8a929b" />
        </linearGradient>
      </defs>
      {clouds.map((c) => (
        <g key={c.x} transform={`translate(${c.x} ${c.y}) scale(${c.s})`} filter="url(#m-cloud)" opacity="0.88">
          <ellipse cx="0" cy="20" rx="170" ry="34" fill="#8a929b" opacity="0.8" />
          <ellipse cx="-60" cy="-6" rx="90" ry="50" fill="url(#m-cloud-body)" />
          <ellipse cx="40" cy="-24" rx="110" ry="66" fill="url(#m-cloud-body)" />
          <ellipse cx="120" cy="2" rx="70" ry="42" fill="url(#m-cloud-body)" />
        </g>
      ))}
    </svg>
  )
}

/** Far away: wooded hills, roofs and treetops, all fading into the haze. */
function Far({ width }: { width: number }) {
  const r = seeded(17)
  const houses: { x: number; w: number; h: number; roof: boolean }[] = []
  for (let x = 0; x < width; ) {
    const w = 80 + r() * 90
    if (r() < 0.55) houses.push({ x, w, h: 50 + r() * 90, roof: r() < 0.6 })
    x += w + r() * 140
  }
  const trees = Array.from({ length: Math.ceil(width / 160) }, (_, i) => ({ x: i * 160 + r() * 120, s: 0.5 + r() * 0.5 }))
  return (
    <svg viewBox={`0 0 ${width} ${H}`} preserveAspectRatio="none" className="size-full" aria-hidden="true">
      <defs>
        <linearGradient id="m-haze" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#c9bfae" stopOpacity="0" />
          <stop offset="1" stopColor="#d4bf9f" stopOpacity="0.7" />
        </linearGradient>
      </defs>
      <path d={hills(width, 700, 60, 3)} fill="#7d8a86" />
      <path d={hills(width, 745, 40, 9)} fill="#6c7a73" />
      {houses.map((h) => (
        <g key={h.x}>
          <rect x={h.x} y={GROUND - 30 - h.h} width={h.w} height={h.h + 30} fill="#8c8f88" />
          {h.roof && <path d={`M${h.x - 8} ${GROUND - 30 - h.h} L${h.x + h.w / 2} ${GROUND - 70 - h.h} L${h.x + h.w + 8} ${GROUND - 30 - h.h} Z`} fill="#7a7671" />}
        </g>
      ))}
      {trees.map((t) => (
        <g key={t.x} transform={`translate(${t.x} ${GROUND}) scale(${t.s})`} fill="#66746c">
          <circle cx="0" cy="-120" r="60" />
          <circle cx="-40" cy="-80" r="44" />
          <circle cx="44" cy="-84" r="46" />
        </g>
      ))}
      <rect y="600" width={width} height={GROUND - 600} fill="url(#m-haze)" />
    </svg>
  )
}

/** A wavy line of hills across `width`. */
function hills(width: number, base: number, amp: number, seed: number) {
  const r = seeded(seed)
  let d = `M0 ${base}`
  for (let x = 0; x <= width + 400; x += 400) d += ` Q${x + 200} ${base - amp * (0.5 + r())} ${x + 400} ${base - amp * r() * 0.6}`
  return `${d} L${width + 400} ${GROUND} L0 ${GROUND} Z`
}

/** A few dark plants at the very front, in front of the people (sparse, so nobody is hidden). */
function Front({ width }: { width: number }) {
  const r = seeded(29)
  const clumps = Array.from({ length: Math.ceil(width / 1400) }, (_, i) => i * 1400 + 300 + r() * 600)
  return (
    <LayerSvg width={width}>
      {clumps.map((x) => (
        <g key={x} fill="#1d2a1e">
          <ellipse cx={x} cy="1000" rx="110" ry="46" />
          <ellipse cx={x + 70} cy="996" rx="70" ry="36" fill="#263726" />
          <ellipse cx={x - 80} cy="1004" rx="60" ry="30" />
        </g>
      ))}
    </LayerSvg>
  )
}

// ---------------------------------------------------------------- ground and pieces

/** Paving from the wall line to the front, in perspective, darker towards us, with a warm pool of light. */
export function Paving({ width, tone = 'concrete' }: { width: number; tone?: 'concrete' | 'earth' }) {
  const [top, bottom, line] = tone === 'earth' ? ['#7d6a55', '#4e4135', '#3e3329'] : ['#8b847a', '#5c564f', '#4d4842']
  return (
    <g>
      <defs>
        <linearGradient id={`m-ground-${tone}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={top} />
          <stop offset="1" stopColor={bottom} />
        </linearGradient>
      </defs>
      <rect y={GROUND} width={width} height={H - GROUND} fill={`url(#m-ground-${tone})`} />
      <g stroke={line} strokeWidth="2.5" opacity={tone === 'earth' ? 0.25 : 0.45}>
        {[848, 872, 904, 946, 998].map((y) => (
          <path key={y} d={`M0 ${y} L${width} ${y}`} />
        ))}
        {tone === 'concrete' &&
          Array.from({ length: Math.ceil(width / 150) + 1 }, (_, i) => {
            const x = i * 150
            return <path key={i} d={`M${x} ${GROUND} L${x + (x % 600) * 0.1 - 30} ${H}`} />
          })}
      </g>
    </g>
  )
}

/** A band of tall windows with dark frames; the glass reflects the sky. `warm` = lit from inside. */
export function WindowBand({ x, y, w, h, panes, warm = false }: { x: number; y: number; w: number; h: number; panes: number; warm?: boolean }) {
  const pane = w / panes
  return (
    <g>
      <rect x={x - 6} y={y - 6} width={w + 12} height={h + 12} fill={FRAME} />
      <rect x={x} y={y} width={w} height={h} fill={warm ? 'url(#m-glass-warm)' : 'url(#m-glass)'} />
      <path d={`M${x + w * 0.12} ${y + h} L${x + w * 0.2} ${y} L${x + w * 0.26} ${y} L${x + w * 0.18} ${y + h} Z`} fill="#ffffff" opacity="0.08" />
      <path d={`M${x + w * 0.55} ${y + h} L${x + w * 0.61} ${y} L${x + w * 0.64} ${y} L${x + w * 0.58} ${y + h} Z`} fill="#ffffff" opacity="0.06" />
      {Array.from({ length: panes - 1 }, (_, i) => (
        <rect key={i} x={x + pane * (i + 1) - 3} y={y} width="6" height={h} fill={FRAME} />
      ))}
      <rect x={x - 6} y={y + h + 6} width={w + 12} height="7" fill="#000000" opacity="0.2" />
    </g>
  )
}

/** Light across a facade (lit on the left, darker on the right) and the dark band at its foot.
 * Use one per box-shaped part of a building, so the light never spills onto the sky. */
export function FacadeLight({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill="url(#m-lit)" />
      <rect x={x} y={GROUND - 40} width={w} height="40" fill="url(#m-ao)" />
    </g>
  )
}

/** The shadow a building of width `w` casts on the ground: to the right and towards us. */
export function CastShadow({ x, w, reach = 70, opacity = 0.24 }: { x: number; w: number; reach?: number; opacity?: number }) {
  return <path d={`M${x} ${GROUND} L${x + w} ${GROUND} L${x + w + reach * 1.6} ${GROUND + reach} L${x + reach * 1.6} ${GROUND + reach} Z`} fill="#000000" opacity={opacity} />
}

/** A leafy tree: a dark crown with a lit side to the upper left, and its shadow on the ground. */
export function Tree({ x, y = GROUND + 10, s = 1 }: { x: number; y?: number; s?: number }) {
  const blobs: [number, number, number][] = [
    [0, -230, 80], [-62, -190, 62], [62, -186, 66], [-30, -150, 60], [40, -140, 58], [-82, -140, 44], [88, -132, 42], [5, -290, 54],
  ]
  return (
    <g transform={`translate(${x} ${y}) scale(${s * 1.75})`}>
      <ellipse cx="80" cy="8" rx="140" ry="20" fill="#000000" opacity="0.24" />
      <path d="M-10 0 L-7 -150 L7 -150 L10 0 Z" fill="#4a3627" />
      <path d="M-2 -120 L-40 -170 M3 -140 L36 -190" stroke="#4a3627" strokeWidth="6" />
      {blobs.map(([bx, by, r]) => (
        <circle key={`d${bx}${by}`} cx={bx} cy={by} r={r} fill={LEAF_DARK} />
      ))}
      {blobs.map(([bx, by, r]) => (
        <circle key={`m${bx}${by}`} cx={bx - r * 0.18} cy={by - r * 0.16} r={r * 0.78} fill={LEAF} />
      ))}
      {blobs.slice(0, 5).map(([bx, by, r]) => (
        <circle key={`l${bx}${by}`} cx={bx - r * 0.38} cy={by - r * 0.34} r={r * 0.42} fill={LEAF_LIT} opacity="0.5" />
      ))}
    </g>
  )
}

export function Bike({ x, y = GROUND - 2 }: { x: number; y?: number }) {
  return (
    <g stroke="#1d2023" strokeWidth="4" fill="none" strokeLinecap="round" transform={scaleAt(x + 31, y, 2.4)}>
      <circle cx={x} cy={y - 20} r="20" />
      <circle cx={x + 62} cy={y - 20} r="20" />
      <path d={`M${x} ${y - 20} L${x + 22} ${y - 48} L${x + 52} ${y - 48} L${x + 62} ${y - 20} M${x + 22} ${y - 48} L${x + 32} ${y - 20} L${x + 52} ${y - 48} M${x + 18} ${y - 56} L${x + 28} ${y - 56} M${x + 50} ${y - 48} L${x + 54} ${y - 60}`} />
    </g>
  )
}

export function Bench({ x, y = GROUND + 30 }: { x: number; y?: number }) {
  return (
    <g transform={scaleAt(x + 100, y + 42, 2.2)}>
      <ellipse cx={x + 120} cy={y + 42} rx="120" ry="12" fill="#000000" opacity="0.28" />
      <rect x={x} y={y} width="200" height="12" rx="3" fill="#a77a52" />
      <rect x={x} y={y + 12} width="200" height="6" fill="#6e4a30" />
      <rect x={x + 12} y={y + 18} width="8" height="24" fill="#2b2e31" />
      <rect x={x + 180} y={y + 18} width="8" height="24" fill="#2b2e31" />
    </g>
  )
}

export function Planter({ x }: { x: number }) {
  return (
    <g transform={scaleAt(x + 60, GROUND + 18, 2.2)}>
      <ellipse cx={x + 90} cy={GROUND + 18} rx="80" ry="10" fill="#000000" opacity="0.25" />
      <rect x={x} y={GROUND - 22} width="120" height="40" fill="#6d6a64" />
      <rect x={x} y={GROUND - 22} width="120" height="8" fill="#85827b" />
      <circle cx={x + 30} cy={GROUND - 32} r="24" fill={LEAF} />
      <circle cx={x + 76} cy={GROUND - 36} r="30" fill={LEAF_DARK} />
      <circle cx={x + 66} cy={GROUND - 44} r="14" fill={LEAF_LIT} opacity="0.7" />
    </g>
  )
}

/** A slim modern street lamp. `lit` adds a warm pool of light (for evening scenes). */
export function Lamp({ x, lit = false }: { x: number; lit?: boolean }) {
  return (
    <g transform={scaleAt(x, GROUND + 10, 2.3)}>
      {lit && <ellipse cx={x + 10} cy={GROUND + 60} rx="190" ry="60" fill="url(#m-lamp)" />}
      <rect x={x - 4} y={GROUND - 330} width="8" height="340" fill="#2b2e31" />
      <rect x={x - 4} y={GROUND - 336} width="60" height="10" rx="3" fill="#2b2e31" />
      <rect x={x + 30} y={GROUND - 328} width="26" height="5" rx="2" fill={lit ? '#ffe2a8' : '#c9c4bb'} />
      <path d={`M${x + 4} ${GROUND + 10} L${x + 90} ${GROUND + 60}`} stroke="#000000" strokeWidth="10" opacity="0.15" />
    </g>
  )
}

/** A fence of thin dark bars on a low concrete wall. */
export function Railing({ x, w }: { x: number; w: number }) {
  return (
    <g transform={`translate(0 ${GROUND}) scale(1 1.6) translate(0 ${-GROUND})`}>
      <rect x={x} y={GROUND - 40} width={w} height="40" fill="#a9a49b" />
      <rect x={x} y={GROUND - 44} width={w} height="6" fill="#bdb8af" />
      <rect x={x} y={GROUND - 170} width={w} height="5" fill="#2b2e31" />
      {Array.from({ length: Math.floor(w / 22) }, (_, i) => (
        <rect key={i} x={x + 8 + i * 22} y={GROUND - 170} width="4" height="128" fill="#2b2e31" />
      ))}
    </g>
  )
}

/** Shapes standing in for words on signs (words in pictures can't be translated). */
export function SignLines({ x, y, w, color = '#ffffff' }: { x: number; y: number; w: number; color?: string }) {
  return (
    <g fill={color}>
      <rect x={x} y={y} width={w} height="7" rx="3" />
      <rect x={x + w * 0.15} y={y + 13} width={w * 0.7} height="5" rx="2.5" opacity="0.7" />
    </g>
  )
}

export const modernLayers = {
  'modern.sky': ({ width }: { width: number }) => <Sky width={width} />,
  'modern.skyEvening': ({ width }: { width: number }) => <Sky width={width} evening />,
  'modern.clouds': Clouds,
  'modern.far': Far,
  'modern.front': Front,
}
