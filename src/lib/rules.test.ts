import { describe, expect, it } from 'vitest'
import type { BuildingInfo, Card, QuizQuestion } from '@content/types'
import {
  bestProgress,
  cardTextForBand,
  cleanFirstName,
  hintRoundQuestions,
  isDemoCode,
  isUnlocked,
  isValidFirstName,
  mergeExtras,
  mergeProgress,
  needsHintRound,
  nextDemoBuffer,
  progressFromResult,
  questionsForBand,
  recommendedBuilding,
  scoreQuiz,
  scorePercent,
  starsFor,
  type BuildingProgress,
  type ProgressMap,
} from './rules'

// ---------------------------------------------------------------- fixtures

const order: BuildingInfo[] = [
  { id: 'school' },
  { id: 'dhaba' },
  { id: 'home' },
  { id: 'panchayat' },
  { id: 'playground', teaser: true },
]

const q = (id: string, band?: 'teen'): QuizQuestion => ({
  id,
  text: `${id}?`,
  options: ['a', 'b'],
  answer: 0,
  explanation: 'why',
  ...(band ? { band } : {}),
})

const done = (stars: number, bestScore = 100): BuildingProgress => ({ stars, bestScore, completed: true })

const result = (correct: number, total: number, retries = 0, completed = true) => ({
  completed,
  retries,
  score: { correct, total },
})

// ---------------------------------------------------------------- FR-07 stars

describe('FR-07 stars', () => {
  it('gives 0 stars when the scene is not finished', () => {
    expect(starsFor(result(10, 10, 0, false))).toBe(0)
  })

  it('gives 1 star for finishing with a score under 60%', () => {
    expect(starsFor(result(5, 10))).toBe(1)
    expect(starsFor(result(59, 100))).toBe(1)
  })

  it('gives 2 stars at exactly 60%', () => {
    expect(starsFor(result(3, 5))).toBe(2)
    expect(starsFor(result(6, 10))).toBe(2)
  })

  it('gives 2 stars at 89%', () => {
    expect(starsFor(result(89, 100))).toBe(2)
  })

  it('gives 3 stars at exactly 90% with no retries', () => {
    expect(starsFor(result(9, 10))).toBe(3)
    expect(starsFor(result(10, 10))).toBe(3)
  })

  it('caps at 2 stars when the scene had a retry, even with 100%', () => {
    expect(starsFor(result(10, 10, 1))).toBe(2)
  })

  it('turns a result into saved progress with a whole-number percentage', () => {
    expect(progressFromResult(result(2, 3))).toEqual({ stars: 2, bestScore: 67, completed: true })
  })
})

describe('FR-07 best result per building (replays only raise stars)', () => {
  it('keeps the first result when there was none before', () => {
    expect(bestProgress(undefined, done(2, 70))).toEqual(done(2, 70))
  })

  it('a worse replay does not lower stars or score', () => {
    expect(bestProgress(done(3, 100), done(1, 40))).toEqual(done(3, 100))
  })

  it('a better replay raises stars and score', () => {
    expect(bestProgress(done(1, 40), done(3, 95))).toEqual(done(3, 95))
  })

  it('takes stars and score from different plays if needed', () => {
    expect(bestProgress(done(3, 90), done(2, 100))).toEqual(done(3, 100))
  })

  it('never un-completes a building', () => {
    expect(bestProgress(done(1), { stars: 0, bestScore: 0, completed: false }).completed).toBe(true)
  })
})

// ---------------------------------------------------------------- FR-07 unlocks

