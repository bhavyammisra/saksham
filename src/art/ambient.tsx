// Ambient life (Living world, D-053): small pictures that move on their own. Each one is its own
// little SVG, so only small things animate (D-030), never a wide scene layer. The motion is in
// ambient.css; calm mode stops it, and nothing moves while the tab is hidden.
// Each picture fills the box given by AMBIENT_SIZE (src/engine/ambient.ts), standing on its bottom edge.

import type { ComponentType } from 'react'
import type { AmbientKind } from '@content/types'
import { FRAME, LEAF, LEAF_DARK, LEAF_LIT } from './modern'
import './ambient.css'

const INK = FRAME

/** A street dog, tan with a darker back. Trots while it roams, wags its tail always. */
function Dog() {
  return (
    <svg viewBox="0 0 150 110" className="size-full" aria-hidden="true">
      <ellipse cx="75" cy="106" rx="58" ry="5" fill="#000" opacity="0.22" />
      <g className="amb-tail" style={{ transformOrigin: '30px 52px' }}>
        <path d="M32 52 Q12 40 14 22" stroke={INK} strokeWidth="9" strokeLinecap="round" fill="none" />
        <path d="M32 52 Q12 40 14 22" stroke="#b07a45" strokeWidth="5" strokeLinecap="round" fill="none" />
      </g>
      <g stroke={INK} strokeWidth="2.5" strokeLinejoin="round">
        <rect className="amb-leg-a" x="38" y="66" width="10" height="38" rx="4" fill="#9c6a3a" style={{ transformOrigin: '43px 68px' }} />
        <rect className="amb-leg-b" x="96" y="66" width="10" height="38" rx="4" fill="#9c6a3a" style={{ transformOrigin: '101px 68px' }} />
        <ellipse cx="72" cy="58" rx="44" ry="20" fill="#c08a52" />
        <path d="M36 50 Q72 36 108 48" stroke="none" fill="#8a5b30" opacity="0.55" />
        <rect className="amb-leg-b" x="50" y="66" width="10" height="38" rx="4" fill="#c08a52" style={{ transformOrigin: '55px 68px' }} />
        <rect className="amb-leg-a" x="106" y="66" width="10" height="38" rx="4" fill="#c08a52" style={{ transformOrigin: '111px 68px' }} />
        <path d="M104 50 L118 22 L140 30 L144 44 L128 54 Z" fill="#c08a52" />
        <path d="M120 24 L116 8 L128 20 Z" fill="#8a5b30" />
      </g>
      <circle cx="132" cy="32" r="2.5" fill={INK} />
      <circle cx="144" cy="42" r="3" fill={INK} />
    </svg>
  )
}

/** A cat curled on a step, flicking the tip of its tail now and then. */
function Cat() {
  return (
    <svg viewBox="0 0 80 80" className="size-full" aria-hidden="true">
      <ellipse cx="40" cy="77" rx="30" ry="3" fill="#000" opacity="0.22" />
      <g className="amb-flick" style={{ transformOrigin: '14px 70px' }}>
        <path d="M16 70 Q2 66 6 50" stroke={INK} strokeWidth="7" strokeLinecap="round" fill="none" />
        <path d="M16 70 Q2 66 6 50" stroke="#5b5550" strokeWidth="4" strokeLinecap="round" fill="none" />
      </g>
      <g stroke={INK} strokeWidth="2.5" strokeLinejoin="round" fill="#5b5550">
        <path d="M14 76 Q14 46 36 44 Q58 44 60 76 Z" />
        <path d="M44 46 Q44 26 56 24 Q68 26 68 42 Q66 52 56 52 Q46 52 44 46 Z" />
        <path d="M48 30 L48 16 L56 26 Z" />
        <path d="M64 28 L68 14 L68 30 Z" />
      </g>
      <path d="M52 38 Q54 36 56 38 M60 38 Q62 36 64 38" stroke="#e8c45a" strokeWidth="2" fill="none" />
    </svg>
  )
}

