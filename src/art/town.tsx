// The town street (Phase 4): the walkable hub. One golden-hour street with a doorway for each
// building, a calm Help kiosk, street lamps, trees and bunting. Same drawing rules as every
// scene (style.tsx). The sky, hills, houses, light and leaves layers are shared with the School.
//
// The street is deliberately still: an animated element inside this very wide SVG makes the
// browser repaint the whole street every frame. Ambient motion lives in the shared sky and light layers.
//
// Each doorway is drawn centred on the x of its exit hotspot in content/scenes/town.json.
// Keep PLACES in step with those x values.

import type { ReactNode } from 'react'
import { INK, Neem, ink, mixHex, seeded, shadow, svgProps } from './style'
import { GROUND_Y, SCENE_HEIGHT, type LayerArt } from './types'
import './school.css'

const H = SCENE_HEIGHT
const BASE = 880 // where walls meet the pavement
const LINE = 3
const TRIM = '#a8401f'
const DOOR = '#2c6a94'

/** Door centres, matching the exit hotspots in content/scenes/town.json. */
export const PLACES = {
  school: 700,
  dhaba: 1550,
  home: 2400,
  panchayat: 3250,
  playground: 4100,
  cyberAdda: 4900,
  help: 5650,
}

// ---------------------------------------------------------------- shared pieces

/** An arched doorway: the dark opening, a door (or open), and a step. */
function Doorway({ x, w = 150, h = 470, color = DOOR, open = false }: { x: number; w?: number; h?: number; color?: string; open?: boolean }) {
  const top = BASE - h
  const arch = `M${x - w / 2} ${BASE} L${x - w / 2} ${top + w / 2} A${w / 2} ${w / 2} 0 0 1 ${x + w / 2} ${top + w / 2} L${x + w / 2} ${BASE} Z`
  return (
    <g>
      <path d={arch} fill="#3d2a2c" {...ink(LINE)} />
      {open ? (
        // Warm light from inside, falling on the floor.
        <path d={`M${x - w / 2 + 10} ${BASE} L${x - w / 4} ${top + w * 0.7} L${x + w / 4} ${top + w * 0.7} L${x + w / 2 - 10} ${BASE} Z`} fill="#ffcf7e" opacity="0.55" />
      ) : (
        <g>
          <rect x={x - w / 2 + 14} y={top + w / 2} width={w - 28} height={h - w / 2 - 6} fill={color} {...ink(LINE)} />
          <rect x={x - w / 2 + 14} y={top + w / 2} width={(w - 28) * 0.35} height={h - w / 2 - 6} fill={shadow(color, 0.35)} />
          <path d={`M${x} ${top + w / 2} L${x} ${BASE - 6}`} {...ink(2)} />
          <circle cx={x + 12} cy={BASE - h * 0.38} r="5" fill="#e8c26a" {...ink(1.5)} />
        </g>
      )}
      <rect x={x - w / 2 - 14} y={BASE - 6} width={w + 28} height="16" fill="#c99a68" {...ink(LINE)} />
    </g>
  )
}

/** A plastered building block with a lit right face and a shaded left edge. */
function Block({ x, w, h, color, roof = TRIM, children }: { x: number; w: number; h: number; color: string; roof?: string; children?: ReactNode }) {
  const left = x - w / 2
  const top = BASE - h
  return (
    <g>
      <rect x={left} y={top} width={w} height={h} fill={color} {...ink(LINE)} />
      <rect x={left} y={top} width={w * 0.12} height={h} fill={shadow(color, 0.3)} />
      <rect x={left} y={top + 18} width={w} height="34" fill={shadow(color, 0.18)} />
      <rect x={left - 12} y={top - 18} width={w + 24} height="22" fill={roof} {...ink(LINE)} />
      {children}
    </g>
  )
}