describe('FR-07 unlocks', () => {
  it('the first building (School) is always unlocked', () => {
    expect(isUnlocked('school', order, {})).toBe(true)
  })

  it('the next building is locked until the previous one is completed', () => {
    expect(isUnlocked('dhaba', order, {})).toBe(false)
    expect(isUnlocked('dhaba', order, { school: done(1) })).toBe(true)
    expect(isUnlocked('home', order, { school: done(1) })).toBe(false)
  })

  it('an unfinished attempt does not unlock the next building', () => {
    expect(isUnlocked('dhaba', order, { school: { stars: 0, bestScore: 0, completed: false } })).toBe(false)
  })

  it('teasers are never playable, even with everything completed', () => {
    const all: ProgressMap = { school: done(3), dhaba: done(3), home: done(3), panchayat: done(3) }
    expect(isUnlocked('playground', order, all)).toBe(false)
  })

  it('unknown buildings are locked', () => {
    expect(isUnlocked('mars', order, {})).toBe(false)
  })
})

describe('FR-17 demo mode', () => {
  it('unlocks every playable building', () => {
    expect(order.filter((b) => isUnlocked(b.id, order, {}, true)).map((b) => b.id)).toEqual([
      'school',
      'dhaba',
      'home',
      'panchayat',
    ])
  })

  it('does not unlock teasers', () => {
    expect(isUnlocked('playground', order, {}, true)).toBe(false)
  })

  it('turns on when d e m o is typed, ignoring case and other keys', () => {
    let buffer = ''
    for (const key of ['x', 'D', 'Shift', 'e', 'm', 'o']) buffer = nextDemoBuffer(buffer, key)
    expect(isDemoCode(buffer)).toBe(true)
  })

  it('does not turn on for other words', () => {
    let buffer = ''
    for (const key of 'demon') buffer = nextDemoBuffer(buffer, key)
    expect(isDemoCode(buffer)).toBe(false)
  })
})

// ---------------------------------------------------------------- recommended

describe('FR-07 recommended building', () => {
  it('recommends School at the start', () => {
    expect(recommendedBuilding(order, {})).toBe('school')
  })

  it('recommends a building that still has fewer than 3 stars', () => {
    expect(recommendedBuilding(order, { school: done(2) })).toBe('school')
  })

  it('moves on once a building has 3 stars', () => {
    expect(recommendedBuilding(order, { school: done(3) })).toBe('dhaba')
  })

  it('returns null when every playable building has 3 stars', () => {
    const all: ProgressMap = { school: done(3), dhaba: done(3), home: done(3), panchayat: done(3) }
    expect(recommendedBuilding(order, all)).toBeNull()
  })
})

// ---------------------------------------------------------------- bands

describe('FR-05 card text by age band', () => {
  const card: Card = {
    id: 'c',
    title: 'T',
    kid: 'Simple words',
    teen: 'More detail',
    ifItHappens: 'Tell',
    law: 'Law',
    source: 'Src',
  }

  it('young players see kid text with teen text behind "Tell me more"', () => {
    expect(cardTextForBand(card, 'young')).toEqual({ text: 'Simple words', more: 'More detail' })
  })

  it('teen players see teen text and nothing more', () => {
    expect(cardTextForBand(card, 'teen')).toEqual({ text: 'More detail', more: null })
  })
})

describe('FR-06 quiz band filtering', () => {
  const questions = [q('q1'), q('q2', 'teen'), q('q3')]

  it('young players do not see teen-only questions', () => {
    expect(questionsForBand(questions, 'young').map((x) => x.id)).toEqual(['q1', 'q3'])
  })

  it('teen players see every question', () => {
    expect(questionsForBand(questions, 'teen').map((x) => x.id)).toEqual(['q1', 'q2', 'q3'])
  })

  it('the score only counts questions shown for the band', () => {
    const shown = questionsForBand(questions, 'young')
    const attempts = [
      { questionId: 'q1', correct: true },
      { questionId: 'q3', correct: true },
    ]
    expect(scoreQuiz(shown, attempts)).toEqual({ correct: 2, total: 2 })
  })
})

// ---------------------------------------------------------------- quiz score

