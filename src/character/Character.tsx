// The player character: one SVG rig shared by every option.
//
// Design space: 120 x 360 units, feet on y = 350. Realistic proportions for ages
// 8 to 16: about 6.5 heads tall, shoulders two heads wide, hands reaching mid-thigh.
//
// Look (D-024): painted game-character style. Every shape has
//   - a thin ink outline in a dark version of its own colour,
//   - "cel" shading: a hard edge between the lit side and a cool shadow side,
//     plus a bright rim on the lit edge (light comes from the upper left),
//   - painted cast shadows where one part shades another (hair on the forehead,
//     chin on the neck, arms on the body, shirt hem on the trousers).
//
// The body is split into groups that pivot at the neck, shoulders and hips, so
// every outfit, hairstyle and headwear moves with the same animations (character.css).

import { useId, type ReactNode } from 'react'
import type { Mood } from '@content/types'
import { ink, lighten, mix, shade } from './color'
import {
  colorOf,
  hairColors,
  headwearColors,
  outfitColors,
  skinTones,
  type CharacterSpec,
} from './spec'
import './character.css'

export type Pose = 'idle' | 'walk' | 'talk' | 'wave' | 'gasp' | 'cheer'
export type Facing = 'left' | 'right'
export type View = 'full' | 'portrait'

const VIEW_BOX: Record<View, string> = {
  full: '0 0 120 360',
  portrait: '24 4 72 100', // head and shoulders
}

// Fixed colours for the parts players don't colour themselves.
const UNIFORM_SHIRT = '#dfe9f2'
const UNIFORM_NAVY = '#2f3b5c'
const JEANS = '#46618a'
const PYJAMA = '#ece4d4'
const SOCKS = '#f1eee7'
const SCHOOL_SHOE = '#26201d'
const SNEAKER = '#e9e6df'
const SANDAL = '#6b4528'
const BAG = '#3b6a9c'
const EYE_WHITE = '#f4efe8'
const IRIS = '#3b2416'

interface Props {
  spec: CharacterSpec
  pose?: Pose
  mood?: Mood
  facing?: Facing
  view?: View
  /** Adults (teachers, shopkeepers) get a slightly smaller head for their height. */
  adult?: boolean
  /** Accessible description. Without it the drawing is hidden from screen readers (decorative). */
  label?: string
  className?: string
}

/** Turns a material name into a fill: `paint('skin')` -> url(#…-skin). */
type Paint = (name: string) => string

export function Character({
  spec,
  pose = 'idle',
  mood = 'neutral',
  facing = 'right',
  view = 'full',
  adult = false,
  label,
  className,
}: Props) {
  // Gradient ids must be unique on the page, because many characters can be shown at once.
  const uid = 'ch' + useId().replace(/[^a-zA-Z0-9]/g, '')
  const face: Mood = pose === 'gasp' ? 'surprised' : pose === 'cheer' ? 'happy' : mood

  const skin = colorOf(skinTones, spec.skin)
  const hair = colorOf(hairColors, spec.hairColor)
  const cloth = colorOf(outfitColors, spec.outfitColor)
  const scarf = colorOf(headwearColors, spec.headwearColor)
  const look = outfitLook(spec.outfit, cloth)

  const paint: Paint = (name) => `url(#${uid}-${name})`
  // Each material gets a cel-shaded gradient (see Cel below).
  const materials: Record<string, string> = {
    skin,
    hair,
    top: look.top,
    legs: look.legs,
    scarf,
    bag: BAG,
    shoe: look.shoe,
    navy: UNIFORM_NAVY,
  }

  const hidesHair = spec.headwear === 'hijab' || spec.headwear === 'patka'

  return (
    <svg
      viewBox={VIEW_BOX[view]}
      className={`ch ${className ?? ''}`}
      data-pose={pose}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      // Facing left mirrors the whole drawing (outside the SVG, so pivots stay put).
      style={facing === 'left' ? { transform: 'scaleX(-1)' } : undefined}
    >
      <defs>
        {Object.entries(materials).map(([name, base]) => (
          <Cel key={name} id={`${uid}-${name}`} base={base} />
        ))}
        <linearGradient id={`${uid}-face`} x1="0" y1="0" x2="1" y2="0.2">
          <stop offset="0" stopColor={lighten(skin, 0.16)} />
          <stop offset="0.45" stopColor={skin} />
          <stop offset="1" stopColor={shade(skin, 0.12)} />
        </linearGradient>
        <clipPath id={`${uid}-faceclip`}>
          <path d={FACE} />
        </clipPath>
        <clipPath id={`${uid}-neckclip`}>
          <path d={NECK} />
        </clipPath>
        <radialGradient id={`${uid}-ground`}>
          <stop offset="0" stopColor="#1c1016" stopOpacity="0.42" />
          <stop offset="1" stopColor="#1c1016" stopOpacity="0" />
        </radialGradient>
      </defs>

      {view === 'full' && <ellipse cx="60" cy="350" rx="34" ry="6.5" fill={`url(#${uid}-ground)`} />}

      <g className="ch-part ch-body">
        {!hidesHair && <HairBehind style={spec.hair} paint={paint} hair={hair} />}
        {spec.bag && <BagBehind paint={paint} />}

        {(['l', 'r'] as const).map((side) => (
          <g key={side} className={`ch-part ch-leg-${side}`}>
            <Leg side={side} outfit={spec.outfit} paint={paint} look={look} skin={skin} />
          </g>
        ))}

        {spec.outfit !== 'pinafore' && <Hips salwar={spec.outfit === 'salwar'} paint={paint} legs={look.legs} />}
        <Neck paint={paint} skin={skin} uid={uid} />
        <Torso outfit={spec.outfit} paint={paint} look={look} skin={skin} />

        {spec.bag && <BagStraps />}
        {spec.headwear === 'dupatta' && <Dupatta paint={paint} scarf={scarf} />}
        {!hidesHair && <HairOver style={spec.hair} paint={paint} hair={hair} />}

        <g className="ch-part ch-head">
          <g transform={`translate(60 68.5) scale(${adult ? 0.93 : 1.02}) translate(-60 -66)`}>
            <Head spec={spec} mood={face} pose={pose} paint={paint} uid={uid} skin={skin} hair={hair} scarf={scarf} />
          </g>
        </g>

        {(['l', 'r'] as const).map((side) => (
          <g key={side} className={`ch-part ch-arm-${side}`}>
            <Arm side={side} look={look} paint={paint} skin={skin} />
          </g>
        ))}
      </g>
    </svg>
  )
}

// ---------------------------------------------------------------- shading

/**
 * Cel shading for one material, across the shape's own box, lit from the upper left:
 * a bright rim, the lit colour, then a hard edge into a cool shadow.
 */
function Cel({ id, base }: { id: string; base: string }) {
  return (
    <linearGradient id={id} x1="0" y1="0" x2="1" y2="0.28">
      <stop offset="0" stopColor={lighten(base, 0.3)} />
      <stop offset="0.09" stopColor={lighten(base, 0.08)} />
      <stop offset="0.57" stopColor={base} />
      <stop offset="0.57" stopColor={shade(base, 0.3)} />
      <stop offset="1" stopColor={shade(base, 0.42)} />
    </linearGradient>
  )
}