/** Three pigeons pecking at the ground, each at its own pace. */
function Pigeons() {
  const birds = [
    { x: 10, s: 1, delay: '0s' },
    { x: 58, s: 0.9, delay: '0.7s' },
    { x: 100, s: 1, delay: '1.3s' },
  ]
  return (
    <svg viewBox="0 0 150 50" className="size-full" aria-hidden="true">
      {birds.map((b) => (
        <g key={b.x} transform={`translate(${b.x} ${50 - 44 * b.s}) scale(${b.s})`}>
          <ellipse cx="20" cy="42" rx="16" ry="2.5" fill="#000" opacity="0.2" />
          <g stroke={INK} strokeWidth="2" strokeLinejoin="round">
            <path d="M4 22 Q14 10 30 16 Q38 22 32 32 Q20 38 6 30 Z" fill="#8c929a" />
            <path d="M4 24 L0 30 L8 28 Z" fill="#6c7279" />
            <path d="M14 20 Q22 18 28 24" fill="none" stroke="#5f656c" />
          </g>
          <g className="amb-peck" style={{ transformOrigin: '30px 20px', animationDelay: b.delay }}>
            <circle cx="34" cy="14" r="7" fill="#6f8a7e" stroke={INK} strokeWidth="2" />
            <path d="M40 14 L46 16 L40 17 Z" fill="#c9a77a" />
            <circle cx="36" cy="12" r="1.4" fill={INK} />
          </g>
          <path d="M16 34 L16 42 M22 34 L22 42" stroke="#c0605a" strokeWidth="2" />
        </g>
      ))}
    </svg>
  )
}

/** A white cow standing in the shade, swishing her tail and twitching an ear. */
function Cow() {
  const legs: [number, number][] = [[78, 0], [112, 1], [232, 0], [262, 1]] // x, and whether it is a near leg
  return (
    <svg viewBox="0 0 360 250" className="size-full" aria-hidden="true">
      <ellipse cx="180" cy="242" rx="150" ry="9" fill="#000" opacity="0.22" />
      <g className="amb-swish" style={{ transformOrigin: '56px 104px' }}>
        <path d="M56 104 Q38 150 44 196" stroke={INK} strokeWidth="7" fill="none" strokeLinecap="round" />
        <path d="M56 104 Q38 150 44 196" stroke="#e6dfd2" strokeWidth="4" fill="none" strokeLinecap="round" />
        <path d="M36 192 Q44 214 52 192 Z" fill="#4a3627" stroke={INK} strokeWidth="2" />
      </g>
      <g stroke={INK} strokeWidth="3" strokeLinejoin="round">
        {legs.map(([x, near]) => (
          <g key={x}>
            <path d={`M${x} 140 L${x + 22} 140 L${x + 18} 196 L${x + 16} 228 L${x + 4} 228 L${x + 2} 196 Z`} fill={near ? '#efe9de' : '#d6cebf'} />
            <path d={`M${x + 2} 226 L${x + 18} 226 L${x + 19} 238 L${x + 1} 238 Z`} fill="#3a2e26" />
          </g>
        ))}
        {/* Body with the hump over the shoulders, and the dewlap under the neck. */}
        <path d="M54 96 Q58 72 110 70 L226 70 Q250 50 272 66 Q296 80 294 116 Q292 156 252 162 L96 162 Q56 158 54 120 Z" fill="#f3eee5" />
        <path d="M70 150 Q170 172 270 150 L262 162 L96 162 Z" fill="#cfc6b6" stroke="none" />
        <path d="M150 88 Q174 76 200 94 Q190 120 158 114 Z" fill="#d9d0c0" stroke="none" />
        <path d="M268 126 Q282 168 300 150" fill="#e6dfd2" />
        {/* Head, with horns, a dark muzzle and an eye. */}
        <path d="M280 82 Q300 62 326 72 L346 122 Q346 146 324 148 Q302 146 294 120 Z" fill="#f3eee5" />
        <path d="M318 134 Q334 150 348 128 L346 122 Q336 140 318 134 Z" fill="#8a6a5a" />
        <path d="M300 74 Q292 52 304 44" fill="none" strokeWidth="4" />
        <path d="M320 70 Q334 50 326 40" fill="none" strokeWidth="4" />
      </g>
      <g className="amb-ear" style={{ transformOrigin: '298px 86px' }}>
        <path d="M298 86 L272 80 L292 98 Z" fill="#e6dfd2" stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
      </g>
      <circle cx="318" cy="98" r="3.5" fill={INK} />
    </svg>
  )
}

