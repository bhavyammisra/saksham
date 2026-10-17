// The School (D-036): a modern campus in late-afternoon light. Concrete, glass, a dark brick
// stair tower and a timber wing; a railing and an open gate where Lata waits; bike racks.
// Positions follow content/scenes/school.json: Lata at the gate (790), Ravi (1450),
// the notice board (1900), Meena Didi at the entrance (2400), the way out (3350).

import {
  Bike,
  CastShadow,
  FacadeLight,
  FRAME,
  GROUND,
  LayerSvg,
  Paving,
  Planter,
  Railing,
  SignLines,
  Tree,
  WindowBand,
} from './modern'
import type { LayerArt, PropArt } from './types'

const CONCRETE = '#b9b4ab'
const CONCRETE_DARK = '#8e8a83'
const TIMBER = '#9b6b45'
const TIMBER_DARK = '#6e4a30'
const BRICK = '#5b4a42'

/** The school building: main block, stair tower and timber wing, standing between x0 and x0 + 2070. */
export function SchoolBuilding({ x0 }: { x0: number }) {
  const X = (x: number) => x0 + x
  const top = 490
  return (
    <g>
      <CastShadow x={X(0)} w={2070} reach={70} />
      {/* Main block: two storeys of exposed concrete with long window bands. */}
      <rect x={X(0)} y={top} width="1570" height={GROUND - top} fill={CONCRETE} />
      {[160, 330, 500, 670, 840, 1010, 1180, 1350].map((x) => (
        <rect key={x} x={X(x)} y={top + 2} width="2" height={GROUND - top - 4} fill={CONCRETE_DARK} opacity="0.5" />
      ))}
      <rect x={X(0)} y={top + 160} width="1570" height="2" fill={CONCRETE_DARK} opacity="0.6" />
      <WindowBand x={X(50)} y={top + 50} w={1470} h={92} panes={16} />
      <WindowBand x={X(50)} y={top + 200} w={1080} h={112} panes={12} />
      {/* The entrance: a glass front set back under a long, thin canopy. */}
      <rect x={X(1180)} y={top + 190} width="330" height={GROUND - top - 190} fill="#1e2428" />
      <rect x={X(1194)} y={top + 204} width="302" height={GROUND - top - 204} fill="url(#m-glass)" />
      <rect x={X(1342)} y={top + 204} width="6" height={GROUND - top - 204} fill={FRAME} />
      <rect x={X(1300)} y={GROUND - 100} width="4" height="46" fill="#c9c4bb" />
      <rect x={X(1386)} y={GROUND - 100} width="4" height="46" fill="#c9c4bb" />
      <rect x={X(1130)} y={top + 176} width="430" height="14" fill="#2b2e31" />
      <path d={`M${X(1130)} ${top + 190} L${X(1560)} ${top + 190} L${X(1560)} ${top + 224} L${X(1130)} ${top + 206} Z`} fill="#000000" opacity="0.25" />
      {/* Name lettering on the concrete (shapes: words in pictures can't be translated). */}
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <rect key={i} x={X(1210 + i * 36)} y={top + 14} width="24" height="20" rx="2" fill="#2b2e31" opacity="0.75" />
      ))}
      {/* Roof edge, with solar panels just showing above it. */}
      {Array.from({ length: 11 }, (_, i) => (
        <path key={i} d={`M${X(40 + i * 140)} ${top - 8} L${X(160 + i * 140)} ${top - 8} L${X(150 + i * 140)} ${top - 24} L${X(50 + i * 140)} ${top - 24} Z`} fill="#2c3a4c" />
      ))}
      <rect x={X(-8)} y={top - 8} width="1586" height="14" fill="#2b2e31" />
      <rect x={X(0)} y={top + 6} width="1570" height="10" fill="#000000" opacity="0.2" />

      {/* Stair tower in dark brick. */}
      <rect x={X(1570)} y={top - 50} width="110" height={GROUND - top + 50} fill={BRICK} />
      <rect x={X(1562)} y={top - 60} width="126" height="12" fill="#2b2e31" />
      {[0, 1, 2, 3].map((i) => (
        <rect key={i} x={X(1600)} y={top - 10 + i * 82} width="48" height="56" fill="url(#m-glass)" stroke={FRAME} strokeWidth="5" />
      ))}

      {/* Wing clad in vertical timber slats, with square windows. */}
      <rect x={X(1680)} y={top + 80} width="390" height={GROUND - top - 80} fill={TIMBER} />
      {Array.from({ length: 39 }, (_, i) => (
        <rect key={i} x={X(1682 + i * 10)} y={top + 82} width="3" height={GROUND - top - 84} fill={TIMBER_DARK} opacity="0.55" />
      ))}
      {[1730, 1860, 1990].map((x) => (
        <g key={x}>
          <rect x={X(x - 6)} y={top + 140} width="72" height="84" fill={FRAME} />
          <rect x={X(x)} y={top + 146} width="60" height="72" fill="url(#m-glass)" />
          <rect x={X(x - 6)} y={top + 224} width="72" height="6" fill="#000000" opacity="0.2" />
        </g>
      ))}
      <rect x={X(1672)} y={top + 70} width="406" height="12" fill="#2b2e31" />

      <FacadeLight x={X(-8)} y={top - 8} w={1578} h={GROUND - top + 8} />
      <FacadeLight x={X(1570)} y={top - 60} w={110} h={GROUND - top + 60} />
      <FacadeLight x={X(1672)} y={top + 70} w={406} h={GROUND - top - 70} />
    </g>
  )
}

