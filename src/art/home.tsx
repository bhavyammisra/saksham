// Home (D-037, at true scale since D-038): the courtyard of a modern block of flats at dusk.
// A gentle scene: warm windows, lit lamps, plants, cricket stumps where children play.
// Positions follow content/scenes/home.json: the way out (220), Kabir by the stumps (900),
// Farida Aunty in her garden (1500), the letterboxes with Anu's drawing (2250), the stairs (2800).
// Nothing in the picture shows harm: the story is only told, in words.

import { Bench, CastShadow, DOOR_TOP, FacadeLight, GROUND, Lamp, LayerSvg, Paving, Planter, scaleAt, SLAB, Tree, WindowBand } from './modern'
import type { LayerArt, PropArt } from './types'

const WALL = '#cfc3b1'
const WALL_DARK = '#b3a691'

/** The first floor: window bays with balconies, some windows lit warm from inside. */
function FirstFloor({ x0, x1 }: { x0: number; x1: number }) {
  const bays = Math.floor((x1 - x0) / 420)
  return (
    <g>
      {Array.from({ length: bays }, (_, i) => {
        const x = x0 + 60 + i * 420
        const warm = i % 3 !== 1
        return (
          <g key={i}>
            <WindowBand x={x} y={70} w={300} h={210} panes={3} warm={warm} />
            {warm && <rect x={x} y={70} width="300" height="210" fill="#ffcf8a" opacity="0.15" />}
            {/* Balcony: a slab and a thin rail, its shadow on the wall below. */}
            <rect x={x - 24} y={SLAB - 40} width="348" height="16" fill="#8f877c" />
            <rect x={x - 24} y={SLAB - 110} width="348" height="6" fill="#3a3d40" />
            {Array.from({ length: 14 }, (_, j) => (
              <rect key={j} x={x - 20 + j * 25} y={SLAB - 106} width="4" height="68" fill="#3a3d40" />
            ))}
            <rect x={x - 24} y={SLAB - 24} width="348" height="20" fill="#000000" opacity="0.14" />
            {/* Plants and washing on some balconies: people live here. */}
            {i % 2 === 0 && <circle cx={x + 40} cy={SLAB - 70} r="30" fill="#46623f" />}
            {i % 3 === 1 && <path d={`M${x + 140} ${SLAB - 150} L${x + 290} ${SLAB - 150} M${x + 160} ${SLAB - 150} l0 44 l26 0 l0 -44 M${x + 220} ${SLAB - 150} l0 36 l30 0 l0 -36`} stroke="#d9d4c6" strokeWidth="5" fill="#e9e2d4" />}
          </g>
        )
      })}
    </g>
  )
}

/** Cricket stumps (about 0.7 m), and their shadow. */
function Stumps({ x }: { x: number }) {
  return (
    <g transform={scaleAt(x + 18, GROUND, 1.5)}>
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
    <Tree x={140} s={1} />
    <Lamp x={420} lit />
    <Tree x={700} s={0.9} />
    <Stumps x={1040} />

    {/* The block of flats: the ground floor, and the first floor above (more floors above the camera). */}
    <CastShadow x={1250} w={2150} reach={90} opacity={0.26} />
    <rect x="1250" y="0" width="2150" height={GROUND} fill={WALL} />
    <FirstFloor x0={1250} x1={3400} />
    <rect x="1250" y={SLAB - 6} width="2150" height="12" fill={WALL_DARK} />

    {/* Ground floor: Farida Aunty's window and garden behind a low wall. */}
    <WindowBand x={1290} y={DOOR_TOP} w={460} h={230} panes={4} warm />
    <rect x="1270" y={GROUND - 120} width="520" height="120" fill="#a9a49b" />
    <rect x="1270" y={GROUND - 126} width="520" height="10" fill="#bdb8af" />
    {[1320, 1440, 1590, 1720].map((x, i) => (
      <g key={x}>
        <circle cx={x} cy={GROUND - 150} r={40 + (i % 2) * 12} fill={i % 2 ? '#46623f' : '#2f4630'} />
        <circle cx={x - 10} cy={GROUND - 166} r="12" fill={['#e3b341', '#c0533a', '#e58fb0', '#e3b341'][i]} />
      </g>
    ))}

    {/* The letterbox wall, darker, beside the entrance. */}
    <rect x="2020" y={SLAB + 40} width="460" height={GROUND - SLAB - 40} fill={WALL_DARK} />

    {/* The stairwell: an open doorway, and stairs going up inside, lit warm. */}
    <rect x="2620" y={DOOR_TOP - 20} width="360" height={GROUND - DOOR_TOP + 20} fill="#1e2428" />
    <rect x="2635" y={DOOR_TOP - 5} width="330" height={GROUND - DOOR_TOP + 5} fill="url(#m-glass-warm)" opacity="0.7" />
    {Array.from({ length: 8 }, (_, i) => (
      <rect key={i} x={2650 + i * 24} y={GROUND - 48 - i * 48} width="140" height="14" fill="#6d5f52" />
    ))}
    <rect x="2600" y={DOOR_TOP - 44} width="400" height="24" fill="#2b2e31" />
    <path d={`M2600 ${DOOR_TOP - 20} L3000 ${DOOR_TOP - 20} L3000 ${DOOR_TOP + 16} L2600 ${DOOR_TOP} Z`} fill="#000000" opacity="0.25" />
    <rect x="2770" y={DOOR_TOP - 100} width="60" height="44" rx="6" fill="#ffe2a8" />
    <rect x="2660" y={DOOR_TOP - 92} width="90" height="26" rx="4" fill="#2f6f73" />
    <rect x="2676" y={DOOR_TOP - 82} width="58" height="6" fill="#ffffff" />

    <FacadeLight x={1250} y={0} w={2150} h={GROUND} />
    <Planter x={3040} />
    <Bench x={3200} />
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

// The letterbox stand is about 1.7 m tall.
export const homeProps: Record<string, PropArt> = {
  'home.drawing': { width: 330, height: 360, Art: Drawing },
}
