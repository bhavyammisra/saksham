// Cover backdrop for the screens before the game starts (welcome, name, age, character, players).
// A painted golden-hour view over an Indian town from a rooftop: sky, sun, light rays,
// layered hills and skyline (temple, dome, gurudwara, water tank, school with a flag),
// kites, birds, a banyan tree, marigold string lights and drifting dust.
// Pure decoration: hidden from screen readers. Calm mode stops every animation (cover.css).

import './cover.css'

/** Small seeded random numbers, so the picture is the same on every load. */
function seeded(seed: number) {
  let s = seed | 0
  return () => {
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const W = 1600
const H = 900

/** A row of town buildings: flat roofs, water tanks and lit windows, as a silhouette. */
function skyline(seed: number, base: number, minH: number, maxH: number) {
  const r = seeded(seed)
  const blocks: { x: number; w: number; h: number; tank: boolean }[] = []
  for (let x = -20; x < W + 20; ) {
    const w = 40 + r() * 70
    blocks.push({ x, w, h: minH + r() * (maxH - minH), tank: r() < 0.22 })
    x += w - 2
  }
  return blocks.map((b) => ({ ...b, y: base - b.h }))
}

export function CoverBackdrop({ dim = false }: { dim?: boolean }) {
  const r = seeded(11)
  const far = skyline(3, 640, 30, 70)
  const near = skyline(9, 700, 50, 120)
  const windows = near.flatMap((b, i) =>
    [0, 1, 2].flatMap((row) =>
      [0, 1].map((col) => ({
        key: `${i}-${row}-${col}`,
        x: b.x + 10 + col * (b.w / 2 - 4),
        y: b.y + 14 + row * 24,
        lit: r() < 0.35 && b.y + 14 + row * 24 < 690,
        delay: (r() * 6).toFixed(2),
      })),
    ),
  )
  const stars = Array.from({ length: 40 }, (_, i) => ({ i, x: r() * W, y: r() * 200, s: 0.6 + r() * 1.4 }))
  const motes = Array.from({ length: 26 }, (_, i) => ({ i, x: r() * W, y: 300 + r() * 560, s: 1 + r() * 2.2, d: (r() * 10).toFixed(2) }))
  const bulbs = Array.from({ length: 23 }, (_, i) => {
    const x = 520 + i * 48
    const t = (x - 520) / (1600 - 520)
    return { i, x, y: 70 + Math.sin(t * Math.PI * 2.2) * 26 + t * 30, d: (i * 0.37).toFixed(2) }
  })

  return (
    <div className={`cover-art absolute inset-0 overflow-hidden ${dim ? 'cover-dim' : ''}`} aria-hidden="true">
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMax slice" className="size-full">
        <defs>
          <linearGradient id="cv-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#1a1838" />
            <stop offset="0.28" stopColor="#47305e" />
            <stop offset="0.5" stopColor="#b2546c" />
            <stop offset="0.66" stopColor="#ef8a55" />
            <stop offset="0.8" stopColor="#ffc777" />
            <stop offset="1" stopColor="#ffdf9e" />
          </linearGradient>
          <radialGradient id="cv-sun">
            <stop offset="0" stopColor="#fffbe8" />
            <stop offset="0.35" stopColor="#ffe8a8" />
            <stop offset="1" stopColor="#ffb862" />
          </radialGradient>
          <radialGradient id="cv-glow">
            <stop offset="0" stopColor="#ffd890" stopOpacity="0.85" />
            <stop offset="0.4" stopColor="#ffab5e" stopOpacity="0.3" />
            <stop offset="1" stopColor="#ff9a50" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="cv-ray" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#fff1c4" stopOpacity="0.5" />
            <stop offset="1" stopColor="#fff1c4" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="cv-ground" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#4a2336" />
            <stop offset="1" stopColor="#1d0f1c" />
          </linearGradient>
          <linearGradient id="cv-roof" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#7a3d3a" />
            <stop offset="0.08" stopColor="#5a2a35" />
            <stop offset="1" stopColor="#24111f" />
          </linearGradient>
          <linearGradient id="cv-haze" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ffb873" stopOpacity="0" />
            <stop offset="1" stopColor="#ffb873" stopOpacity="0.55" />
          </linearGradient>
        </defs>

        <rect width={W} height={H} fill="url(#cv-sky)" />
        {stars.map((s) => (
          <circle key={s.i} className="cover-star" cx={s.x} cy={s.y} r={s.s} fill="#fff" style={{ animationDelay: `${s.i * 0.21}s` }} />
        ))}

        {/* Long lit clouds. */}
        <g opacity="0.7">
          <ellipse cx="300" cy="250" rx="260" ry="14" fill="#f3a07a" />
          <ellipse cx="420" cy="275" rx="180" ry="9" fill="#ffc28a" />
          <ellipse cx="1350" cy="230" rx="240" ry="12" fill="#e98a78" />
          <ellipse cx="1250" cy="300" rx="300" ry="10" fill="#ffc890" />
          <ellipse cx="760" cy="190" rx="200" ry="8" fill="#c86a78" />
        </g>

        {/* Sun with glow and slowly turning rays. */}
        <circle cx="1060" cy="560" r="420" fill="url(#cv-glow)" />
        <g className="cover-rays" style={{ transformOrigin: '1060px 560px' }}>
          {Array.from({ length: 12 }, (_, i) => (
            <path key={i} d="M1060 560 L1900 520 L1900 600 Z" fill="url(#cv-ray)" opacity="0.35" transform={`rotate(${i * 30} 1060 560)`} />
          ))}
        </g>
        <circle cx="1060" cy="560" r="78" fill="url(#cv-sun)" />

        {/* Far hills, with haze. */}
        <path d="M0 600 C150 540 260 560 380 520 C520 470 640 540 760 510 C900 470 1020 530 1160 500 C1300 470 1440 520 1600 490 L1600 700 L0 700 Z" fill="#a85a72" opacity="0.65" />
        <path d="M0 630 C180 590 300 610 460 575 C620 540 760 600 920 570 C1080 540 1240 590 1400 560 C1500 545 1560 560 1600 555 L1600 700 L0 700 Z" fill="#87405e" opacity="0.8" />

        {/* Far skyline. */}
        <g fill="#6b3053" opacity="0.9">
          {far.map((b, i) => (
            <rect key={i} x={b.x} y={b.y} width={b.w} height={H - b.y} />
          ))}
          {/* Temple spire (shikhara) with a flag. */}
          <path d="M300 640 L300 520 C300 470 316 440 330 410 C344 440 360 470 360 520 L360 640 Z" />
          <path d="M330 410 L330 380 L352 388 L330 396" stroke="#6b3053" strokeWidth="3" />
          {/* Dome with two minarets. */}
          <path d="M1290 640 L1290 560 C1290 520 1320 500 1340 490 C1360 500 1390 520 1390 560 L1390 640 Z" />
          <rect x="1270" y="500" width="10" height="140" />
          <rect x="1400" y="500" width="10" height="140" />
          <circle cx="1275" cy="498" r="7" />
          <circle cx="1405" cy="498" r="7" />
        </g>
        <rect y="560" width={W} height="140" fill="url(#cv-haze)" />

        {/* Near skyline with lit windows. */}
        <g fill="#4a2140">
          {near.map((b, i) => (
            <g key={i}>
              <rect x={b.x} y={b.y} width={b.w} height={H - b.y} />
              {b.tank && <rect x={b.x + b.w / 2 - 12} y={b.y - 22} width="24" height="22" rx="4" />}
            </g>
          ))}
          {/* Gurudwara-style dome. */}
          <path d="M760 700 L760 590 L840 590 L840 700 Z M770 590 C770 552 800 540 800 520 C800 540 830 552 830 590 Z" />
          <rect x="797" y="500" width="6" height="22" />
          {/* School with a flag. */}
          <rect x="520" y="600" width="170" height="100" />
          <path d="M510 604 L605 570 L700 604 Z" />
          <rect x="603" y="520" width="3" height="52" fill="#3a1833" />
        </g>
        <path className="cover-flag" d="M606 522 C620 518 630 528 646 522 L646 542 C630 548 620 538 606 542 Z" fill="#e8a33d" style={{ transformOrigin: '606px 532px' }} />
        {windows.map(
          (w) =>
            w.lit && (
              <rect key={w.key} className="cover-window" x={w.x} y={w.y} width="9" height="12" rx="1" fill="#ffcf7a" style={{ animationDelay: `${w.delay}s` }} />
            ),
        )}

        {/* Kites. */}
        {[
          { x: 420, y: 330, c: '#e8a33d', s: 1, d: 0 },
          { x: 1360, y: 380, c: '#2f8f86', s: 0.8, d: 1.3 },
          { x: 920, y: 260, c: '#c64a5a', s: 0.6, d: 2.1 },
        ].map((k) => (
          <g key={k.x} className="cover-kite" style={{ animationDelay: `${k.d}s` }}>
            <g transform={`translate(${k.x} ${k.y}) scale(${k.s})`}>
              <path d="M0 -26 L20 0 L0 30 L-20 0 Z" fill={k.c} />
              <path d="M0 -26 L0 30 M-20 0 L20 0" stroke="#3a1a2a" strokeWidth="1.2" opacity="0.5" />
              <path d="M0 30 C-6 46 8 58 0 74 C-8 90 6 100 0 116" stroke={k.c} strokeWidth="2" fill="none" opacity="0.8" />
              <path d="M0 30 C40 120 60 260 140 520" stroke="#fff" strokeWidth="0.8" fill="none" opacity="0.35" />
            </g>
          </g>
        ))}

        {/* A flock of birds crossing the sky. */}
        <g className="cover-birds">
          {[0, 1, 2, 3, 4].map((i) => (
            <path
              key={i}
              className="cover-bird"
              d={`M${i * 26} ${(i % 2) * 14 + i * 4} q8 -8 14 0 q6 -8 14 0`}
              stroke="#2b1630"
              strokeWidth="2.2"
              fill="none"
              strokeLinecap="round"
              style={{ animationDelay: `${i * 0.12}s` }}
            />
          ))}
        </g>

        {/* Banyan tree on the left, with hanging roots. */}
        <g fill="#24111f">
          <path d="M120 900 C130 800 128 720 110 640 L150 640 C156 720 168 800 190 900 Z" />
          <ellipse cx="110" cy="560" rx="230" ry="110" />
          <ellipse cx="230" cy="500" rx="150" ry="80" />
          <ellipse cx="0" cy="520" rx="140" ry="100" />
          {[30, 70, 210, 250, 290, -10].map((x, i) => (
            <path key={x} d={`M${x} 600 C${x + 4} 660 ${x - 4} 720 ${x + 2} ${760 + (i % 3) * 30}`} stroke="#24111f" strokeWidth="3" fill="none" />
          ))}
        </g>
        <g className="cover-leaves" fill="#3a1a2e">
          <ellipse cx="300" cy="470" rx="70" ry="34" />
          <ellipse cx="200" cy="610" rx="90" ry="30" />
        </g>

        {/* Marigold string lights. */}
        <path d={`M520 70 ${bulbs.map((b) => `L${b.x} ${b.y}`).join(' ')}`} stroke="#2b1630" strokeWidth="2" fill="none" opacity="0.8" />
        {bulbs.map((b) => (
          <g key={b.i}>
            <circle className="cover-bulb-glow" cx={b.x} cy={b.y + 8} r="14" fill="#ffcf7a" opacity="0.25" style={{ animationDelay: `${b.d}s` }} />
            <circle cx={b.x} cy={b.y + 8} r={b.i % 3 === 0 ? 7 : 5} fill={b.i % 3 === 0 ? '#e8a33d' : '#ffdf8a'} />
          </g>
        ))}

        {/* Rooftop the characters stand on: parapet with a lit top edge. */}
        <path d="M0 790 L1600 770 L1600 900 L0 900 Z" fill="url(#cv-ground)" />
        <path d="M0 790 L1600 770 L1600 778 L0 798 Z" fill="#c76f4d" opacity="0.8" />
        <g fill="#5a2a35" opacity="0.7">
          {Array.from({ length: 20 }, (_, i) => (
            <rect key={i} x={i * 82 + 14} y={812 - i} width="56" height="18" rx="3" />
          ))}
        </g>

        {/* Dust drifting in the light. */}
        {motes.map((m) => (
          <circle key={m.i} className="cover-mote" cx={m.x} cy={m.y} r={m.s} fill="#fff1c4" style={{ animationDelay: `-${m.d}s` }} />
        ))}
      </svg>
      {/* Readability: a soft dark wash behind the text side, and a vignette. */}
      <div className="cover-wash absolute inset-0" />
    </div>
  )
}
