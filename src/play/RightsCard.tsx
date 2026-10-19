import { useEffect, useState, type ReactNode, type Ref } from 'react'
import type { Band, Card } from '@content/types'
import { t } from '@/lib/i18n'
import { reviewedOn } from '@/lib/published'
import { cardTextForBand } from '@/lib/rules'
import './play.css'

/**
 * The pieces of a rights card, shared by the card reveal (end of a building) and the Book:
 * the gold emblem, the card's front, and its details. The law is shown exactly as written in content.
 */

/** A decorative emblem: an open book under a rising sun, in gold. */
export function CardEmblem({ small = false }: { small?: boolean }) {
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

/** The front of a card: emblem, the right, and the card's title. Decorative (the title is also given in words nearby). */
export function CardFront({ right, title, small = false }: { right: string; title: string; small?: boolean }) {
  return (
    <span className="rights-card-face rights-card-front" aria-hidden="true">
      <CardEmblem small />
      <span className={`mt-3 block px-2 font-semibold uppercase tracking-widest text-marigold-soft ${small ? 'text-[0.6rem] leading-tight' : 'text-xs'}`}>{right}</span>
      <span className={`mt-1 block font-bold leading-tight text-white ${small ? 'px-2 text-base' : 'px-4 text-2xl'}`}>{title}</span>
    </span>
  )
}

/** The back of a card (face down: not collected yet, or not turned over). */
export function CardBack() {
  return (
    <span className="rights-card-face rights-card-back" aria-hidden="true">
      <CardEmblem />
    </span>
  )
}

/** Everything the card says, for the player's age band. `children` go at the end (e.g. a button). */
export function CardDetails({ card, band, detailsRef, children }: { card: Card; band: Band; detailsRef?: Ref<HTMLDivElement>; children?: ReactNode }) {
  const [more, setMore] = useState(false)
  const text = cardTextForBand(card, band)
  return (
    <div ref={detailsRef} tabIndex={-1} className="card-details rounded-card bg-plaster-deep p-5 shadow-soft outline-none">
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
      <ReviewedTick card={card} />
      {children}
    </div>
  )
}

/** "Reviewed ✓" with the date, only when a reviewer published exactly this text (D-049). Nothing otherwise. */
function ReviewedTick({ card }: { card: Card }) {
  const [date, setDate] = useState<string | null>(null)
  useEffect(() => {
    let live = true
    void reviewedOn(card).then((d) => live && setDate(d))
    return () => {
      live = false
    }
  }, [card])
  if (date === null) return null
  return (
    <p className="mt-2 text-sm font-semibold text-leaf">
      <span aria-hidden="true">✓ </span>
      {date ? t('card.reviewedOn', { date }) : t('card.reviewed')}
    </p>
  )
}
