// The Dhaba (Phase 4): a roadside eatery at golden hour, in the shared style (style.tsx).
// The sky, hills, houses, trees, light and leaves layers are shared with the School; this file
// draws the stage: a painted truck, the long dhaba with its awning, the tandoor, the chai
// counter and benches, and the washing corner at the back where Raju works.
// Things are placed to match the hotspots in content/scenes/dhaba.json. The stage is still
// (no animation inside it), following the performance rule in D-030.

import { ink, mixHex, shadow, svgProps } from './style'
import { GROUND_Y, SCENE_HEIGHT, type LayerArt, type PropArt } from './types'

const H = SCENE_HEIGHT
const BASE = 880
const LINE = 3
const WALL = '#d8e3c9' // faded mint limewash
const TRIM = '#a8401f'

/** Hotspot positions in content/scenes/dhaba.json, so the art lines up with them. */
const AT = { mohan: 1000, sunita: 1650, notebook: 2300, raju: 2750 }

function Truck({ x }: { x: number }) {
  // A painted goods truck, nose to the left, parked by the road.
  const body = '#e8962d'
  return (
    <g>
      <rect x={x} y={BASE - 330} width="380" height="270" rx="10" fill={body} {...ink(LINE)} />
      <rect x={x} y={BASE - 330} width="380" height="40" fill={shadow(body, 0.25)} />
      {/* Painted panels: flowers and stripes, as on Indian trucks. */}
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <rect x={x + 30 + i * 115} y={BASE - 270} width="95" height="140" rx="8" fill={['#2c6a94', '#c9501a', '#5f7a4a'][i]} {...ink(2)} />
          <circle cx={x + 77 + i * 115} cy={BASE - 200} r="26" fill="#ffd27a" {...ink(2)} />
          <circle cx={x + 77 + i * 115} cy={BASE - 200} r="10" fill={TRIM} />
        </g>
      ))}
      <rect x={x} y={BASE - 92} width="380" height="18" fill="#f1e8d2" {...ink(2)} />
      {Array.from({ length: 12 }, (_, i) => (
        <rect key={i} x={x + 6 + i * 31} y={BASE - 90} width="15" height="14" fill={i % 2 ? '#c9501a' : '#2c6a94'} />
      ))}
      {/* Cab. */}
      <path d={`M${x - 150} ${BASE - 60} L${x - 150} ${BASE - 220} Q${x - 140} ${BASE - 280} ${x - 70} ${BASE - 280} L${x} ${BASE - 280} L${x} ${BASE - 60} Z`} fill="#2c6a94" {...ink(LINE)} />
      <path d={`M${x - 130} ${BASE - 200} L${x - 120} ${BASE - 255} L${x - 20} ${BASE - 255} L${x - 20} ${BASE - 200} Z`} fill="#bfe0e8" {...ink(2)} />
      <rect x={x - 150} y={BASE - 220} width="40" height="160" fill={shadow('#2c6a94', 0.3)} />
      {/* Wheels. */}
      {[x - 80, x + 90, x + 300].map((wx) => (
        <g key={wx}>
          <circle cx={wx} cy={BASE - 30} r="44" fill="#2b2b33" {...ink(LINE)} />
          <circle cx={wx} cy={BASE - 30} r="18" fill="#9a9aa6" {...ink(2)} />
        </g>
      ))}
    </g>
  )
}

function Tandoor({ x }: { x: number }) {
  return (
    <g>
      <path d={`M${x - 70} ${BASE} L${x - 56} ${BASE - 170} Q${x} ${BASE - 210} ${x + 56} ${BASE - 170} L${x + 70} ${BASE} Z`} fill="#b5703f" {...ink(LINE)} />
      <path d={`M${x - 70} ${BASE} L${x - 56} ${BASE - 170} Q${x - 40} ${BASE - 185} ${x - 22} ${BASE - 190} L${x - 30} ${BASE} Z`} fill={shadow('#b5703f', 0.35)} />
      <ellipse cx={x} cy={BASE - 178} rx="40" ry="12" fill="#3d2a2c" {...ink(2)} />
      <ellipse cx={x} cy={BASE - 182} rx="26" ry="6" fill="#ff9a40" opacity="0.8" />
    </g>
  )
}

