// PROTOTYPE (D-035, waiting for the owner's approval): the School yard in the new modern look.
// Flat shapes, soft gradients, no ink outlines; a clear sky, a white school with teal trims.
// World size 2400 x 900. People stand on the paved yard between y 700 and 860.
// Also used, cropped, as the picture on the title screen.

export const YARD_W = 2400
export const YARD_H = 900

const TEAL = '#2f6f73'
const WALL = '#f6f1e8'
const WALL_SHADE = '#e4dccd'
const GLASS = '#a9d3dc'

/** Rows of windows on a block. */
function windows(x: number, y: number, cols: number, rows: number, w = 54, h = 66, gap = 30) {
  const out = []
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      const wx = x + c * (w + gap)
      const wy = y + r * (h + 34)
      out.push(
        <g key={`${r}-${c}`}>
          <rect x={wx - 4} y={wy - 4} width={w + 8} height={h + 8} rx="4" fill={TEAL} />
          <rect x={wx} y={wy} width={w} height={h} rx="2" fill={GLASS} />
          <path d={`M${wx} ${wy + h * 0.6} L${wx + w} ${wy + h * 0.15}`} stroke="#ffffff" strokeWidth="6" opacity="0.35" />
          <rect x={wx + w / 2 - 1.5} y={wy} width="3" height={h} fill={TEAL} opacity="0.6" />
        </g>,
      )
    }
  return out
}

function Tree({ x, y, s = 1, tone = '#6f9f7f' }: { x: number; y: number; s?: number; tone?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x="-9" y="-120" width="18" height="120" rx="6" fill="#7a5b45" />
      <circle cx="0" cy="-170" r="78" fill={tone} />
      <circle cx="-52" cy="-130" r="52" fill={tone} />
      <circle cx="54" cy="-128" r="56" fill={tone} />
      <circle cx="-20" cy="-196" r="44" fill="#ffffff" opacity="0.12" />
    </g>
  )
}

