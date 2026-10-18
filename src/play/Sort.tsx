import { useEffect, useRef, useState, type PointerEvent } from 'react'
import type { SortGame } from '@content/types'
import { Button } from '@/components/Button'
import { t } from '@/lib/i18n'
import { scoreQuiz, type Attempt, type Score } from '@/lib/rules'
import { sound } from '@/lib/sound'

/**
 * The sort game (FR-06, D-041). One card at a time: drag it onto one of two boxes, or tap a box
 * (the tap is the keyboard and screen-reader way too). After each card the explanation shows, and
 * the card lands in its right box. Only the first placement of each card counts (rules.ts).
 */
export function Sort({ game, onDone }: { game: SortGame; onDone: (score: Score, attempts: Attempt[]) => void }) {
  const [index, setIndex] = useState(0)
  const [picked, setPicked] = useState<string | null>(null) // the box chosen for the current card
  const [attempts, setAttempts] = useState<Attempt[]>([])
  const [drag, setDrag] = useState<{ x: number; y: number } | null>(null)
  const start = useRef({ x: 0, y: 0 })
  const heading = useRef<HTMLHeadingElement>(null)

  const item = game.items[index]
  const last = index === game.items.length - 1
  const sorted = game.items.slice(0, picked === null ? index : index + 1)

  // Move focus to each new card, so screen readers read it.
  const first = useRef(true)
  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    heading.current?.focus()
  }, [index])

  const place = (bin: string) => {
    if (!item || picked !== null) return
    const correct = bin === item.bin
    sound.play(correct ? 'success' : 'soft')
    setPicked(bin)
    setAttempts((a) => [...a, { questionId: item.id, correct }])
  }

  const next = () => {
    setPicked(null)
    if (!last) return setIndex((i) => i + 1)
    onDone(scoreQuiz(game.items, attempts), attempts)
  }

  // Dragging: the card follows the pointer; letting go over a box places it there.
  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (picked !== null) return
    event.currentTarget.setPointerCapture(event.pointerId)
    start.current = { x: event.clientX, y: event.clientY }
    setDrag({ x: 0, y: 0 })
  }
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (drag) setDrag({ x: event.clientX - start.current.x, y: event.clientY - start.current.y })
  }
  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (!drag) return
    setDrag(null)
    const box = document.elementsFromPoint(event.clientX, event.clientY).find((el) => el instanceof HTMLElement && el.dataset.bin)
    if (box instanceof HTMLElement && box.dataset.bin) place(box.dataset.bin)
  }

  if (!item) return null
  const isRight = picked === item.bin
  const binLabel = (id: string) => game.bins.find((b) => b.id === id)?.label ?? ''

  return (
    <section className="mx-auto max-w-2xl rounded-card bg-plaster p-5 shadow-soft md:p-8">
      <h2 className="mb-1 text-2xl font-semibold text-terracotta-deep">{t('sort.title')}</h2>
      <p className="text-sm font-semibold uppercase tracking-wider text-terracotta-deep">
        {t('sort.progress', { n: index + 1, total: game.items.length })}
      </p>
      <p className="mt-2 text-lg">{game.prompt}</p>

      {/* The card to sort (touch-none: dragging it doesn't scroll the page). Once it is placed,
          the feedback takes its place, so it is in view on a phone too. Read out by screen readers. */}
      <div className="mt-4">
        {picked === null ? (
          <div
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={() => setDrag(null)}
            style={drag ? { transform: `translate(${drag.x}px, ${drag.y}px) rotate(-2deg)` } : undefined}
            className={`mx-auto w-full max-w-sm touch-none select-none rounded-card border-2 border-brass bg-marigold-soft/60 p-4 text-center shadow-soft ${drag ? 'relative z-10 cursor-grabbing' : 'cursor-grab'}`}
          >
            <h3 ref={heading} tabIndex={-1} className="text-lg font-semibold outline-none">
              {item.text}
            </h3>
            <p className="mt-1 text-sm text-umber">{t('sort.drag')}</p>
          </div>
        ) : (
          <h3 ref={heading} tabIndex={-1} className="sr-only">
            {item.text}
          </h3>
        )}
        {/* Feedback: words, never colour alone. */}
        <div aria-live="polite">
          {picked !== null && (
            <div className="rounded-card bg-plaster-deep p-4">
              <p className="text-lg font-semibold">{isRight ? t('quiz.correct') : t('quiz.notQuite')}</p>
              {!isRight && <p className="mt-1">{t('sort.goesIn', { bin: binLabel(item.bin) })}</p>}
              <p className="mt-1">{item.explanation}</p>
              <Button onClick={next} className="mt-4">
                {last ? t('quiz.finish') : t('sort.next')}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* The two boxes: drop targets and buttons. Cards already sorted are listed inside. */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        {game.bins.map((bin) => (
          <div key={bin.id} className="flex flex-col rounded-card border-2 border-dashed border-sand bg-plaster-deep/60 p-2">
            <button
              type="button"
              data-bin={bin.id}
              onClick={() => place(bin.id)}
              disabled={picked !== null}
              aria-label={t('sort.putIn', { bin: bin.label })}
              className="min-h-tap rounded-button bg-plaster px-3 py-3 text-lg font-semibold hover:bg-marigold-soft/60 disabled:opacity-80"
            >
              {bin.label}
            </button>
            <ul className="mt-2 grid gap-1 text-sm" aria-label={bin.label}>
              {sorted
                .filter((s) => s.bin === bin.id)
                .map((s) => (
                  <li key={s.id} className="rounded-button bg-plaster px-2 py-1">
                    {s.text}
                  </li>
                ))}
            </ul>
          </div>
        ))}
      </div>

    </section>
  )
}
