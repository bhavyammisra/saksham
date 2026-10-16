// The School (D-036, at true scale since D-038): a modern campus in late-afternoon light.
// Concrete, glass, a dark brick stair tower and a timber wing; a railing and an open gate where
// Lata waits; bike racks. The camera is close, so mostly the ground floor shows.
// Positions follow content/scenes/school.json: Lata at the gate (790), Ravi (1450),
// the notice board (1900), Meena Didi at the entrance (2400), the way out (3350).

import {
  Bike,
  CastShadow,
  DOOR_TOP,
  FacadeLight,
  FRAME,
  GROUND,
  LayerSvg,
  Paving,
  Planter,
  Railing,
  SignLines,
  SLAB,
  Tree,
  WindowBand,
} from './modern'
import type { LayerArt, PropArt } from './types'

const CONCRETE = '#b9b4ab'
const CONCRETE_DARK = '#8e8a83'
const TIMBER = '#9b6b45'
const TIMBER_DARK = '#6e4a30'
const BRICK = '#5b4a42'
const ROOF = 50 // the roof edge, mostly above the camera

/** Where the entrance's middle is, measured from the building's left edge. */
export const SCHOOL_ENTRANCE = 1275

/**
 * The school building from x0: a two-storey concrete block with its glass entrance at
 * x0 + SCHOOL_ENTRANCE, a brick stair tower, and (with `wing`) a single-storey timber wing.
 */
export function SchoolBuilding({ x0, wing = true }: { x0: number; wing?: boolean }) {
  const X = (x: number) => x0 + x
  const right = wing ? 2100 : 1680
  return (
    <g>
      <CastShadow x={X(0)} w={right} reach={80} />
      {/* Main block. */}
      <rect x={X(0)} y={ROOF} width="1550" height={GROUND - ROOF} fill={CONCRETE} />
      {[260, 520, 780, 1040, 1300].map((x) => (
        <rect key={x} x={X(x)} y={ROOF + 2} width="3" height={GROUND - ROOF - 4} fill={CONCRETE_DARK} opacity="0.5" />
      ))}
      <rect x={X(0)} y={SLAB - 6} width="1550" height="12" fill={CONCRETE_DARK} opacity="0.7" />
      <WindowBand x={X(50)} y={140} w={1450} h={160} panes={14} />
      <WindowBand x={X(50)} y={410} w={960} h={240} panes={8} />
      {/* The entrance: tall glass doors set back under a long, thin canopy. */}
      <rect x={X(1100)} y={DOOR_TOP - 30} width="350" height={GROUND - DOOR_TOP + 30} fill="#1e2428" />
      <rect x={X(1120)} y={DOOR_TOP} width="310" height={GROUND - DOOR_TOP} fill="url(#m-glass)" />
      <rect x={X(1272)} y={DOOR_TOP} width="6" height={GROUND - DOOR_TOP} fill={FRAME} />
      <rect x={X(1240)} y={GROUND - 230} width="6" height="80" fill="#c9c4bb" />
      <rect x={X(1304)} y={GROUND - 230} width="6" height="80" fill="#c9c4bb" />
      <rect x={X(1060)} y={DOOR_TOP - 48} width="430" height="18" fill="#2b2e31" />
      <path d={`M${X(1060)} ${DOOR_TOP - 30} L${X(1490)} ${DOOR_TOP - 30} L${X(1490)} ${DOOR_TOP + 14} L${X(1060)} ${DOOR_TOP - 6} Z`} fill="#000000" opacity="0.25" />
      {/* Name lettering on the concrete (shapes: words in pictures can't be translated). */}
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <rect key={i} x={X(1120 + i * 46)} y={SLAB - 50} width="32" height="28" rx="3" fill="#2b2e31" opacity="0.75" />
      ))}
      {/* Roof edge, with solar panels just showing above it. */}
      {Array.from({ length: 10 }, (_, i) => (
        <path key={i} d={`M${X(40 + i * 150)} ${ROOF - 8} L${X(170 + i * 150)} ${ROOF - 8} L${X(160 + i * 150)} ${ROOF - 30} L${X(50 + i * 150)} ${ROOF - 30} Z`} fill="#2c3a4c" />
      ))}
      <rect x={X(-10)} y={ROOF - 10} width="1570" height="16" fill="#2b2e31" />
      <FacadeLight x={X(-10)} y={ROOF - 10} w={1560} h={GROUND - ROOF + 10} />

      {/* Stair tower in dark brick. */}
      <rect x={X(1550)} y="0" width="130" height={GROUND} fill={BRICK} />
      {[110, 420].map((y) => (
        <rect key={y} x={X(1585)} y={y} width="60" height="200" fill="url(#m-glass)" stroke={FRAME} strokeWidth="6" />
      ))}
      <FacadeLight x={X(1550)} y={0} w={130} h={GROUND} />

      {/* Wing clad in vertical timber slats, with two big windows. */}
      {wing && (
        <g>
          <rect x={X(1680)} y={SLAB - 60} width="420" height={GROUND - SLAB + 60} fill={TIMBER} />
          {Array.from({ length: 42 }, (_, i) => (
            <rect key={i} x={X(1682 + i * 10)} y={SLAB - 58} width="3" height={GROUND - SLAB + 56} fill={TIMBER_DARK} opacity="0.55" />
          ))}
          {[1720, 1920].map((x) => (
            <g key={x}>
              <rect x={X(x - 8)} y={412} width="156" height="256" fill={FRAME} />
              <rect x={X(x)} y={420} width="140" height="240" fill="url(#m-glass)" />
              <rect x={X(x - 8)} y={668} width="156" height="8" fill="#000000" opacity="0.2" />
            </g>
          ))}
          <rect x={X(1672)} y={SLAB - 72} width="436" height="14" fill="#2b2e31" />
          <FacadeLight x={X(1680)} y={SLAB - 60} w={420} h={GROUND - SLAB + 60} />
        </g>
      )}
    </g>
  )
}