function Charpai({ x }: { x: number }) {
  // A woven cot used as a bench.
  return (
    <g>
      <rect x={x - 130} y={BASE - 110} width="260" height="30" rx="4" fill="#c8a06a" {...ink(LINE)} />
      {Array.from({ length: 12 }, (_, i) => (
        <path key={i} d={`M${x - 120 + i * 21} ${BASE - 108} L${x - 108 + i * 21} ${BASE - 82}`} stroke="#8a5a3a" strokeWidth="2" />
      ))}
      {[x - 120, x + 112].map((lx) => (
        <rect key={lx} x={lx} y={BASE - 80} width="14" height="80" fill="#6a4632" {...ink(2)} />
      ))}
    </g>
  )
}

function Table({ x }: { x: number }) {
  return (
    <g>
      <rect x={x - 90} y={BASE - 150} width="180" height="18" fill="#9a6a44" {...ink(LINE)} />
      <rect x={x - 80} y={BASE - 132} width="12" height="132" fill="#6a4632" {...ink(2)} />
      <rect x={x + 68} y={BASE - 132} width="12" height="132" fill="#6a4632" {...ink(2)} />
      {/* Steel glasses of chai on the table. */}
      {[-40, 0, 40].map((d) => (
        <path key={d} d={`M${x + d - 10} ${BASE - 150} L${x + d - 8} ${BASE - 182} L${x + d + 8} ${BASE - 182} L${x + d + 10} ${BASE - 150} Z`} fill="#c9cdd2" {...ink(1.5)} />
      ))}
    </g>
  )
}

function ChaiCounter({ x }: { x: number }) {
  return (
    <g>
      <rect x={x - 120} y={BASE - 200} width="240" height="200" fill="#c97a44" {...ink(LINE)} />
      <rect x={x - 120} y={BASE - 200} width="60" height="200" fill={shadow('#c97a44', 0.3)} />
      <rect x={x - 130} y={BASE - 214} width="260" height="18" fill="#8a5a3a" {...ink(LINE)} />
      {/* A big kettle on a stove. */}
      <rect x={x - 50} y={BASE - 250} width="100" height="36" fill="#3d3a3a" {...ink(2)} />
      <path d={`M${x - 40} ${BASE - 250} Q${x - 44} ${BASE - 330} ${x} ${BASE - 334} Q${x + 44} ${BASE - 330} ${x + 40} ${BASE - 250} Z`} fill="#c9cdd2" {...ink(LINE)} />
      <path d={`M${x + 38} ${BASE - 300} L${x + 78} ${BASE - 330}`} {...ink(6, '#9a9aa6')} />
      <path d={`M${x - 30} ${BASE - 334} Q${x} ${BASE - 352} ${x + 30} ${BASE - 334}`} fill="none" {...ink(4, '#6f6f7c')} />
    </g>
  )
}

function Shelf({ x }: { x: number }) {
  // Wall shelves with jars of spices (the notebook prop stands below, in front).
  return (
    <g>
      {[BASE - 420, BASE - 330].map((y, row) => (
        <g key={y}>
          <rect x={x - 140} y={y} width="280" height="14" fill="#8a5a3a" {...ink(2)} />
          {[-110, -60, -10, 40, 90].map((d, i) => (
            <rect key={d} x={x + d} y={y - 50} width="34" height="50" rx="6" fill={['#e8962d', '#c9501a', '#e9cf9f', '#5f7a4a', '#c9501a'][(i + row) % 5]} {...ink(1.5)} />
          ))}
        </g>
      ))}
    </g>
  )
}

