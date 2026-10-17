// The area map (D-036): a drawing of the neighbourhood from above (river, roads, park, blocks)
// with a pin for each place. Open places can be tapped to travel there; locked ones say why.
// The places (and what "open" means) come from the screen hosting it (src/play/useMap.ts),
// so this component knows nothing about particular buildings.

import { useEffect, useRef, useState } from 'react'
import { t } from '@/lib/i18n'
import { sound } from '@/lib/sound'

export interface MapPlace {
  id: string
  name: string
  x: number // in the 1600 x 1000 map drawing
  y: number
  status: 'here' | 'open' | 'locked'
  help?: boolean // the Help Centre: always open, drawn in calm teal
  stars?: number // a finished place: 1 to 3
  suggested?: boolean // Mitthu suggests going here next
  note?: string // why a locked place is locked ("Finish The School first", "Coming soon")
}

const MAP_W = 1600
const MAP_H = 1000

export function AreaMap({ places, onClose, onTravel }: { places: MapPlace[]; onClose: () => void; onTravel: (id: string) => void }) {
  const [note, setNote] = useState<string | null>(null)
  const closeButton = useRef<HTMLButtonElement>(null)
  useEffect(() => closeButton.current?.focus(), [])

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="map-title" className="game-overlay absolute inset-0 z-40 flex flex-col items-center justify-center overflow-y-auto p-4">
      <div className="flex w-full max-w-5xl items-center justify-between pb-3">
        <h2 id="map-title" className="text-xl font-semibold">
          {t('map.title')}
        </h2>
        <button ref={closeButton} type="button" onClick={onClose} className="game-menu">
          {t('hud.close')}
        </button>
      </div>

      <div className="relative w-full max-w-5xl overflow-hidden rounded-2xl shadow-2xl" style={{ aspectRatio: `${MAP_W} / ${MAP_H}` }}>
        <MapDrawing />
        {places.map((p) => {
          const label =
            p.status === 'locked'
              ? `${p.name}: ${p.note ?? t('map.locked')}`
              : p.status === 'here'
                ? `${p.name}: ${t('map.here')}`
                : t('map.travel', { place: p.name })
          return (
            <button
              key={p.id}
              type="button"
              aria-label={[label, p.stars ? t('town.stars', { n: p.stars }) : '', p.suggested ? t('town.suggest') : ''].filter(Boolean).join('. ')}
              onClick={() => {
                if (p.status === 'locked') {
                  setNote(`${p.name}: ${p.note ?? t('map.locked')}`)
                  return
                }
                sound.play('tap')
                if (p.status === 'here') onClose()
                else onTravel(p.id)
              }}
              className="map-pin absolute flex -translate-x-1/2 -translate-y-full flex-col items-center"
              style={{ left: `${(p.x / MAP_W) * 100}%`, top: `${(p.y / MAP_H) * 100}%` }}
            >
              {p.suggested && <span className="mb-1 rounded-pill bg-marigold px-2 text-xs font-semibold text-ink">{t('map.suggested')}</span>}
              <span
                className={`whitespace-nowrap rounded-pill px-3 py-1 text-sm font-semibold shadow ${
                  p.status === 'locked'
                    ? 'bg-[#d9d4cc] text-[#5f5951]'
                    : p.help
                      ? 'bg-help-accent text-white'
                      : p.status === 'here'
                        ? 'bg-[#2b2119] text-white'
                        : 'bg-white text-[#2b2119]'
                }`}
              >
                {p.status === 'locked' && <LockIcon />}
                {p.name}
                {p.stars ? <span className="ml-1.5 text-[#a9822f]">{'★'.repeat(p.stars) + '☆'.repeat(3 - p.stars)}</span> : null}
              </span>
              <svg viewBox="0 0 24 32" className="mt-0.5 h-8 w-6" aria-hidden="true">
                <path d="M12 31 C12 31 2 18 2 11 a10 10 0 0 1 20 0 c0 7 -10 20 -10 20 Z" fill={p.status === 'locked' ? '#a59d92' : p.help ? '#2f6f73' : '#c0533a'} />
                <circle cx="12" cy="11" r="4" fill="#ffffff" />
              </svg>
              {p.status === 'here' && <span className="mt-0.5 rounded bg-white/80 px-1 text-xs font-semibold text-[#2b2119]">{t('map.here')}</span>}
            </button>
          )
        })}
      </div>

      <p className="mt-3 min-h-6 text-sm text-white/85" aria-live="polite">
        {note ?? t('map.hint')}
      </p>
    </div>
  )
}

