// Home (D-037): the courtyard of a modern block of flats at dusk, in the modern look (modern.tsx).
// A gentle scene: warm windows, lit lamps, plants, cricket stumps where children play.
// Positions follow content/scenes/home.json: the way out (220), Kabir by the stumps (900),
// Farida Aunty in her garden (1500), the letterboxes with Anu's drawing (2250), the stairs (2800).
// Nothing in the picture shows harm: the story is only told, in words.

import { Bench, CastShadow, FacadeLight, GROUND, Lamp, LayerSvg, Paving, Planter, Tree, WindowBand } from './modern'
import type { LayerArt, PropArt } from './types'

const WALL = '#cfc3b1'
const WALL_DARK = '#b3a691'
const TOP = 250 // the roof line of the block

/** One floor of the block: window bands, some lit warm from inside, and a balcony rail. */
function Floor({ y, x0, x1, seed }: { y: number; x0: number; x1: number; seed: number }) {
  const bays = Math.floor((x1 - x0) / 300)
  return (
    <g>
      {Array.from({ length: bays }, (_, i) => {
        const x = x0 + 40 + i * 300
        const warm = (i * 7 + seed * 3) % 5 < 2
        return (
          <g key={i}>
            <WindowBand x={x} y={y} w={220} h={86} panes={3} warm={warm} />
            {warm && <rect x={x} y={y} width="220" height="86" fill="#ffcf8a" opacity="0.18" />}
            {/* Balcony: a slab and a thin rail, its shadow on the wall below. */}
            <rect x={x - 16} y={y + 100} width="252" height="10" fill="#8f877c" />
            <rect x={x - 16} y={y + 70} width="252" height="4" fill="#3a3d40" />
            {Array.from({ length: 12 }, (_, j) => (
              <rect key={j} x={x - 12 + j * 21} y={y + 72} width="3" height="30" fill="#3a3d40" />
            ))}
            <rect x={x - 16} y={y + 110} width="252" height="14" fill="#000000" opacity="0.14" />
            {/* Plants and washing on some balconies: people live here. */}
            {i % 3 === seed % 3 && <circle cx={x + 30} cy={y + 64} r="16" fill="#46623f" />}
            {i % 4 === seed % 4 && <path d={`M${x + 120} ${y + 40} L${x + 210} ${y + 40} M${x + 136} ${y + 40} l0 26 l14 0 l0 -26 M${x + 170} ${y + 40} l0 20 l18 0 l0 -20`} stroke="#d9d4c6" strokeWidth="4" fill="#e9e2d4" />}
          </g>
        )
      })}
    </g>
  )
}

function Stumps({ x }: { x: number }) {
  return (
    <g>
      <path d={`M${x} ${GROUND + 6} L${x + 60} ${GROUND + 34}`} stroke="#000000" strokeWidth="8" opacity="0.2" />
      {[0, 14, 28].map((d) => (
        <rect key={d} x={x + d} y={GROUND - 100} width="6" height="104" fill="#d9c9a3" />
      ))}
      <rect x={x - 2} y={GROUND - 104} width="38" height="4" fill="#b08a5c" />
    </g>
  )
}

