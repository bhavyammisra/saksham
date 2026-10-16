// PROTOTYPE (D-035): the area map. A top-down drawing of the neighbourhood (river, roads,
// park, blocks) with a pin for each place. Open places can be tapped to travel there;
// locked ones say so. The Help Centre is always open.

import { useState } from 'react'
import { t, type StringKey } from '@/lib/i18n'
import { sound } from '@/lib/sound'

export type PlaceId = 'school' | 'square' | 'dhaba' | 'home' | 'panchayat' | 'help'

interface Place {
  id: PlaceId
  x: number // in the 1600 x 1000 map drawing
  y: number
  open: boolean
}

// Prototype: School, town square and Dhaba are open; Home and Panchayat are still locked.
const PLACES: Place[] = [
  { id: 'school', x: 1040, y: 300, open: true },
  { id: 'square', x: 760, y: 540, open: true },
  { id: 'dhaba', x: 380, y: 700, open: true },
  { id: 'panchayat', x: 470, y: 250, open: false },
  { id: 'home', x: 1190, y: 740, open: false },
  { id: 'help', x: 1390, y: 470, open: true },
]

const MAP_W = 1600
const MAP_H = 1000

export function AreaMap({ here, onClose, onTravel }: { here: PlaceId; onClose: () => void; onTravel: (place: PlaceId) => void }) {
  const [note, setNote] = useState<string | null>(null)
  const name = (id: PlaceId) => t(`map.${id}` as StringKey)

  return (
    <div role="dialog" aria-modal="true" aria-label={t('map.title')} className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/80 p-4">
      <div className="flex w-full max-w-5xl items-center justify-between pb-3">
        <h2 className="text-xl font-semibold">{t('map.title')}</h2>
        <button type="button" onClick={onClose} className="proto-menu">
          {t('hud.close')}
        </button>
      </div>

      <div className="relative w-full max-w-5xl overflow-hidden rounded-2xl shadow-2xl" style={{ aspectRatio: `${MAP_W} / ${MAP_H}` }}>
        <MapDrawing />
        {PLACES.map((p) => {
          const isHere = p.id === here
          const help = p.id === 'help'
          return (
            <button
              key={p.id}
              type="button"
              aria-label={p.open ? (isHere ? `${name(p.id)}: ${t('map.here')}` : t('map.travel', { place: name(p.id) })) : `${name(p.id)}: ${t('map.locked')}`}
              onClick={() => {
                if (!p.open) {
                  setNote(t('map.lockedNote', { place: name(p.id) }))
                  return
                }
                sound.play('tap')
                if (isHere) onClose()
                else onTravel(p.id)
              }}
              className="map-pin absolute flex -translate-x-1/2 -translate-y-full flex-col items-center"
              style={{ left: `${(p.x / MAP_W) * 100}%`, top: `${(p.y / MAP_H) * 100}%` }}
            >
              <span
                className={`rounded-pill px-3 py-1 text-sm font-semibold shadow ${
                  !p.open ? 'bg-[#d9d4cc] text-[#6b655d]' : help ? 'bg-help-accent text-white' : isHere ? 'bg-[#2b2119] text-white' : 'bg-white text-[#2b2119]'
                }`}
              >
                {!p.open && <LockIcon />}
                {name(p.id)}
              </span>
              <svg viewBox="0 0 24 32" className="mt-0.5 h-8 w-6" aria-hidden="true">
                <path d="M12 31 C12 31 2 18 2 11 a10 10 0 0 1 20 0 c0 7 -10 20 -10 20 Z" fill={!p.open ? '#a59d92' : help ? '#2f6f73' : '#c0533a'} />
                <circle cx="12" cy="11" r="4" fill="#ffffff" />
              </svg>
              {isHere && <span className="mt-0.5 text-xs font-semibold text-[#2b2119]">{t('map.here')}</span>}
            </button>
          )
        })}
      </div>

      <p className="mt-3 min-h-6 text-sm text-white/80" aria-live="polite">
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
      {/* Fields and the park. */}
      <rect x="40" y="40" width="300" height="200" rx="20" fill="#cfdcae" />
      <rect x="1320" y="760" width="250" height="210" rx="20" fill="#cfdcae" />
      <ellipse cx="760" cy="540" rx="120" ry="80" fill="#b9d39d" />
      {[[700, 510], [820, 520], [760, 590], [690, 570]].map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="16" fill="#8fbd7e" />
      ))}
      {/* The river, with a bridge. */}
      <path d="M1600 120 C1400 160 1300 330 1480 420 C1600 480 1560 640 1440 720 C1340 790 1380 900 1460 1000" stroke="#8cc5d6" strokeWidth="70" fill="none" strokeLinecap="round" />
      <path d="M1600 120 C1400 160 1300 330 1480 420 C1600 480 1560 640 1440 720 C1340 790 1380 900 1460 1000" stroke="#a8d6e3" strokeWidth="40" fill="none" strokeLinecap="round" />
      {/* Roads: a main road across, a highway on the left, and lanes. */}
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
      {/* Building blocks. */}
      {blocks.map(([x, y, w, h]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width={w} height={h} rx="8" fill="#d6c8ad" />
      ))}
      {/* The places, as larger buildings under their pins. */}
      <rect x="960" y="200" width="170" height="110" rx="10" fill="#f6f1e8" stroke="#2f6f73" strokeWidth="6" />
      <rect x="1000" y="240" width="90" height="40" rx="4" fill="#cfe3e6" />
      <rect x="330" y="660" width="110" height="60" rx="8" fill="#e7a36f" />
      <rect x="410" y="180" width="130" height="90" rx="8" fill="#e5d3b1" stroke="#a9822f" strokeWidth="5" />
      <rect x="1140" y="690" width="110" height="70" rx="8" fill="#f0c9a8" />
      <rect x="1340" y="400" width="100" height="80" rx="8" fill="#d9ece8" stroke="#2f6f73" strokeWidth="5" />
      {/* Compass. */}
      <g transform="translate(110 900)">
        <circle r="44" fill="#f6f1e8" stroke="#bfae94" strokeWidth="3" />
        <path d="M0 -34 L10 0 L0 34 L-10 0 Z" fill="#bfae94" />
        <path d="M0 -34 L10 0 L-10 0 Z" fill="#c0533a" />
      </g>
    </svg>
  )
}