function WashingCorner({ x }: { x: number }) {
  return (
    <g>
      {/* A tap on the wall, a blue water drum, and stacks of steel glasses and plates. */}
      <path d={`M${x - 140} ${BASE - 330} L${x - 140} ${BASE - 270} L${x - 110} ${BASE - 270}`} fill="none" {...ink(10, '#8d8a86')} />
      <rect x={x - 250} y={BASE - 210} width="120" height="210" rx="16" fill="#2c6a94" {...ink(LINE)} />
      <rect x={x - 250} y={BASE - 210} width="36" height="210" fill={shadow('#2c6a94', 0.35)} />
      <path d={`M${x + 90} ${BASE} L${x + 100} ${BASE - 70} L${x + 230} ${BASE - 70} L${x + 240} ${BASE} Z`} fill="#9a9aa6" {...ink(LINE)} />
      {[0, 1, 2, 3].map((i) => (
        <ellipse key={i} cx={x + 165} cy={BASE - 76 - i * 10} rx="60" ry="9" fill="#d6dadf" {...ink(1.5)} />
      ))}
      {[0, 1, 2, 3, 4].map((i) => (
        <path key={i} d={`M${x + 120 + i * 22} ${BASE - 150} L${x + 122 + i * 22} ${BASE - 190} L${x + 136 + i * 22} ${BASE - 190} L${x + 138 + i * 22} ${BASE - 150} Z`} fill="#c9cdd2" {...ink(1.5)} />
      ))}
    </g>
  )
}