describe('FR-06 quiz score', () => {
  const shown = [q('q1'), q('q2'), q('q3'), q('q4'), q('q5')]

  it('counts only the first attempt at each question', () => {
    const attempts = [
      { questionId: 'q1', correct: false },
      { questionId: 'q1', correct: true },
      { questionId: 'q2', correct: true },
    ]
    expect(scoreQuiz(shown, attempts)).toEqual({ correct: 1, total: 5 })
  })

  it('counts unanswered questions as wrong', () => {
    expect(scoreQuiz(shown, [])).toEqual({ correct: 0, total: 5 })
  })

  it('rounds the stored percentage to a whole number', () => {
    expect(scorePercent({ correct: 1, total: 3 })).toBe(33)
    expect(scorePercent({ correct: 0, total: 0 })).toBe(0)
  })
})

describe('FR-06 hint round', () => {
  const shown = [q('q1'), q('q2'), q('q3'), q('q4'), q('q5')]
  const firstTry = [
    { questionId: 'q1', correct: true },
    { questionId: 'q2', correct: false },
    { questionId: 'q3', correct: false },
    { questionId: 'q4', correct: true },
    { questionId: 'q5', correct: false },
  ]

  it('is offered when the score is under 60%', () => {
    expect(needsHintRound({ correct: 2, total: 5 })).toBe(true)
  })

  it('is not offered at 60% or more', () => {
    expect(needsHintRound({ correct: 3, total: 5 })).toBe(false)
  })

  it('replays only the missed questions', () => {
    expect(hintRoundQuestions(shown, firstTry).map((x) => x.id)).toEqual(['q2', 'q3', 'q5'])
  })

  it('does not change the score, even when every hint-round answer is right', () => {
    const before = scoreQuiz(shown, firstTry)
    const hintAnswers = ['q2', 'q3', 'q5'].map((questionId) => ({ questionId, correct: true }))
    expect(scoreQuiz(shown, [...firstTry, ...hintAnswers])).toEqual(before)
    expect(before).toEqual({ correct: 2, total: 5 })
  })
})

// ---------------------------------------------------------------- merge

describe('FR-12 sync merge rule', () => {
  it('stars and best score take the max, per building', () => {
    const local: ProgressMap = { school: done(3, 80), dhaba: done(1, 50) }
    const remote: ProgressMap = { school: done(2, 95), home: done(2, 70) }
    expect(mergeProgress(local, remote)).toEqual({
      school: done(3, 95),
      dhaba: done(1, 50),
      home: done(2, 70),
    })
  })

  it('merging is the same in either order', () => {
    const a: ProgressMap = { school: done(3, 80) }
    const b: ProgressMap = { school: done(2, 95), dhaba: done(1, 40) }
    expect(mergeProgress(a, b)).toEqual(mergeProgress(b, a))
  })

  it('cards, badges, marigolds and pledges take the union without duplicates', () => {
    const a = { cards: ['c1'], badges: ['b1'], marigolds: ['m1'], pledges: ['p1'] }
    const b = { cards: ['c1', 'c2'], badges: [], marigolds: ['m2'], pledges: ['p1'] }
    expect(mergeExtras(a, b)).toEqual({
      cards: ['c1', 'c2'],
      badges: ['b1'],
      marigolds: ['m1', 'm2'],
      pledges: ['p1'],
    })
  })
})

// ---------------------------------------------------------------- first name

describe('FR-01 / NFR-01 first name', () => {
  it.each(['Asha', 'Ravi Kumar', 'आशा', 'मीरा देवी', 'Zoë', '  Asha  '])('accepts "%s"', (name) => {
    expect(isValidFirstName(name)).toBe(true)
  })

  it.each(['', '   ', 'Asha1', 'R2D2', 'asha@mail', 'Asha!', 'Ravi_K', '😀', 'Asha-Rani', 'A'.repeat(21)])(
    'rejects "%s"',
    (name) => {
      expect(isValidFirstName(name)).toBe(false)
    },
  )

  it('accepts exactly 20 letters', () => {
    expect(isValidFirstName('A'.repeat(20))).toBe(true)
  })

  it('cleans extra spaces', () => {
    expect(cleanFirstName('  Asha   Rani ')).toBe('Asha Rani')
  })
})