export function SchoolYardArt({ viewBox = `0 0 ${YARD_W} ${YARD_H}`, className = 'size-full' }: { viewBox?: string; className?: string }) {
  const far = [
    [40, 150], [170, 210], [300, 120], [1950, 190], [2080, 140], [2210, 230], [2330, 160],
  ]
  return (
    <svg viewBox={viewBox} preserveAspectRatio="xMidYMax slice" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="yard-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#9fd0e0" />
          <stop offset="0.65" stopColor="#dcecef" />
          <stop offset="1" stopColor="#f8e6cf" />
        </linearGradient>
        <linearGradient id="yard-ground" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ded3c1" />
          <stop offset="1" stopColor="#c9baa2" />
        </linearGradient>
      </defs>

      {/* Sky, sun and clouds. */}
      <rect width={YARD_W} height="660" fill="url(#yard-sky)" />
      <circle cx="1980" cy="190" r="64" fill="#ffe2b0" />
      <circle cx="1980" cy="190" r="110" fill="#ffe2b0" opacity="0.25" />
      {[[300, 140, 1], [980, 90, 1.3], [1560, 170, 0.9]].map(([x, y, s]) => (
        <g key={x} transform={`translate(${x} ${y}) scale(${s})`} fill="#ffffff" opacity="0.85">
          <ellipse cx="0" cy="0" rx="90" ry="26" />
          <ellipse cx="-30" cy="-18" rx="44" ry="30" />
          <ellipse cx="30" cy="-24" rx="52" ry="36" />
        </g>
      ))}

      {/* The town far behind, in soft blue-grey. */}
      {far.map(([x, h]) => (
        <g key={x}>
          <rect x={x} y={600 - h!} width="118" height={h} fill="#b5ccd3" />
          <rect x={x! + 14} y={600 - h! + 18} width="90" height="8" fill="#a3bdc5" />
        </g>
      ))}
      <Tree x={90} y={640} s={0.9} tone="#8db79a" />
      <Tree x={2290} y={640} s={1.05} tone="#8db79a" />

      {/* The school: a white two-storey block with teal trims, a lower wing, and a flag. */}
      <rect x="560" y="300" width="900" height="345" fill={WALL} />
      <rect x="560" y="300" width="900" height="26" fill={TEAL} />
      <rect x="1400" y="326" width="60" height="319" fill={WALL_SHADE} />
      {windows(610, 360, 4, 2)}
      {windows(1100, 360, 3, 2)}
      {/* Entrance with a canopy. */}
      <rect x="920" y="470" width="150" height="175" rx="6" fill="#5a4636" />
      <rect x="932" y="482" width="60" height="163" fill="#6d5643" />
      <rect x="998" y="482" width="60" height="163" fill="#6d5643" />
      <path d="M890 452 L1100 452 L1084 470 L906 470 Z" fill={TEAL} />
      {/* Name board above the door (shapes only: words in pictures can't be translated). */}
      <rect x="900" y="392" width="190" height="40" rx="6" fill="#ffffff" stroke={TEAL} strokeWidth="4" />
      <rect x="922" y="406" width="146" height="5" rx="2" fill={TEAL} opacity="0.7" />
      <rect x="944" y="416" width="102" height="4" rx="2" fill={TEAL} opacity="0.45" />
      <rect x="1460" y="420" width="380" height="225" fill="#efe3d0" />
      <rect x="1460" y="420" width="380" height="20" fill="#d9825b" />
      {windows(1500, 470, 4, 1, 52, 70, 34)}
      {/* Flag pole. */}
      <rect x="760" y="140" width="6" height="160" fill="#8a9095" />
      <rect x="766" y="146" width="66" height="14" fill="#f29d4b" />
      <rect x="766" y="160" width="66" height="14" fill="#ffffff" />
      <rect x="766" y="174" width="66" height="14" fill="#3f8f4f" />
      <circle cx="799" cy="167" r="4" fill="#2c3a63" />

      {/* Boundary wall and the open gate on the left. */}
      <rect x="0" y="590" width="440" height="56" fill="#e9dac4" />
      <rect x="0" y="580" width="440" height="12" fill="#d8c5aa" />
      <rect x="440" y="520" width="34" height="126" fill="#cdb79a" />
      <rect x="2060" y="590" width="340" height="56" fill="#e9dac4" />
      <rect x="2060" y="580" width="340" height="12" fill="#d8c5aa" />
      {[0, 1, 2, 3].map((i) => (
        <rect key={i} x={482 + i * 16} y="540" width="5" height="105" fill="#3d4a52" />
      ))}

      {/* The paved yard. */}
      <rect y="645" width={YARD_W} height="255" fill="url(#yard-ground)" />
      {Array.from({ length: 13 }, (_, i) => (
        <path key={i} d={`M${i * 200 - 100} 900 L${i * 200 + 60} 645`} stroke="#cbbda6" strokeWidth="3" opacity="0.6" />
      ))}
      <path d="M0 700 L2400 700" stroke="#cbbda6" strokeWidth="3" opacity="0.6" />
      <rect y="645" width={YARD_W} height="10" fill="#bfae94" opacity="0.6" />

      {/* Planters, a bench and a tree in the yard. */}
      {[300, 1290, 1880].map((x) => (
        <g key={x}>
          <rect x={x} y="612" width="90" height="40" rx="6" fill="#c8754f" />
          <circle cx={x + 25} cy="606" r="22" fill="#5f9a6c" />
          <circle cx={x + 62} cy="602" r="26" fill="#6fa97a" />
          <circle cx={x + 48} cy="592" r="8" fill="#f2b84b" />
        </g>
      ))}
      <rect x="2020" y="660" width="170" height="14" rx="5" fill="#2f6f73" />
      <rect x="2034" y="674" width="10" height="34" fill="#2b4f52" />
      <rect x="2166" y="674" width="10" height="34" fill="#2b4f52" />
      <Tree x={2250} y={690} s={1.2} />
    </svg>
  )
}