const Stage: LayerArt = ({ width }) => {
  const left = 760
  const right = 3180
  const roof = BASE - 560
  return (
    <svg {...svgProps(width)}>
      {/* Packed earth by the road, and the road's edge. */}
      <rect y={BASE} width={width} height={H - BASE} fill="#c98b52" />
      <rect y={BASE} width={width} height="26" fill={shadow('#c98b52', 0.25)} />
      <rect y={GROUND_Y + 50} width={width} height={H - GROUND_Y - 50} fill="#8a7a6e" />
      {Array.from({ length: Math.ceil(width / 160) }, (_, i) => (
        <rect key={i} x={i * 160 + 40} y={GROUND_Y + 72} width="80" height="8" rx="3" fill="#e9dcc0" opacity="0.6" />
      ))}

      <Truck x={330} />

      {/* The dhaba: back wall, roof, and the open front on wooden posts. */}
      <rect x={left} y={roof} width={right - left} height={BASE - roof} fill={WALL} {...ink(LINE)} />
      <rect x={left} y={roof} width="80" height={BASE - roof} fill={shadow(WALL, 0.3)} />
      <rect x={left} y={roof + 40} width={right - left} height="60" fill={shadow(WALL, 0.22)} />
      <rect x={left - 20} y={roof - 40} width={right - left + 40} height="44" fill="#9a7a62" {...ink(LINE)} />
      {/* The name board on the roof (strokes stand in for words: there is no text in art). */}
      <rect x={1450} y={roof - 150} width="560" height="110" rx="8" fill={TRIM} {...ink(LINE)} />
      <rect x={1450} y={roof - 70} width="560" height="30" fill={shadow(TRIM, 0.35)} />
      <rect x={1520} y={roof - 126} width="420" height="14" rx="6" fill="#ffd27a" />
      <rect x={1580} y={roof - 100} width="300" height="10" rx="5" fill="#f1e8d2" />

      {/* Back-wall details: a calendar, the shelf, a clock. */}
      <rect x={1280} y={roof + 150} width="90" height="120" fill="#f1e8d2" {...ink(2)} />
      <rect x={1290} y={roof + 160} width="70" height="40" fill="#c9501a" />
      <Shelf x={AT.notebook} />
      <circle cx={2000} cy={roof + 180} r="40" fill="#f1e8d2" {...ink(LINE)} />
      <path d={`M2000 ${roof + 180} L2000 ${roof + 152} M2000 ${roof + 180} L2020 ${roof + 190}`} {...ink(4)} />

      <Tandoor x={AT.mohan - 150} />
      <ChaiCounter x={1300} />
      <Charpai x={AT.sunita + 10} />
      <Table x={2000} />
      <WashingCorner x={AT.raju} />

      {/* Posts holding up the awning. */}
      {Array.from({ length: 7 }, (_, i) => {
        const px = left + 20 + i * ((right - left - 40) / 6)
        return <rect key={i} x={px - 12} y={roof + 100} width="24" height={BASE - roof - 100} fill="#6a4632" {...ink(2)} />
      })}

      {/* The striped awning with a scalloped edge, casting a hard shadow band below it. */}
      <path d={`M${left - 40} ${roof + 30} L${right + 40} ${roof + 30} L${right + 70} ${roof + 110} L${left - 70} ${roof + 110} Z`} fill="#c9501a" {...ink(LINE)} />
      {Array.from({ length: Math.ceil((right - left + 140) / 120) }, (_, i) => (
        <path key={`s${i}`} d={`M${left - 70 + i * 120} ${roof + 110} L${left - 40 + i * 120} ${roof + 30} L${left + 20 + i * 120} ${roof + 30} L${left - 10 + i * 120} ${roof + 110} Z`} fill="#f0a12a" />
      ))}
      {Array.from({ length: Math.ceil((right - left + 140) / 60) }, (_, i) => (
        <path key={`q${i}`} d={`M${left - 70 + i * 60} ${roof + 110} q30 26 60 0`} fill={i % 2 ? '#f0a12a' : '#c9501a'} {...ink(2)} />
      ))}
      <rect x={left} y={roof + 140} width={right - left} height="26" fill={mixHex(WALL, '#4a2f52', 0.25)} opacity="0.6" />

      {/* Paper lanterns under the awning (still; the light layer adds the glow). */}
      {[1150, 1900, 2600].map((lx) => (
        <g key={lx}>
          <path d={`M${lx} ${roof + 136} L${lx} ${roof + 180}`} {...ink(2)} />
          <ellipse cx={lx} cy={roof + 206} rx="22" ry="28" fill="#e8962d" {...ink(2)} />
          <ellipse cx={lx - 6} cy={roof + 200} rx="7" ry="12" fill="#ffe0a0" opacity="0.7" />
        </g>
      ))}

      {/* Long evening shadows cast to the left. */}
      <g fill="#4a2f52" opacity="0.18">
        {[900, 1500, 2100, 2700].map((x) => (
          <path key={x} d={`M${x - 200} ${BASE + 10} L${x + 200} ${BASE + 10} L${x - 60} ${H} L${x - 460} ${H} Z`} />
        ))}
      </g>
    </svg>
  )
}

/** Raju's maths notebook, left on a low stool by the shelf. */
const Notebook: PropArt = {
  width: 150,
  height: 170,
  Art: () => (
    <svg viewBox="0 0 150 170" className="size-full">
      <rect x="25" y="70" width="100" height="16" fill="#8a5a3a" {...ink(2)} />
      <rect x="35" y="86" width="12" height="84" fill="#6a4632" {...ink(2)} />
      <rect x="103" y="86" width="12" height="84" fill="#6a4632" {...ink(2)} />
      <path d="M30 70 L40 26 L118 34 L112 70 Z" fill="#2c6a94" {...ink(2)} />
      <path d="M40 26 L44 30 L120 38 L118 34 Z" fill="#f1e8d2" {...ink(1.5)} />
      <rect x="58" y="42" width="40" height="14" rx="3" fill="#f1e8d2" transform="rotate(5 78 49)" />
      <path d="M62 49 L92 52" stroke="#2c6a94" strokeWidth="2" />
    </svg>
  ),
}

export const dhabaLayers: Record<string, LayerArt> = {
  'dhaba.stage': Stage,
}

export const dhabaProps: Record<string, PropArt> = {
  'dhaba.notebook': Notebook,
}
