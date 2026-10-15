import { useEffect, useRef } from 'react'
import type { Tone } from '@content/types'
import { Mitthu } from '@/character/Mitthu'
import { Button } from '@/components/Button'
import { t } from '@/lib/i18n'
import { sound } from '@/lib/sound'
import './celebration.css'

/** What the town celebrates when the player comes back from finishing a building. */
export interface Celebration {
  place: string // the building's name
  stars: number
  opened: string | null // the name of a place that just opened, if any
  tone: Tone // a gentle building gets soft sparkles instead of confetti
}

/**
 * The return celebration (BUILD_PLAN P4): Mitthu welcomes the player back to the town,
 * says what they earned and what opened. Confetti in normal scenes, soft sparkles in gentle
 * ones, and nothing moving in calm mode (CSS). It never compares the child with anyone.
 */
export function ReturnCelebration({ name, celebration, onClose }: { name: string; celebration: Celebration; onClose: () => void }) {
  const button = useRef<HTMLButtonElement>(null)
  const gentle = celebration.tone === 'gentle'

  useEffect(() => {
    sound.play(gentle ? 'soft' : 'success')
    button.current?.focus()
  }, [gentle])

  // Seeded positions, so the pieces look the same on every visit.
  const pieces = Array.from({ length: gentle ? 14 : 36 }, (_, i) => ({
    i,
    left: (i * 37) % 100,
    delay: ((i * 0.13) % 1.6).toFixed(2),
    color: gentle ? '#fff3cf' : ['#e8a33d', '#c9501a', '#2c6a94', '#5f7a4a', '#f6d79a'][i % 5],
  }))

  return (
    <div className="celebration pointer-events-none absolute inset-0 z-30 overflow-hidden" data-tone={celebration.tone}>
      <div aria-hidden="true">
        {pieces.map((p) => (
          <span
            key={p.i}
            className={gentle ? 'celebration-sparkle' : 'celebration-confetti'}
            style={{ left: `${p.left}%`, animationDelay: `${p.delay}s`, backgroundColor: p.color }}
          />
        ))}
      </div>
      <div className="flex h-full items-start justify-center px-4 pt-6">
        <div role="status" className="celebration-card pointer-events-auto flex max-w-lg items-start gap-4 rounded-card bg-plaster p-5 shadow-lifted">
          <span className="block size-16 shrink-0 rounded-full bg-gradient-to-b from-marigold-soft to-leaf/40 p-1">
            <Mitthu view="portrait" className="size-full" />
          </span>
          <div>
            <p className="text-xl font-semibold text-terracotta-deep">{t('town.welcomeBack', { name })}</p>
            <p className="mt-1">{t('town.earned', { n: celebration.stars, place: celebration.place })}</p>
            {celebration.opened && <p className="mt-1 font-semibold">{t('town.nowOpen', { place: celebration.opened })}</p>}
            <Button ref={button} onClick={onClose} className="mt-3">
              {t('town.celebrateClose')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