/** Outline for a shape filled with `base`. */
const line = (base: string, width = 0.8) => ({
  stroke: ink(base),
  strokeWidth: width,
  strokeLinejoin: 'round' as const,
  strokeLinecap: 'round' as const,
})

/** A flat cast shadow on top of a shape. */
const castShadow = (base: string, amount = 0.38) => ({ fill: shade(base, amount), opacity: 0.85 })

// ---------------------------------------------------------------- outfits

interface OutfitLook {
  top: string // shirt, kurta, kameez or T-shirt colour
  legs: string // trousers, pyjama or salwar colour
  shoe: string
  shoeKind: 'school' | 'sneaker' | 'sandal'
  sleeveEnd: number // where the sleeve ends on the arm (y); 196 = full sleeve
}

function outfitLook(outfit: string, cloth: string): OutfitLook {
  switch (outfit) {
    case 'pinafore':
      return { top: UNIFORM_SHIRT, legs: SOCKS, shoe: SCHOOL_SHOE, shoeKind: 'school', sleeveEnd: 134 }
    case 'kurta':
      return { top: cloth, legs: PYJAMA, shoe: SANDAL, shoeKind: 'sandal', sleeveEnd: 194 }
    case 'salwar':
      return { top: cloth, legs: lighten(cloth, 0.55), shoe: SANDAL, shoeKind: 'sandal', sleeveEnd: 168 }
    case 'casual':
      return { top: cloth, legs: JEANS, shoe: SNEAKER, shoeKind: 'sneaker', sleeveEnd: 128 }
    default: // uniform
      return { top: UNIFORM_SHIRT, legs: UNIFORM_NAVY, shoe: SCHOOL_SHOE, shoeKind: 'school', sleeveEnd: 134 }
  }
}

/** Mirrors an x value for the left side of the body (drawings are written for the right side). */
const mirror = (side: 'l' | 'r') => (x: number) => (side === 'r' ? x : 120 - x)

// ---------------------------------------------------------------- neck and torso

const NECK = 'M52.8 58 L67.2 58 L67.8 82 C72 87 78 90 83 93 L37 93 C42 90 48 87 52.2 82 Z'

function Neck({ paint, skin, uid }: { paint: Paint; skin: string; uid: string }) {
  return (
    <g>
      <path d={NECK} fill={paint('skin')} {...line(skin)} />
      <g clipPath={`url(#${uid}-neckclip)`}>
        {/* The chin's shadow on the neck, and the shaded right side of the neck. */}
        <path d="M50 58 L70 58 L70 73 Q60 81 50 73 Z" {...castShadow(skin, 0.42)} />
        <path d="M63.5 58 L70 58 L70 92 L64 92 Q65 80 63.5 58 Z" {...castShadow(skin, 0.3)} />
        <path d="M56 80 Q54 86 50 89 M64 80 Q66 86 70 89" stroke={shade(skin, 0.35)} strokeWidth="0.7" fill="none" opacity="0.6" />
      </g>
    </g>
  )
}

// The shirt shape from the collar to a hem at y = 196, shared by the uniform, the
// pinafore's blouse and the T-shirt.
const SHIRT =
  'M52 85 C45 88 37 90 31.5 93.5 C27.5 96.5 26.5 102 27.5 110 C29.5 126 33.5 144 37 162 C36.5 175 36 186 36.5 196 ' +
  'L83.5 196 C84 186 83.5 175 83 162 C86.5 144 90.5 126 92.5 110 C93.5 102 92.5 96.5 88.5 93.5 C83 90 75 88 68 85 Z'

// Long tunics (kurta, kameez) share the shirt's top and flare out below the waist.
const tunic = (hem: number, flare: number) =>
  'M52 85 C45 88 37 90 31.5 93.5 C27.5 96.5 26.5 102 27.5 110 C29.5 126 33.5 144 37 162 ' +
  `C36 195 ${33 - flare} 225 ${31 - flare} ${hem} Q60 ${hem + 6} ${89 + flare} ${hem} ` +
  `C${87 + flare} 225 84 195 83 162 C86.5 144 90.5 126 92.5 110 C93.5 102 92.5 96.5 88.5 93.5 C83 90 75 88 68 85 Z`

