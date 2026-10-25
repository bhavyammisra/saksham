// The town street (D-036), in the modern look: one long pavement with a front for each place.
// Doors line up with the exits in content/scenes/town.json: School 700, Dhaba 1550, Home 2400,
// Panchayat 3250, Playground 4100, Cyber Adda 4900, Help Centre 5650.
// A finished place gets a string of warm lights over its door ("done:<id>" flags, set by the
// Town screen from saved progress). Places still to come have boards across the door.

import { SchoolBuilding } from './school'
import {
  Bench,
  CastShadow,
  FacadeLight,
  GROUND,
  Lamp,
  LayerSvg,
  Paving,
  Planter,
  Railing,
  SignLines,
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

/** Wooden boards across a door that isn't open yet ("Coming soon"). */
function Boards({ x, w }: { x: number; w: number }) {
  return (
    <g>
      <rect x={x} y={GROUND - 150} width={w} height="26" fill="#b08a5c" transform={`rotate(-6 ${x + w / 2} ${GROUND - 137})`} />
      <rect x={x} y={GROUND - 100} width={w} height="26" fill="#9c7a50" transform={`rotate(5 ${x + w / 2} ${GROUND - 87})`} />
      <rect x={x + w / 2 - 50} y={GROUND - 220} width="100" height="40" rx="4" fill="#e3b341" />
      <rect x={x + w / 2 - 36} y={GROUND - 206} width="72" height="6" fill="#2b2e31" />
    </g>
  )
}

/** The Dhaba's front: a terracotta shop with an awning. */
function DhabaFront({ x }: { x: number }) {
  return (
    <g>
      <CastShadow x={x} w={460} reach={50} />
      <rect x={x} y="590" width="460" height={GROUND - 590} fill="#b98a66" />
      <rect x={x + 60} y="530" width="340" height="60" rx="4" fill="#a9473a" />
      <SignLines x={x + 110} y={548} w={240} color="#f5e3c4" />
      <rect x={x + 30} y="670" width="400" height={GROUND - 670} fill="#2e221b" />
      <rect x={x + 30} y="670" width="400" height={GROUND - 670} fill="url(#m-glass-warm)" opacity="0.5" />
      <path d={`M${x - 20} 640 L${x + 480} 640 L${x + 500} 674 L${x - 40} 674 Z`} fill="#5d6b73" />
      <FacadeLight x={x} y={590} w={460} h={GROUND - 590} />
    </g>
  )
}

/** Home: a four-storey block of flats with balconies. In the evening some windows are lit. */
function Flats({ x, evening }: { x: number; evening: boolean }) {
  return (
    <g>
      <CastShadow x={x} w={560} reach={80} />
      <rect x={x} y="330" width="560" height={GROUND - 330} fill="#d8cdbb" />
      <rect x={x - 8} y="320" width="576" height="14" fill="#2b2e31" />
      {[0, 1, 2].map((floor) => (
        <g key={floor}>
          {[40, 300].map((wx) => (
            <WindowBand key={wx} x={x + wx} y={380 + floor * 120} w={220} h={70} panes={3} warm={evening && (floor + wx) % 3 !== 1} />
          ))}
          <rect x={x + 30} y={460 + floor * 120} width="240" height="10" fill="#7a7068" />
          <rect x={x + 30} y={440 + floor * 120} width="240" height="4" fill="#3a3d40" />
        </g>
      ))}
      <rect x={x + 220} y="710" width="120" height={GROUND - 710} fill="#5a4636" />
      <rect x={x + 232} y="722" width="96" height={GROUND - 722} fill="#6d5643" />
      <rect x={x + 200} y="696" width="160" height="14" fill="#2b2e31" />
      <FacadeLight x={x - 8} y={320} w={576} h={GROUND - 320} />
    </g>
  )
}

/** The Panchayat: a civic building with columns, steps and a flag. */
function Panchayat({ x }: { x: number }) {
  return (
    <g>
      <CastShadow x={x} w={540} reach={70} />
      <rect x={x + 268} y="300" width="6" height="150" fill="#8a9095" />
      <rect x={x + 274} y="306" width="60" height="13" fill="#f29d4b" />
      <rect x={x + 274} y="319" width="60" height="13" fill="#ffffff" />
      <rect x={x + 274} y="332" width="60" height="13" fill="#3f8f4f" />
      <rect x={x} y="470" width="540" height={GROUND - 470} fill="#e3dccd" />
      <path d={`M${x - 20} 470 L${x + 270} 430 L${x + 560} 470 Z`} fill="#c9bfae" />
      <rect x={x - 20} y="466" width="580" height="12" fill="#2b2e31" />
      {[40, 130, 360, 450].map((cx) => (
        <rect key={cx} x={x + cx} y="490" width="40" height={GROUND - 520} fill="#f1ece2" />
      ))}
      <rect x={x + 200} y="600" width="140" height={GROUND - 630} fill="#4a3a2e" />
      {[0, 1, 2].map((i) => (
        <rect key={i} x={x - 10 - i * 10} y={GROUND - 30 + i * 10} width={560 + i * 20} height="10" fill={['#cfc7b8', '#c2baab', '#b5ad9e'][i]} />
      ))}
      <FacadeLight x={x - 20} y={430} w={580} h={GROUND - 430} />
    </g>
  )
}

/** The playground: a fenced park with a swing and a slide. */
function Playground({ x }: { x: number }) {
  return (
    <g>
      <Tree x={x + 60} s={1.1} />
      <rect x={x + 120} y={GROUND - 260} width="8" height="250" fill="#3a3d40" />
      <rect x={x + 260} y={GROUND - 260} width="8" height="250" fill="#3a3d40" />
      <rect x={x + 114} y={GROUND - 266} width="160" height="10" fill="#3a3d40" />
      <path d={`M${x + 170} ${GROUND - 256} L${x + 170} ${GROUND - 90} M${x + 210} ${GROUND - 256} L${x + 210} ${GROUND - 90}`} stroke="#2b2e31" strokeWidth="3" />
      <rect x={x + 160} y={GROUND - 92} width="60" height="10" fill="#c0533a" />
      <path d={`M${x + 340} ${GROUND} L${x + 340} ${GROUND - 170} L${x + 380} ${GROUND - 170} L${x + 500} ${GROUND}`} stroke="#2f6f73" strokeWidth="14" fill="none" strokeLinejoin="round" />
      <Railing x={x} w={600} />
      <Tree x={x + 560} s={1.2} />
    </g>
  )
}

/** Cyber Adda: a glass shop front with screens glowing inside. */
function CyberAdda({ x }: { x: number }) {
  return (
    <g>
      <CastShadow x={x} w={420} reach={50} />
      <rect x={x} y="560" width="420" height={GROUND - 560} fill="#3d4a52" />
      <rect x={x + 40} y="520" width="340" height="40" rx="4" fill="#2b2e31" />
      <SignLines x={x + 100} y={532} w={220} color="#7fd1e0" />
      <rect x={x + 30} y="620" width="360" height={GROUND - 620} fill="url(#m-glass)" />
      {[70, 170, 270].map((sx) => (
        <rect key={sx} x={x + sx} y="690" width="70" height="44" rx="3" fill="#7fd1e0" opacity="0.55" />
      ))}
      <FacadeLight x={x} y={560} w={420} h={GROUND - 560} />
    </g>
  )
}

/** The Help Centre: calm teal, a clear door, and a heart on the sign. Never red. */
function HelpCentre({ x, evening }: { x: number; evening: boolean }) {
  return (
    <g>
      <CastShadow x={x} w={460} reach={60} />
      <rect x={x} y="520" width="460" height={GROUND - 520} fill="#d9e6e2" />
      <rect x={x - 8} y="512" width="476" height="12" fill="#2b2e31" />
      <rect x={x + 60} y="550" width="340" height="60" rx="6" fill="#2f6f73" />
      <path d={`M${x + 100} 572 c-10 -14 -30 -4 -20 10 l20 18 l20 -18 c10 -14 -10 -24 -20 -10 Z`} fill="#ffffff" />
      <SignLines x={x + 150} y={570} w={200} />
      <WindowBand x={x + 30} y={650} w={120} h={110} panes={2} warm={evening} />
      <WindowBand x={x + 310} y={650} w={120} h={110} panes={2} warm={evening} />
      <rect x={x + 180} y="640" width="100" height={GROUND - 640} fill="#1e2428" />
      <rect x={x + 190} y="650" width="80" height={GROUND - 650} fill="url(#m-glass)" />
      <FacadeLight x={x - 8} y={512} w={476} h={GROUND - 512} />
    </g>
  )
}

const Street: LayerArt = ({ width, flags }) => {
  const done = (id: string) => flags?.has(`done:${id}`) ?? false
  const evening = flags?.has('evening') ?? false // lamps and windows light up (D-053)
  return (
    <LayerSvg width={width}>
      <Paving width={width} />
      <Tree x={150} s={1.1} />

      {/* The School: the same building as inside, placed so its entrance is the door at 700. */}
      <SchoolBuilding x0={-645} />
      {done('school') && <DoneLights x={620} w={300} y={700} />}
      <Lamp x={1040} lit={evening} />

      <DhabaFront x={1320} />
      {done('dhaba') && <DoneLights x={1350} w={400} y={680} />}
      <Tree x={1900} s={1.05} />
      <Bench x={1960} />

      <Flats x={2120} evening={evening} />
      {done('home') && <DoneLights x={2330} w={140} y={704} />}
      <Lamp x={2780} lit={evening} />
      <Planter x={2840} />

      <Panchayat x={2980} />
      {done('panchayat') && <DoneLights x={3180} w={140} y={606} />}
      <Tree x={3640} s={1.15} />

      <Playground x={3800} />
      <Boards x={4040} w={120} />
      <Lamp x={4500} lit={evening} />
      <Bench x={4540} />

      <CyberAdda x={4700} />
      <Boards x={4840} w={120} />
      <Tree x={5250} s={1.1} />

      <HelpCentre x={5420} evening={evening} />
      <Planter x={5920} />
      <Tree x={6120} s={1.2} />
    </LayerSvg>
  )
}

export const townLayers: Record<string, LayerArt> = {
  'town.street': Street,
}