const Courtyard: LayerArt = ({ width }) => (
  <LayerSvg width={width}>
    <Paving width={width} />
    <Tree x={120} s={1.15} />
    <Lamp x={360} lit />
    <Tree x={640} s={1.05} />
    <Stumps x={1040} />

    {/* The block of flats: ground floor and three floors above. */}
    <CastShadow x={1250} w={2150} reach={80} opacity={0.26} />
    <rect x="1250" y={TOP} width="2150" height={GROUND - TOP} fill={WALL} />
    <rect x="1242" y={TOP - 12} width="2166" height="14" fill="#2b2e31" />
    <rect x="1250" y={TOP + 2} width="2150" height="10" fill="#000000" opacity="0.18" />
    {[TOP + 40, TOP + 180, TOP + 320].map((y, i) => (
      <Floor key={y} y={y} x0={1250} x1={3400} seed={i} />
    ))}
    <rect x="1250" y="680" width="2150" height="6" fill={WALL_DARK} />

    {/* Ground floor: Farida Aunty's garden behind a low wall, the letterboxes, the stairwell. */}
    <WindowBand x={1300} y={700} w={420} h={110} panes={4} warm />
    <rect x="1290" y={GROUND - 50} width="460" height="50" fill="#a9a49b" />
    <rect x="1290" y={GROUND - 54} width="460" height="6" fill="#bdb8af" />
    {[1320, 1420, 1560, 1660].map((x, i) => (
      <g key={x}>
        <circle cx={x} cy={GROUND - 64} r={22 + (i % 2) * 8} fill={i % 2 ? '#46623f' : '#2f4630'} />
        <circle cx={x - 6} cy={GROUND - 72} r="8" fill={['#e3b341', '#c0533a', '#e58fb0', '#e3b341'][i]} />
      </g>
    ))}
    <rect x="2050" y="700" width="420" height={GROUND - 700} fill={WALL_DARK} />
    <rect x="2640" y="640" width="320" height={GROUND - 640} fill="#1e2428" />
    {/* Stairs going up inside the stairwell, lit warm. */}
    <rect x="2650" y="650" width="300" height={GROUND - 650} fill="url(#m-glass-warm)" opacity="0.7" />
    {Array.from({ length: 7 }, (_, i) => (
      <rect key={i} x={2660 + i * 22} y={GROUND - 24 - i * 24} width="140" height="8" fill="#6d5f52" />
    ))}
    <rect x="2620" y="626" width="360" height="14" fill="#2b2e31" />
    <path d="M2620 640 L2980 640 L2980 668 L2620 652 Z" fill="#000000" opacity="0.25" />
    <rect x="2780" y="590" width="40" height="30" rx="4" fill="#ffe2a8" />
    <rect x="2700" y="600" width="60" height="16" rx="3" fill="#2f6f73" />
    <rect x="2712" y="606" width="36" height="4" fill="#ffffff" />

    <FacadeLight x={1242} y={TOP - 12} w={2166} h={GROUND - TOP + 12} />
    <Planter x={3060} />
    <Bench x={3150} />
  </LayerSvg>
)

/** The letterboxes by the door, with Anu's drawing pinned beside them. */
function Drawing() {
  return (
    <svg viewBox="0 0 240 260" className="size-full" aria-hidden="true">
      <ellipse cx="160" cy="256" rx="110" ry="7" fill="#000000" opacity="0.3" />
      {/* Letterboxes: a grid of small metal doors. */}
      <rect x="10" y="20" width="120" height="180" fill="#5d6b73" />
      {Array.from({ length: 12 }, (_, i) => (
        <g key={i}>
          <rect x={16 + (i % 3) * 38} y={26 + Math.floor(i / 3) * 43} width="32" height="37" fill="#7b8d97" />
          <rect x={22 + (i % 3) * 38} y={34 + Math.floor(i / 3) * 43} width="20" height="3" fill="#2b2e31" />
        </g>
      ))}
      <rect x="66" y="200" width="8" height="56" fill="#3a3d40" />
      {/* Anu's drawing: a big colourful family, and Anu very small in the corner under a grey cloud. */}
      <rect x="142" y="40" width="92" height="120" fill="#fbf8f2" transform="rotate(3 188 100)" />
      <g transform="rotate(3 188 100)">
        {[[160, '#c0533a'], [180, '#2f6f73'], [200, '#e3b341']].map(([x, c]) => (
          <g key={x as number}>
            <circle cx={x as number} cy="78" r="7" fill={c as string} />
            <rect x={(x as number) - 6} y="86" width="12" height="26" rx="4" fill={c as string} />
          </g>
        ))}
        <ellipse cx="216" cy="128" rx="13" ry="7" fill="#9aa1a7" />
        <circle cx="216" cy="140" r="3" fill="#7a5c43" />
        <rect x="213" y="143" width="6" height="9" rx="2" fill="#7a5c43" />
        <path d="M150 150 Q188 146 228 150" stroke="#5f8a4f" strokeWidth="3" fill="none" />
      </g>
      <circle cx="188" cy="44" r="4" fill="#c0533a" />
    </svg>
  )
}

export const homeLayers: Record<string, LayerArt> = {
  'home.courtyard': Courtyard,
}

export const homeProps: Record<string, PropArt> = {
  'home.drawing': { width: 240, height: 260, Art: Drawing },
}
