// School: look-development backdrop (BUILD_PLAN P2), restyled to match the characters (D-026).
// Golden hour, sun low on the right. Same rules as the characters:
//   - an ink outline on every near shape (thinner further back, none on the distant hills),
//   - "cel" shading: flat lit colours with hard-edged shadow shapes, no soft gradients on objects,
//   - deeper, richer colours, with distant layers fading into the warm haze.
//
// Layers (back to front): sky 0.05 · far hills 0.15 · town 0.4 · trees 0.65 ·
// school and courtyard 1 (the stage) · light 0 (fixed, in front) · foreground leaves 1.35.

import { GROUND_Y, SCENE_HEIGHT, type LayerArt, type PropArt } from './types'
import './school.css'

const H = SCENE_HEIGHT
const HAZE = '#f0b97c' // the warm air colour that distant things fade into
const INK = '#3a2230' // outline colour, the same dark plum as the characters' shadows
const SHADE = '#4a2f52' // shadow tint mixed into lit colours

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

/** The shadow version of a lit colour (cool and darker, like the characters' cel shadows). */
const shadow = (c: string, k = 0.32) => mixHex(c, SHADE, k)
/** Outline props. `w` is in scene units (the stage uses 3; layers further back use less). */
const ink = (w: number, color = INK) => ({ stroke: color, strokeWidth: w, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const })

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
          <stop offset="0" stopColor="#5f7fa6" />
          <stop offset="0.32" stopColor="#c99a9a" />
          <stop offset="0.58" stopColor="#f2a067" />
          <stop offset="0.8" stopColor="#ffc27a" />
          <stop offset="1" stopColor="#ffd59a" />
        </linearGradient>
        <radialGradient id="sch-sun" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#fff6dc" stopOpacity="1" />
          <stop offset="0.18" stopColor="#ffe0a0" stopOpacity="0.9" />
          <stop offset="0.5" stopColor="#ffb866" stopOpacity="0.35" />
          <stop offset="1" stopColor="#ffa95a" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width={width} height={H} fill="url(#sch-sky)" />
      <circle cx={sunX} cy="610" r="460" fill="url(#sch-sun)" />
      <circle cx={sunX} cy="610" r="58" fill="#fff3d4" />
      {/* Cel clouds: flat shapes with a hard lit edge underneath, facing the sun. */}
      {Array.from({ length: Math.ceil(width / 500) }, (_, i) => {
        const x = i * 500 + r() * 300
        const y = 150 + r() * 220
        const w = 180 + r() * 220
        const body = `M${x - w} ${y + 10} C${x - w * 0.8} ${y - 22} ${x - w * 0.4} ${y - 30} ${x - w * 0.15} ${y - 18} C${x} ${y - 46} ${x + w * 0.5} ${y - 40} ${x + w * 0.6} ${y - 16} C${x + w * 0.85} ${y - 22} ${x + w} ${y - 6} ${x + w} ${y + 10} Z`
        return (
          <g key={i} opacity="0.9">
            <path d={body} fill="#f4c7b0" />
            <path d={`M${x - w} ${y + 10} L${x + w} ${y + 10} C${x + w * 0.7} ${y + 2} ${x - w * 0.5} ${y} ${x - w} ${y + 10} Z`} fill="#ffd79a" />
            <path d={`M${x - w * 0.7} ${y - 8} C${x - w * 0.3} ${y - 14} ${x + w * 0.2} ${y - 10} ${x + w * 0.5} ${y - 4}`} stroke="#c98f98" strokeWidth="3" fill="none" opacity="0.6" />
          </g>
        )
      })}
      {/* Birds crossing the sky (ambient life; stops in calm mode). */}
      <g className="sch-birds" fill="none" stroke={INK} strokeWidth="3.5" strokeLinecap="round" opacity="0.75">
        {[0, 1, 2].map((i) => (
          <path key={i} d={`M${120 + i * 46} ${260 + (i % 2) * 22} q12 -12 24 0 q12 -12 24 0`} />
        ))}
      </g>
    </svg>
  )
}

// ---------------------------------------------------------------- far hills (no outlines: lost in the haze)

