import { useEffect, useRef, useState } from 'react'
import { Page } from '@/components/Page'
import { t } from '@/lib/i18n'
import { cardsInTown } from '@/lib/scenes'
import { selectActiveData, selectActiveProfile, useStore } from '@/lib/store'
import { CardBack, CardDetails, CardFront } from '@/play/RightsCard'

/**
 * My Book (FR-05): the card album. One slot per building, in town order. A collected card
 * shows its front and opens to read again; the others are face down and say how to collect them.
 * Only this player's own cards; nothing is compared with anyone else.
 */
export function Book() {
  const profile = useStore(selectActiveProfile)
  const data = useStore(selectActiveData)
  const [open, setOpen] = useState<string | null>(null)
  const details = useRef<HTMLDivElement>(null)

  const slots = cardsInTown()
  const collected = new Set(data?.extras.cards ?? [])
  const total = slots.filter((s) => s.card).length
  const count = slots.filter((s) => s.card && collected.has(s.card.id)).length
  const openCard = slots.find((s) => s.card?.id === open)?.card

  // Opening a card moves focus to its words, for screen readers and keyboard users.
  useEffect(() => {
    if (open) details.current?.focus()
  }, [open])

  if (!profile) return null

  return (
    <Page title={t('book.title')}>
      <p className="text-lg">{t('book.intro')}</p>
      <p className="mt-1 font-semibold">{t('book.count', { n: count, total })}</p>

      <ul className="rights-card-flat mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {slots.map(({ building, card }) => {
          const have = card !== null && collected.has(card.id)
          return (
            <li key={building.id} className="flex flex-col items-center text-center">
              {have ? (
                <button
                  type="button"
                  aria-expanded={open === card.id}
                  onClick={() => setOpen(open === card.id ? null : card.id)}
                  className="relative block aspect-[3/4] w-full max-w-44 rounded-card hover:-translate-y-1"
                >
                  {/* The picture is hidden from screen readers, so its name is said here instead (no aria-label, WCAG 2.5.3). */}
                  <span className="sr-only">
                    {t('book.read')}: {card.title}
                  </span>
                  <CardFront right={building.right} title={card.title} small />
                </button>
              ) : (
                <div className="relative block aspect-[3/4] w-full max-w-44 opacity-60 grayscale">
                  <CardBack />
                </div>
              )}
              <p className="mt-2 font-semibold">{building.name}</p>
              {!have && <p className="text-sm text-ink-soft">{card ? t('book.helpAt', { place: building.name }) : t('book.writing')}</p>}
              {!have && <p className="sr-only">{t('book.notYet')}</p>}
            </li>
          )
        })}
      </ul>

      {openCard && (
        <div className="mt-8">
          <CardDetails card={openCard} band={profile.band} detailsRef={details}>
            <button
              type="button"
              onClick={() => setOpen(null)}
              className="mt-6 min-h-tap rounded-button border-2 border-sand bg-plaster px-5 font-semibold hover:bg-marigold-soft"
            >
              {t('book.close')}
            </button>
          </CardDetails>
        </div>
      )}
    </Page>
  )
}
