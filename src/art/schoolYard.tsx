// PROTOTYPE (D-035, waiting for the owner's approval): the School yard in the new look.
// A modern school (concrete, glass and timber, like a new campus in Europe) in late-afternoon light:
// the sun comes from the upper left, so faces on the left are lit, shadows fall to the right
// and towards us, and the distance fades into a soft haze. Darker and richer than before.
//
// World size 2400 x 900. People stand on the yard between y 712 and 865.
// The clouds are a separate picture (<Clouds>), so they can drift without redrawing the yard.

export const YARD_W = 2400
export const YARD_H = 900

const GROUND = 640 // where the building meets the yard

// Materials, lit and in shadow.
const CONCRETE = '#b9b4ab'
const CONCRETE_DARK = '#8e8a83'
const FRAME = '#26292c'
const TIMBER = '#9b6b45'
const TIMBER_DARK = '#6e4a30'
const BRICK = '#5b4a42'
const LEAF_DARK = '#2f4630'
const LEAF = '#46623f'
const LEAF_LIT = '#6f8a55'

/** A band of tall windows with dark frames; the glass reflects the sky (light at the top, dark below). */
function WindowBand({ x, y, w, h, panes }: { x: number; y: number; w: number; h: number; panes: number }) {
  const pane = w / panes
  return (
    <g>
      <rect x={x - 6} y={y - 6} width={w + 12} height={h + 12} fill={FRAME} />
      <rect x={x} y={y} width={w} height={h} fill="url(#yard-glass)" />
      {/* Reflections: two soft diagonal streaks. */}
      <path d={`M${x + w * 0.12} ${y + h} L${x + w * 0.2} ${y} L${x + w * 0.26} ${y} L${x + w * 0.18} ${y + h} Z`} fill="#ffffff" opacity="0.08" />
      <path d={`M${x + w * 0.55} ${y + h} L${x + w * 0.61} ${y} L${x + w * 0.64} ${y} L${x + w * 0.58} ${y + h} Z`} fill="#ffffff" opacity="0.06" />
      {/* Inside the classrooms: a ceiling light line and dim shapes. */}
      <rect x={x} y={y + 10} width={w} height="4" fill="#e9dcc0" opacity="0.18" />
      {Array.from({ length: panes - 1 }, (_, i) => (
        <rect key={i} x={x + pane * (i + 1) - 3} y={y} width="6" height={h} fill={FRAME} />
      ))}
      {/* The window's shadow on the sill. */}
      <rect x={x - 6} y={y + h + 6} width={w + 12} height="7" fill="#000000" opacity="0.18" />
    </g>
  )
}

/** A leafy tree: a dark crown with a lit side to the upper left, and its shadow on the ground. */
function Tree({ x, y, s = 1, haze = 0 }: { x: number; y: number; s?: number; haze?: number }) {
  const blobs: [number, number, number][] = [
    [0, -230, 80], [-62, -190, 62], [62, -186, 66], [-30, -150, 60], [40, -140, 58], [-82, -140, 44], [88, -132, 42], [5, -290, 54],
  ]
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {haze === 0 && <ellipse cx="70" cy="6" rx="130" ry="18" fill="#000000" opacity="0.22" />}
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
      {haze > 0 && <circle cx="0" cy="-200" r="170" fill="#a9b4b3" opacity={haze} />}
    </g>
  )
}

function Bike({ x }: { x: number }) {
  return (
    <g stroke="#1d2023" strokeWidth="4" fill="none" strokeLinecap="round">
      <circle cx={x} cy="628" r="20" />
      <circle cx={x + 62} cy="628" r="20" />
      <path d={`M${x} 628 L${x + 22} 600 L${x + 52} 600 L${x + 62} 628 M${x + 22} 600 L${x + 32} 628 L${x + 52} 600 M${x + 18} 592 L${x + 28} 592 M${x + 50} 600 L${x + 54} 588`} />
    </g>
  )
}

/** The sky alone, for the game: it sits behind the drifting clouds, and the yard is drawn in front. */
export function YardSky() {
  return (
    <svg viewBox={`0 0 ${YARD_W} ${GROUND}`} preserveAspectRatio="none" className="size-full" aria-hidden="true">
      <SkyDefs />
      <rect width={YARD_W} height={GROUND} fill="url(#yard-sky)" />
      <rect width={YARD_W} height={GROUND} fill="url(#yard-sun)" />
    </svg>
  )
}