/** The stage: everything standing on the ground behind the people, across the whole School. */
const Yard: LayerArt = ({ width }) => (
  <LayerSvg width={width}>
    <Paving width={width} />
    {/* Outside the school: the pavement, a tree and the railing with the open gate. */}
    <Railing x={0} w={590} />
    <Tree x={260} s={1} />
    {[590, 930].map((x) => (
      <g key={x}>
        <rect x={x} y={GROUND - 470} width="60" height="480" fill="#7f7a72" />
        <rect x={x} y={GROUND - 470} width="18" height="480" fill="#a9a49b" />
      </g>
    ))}
    <rect x="580" y={GROUND - 500} width="420" height="52" rx="4" fill="#2f6f73" />
    <SignLines x={650} y={GROUND - 486} w={280} />
    {/* The sliding gate, pushed open behind the right-hand post. */}
    {Array.from({ length: 6 }, (_, i) => (
      <rect key={i} x={990 + i * 24} y={GROUND - 270} width="7" height="260" fill="#2b2e31" />
    ))}
    <rect x="984" y={GROUND - 274} width="140" height="8" fill="#2b2e31" />

    <SchoolBuilding x0={1125} />
    <Planter x={2000} />

    {/* Bike racks on the right, then the way out. */}
    <rect x="3250" y={GROUND - 330} width="350" height="14" fill="#2b2e31" />
    <rect x="3262" y={GROUND - 316} width="8" height="316" fill="#2b2e31" />
    <rect x="3580" y={GROUND - 316} width="8" height="316" fill="#2b2e31" />
    <path d={`M3250 ${GROUND} L3600 ${GROUND} L3700 ${GROUND + 50} L3330 ${GROUND + 50} Z`} fill="#000000" opacity="0.18" />
    <Bike x={3290} />
    <Bike x={3460} />
  </LayerSvg>
)

// ---------------------------------------------------------------- props

/** A notice board on two legs: an aluminium frame, a glass front and pinned papers. */
function Notice() {
  return (
    <svg viewBox="0 0 220 280" className="size-full" aria-hidden="true">
      <ellipse cx="150" cy="276" rx="110" ry="8" fill="#000000" opacity="0.3" />
      <rect x="30" y="140" width="10" height="140" fill="#3a3d40" />
      <rect x="180" y="140" width="10" height="140" fill="#3a3d40" />
      <rect x="6" y="10" width="208" height="160" rx="4" fill="#3a3d40" />
      <rect x="14" y="18" width="192" height="144" fill="#e7e1d6" />
      <rect x="26" y="30" width="70" height="88" fill="#ffffff" />
      <rect x="36" y="44" width="50" height="5" fill="#9aa3ab" />
      <rect x="36" y="56" width="42" height="4" fill="#c4c9cd" />
      <rect x="36" y="66" width="46" height="4" fill="#c4c9cd" />
      <rect x="108" y="30" width="86" height="54" fill="#f4d58d" />
      <rect x="116" y="42" width="60" height="5" fill="#a07a2f" />
      <rect x="108" y="94" width="86" height="56" fill="#cfe3e6" />
      <rect x="116" y="106" width="64" height="5" fill="#2f6f73" />
      {[61, 151, 151].map((x, i) => (
        <circle key={i} cx={x} cy={[34, 34, 98][i]} r="4" fill="#b5532f" />
      ))}
      <path d="M14 18 L80 18 L30 162 L14 162 Z" fill="#ffffff" opacity="0.12" />
    </svg>
  )
}

/** The way out: a slim wayfinding pole with an arrow sign. */
function Signpost() {
  return (
    <svg viewBox="0 0 160 300" className="size-full" aria-hidden="true">
      <ellipse cx="110" cy="296" rx="80" ry="7" fill="#000000" opacity="0.3" />
      <rect x="72" y="40" width="12" height="260" fill="#2b2e31" />
      <path d="M20 50 L120 50 L148 76 L120 102 L20 102 Z" fill="#2f6f73" />
      <path d="M40 76 L96 76 M80 62 L96 76 L80 90" stroke="#ffffff" strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export const schoolLayers: Record<string, LayerArt> = {
  'school.yard': Yard,
}

// Props at true scale: the board is about 1.7 m tall, the sign about 2 m.
export const schoolProps: Record<string, PropArt> = {
  'school.notice': { width: 290, height: 370, Art: Notice },
  'school.signpost': { width: 230, height: 430, Art: Signpost },
}