function Torso({ outfit, paint, look, skin }: { outfit: string; paint: Paint; look: OutfitLook; skin: string }) {
  const top = look.top
  const fold = shade(top, 0.34)
  const foldLine = { stroke: fold, strokeWidth: 0.8, fill: 'none', strokeLinecap: 'round' as const }
  // Shadows the hanging arms cast on the body (light from the left, so they fall to the right of each arm).
  const armShadows = (
    <g {...castShadow(top, 0.32)}>
      <path d="M37 112 Q40 135 41.5 160 L38.5 160 Q36 135 34 112 Z" />
      <path d="M78 112 Q80 135 82 160 L86 158 Q86 135 86 112 Z" />
    </g>
  )
  const shirt = <path d={SHIRT} fill={paint('top')} {...line(top)} />
  const collar = (
    <g>
      <path d="M53.5 86.5 L60 96 L66.5 86.5 Z" fill={paint('skin')} {...line(skin, 0.6)} />
      <path d="M51 85.5 C53 90 56.5 96 59.6 99.5 L60.4 93 Z" fill={lighten(top, 0.25)} {...line(top, 0.7)} />
      <path d="M69 85.5 C67 90 63.5 96 60.4 99.5 L59.6 93 Z" fill={shade(top, 0.12)} {...line(top, 0.7)} />
    </g>
  )

  switch (outfit) {
    case 'kurta':
      return (
        <g>
          <path d={tunic(262, 2)} fill={paint('top')} {...line(top)} />
          {armShadows}
          {/* Mandarin collar and the button placket. */}
          <path d="M52.5 86 Q60 90 67.5 86 L67.8 82.5 Q60 86.5 52.2 82.5 Z" fill={lighten(top, 0.15)} {...line(top, 0.6)} />
          <path d="M58.6 88 L58.6 128 L61.4 128 L61.4 88" fill={shade(top, 0.12)} {...line(top, 0.5)} />
          {[96, 106, 116].map((y) => (
            <circle key={y} cx="60" cy={y} r="1.2" fill={lighten(top, 0.55)} {...line(top, 0.4)} />
          ))}
          <path d="M44 132 Q50 136 56 133 M64 133 Q71 137 78 132 M38 172 Q37 205 33 255 M82 172 Q83 205 87 255 M60 168 L60 262" {...foldLine} opacity="0.7" />
          <path d="M31.5 222 L29.5 262 M88.5 222 L90.5 262" stroke={ink(top)} strokeWidth="0.8" />
          <path d="M30 258 Q60 264 90 258" stroke={lighten(top, 0.4)} strokeWidth="1.4" fill="none" />
        </g>
      )
    case 'salwar':
      return (
        <g>
          <path d={tunic(272, 5)} fill={paint('top')} {...line(top)} />
          {armShadows}
          <path d="M51 86 Q60 99 69 86 Z" fill={paint('skin')} {...line(skin, 0.6)} />
          <path d="M50.5 86 Q60 100.5 69.5 86" stroke={lighten(top, 0.45)} strokeWidth="1.8" fill="none" />
          <path d="M44 132 Q50 136 56 133 M64 133 Q71 137 78 132 M40 175 Q36 215 30 265 M80 175 Q84 215 90 265 M60 170 L60 270" {...foldLine} opacity="0.65" />
          <path d="M29.5 226 L26.5 272 M90.5 226 L93.5 272" stroke={ink(top)} strokeWidth="0.8" />
          {/* An embroidered border at the hem. */}
          <path d="M26 267 Q60 273.5 94 267" stroke={lighten(top, 0.45)} strokeWidth="2.4" fill="none" />
          <path d="M27 270.5 Q60 277 93 270.5" stroke={mix(top, '#e8b84a', 0.6)} strokeWidth="1" strokeDasharray="1.2 1.6" fill="none" />
        </g>
      )
    case 'casual':
      return (
        <g>
          <path d={SHIRT.replace(/196/g, '200')} fill={paint('top')} {...line(top)} />
          {armShadows}
          <path d="M51 86 Q60 95 69 86 Z" fill={paint('skin')} {...line(skin, 0.6)} />
          <path d="M50.5 86 Q60 96.5 69.5 86" stroke={shade(top, 0.25)} strokeWidth="1.8" fill="none" />
          <path d="M44 130 Q51 135 57 131 M41 178 Q50 183 57 179 M63 182 Q72 186 79 180" {...foldLine} opacity="0.7" />
          {/* A simple chest print: a kite. */}
          <path d="M66 114 L71 108 L76 114 L71 121 Z" fill={lighten(top, 0.5)} {...line(top, 0.5)} />
          <path d="M71 121 Q69 125 72 128" stroke={lighten(top, 0.5)} strokeWidth="0.8" fill="none" />
        </g>
      )
    case 'pinafore':
      return (
        <g>
          {shirt}
          {collar}
          <g fill={paint('navy')} {...line(UNIFORM_NAVY)}>
            <path d="M42 118 L78 118 L81 160 C88 195 93 230 96 262 Q60 268 24 262 C27 230 32 195 39 160 Z" />
            <path d="M43 92 L49 92 L47 119 L41 119 Z" />
            <path d="M77 92 L71 92 L73 119 L79 119 Z" />
          </g>
          {armShadows}
          <path d="M39 162 Q60 166 81 162" stroke={lighten(UNIFORM_NAVY, 0.25)} strokeWidth="1" fill="none" />
          {/* Box pleats. */}
          <path d="M44 168 L36 260 M52 168 L48 264 M60 168 L60 265 M68 168 L72 264 M76 168 L84 260" stroke={shade(UNIFORM_NAVY, 0.45)} strokeWidth="0.8" />
          <path d="M60 168 L60 265 L66 264 L64 168 Z M76 168 L84 260 L90 261 L80 166 Z" fill={shade(UNIFORM_NAVY, 0.3)} opacity="0.7" />
        </g>
      )
    default: // uniform: shirt, collar, pocket, buttons, belt
      return (
        <g>
          {shirt}
          {armShadows}
          {collar}
          <path d="M60 99 L60 190" stroke={shade(top, 0.2)} strokeWidth="0.8" />
          {[110, 128, 146, 164].map((y) => (
            <circle key={y} cx="61.6" cy={y} r="0.9" fill={lighten(top, 0.6)} {...line(top, 0.4)} />
          ))}
          <path d="M66.5 110 L77 110 L77 122 Q71.8 124.5 66.5 122 Z" fill={shade(top, 0.08)} {...line(top, 0.6)} />
          <path d="M44 132 Q50 136 56 133 M42 178 Q48 184 54 186 M66 186 Q73 184 78 178" {...foldLine} opacity="0.7" />
          {/* Belt with a buckle. */}
          <path d="M36.6 188 L83.4 188 L83.2 196.5 L36.8 196.5 Z" fill={shade(UNIFORM_NAVY, 0.35)} {...line(UNIFORM_NAVY, 0.6)} />
          <rect x="56" y="187.5" width="8" height="9.5" rx="1.2" fill="none" stroke="#c9b27a" strokeWidth="1.2" />
        </g>
      )
  }
}

// ---------------------------------------------------------------- legs and feet

/** Joins the two trouser legs at the hips (the legs swing, this part stays still). */
function Hips({ salwar, paint, legs }: { salwar: boolean; paint: Paint; legs: string }) {
  const d = salwar
    ? 'M35 180 L85 180 L86 205 C76 208 65 210 60 216 C55 210 44 208 34 205 Z'
    : 'M36.8 182 L83.2 182 L83 197 C75 199 64 200 60 205 C56 200 45 199 37 197 Z'
  return <path d={d} fill={paint('legs')} {...line(legs)} />
}

