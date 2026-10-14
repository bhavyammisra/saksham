// School: look-development backdrop (BUILD_PLAN P2).
// Golden hour, sun low on the right. One lighting logic for every layer:
// warm light from the right, cool violet-grey shadow on the left, haze with distance.
//
// Layers (back to front): sky 0.05 · far hills 0.15 · town 0.4 · trees 0.65 ·
// school and courtyard 1 (the stage) · light 0 (fixed, in front) · foreground leaves 1.35.

import { GROUND_Y, SCENE_HEIGHT, type LayerArt } from './types'
import './school.css'

const H = SCENE_HEIGHT
const HAZE = '#f1c992' // the warm air colour that distant things fade into

/** Small seeded random numbers, so the same scene always looks the same. */
function seeded(seed: number) {
  let s = seed | 0
  return () => {
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function mixHex(a: string, b: string, k: number) {
  const pa = parseInt(a.slice(1), 16)
  const pb = parseInt(b.slice(1), 16)
  const ch = (shift: number) => Math.round(((pa >> shift) & 255) * (1 - k) + ((pb >> shift) & 255) * k)
  return `#${((ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).padStart(6, '0')}`
}

const svgProps = (width: number) => ({
  viewBox: `0 0 ${width} ${H}`,
  preserveAspectRatio: 'none',
  className: 'size-full',
})

// ---------------------------------------------------------------- sky

const Sky: LayerArt = ({ width }) => {
  const sunX = width * 0.82
  const r = seeded(7)
  return (
    <svg {...svgProps(width)}>
      <defs>
        <linearGradient id="sch-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#a9b9c4" />
          <stop offset="0.38" stopColor="#dccbb0" />
          <stop offset="0.66" stopColor="#f2bf7f" />
          <stop offset="0.82" stopColor="#f6c98d" />
          <stop offset="1" stopColor="#f3d2a0" />
        </linearGradient>
        <filter id="sch-blur-cloud" x="-20%" y="-50%" width="140%" height="200%">
          <feGaussianBlur stdDeviation="9" />
        </filter>
        <radialGradient id="sch-sun" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#fff6dc" stopOpacity="1" />
          <stop offset="0.18" stopColor="#ffe3a3" stopOpacity="0.9" />
          <stop offset="0.5" stopColor="#ffc777" stopOpacity="0.35" />
          <stop offset="1" stopColor="#ffbb6a" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width={width} height={H} fill="url(#sch-sky)" />
      <circle cx={sunX} cy="610" r="460" fill="url(#sch-sun)" />
      <circle cx={sunX} cy="610" r="58" fill="#fff3d4" />
      {/* Long, thin evening clouds, lit underneath. */}
      {Array.from({ length: Math.ceil(width / 500) }, (_, i) => {
        const x = i * 500 + r() * 300
        const y = 150 + r() * 220
        const w = 180 + r() * 220
        return (
          <g key={i} filter="url(#sch-blur-cloud)" opacity="0.8">
            {[0, 1, 2, 3].map((k) => (
              <ellipse key={k} cx={x + (k - 1.5) * w * 0.4} cy={y - (k % 2) * 10} rx={w * (0.35 + (k % 2) * 0.15)} ry={16 + (k % 3) * 6} fill="#f7e6cc" opacity="0.55" />
            ))}
            <ellipse cx={x + 10} cy={y + 14} rx={w * 0.9} ry={8} fill="#f2b06a" opacity="0.5" />
          </g>
        )
      })}
      {/* Birds crossing the sky (ambient life; stops in calm mode). */}
      <g className="sch-birds" fill="none" stroke="#5a4636" strokeWidth="3" strokeLinecap="round" opacity="0.7">
        {[0, 1, 2].map((i) => (
          <path key={i} d={`M${120 + i * 46} ${260 + (i % 2) * 22} q12 -12 24 0 q12 -12 24 0`} />
        ))}
      </g>
    </svg>
  )
}

// ---------------------------------------------------------------- far hills

const Far: LayerArt = ({ width }) => {
  const r = seeded(21)
  const hill = mixHex('#a88f7e', HAZE, 0.45)
  const hill2 = mixHex('#9a8474', HAZE, 0.35)
  const points = Array.from({ length: Math.ceil(width / 240) + 2 }, (_, i) => [i * 240, 640 + r() * 60] as const)
  const ridge = points.map(([x, y], i) => (i === 0 ? `M${x} ${y}` : `Q${x - 120} ${y - 40} ${x} ${y}`)).join(' ')
  return (
    <svg {...svgProps(width)}>
      <defs>
        <filter id="sch-blur-far" x="-5%" y="-5%" width="110%" height="110%">
          <feGaussianBlur stdDeviation="3" />
        </filter>
      </defs>
      <g filter="url(#sch-blur-far)">
        <path d={`${ridge} L${width} ${H} L0 ${H} Z`} fill={hill} />
        <path d={`M0 720 ${points.map(([x, y]) => `Q${x + 120} ${y + 30} ${x + 240} ${y + 70}`).join(' ')} L${width} ${H} L0 ${H} Z`} fill={hill2} />
        {/* A temple spire and a water tank on the horizon. */}
        <path d={`M${width * 0.28} 700 L${width * 0.28 + 30} 610 L${width * 0.28 + 38} 590 L${width * 0.28 + 46} 610 L${width * 0.28 + 76} 700 Z`} fill={hill2} />
        <rect x={width * 0.62} y="600" width="70" height="40" rx="6" fill={hill2} />
        <path d={`M${width * 0.62 + 10} 640 L${width * 0.62} 720 M${width * 0.62 + 60} 640 L${width * 0.62 + 70} 720`} stroke={hill2} strokeWidth="6" />
      </g>
    </svg>
  )
}

// ---------------------------------------------------------------- town houses

const PLASTER = ['#e8c79c', '#dbb5a5', '#cdd2c4', '#e6d3b4', '#d7a77f', '#c8c0d2', '#e9dcc0']

const Town: LayerArt = ({ width }) => {
  const count = Math.ceil(width / 230) + 1
  return (
    <svg {...svgProps(width)}>
      <defs>
        <filter id="sch-blur-mid">
          <feGaussianBlur stdDeviation="1.2" />
        </filter>
      </defs>
      <g filter="url(#sch-blur-mid)">
        {Array.from({ length: count }, (_, i) => {
          const r = seeded(100 + i)
          const w = 150 + r() * 110
          const h = 130 + r() * 150
          const x = i * 230 + r() * 40
          const base = 790
          const wall = mixHex(PLASTER[Math.floor(r() * PLASTER.length)] as string, HAZE, 0.3)
          const shade = mixHex(wall, '#5d4a5e', 0.22)
          return (
            <g key={i}>
              <rect x={x} y={base - h} width={w} height={h} fill={wall} />
              {/* Left face in shadow (the sun is on the right). */}
              <rect x={x} y={base - h} width={w * 0.18} height={h} fill={shade} opacity="0.6" />
              <rect x={x - 4} y={base - h - 10} width={w + 8} height="12" fill={mixHex(wall, '#ffffff', 0.25)} />
              {r() > 0.4 && <rect x={x + w * 0.6} y={base - h - 46} width="40" height="36" rx="5" fill={mixHex('#3c3a3a', HAZE, 0.35)} />}
              {Array.from({ length: Math.floor(w / 55) }, (_, j) => (
                <rect
                  key={j}
                  x={x + 22 + j * 55}
                  y={base - h + 40}
                  width="22"
                  height="30"
                  rx="10"
                  fill={r() > 0.7 ? '#f6c77d' : mixHex('#6d5a52', HAZE, 0.25)}
                />
              ))}
            </g>
          )
        })}
      </g>
    </svg>
  )
}

// ---------------------------------------------------------------- trees behind the school

function Neem({ x, base, size, seed, haze = 0 }: { x: number; base: number; size: number; seed: number; haze?: number }) {
  const r = seeded(seed)
  const dark = mixHex('#43603a', HAZE, haze)
  const mid = mixHex('#5d7d45', HAZE, haze)
  const lit = mixHex('#a3ad5e', HAZE, haze)
  const blobs = Array.from({ length: 22 }, () => [x + (r() - 0.5) * size * 1.6, base - size * 1.15 - r() * size * 1.0, size * (0.2 + r() * 0.2)] as const)
  return (
    <g>
      <path
        d={`M${x - size * 0.07} ${base} Q${x - size * 0.02} ${base - size * 0.6} ${x - size * 0.12} ${base - size * 1.1} L${x + size * 0.1} ${base - size * 1.1} Q${x + size * 0.06} ${base - size * 0.6} ${x + size * 0.09} ${base} Z`}
        fill={mixHex('#5e4634', HAZE, haze)}
      />
      {blobs.map(([bx, by, br], i) => (
        <circle key={i} cx={bx} cy={by} r={br} fill={dark} />
      ))}
      {blobs.map(([bx, by, br], i) => (
        <circle key={`m${i}`} cx={bx + br * 0.15} cy={by - br * 0.1} r={br * 0.8} fill={mid} />
      ))}
      {/* Warm light on the sun side of each leaf cluster. */}
      {blobs.map(([bx, by, br], i) => (
        <circle key={`l${i}`} cx={bx + br * 0.4} cy={by - br * 0.25} r={br * 0.45} fill={lit} opacity="0.7" />
      ))}
    </g>
  )
}

const Trees: LayerArt = ({ width }) => (
  <svg {...svgProps(width)}>
    {Array.from({ length: Math.ceil(width / 620) + 1 }, (_, i) => (
      <Neem key={i} x={i * 620 + 180} base={830} size={170} seed={300 + i} haze={0.18} />
    ))}
  </svg>
)

// ---------------------------------------------------------------- the school and courtyard (stage, speed 1)

const SCHOOL = { left: 900, right: 2700, top: 520, base: 860 }
const WALL = '#ecca8e' // painted plaster, warm cream-ochre
const TRIM = '#b5532f' // terracotta
const DOOR = '#3d6b8a' // classic blue doors and window frames

const School: LayerArt = ({ width }) => {
  const { left, right, top, base } = SCHOOL
  const arches = 9
  const bay = (right - left) / arches
  return (
    <svg {...svgProps(width)}>
      <defs>
        <linearGradient id="sch-earth" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#dcb57e" />
          <stop offset="1" stopColor="#c38f5a" />
        </linearGradient>
        <linearGradient id="sch-wall" x1="0" y1="0" x2="1" y2="0">
          {/* Cooler on the left, warm where the sun hits on the right. */}
          <stop offset="0" stopColor={mixHex(WALL, '#8f7d8a', 0.25)} />
          <stop offset="0.7" stopColor={WALL} />
          <stop offset="1" stopColor={mixHex(WALL, '#fff0c8', 0.35)} />
        </linearGradient>
        <linearGradient id="sch-arch" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#4f3d33" />
          <stop offset="1" stopColor="#6c5444" />
        </linearGradient>
      </defs>

      {/* Courtyard ground with brick-paved strips. */}
      <rect y={base - 10} width={width} height={H - base + 10} fill="url(#sch-earth)" />
      {Array.from({ length: Math.ceil(width / 120) }, (_, i) => (
        <rect key={i} x={i * 120} y={GROUND_Y + 22} width="96" height="10" rx="3" fill="#b9845a" opacity="0.45" />
      ))}

      {/* Boundary wall with a painted strip, and the gate pillars. */}
      <rect x="0" y="742" width="700" height={base - 742} fill="url(#sch-wall)" />
      <rect x="0" y="734" width="700" height="12" fill={TRIM} />
      {Array.from({ length: 7 }, (_, i) => (
        <g key={i}>
          <circle cx={60 + i * 95} cy="800" r="16" fill="#e8a33d" opacity="0.85" />
          <path d={`M${60 + i * 95} 816 L${60 + i * 95} 840`} stroke="#5f7a4a" strokeWidth="5" />
        </g>
      ))}
      {[700, 845].map((x) => (
        <g key={x}>
          <rect x={x} y="690" width="56" height={base - 690} fill={mixHex(WALL, '#ffffff', 0.15)} />
          <rect x={x - 6} y="680" width="68" height="16" fill={TRIM} />
        </g>
      ))}

      {/* The school building: an arched veranda under a parapet. */}
      <rect x={left} y={top} width={right - left} height={base - top} fill="url(#sch-wall)" />
      <rect x={left - 10} y={top - 18} width={right - left + 20} height="22" fill={mixHex(WALL, '#fff6e0', 0.3)} />
      <rect x={left} y={top + 4} width={right - left} height="12" fill={TRIM} />
      {/* Jaali lattice along the parapet. */}
      {Array.from({ length: Math.floor((right - left) / 40) }, (_, i) => (
        <rect key={i} x={left + 14 + i * 40} y={top + 26} width="16" height="16" rx="3" fill={mixHex(WALL, '#7a5a3e', 0.3)} />
      ))}
      {Array.from({ length: arches }, (_, i) => {
        const x = left + i * bay
        const ax = x + bay * 0.14
        const aw = bay * 0.72
        const atop = top + 110
        return (
          <g key={i}>
            <path
              d={`M${ax} ${base - 18} L${ax} ${atop + aw / 2} A${aw / 2} ${aw / 2} 0 0 1 ${ax + aw} ${atop + aw / 2} L${ax + aw} ${base - 18} Z`}
              fill="url(#sch-arch)"
            />
            {/* A blue classroom door or window inside every other arch. */}
            {i % 2 === 0 ? (
              <rect x={ax + aw * 0.28} y={atop + aw * 0.55} width={aw * 0.44} height={base - 18 - atop - aw * 0.55} rx="4" fill={DOOR} />
            ) : (
              <g>
                <rect x={ax + aw * 0.2} y={atop + aw * 0.6} width={aw * 0.6} height={aw * 0.55} rx="4" fill={DOOR} />
                <path d={`M${ax + aw * 0.5} ${atop + aw * 0.6} L${ax + aw * 0.5} ${atop + aw * 1.15}`} stroke="#2a4a60" strokeWidth="5" />
                <rect x={ax + aw * 0.26} y={atop + aw * 0.66} width={aw * 0.48} height={aw * 0.43} fill="#f3c27d" opacity="0.55" />
              </g>
            )}
            {/* Pillar highlight on the sun side. */}
            <rect x={x + bay * 0.86} y={atop - 20} width={bay * 0.06} height={base - atop} fill="#fff1cc" opacity="0.35" />
          </g>
        )
      })}
      {/* Plinth and veranda step. */}
      <rect x={left - 20} y={base - 20} width={right - left + 40} height="24" fill="#c7a77e" />
      <rect x={left - 30} y={base} width={right - left + 60} height="10" fill="#a98a66" />

      {/* Name board (the words on it are just strokes: no text in art). */}
      <rect x={(left + right) / 2 - 190} y={top + 40} width="380" height="62" rx="6" fill="#2f6a4f" />
      {[0, 1].map((row) => (
        <rect key={row} x={(left + right) / 2 - 150 + row * 30} y={top + 56 + row * 20} width={300 - row * 60} height="8" rx="4" fill="#efe6d0" opacity="0.85" />
      ))}

      {/* A marigold garland across the front. */}
      {Array.from({ length: 4 }, (_, k) => {
        const x0 = left + 120 + k * 420
        return (
          <g key={k}>
            {Array.from({ length: 15 }, (_, j) => {
              const t = j / 14
              const gx = x0 + t * 380
              const gy = top + 120 + Math.sin(t * Math.PI) * 60
              return <circle key={j} cx={gx} cy={gy} r="11" fill={j % 3 === 0 ? '#d9611f' : '#f0a92d'} />
            })}
          </g>
        )
      })}

      {/* Tulsi planters at both ends of the veranda. */}
      {[left + 30, right - 110].map((x) => (
        <g key={x}>
          <path d={`M${x} ${base - 20} L${x + 10} ${base - 100} L${x + 70} ${base - 100} L${x + 80} ${base - 20} Z`} fill={TRIM} />
          <circle cx={x + 40} cy={base - 130} r="34" fill="#5f7a4a" />
          <circle cx={x + 52} cy={base - 140} r="16" fill="#8fa35c" />
        </g>
      ))}

      {/* A big neem with a stone bench on the right. */}
      <Neem x={3080} base={base} size={210} seed={777} />
      <rect x="3160" y={base - 60} width="200" height="20" rx="6" fill="#b7a58a" />
      <rect x="3175" y={base - 42} width="18" height="42" fill="#9c8a70" />
      <rect x="3325" y={base - 42} width="18" height="42" fill="#9c8a70" />

      {/* Long evening shadows, cast to the left (the sun is low on the right). */}
      <g fill="#4b3a52" opacity="0.18">
        {Array.from({ length: arches + 1 }, (_, i) => {
          const x = left + i * (right - left) / arches
          return <path key={i} d={`M${x} ${base + 8} L${x + 18} ${base + 8} L${x - 160} ${H} L${x - 210} ${H} Z`} />
        })}
        <path d={`M3050 ${base + 8} L3110 ${base + 8} L2840 ${H} L2700 ${H} Z`} />
      </g>
    </svg>
  )
}

// ---------------------------------------------------------------- light (fixed to the screen, in front)

const Light: LayerArt = ({ width }) => {
  const shafts = 3
  return (
    <svg {...svgProps(width)}>
      <defs>
        <linearGradient id="sch-grade" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#5a4a7a" stopOpacity="0.16" />
          <stop offset="0.55" stopColor="#ffb766" stopOpacity="0" />
          <stop offset="1" stopColor="#ffb05c" stopOpacity="0.18" />
        </linearGradient>
        <linearGradient id="sch-shaft" x1="1" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff2cf" stopOpacity="0.55" />
          <stop offset="1" stopColor="#fff2cf" stopOpacity="0" />
        </linearGradient>
        <filter id="sch-shaft-blur" x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation="18" />
        </filter>
        <radialGradient id="sch-vignette" cx="0.5" cy="0.45" r="0.75">
          <stop offset="0.6" stopColor="#2a160c" stopOpacity="0" />
          <stop offset="1" stopColor="#2a160c" stopOpacity="0.28" />
        </radialGradient>
      </defs>
      <rect width={width} height={H} fill="url(#sch-grade)" />
      <g className="sch-shafts" style={{ mixBlendMode: 'screen' }}>
        {/* Beams fan out from beyond the top-right corner, where the low sun is. */}
        {Array.from({ length: shafts }, (_, i) => {
          const top = width * (0.62 + i * 0.13)
          const spread = 140 + i * 60
          return (
            <path
              key={i}
              d={`M${top} -40 L${top + spread} -40 L${top - width * 0.42 + spread * 2} ${H} L${top - width * 0.42} ${H} Z`}
              fill="url(#sch-shaft)"
              opacity={0.3 + i * 0.08}
              filter="url(#sch-shaft-blur)"
            />
          )
        })}
      </g>
      {/* Dust drifting in the light (ambient life; stops in calm mode). */}
      <g className="sch-dust" fill="#fff4d6">
        {Array.from({ length: 18 }, (_, i) => {
          const r = seeded(900 + i)
          return <circle key={i} cx={r() * width} cy={200 + r() * 650} r={1.5 + r() * 2.5} opacity={0.4 + r() * 0.4} style={{ animationDelay: `${-r() * 12}s` }} />
        })}
      </g>
      <rect width={width} height={H} fill="url(#sch-vignette)" />
    </svg>
  )
}

// ---------------------------------------------------------------- foreground leaves (nearest, blurred)

const Foreground: LayerArt = ({ width }) => (
  <svg {...svgProps(width)}>
    <defs>
      <filter id="sch-blur-near">
        <feGaussianBlur stdDeviation="5" />
      </filter>
    </defs>
    <g filter="url(#sch-blur-near)" opacity="0.92">
      {Array.from({ length: Math.ceil(width / 1700) + 1 }, (_, i) => {
        const r = seeded(500 + i)
        const x = i * 1700 + 200
        return (
          <g key={i}>
            <path d={`M${x - 260} -20 Q${x} 60 ${x + 220} 20`} stroke="#3b2c22" strokeWidth="14" fill="none" />
            {Array.from({ length: 14 }, (_, j) => (
              <ellipse
                key={j}
                cx={x - 240 + j * 34 + r() * 20}
                cy={30 + Math.sin(j) * 30 + r() * 40}
                rx={34}
                ry={14}
                transform={`rotate(${-30 + r() * 60} ${x - 240 + j * 34} ${40 + Math.sin(j) * 30})`}
                fill={j % 3 ? '#2f4628' : '#46632f'}
              />
            ))}
          </g>
        )
      })}
    </g>
  </svg>
)

export const schoolLayers: Record<string, LayerArt> = {
  'school.sky': Sky,
  'school.far': Far,
  'school.town': Town,
  'school.trees': Trees,
  'school.building': School,
  'school.light': Light,
  'school.foreground': Foreground,
}