/** Washing on a line between two poles: a dupatta, a small kurta and a towel, stirring in the breeze. */
function Cloth() {
  const pieces = [
    { x: 40, w: 70, h: 96, fill: '#e8a33d', delay: '0s' },
    { x: 130, w: 60, h: 70, fill: '#2f6f73', delay: '0.5s' },
    { x: 214, w: 66, h: 84, fill: '#e9d6c2', delay: '1.1s' },
  ]
  return (
    <svg viewBox="0 0 320 220" className="size-full" aria-hidden="true">
      <ellipse cx="160" cy="216" rx="150" ry="4" fill="#000" opacity="0.16" />
      <path d="M12 220 V16 M308 220 V16" stroke="#4a3627" strokeWidth="6" />
      <path d="M12 20 Q160 40 308 20" stroke="#4a3627" strokeWidth="3" fill="none" />
      {pieces.map((p) => (
        <g key={p.x} className="amb-sway" style={{ transformOrigin: `${p.x + p.w / 2}px 28px`, animationDelay: p.delay }}>
          <path d={`M${p.x} 28 L${p.x + p.w} 28 L${p.x + p.w - 4} ${28 + p.h} L${p.x + 4} ${28 + p.h} Z`} fill={p.fill} stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
          <path d={`M${p.x + 8} ${32 + p.h * 0.7} H${p.x + p.w - 8}`} stroke="#000" strokeWidth="3" opacity="0.12" />
          <rect x={p.x + 6} y="22" width="6" height="12" fill="#7a5c43" />
          <rect x={p.x + p.w - 12} y="22" width="6" height="12" fill="#7a5c43" />
        </g>
      ))}
    </svg>
  )
}

/** A tulsi plant in a painted pot, its leaves moving in the wind. */
function Plant() {
  return (
    <svg viewBox="0 0 90 150" className="size-full" aria-hidden="true">
      <ellipse cx="45" cy="147" rx="34" ry="3" fill="#000" opacity="0.22" />
      <g className="amb-leaves" style={{ transformOrigin: '45px 100px' }}>
        <path d="M45 100 L45 40 M45 70 L28 48 M45 62 L62 40" stroke="#4a3627" strokeWidth="3" />
        {[
          [45, 32, 14], [26, 44, 12], [64, 36, 12], [36, 58, 11], [56, 54, 11], [45, 78, 10],
        ].map(([x, y, r]) => (
          <circle key={`${x}${y}`} cx={x} cy={y} r={r} fill={LEAF_DARK} stroke={INK} strokeWidth="2" />
        ))}
        <circle cx="40" cy="28" r="6" fill={LEAF_LIT} opacity="0.7" />
        <circle cx="22" cy="40" r="5" fill={LEAF} />
      </g>
      <path d="M20 100 H70 L64 146 H26 Z" fill="#b5532f" stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M24 112 H66" stroke="#f6d79a" strokeWidth="3" />
    </svg>
  )
}

/** A clay diya with a flickering flame and a soft glow (the evening only). */
function Diya() {
  return (
    <svg viewBox="0 0 40 40" className="size-full overflow-visible" aria-hidden="true">
      <circle cx="20" cy="18" r="26" fill="url(#amb-diya-glow)" className="amb-glow" />
      <defs>
        <radialGradient id="amb-diya-glow">
          <stop offset="0" stopColor="#ffd28a" stopOpacity="0.7" />
          <stop offset="1" stopColor="#ffd28a" stopOpacity="0" />
        </radialGradient>
      </defs>
      <path className="amb-flame" style={{ transformOrigin: '20px 24px' }} d="M20 6 Q27 16 20 24 Q13 16 20 6 Z" fill="#ffb347" stroke="#c46a1c" strokeWidth="1.5" />
      <path d="M20 13 Q23 18 20 22 Q17 18 20 13 Z" fill="#fff2c4" />
      <path d="M4 26 Q20 42 36 26 Z" fill="#a0522d" stroke={INK} strokeWidth="2" strokeLinejoin="round" />
      <path d="M8 27 H32" stroke="#f6d79a" strokeWidth="1.5" />
    </svg>
  )
}

/** The pictures by kind. Passers-by are people, drawn by the engine with the character rig. */
export const ambientArt: Partial<Record<AmbientKind, ComponentType>> = {
  dog: Dog,
  cat: Cat,
  pigeons: Pigeons,
  cow: Cow,
  cloth: Cloth,
  plant: Plant,
  diya: Diya,
}