function Leg({ side, outfit, paint, look, skin }: { side: 'l' | 'r'; outfit: string; paint: Paint; look: OutfitLook; skin: string }) {
  const x = mirror(side)
  const P = (pts: [number, number][]) => pts.map(([px, py]) => `${x(px)} ${py}`)
  const legs = look.legs

  // Bare leg (right side): thigh, knee, calf, ankle.
  const [a, b, c, d, e, f, g, h, i, j, k, l, m, n, o] = P([
    [60.4, 186], [80, 186], [81.5, 212], [80.5, 240], [77.2, 266], [79, 284], [78.5, 300], [75.5, 318],
    [73.6, 338], [66, 338], [65.6, 318], [63.6, 300], [63.4, 284], [64.6, 266], [62, 228],
  ])
  const bare = `M${a} L${b} C${c} ${d} ${e} C${f} ${g} ${h} L${i} L${j} L${k} C${l} ${m} ${n} C${o} ${o} ${a} Z`

  let wear: ReactNode = null
  if (outfit === 'salwar') {
    const [p1, p2, p3, p4, p5, p6, p7, p8, p9, p10] = P([
      [57.5, 180], [85, 180], [93, 236], [92, 296], [80.5, 328], [77, 339], [64, 339], [60, 328], [53, 296], [55, 236],
    ])
    wear = (
      <g>
        <path d={`M${p1} L${p2} C${p3} ${p4} ${p5} L${p6} L${p7} L${p8} C${p9} ${p10} ${p1} Z`} fill={paint('legs')} {...line(legs)} />
        {/* Gathered folds above the ankle cuff. */}
        <path
          d={`M${P([[64, 300]])} Q${P([[70, 309]])} ${P([[80, 302]])} M${P([[63, 314]])} Q${P([[70, 321]])} ${P([[79, 315]])} M${P([[70, 240]])} Q${P([[73, 270]])} ${P([[70, 296]])}`}
          stroke={shade(legs, 0.35)}
          strokeWidth="0.8"
          fill="none"
        />
        <path d={`M${P([[63.8, 329]])} L${P([[80.6, 329]])} L${P([[77.4, 339]])} L${P([[64.4, 339]])} Z`} fill={shade(legs, 0.18)} {...line(legs, 0.6)} />
      </g>
    )
  } else if (outfit === 'pinafore') {
    // Knee-length skirt (drawn with the torso): only the socks show here.
    const [s1, s2, s3, s4] = P([[64.4, 296], [78.6, 296], [74, 339], [65.6, 339]])
    wear = <path d={`M${s1} L${s2} C${P([[78.2, 318]])} ${P([[75.5, 330]])} ${s3} L${s4} C${P([[65.3, 330]])} ${P([[64, 318]])} ${s1} Z`} fill={paint('legs')} {...line(SOCKS, 0.6)} />
  } else {
    // Trousers, jeans or pyjama: a little wider than the leg, with a crease and knee folds.
    const loose = outfit === 'kurta' ? 2.2 : outfit === 'casual' ? 0.4 : 1
    const [t1, t2, t3, t4, t5, t6, t7, t8, t9, t10, t11] = P([
      [59.8, 182], [82 + loose, 182], [83 + loose, 214], [81.5 + loose, 246], [79.8 + loose, 272], [78.4 + loose, 340],
      [63.6 - loose * 0.6, 340], [62.8 - loose * 0.6, 272], [62.2 - loose * 0.4, 246], [61 - loose * 0.2, 214], [79 + loose, 306],
    ])
    wear = (
      <g>
        <path d={`M${t1} L${t2} C${t3} ${t4} ${t5} C${t11} ${t11} ${t6} L${t7} C${P([[63.2, 306]])} ${t8} ${t8} C${t9} ${t10} ${t1} Z`} fill={paint('legs')} {...line(legs)} />
        <path d={`M${P([[71.5, 200]])} L${P([[71, 336]])}`} stroke={shade(legs, 0.25)} strokeWidth="0.6" opacity="0.7" />
        <path d={`M${P([[64, 268]])} Q${P([[71, 273]])} ${P([[78, 266]])} M${P([[66, 330]])} Q${P([[71, 334]])} ${P([[77, 329]])}`} stroke={shade(legs, 0.35)} strokeWidth="0.8" fill="none" />
        {outfit === 'casual' && <path d={`M${P([[63.6, 333]])} L${P([[78.8, 333]])}`} stroke={lighten(legs, 0.3)} strokeWidth="1.2" />}
      </g>
    )
  }

  return (
    <g>
      <path d={bare} fill={paint('skin')} {...line(skin)} />
      {wear}
      <Foot side={side} kind={look.shoeKind} paint={paint} shoe={look.shoe} skin={skin} />
    </g>
  )
}

function Foot({ side, kind, paint, shoe, skin }: { side: 'l' | 'r'; kind: OutfitLook['shoeKind']; paint: Paint; shoe: string; skin: string }) {
  const x = mirror(side)
  const P = (px: number, py: number) => `${x(px)} ${py}`
  // A foot turned a little outward, seen from the front.
  const shape = `M${P(64.6, 334)} C${P(65.5, 331)} ${P(74, 331)} ${P(75, 334)} C${P(78, 337)} ${P(82.5, 341)} ${P(82, 346)} C${P(81.8, 349.6)} ${P(78, 350.6)} ${P(73, 350.6)} L${P(66, 350.6)} C${P(63.4, 350.6)} ${P(62.6, 348)} ${P(63, 345)} C${P(63.2, 341)} ${P(63.8, 337)} ${P(64.6, 334)} Z`
  const sole = `M${P(62.8, 347)} C${P(70, 348.4)} ${P(77, 348.4)} ${P(82, 346.4)} C${P(81.6, 349.8)} ${P(78, 351)} ${P(73, 351)} L${P(66, 351)} C${P(63.5, 351)} ${P(62.6, 349.2)} ${P(62.8, 347)} Z`

  if (kind === 'sandal') {
    return (
      <g>
        <path d={shape} fill={paint('skin')} {...line(skin, 0.7)} />
        <path d={`M${P(65, 340)} Q${P(72.5, 337)} ${P(79, 341)}`} stroke={shade(SANDAL, 0.1)} strokeWidth="2.2" fill="none" strokeLinecap="round" />
        <path d={sole} fill={shade(SANDAL, 0.2)} {...line(SANDAL, 0.5)} />
      </g>
    )
  }
  return (
    <g>
      <path d={shape} fill={paint('shoe')} {...line(shoe, 0.8)} />
      {kind === 'sneaker' ? (
        <>
          <path d={sole} fill="#bdb6aa" {...line('#bdb6aa', 0.5)} />
          <path d={`M${P(66, 337)} Q${P(70, 339)} ${P(74.5, 336.5)}`} stroke={UNIFORM_NAVY} strokeWidth="1" fill="none" />
          <path d={`M${P(70, 343)} Q${P(75, 340)} ${P(80, 343)}`} stroke={JEANS} strokeWidth="1.1" fill="none" />
        </>
      ) : (
        <>
          <path d={sole} fill={shade(shoe, 0.5)} />
          <path d={`M${P(66.5, 335)} Q${P(69.5, 333.4)} ${P(73, 335)}`} stroke={lighten(shoe, 0.35)} strokeWidth="0.8" fill="none" />
          <ellipse cx={x(76)} cy="341.5" rx="2.6" ry="1.1" fill={lighten(shoe, 0.5)} opacity="0.55" />
        </>
      )}
    </g>
  )
}

// ---------------------------------------------------------------- arms

/** Arm edges along its length (right side): x of the outer and inner edge at a given y. */
function armEdges(y: number): [number, number] {
  if (y <= 154) {
    const k = Math.max(0, (y - 104) / 50)
    return [96.6 - k * 2.6, 81.2 + k * 1.4]
  }
  const k = (y - 154) / 43
  return [94 - k * 2.6, 82.6 + k * 2.6]
}

