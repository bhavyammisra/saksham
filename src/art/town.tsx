// The town street (D-036, at true scale since D-038): one long pavement with a front for each place.
// Doors line up with the exits in content/scenes/town.json: School 700, Dhaba 1550, Home 2400,
// Panchayat 3250, Playground 4100, Cyber Adda 4900, Help Centre 5650. Every door is DOOR_TOP to
// GROUND (400 units: taller than a child). The camera is close, so mostly ground floors show.
// A finished place gets a string of warm lights over its door ("done:<id>" flags, set by the
// Town screen from saved progress). Places still to come have boards across the door.

import { SCHOOL_ENTRANCE, SchoolBuilding } from './school'
import {
  Bench,
  CastShadow,
  DOOR_TOP,
  FacadeLight,
  GROUND,
  Lamp,
  LayerSvg,
  Paving,
  Planter,
  Railing,
  SignLines,
  SLAB,
  Tree,
  WindowBand,
} from './modern'
import type { LayerArt } from './types'

/** Warm lights over a finished place's door. */
function DoneLights({ x, w, y }: { x: number; w: number; y: number }) {
  const n = Math.floor(w / 46)
  return (
    <g>
      <path d={`M${x} ${y} Q${x + w / 2} ${y + 34} ${x + w} ${y}`} stroke="#2b2e31" strokeWidth="2" fill="none" />
      {Array.from({ length: n }, (_, i) => {
        const t = (i + 0.5) / n
        return (
          <g key={i}>
            <circle cx={x + w * t} cy={y + 34 * 4 * t * (1 - t) + 6} r="16" fill="#ffd28a" opacity="0.22" />
            <circle cx={x + w * t} cy={y + 34 * 4 * t * (1 - t) + 6} r="5" fill="#ffe6b0" />
          </g>
        )
      })}
    </g>
  )
}

/** Wooden boards across a door that isn't open yet ("Coming soon"), with a yellow notice. */
function Boards({ x, w }: { x: number; w: number }) {
  return (
    <g>
      <rect x={x} y={GROUND - 300} width={w} height="34" fill="#b08a5c" transform={`rotate(-6 ${x + w / 2} ${GROUND - 283})`} />
      <rect x={x} y={GROUND - 170} width={w} height="34" fill="#9c7a50" transform={`rotate(5 ${x + w / 2} ${GROUND - 153})`} />
      <rect x={x + w / 2 - 60} y={GROUND - 250} width="120" height="56" rx="4" fill="#e3b341" />
      <rect x={x + w / 2 - 44} y={GROUND - 228} width="88" height="8" fill="#2b2e31" />
    </g>
  )
}

/** A plain door with a frame and a handle, DOOR_TOP to GROUND. */
function Door({ cx, w = 180, fill = '#5a4636' }: { cx: number; w?: number; fill?: string }) {
  return (
    <g>
      <rect x={cx - w / 2 - 12} y={DOOR_TOP - 12} width={w + 24} height={GROUND - DOOR_TOP + 12} fill="#2b2e31" />
      <rect x={cx - w / 2} y={DOOR_TOP} width={w} height={GROUND - DOOR_TOP} fill={fill} />
      <rect x={cx + w / 2 - 34} y={GROUND - 210} width="8" height="50" rx="3" fill="#c9c4bb" />
    </g>
  )
}

/** The Dhaba's front: a terracotta shop, open at the front under a metal awning. */
function DhabaFront({ cx }: { cx: number }) {
  const x = cx - 300
  return (
    <g>
      <CastShadow x={x} w={600} reach={60} />
      <rect x={x} y="200" width="600" height={GROUND - 200} fill="#b98a66" />
      <rect x={x + 60} y="250" width="480" height="90" rx="6" fill="#a9473a" />
      <SignLines x={x + 140} y={282} w={320} color="#f5e3c4" />
      <rect x={x + 30} y={DOOR_TOP} width="540" height={GROUND - DOOR_TOP} fill="#2e221b" />
      <rect x={x + 30} y={DOOR_TOP} width="540" height={GROUND - DOOR_TOP} fill="url(#m-glass-warm)" opacity="0.5" />
      <rect x={x + 60} y={GROUND - 190} width="200" height="190" fill="#6e5848" />
      <path d={`M${x - 30} ${DOOR_TOP - 60} L${x + 630} ${DOOR_TOP - 60} L${x + 660} ${DOOR_TOP} L${x - 60} ${DOOR_TOP} Z`} fill="#5d6b73" />
      <FacadeLight x={x} y={200} w={600} h={GROUND - 200} />
    </g>
  )
}

