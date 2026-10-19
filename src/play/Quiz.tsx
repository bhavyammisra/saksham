import { useEffect, useRef, useState, type ReactNode, type Ref } from 'react'
import type { QuizQuestion } from '@content/types'
import { Mitthu } from '@/character/Mitthu'
import { Button } from '@/components/Button'
import { t } from '@/lib/i18n'
import { hintRoundQuestions, needsHintRound, scoreQuiz, type Attempt, type Score } from '@/lib/rules'
import { sound } from '@/lib/sound'

type Stage = 'quiz' | 'offer' | 'hint'

/**
 * The quiz (FR-06). One question at a time; after each answer the explanation shows.
 * Only first answers count (rules.ts). If the score is under 60%, Mitthu offers a hint round
 * that replays the missed questions with the explanation first. It never changes the score.
 */
export function Quiz({ questions, onDone }: { questions: QuizQuestion[]; onDone: (score: Score, attempts: Attempt[]) => void }) {
  const [stage, setStage] = useState<Stage>('quiz')
  const [attempts, setAttempts] = useState<Attempt[]>([])
  const [hintList, setHintList] = useState<QuizQuestion[]>([])
  const [index, setIndex] = useState(0)
  const [picked, setPicked] = useState<number | null>(null)
  const heading = useRef<HTMLHeadingElement>(null)

  const list = stage === 'hint' ? hintList : questions
  const question = list[index]
  const last = index === list.length - 1

  // Move focus to each new question, so screen readers read it.
  const first = useRef(true)
  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    heading.current?.focus()
  }, [index, stage])

  const answer = (option: number) => {
    if (!question || picked !== null) return
    const correct = option === question.answer
    sound.play(correct ? 'success' : 'soft')
    setPicked(option)
    // Hint-round answers are recorded too, but scoreQuiz only counts first attempts.
    setAttempts((a) => [...a, { questionId: question.id, correct }])
  }

  const next = () => {
    setPicked(null)
    if (!last) return setIndex((i) => i + 1)
    const score = scoreQuiz(questions, attempts)
    if (stage === 'quiz' && needsHintRound(score)) return setStage('offer')
    onDone(score, attempts)
  }

  if (stage === 'offer') {
    return (
      <Shell title={t('quiz.hintTitle')} headingRef={heading}>
        <div className="flex items-start gap-4">
          <div className="size-20 shrink-0 rounded-full bg-gradient-to-b from-marigold-soft to-plaster-deep p-1">
            <Mitthu view="portrait" className="size-full" />
          </div>
          <p className="text-lg">{t('quiz.hintOffer')}</p>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button
            onClick={() => {
              setHintList(hintRoundQuestions(questions, attempts))
              setIndex(0)
              setStage('hint')
            }}
          >
            {t('quiz.hintStart')}
          </Button>
          <Button look="secondary" onClick={() => onDone(scoreQuiz(questions, attempts), attempts)}>
            {t('quiz.hintSkip')}
          </Button>
        </div>
      </Shell>
    )
  }

  if (!question) return null
  const isRight = picked !== null && picked === question.answer

  return (
    <Shell title={stage === 'hint' ? t('quiz.hintTitle') : t('quiz.title')}>
      <p className="text-sm font-semibold uppercase tracking-wider text-terracotta-deep">
        {t('quiz.progress', { n: index + 1, total: list.length })}
      </p>
      <div className="mt-2 h-2 rounded-pill bg-sand/50" aria-hidden="true">
        <div className="h-2 rounded-pill bg-marigold" style={{ width: `${((index + (picked !== null ? 1 : 0)) / list.length) * 100}%` }} />
      </div>

      {stage === 'hint' && (
        <p className="mt-4 rounded-card bg-leaf/15 p-3">
          <span className="font-semibold">{t('quiz.hintLead')}: </span>
          {question.explanation}
        </p>
      )}

      <h2 ref={heading} tabIndex={-1} className="mt-4 text-xl font-semibold outline-none">
        {question.text}
      </h2>

      <ul className="mt-4 grid gap-3">
        {question.options.map((option, i) => {
          const chosen = picked === i
          const showRight = picked !== null && i === question.answer
          return (
            <li key={option}>
              <button
                type="button"
                onClick={() => answer(i)}
                disabled={picked !== null}
                aria-pressed={chosen}
                className={`flex min-h-tap w-full items-center gap-3 rounded-button border-2 px-4 py-3 text-left text-lg font-semibold ${
                  showRight
                    ? 'border-leaf bg-leaf/15'
                    : chosen
                      ? 'border-brass bg-marigold-soft/60'
                      : 'border-sand bg-plaster hover:border-marigold hover:bg-marigold-soft/40 disabled:opacity-70'
                }`}
              >
                <span aria-hidden="true" className="grid size-8 shrink-0 place-items-center rounded-full border-2 border-current text-base">
                  {showRight ? '✓' : chosen ? '•' : String.fromCharCode(65 + i)}
                </span>
                {option}
              </button>
            </li>
          )
        })}
      </ul>

      {/* Feedback: words and an icon, never colour alone. Read out by screen readers. */}
      <div aria-live="polite" className="mt-4">
        {picked !== null && (
          <div className="rounded-card bg-plaster-deep p-4">
            <p className="text-lg font-semibold">{isRight ? t('quiz.correct') : t('quiz.notQuite')}</p>
            {!isRight && <p className="mt-1">{t('quiz.answerWas', { answer: question.options[question.answer] ?? '' })}</p>}
            <p className="mt-1">{question.explanation}</p>
            <Button onClick={next} className="mt-4">
              {last ? t('quiz.finish') : t('quiz.next')}
            </Button>
          </div>
        )}
      </div>
    </Shell>
  )
}

function Shell({ title, children, headingRef }: { title: string; children: ReactNode; headingRef?: Ref<HTMLHeadingElement> }) {
  return (
    <section className="mx-auto max-w-2xl rounded-card bg-plaster p-5 shadow-soft md:p-8">
      <h2 ref={headingRef} tabIndex={-1} className="mb-4 text-2xl font-semibold text-terracotta-deep outline-none">
        {title}
      </h2>
      {children}
    </section>
  )
}