function SkyDefs() {
  return (
    <defs>
      <linearGradient id="yard-sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#4d6a82" />
        <stop offset="0.45" stopColor="#8aa0b0" />
        <stop offset="0.8" stopColor="#c9bfae" />
        <stop offset="1" stopColor="#e2c39b" />
      </linearGradient>
      <radialGradient id="yard-sun" cx="0.12" cy="0.32" r="0.55">
        <stop offset="0" stopColor="#ffe3b3" stopOpacity="0.75" />
        <stop offset="1" stopColor="#ffe3b3" stopOpacity="0" />
      </radialGradient>
    </defs>
  )
}

/**
 * The yard. `sky` draws the sky too (the title picture); the game leaves it out and puts
 * <YardSky> and the drifting <Clouds> behind it instead.
 */
export function SchoolYardArt({
  viewBox = `0 0 ${YARD_W} ${YARD_H}`,
  className = 'size-full',
  sky = true,
  clouds = false,
}: {
  viewBox?: string
  className?: string
  sky?: boolean
  clouds?: boolean
}) {
  return (
    <svg viewBox={viewBox} preserveAspectRatio="xMidYMax slice" className={className} aria-hidden="true">
      {sky && <SkyDefs />}
      <defs>
        <linearGradient id="yard-glass" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8fa6b4" />
          <stop offset="0.35" stopColor="#56697a" />
          <stop offset="1" stopColor="#252e36" />
        </linearGradient>
        <linearGradient id="yard-ground" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8b847a" />
          <stop offset="1" stopColor="#5c564f" />
        </linearGradient>
        {/* Late sun on the left of the building, falling off to the right. */}
        <linearGradient id="yard-facade-light" gradientUnits="userSpaceOnUse" x1="512" y1="0" x2="1908" y2="0">
          <stop offset="0" stopColor="#ffd9a0" stopOpacity="0.22" />
          <stop offset="0.6" stopColor="#ffd9a0" stopOpacity="0" />
          <stop offset="1" stopColor="#1b2230" stopOpacity="0.22" />
        </linearGradient>
        <linearGradient id="yard-ao" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#000000" stopOpacity="0" />
          <stop offset="1" stopColor="#000000" stopOpacity="0.35" />
        </linearGradient>
        <linearGradient id="yard-haze" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#c9bfae" stopOpacity="0" />
          <stop offset="1" stopColor="#d8c3a2" stopOpacity="0.7" />
        </linearGradient>
        <linearGradient id="yard-pool" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#ffcf8f" stopOpacity="0.16" />
          <stop offset="0.5" stopColor="#ffcf8f" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Sky and the glow of the low sun. */}
      {sky && (
        <>
          <rect width={YARD_W} height={GROUND} fill="url(#yard-sky)" />
          <rect width={YARD_W} height={GROUND} fill="url(#yard-sun)" />
        </>
      )}
      {clouds && <CloudShapes width={YARD_W} />}

      {/* Far away: wooded hills and a row of houses with pitched roofs, faded into the haze. */}
      <path d="M0 560 C300 500 520 530 760 505 C1000 480 1250 520 1500 498 C1800 470 2100 515 2400 490 L2400 640 L0 640 Z" fill="#7d8a86" />
      <path d="M0 585 C260 560 600 575 900 560 C1300 545 1700 572 2400 548 L2400 640 L0 640 Z" fill="#6c7a73" />
      {[[60, 70], [190, 90], [2040, 80], [2170, 64], [2290, 92]].map(([x, h]) => (
        <g key={x} fill="#8c8f88">
          <rect x={x} y={600 - h!} width="110" height={h! + 40} />
          <path d={`M${x! - 8} ${600 - h!} L${x! + 55} ${560 - h!} L${x! + 118} ${600 - h!} Z`} fill="#7a7671" />
        </g>
      ))}
      <rect y="470" width={YARD_W} height="170" fill="url(#yard-haze)" />
      <Tree x={340} y={640} s={0.85} haze={0.35} />
      <Tree x={2000} y={640} s={0.8} haze={0.35} />

      {/* The school. Main block: two storeys of exposed concrete with long window bands. */}
      <rect x="520" y="330" width="960" height="310" fill={CONCRETE} />
      {[620, 760, 900, 1040, 1180, 1320].map((x) => (
        <rect key={x} x={x} y="332" width="2" height="306" fill={CONCRETE_DARK} opacity="0.5" />
      ))}
      <rect x="520" y="478" width="960" height="2" fill={CONCRETE_DARK} opacity="0.6" />
      <WindowBand x={560} y={370} w={880} h={84} panes={11} />
      <WindowBand x={560} y={506} w={300} h={110} panes={4} />
      <WindowBand x={1120} y={506} w={320} h={110} panes={4} />
      {/* The entrance: a glass front set back under a long, thin canopy. */}
      <rect x="880" y="500" width="240" height="140" fill="#1e2428" />
      <rect x="892" y="512" width="216" height="128" fill="url(#yard-glass)" />
      <rect x="997" y="512" width="6" height="128" fill={FRAME} />
      <rect x="930" y="560" width="3" height="40" fill="#c9c4bb" />
      <rect x="1067" y="560" width="3" height="40" fill="#c9c4bb" />
      <rect x="840" y="488" width="320" height="12" fill="#2b2e31" />
      <path d="M840 500 L1160 500 L1160 530 L840 516 Z" fill="#000000" opacity="0.25" />
      {/* Name lettering on the concrete (shapes only: words in pictures can't be translated). */}
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <rect key={i} x={1180 + i * 30} y="342" width="20" height="16" rx="2" fill="#2b2e31" opacity="0.75" />
      ))}
      {/* Roof edge, with solar panels just showing above it. */}
      {[560, 680, 800, 920, 1040, 1160, 1280].map((x) => (
        <path key={x} d={`M${x} 322 L${x + 100} 322 L${x + 92} 308 L${x + 8} 308 Z`} fill="#2c3a4c" />
      ))}
      <rect x="512" y="322" width="976" height="12" fill="#2b2e31" />
      <rect x="520" y="334" width="960" height="10" fill="#000000" opacity="0.2" />

      {/* Stair tower in dark brick. */}
      <rect x="1470" y="290" width="100" height="350" fill={BRICK} />
      <rect x="1462" y="282" width="116" height="10" fill="#2b2e31" />
      {[330, 410, 490, 570].map((y) => (
        <rect key={y} x="1500" y={y} width="40" height="50" fill="url(#yard-glass)" stroke={FRAME} strokeWidth="5" />
      ))}

      {/* Wing clad in vertical timber slats, with square windows. */}
      <rect x="1570" y="400" width="330" height="240" fill={TIMBER} />
      {Array.from({ length: 33 }, (_, i) => (
        <rect key={i} x={1572 + i * 10} y="402" width="3" height="236" fill={TIMBER_DARK} opacity="0.55" />
      ))}
      {[1610, 1720, 1830].map((x) => (
        <g key={x}>
          <rect x={x - 5} y="455" width="60" height="70" fill={FRAME} />
          <rect x={x} y="460" width="50" height="60" fill="url(#yard-glass)" />
          <rect x={x - 5} y="525" width="60" height="6" fill="#000000" opacity="0.2" />
        </g>
      ))}
      <rect x="1562" y="392" width="346" height="10" fill="#2b2e31" />
      <rect x="1570" y="402" width="330" height="10" fill="#000000" opacity="0.2" />

      {/* Light across the whole building, and the dark line where it meets the ground. */}
      <g fill="url(#yard-facade-light)">
        <rect x="512" y="322" width="958" height="318" />
        <rect x="1462" y="282" width="116" height="358" />
        <rect x="1570" y="392" width="338" height="248" />
      </g>
      <rect x="512" y="600" width="1396" height="40" fill="url(#yard-ao)" />

      {/* Lawn strips and a low hedge in front of the building. */}
      <rect x="0" y="628" width="520" height="14" fill="#3f5838" />
      <rect x="1900" y="628" width="500" height="14" fill="#3f5838" />
      {[0, 120, 240, 360].map((x) => (
        <ellipse key={x} cx={x + 60} cy="626" rx="70" ry="22" fill={LEAF} />
      ))}

      {/* The yard: big concrete slabs in perspective, darker towards us. */}
      <rect y={GROUND} width={YARD_W} height={YARD_H - GROUND} fill="url(#yard-ground)" />
      <rect y={GROUND} width={YARD_W} height={YARD_H - GROUND} fill="url(#yard-pool)" />
      <g stroke="#4d4842" strokeWidth="2.5" opacity="0.45">
        {[662, 690, 726, 772, 830, 896].map((y) => (
          <path key={y} d={`M0 ${y} L${YARD_W} ${y}`} />
        ))}
        {Array.from({ length: 19 }, (_, i) => {
          const x = i * 140 - 60
          return <path key={i} d={`M${x} ${GROUND} L${1200 + (x - 1200) * 2.6} 900`} />
        })}
      </g>
      {/* The building's shadow falling on the yard. */}
      <path d="M512 640 L1908 640 L2010 700 L640 700 Z" fill="#000000" opacity="0.22" />
      <path d="M1462 640 L1578 640 L1650 690 L1530 690 Z" fill="#000000" opacity="0.12" />

      {/* Bike racks, planters and a bench. */}
      <path d="M1960 646 L2270 646" stroke="#000000" strokeWidth="10" opacity="0.2" />
      <Bike x={1985} />
      <Bike x={2085} />
      <Bike x={2185} />
      {[390, 1290].map((x) => (
        <g key={x}>
          <ellipse cx={x + 90} cy="660" rx="80" ry="10" fill="#000000" opacity="0.25" />
          <rect x={x} y="618" width="120" height="40" fill="#6d6a64" />
          <rect x={x} y="618" width="120" height="8" fill="#85827b" />
          <circle cx={x + 30} cy="608" r="24" fill={LEAF} />
          <circle cx={x + 76} cy="604" r="30" fill={LEAF_DARK} />
          <circle cx={x + 66} cy="596" r="14" fill={LEAF_LIT} />
        </g>
      ))}
      <ellipse cx="2160" cy="742" rx="120" ry="12" fill="#000000" opacity="0.28" />
      <rect x="2040" y="700" width="200" height="12" rx="3" fill="#a77a52" />
      <rect x="2040" y="712" width="200" height="6" fill="#6e4a30" />
      <rect x="2052" y="718" width="8" height="24" fill="#2b2e31" />
      <rect x="2220" y="718" width="8" height="24" fill="#2b2e31" />

      {/* Two young trees in the yard. */}
      <Tree x={250} y={700} s={1.25} />
      <Tree x={2330} y={720} s={1.35} />
    </svg>
  )
}