/** A signboard: a coloured board with strokes standing in for words (there is no text in art). */
function Sign({ x, y, w, color }: { x: number; y: number; w: number; color: string }) {
  return (
    <g>
      <rect x={x - w / 2} y={y} width={w} height="62" rx="6" fill={color} {...ink(LINE)} />
      <rect x={x - w / 2} y={y + 44} width={w} height="18" fill={shadow(color, 0.35)} />
      <rect x={x - w * 0.36} y={y + 16} width={w * 0.72} height="9" rx="4" fill="#f1e8d2" />
      <rect x={x - w * 0.26} y={y + 32} width={w * 0.52} height="7" rx="3" fill="#f1e8d2" opacity="0.8" />
    </g>
  )
}

function Window({ x, y, w = 70, h = 90, lit = false }: { x: number; y: number; w?: number; h?: number; lit?: boolean }) {
  return (
    <g>
      <rect x={x - w / 2} y={y} width={w} height={h} rx="4" fill={lit ? '#ffcc7e' : '#5d4650'} {...ink(LINE)} />
      <path d={`M${x} ${y} L${x} ${y + h} M${x - w / 2} ${y + h / 2} L${x + w / 2} ${y + h / 2}`} {...ink(3, DOOR)} />
      <rect x={x - w / 2 - 8} y={y + h} width={w + 16} height="10" fill="#f1e8d2" {...ink(2)} />
    </g>
  )
}

function Lamp({ x }: { x: number }) {
  return (
    <g>
      <rect x={x - 6} y={BASE - 420} width="12" height="430" fill="#3d3a3a" {...ink(2)} />
      <path d={`M${x} ${BASE - 420} Q${x + 40} ${BASE - 470} ${x + 70} ${BASE - 430}`} fill="none" stroke="#3d3a3a" strokeWidth="9" />
      <path d={`M${x + 52} ${BASE - 432} L${x + 88} ${BASE - 432} L${x + 80} ${BASE - 404} L${x + 60} ${BASE - 404} Z`} fill="#ffd27a" {...ink(2)} />
      <ellipse cx={x + 70} cy={BASE - 400} rx="60" ry="40" fill="#ffd27a" opacity="0.18" />
    </g>
  )
}

// ---------------------------------------------------------------- the buildings

function SchoolGate({ x }: { x: number }) {
  return (
    <g>
      {/* The school behind its compound wall, seen through the gate. */}
      <rect x={x - 380} y={BASE - 560} width="760" height="560" fill="#eab36a" {...ink(LINE)} />
      <rect x={x - 380} y={BASE - 560} width="80" height="560" fill={shadow('#eab36a', 0.3)} />
      <rect x={x - 392} y={BASE - 578} width="784" height="22" fill={TRIM} {...ink(LINE)} />
      {[-260, -130, 130, 260].map((d) => (
        <Window key={d} x={x + d} y={BASE - 470} lit={d === 130} />
      ))}
      <rect x={x - 380} y={BASE - 300} width="760" height="300" fill={mixHex('#eab36a', '#ffffff', 0.12)} {...ink(LINE)} />
      <rect x={x - 392} y={BASE - 312} width="784" height="16" fill={TRIM} {...ink(LINE)} />
      {[x - 110, x + 110].map((px) => (
        <g key={px}>
          <rect x={px - 30} y={BASE - 420} width="60" height="420" fill="#f1d6a4" {...ink(LINE)} />
          <rect x={px - 30} y={BASE - 420} width="20" height="420" fill={shadow('#f1d6a4', 0.3)} />
          <path d={`M${px - 38} ${BASE - 420} L${px} ${BASE - 460} L${px + 38} ${BASE - 420} Z`} fill={TRIM} {...ink(LINE)} />
        </g>
      ))}
      {/* The open gateway: the courtyard and a path, lit by the low sun. */}
      <path d={`M${x - 80} ${BASE} L${x - 80} ${BASE - 380} Q${x} ${BASE - 450} ${x + 80} ${BASE - 380} L${x + 80} ${BASE} Z`} fill="#d49559" {...ink(LINE)} />
      <path d={`M${x - 80} ${BASE - 380} Q${x} ${BASE - 450} ${x + 80} ${BASE - 380} L${x + 80} ${BASE - 250} L${x - 80} ${BASE - 250} Z`} fill="#eab36a" />
      <path d={`M${x - 80} ${BASE - 250} L${x + 80} ${BASE - 250} L${x + 80} ${BASE - 230} L${x - 80} ${BASE - 230} Z`} fill={shadow('#eab36a', 0.3)} />
      <path d={`M${x - 30} ${BASE} L${x - 14} ${BASE - 230} L${x + 14} ${BASE - 230} L${x + 30} ${BASE} Z`} fill="#e9cf9f" />
      <path d={`M${x - 80} ${BASE - 380} Q${x} ${BASE - 450} ${x + 80} ${BASE - 380}`} fill="none" stroke="#3a2230" strokeWidth="10" />
      <Sign x={x} y={BASE - 470} w={200} color="#2e6a4c" />
      <rect x={x - 80} y={BASE - 6} width="160" height="16" fill="#c99a68" {...ink(LINE)} />
    </g>
  )
}