/** The stage: everything standing on the ground behind the people, across the whole School. */
const Yard: LayerArt = ({ width }) => (
  <LayerSvg width={width}>
    <Paving width={width} />
    {/* Outside the school: the pavement, trees and the railing with the open gate. */}
    <Tree x={180} s={1.15} />
    <Railing x={0} w={600} />
    <rect x="600" y={GROUND - 210} width="44" height="220" fill="#7f7a72" />
    <rect x="600" y={GROUND - 210} width="14" height="220" fill="#a9a49b" />
    <rect x="900" y={GROUND - 210} width="44" height="220" fill="#7f7a72" />
    <rect x="900" y={GROUND - 210} width="14" height="220" fill="#a9a49b" />
    {/* The sliding gate, pushed open behind the right-hand post. */}
    {Array.from({ length: 6 }, (_, i) => (
      <rect key={i} x={950 + i * 20} y={GROUND - 170} width="5" height="160" fill="#2b2e31" />
    ))}
    <rect x="944" y={GROUND - 172} width="120" height="6" fill="#2b2e31" />
    <rect x="610" y={GROUND - 260} width="324" height="44" rx="4" fill="#2f6f73" />
    <SignLines x={650} y={GROUND - 248} w={240} />
    <Railing x={1064} w={60} />

    <SchoolBuilding x0={1150} />
    <Planter x={1300} />
    <Planter x={2050} />

    {/* Bike racks and trees on the right, then the way out. */}
    <rect x="3260" y={GROUND - 190} width="300" height="12" fill="#2b2e31" />
    <rect x="3270" y={GROUND - 180} width="6" height="180" fill="#2b2e31" />
    <rect x="3546" y={GROUND - 180} width="6" height="180" fill="#2b2e31" />
    <path d={`M3260 ${GROUND} L3560 ${GROUND} L3640 ${GROUND + 40} L3330 ${GROUND + 40} Z`} fill="#000000" opacity="0.18" />
    <Bike x={3290} />
    <Bike x={3390} />
    <Tree x={3500} s={1.2} />
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

export const schoolProps: Record<string, PropArt> = {
  'school.notice': { width: 220, height: 280, Art: Notice },
  'school.signpost': { width: 160, height: 300, Art: Signpost },
}