const Far: LayerArt = ({ width }) => {
  const r = seeded(21)
  const hill = mixHex('#9b6f7c', HAZE, 0.42)
  const hill2 = mixHex('#86606f', HAZE, 0.3)
  const points = Array.from({ length: Math.ceil(width / 240) + 2 }, (_, i) => [i * 240, 600 + r() * 60] as const)
  const ridge = points.map(([x, y], i) => (i === 0 ? `M${x} ${y}` : `Q${x - 120} ${y - 40} ${x} ${y}`)).join(' ')
  return (
    <svg {...svgProps(width)}>
      <path d={`${ridge} L${width} ${H} L0 ${H} Z`} fill={hill} />
      <path d={`M0 690 ${points.map(([x, y]) => `Q${x + 120} ${y + 30} ${x + 240} ${y + 70}`).join(' ')} L${width} ${H} L0 ${H} Z`} fill={hill2} />
      {/* A temple spire and a water tank on the horizon. */}
      <path d={`M${width * 0.28} 680 L${width * 0.28 + 30} 580 L${width * 0.28 + 38} 556 L${width * 0.28 + 46} 580 L${width * 0.28 + 76} 680 Z`} fill={hill2} />
      <rect x={width * 0.62} y="560" width="70" height="40" rx="6" fill={hill2} />
      <path d={`M${width * 0.62 + 10} 600 L${width * 0.62} 700 M${width * 0.62 + 60} 600 L${width * 0.62 + 70} 700`} stroke={hill2} strokeWidth="6" />
    </svg>
  )
}

// ---------------------------------------------------------------- town houses (thin, hazy outlines)

const PLASTER = ['#e9b678', '#d99c8c', '#b9c3ad', '#e4c08f', '#d08e5f', '#b8a9c6', '#e8cf9f']

const Town: LayerArt = ({ width }) => {
  const count = Math.ceil(width / 230) + 1
  const line = ink(1.6, mixHex(INK, HAZE, 0.45))
  return (
    <svg {...svgProps(width)}>
      {Array.from({ length: count }, (_, i) => {
        const r = seeded(100 + i)
        const w = 150 + r() * 110
        const h = 150 + r() * 170
        const x = i * 230 + r() * 40
        const base = 780
        const wall = mixHex(PLASTER[Math.floor(r() * PLASTER.length)] as string, HAZE, 0.28)
        return (
          <g key={i}>
            <rect x={x} y={base - h} width={w} height={h} fill={wall} {...line} />
            {/* Left face in hard shadow (the sun is on the right). */}
            <rect x={x} y={base - h} width={w * 0.2} height={h} fill={shadow(wall, 0.28)} {...line} />
            <rect x={x - 4} y={base - h - 12} width={w + 8} height="14" fill={mixHex(wall, '#fff3d8', 0.3)} {...line} />
            {r() > 0.4 && <rect x={x + w * 0.6} y={base - h - 48} width="40" height="36" rx="5" fill={mixHex('#46424a', HAZE, 0.35)} {...line} />}
            {Array.from({ length: Math.floor(w / 55) }, (_, j) => (
              <rect key={j} x={x + 22 + j * 55} y={base - h + 40} width="22" height="30" rx="10" fill={r() > 0.7 ? '#ffc56e' : mixHex('#5d4650', HAZE, 0.2)} {...line} />
            ))}
          </g>
        )
      })}
    </svg>
  )
}

// ---------------------------------------------------------------- trees