function Arm({ side, look, paint, skin }: { side: 'l' | 'r'; look: OutfitLook; paint: Paint; skin: string }) {
  const x = mirror(side)
  const P = (px: number, py: number) => `${x(px)} ${py}`
  const top = look.top

  // Shoulder cap (deltoid), upper arm, a slight narrowing at the elbow, forearm tapering to the wrist.
  const arm =
    `M${P(80.5, 96)} C${P(86, 91)} ${P(95, 92.5)} ${P(96.5, 101)} C${P(97.5, 110)} ${P(96.5, 122)} ${P(95.2, 134)} ` +
    `C${P(94.6, 142)} ${P(94.2, 148)} ${P(94, 154)} C${P(94.4, 165)} ${P(93.4, 182)} ${P(91.4, 197.5)} L${P(85.2, 197.5)} ` +
    `C${P(84.6, 184)} ${P(83.4, 170)} ${P(82.6, 156)} C${P(82, 140)} ${P(81, 124)} ${P(81.2, 110)} C${P(81, 104)} ${P(80.6, 100)} ${P(80.5, 96)} Z`

  // Hand seen from the side (thumb forward), as a relaxed arm hangs.
  const hand =
    `M${P(84.8, 196)} L${P(91.6, 196)} C${P(93.2, 202)} ${P(93.6, 209)} ${P(92.6, 215)} C${P(92, 219.6)} ${P(89.6, 222.6)} ${P(87.5, 222)} ` +
    `C${P(85.4, 221.4)} ${P(85, 218)} ${P(84.8, 215)} C${P(83.2, 212)} ${P(82.8, 206)} ${P(83.4, 202)} Z`
  const thumb = `M${P(84.2, 202)} C${P(81.8, 206)} ${P(81.8, 211)} ${P(83, 213.6)} C${P(84.2, 214.6)} ${P(85.2, 213)} ${P(85.2, 210.6)} Z`

  // The sleeve is a little wider than the arm and ends at sleeveEnd.
  const e = look.sleeveEnd
  const [outer, inner] = armEdges(e)
  const sleeve =
    `M${P(78.5, 94)} C${P(86, 88.5)} ${P(97, 90)} ${P(98.4, 101)} C${P(99.2, 110)} ${P(outer + 2, e - 14)} ${P(outer + 1.6, e)} ` +
    `Q${P((outer + inner) / 2, e + 2.4)} ${P(inner - 1.4, e)} C${P(inner - 1.4, e - 14)} ${P(79, 118)} ${P(78.5, 94)} Z`

  return (
    <g>
      <path d={arm} fill={paint('skin')} {...line(skin)} />
      <path d={hand} fill={paint('skin')} {...line(skin, 0.7)} />
      <path d={thumb} fill={lighten(skin, 0.06)} {...line(skin, 0.6)} />
      <path d={`M${P(86.5, 216)} L${P(87, 220)} M${P(89.4, 216.4)} L${P(89.8, 220.6)}`} stroke={shade(skin, 0.4)} strokeWidth="0.5" />
      <path d={sleeve} fill={paint('top')} {...line(top)} />
      {/* The sleeve's shadow on the arm, and a fold at the elbow for long sleeves. */}
      {e < 190 && <path d={`M${P(outer, e + 1.2)} Q${P((outer + inner) / 2, e + 4.6)} ${P(inner, e + 1.2)} L${P(inner, e + 3.4)} Q${P((outer + inner) / 2, e + 6.4)} ${P(outer, e + 3.4)} Z`} {...castShadow(skin, 0.4)} />}
      {e > 160 && <path d={`M${P(83, 152)} Q${P(88, 156)} ${P(94.5, 151)}`} stroke={shade(top, 0.35)} strokeWidth="0.8" fill="none" />}
      <path d={`M${P(outer + 1.6, e - 1)} Q${P((outer + inner) / 2, e + 1.6)} ${P(inner - 1.4, e - 1)}`} stroke={shade(top, 0.3)} strokeWidth="0.8" fill="none" />
    </g>
  )
}

// ---------------------------------------------------------------- bag and dupatta

function BagBehind({ paint }: { paint: Paint }) {
  return (
    <g>
      {/* The bag's top handle and upper edges show above and beside the shoulders. */}
      <path d="M52 80 Q60 70 68 80" stroke={shade(BAG, 0.4)} strokeWidth="2.4" fill="none" />
      <path d="M30 98 Q30 86 42 85 L78 85 Q90 86 90 98 L91 176 Q91 184 83 184 L37 184 Q29 184 29 176 Z" fill={paint('bag')} {...line(BAG)} />
    </g>
  )
}

function BagStraps() {
  const strap = shade(BAG, 0.25)
  return (
    <g fill={strap} {...line(BAG, 0.6)}>
      <path d="M40.5 90 L47.5 89 L45.5 166 L39.4 165 Z" />
      <path d="M79.5 90 L72.5 89 L74.5 166 L80.6 165 Z" />
      <rect x="39.4" y="138" width="7.4" height="4.4" rx="1" fill={lighten(BAG, 0.45)} />
      <rect x="73.2" y="138" width="7.4" height="4.4" rx="1" fill={lighten(BAG, 0.45)} />
    </g>
  )
}

function Dupatta({ paint, scarf }: { paint: Paint; scarf: string }) {
  const trim = lighten(scarf, 0.4)
  return (
    <g>
      {/* The two ends fall over the shoulders, the middle drapes across the chest. */}
      <path d="M33 93 L46 94 L44 208 Q38.5 212 33 207 Z" fill={paint('scarf')} {...line(scarf)} />
      <path d="M87 93 L74 94 L76 208 Q81.5 212 87 207 Z" fill={paint('scarf')} {...line(scarf)} />
      <path d="M32 94 Q60 142 88 94 L91 104 Q60 160 29 104 Z" fill={paint('scarf')} {...line(scarf)} />
      <path d="M40 112 Q60 140 80 112 M46 99 Q60 120 74 99" stroke={shade(scarf, 0.3)} strokeWidth="0.8" fill="none" />
      <path d="M29.6 104.6 Q60 159 90.4 104.6" stroke={trim} strokeWidth="1.8" fill="none" />
      <path d="M33.6 206 Q38.5 210.5 43.6 207.5 M86.4 206 Q81.5 210.5 76.4 207.5" stroke={trim} strokeWidth="1.8" fill="none" />
      <path d="M40 112 L39 200 M80 112 L81 200" stroke={shade(scarf, 0.3)} strokeWidth="0.7" opacity="0.7" />
    </g>
  )
}

// ---------------------------------------------------------------- head

// Face (slightly narrower at the jaw, with a defined chin), head 38 units wide, chin at y 70.
const FACE =
  'M41.5 38 C41 27 49 18.5 60 18.5 C71 18.5 79 27 78.5 38 C78.8 46 78.4 52 76.6 57.5 C74.8 63 70 68 64.5 70.2 ' +
  'C61.6 71.2 58.4 71.2 55.5 70.2 C50 68 45.2 63 43.4 57.5 C41.6 52 41.2 46 41.5 38 Z'