/** Home: a block of flats, the door to its stairwell in the middle, balconies above. */
function Flats({ cx }: { cx: number }) {
  const x = cx - 350
  return (
    <g>
      <CastShadow x={x} w={700} reach={80} />
      <rect x={x} y="0" width="700" height={GROUND} fill="#d8cdbb" />
      {[60, 470].map((wx) => (
        <WindowBand key={wx} x={x + wx} y={430} w={170} h={220} panes={2} warm={wx === 60} />
      ))}
      {[60, 400].map((wx) => (
        <g key={wx}>
          <WindowBand x={x + wx} y={120} w={240} h={150} panes={3} />
          <rect x={x + wx - 20} y={250} width="280" height="12" fill="#7a7068" />
          <rect x={x + wx - 20} y={214} width="280" height="5" fill="#3a3d40" />
        </g>
      ))}
      <rect x={x} y={SLAB - 6} width="700" height="12" fill="#b3a691" />
      <Door cx={cx} w={190} fill="#6d5643" />
      <rect x={cx - 130} y={DOOR_TOP - 40} width="260" height="16" fill="#2b2e31" />
      <FacadeLight x={x} y={0} w={700} h={GROUND} />
    </g>
  )
}

/** The Panchayat: a civic building with tall columns, steps and a flag. */
function Panchayat({ cx }: { cx: number }) {
  const x = cx - 360
  return (
    <g>
      <CastShadow x={x} w={720} reach={80} />
      <rect x={cx - 3} y="40" width="6" height="150" fill="#8a9095" />
      <rect x={cx + 3} y="46" width="70" height="15" fill="#f29d4b" />
      <rect x={cx + 3} y="61" width="70" height="15" fill="#ffffff" />
      <rect x={cx + 3} y="76" width="70" height="15" fill="#3f8f4f" />
      <rect x={x} y="250" width="720" height={GROUND - 250} fill="#e3dccd" />
      <path d={`M${x - 30} 250 L${cx} 190 L${x + 750} 250 Z`} fill="#c9bfae" />
      <rect x={x - 30} y="244" width="780" height="14" fill="#2b2e31" />
      {[40, 160, 520, 640].map((c) => (
        <rect key={c} x={x + c} y="270" width="50" height={GROUND - 310} fill="#f1ece2" />
      ))}
      <Door cx={cx} w={200} fill="#4a3a2e" />
      {[0, 1, 2].map((i) => (
        <rect key={i} x={x - 10 - i * 12} y={GROUND - 40 + i * 13} width={740 + i * 24} height="13" fill={['#cfc7b8', '#c2baab', '#b5ad9e'][i]} />
      ))}
      <FacadeLight x={x - 30} y={190} w={780} h={GROUND - 190} />
    </g>
  )
}

/** The playground: a fenced park with a swing and a slide, its gate in the middle. */
function Playground({ cx }: { cx: number }) {
  const x = cx - 380
  return (
    <g>
      <Tree x={x + 40} s={0.9} />
      <rect x={x + 150} y={GROUND - 520} width="12" height="520" fill="#3a3d40" />
      <rect x={x + 350} y={GROUND - 520} width="12" height="520" fill="#3a3d40" />
      <rect x={x + 140} y={GROUND - 530} width="232" height="14" fill="#3a3d40" />
      <path d={`M${x + 225} ${GROUND - 516} L${x + 225} ${GROUND - 140} M${x + 285} ${GROUND - 516} L${x + 285} ${GROUND - 140}`} stroke="#2b2e31" strokeWidth="4" />
      <rect x={x + 210} y={GROUND - 144} width="90" height="14" fill="#c0533a" />
      <path d={`M${x + 520} ${GROUND} L${x + 520} ${GROUND - 300} L${x + 580} ${GROUND - 300} L${x + 760} ${GROUND}`} stroke="#2f6f73" strokeWidth="20" fill="none" strokeLinejoin="round" />
      <Railing x={x} w={300} />
      <Railing x={x + 460} w={300} />
      <rect x={cx - 90} y={GROUND - 290} width="14" height="290" fill="#2b2e31" />
      <rect x={cx + 76} y={GROUND - 290} width="14" height="290" fill="#2b2e31" />
      <Tree x={x + 760} s={1} />
    </g>
  )
}

