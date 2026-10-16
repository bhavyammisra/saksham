// The Dhaba (D-036, at true scale since D-038): a roadside eatery at dusk. A plain concrete shop
// with a metal awning and warm bulbs, the counter and tandoor where Mohan Bhaiya works, steel
// tables and plastic chairs, the washing corner at the back where Raju works, and a goods truck.
// It is a gentle scene, so the light is soft and warm. Positions follow content/scenes/dhaba.json:
// the way out (220), Mohan (1000), Sunita Didi (1650), the notebook shelf (2300), Raju (2750).

import { CastShadow, DOOR_TOP, FacadeLight, GROUND, Lamp, LayerSvg, Paving, scaleAt, SignLines, Tree } from './modern'
import type { LayerArt, PropArt } from './types'

const WALL = '#b98a66' // faded terracotta paint
const WALL_DARK = '#8f6a4f'
const AWNING = '#5d6b73'
const STEEL = '#b9bec2'
const OPEN_TOP = DOOR_TOP + 10 // the open shop front, under the awning

/** A string of warm bulbs under the awning (still: lights don't animate, D-030). */
function Bulbs({ x1, x2, y }: { x1: number; x2: number; y: number }) {
  const n = Math.floor((x2 - x1) / 90)
  return (
    <g>
      <path d={`M${x1} ${y} Q${(x1 + x2) / 2} ${y + 40} ${x2} ${y}`} stroke="#2b2e31" strokeWidth="3" fill="none" />
      {Array.from({ length: n }, (_, i) => {
        const t = (i + 0.5) / n
        const x = x1 + (x2 - x1) * t
        const by = y + 40 * 4 * t * (1 - t) + 14
        return (
          <g key={i}>
            <circle cx={x} cy={by} r="30" fill="#ffd28a" opacity="0.18" />
            <circle cx={x} cy={by} r="9" fill="#ffe6b0" />
          </g>
        )
      })}
    </g>
  )
}

/** A steel table (0.75 m) with glasses and a plate, and a plastic chair on each side. */
function Table({ x }: { x: number }) {
  return (
    <g transform={scaleAt(x + 75, GROUND, 1.75)}>
      <ellipse cx={x + 90} cy={GROUND + 6} rx="110" ry="10" fill="#000000" opacity="0.3" />
      <rect x={x} y={GROUND - 92} width="150" height="10" fill={STEEL} />
      <rect x={x + 10} y={GROUND - 82} width="6" height="82" fill="#7d8389" />
      <rect x={x + 134} y={GROUND - 82} width="6" height="82" fill="#7d8389" />
      <rect x={x + 30} y={GROUND - 112} width="14" height="20" fill="#d9dde0" />
      <rect x={x + 54} y={GROUND - 110} width="14" height="18" fill="#c9ced2" />
      <ellipse cx={x + 110} cy={GROUND - 94} rx="24" ry="5" fill="#d9dde0" />
      {[x - 50, x + 160].map((cx, i) => (
        <g key={cx} fill={i ? '#2f6f73' : '#a9473a'}>
          <rect x={cx} y={GROUND - 64} width="44" height="8" rx="3" />
          <rect x={i ? cx + 36 : cx} y={GROUND - 120} width="8" height="60" rx="3" />
          <rect x={cx + 4} y={GROUND - 56} width="5" height="56" />
          <rect x={cx + 35} y={GROUND - 56} width="5" height="56" />
        </g>
      ))}
    </g>
  )
}

/** A goods truck (about 3.5 m tall), parked nose to the left. */
function Truck({ x }: { x: number }) {
  return (
    <g transform={scaleAt(x, GROUND, 2.2)}>
      <path d={`M${x - 160} ${GROUND} L${x + 400} ${GROUND} L${x + 480} ${GROUND + 30} L${x - 80} ${GROUND + 30} Z`} fill="#000000" opacity="0.25" />
      <rect x={x} y={GROUND - 330} width="400" height="270" rx="6" fill="#7b8d97" />
      <rect x={x} y={GROUND - 330} width="400" height="22" fill="#5f6f78" />
      <rect x={x} y={GROUND - 100} width="400" height="22" fill="#d38a3d" />
      {Array.from({ length: 8 }, (_, i) => (
        <rect key={i} x={x + 20 + i * 48} y={GROUND - 300} width="3" height="190" fill="#000000" opacity="0.12" />
      ))}
      <path d={`M${x - 150} ${GROUND - 60} L${x - 150} ${GROUND - 210} Q${x - 140} ${GROUND - 270} ${x - 70} ${GROUND - 270} L${x} ${GROUND - 270} L${x} ${GROUND - 60} Z`} fill="#3e5566" />
      <path d={`M${x - 130} ${GROUND - 200} Q${x - 120} ${GROUND - 250} ${x - 70} ${GROUND - 250} L${x - 20} ${GROUND - 250} L${x - 20} ${GROUND - 180} L${x - 130} ${GROUND - 180} Z`} fill="url(#m-glass)" />
      <rect x={x - 160} y={GROUND - 74} width="570" height="18" fill="#2b2e31" />
      {[x - 90, x + 90, x + 320].map((wx) => (
        <g key={wx}>
          <circle cx={wx} cy={GROUND - 30} r="34" fill="#1d2023" />
          <circle cx={wx} cy={GROUND - 30} r="14" fill="#6b7177" />
        </g>
      ))}
      <rect x={x} y={GROUND - 330} width="400" height="270" fill="url(#m-lit)" />
    </g>
  )
}