function Head(props: {
  spec: CharacterSpec
  mood: Mood
  pose: Pose
  paint: Paint
  uid: string
  skin: string
  hair: string
  scarf: string
}) {
  const { spec, mood, pose, paint, uid, skin, hair, scarf } = props
  const skinShadow = shade(skin, 0.4)
  const lips = mix(skin, '#7a2c2a', 0.42)
  const showHair = spec.headwear !== 'hijab' && spec.headwear !== 'patka'

  return (
    <g>
      {spec.headwear === 'hijab' && <HijabBack paint={paint} scarf={scarf} />}
      {showHair && <HairBack style={spec.hair} paint={paint} hair={hair} />}
      {spec.headwear !== 'hijab' && (
        <g fill={paint('skin')} {...line(skin, 0.7)}>
          <path d="M42 41 C38.2 39.6 36.8 43.5 37.4 47.5 C38 51.5 39.4 55 42.6 55.6 Z" />
          <path d="M78 41 C81.8 39.6 83.2 43.5 82.6 47.5 C82 51.5 80.6 55 77.4 55.6 Z" />
          <path d="M40.6 44 Q39 47.5 40.8 52 M79.4 44 Q81 47.5 79.2 52" stroke={skinShadow} strokeWidth="0.8" fill="none" />
        </g>
      )}

      <path d={FACE} fill={`url(#${uid}-face)`} {...line(skin, 0.8)} />

      <g clipPath={`url(#${uid}-faceclip)`}>
        {/* Cel shadow on the right of the face, following the cheekbone and jaw. */}
        <path d="M71 22 C76 34 76.5 46 73.4 55 C71 62 66.5 67.5 60.5 71.5 L84 76 L84 18 Z" fill={skinShadow} opacity="0.5" />
        {/* The hair or head covering casts a shadow across the forehead. */}
        <path d="M38 40 C42 31 50 28.5 60 28.5 C70 28.5 78 31 82 40 L82 43 C77 36 70 33.6 60 33.6 C50 33.6 43 36 38 43 Z" fill={skinShadow} opacity={showHair ? 0.35 : 0.25} />
        {/* Soft shading in the eye sockets and under the lower lip. */}
        <ellipse cx="60.3" cy="66.4" rx="3.2" ry="1.2" fill={skinShadow} opacity="0.3" />
        {/* Warmth on the cheeks, mixed from the skin so it suits every tone. */}
        <ellipse cx="48.5" cy="55" rx="4.4" ry="2.6" fill={mix(skin, '#c2463a', 0.5)} opacity="0.09" />
        <ellipse cx="71.5" cy="55" rx="4.4" ry="2.6" fill={mix(skin, '#c2463a', 0.5)} opacity="0.07" />
      </g>

      <Eyes mood={mood} uid={uid} skin={skin} />
      <Brows mood={mood} color={shade(hair, 0.15)} />
      <Nose skin={skin} />
      {pose === 'talk' ? (
        <g className="ch-part ch-mouth-talk">
          <ellipse cx="60.3" cy="62.8" rx="3" ry="2" fill={shade(lips, 0.45)} {...line(lips, 0.6)} />
          <path d="M57.8 61.6 Q60.3 60.9 62.8 61.6" stroke="#f2ece4" strokeWidth="0.8" fill="none" />
        </g>
      ) : (
        <Mouth mood={mood} lips={lips} />
      )}

      {showHair && <HairFront style={spec.hair} paint={paint} hair={hair} />}
      {spec.headwear === 'patka' && <Patka paint={paint} scarf={scarf} />}
      {spec.headwear === 'hijab' && <HijabFront paint={paint} scarf={scarf} />}

      {spec.glasses && (
        <g stroke="#2a1d18" strokeWidth="1" fill="#dfeef5" fillOpacity="0.18">
          <rect x="45.6" y="41.6" width="11.6" height="8.6" rx="3" />
          <rect x="63" y="41.6" width="11.6" height="8.6" rx="3" />
          <path d="M57.2 44.6 Q60.1 43.2 63 44.6 M45.6 44 L41.6 43 M74.6 44 L78.4 43" fill="none" />
          <path d="M47.5 43.5 L50 42.8" stroke="#ffffff" strokeWidth="0.8" opacity="0.7" />
          <path d="M65 43.5 L67.5 42.8" stroke="#ffffff" strokeWidth="0.8" opacity="0.7" />
        </g>
      )}
    </g>
  )
}

function Eyes({ mood, uid, skin }: { mood: Mood; uid: string; skin: string }) {
  // How open the eyes are: wide when surprised, a little narrowed in a smile.
  const open = mood === 'surprised' ? 1.35 : mood === 'happy' ? 0.82 : mood === 'sad' ? 0.88 : 1
  const lid = shade(skin, 0.62)
  return (
    <g className="ch-part ch-eyes">
      {[51.5, 68.6].map((cx, i) => {
        const cy = 46
        const h = 2.7 * open
        const almond = `M${cx - 4.4} ${cy + 0.3} C${cx - 2.6} ${cy - h} ${cx + 2} ${cy - h - 0.2} ${cx + 4.4} ${cy - 0.3} C${cx + 2.6} ${cy + h * 0.72} ${cx - 2} ${cy + h * 0.76} ${cx - 4.4} ${cy + 0.3} Z`
        const clip = `${uid}-eye${i}`
        return (
          <g key={cx}>
            <clipPath id={clip}>
              <path d={almond} />
            </clipPath>
            <path d={almond} fill={EYE_WHITE} />
            <g clipPath={`url(#${clip})`}>
              <circle cx={cx + 0.5} cy={cy + 0.2} r={mood === 'surprised' ? 2 : 2.3} fill={IRIS} />
              <circle cx={cx + 0.5} cy={cy + 0.9} r="1.4" fill={lighten(IRIS, 0.25)} opacity="0.6" />
              <circle cx={cx + 0.5} cy={cy + 0.2} r="1.05" fill="#120a07" />
              {/* The upper lid's shadow on the eye. */}
              <path d={`M${cx - 5} ${cy - 4} L${cx + 5} ${cy - 4} L${cx + 5} ${cy - h + 1.3} Q${cx} ${cy - h + 0.4} ${cx - 5} ${cy - h + 1.5} Z`} fill={shade(skin, 0.5)} opacity="0.35" />
              <circle cx={cx + 1.3} cy={cy - 0.7} r="0.6" fill="#ffffff" />
            </g>
            {/* Lash line (heavier at the outer corner), lid crease and a faint lower lid. */}
            <path
              d={`M${cx - 4.7} ${cy + 0.5} C${cx - 2.6} ${cy - h - 0.4} ${cx + 2} ${cy - h - 0.6} ${cx + 4.8} ${cy - 0.6}`}
              stroke="#1a100c"
              strokeWidth="1.15"
              fill="none"
              strokeLinecap="round"
            />
            <path d={`M${cx - 3.8} ${cy - h - 1.4} Q${cx} ${cy - h - 2.8} ${cx + 3.8} ${cy - h - 1.4}`} stroke={lid} strokeWidth="0.55" fill="none" opacity="0.6" />
            <path d={`M${cx - 3} ${cy + h * 0.78 + 0.5} Q${cx} ${cy + h * 0.95 + 0.8} ${cx + 3} ${cy + h * 0.7 + 0.4}`} stroke={lid} strokeWidth="0.45" fill="none" opacity="0.45" />
            {mood === 'happy' && <path d={`M${cx - 3.6} ${cy + 2.6} Q${cx} ${cy + 0.8} ${cx + 3.6} ${cy + 2.4}`} stroke={lid} strokeWidth="0.6" fill="none" opacity="0.7" />}
          </g>
        )
      })}
    </g>
  )
}

function Brows({ mood, color }: { mood: Mood; color: string }) {
  // [inner lift, outer lift] in units (negative = higher).
  const lift: Record<Mood, [number, number]> = {
    neutral: [0, 0],
    happy: [-0.6, -0.4],
    worried: [-2, 0.4],
    sad: [-1.6, 0.8],
    surprised: [-2.2, -1.8],
  }
  const [inner, outer] = lift[mood]
  const brow = (side: 1 | -1) => {
    // side 1 = the character's right (viewer's left), -1 = mirrored around x = 60.
    const x = (v: number) => (side === 1 ? v : 120 - v + 0.6)
    const iy = 40 + inner
    const oy = 40.6 + outer
    return `M${x(56)} ${iy + 0.8} Q${x(51)} ${(iy + oy) / 2 - 2.6} ${x(45.6)} ${oy + 0.4} Q${x(51)} ${(iy + oy) / 2 - 1.2} ${x(56.2)} ${iy - 0.9} Z`
  }
  return (
    <g fill={color} stroke={color} strokeWidth="0.35" strokeLinejoin="round">
      <path d={brow(1)} />
      <path d={brow(-1)} />
    </g>
  )
}

