// The paper-doll player character: one SVG rig shared by every option.
//
// Design space: 120 x 360 units, about 6.5 heads tall (realistic for ages 8 to 16).
// The body is split into groups that pivot at the shoulders, hips and neck, so
// every outfit, hairstyle and headwear moves with the same animations
// (character.css). No outlines: shapes are separated by soft light-to-shadow
// gradients, lit from the upper left like late-afternoon sun.

import { useId, type ReactNode } from 'react'
import type { Mood } from '@content/types'
import { darken, lighten, mix } from './color'
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
  portrait: '22 6 76 108', // head and shoulders
}

// Fixed colours for the parts players don't colour themselves.
const UNIFORM_SHIRT = '#d5e3ee'
const UNIFORM_NAVY = '#33405f'
const JEANS = '#4a6283'
const PYJAMA = '#ebe3d2'
const SOCKS = '#f2efe8'
const SCHOOL_SHOE = '#2a2420'
const SANDAL = '#6b4528'
const BAG = '#3d6b9e'

interface Props {
  spec: CharacterSpec
  pose?: Pose
  mood?: Mood
  facing?: Facing
  view?: View
  /** Accessible description. Without it the drawing is hidden from screen readers (decorative). */
  label?: string
  className?: string
}

export function Character({ spec, pose = 'idle', mood = 'neutral', facing = 'right', view = 'full', label, className }: Props) {
  // Gradient ids must be unique on the page, because many characters can be shown at once.
  const uid = 'ch' + useId().replace(/[^a-zA-Z0-9]/g, '')
  const face: Mood = pose === 'gasp' ? 'surprised' : pose === 'cheer' ? 'happy' : mood

  const skin = colorOf(skinTones, spec.skin)
  const hair = colorOf(hairColors, spec.hairColor)
  const cloth = colorOf(outfitColors, spec.outfitColor)
  const scarf = colorOf(headwearColors, spec.headwearColor)
  const look = outfitLook(spec.outfit, cloth)

  const paint = (name: string) => `url(#${uid}-${name})`
  const gradients: Record<string, string> = {
    skin,
    hair,
    top: look.top,
    legs: look.legs,
    scarf,
    bag: BAG,
    shoe: look.shoe,
    pinafore: UNIFORM_NAVY,
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
        {Object.entries(gradients).map(([name, base]) => (
          <linearGradient key={name} id={`${uid}-${name}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={lighten(base, 0.14)} />
            <stop offset="0.55" stopColor={base} />
            <stop offset="1" stopColor={darken(base, 0.24)} />
          </linearGradient>
        ))}
      </defs>

      {view === 'full' && <ellipse cx="60" cy="351" rx="26" ry="4" fill="#2a160c" opacity="0.18" />}

      <g className="ch-part ch-body">
        {!hidesHair && <HairBehind style={spec.hair} fill={paint('hair')} shade={darken(hair, 0.3)} />}
        {spec.bag && <path d="M26 104 Q26 96 34 96 L86 96 Q94 96 94 104 L94 182 Q94 189 87 189 L33 189 Q26 189 26 182 Z" fill={paint('bag')} />}

        {(['l', 'r'] as const).map((side) => (
          <g key={side} className={`ch-part ch-leg-${side}`}>
            <Leg cx={side === 'l' ? 51 : 69} outfit={spec.outfit} paint={paint} legs={look.legs} />
          </g>
        ))}

        {/* Neck under the collar, with a soft shadow below the chin. */}
        <path d="M53 62 L67 62 L67 95 Q60 99 53 95 Z" fill={paint('skin')} />
        <path d="M53 68 Q60 79 67 68 L67 77 Q60 84 53 77 Z" fill={darken(skin, 0.3)} opacity="0.45" />

        <Torso outfit={spec.outfit} paint={paint} top={look.top} />

        {spec.bag && (
          <g fill={darken(BAG, 0.25)}>
            <path d="M41 92 L48 92 L45 170 L39 169 Z" />
            <path d="M79 92 L72 92 L75 170 L81 169 Z" />
            <rect x="39.5" y="140" width="7" height="4" rx="1" fill={lighten(BAG, 0.35)} />
            <rect x="73.5" y="140" width="7" height="4" rx="1" fill={lighten(BAG, 0.35)} />
          </g>
        )}

        {spec.headwear === 'dupatta' && <Dupatta fill={paint('scarf')} trim={lighten(scarf, 0.35)} />}
        {!hidesHair && <HairOver style={spec.hair} fill={paint('hair')} shade={darken(hair, 0.3)} />}

        <g className="ch-part ch-head">
          {/* Children's heads are larger relative to the body: scale the head up around the neck. */}
          <g transform="translate(60 80) scale(1.12) translate(-60 -80)">
            <Head spec={spec} mood={face} pose={pose} paint={paint} skin={skin} hair={hair} scarf={scarf} />
          </g>
        </g>

        {(['l', 'r'] as const).map((side) => (
          <g key={side} className={`ch-part ch-arm-${side}`}>
            <Arm side={side} sleeveEnd={look.sleeveEnd} paint={paint} top={look.top} />
          </g>
        ))}
      </g>
    </svg>
  )
}

// ---------------------------------------------------------------- outfits

interface OutfitLook {
  top: string // shirt, kurta, kameez or T-shirt colour
  legs: string // trousers, pyjama or salwar colour
  shoe: string
  sleeveEnd: number // where the sleeve ends on the arm (y); 188 = full sleeve
}

function outfitLook(outfit: string, cloth: string): OutfitLook {
  switch (outfit) {
    case 'pinafore':
      return { top: UNIFORM_SHIRT, legs: UNIFORM_NAVY, shoe: SCHOOL_SHOE, sleeveEnd: 132 }
    case 'kurta':
      return { top: cloth, legs: PYJAMA, shoe: SANDAL, sleeveEnd: 184 }
    case 'salwar':
      return { top: cloth, legs: lighten(cloth, 0.5), shoe: SANDAL, sleeveEnd: 160 }
    case 'casual':
      return { top: cloth, legs: JEANS, shoe: SANDAL, sleeveEnd: 128 }
    default: // uniform
      return { top: UNIFORM_SHIRT, legs: UNIFORM_NAVY, shoe: SCHOOL_SHOE, sleeveEnd: 132 }
  }
}

type Paint = (name: string) => string

const SHOULDERS = 'M43 90 C52 88 68 88 77 90 C85 92.5 89.5 97 89.5 106'
const SHOULDERS_BACK = 'C30.5 97 35 92.5 43 90 Z'

function Torso({ outfit, paint, top }: { outfit: string; paint: Paint; top: string }) {
  const fold = darken(top, 0.18)
  const shirt = (
    <path d={`${SHOULDERS} C89.5 140 86 172 84 197 L36 197 C34 172 30.5 140 30.5 106 ${SHOULDERS_BACK}`} fill={paint('top')} />
  )
  const collar = (
    <>
      <path d="M54 89 L60 97 L66 89 Z" fill={paint('skin')} />
      <path d="M51.5 88.5 L58.5 99 L60 92 Z" fill={lighten(top, 0.3)} />
      <path d="M68.5 88.5 L61.5 99 L60 92 Z" fill={lighten(top, 0.3)} />
    </>
  )
  const belt = <rect x="35.5" y="189" width="49" height="8" rx="2" fill={darken(UNIFORM_NAVY, 0.25)} />

  switch (outfit) {
    case 'kurta':
      return (
        <>
          <path
            d={`${SHOULDERS} C89.5 150 91 210 95 258 Q60 264 25 258 C29 210 30.5 150 30.5 106 ${SHOULDERS_BACK}`}
            fill={paint('top')}
          />
          <path d="M54 89 L60 103 L66 89 Z" fill={paint('skin')} />
          <path d="M60 103 L60 142" stroke={fold} strokeWidth="1.2" />
          {[110, 119, 128].map((y) => (
            <circle key={y} cx="62" cy={y} r="1.1" fill={lighten(top, 0.45)} />
          ))}
          <path d="M34 200 Q36 230 30 255 M86 200 Q84 230 90 255" stroke={fold} strokeWidth="1" fill="none" opacity="0.6" />
        </>
      )
    case 'salwar':
      return (
        <>
          <path
            d={`${SHOULDERS} C89 140 86 165 87 185 C90 215 95 245 98 272 Q60 278 22 272 C25 245 30 215 33 185 C34 165 31 140 30.5 106 ${SHOULDERS_BACK}`}
            fill={paint('top')}
          />
          <path d="M52 89 Q60 101 68 89 Z" fill={paint('skin')} />
          <path d="M52 89 Q60 101 68 89" stroke={lighten(top, 0.4)} strokeWidth="1.5" fill="none" />
          {/* Side slits and a border at the hem. */}
          <path d="M31 222 L28 272 M89 222 L92 272" stroke={fold} strokeWidth="1.2" />
          <path d="M23 268 Q60 274 97 268" stroke={lighten(top, 0.4)} strokeWidth="2" fill="none" />
        </>
      )
    case 'casual':
      return (
        <>
          {shirt}
          <path d="M52 89 Q60 96 68 89 Z" fill={paint('skin')} />
          <path d="M51.5 89 Q60 97 68.5 89" stroke={darken(top, 0.2)} strokeWidth="1.6" fill="none" />
          <rect x="35.5" y="190" width="49" height="7" rx="2" fill={darken(JEANS, 0.2)} />
        </>
      )
    case 'pinafore':
      return (
        <>
          {shirt}
          {collar}
          <g fill={paint('pinafore')}>
            <path d="M42 120 L78 120 L82 190 C88 214 93 234 96 256 Q60 262 24 256 C27 234 32 214 38 190 Z" />
            <path d="M43 91 L49 91 L47 121 L41 121 Z" />
            <path d="M77 91 L71 91 L73 121 L79 121 Z" />
          </g>
          <path d="M42 196 Q60 200 78 196" stroke={lighten(UNIFORM_NAVY, 0.2)} strokeWidth="1" fill="none" />
          <path d="M40 220 L36 255 M60 202 L60 259 M80 220 L84 255" stroke={darken(UNIFORM_NAVY, 0.3)} strokeWidth="1" opacity="0.6" />
        </>
      )
    default: // uniform: shirt, collar, pocket, belt
      return (
        <>
          {shirt}
          {collar}
          <path d="M66 112 L76 112 L76 123 Q71 125 66 123 Z" fill={darken(UNIFORM_SHIRT, 0.08)} />
          <path d="M60 99 L60 190" stroke={darken(UNIFORM_SHIRT, 0.15)} strokeWidth="1" />
          {belt}
        </>
      )
  }
}

function Leg({ cx, outfit, paint, legs }: { cx: number; outfit: string; paint: Paint; legs: string }) {
  const bareLeg = `M${cx - 8} 186 L${cx + 8} 186 C${cx + 9} 232 ${cx + 7} 292 ${cx + 5} 338 L${cx - 4} 338 C${cx - 6} 292 ${cx - 8} 232 ${cx - 8} 186 Z`
  const shoe = `M${cx - 6} 336 C${cx - 6} 332.5 ${cx + 5} 331.5 ${cx + 10} 337.5 C${cx + 14} 341.5 ${cx + 14.5} 349 ${cx + 9} 350 L${cx - 6} 350 C${cx - 8.5} 346 ${cx - 8.5} 339.5 ${cx - 6} 336 Z`
  let wear: ReactNode
  if (outfit === 'salwar') {
    wear = (
      <>
        <path
          d={`M${cx - 10} 182 L${cx + 10} 182 C${cx + 15} 250 ${cx + 13} 312 ${cx + 6} 334 L${cx - 5} 334 C${cx - 13} 312 ${cx - 15} 250 ${cx - 10} 182 Z`}
          fill={paint('legs')}
        />
        <path d={`M${cx - 5} 330 L${cx + 6} 330 L${cx + 5.5} 339 L${cx - 4.5} 339 Z`} fill={darken(legs, 0.2)} />
        <path d={`M${cx - 4} 292 Q${cx} 300 ${cx + 6} 296 M${cx - 6} 312 Q${cx} 318 ${cx + 5} 314`} stroke={darken(legs, 0.18)} strokeWidth="1" fill="none" />
      </>
    )
  } else if (outfit === 'pinafore') {
    wear = <path d={`M${cx - 5.6} 300 L${cx + 6.4} 300 L${cx + 5.5} 340 L${cx - 4.6} 340 Z`} fill={SOCKS} />
  } else {
    const loose = outfit === 'kurta' ? 1.5 : 0
    wear = (
      <>
        <path
          d={`M${cx - 9.5 - loose} 182 L${cx + 9.5 + loose} 182 C${cx + 10.5 + loose} 232 ${cx + 8.5 + loose} 292 ${cx + 6.5 + loose} 340 L${cx - 5.5 - loose} 340 C${cx - 7.5 - loose} 292 ${cx - 9.5 - loose} 232 ${cx - 9.5 - loose} 182 Z`}
          fill={paint('legs')}
        />
        <path d={`M${cx + 1} 200 L${cx + 1} 336`} stroke={darken(legs, 0.15)} strokeWidth="0.8" opacity="0.6" />
      </>
    )
  }
  return (
    <>
      <path d={bareLeg} fill={paint('skin')} />
      {wear}
      <path d={shoe} fill={paint('shoe')} />
    </>
  )
}

function Arm({ side, sleeveEnd, paint, top }: { side: 'l' | 'r'; sleeveEnd: number; paint: Paint; top: string }) {
  // Drawn for the right side; the left side mirrors x around the centre line (60).
  const x = (v: number) => (side === 'r' ? v : 120 - v)
  const p = (v: number, y: number) => `${x(v)} ${y}`
  const arm = `M${p(78, 96)} C${p(87, 93)} ${p(92.5, 100)} ${p(92.5, 110)} L${p(90.5, 188)} Q${p(85, 192.5)} ${p(79.5, 188)} L${p(78.5, 112)} Z`
  // The sleeve is a little wider than the arm and ends at sleeveEnd.
  const e = sleeveEnd
  const outer = 95 - ((e - 110) * 2.6) / 78
  const sleeve = `M${p(75.5, 91)} C${p(88, 88)} ${p(95, 98)} ${p(95, 110)} L${p(outer, e)} Q${p(86, e + 3)} ${p(77.5, e)} L${p(76.5, 112)} Z`
  return (
    <>
      <path d={arm} fill={paint('skin')} />
      <path d={sleeve} fill={paint('top')} />
      <path d={`M${p(77.8, e - 1)} Q${p(86, e + 2)} ${p(outer - 0.3, e - 1)}`} stroke={darken(top, 0.2)} strokeWidth="1.2" fill="none" />
      <ellipse cx={x(85)} cy="196" rx="5.2" ry="7.5" fill={paint('skin')} />
    </>
  )
}

function Dupatta({ fill, trim }: { fill: string; trim: string }) {
  return (
    <g>
      {/* The two ends fall over the shoulders, the middle drapes across the chest. */}
      <path d="M35 94 L47 95 L45 206 Q40 209 35 204 Z" fill={fill} />
      <path d="M85 94 L73 95 L75 206 Q80 209 85 204 Z" fill={fill} />
      <path d="M34 95 Q60 140 86 95 L89 104 Q60 156 31 104 Z" fill={fill} opacity="0.95" />
      <path d="M31.5 104.5 Q60 155 88.5 104.5" stroke={trim} strokeWidth="1.8" fill="none" />
      <path d="M36 203 Q40 207 44.5 205 M84 203 Q80 207 75.5 205" stroke={trim} strokeWidth="1.8" fill="none" />
      <path d="M41 110 L40 196 M79 110 L80 196" stroke={trim} strokeWidth="0.8" opacity="0.35" />
    </g>
  )
}

// ---------------------------------------------------------------- head

const FACE = 'M40 47 C40 31 49 23 60 23 C71 23 80 31 80 47 C80 61 72 74 60 75 C48 74 40 61 40 47 Z'

function Head(props: {
  spec: CharacterSpec
  mood: Mood
  pose: Pose
  paint: Paint
  skin: string
  hair: string
  scarf: string
}) {
  const { spec, mood, pose, paint, skin, hair, scarf } = props
  const line = darken(skin, 0.45)
  const lips = mix(skin, '#6b2a22', 0.55)

  return (
    <>
      {spec.headwear === 'hijab' && (
        <>
          <path
            d="M33 50 C29 14 91 14 87 50 C88 66 87 80 92 96 Q96 106 98 112 L22 112 Q24 106 28 96 C33 80 32 66 33 50 Z"
            fill={paint('scarf')}
          />
          <path d="M34 90 Q46 104 44 112 M86 90 Q74 104 76 112" stroke={darken(scarf, 0.2)} strokeWidth="1.2" fill="none" />
        </>
      )}
      {spec.headwear !== 'hijab' && spec.headwear !== 'patka' && (
        <HairBack style={spec.hair} fill={paint('hair')} />
      )}
      {spec.headwear !== 'hijab' && (
        <>
          <ellipse cx="40.5" cy="50" rx="3.6" ry="6" fill={paint('skin')} />
          <ellipse cx="79.5" cy="50" rx="3.6" ry="6" fill={paint('skin')} />
        </>
      )}

      <path d={FACE} fill={paint('skin')} />
      {/* Blush is mixed from the skin colour, so it suits every skin tone. */}
      <ellipse cx="49" cy="58.5" rx="4" ry="3" fill={mix(skin, '#b4473a', 0.5)} opacity="0.22" />
      <ellipse cx="71" cy="58.5" rx="4" ry="3" fill={mix(skin, '#b4473a', 0.5)} opacity="0.22" />

      <g className="ch-part ch-eyes">
        {[52, 68].map((x) => (
          <g key={x}>
            <ellipse cx={x} cy="49" rx="3.6" ry={mood === 'surprised' ? 2.9 : 2.2} fill="#f7f1ea" />
            <circle cx={x + 0.6} cy="49.2" r="1.9" fill="#2a1a12" />
            <circle cx={x + 1.1} cy="48.5" r="0.55" fill="#ffffff" />
            <path d={`M${x - 4} 49 Q${x} 45.6 ${x + 4} 48.6`} stroke={line} strokeWidth="1" fill="none" strokeLinecap="round" />
          </g>
        ))}
      </g>
      <Brows mood={mood} color={darken(hair, 0.1)} />
      <path d="M60.5 52 Q62.3 57.5 60.2 59.2 Q61.6 60 63.2 59.3" stroke={darken(skin, 0.35)} strokeWidth="0.9" fill="none" strokeLinecap="round" opacity="0.75" />
      {pose === 'talk' ? (
        <ellipse className="ch-part ch-mouth-talk" cx="60" cy="66.5" rx="2.8" ry="1.9" fill={darken(lips, 0.2)} />
      ) : (
        <Mouth mood={mood} color={lips} />
      )}

      {spec.headwear !== 'hijab' && spec.headwear !== 'patka' && (
        <HairFront style={spec.hair} fill={paint('hair')} highlight={lighten(hair, 0.28)} />
      )}
      {spec.headwear === 'patka' && <Patka fill={paint('scarf')} fold={darken(scarf, 0.22)} />}
      {spec.headwear === 'hijab' && <path d={FACE} fill="none" stroke={paint('scarf')} strokeWidth="4.5" />}

      {spec.glasses && (
        <g stroke="#3a2a20" strokeWidth="1.1" fill="#ffffff" fillOpacity="0.12">
          <rect x="46.8" y="45.4" width="10.4" height="7.4" rx="3" />
          <rect x="62.8" y="45.4" width="10.4" height="7.4" rx="3" />
          <path d="M57.2 48.4 Q60 47.2 62.8 48.4" fill="none" />
        </g>
      )}
    </>
  )
}

function Brows({ mood, color }: { mood: Mood; color: string }) {
  const shapes: Record<Mood, [string, string]> = {
    neutral: ['M47.5 44.5 Q52 42.6 56 43.8', 'M64 43.8 Q68 42.6 72.5 44.5'],
    happy: ['M47.5 43.5 Q52 41.4 56 42.6', 'M64 42.6 Q68 41.4 72.5 43.5'],
    worried: ['M47.5 44.6 Q52 43.6 56 41.6', 'M64 41.6 Q68 43.6 72.5 44.6'],
    sad: ['M47.5 45 Q52 44 56 42.2', 'M64 42.2 Q68 44 72.5 45'],
    surprised: ['M47.5 42.4 Q52 39.4 56 41', 'M64 41 Q68 39.4 72.5 42.4'],
  }
  return (
    <g stroke={color} strokeWidth="1.6" fill="none" strokeLinecap="round">
      {shapes[mood].map((d) => (
        <path key={d} d={d} />
      ))}
    </g>
  )
}

function Mouth({ mood, color }: { mood: Mood; color: string }) {
  switch (mood) {
    case 'happy':
      return <path d="M55 64.8 Q60 71 65 64.8 Q60 66.6 55 64.8 Z" fill={darken(color, 0.15)} />
    case 'surprised':
      return <ellipse cx="60" cy="67" rx="2.2" ry="2.8" fill={darken(color, 0.25)} />
    case 'worried':
      return <path d="M56 67 Q58 65.6 60 66.8 Q62 65.6 64 67" stroke={color} strokeWidth="1.3" fill="none" strokeLinecap="round" />
    case 'sad':
      return <path d="M56 67.8 Q60 64.8 64 67.8" stroke={color} strokeWidth="1.3" fill="none" strokeLinecap="round" />
    default:
      return <path d="M56 66 Q60 67.8 64 66" stroke={color} strokeWidth="1.3" fill="none" strokeLinecap="round" />
  }
}

function Patka({ fill, fold }: { fill: string; fold: string }) {
  return (
    <g>
      <path d="M38 47 C35 20 85 20 82 47 C77 40.5 68 38 60 38 C52 38 43 40.5 38 47 Z" fill={fill} />
      <ellipse cx="60" cy="21" rx="9" ry="7.5" fill={fill} />
      <path d="M42 42 Q60 34 78 42 M45 35.5 Q60 28.5 75 35.5 M54 17 Q60 22 66 17" stroke={fold} strokeWidth="1.1" fill="none" />
    </g>
  )
}

// ---------------------------------------------------------------- hair

const SLEEK = 'M38.5 50 C35 22 50 15.5 60 15.5 C70 15.5 85 22 81.5 50 C80 42 77 36 72 33.5 C66 32 54 32 48 33.5 C43 36 40 42 38.5 50 Z'

/** Hair behind the whole body (ponytail). */
function HairBehind({ style, fill, shade }: { style: string; fill: string; shade: string }) {
  if (style === 'ponytail') {
    return (
      <g>
        <path d="M75 30 Q93 34 91 60 Q90 82 85 92 Q82 72 80 58 Q78 45 72 38 Z" fill={fill} />
        <circle cx="76.5" cy="32" r="2.6" fill={shade} />
      </g>
    )
  }
  return null
}

/** Hair behind the face but in front of the body (bob, curly sides, bun). */
function HairBack({ style, fill }: { style: string; fill: string }) {
  if (style === 'bun') return <circle cx="60" cy="12" r="8.5" fill={fill} />
  if (style === 'bob') {
    return <path d="M36 48 C33 21 87 21 84 48 L85 76 Q79 81 73 77 L73 58 L47 58 L47 77 Q41 81 35 76 Z" fill={fill} />
  }
  if (style === 'curly') {
    return (
      <g fill={fill}>
        {[
          [38, 50, 6],
          [82, 50, 6],
          [37.5, 58, 4.5],
          [82.5, 58, 4.5],
        ].map(([cx, cy, r]) => (
          <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={r} />
        ))}
      </g>
    )
  }
  return null
}

/** Hair over the forehead. */
function HairFront({ style, fill, highlight }: { style: string; fill: string; highlight: string }) {
  const shine = <path d="M47 33 Q58 27.5 70 30" stroke={highlight} strokeWidth="1.2" fill="none" opacity="0.5" />
  switch (style) {
    case 'short':
      return (
        <g>
          <path d="M39 49 C36 27 49 17 62 18 C75 19 84 28 81 49 C79.5 41 76 35 70 32.5 C62 35 52 34 45 37.5 C42 40.5 40.5 44 39 49 Z" fill={fill} />
          {shine}
        </g>
      )
    case 'side-part':
      return (
        <g>
          <path d="M39 51 C35 25 55 15 67 18.5 C80 22 85 35 81 51 C80 42 77 36 72 33 C63 33.5 53 29 46 35.5 C42 40 40.5 45 39 51 Z" fill={fill} />
          <path d="M66 19 Q58 24 50 31" stroke={highlight} strokeWidth="1" fill="none" opacity="0.45" />
        </g>
      )
    case 'curly':
      return (
        <g fill={fill}>
          {[
            [42, 38, 7],
            [47, 30, 7.5],
            [55, 25, 8],
            [64, 24, 8],
            [72, 27, 7.5],
            [78, 33, 7],
            [81, 41, 5.5],
            [39, 45, 5],
          ].map(([cx, cy, r]) => (
            <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={r} />
          ))}
        </g>
      )
    case 'bob':
      return (
        <g>
          <path d="M38.5 48 C35 20 50 15 60 15 C70 15 85 20 81.5 48 C76 38 67 34 60 34.5 C52 34 44 38 38.5 48 Z" fill={fill} />
          {shine}
        </g>
      )
    default: // ponytail, plait, two plaits, bun: hair pulled back
      return (
        <g>
          <path d={SLEEK} fill={fill} />
          <path d="M60 16.5 L60 32" stroke={highlight} strokeWidth="0.8" opacity="0.4" />
          {shine}
        </g>
      )
  }
}

/** Plaits that fall in front of the shoulders. */
function HairOver({ style, fill, shade }: { style: string; fill: string; shade: string }) {
  const plait = (x: number, drift: number) => (
    <g key={x} fill={fill}>
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
        <ellipse key={i} cx={x + drift * i} cy={72 + i * 9.5} rx={4.4 - i * 0.12} ry="5.8" />
      ))}
      <path d={`M${x + drift * 8 - 2.5} 146 L${x + drift * 8 + 2.5} 146 L${x + drift * 8 + 1.5} 156 L${x + drift * 8 - 1.5} 156 Z`} fill={shade} />
    </g>
  )
  if (style === 'plait') return plait(77, 0.4)
  if (style === 'two-plaits') return <>{[plait(43, -0.4), plait(77, 0.4)]}</>
  return null
}
