import { Link } from 'react-router'
import type { Tone } from '@content/types'
import { Portrait } from '@/character/Portrait'
import type { Celebration } from '@/components/ReturnCelebration'
import type { CharacterSpec } from '@/character/spec'
import { Button } from '@/components/Button'
import { t, type StringKey } from '@/lib/i18n'
import type { BadgeId, Score } from '@/lib/rules'
import { BADGE_TEXT } from './badgeText'
import './play.css'

/** What one play-through earned (worked out by the Play screen when the quiz ends). */
export interface Summary {
  stars: number
  score: Score
  retries: number
  newBadges: BadgeId[]
  unlocked: boolean // the next building opened just now
}

// Why each star was given, in the order of the rules (BUILD_PLAN §7).
const STAR_REASONS: StringKey[] = ['results.starFinish', 'results.starQuiz', 'results.starBest']

/**
 * Results (FR-07): stars with the reason for each, the quiz score, the card saved to the Book,
 * new badges, and whether a new place opened. No comparison with anyone else.
 * A `gentle` scene adds a quiet note linking to Need help? (safety rule).
 */
export function Results({
  from,
  celebration,
  name,
  avatar,
  summary,
  tone,
  onAgain,
}: {
  from: string // the building just played: the town puts the player back outside its door
  celebration: Celebration | null // what the town celebrates when the player walks back out
  name: string
  avatar: CharacterSpec
  summary: Summary
  tone: Tone
  onAgain: () => void
}) {
  const { stars, score, newBadges, unlocked } = summary
  return (
    <section className="mx-auto max-w-2xl rounded-card bg-plaster p-5 text-center shadow-soft md:p-8">
      <div className="mx-auto size-28">
        <Portrait spec={avatar} mood="happy" className="size-28 ring-4 ring-marigold/60" />
      </div>
      <h2 className="mt-3 text-2xl font-semibold text-terracotta-deep">{t('results.title', { name })}</h2>

      {/* Stars: drawn, plus the number in words (never colour or shape alone). */}
      <p className="sr-only">{t('results.stars', { n: stars })}</p>
      <div className="mt-4 flex justify-center gap-3" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <Star key={i} on={i < stars} delay={i * 0.25} />
        ))}
      </div>
      <p className="mt-2 font-semibold">{t('results.stars', { n: stars })}</p>
      <ul className="mx-auto mt-3 max-w-md space-y-1 text-left">
        {STAR_REASONS.map((reason, i) => (
          <li key={reason} className={`flex items-center gap-2 ${i < stars ? '' : 'text-ink-soft opacity-70'}`}>
            <span aria-hidden="true" className="grid size-6 place-items-center rounded-full bg-plaster-deep text-sm">
              {i < stars ? '★' : '☆'}
            </span>
            {t(reason)}
          </li>
        ))}
      </ul>

      <p className="mt-4">{t('results.score', { correct: score.correct, total: score.total })}</p>
      <p className="mt-1">{t('results.cardSaved')}</p>

      {newBadges.length > 0 && (
        <div className="mt-6">
          <h3 className="font-semibold">{t('results.badges')}</h3>
          <ul className="mt-2 flex flex-wrap justify-center gap-3">
            {newBadges.map((b) => (
              <li key={b} className="w-40 rounded-card bg-plaster-deep p-3">
                <span aria-hidden="true" className="mx-auto grid size-12 place-items-center rounded-full border-2 border-brass bg-marigold-soft text-2xl">
                  ✦
                </span>
                <span className="mt-1 block font-semibold">{t(BADGE_TEXT[b].name)}</span>
                <span className="block text-sm text-ink-soft">{t(BADGE_TEXT[b].about)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {unlocked && <p className="mt-6 rounded-card bg-leaf/15 p-3 font-semibold">{t('results.unlocked')}</p>}

      {tone === 'gentle' && (
        <p className="mt-6 rounded-card bg-help-bg p-3 text-help-ink">
          {t('results.gentle')}{' '}
          <Link to="/help" className="font-semibold text-help-accent underline">
            {t('results.gentleLink')}
          </Link>
        </p>
      )}

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link to="/town" state={{ from, celebration }} className="inline-flex min-h-tap items-center rounded-button bg-terracotta px-5 font-semibold text-white hover:bg-terracotta-deep">
          {t('play.backToTown')}
        </Link>
        <Button look="secondary" onClick={onAgain}>
          {t('results.playAgain')}
        </Button>
      </div>
    </section>
  )
}

function Star({ on, delay }: { on: boolean; delay: number }) {
  return (
    <svg viewBox="0 0 24 24" className="result-star size-14" style={{ animationDelay: `${delay}s` }}>
      <path
        d="m12 2.8 2.8 5.7 6.3.9-4.6 4.4 1.1 6.2L12 17l-5.6 3 1.1-6.2L2.9 9.4l6.3-.9Z"
        fill={on ? '#e8a33d' : '#ecdcbf'}
        stroke={on ? '#8a5a1a' : '#d9bc8c'}
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      {on && <path d="M9 7.5 12 4.5" stroke="#fff3cf" strokeWidth="1.4" strokeLinecap="round" />}
    </svg>
  )
}