const Stage: LayerArt = ({ width }) => (
  <LayerSvg width={width}>
    <Paving width={width} tone="earth" />
    <Tree x={110} s={1} />
    <Lamp x={470} lit />

    {/* The dhaba: a single-storey shop, open at the front, with a flat roof and a big sign. */}
    <CastShadow x={620} w={2340} reach={70} opacity={0.28} />
    <rect x="620" y="150" width="2340" height={GROUND - 150} fill={WALL} />
    <rect x="620" y="150" width="2340" height="22" fill={WALL_DARK} />
    <rect x="1150" y="210" width="1000" height="120" rx="8" fill="#2b2e31" />
    <rect x="1162" y="222" width="976" height="96" rx="6" fill="#a9473a" />
    <SignLines x={1400} y={252} w={500} color="#f5e3c4" />
    {/* The dark inside behind the open front, lit warm. */}
    <rect x="690" y={OPEN_TOP} width="2200" height={GROUND - OPEN_TOP} fill="#2e221b" />
    <rect x="690" y={OPEN_TOP} width="2200" height={GROUND - OPEN_TOP} fill="url(#m-glass-warm)" opacity="0.55" />
    {[1240, 1780, 2340].map((x) => (
      <rect key={x} x={x} y={OPEN_TOP} width="44" height={GROUND - OPEN_TOP} fill={WALL} />
    ))}
    {/* The metal awning and the bulbs under it. */}
    <path d={`M650 ${OPEN_TOP - 60} L2930 ${OPEN_TOP - 60} L2990 ${OPEN_TOP} L590 ${OPEN_TOP} Z`} fill={AWNING} />
    {Array.from({ length: 48 }, (_, i) => (
      <rect key={i} x={610 + i * 50} y={OPEN_TOP - 58} width="3" height="56" fill="#000000" opacity="0.18" />
    ))}
    <rect x="620" y={OPEN_TOP} width="2340" height="18" fill="#000000" opacity="0.3" />
    <Bulbs x1={700} x2={1700} y={OPEN_TOP + 18} />
    <Bulbs x1={1760} x2={2880} y={OPEN_TOP + 18} />

    {/* Mohan's counter (waist high), the chai pot, glasses and the tandoor. */}
    <rect x="740" y={GROUND - 200} width="460" height="200" fill="#6e5848" />
    <rect x="730" y={GROUND - 212} width="480" height="16" fill={STEEL} />
    <rect x="790" y={GROUND - 290} width="80" height="78" rx="10" fill="#9aa1a7" />
    <path d={`M870 ${GROUND - 270} q34 8 30 34`} stroke="#9aa1a7" strokeWidth="8" fill="none" />
    {[930, 975, 1020, 1065].map((x) => (
      <rect key={x} x={x} y={GROUND - 250} width="28" height="38" fill="#d9dde0" />
    ))}
    <path d={`M1250 ${GROUND} L1276 ${GROUND - 200} L1404 ${GROUND - 200} L1430 ${GROUND} Z`} fill="#9b5a3a" />
    <ellipse cx="1340" cy={GROUND - 200} rx="64" ry="14" fill="#4a2a1c" />

    {/* Tables where people eat. */}
    <Table x={1500} />
    <Table x={1980} />

    {/* The washing corner at the back: a tap, a tub, crates and stacked glasses. */}
    <rect x="2560" y="560" width="14" height="110" fill="#7d8389" />
    <path d="M2567 560 L2640 560 L2640 590" stroke="#7d8389" strokeWidth="12" fill="none" />
    <ellipse cx="2650" cy={GROUND - 60} rx="130" ry="34" fill="#2f6f73" />
    <rect x="2520" y={GROUND - 64} width="260" height="64" fill="#2f6f73" />
    {[0, 1, 2].map((i) => (
      <rect key={i} x={2820} y={GROUND - 76 - i * 76} width="150" height="72" fill={i % 2 ? '#c9822f' : '#d6974a'} stroke="#7a4f22" strokeWidth="4" />
    ))}
    {[0, 1, 2, 3, 4].map((i) => (
      <rect key={i} x={2700 + (i % 3) * 32} y={GROUND - 290 - Math.floor(i / 3) * 40} width="26" height="36" fill="#d9dde0" />
    ))}
    <rect x="2680" y={GROUND - 254} width="140" height="12" fill="#6e5848" />

    <FacadeLight x={620} y={150} w={2340} h={GROUND - 150} />
    <Truck x={3240} />
    <Lamp x={3020} lit />
  </LayerSvg>
)

/** A small wooden shelf (about 1.3 m) with a school notebook left on it (Raju's). */
function Notebook() {
  return (
    <svg viewBox="0 0 160 230" className="size-full" aria-hidden="true">
      <ellipse cx="110" cy="226" rx="80" ry="7" fill="#000000" opacity="0.3" />
      <rect x="20" y="40" width="10" height="190" fill="#5a4231" />
      <rect x="130" y="40" width="10" height="190" fill="#5a4231" />
      {[40, 110, 180].map((y) => (
        <rect key={y} x="12" y={y} width="136" height="10" fill="#7a5a42" />
      ))}
      <rect x="30" y="150" width="30" height="30" fill="#c9ced2" />
      <rect x="70" y="160" width="50" height="20" fill="#d6974a" />
      {/* The notebook: a blue cover with a white label. */}
      <path d="M40 106 L112 96 L118 108 L46 118 Z" fill="#2c4f7a" />
      <path d="M58 104 L92 100 L94 106 L60 110 Z" fill="#f1ece2" />
      <rect x="40" y="64" width="20" height="46" fill="#b5532f" />
      <rect x="64" y="70" width="16" height="40" fill="#5f7a4a" />
    </svg>
  )
}

export const dhabaLayers: Record<string, LayerArt> = {
  'dhaba.stage': Stage,
}

export const dhabaProps: Record<string, PropArt> = {
  'dhaba.notebook': { width: 200, height: 290, Art: Notebook },
}