function Dhaba({ x }: { x: number }) {
  return (
    <g>
      <Block x={x} w={560} h={420} color="#e7a36a">
        <Sign x={x} y={BASE - 400} w={260} color="#c9501a" />
      </Block>
      {/* A sloping awning with scalloped edge. */}
      <path d={`M${x - 300} ${BASE - 300} L${x + 300} ${BASE - 300} L${x + 330} ${BASE - 240} L${x - 330} ${BASE - 240} Z`} fill="#c9501a" {...ink(LINE)} />
      {Array.from({ length: 11 }, (_, i) => (
        <path key={i} d={`M${x - 330 + i * 60} ${BASE - 240} q30 26 60 0`} fill={i % 2 ? '#f0a12a' : '#c9501a'} {...ink(2)} />
      ))}
      <Doorway x={x} w={170} h={360} open />
      {/* A clay tandoor and a charpai bench outside. */}
      <path d={`M${x - 250} ${BASE} L${x - 240} ${BASE - 120} Q${x - 200} ${BASE - 150} ${x - 160} ${BASE - 120} L${x - 150} ${BASE} Z`} fill="#b5703f" {...ink(LINE)} />
      <ellipse cx={x - 200} cy={BASE - 124} rx="30" ry="9" fill="#3d2a2c" />
      <rect x={x + 140} y={BASE - 90} width="160" height="22" fill="#c8a06a" {...ink(LINE)} />
      <path d={`M${x + 150} ${BASE - 68} L${x + 150} ${BASE} M${x + 290} ${BASE - 68} L${x + 290} ${BASE}`} {...ink(8, '#6a4632')} />
      <path d={`M${x + 145} ${BASE - 84} L${x + 295} ${BASE - 84}`} stroke="#f1e8d2" strokeWidth="2" strokeDasharray="6 6" />
      <circle cx={x + 230} cy={BASE - 340} r="16" fill="#ffd27a" {...ink(2)} />
    </g>
  )
}

function Home({ x }: { x: number }) {
  return (
    <g>
      <Block x={x} w={520} h={600} color="#d99c8c" roof="#8a3b20">
        <Window x={x - 150} y={BASE - 520} lit />
        <Window x={x + 150} y={BASE - 520} />
        {/* A small balcony with railings. */}
        <rect x={x - 120} y={BASE - 400} width="240" height="16" fill="#f1e8d2" {...ink(LINE)} />
        {Array.from({ length: 9 }, (_, i) => (
          <path key={i} d={`M${x - 110 + i * 27.5} ${BASE - 384} L${x - 110 + i * 27.5} ${BASE - 340}`} {...ink(3)} />
        ))}
        <path d={`M${x - 120} ${BASE - 340} L${x + 120} ${BASE - 340}`} {...ink(4)} />
      </Block>
      <Doorway x={x} w={150} h={300} color="#2e6a4c" />
      {/* Potted plants by the door. */}
      {[x - 160, x + 160].map((px) => (
        <g key={px}>
          <path d={`M${px - 30} ${BASE} L${px - 36} ${BASE - 60} L${px + 36} ${BASE - 60} L${px + 30} ${BASE} Z`} fill={TRIM} {...ink(LINE)} />
          <circle cx={px} cy={BASE - 90} r="38" fill="#3f6a33" {...ink(LINE)} />
          <circle cx={px + 12} cy={BASE - 100} r="16" fill="#93a64f" />
        </g>
      ))}
    </g>
  )
}