function Nose({ skin }: { skin: string }) {
  const s = shade(skin, 0.45)
  return (
    <g>
      {/* The shaded side of the nose bridge, the tip catching light, nostrils and the shadow under the nose. */}
      <path d="M61.4 46.5 C62.3 50 63.3 53 64 55 C63.2 56.4 61.8 56.8 60.8 56.5 C62 55.6 62.4 54.4 62.1 53 C61.6 50.5 61.3 48.5 61.4 46.5 Z" fill={s} opacity="0.55" />
      <ellipse cx="60.3" cy="54.6" rx="1.3" ry="0.8" fill={lighten(skin, 0.25)} opacity="0.7" />
      <path d="M57.4 56.2 Q58.2 57.1 59.2 56.8 M61.6 56.8 Q62.6 57.1 63.4 56.2" stroke={shade(skin, 0.6)} strokeWidth="0.7" fill="none" strokeLinecap="round" />
      <path d="M57.5 57.6 Q60.4 58.8 63.3 57.6" stroke={s} strokeWidth="0.6" fill="none" opacity="0.5" />
    </g>
  )
}

function Mouth({ mood, lips }: { mood: Mood; lips: string }) {
  const dark = shade(lips, 0.5)
  switch (mood) {
    case 'happy':
      return (
        <g>
          <path d="M55.6 61.4 Q60.3 66.8 65 61.4 Q60.3 62.6 55.6 61.4 Z" fill={dark} {...line(lips, 0.5)} />
          <path d="M56.8 61.8 Q60.3 63 63.8 61.8 L63.4 62.6 Q60.3 63.6 57.2 62.6 Z" fill="#f2ece4" />
          <path d="M57.6 65.2 Q60.3 66.4 63 65.2" stroke={lighten(lips, 0.2)} strokeWidth="0.6" fill="none" opacity="0.7" />
        </g>
      )
    case 'surprised':
      return <ellipse cx="60.3" cy="63.2" rx="2" ry="2.6" fill={dark} {...line(lips, 0.5)} />
    case 'worried':
      return <path d="M56.6 63 Q58.4 61.8 60.3 62.8 Q62.2 61.8 64 63" stroke={dark} strokeWidth="0.9" fill="none" strokeLinecap="round" />
    case 'sad':
      return <path d="M56.6 63.6 Q60.3 60.8 64 63.6" stroke={dark} strokeWidth="0.9" fill="none" strokeLinecap="round" />
    default:
      return (
        <g>
          {/* Upper lip in shadow, lower lip catching light. */}
          <path d="M56.4 62 Q58.4 60.9 60.3 61.6 Q62.2 60.9 64.2 62 Q60.3 62.9 56.4 62 Z" fill={shade(lips, 0.2)} />
          <path d="M56.4 62 Q60.3 63 64.2 62" stroke={dark} strokeWidth="0.8" fill="none" strokeLinecap="round" />
          <path d="M57.8 62.9 Q60.3 65 62.8 62.9 Q60.3 63.6 57.8 62.9 Z" fill={lips} opacity="0.7" />
        </g>
      )
  }
}

// ---------------------------------------------------------------- head coverings

function Patka({ paint, scarf }: { paint: Paint; scarf: string }) {
  const fold = shade(scarf, 0.35)
  return (
    <g>
      {/* A cloth covering the hair, wrapped close to the head, with the joora (top knot) under it. */}
      <path d="M39.8 44 C37 22 46 12 60 12 C74 12 83 22 80.2 44 C76 37.5 68.5 34 60 34 C51.5 34 44 37.5 39.8 44 Z" fill={paint('scarf')} {...line(scarf)} />
      <ellipse cx="60" cy="12.5" rx="9.6" ry="7.6" fill={paint('scarf')} {...line(scarf)} />
      <path d="M42.5 38.5 Q60 29 77.5 38.5 M45 31 Q60 23 75 31 M52 9 Q60 15 68 9 M50 18 Q60 13 70 18" stroke={fold} strokeWidth="0.9" fill="none" />
      <path d="M41 42 Q60 33.5 79 42" stroke={lighten(scarf, 0.3)} strokeWidth="0.7" fill="none" opacity="0.6" />
    </g>
  )
}

function HijabBack({ paint, scarf }: { paint: Paint; scarf: string }) {
  return (
    <path
      d="M35 46 C31 14 89 14 85 46 C86 62 86 76 92 92 Q97 104 99 112 L21 112 Q23 104 28 92 C34 76 34 62 35 46 Z"
      fill={paint('scarf')}
      {...line(scarf)}
    />
  )
}

function HijabFront({ paint, scarf }: { paint: Paint; scarf: string }) {
  return (
    <g>
      {/* The band framing the face, and the folds falling onto the chest. */}
      <path
        d={'M43 40 C43 32.5 50 29.5 60 29.5 C70 29.5 77 32.5 77 40 C77.6 50 77 56 75 61 C72 67 66 71 60 71.6 C54 71 48 67 45 61 C43 56 42.4 50 43 40 Z M38.5 38 C38 23 47.5 14.5 60 14.5 C72.5 14.5 82 23 81.5 38 C82 50 81 60 78 64 C74 70 67 74 60 74 C53 74 46 70 42 64 C39 60 38 50 38.5 38 Z'}
        fill={paint('scarf')}
        fillRule="evenodd"
        {...line(scarf)}
      />
      <path d="M36 88 Q48 106 45 112 M84 88 Q72 106 75 112 M44 72 Q60 84 76 72" stroke={shade(scarf, 0.35)} strokeWidth="0.9" fill="none" />
      <path d="M44 20 Q60 13.5 76 20" stroke={lighten(scarf, 0.35)} strokeWidth="0.8" fill="none" opacity="0.6" />
    </g>
  )
}

// ---------------------------------------------------------------- hair

interface HairProps {
  style: string
  paint: Paint
  hair: string
}

/** Strands (darker) and a band of highlights give the hair clumps and shine. */
function strands(hair: string, dark: string, light: string): ReactNode {
  return (
    <>
      <path d={dark} stroke={shade(hair, 0.55)} strokeWidth="0.7" fill="none" strokeLinecap="round" />
      <path d={light} stroke={lighten(hair, 0.42)} strokeWidth="1" fill="none" strokeLinecap="round" opacity="0.75" />
    </>
  )
}

/** Hair behind the whole body (ponytail, long plaits from behind). */
function HairBehind({ style, paint, hair }: HairProps) {
  if (style === 'ponytail') {
    return (
      <g>
        <path d="M70 24 C88 26 93 44 91 64 C90 82 86 96 82 104 C82 88 81 72 78 58 C76 46 73 36 68 30 Z" fill={paint('hair')} {...line(hair)} />
        {strands(hair, 'M80 40 Q86 60 84 92 M76 46 Q81 66 81 90', 'M84 36 Q89 50 88 66')}
      </g>
    )
  }
  return null
}