/** A neem tree: outlined leaf clusters in three hard-edged tones, lit from the right. */
function Neem({ x, base, size, seed, haze = 0, line = 3 }: { x: number; base: number; size: number; seed: number; haze?: number; line?: number }) {
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

const Trees: LayerArt = ({ width }) => (
  <svg {...svgProps(width)}>
    {Array.from({ length: Math.ceil(width / 620) + 1 }, (_, i) => (
      <Neem key={i} x={i * 620 + 180} base={820} size={230} seed={300 + i} haze={0.2} line={2} />
    ))}
  </svg>
)

// ---------------------------------------------------------------- the school and courtyard (stage, speed 1)

// The building is sized for the characters (a child is 400 units tall): doors are taller than a child.
const SCHOOL = { left: 900, right: 2700, top: 190, base: 860 }
const WALL = '#eab36a' // painted plaster, deep ochre
const TRIM = '#a8401f' // terracotta
const DOOR = '#2c6a94' // classic blue doors and window frames
const LINE = 3

const School: LayerArt = ({ width }) => {
  const { left, right, top, base } = SCHOOL
  const arches = 9
  const bay = (right - left) / arches
  const o = ink(LINE)
  const wallLit = mixHex(WALL, '#fff0c8', 0.18)
  return (
    <svg {...svgProps(width)}>
      {/* Courtyard ground: flat earth with a hard band of shadow near the building, and paving strips. */}
      <rect y={base - 10} width={width} height={H - base + 10} fill="#d49559" />
      <rect y={base - 10} width={width} height="34" fill={shadow('#d49559', 0.22)} />
      {Array.from({ length: Math.ceil(width / 120) }, (_, i) => (
        <rect key={i} x={i * 120} y={GROUND_Y + 26} width="96" height="12" rx="3" fill="#b5703f" {...ink(2, shadow('#b5703f', 0.5))} />
      ))}

      {/* Boundary wall with a painted strip and marigold plants, and the gate pillars. */}
      <rect x="0" y="640" width="700" height={base - 640} fill={WALL} {...o} />
      <rect x="0" y="640" width="700" height="40" fill={shadow(WALL, 0.25)} />
      <rect x="-4" y="626" width="708" height="18" fill={TRIM} {...o} />
      {Array.from({ length: 7 }, (_, i) => (
        <g key={i}>
          <path d={`M${60 + i * 95} 780 L${60 + i * 95} 842`} stroke="#4f7a3c" strokeWidth="7" />
          <circle cx={60 + i * 95} cy="770" r="22" fill="#e8962d" {...o} />
          <path d={`M${50 + i * 95} 760 a14 14 0 0 1 22 2`} stroke="#ffd27a" strokeWidth="5" fill="none" />
        </g>
      ))}
      {[700, 845].map((x) => (
        <g key={x}>
          <rect x={x} y="540" width="64" height={base - 540} fill={wallLit} {...o} />
          <rect x={x} y="540" width="22" height={base - 540} fill={shadow(WALL, 0.3)} />
          <rect x={x - 8} y="524" width="80" height="22" fill={TRIM} {...o} />
          <path d={`M${x + 8} 524 L${x + 32} 496 L${x + 56} 524 Z`} fill={TRIM} {...o} />
        </g>
      ))}

      {/* The school building: an arched veranda under a parapet. */}
      <rect x={left} y={top} width={right - left} height={base - top} fill={WALL} {...o} />
      {/* The shaded left end and the band of shade under the roof edge (hard cel shadows). */}
      <rect x={left} y={top} width="70" height={base - top} fill={shadow(WALL, 0.3)} />
      <rect x={left} y={top + 22} width={right - left} height="40" fill={shadow(WALL, 0.22)} />
      <rect x={left - 14} y={top - 22} width={right - left + 28} height="26" fill={mixHex(WALL, '#fff6e0', 0.35)} {...o} />
      <rect x={left} y={top + 4} width={right - left} height="16" fill={TRIM} {...o} />
      {/* Jaali lattice along the parapet. */}
      {Array.from({ length: Math.floor((right - left) / 40) }, (_, i) => (
        <rect key={i} x={left + 14 + i * 40} y={top + 32} width="16" height="16" rx="3" fill={shadow(WALL, 0.55)} />
      ))}
      {Array.from({ length: arches }, (_, i) => {
        const x = left + i * bay
        const ax = x + bay * 0.14
        const aw = bay * 0.72
        const atop = top + 130
        const archPath = `M${ax} ${base - 22} L${ax} ${atop + aw / 2} A${aw / 2} ${aw / 2} 0 0 1 ${ax + aw} ${atop + aw / 2} L${ax + aw} ${base - 22} Z`
        const doorTop = atop + aw * 0.62
        return (
          <g key={i}>
            <path d={archPath} fill="#4a3530" {...o} />
            {/* Low sun from the right lights the back wall inside the arch, past the left pillar's shadow. */}
            <path d={`M${ax + aw * 0.45} ${base - 22} L${ax + aw * 0.62} ${atop + aw * 0.2} A${aw / 2} ${aw / 2} 0 0 1 ${ax + aw} ${atop + aw / 2} L${ax + aw} ${base - 22} Z`} fill="#7a5544" />
            {/* A blue classroom door or window inside every other arch. */}
            {i % 2 === 0 ? (
              <g>
                <rect x={ax + aw * 0.2} y={doorTop} width={aw * 0.6} height={base - 22 - doorTop} rx="4" fill={DOOR} {...o} />
                <rect x={ax + aw * 0.2} y={doorTop} width={aw * 0.22} height={base - 22 - doorTop} fill={shadow(DOOR, 0.35)} />
                <path d={`M${ax + aw * 0.5} ${doorTop} L${ax + aw * 0.5} ${base - 22}`} {...ink(2)} />
                <circle cx={ax + aw * 0.56} cy={(doorTop + base) / 2} r="4" fill="#e8c26a" />
              </g>
            ) : (
              <g>
                <rect x={ax + aw * 0.16} y={doorTop} width={aw * 0.68} height={aw * 0.8} rx="4" fill={DOOR} {...o} />
                <rect x={ax + aw * 0.24} y={doorTop + 10} width={aw * 0.52} height={aw * 0.8 - 20} fill="#ffcc7e" {...ink(2)} />
                <path d={`M${ax + aw * 0.5} ${doorTop + 10} L${ax + aw * 0.5} ${doorTop + aw * 0.8 - 10} M${ax + aw * 0.24} ${doorTop + aw * 0.4} L${ax + aw * 0.76} ${doorTop + aw * 0.4}`} {...ink(3, DOOR)} />
                <rect x={ax + aw * 0.1} y={doorTop + aw * 0.8} width={aw * 0.8} height="10" fill={mixHex(WALL, '#fff6e0', 0.3)} {...ink(2)} />
              </g>
            )}
            {/* Pillar: lit right face, hard shadow on the left face. */}
            <rect x={x + bay * 0.86} y={atop - 20} width={bay * 0.07} height={base - atop - 2} fill={mixHex(WALL, '#fff3cf', 0.45)} />
          </g>
        )
      })}
      {/* Plinth and veranda step. */}
      <rect x={left - 20} y={base - 22} width={right - left + 40} height="26" fill="#c99a68" {...o} />
      <rect x={left - 30} y={base} width={right - left + 60} height="12" fill={shadow('#c99a68', 0.3)} {...o} />

      {/* Name board (the words on it are just strokes: no text in art). */}
      <rect x={(left + right) / 2 - 220} y={top + 56} width="440" height="70" rx="6" fill="#2e6a4c" {...o} />
      <rect x={(left + right) / 2 - 220} y={top + 106} width="440" height="20" fill={shadow('#2e6a4c', 0.35)} />
      {[0, 1].map((row) => (
        <rect key={row} x={(left + right) / 2 - 170 + row * 30} y={top + 72 + row * 22} width={340 - row * 60} height="9" rx="4" fill="#f1e8d2" />
      ))}

      {/* A marigold garland across the front. */}
      {Array.from({ length: 4 }, (_, k) => {
        const x0 = left + 120 + k * 420
        return (
          <g key={k}>
            {Array.from({ length: 15 }, (_, j) => {
              const t = j / 14
              const gx = x0 + t * 380
              const gy = top + 170 + Math.sin(t * Math.PI) * 70
              return (
                <g key={j}>
                  <circle cx={gx} cy={gy} r="13" fill={j % 3 === 0 ? '#c9501a' : '#f0a12a'} {...ink(2)} />
                  <circle cx={gx + 3} cy={gy - 4} r="5" fill={j % 3 === 0 ? '#ec7a3a' : '#ffd36a'} />
                </g>
              )
            })}
          </g>
        )
      })}

      {/* Tulsi planters at both ends of the veranda. */}
      {[left + 30, right - 150].map((x) => (
        <g key={x}>
          <path d={`M${x} ${base - 22} L${x + 14} ${base - 150} L${x + 106} ${base - 150} L${x + 120} ${base - 22} Z`} fill={TRIM} {...o} />
          <path d={`M${x} ${base - 22} L${x + 14} ${base - 150} L${x + 44} ${base - 150} L${x + 36} ${base - 22} Z`} fill={shadow(TRIM, 0.35)} />
          <rect x={x + 6} y={base - 164} width="108" height="18" rx="4" fill={mixHex(TRIM, '#ffffff', 0.2)} {...o} />
          <circle cx={x + 60} cy={base - 205} r="50" fill="#3f6a33" {...o} />
          <circle cx={x + 76} cy={base - 218} r="24" fill="#93a64f" />
        </g>
      ))}

      {/* A big neem with a stone bench on the right. */}
      <Neem x={3080} base={base} size={290} seed={777} line={LINE} />
      <rect x="3150" y={base - 110} width="260" height="28" rx="6" fill="#b9a585" {...o} />
      <rect x="3150" y={base - 90} width="260" height="8" fill={shadow('#b9a585', 0.3)} />
      <rect x="3170" y={base - 82} width="26" height="82" fill={shadow('#b9a585', 0.25)} {...o} />
      <rect x="3364" y={base - 82} width="26" height="82" fill={shadow('#b9a585', 0.25)} {...o} />

      {/* Long evening shadows with hard edges, cast to the left (the sun is low on the right). */}
      <g fill={SHADE} opacity="0.22">
        {Array.from({ length: arches + 1 }, (_, i) => {
          const x = left + i * (right - left) / arches
          return <path key={i} d={`M${x} ${base + 12} L${x + 22} ${base + 12} L${x - 160} ${H} L${x - 214} ${H} Z`} />
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
          <stop offset="0" stopColor="#4a3a7a" stopOpacity="0.18" />
          <stop offset="0.55" stopColor="#ffb766" stopOpacity="0" />
          <stop offset="1" stopColor="#ffa850" stopOpacity="0.2" />
        </linearGradient>
        <linearGradient id="sch-shaft" x1="1" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff2cf" stopOpacity="0.5" />
          <stop offset="1" stopColor="#fff2cf" stopOpacity="0" />
        </linearGradient>
        <filter id="sch-shaft-blur" x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation="18" />
        </filter>
        <radialGradient id="sch-vignette" cx="0.5" cy="0.45" r="0.75">
          <stop offset="0.6" stopColor="#2a160c" stopOpacity="0" />
          <stop offset="1" stopColor="#2a160c" stopOpacity="0.3" />
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
              opacity={0.26 + i * 0.07}
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

// ---------------------------------------------------------------- foreground leaves (nearest, out of focus)

const Foreground: LayerArt = ({ width }) => (
  <svg {...svgProps(width)}>
    <defs>
      <filter id="sch-blur-near">
        <feGaussianBlur stdDeviation="4" />
      </filter>
    </defs>
    <g filter="url(#sch-blur-near)" opacity="0.95">
      {Array.from({ length: Math.ceil(width / 1700) + 1 }, (_, i) => {
        const r = seeded(500 + i)
        const x = i * 1700 + 200
        return (
          <g key={i}>
            <path d={`M${x - 260} -20 Q${x} 60 ${x + 220} 20`} stroke="#2e1e1e" strokeWidth="16" fill="none" />
            {Array.from({ length: 14 }, (_, j) => (
              <ellipse
                key={j}
                cx={x - 240 + j * 34 + r() * 20}
                cy={30 + Math.sin(j) * 30 + r() * 40}
                rx={34}
                ry={14}
                transform={`rotate(${-30 + r() * 60} ${x - 240 + j * 34} ${40 + Math.sin(j) * 30})`}
                fill={j % 3 ? '#243b22' : '#3d5e2a'}
                {...ink(3, '#1a1416')}
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

// ---------------------------------------------------------------- props (hotspot objects, same style as the stage)

/** The school notice board: a wooden board on two legs with pinned papers (strokes stand in for words). */
const NoticeBoard: PropArt = {
  width: 240,
  height: 340,
  Art: () => (
    <svg viewBox="0 0 240 340" className="size-full">
      <g {...ink(3)}>
        <rect x="40" y="170" width="16" height="168" fill="#5a3f30" />
        <rect x="184" y="170" width="16" height="168" fill="#5a3f30" />
        <rect x="8" y="10" width="224" height="190" rx="6" fill="#7a4f34" />
        <rect x="22" y="24" width="196" height="162" rx="3" fill="#c79a6a" />
      </g>
      {/* Hard cel shadow under the top edge of the frame and on the left leg. */}
      <rect x="22" y="24" width="196" height="16" fill={shadow('#c79a6a', 0.3)} />
      <rect x="40" y="200" width="7" height="136" fill={shadow('#5a3f30', 0.4)} />
      {/* Pinned papers. The big one is the admissions notice, with a drawing of children at a school door. */}
      <g {...ink(2)}>
        <rect x="36" y="40" width="100" height="132" fill="#fbf3e2" />
        <rect x="148" y="48" width="58" height="62" fill="#e8f0f4" transform="rotate(4 177 79)" />
        <rect x="150" y="122" width="54" height="50" fill="#f6dfa8" transform="rotate(-3 177 147)" />
      </g>
      <rect x="48" y="52" width="76" height="9" rx="3" fill="#a8401f" />
      {[72, 84, 96].map((y) => (
        <rect key={y} x="48" y={y} width={y === 96 ? 52 : 76} height="5" rx="2" fill="#8d7a66" />
      ))}
      <path d="M58 160 L58 128 Q72 114 86 128 L86 160 Z" fill={DOOR} {...ink(2)} />
      <circle cx="100" cy="136" r="6" fill="#d6956a" {...ink(1.5)} />
      <path d="M94 160 L95 144 L105 144 L106 160 Z" fill="#e8962d" {...ink(1.5)} />
      <circle cx="116" cy="140" r="5" fill="#a86f4c" {...ink(1.5)} />
      <path d="M111 160 L112 147 L120 147 L121 160 Z" fill="#2c6a94" {...ink(1.5)} />
      {[160, 172, 184].map((y) => (
        <rect key={y} x="156" y={y - 96} width="40" height="4" rx="2" fill="#8d9aa4" />
      ))}
      {[48, 136, 178, 176].map((x, i) => (
        <circle key={i} cx={x} cy={i < 2 ? 46 : i === 2 ? 52 : 126} r="5" fill={i % 2 ? '#c9501a' : '#2e6a4c'} {...ink(1.5)} />
      ))}
    </svg>
  ),
}

/** A signpost pointing back to the town: an arrow and a little house (no words in the art). */
const Signpost: PropArt = {
  width: 180,
  height: 380,
  Art: () => (
    <svg viewBox="0 0 180 380" className="size-full">
      <rect x="82" y="60" width="18" height="318" fill="#6a4632" {...ink(3)} />
      <rect x="82" y="60" width="7" height="318" fill={shadow('#6a4632', 0.4)} />
      <path d="M150 60 L40 60 L8 98 L40 136 L150 136 Z" fill="#2e6a4c" {...ink(3)} />
      <path d="M150 120 L40 120 L32 128 L40 136 L150 136 Z" fill={shadow('#2e6a4c', 0.35)} />
      <path d="M62 112 L62 90 L84 74 L106 90 L106 112 Z" fill="#f1e8d2" {...ink(2)} />
      <rect x="78" y="96" width="12" height="16" fill={TRIM} {...ink(1.5)} />
      <path d="M112 98 L138 98" stroke="#f1e8d2" strokeWidth="6" strokeLinecap="round" />
      <ellipse cx="91" cy="376" rx="40" ry="6" fill={SHADE} opacity="0.25" />
    </svg>
  ),
}

export const schoolProps: Record<string, PropArt> = {
  'school.notice': NoticeBoard,
  'school.signpost': Signpost,
}
