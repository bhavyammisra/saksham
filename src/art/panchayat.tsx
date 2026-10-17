// The Panchayat (D-040): the village square in front of the Panchayat Bhawan, in daylight, in the modern look (modern.tsx).
// A gentle scene: a hand pump, a big neem tree with a platform round it, and the Panchayat office with its flag.
// Positions follow content/scenes/panchayat.json: the way out (220), Sonu by the hand pump (950),
// the bench with Pooja's admit card (1650), Pooja under the tree (2200), the Sarpanch at the office door (2900).
// Nothing in the picture shows a wedding: the story is only told, in words.

import { CastShadow, FacadeLight, GROUND, Lamp, LayerSvg, Paving, Planter, SignLines, Tree, WindowBand } from './modern'
import type { LayerArt, PropArt } from './types'

const WALL = '#e3dccd'
const PILLAR = '#f1ece2'
const BHAWAN = 2560 // where the Panchayat Bhawan starts
const ROOF = 420

function HandPump({ x }: { x: number }) {
  return (
    <g>
      <ellipse cx={x + 40} cy={GROUND + 14} rx="90" ry="14" fill="#000000" opacity="0.22" />
      <rect x={x - 50} y={GROUND - 16} width="140" height="22" fill="#9c968c" />
      <rect x={x} y={GROUND - 150} width="22" height="140" fill="#3f6f73" />
      <rect x={x - 4} y={GROUND - 160} width="30" height="14" fill="#2f5558" />
      <path d={`M${x + 22} ${GROUND - 120} L${x + 58} ${GROUND - 112} L${x + 58} ${GROUND - 100}`} stroke="#2f5558" strokeWidth="9" fill="none" />
      <path d={`M${x + 11} ${GROUND - 156} L${x - 70} ${GROUND - 190}`} stroke="#2f5558" strokeWidth="8" strokeLinecap="round" />
    </g>
  )
}

/** A big neem tree with a round stone platform (a chabutra) where people sit. */
function NeemTree({ x }: { x: number }) {
  return (
    <g>
      <Tree x={x} s={1.55} />
      <ellipse cx={x} cy={GROUND + 2} rx="230" ry="22" fill="#b7ad9b" />
      <rect x={x - 230} y={GROUND - 40} width="460" height="42" fill="#a89e8b" />
      <ellipse cx={x} cy={GROUND - 40} rx="230" ry="22" fill="#c8bfae" />
      <rect x={x - 230} y={GROUND - 4} width="460" height="8" fill="#000000" opacity="0.15" />
    </g>
  )
}

const Square: LayerArt = ({ width }) => (
  <LayerSvg width={width}>
    <Paving width={width} tone="earth" />
    <Tree x={110} s={1.05} />
    <Lamp x={420} />
    <Planter x={560} />
    <HandPump x={1060} />
    <NeemTree x={2120} />

    {/* The Panchayat Bhawan: a long civic building with a porch of columns, a flag, steps and the office door. */}
    <CastShadow x={BHAWAN} w={width - BHAWAN} reach={80} opacity={0.26} />
    <rect x={BHAWAN + 320} y={ROOF - 190} width="7" height="190" fill="#8a9095" />
    <rect x={BHAWAN + 327} y={ROOF - 182} width="80" height="17" fill="#f29d4b" />
    <rect x={BHAWAN + 327} y={ROOF - 165} width="80" height="17" fill="#ffffff" />
    <circle cx={BHAWAN + 367} cy={ROOF - 156} r="6" fill="none" stroke="#2c3a7a" strokeWidth="2" />
    <rect x={BHAWAN + 327} y={ROOF - 148} width="80" height="17" fill="#3f8f4f" />
    <rect x={BHAWAN} y={ROOF} width={width - BHAWAN} height={GROUND - ROOF} fill={WALL} />
    <rect x={BHAWAN - 20} y={ROOF - 14} width={width - BHAWAN + 20} height="16" fill="#2b2e31" />
    <rect x={BHAWAN} y={ROOF + 2} width={width - BHAWAN} height="12" fill="#000000" opacity="0.16" />
    {/* The name board above the porch (shapes stand in for words, so the picture needs no translation). */}
    <rect x={BHAWAN + 200} y={ROOF + 30} width="300" height="56" fill="#2f6f73" />
    <SignLines x={BHAWAN + 230} y={ROOF + 48} w={240} />
    <WindowBand x={BHAWAN + 560} y={ROOF + 130} w={220} h={150} panes={3} />
    <WindowBand x={BHAWAN + 40} y={ROOF + 130} w={100} h={150} panes={1} />
    {/* The porch: columns, a deep shadow behind them, the open office door. */}
    <rect x={BHAWAN + 170} y={ROOF + 110} width="360" height={GROUND - ROOF - 140} fill="#000000" opacity="0.18" />
    <rect x={BHAWAN + 280} y={ROOF + 200} width="140" height={GROUND - ROOF - 230} fill="#4a3a2e" />
    <rect x={BHAWAN + 290} y={ROOF + 210} width="120" height={GROUND - ROOF - 240} fill="url(#m-glass-warm)" opacity="0.35" />
    {[170, 260, 440, 500].map((cx) => (
      <g key={cx}>
        <rect x={BHAWAN + cx} y={ROOF + 100} width="30" height={GROUND - ROOF - 130} fill={PILLAR} />
        <rect x={BHAWAN + cx + 22} y={ROOF + 100} width="8" height={GROUND - ROOF - 130} fill="#000000" opacity="0.12" />
      </g>
    ))}
    <rect x={BHAWAN + 150} y={ROOF + 92} width="400" height="12" fill="#cfc7b8" />
    {[0, 1, 2].map((i) => (
      <rect key={i} x={BHAWAN + 140 - i * 14} y={GROUND - 30 + i * 10} width={420 + i * 28} height="10" fill={['#cfc7b8', '#c2baab', '#b5ad9e'][i]} />
    ))}
    <FacadeLight x={BHAWAN - 20} y={ROOF - 14} w={width - BHAWAN + 20} h={GROUND - ROOF + 14} />
  </LayerSvg>
)

/** A bench with Pooja's exam admit card lying on it. */
function AdmitCard() {
  return (
    <svg viewBox="0 0 260 120" className="size-full" aria-hidden="true">
      <ellipse cx="140" cy="114" rx="120" ry="7" fill="#000000" opacity="0.3" />
      <rect x="20" y="58" width="220" height="12" rx="3" fill="#a77a52" />
      <rect x="20" y="70" width="220" height="6" fill="#6e4a30" />
      <rect x="34" y="76" width="9" height="38" fill="#2b2e31" />
      <rect x="217" y="76" width="9" height="38" fill="#2b2e31" />
      {/* The admit card: a white sheet with a photo box and lines of print. */}
      <g transform="rotate(-6 130 52)">
        <rect x="92" y="34" width="76" height="26" fill="#fbf8f2" />
        <rect x="96" y="38" width="14" height="18" fill="#9aa1a7" />
        <rect x="116" y="40" width="44" height="3" fill="#3a3d40" />
        <rect x="116" y="47" width="36" height="2" fill="#7b8d97" />
        <rect x="116" y="52" width="40" height="2" fill="#7b8d97" />
      </g>
    </svg>
  )
}

export const panchayatLayers: Record<string, LayerArt> = {
  'panchayat.square': Square,
}

export const panchayatProps: Record<string, PropArt> = {
  'panchayat.admitCard': { width: 260, height: 120, Art: AdmitCard },
}