/** Hair behind the face but in front of the body (bob, curly sides, bun, the back of long hair). */
function HairBack({ style, paint, hair }: HairProps) {
  const outline = line(hair)
  switch (style) {
    case 'bun':
      return (
        <g>
          <ellipse cx="60" cy="9" rx="10" ry="8.4" fill={paint('hair')} {...outline} />
          {strands(hair, 'M52 9 Q60 3 68 9 M54 13 Q60 9 66 13', 'M54 6 Q58 3 63 4')}
        </g>
      )
    case 'bob':
      return (
        <path
          d="M37 44 C34 18 86 18 83 44 C84 54 85 63 84.5 70 Q80 74.5 75 71 C76 62 77 52 76 44 L44 44 C43 52 44 62 45 71 Q40 74.5 35.5 70 C35 63 36 54 37 44 Z"
          fill={paint('hair')}
          {...outline}
        />
      )
    case 'curly':
      return (
        <g fill={paint('hair')} {...outline}>
          {[
            [38.5, 46, 6.4],
            [81.5, 46, 6.4],
            [38, 55, 5],
            [82, 55, 5],
          ].map(([cx, cy, r]) => (
            <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={r} />
          ))}
        </g>
      )
    case 'plait':
    case 'two-plaits':
    case 'ponytail':
      // Long hair pulled back: a little shows behind the ears.
      return <path d="M39 44 C37 24 83 24 81 44 L80 62 L40 62 Z" fill={shade(hair, 0.25)} {...outline} />
    default:
      return null
  }
}

/** Hair over the forehead. Each style has its own hairline, clumps and highlight. */
function HairFront({ style, paint, hair }: HairProps) {
  const fill = paint('hair')
  const outline = line(hair)
  switch (style) {
    case 'short':
      return (
        <g>
          <path
            d="M40.2 44 C37.5 24 47 11.5 61 11.5 C74 11.5 83.6 22 79.8 44 C79 38 77.4 34 74.5 31.5 L72 34.5 L69.5 30.8 L65.5 33.8 L62 30 L57.5 33.6 L53.5 30.6 L49.5 34 L46.5 31.6 C43.2 34.6 41.2 39 40.2 44 Z"
            fill={fill}
            {...outline}
          />
          {strands(hair, 'M50 16 Q47 22 47.5 30 M58 14 Q56 22 57.5 31 M67 14.5 Q68 22 66 31 M74 19 Q76 25 73 31', 'M48 19 Q57 13.5 68 15.5')}
        </g>
      )
    case 'side-part':
      return (
        <g>
          <path
            d="M40 46 C36 23 51 10.5 64 12 C77 13.5 84.5 26 80 46 C79 39 77 34.5 73.5 32 C66 32.5 58 31 52.5 27 C49 30.5 46 32 44 35.5 C42 38.5 40.8 42 40 46 Z"
            fill={fill}
            {...outline}
          />
          {strands(hair, 'M51 15 Q53 21 52.5 27 M53 26 Q62 31 73 31.5 M57 18 Q66 24 77 26 M47 22 Q44 30 42.5 38', 'M55 16 Q64 13.5 74 17.5 M58 21 Q66 25 74 26')}
        </g>
      )
    case 'curly':
      return (
        <g>
          <g fill={fill} {...outline}>
            {[
              [43, 35, 7.2],
              [47.5, 26, 7.6],
              [55, 19.5, 8.2],
              [64.5, 18.5, 8.2],
              [73, 23, 7.8],
              [78.6, 31.5, 7],
              [81, 40, 5.6],
              [39.6, 42, 5.2],
              [52, 31.5, 5.2],
              [62, 30.5, 5.4],
              [71, 32, 4.8],
            ].map(([cx, cy, r]) => (
              <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={r} />
            ))}
          </g>
          {strands(
            hair,
            'M44 33 q2 -3 4 0 M53 27 q2 -3 4 0 M62 26 q2 -3 4 0 M71 29 q2 -3 4 0 M48 22 q2 -3 4 0 M58 16 q2 -3 4 0 M68 18 q2 -3 4 0',
            'M45 25 q3 -3 6 -2 M53 17 q3 -3 6 -2 M63 15 q3 -2 6 0',
          )}
        </g>
      )
    case 'bob':
      return (
        <g>
          <path
            d="M39 44 C35.5 17 50 12 60 12 C70 12 84.5 17 81 44 C80 39 79 36 77.5 34 L74 36.5 L71 33.5 L67 36 L63.5 33 L60 35.8 L56.5 33 L53 36 L49 33.5 L46 36.5 L42.5 34 C41 36 39.6 39 39 44 Z"
            fill={fill}
            {...outline}
          />
          {strands(hair, 'M48 15 Q46 24 46 33 M56 13 Q55 23 55.5 33 M64 13 Q65 23 64.5 33 M72 15 Q74 24 74 33', 'M46 18 Q60 12.5 74 18')}
        </g>
      )
    default: // ponytail, plait, two plaits, bun: hair pulled back, with a middle parting
      return (
        <g>
          <path d="M39.6 46 C36 20 50 12 60 12 C70 12 84 20 80.4 46 C79.2 38 76.2 32 71.4 29.6 C65.6 28 54.4 28 48.6 29.6 C43.8 32 40.8 38 39.6 46 Z" fill={fill} {...outline} />
          <path d="M60 13 L60 28.5" stroke={shade(hair, 0.55)} strokeWidth="0.8" />
          {strands(hair, 'M57 14 Q49 18 43.5 30 M63 14 Q71 18 76.5 30 M54 16 Q46 24 42 38 M66 16 Q74 24 78 38', 'M52 17 Q47 21 45 27 M68 17 Q73 21 75 27')}
        </g>
      )
  }
}

/** Plaits that fall in front of the shoulders. */
function HairOver({ style, paint, hair }: HairProps) {
  const plait = (x: number, drift: number) => (
    <g key={x}>
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
        <ellipse
          key={i}
          cx={x + drift * i}
          cy={70 + i * 9.4}
          rx={4.6 - i * 0.14}
          ry="5.8"
          fill={paint('hair')}
          {...line(hair, 0.7)}
          transform={`rotate(${i % 2 === 0 ? 14 : -14} ${x + drift * i} ${70 + i * 9.4})`}
        />
      ))}
      <path d={`M${x + drift * 8 - 2.6} 144 L${x + drift * 8 + 2.6} 144 L${x + drift * 8 + 1.6} 154 L${x + drift * 8 - 1.6} 154 Z`} fill={shade(hair, 0.2)} {...line(hair, 0.6)} />
      <rect x={x + drift * 8 - 3} y="141.5" width="6" height="3" rx="1" fill="#b5532f" />
    </g>
  )
  if (style === 'plait') return plait(78, 0.4)
  if (style === 'two-plaits') return <>{[plait(42, -0.4), plait(78, 0.4)]}</>
  return null
}