function LockIcon() {
  return (
    <svg viewBox="0 0 16 16" className="-mt-0.5 mr-1 inline size-3.5" aria-hidden="true">
      <rect x="3" y="7" width="10" height="7" rx="1.5" fill="currentColor" />
      <path d="M5 7V5a3 3 0 0 1 6 0v2" stroke="currentColor" strokeWidth="1.6" fill="none" />
    </svg>
  )
}

/** The neighbourhood from above: fields, a river with a bridge, roads, a park and building blocks. */
function MapDrawing() {
  const blocks = [
    [560, 420, 120, 80], [700, 400, 90, 60], [860, 420, 110, 90], [600, 600, 100, 70], [880, 620, 130, 70],
    [1180, 560, 120, 90], [1260, 660, 90, 70], [300, 330, 110, 80], [420, 340, 70, 60], [1240, 220, 100, 70],
    [960, 760, 110, 70], [250, 820, 140, 60],
  ]
  return (
    <svg viewBox={`0 0 ${MAP_W} ${MAP_H}`} className="absolute inset-0 size-full" aria-hidden="true">
      <rect width={MAP_W} height={MAP_H} fill="#e9e2cf" />
      <rect x="40" y="40" width="300" height="200" rx="20" fill="#cfdcae" />
      <rect x="1320" y="760" width="250" height="210" rx="20" fill="#cfdcae" />
      <ellipse cx="760" cy="540" rx="120" ry="80" fill="#b9d39d" />
      {[[700, 510], [820, 520], [760, 590], [690, 570]].map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="16" fill="#8fbd7e" />
      ))}
      <path d="M1600 120 C1400 160 1300 330 1480 420 C1600 480 1560 640 1440 720 C1340 790 1380 900 1460 1000" stroke="#8cc5d6" strokeWidth="70" fill="none" strokeLinecap="round" />
      <path d="M1600 120 C1400 160 1300 330 1480 420 C1600 480 1560 640 1440 720 C1340 790 1380 900 1460 1000" stroke="#a8d6e3" strokeWidth="40" fill="none" strokeLinecap="round" />
      <g stroke="#ffffff" strokeLinecap="round" fill="none">
        <path d="M0 520 C300 520 500 540 760 540 C1000 540 1250 500 1600 470" strokeWidth="44" />
        <path d="M160 1000 C260 780 300 600 330 380 C350 230 420 120 520 0" strokeWidth="38" />
        <path d="M760 540 L1040 330 L1040 140" strokeWidth="26" />
        <path d="M760 540 L800 780 C850 860 1050 860 1190 760" strokeWidth="26" />
        <path d="M330 380 C400 300 450 270 470 260" strokeWidth="22" />
      </g>
      <g stroke="#d9cfbb" strokeDasharray="22 18" strokeWidth="3" fill="none">
        <path d="M0 520 C300 520 500 540 760 540 C1000 540 1250 500 1600 470" />
        <path d="M160 1000 C260 780 300 600 330 380 C350 230 420 120 520 0" />
      </g>
      <rect x="1386" y="440" width="90" height="56" rx="6" fill="#c9bea8" transform="rotate(-8 1430 468)" />
      {blocks.map(([x, y, w, h]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width={w} height={h} rx="8" fill="#d6c8ad" />
      ))}
      <rect x="960" y="200" width="170" height="110" rx="10" fill="#f6f1e8" stroke="#2f6f73" strokeWidth="6" />
      <rect x="330" y="660" width="110" height="60" rx="8" fill="#e7a36f" />
      <rect x="410" y="180" width="130" height="90" rx="8" fill="#e5d3b1" stroke="#a9822f" strokeWidth="5" />
      <rect x="1140" y="690" width="110" height="70" rx="8" fill="#f0c9a8" />
      <rect x="1340" y="400" width="100" height="80" rx="8" fill="#d9ece8" stroke="#2f6f73" strokeWidth="5" />
      <rect x="190" y="370" width="130" height="80" rx="14" fill="#b9d39d" stroke="#8fbd7e" strokeWidth="4" />
      <rect x="900" y="780" width="120" height="60" rx="8" fill="#c6d0d6" />
      <g transform="translate(110 900)">
        <circle r="44" fill="#f6f1e8" stroke="#bfae94" strokeWidth="3" />
        <path d="M0 -34 L10 0 L0 34 L-10 0 Z" fill="#bfae94" />
        <path d="M0 -34 L10 0 L-10 0 Z" fill="#c0533a" />
      </g>
    </svg>
  )
}
