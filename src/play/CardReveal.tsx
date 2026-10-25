import { useEffect, useRef, useState } from 'react'
import type { Band, Card } from '@content/types'
import { Button } from '@/components/Button'
import { t } from '@/lib/i18n'
import { sound } from '@/lib/sound'
import { CardBack, CardDetails, CardFront } from './RightsCard'
import './play.css'

/**
 * The rights card, collected at the end of a scene (FR-05).
 * It arrives face down; tapping (or Enter) turns it over. The text matches the age band:
 * young players get "Tell me more" for the longer text. The law is shown exactly as written in content.
 */
export function CardReveal({ card, band, right, onNext }: { card: Card; band: Band; right: string; onNext: () => void }) {
  const [flipped, setFlipped] = useState(false)
  const details = useRef<HTMLDivElement>(null)

  // After turning the card over, move focus to the card's words for screen readers.
  useEffect(() => {
    if (flipped) details.current?.focus()
  }, [flipped])

  return (
    <div className="mx-auto max-w-2xl">
      <p className="text-center text-sm font-semibold uppercase tracking-widest text-terracotta-deep">{t('card.new')}</p>

      <button
        type="button"
        aria-label={t('card.flip')}
        aria-pressed={flipped}
        disabled={flipped}
        onClick={() => {
          sound.play('flip')
          setFlipped(true)
        }}
        className="rights-card mx-auto mt-3 block aspect-[3/4] w-64 disabled:cursor-default"
        data-flipped={flipped}
      >
        <span className="rights-card-inner">
          <CardBack />
          <CardFront right={right} title={card.title} />
        </span>
      </button>
      {!flipped && <p className="mt-3 text-center text-ink-soft">{t('card.flipHint')}</p>}

      {flipped && (
        <div className="mt-6">
          <CardDetails card={card} band={band} detailsRef={details}>
            <Button onClick={onNext} className="mt-6 text-lg">
              {t('card.toQuiz')}
            </Button>
          </CardDetails>
        </div>
      )}
    </div>
  )
}