function Panchayat({ x }: { x: number }) {
  return (
    <g>
      <Block x={x} w={680} h={560} color="#e4c08f">
        <Sign x={x} y={BASE - 540} w={300} color="#2c6a94" />
      </Block>
      {/* A pillared veranda with steps. */}
      {[-260, -150, 150, 260].map((d) => (
        <g key={d}>
          <rect x={x + d - 22} y={BASE - 430} width="44" height="430" fill="#f6e3bf" {...ink(LINE)} />
          <rect x={x + d - 22} y={BASE - 430} width="14" height="430" fill={shadow('#f6e3bf', 0.3)} />
        </g>
      ))}
      <rect x={x - 300} y={BASE - 450} width="600" height="24" fill="#f6e3bf" {...ink(LINE)} />
      <Doorway x={x} w={180} h={380} color="#6a4632" />
      <rect x={x - 340} y={BASE - 8} width="680" height="18" fill="#c99a68" {...ink(LINE)} />
      {/* A flag pole with a saffron pennant. */}
      <rect x={x + 330} y={BASE - 720} width="10" height="720" fill="#8d8a86" {...ink(2)} />
      <path d={`M${x + 340} ${BASE - 716} L${x + 430} ${BASE - 690} L${x + 340} ${BASE - 664} Z`} fill="#e8962d" {...ink(2)} />
    </g>
  )
}

function Playground({ x }: { x: number }) {
  return (
    <g>
      {/* A fence, a swing and a slide, closed off with a rope and cones ("coming soon"). */}
      <path d={`M${x - 330} ${BASE - 150} L${x + 330} ${BASE - 150}`} {...ink(6, '#8a5a3a')} />
      {Array.from({ length: 12 }, (_, i) => (
        <rect key={i} x={x - 330 + i * 60} y={BASE - 190} width="16" height="190" fill="#c8a06a" {...ink(2)} />
      ))}
      <path d={`M${x - 250} ${BASE} L${x - 200} ${BASE - 380} L${x - 150} ${BASE} M${x - 50} ${BASE} L${x - 100} ${BASE - 380} L${x - 150} ${BASE - 380}`} fill="none" {...ink(10, '#2c6a94')} />
      <path d={`M${x - 220} ${BASE - 380} L${x - 80} ${BASE - 380}`} {...ink(10, '#2c6a94')} />
      <path d={`M${x - 170} ${BASE - 380} L${x - 170} ${BASE - 120} M${x - 130} ${BASE - 380} L${x - 130} ${BASE - 120}`} {...ink(3)} />
      <rect x={x - 180} y={BASE - 124} width="60" height="12" fill="#c9501a" {...ink(2)} />
      <path d={`M${x + 80} ${BASE - 300} L${x + 260} ${BASE}`} {...ink(18, '#e8962d')} />
      <path d={`M${x + 80} ${BASE - 300} L${x + 80} ${BASE}`} {...ink(8, '#8d8a86')} />
      <path d={`M${x - 120} ${BASE - 70} Q${x} ${BASE - 40} ${x + 120} ${BASE - 70}`} fill="none" stroke="#e8962d" strokeWidth="5" />
      {[x - 130, x + 130].map((cx) => (
        <path key={cx} d={`M${cx - 22} ${BASE} L${cx} ${BASE - 70} L${cx + 22} ${BASE} Z`} fill="#f0a12a" {...ink(2)} />
      ))}
    </g>
  )
}

