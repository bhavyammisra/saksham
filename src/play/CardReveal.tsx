import { useEffect, useRef, useState } from 'react'
import type { Band, Card } from '@content/types'
import { Button } from '@/components/Button'
import { t } from '@/lib/i18n'
import { cardTextForBand } from '@/lib/rules'
import { sound } from '@/lib/sound'
import './play.css'

/**
 * The rights card, collected at the end of a scene (FR-05).
 * It arrives face down; tapping (or Enter) turns it over. The text matches the age band:
 * young players get "Tell me more" for the longer text. The law is shown exactly as written in content.
 */
export function CardReveal({ card, band, right, onNext }: { card: Card; band: Band; right: string; onNext: () => void }) {
  const [flipped, setFlipped] = useState(false)
  const [more, setMore] = useState(false)
  const details = useRef<HTMLDivElement>(null)
  const text = cardTextForBand(card, band)

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
          sound.play('success')
          setFlipped(true)
        }}
        className="rights-card mx-auto mt-3 block aspect-[3/4] w-64 disabled:cursor-default"
        data-flipped={flipped}
      >
        <span className="rights-card-inner">
          <span className="rights-card-face rights-card-back" aria-hidden="true">
            <CardEmblem />
          </span>
          <span className="rights-card-face rights-card-front" aria-hidden="true">
            <CardEmblem small />
            <span className="mt-3 block text-xs font-semibold uppercase tracking-widest text-marigold-soft">{right}</span>
            <span className="mt-1 block px-4 text-2xl font-bold leading-tight text-white">{card.title}</span>
          </span>
        </span>
      </button>
      {!flipped && <p className="mt-3 text-center text-ink-soft">{t('card.flipHint')}</p>}

      {flipped && (
        <div ref={details} tabIndex={-1} className="card-details mt-6 rounded-card bg-plaster-deep p-5 shadow-soft outline-none">
          <h2 className="text-xl font-semibold text-terracotta-deep">{card.title}</h2>
          <p className="mt-2 text-lg">{text.text}</p>
          {text.more && (
            <>
              <button
                type="button"
                aria-expanded={more}
                onClick={() => setMore((m) => !m)}
                className="mt-2 min-h-tap font-semibold text-peacock underline underline-offset-4"
              >
                {t(more ? 'card.tellLess' : 'card.tellMore')}
              </button>
              {more && <p className="mt-1">{text.more}</p>}
            </>
          )}

          <h3 className="mt-5 font-semibold">{t('card.ifItHappens')}</h3>
          <p>{card.ifItHappens}</p>

          <h3 className="mt-5 font-semibold">{t('card.law')}</h3>
          {/* Legal text exactly as authored: white-space keeps its paragraphs. */}
          <blockquote className="mt-1 whitespace-pre-line border-l-4 border-brass bg-plaster px-4 py-3 text-base">{card.law}</blockquote>
          <p className="mt-2 text-sm text-ink-soft">
            <span className="font-semibold">{t('card.source')}:</span> {card.source}
          </p>

          <Button onClick={onNext} className="mt-6 text-lg">
            {t('card.toQuiz')}
          </Button>
        </div>
      )}
    </div>
  )
}

/** A decorative emblem: an open book under a rising sun, in gold. */
function CardEmblem({ small = false }: { small?: boolean }) {
  return (
    <svg viewBox="0 0 100 100" className={small ? 'mx-auto size-20' : 'mx-auto size-36'} aria-hidden="true">
      <circle cx="50" cy="50" r="46" fill="none" stroke="#e8a33d" strokeWidth="3" />
      <circle cx="50" cy="50" r="40" fill="none" stroke="#e8a33d" strokeWidth="1" strokeDasharray="2 3" />
      {Array.from({ length: 9 }, (_, i) => {
        const a = Math.PI + (i * Math.PI) / 8
        return <path key={i} d={`M${50 + Math.cos(a) * 16} ${52 + Math.sin(a) * 16} L${50 + Math.cos(a) * 28} ${52 + Math.sin(a) * 28}`} stroke="#ffd27a" strokeWidth="3" strokeLinecap="round" />
      })}
      <circle cx="50" cy="52" r="11" fill="#ffd27a" />
      <path d="M20 58 Q35 52 50 60 Q65 52 80 58 L80 76 Q65 70 50 78 Q35 70 20 76 Z" fill="#f6ecd9" stroke="#3a2230" strokeWidth="2" strokeLinejoin="round" />
      <path d="M50 60 L50 78" stroke="#3a2230" strokeWidth="2" />
    </svg>
  )
}