/** Cloud shapes on their own, for the drifting layer (see <Clouds>) and the title picture. */
function CloudShapes({ width }: { width: number }) {
  return (
    <g>
      <defs>
        {/* Soft, uneven cloud edges from noise: drawn once, then only moved. */}
        <filter id="cloud-soft" x="-20%" y="-40%" width="140%" height="180%">
          <feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="4" seed="7" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="70" xChannelSelector="R" yChannelSelector="G" result="ragged" />
          <feGaussianBlur in="ragged" stdDeviation="9" />
        </filter>
        <linearGradient id="cloud-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fbf3e6" />
          <stop offset="0.6" stopColor="#d9d3cb" />
          <stop offset="1" stopColor="#8f97a0" />
        </linearGradient>
      </defs>
      {[
        [width * 0.08, 250, 1],
        [width * 0.3, 330, 1.3],
        [width * 0.55, 270, 0.85],
        [width * 0.78, 360, 1.15],
        [width * 1.02, 250, 1.05],
        [width * 1.22, 340, 0.95],
      ].map(([x, y, s]) => (
        <g key={x} transform={`translate(${x} ${y}) scale(${s})`} filter="url(#cloud-soft)" opacity="0.92">
          <ellipse cx="0" cy="20" rx="170" ry="34" fill="#8f97a0" opacity="0.8" />
          <ellipse cx="-60" cy="-6" rx="90" ry="50" fill="url(#cloud-body)" />
          <ellipse cx="40" cy="-24" rx="110" ry="66" fill="url(#cloud-body)" />
          <ellipse cx="120" cy="2" rx="70" ry="42" fill="url(#cloud-body)" />
        </g>
      ))}
    </g>
  )
}

/**
 * The drifting cloud layer for the game. It is its own small picture: the soft edges are drawn
 * once and the browser only slides it (cloud-drift in proto.css), which stays cheap.
 */
export function Clouds() {
  const w = 3200
  return (
    <svg viewBox={`0 0 ${w} 480`} className="size-full" aria-hidden="true">
      <CloudShapes width={w * 0.8} />
    </svg>
  )
}