function CyberAdda({ x }: { x: number }) {
  return (
    <g>
      <Block x={x} w={460} h={460} color="#b8a9c6" roof="#404d8c">
        <Sign x={x} y={BASE - 440} w={220} color="#404d8c" />
      </Block>
      {/* A half-closed shutter (it's "coming soon") with screens glowing inside. */}
      <rect x={x - 150} y={BASE - 330} width="300" height="330" fill="#2b2b3a" {...ink(LINE)} />
      {[-90, 0, 90].map((d) => (
        <rect key={d} x={x + d - 32} y={BASE - 150} width="64" height="44" rx="4" fill="#7fd6e0" opacity="0.8" {...ink(2)} />
      ))}
      <rect x={x - 150} y={BASE - 330} width="300" height="200" fill="#9a9aa6" {...ink(LINE)} />
      {Array.from({ length: 9 }, (_, i) => (
        <path key={i} d={`M${x - 150} ${BASE - 310 + i * 20} L${x + 150} ${BASE - 310 + i * 20}`} stroke="#6f6f7c" strokeWidth="3" />
      ))}
      {/* A wifi symbol on the wall. */}
      <g fill="none" stroke="#f1e8d2" strokeWidth="7" strokeLinecap="round">
        <path d={`M${x + 160} ${BASE - 360} a40 40 0 0 1 60 0 M${x + 172} ${BASE - 346} a24 24 0 0 1 36 0`} />
      </g>
      <circle cx={x + 190} cy={BASE - 330} r="6" fill="#f1e8d2" />
    </g>
  )
}

function HelpKiosk({ x }: { x: number }) {
  // Calm teal, never red: the Help Centre's colours (BUILD_PLAN §4).
  const teal = '#2f6f73'
  return (
    <g>
      <Block x={x} w={360} h={440} color="#dce9e6" roof={teal} />
      <Doorway x={x} w={160} h={330} color={teal} />
      {/* A round sign with two hands holding a heart. */}
      <circle cx={x} cy={BASE - 390} r="44" fill="#ffffff" {...ink(LINE, '#1f3a3d')} />
      <path d={`M${x} ${BASE - 372} C${x - 30} ${BASE - 392} ${x - 22} ${BASE - 420} ${x} ${BASE - 404} C${x + 22} ${BASE - 420} ${x + 30} ${BASE - 392} ${x} ${BASE - 372} Z`} fill={teal} />
      <path d={`M${x - 32} ${BASE - 366} Q${x} ${BASE - 350} ${x + 32} ${BASE - 366}`} fill="none" stroke={teal} strokeWidth="6" strokeLinecap="round" />
      <ellipse cx={x} cy={BASE - 200} rx="150" ry="120" fill="#bfe3df" opacity="0.25" />
    </g>
  )
}

// ---------------------------------------------------------------- the street layer (stage, speed 1)

// ---------------------------------------------------------------- celebrating finished places

/** Door heights in this file, for hanging a garland over each door. */
const DOOR_TOPS: Record<string, number> = { school: BASE - 450, dhaba: BASE - 360, home: BASE - 300, panchayat: BASE - 450 }

/** A marigold toran over the door and three paper lanterns: this place has been helped. */
function Festive({ x, top }: { x: number; top: number }) {
  const lanterns = [x - 170, x, x + 170]
  return (
    <g>
      {Array.from({ length: 13 }, (_, j) => {
        const t = j / 12
        const gx = x - 120 + t * 240
        const gy = top - 10 + Math.sin(t * Math.PI) * 34
        return <circle key={j} cx={gx} cy={gy} r="11" fill={j % 3 === 0 ? '#c9501a' : '#f0a12a'} {...ink(1.5)} />
      })}
      {lanterns.map((lx, i) => (
        <g key={lx}>
          <path d={`M${lx} ${top - 120} L${lx} ${top - 80}`} {...ink(2)} />
          <ellipse cx={lx} cy={top - 52} rx="24" ry="30" fill={['#e8962d', '#c9501a', '#e8962d'][i]} {...ink(2)} />
          <ellipse cx={lx - 6} cy={top - 58} rx="8" ry="14" fill="#ffe0a0" opacity="0.7" />
          <ellipse cx={lx} cy={top - 52} rx="60" ry="60" fill="#ffd27a" opacity="0.14" />
        </g>
      ))}
    </g>
  )
}