/** Cyber Adda: a glass shop front with screens glowing inside. */
function CyberAdda({ cx }: { cx: number }) {
  const x = cx - 280
  return (
    <g>
      <CastShadow x={x} w={560} reach={60} />
      <rect x={x} y="150" width="560" height={GROUND - 150} fill="#3d4a52" />
      <rect x={x + 40} y="300" width="480" height="60" rx="4" fill="#2b2e31" />
      <SignLines x={x + 120} y={320} w={320} color="#7fd1e0" />
      <rect x={x + 30} y={DOOR_TOP - 20} width="500" height={GROUND - DOOR_TOP + 20} fill="url(#m-glass)" />
      {[70, 380].map((sx) => (
        <rect key={sx} x={x + sx} y="520" width="110" height="70" rx="4" fill="#7fd1e0" opacity="0.5" />
      ))}
      <FacadeLight x={x} y={150} w={560} h={GROUND - 150} />
    </g>
  )
}

/** The Help Centre: calm teal, a clear glass door, and a heart on the sign. Never red. */
function HelpCentre({ cx }: { cx: number }) {
  const x = cx - 320
  return (
    <g>
      <CastShadow x={x} w={640} reach={70} />
      <rect x={x} y="120" width="640" height={GROUND - 120} fill="#d9e6e2" />
      <rect x={x - 10} y="110" width="660" height="14" fill="#2b2e31" />
      <rect x={x + 80} y="270" width="480" height="80" rx="8" fill="#2f6f73" />
      <path d={`M${x + 140} 300 c-14 -18 -40 -6 -26 14 l26 22 l26 -22 c14 -20 -12 -32 -26 -14 Z`} fill="#ffffff" />
      <SignLines x={x + 210} y={300} w={300} />
      <WindowBand x={x + 30} y={430} w={150} h={240} panes={2} />
      <WindowBand x={x + 460} y={430} w={150} h={240} panes={2} />
      <rect x={cx - 110} y={DOOR_TOP - 12} width="220" height={GROUND - DOOR_TOP + 12} fill="#1e2428" />
      <rect x={cx - 98} y={DOOR_TOP} width="196" height={GROUND - DOOR_TOP} fill="url(#m-glass)" />
      <rect x={cx - 3} y={DOOR_TOP} width="6" height={GROUND - DOOR_TOP} fill="#26292c" />
      <FacadeLight x={x - 10} y={110} w={660} h={GROUND - 110} />
    </g>
  )
}

const Street: LayerArt = ({ width, flags }) => {
  const done = (id: string) => flags?.has(`done:${id}`) ?? false
  return (
    <LayerSvg width={width}>
      <Paving width={width} />

      {/* The School: the same building as inside, its entrance at the door (700). */}
      <SchoolBuilding x0={700 - SCHOOL_ENTRANCE} wing={false} />
      {done('school') && <DoneLights x={540} w={320} y={DOOR_TOP - 90} />}

      <DhabaFront cx={1550} />
      {done('dhaba') && <DoneLights x={1300} w={500} y={DOOR_TOP - 110} />}
      <Lamp x={1940} />

      <Flats cx={2400} />
      {done('home') && <DoneLights x={2280} w={240} y={DOOR_TOP - 110} />}
      <Planter x={2790} />

      <Panchayat cx={3250} />
      {done('panchayat') && <DoneLights x={3130} w={240} y={DOOR_TOP - 100} />}

      <Playground cx={4100} />
      <Boards x={4020} w={160} />
      <Bench x={4460} />

      <CyberAdda cx={4900} />
      <Boards x={4820} w={160} />
      <Tree x={5270} s={0.95} />

      <HelpCentre cx={5650} />
      <Planter x={6000} />
    </LayerSvg>
  )
}

export const townLayers: Record<string, LayerArt> = {
  'town.street': Street,
}