const Street: LayerArt = ({ width, flags }) => {
  const r = seeded(808)
  // Which buildings are finished (the Town screen sets "done:<id>" from saved progress).
  const done = Object.keys(DOOR_TOPS).filter((id) => flags?.has(`done:${id}`))
  // The street gets more festive as more places are helped: more strings of bunting.
  const buntingEvery = done.length >= 3 ? 1 : done.length >= 1 ? 2 : 3
  return (
    <svg {...svgProps(width)}>
      {/* Road and pavement. */}
      <rect y={BASE} width={width} height={H - BASE} fill="#c98b52" />
      <rect y={BASE} width={width} height="28" fill={shadow('#c98b52', 0.25)} />
      <rect y={GROUND_Y + 40} width={width} height={H - GROUND_Y - 40} fill="#9a7a62" />
      {Array.from({ length: Math.ceil(width / 140) }, (_, i) => (
        <rect key={i} x={i * 140 + 30} y={GROUND_Y + 66} width="70" height="8" rx="3" fill="#e9dcc0" opacity="0.7" />
      ))}

      {/* Trees between buildings (behind lamps). */}
      {[1120, 2850, 4500, 5350].map((x, i) => (
        <Neem key={x} x={x} base={BASE} size={200 + (i % 2) * 40} seed={900 + i} line={LINE} />
      ))}

      <SchoolGate x={PLACES.school} />
      <Dhaba x={PLACES.dhaba} />
      <Home x={PLACES.home} />
      <Panchayat x={PLACES.panchayat} />
      <Playground x={PLACES.playground} />
      <CyberAdda x={PLACES.cyberAdda} />
      <HelpKiosk x={PLACES.help} />

      {[1980, 3720, 5190].map((x) => (
        <Lamp key={x} x={x} />
      ))}

      {/* Bunting strung across the street, high up: sparse at first, fuller as places are helped. */}
      {Array.from({ length: Math.ceil(width / 600) }, (_, k) => {
        const x0 = k * 600 + 80
        if (k % buntingEvery !== 0) return null
        return (
          <g key={k}>
            <path d={`M${x0} 120 Q${x0 + 260} 210 ${x0 + 520} 120`} fill="none" stroke={INK} strokeWidth="2" />
            {Array.from({ length: 9 }, (_, j) => {
              const t = (j + 1) / 10
              const bx = x0 + t * 520
              const by = 120 + Math.sin(t * Math.PI) * 88
              const c = ['#e8962d', '#2c6a94', '#c9501a', '#5f7a4a'][Math.floor(r() * 4)]
              return <path key={j} d={`M${bx - 14} ${by} L${bx + 14} ${by} L${bx} ${by + 34} Z`} fill={c} {...ink(1.5)} />
            })}
          </g>
        )
      })}

      {done.map((id) => (
        <Festive key={id} x={PLACES[id as keyof typeof PLACES]} top={DOOR_TOPS[id]!} />
      ))}

      {/* Long evening shadows cast to the left. */}
      <g fill="#4a2f52" opacity="0.18">
        {Object.values(PLACES).map((x) => (
          <path key={x} d={`M${x - 200} ${BASE + 10} L${x + 200} ${BASE + 10} L${x - 60} ${H} L${x - 460} ${H} Z`} />
        ))}
      </g>
    </svg>
  )
}

export const townLayers: Record<string, LayerArt> = {
  'town.street': Street,
}
