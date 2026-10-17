// Game rules (BUILD_PLAN §7). Pure functions only: no React, no storage, no clock.
// The store calls these; tests in rules.test.ts cover every rule.

import type { Band, BuildingInfo, Card, QuizQuestion } from '@content/types'

// ---------------------------------------------------------------- types

/** All the rules need to know about a building: its id and whether it is a teaser. */
export type BuildingRef = Pick<BuildingInfo, 'id' | 'teaser'>

/** What is saved per building. bestScore is a whole percentage, 0 to 100. */
export interface BuildingProgress {
  stars: number // 0 to 3
  bestScore: number // 0 to 100
  completed: boolean
}

export type ProgressMap = Record<string, BuildingProgress>

/** Collections that only ever grow, merged by union. */
export interface Extras {
  cards: string[]
  badges: string[]
  marigolds: string[]
  pledges: string[]
}

/** Correct answers on the first attempt, out of the questions shown. */
export interface Score {
  correct: number
  total: number
}

export interface Attempt {
  questionId: string
  correct: boolean
}

/** One play-through of a building, from arriving to the end of its game. */
export interface BuildingResult {
  completed: boolean // the scene's good ending was reached
  retries: number // weaker choices that led to "let's try that again"
  score: Score // the game score
}

// ---------------------------------------------------------------- scores

/** True when score is at least `percent` %. Uses whole numbers to avoid rounding surprises. */
export function scoreAtLeast(score: Score, percent: number): boolean {
  if (score.total <= 0) return false
  return score.correct * 100 >= score.total * percent
}

export function scorePercent(score: Score): number {
  if (score.total <= 0) return 0
  return Math.round((score.correct * 100) / score.total)
}

// ---------------------------------------------------------------- bands

/** Teen-only questions are shown only to the teen band. */
export function questionsForBand(questions: QuizQuestion[], band: Band): QuizQuestion[] {
  return questions.filter((q) => q.band !== 'teen' || band === 'teen')
}

/**
 * Card text for a band. Young players see `kid` with "Tell me more" revealing `teen`;
 * teen players see `teen` and nothing more.
 */
export function cardTextForBand(card: Card, band: Band): { text: string; more: string | null } {
  return band === 'young' ? { text: card.kid, more: card.teen } : { text: card.teen, more: null }
}

// ---------------------------------------------------------------- quiz

/**
 * Game score = correct on the first attempt / questions shown.
 * Only the first attempt at each question counts, so hint-round answers
 * (which come later) can never change the score. Unanswered questions count as wrong.
 * A sort game is scored the same way, one attempt per item.
 */
export function scoreQuiz(shown: { id: string }[], attempts: Attempt[]): Score {
  const first = firstAttempts(attempts)
  const correct = shown.filter((q) => first.get(q.id) === true).length
  return { correct, total: shown.length }
}

/** A building's game score: every game it played, added together. */
export function addScores(scores: Score[]): Score {
  return scores.reduce((sum, s) => ({ correct: sum.correct + s.correct, total: sum.total + s.total }), { correct: 0, total: 0 })
}

/** The hint round is offered when the quiz score is under 60%. */
export function needsHintRound(score: Score): boolean {
  return !scoreAtLeast(score, 60)
}

/** Questions to replay in the hint round: those missed (or skipped) on the first attempt. */
export function hintRoundQuestions(shown: QuizQuestion[], attempts: Attempt[]): QuizQuestion[] {
  const first = firstAttempts(attempts)
  return shown.filter((q) => first.get(q.id) !== true)
}

function firstAttempts(attempts: Attempt[]): Map<string, boolean> {
  const first = new Map<string, boolean>()
  for (const a of attempts) if (!first.has(a.questionId)) first.set(a.questionId, a.correct)
  return first
}

// ---------------------------------------------------------------- stars

/**
 * Stars, max 3 per building:
 *  1 for finishing the scene;
 * +1 if the game score is 60% or more;
 * +1 if the game score is 90% or more AND the scene had no retries.
 */
export function starsFor(result: BuildingResult): number {
  if (!result.completed) return 0
  let stars = 1
  if (scoreAtLeast(result.score, 60)) stars += 1
  if (scoreAtLeast(result.score, 90) && result.retries === 0) stars += 1
  return stars
}

export function progressFromResult(result: BuildingResult): BuildingProgress {
  return { stars: starsFor(result), bestScore: scorePercent(result.score), completed: result.completed }
}

/** Keep the best result per building: replays can only raise stars and score. */
export function bestProgress(a: BuildingProgress | undefined, b: BuildingProgress): BuildingProgress {
  if (!a) return { ...b }
  return {
    stars: Math.max(a.stars, b.stars),
    bestScore: Math.max(a.bestScore, b.bestScore),
    completed: a.completed || b.completed,
  }
}

// ---------------------------------------------------------------- badges

/**
 * Badges celebrate what a child did themselves, never how they compare to others
 * (no streaks, no leaderboards). Each id has a label and a description in the strings file.
 */
export const BADGES = ['first-steps', 'kind-helper', 'quiz-whiz', 'right-first-time', 'all-buildings'] as const
export type BadgeId = (typeof BADGES)[number]

/**
 * Badges earned by a finished play-through. `progress` is the saved progress *after*
 * this result was recorded; `order` is the buildings list. Badges already held are
 * returned too: the store keeps a union, so adding one twice changes nothing.
 */
export function badgesFor(result: BuildingResult, progress: ProgressMap, order: BuildingRef[]): BadgeId[] {
  if (!result.completed) return []
  const earned: BadgeId[] = ['first-steps'] // finished a building
  if (result.retries === 0) earned.push('right-first-time') // best choice every time
  if (result.score.total > 0 && result.score.correct === result.score.total) earned.push('quiz-whiz') // full marks on the first try
  const playable = order.filter((b) => !b.teaser)
  const done = playable.filter((b) => progress[b.id]?.completed).length
  if (done >= 2) earned.push('kind-helper') // helped in two places
  if (playable.length > 0 && done === playable.length) earned.push('all-buildings')
  return earned
}

// ---------------------------------------------------------------- unlocks

/**
 * The first playable building is always unlocked. Completing building N unlocks N+1.
 * Teasers are never playable. Demo mode unlocks every playable building.
 */
export function isUnlocked(id: string, order: BuildingRef[], progress: ProgressMap, demo = false): boolean {
  const playable = order.filter((b) => !b.teaser)
  const index = playable.findIndex((b) => b.id === id)
  if (index === -1) return false // unknown building or teaser
  if (demo || index === 0) return true
  const previous = playable[index - 1]
  return previous !== undefined && progress[previous.id]?.completed === true
}

/** The first unlocked building with fewer than 3 stars, or null when everything is done. */
export function recommendedBuilding(order: BuildingRef[], progress: ProgressMap, demo = false): string | null {
  const next = order.find((b) => isUnlocked(b.id, order, progress, demo) && (progress[b.id]?.stars ?? 0) < 3)
  return next?.id ?? null
}

// ---------------------------------------------------------------- sync merge

/** Merge two progress maps: stars and best score take the max, completed is kept if either has it. */
export function mergeProgress(a: ProgressMap, b: ProgressMap): ProgressMap {
  const merged: ProgressMap = { ...a }
  for (const [id, p] of Object.entries(b)) merged[id] = bestProgress(merged[id], p)
  return merged
}

/** Merge extras: cards, badges, marigolds and pledges take the union (a's order first). */
export function mergeExtras(a: Extras, b: Extras): Extras {
  const union = (x: string[], y: string[]) => [...new Set([...x, ...y])]
  return {
    cards: union(a.cards, b.cards),
    badges: union(a.badges, b.badges),
    marigolds: union(a.marigolds, b.marigolds),
    pledges: union(a.pledges, b.pledges),
  }
}

// ---------------------------------------------------------------- first name

export const MAX_NAME_LENGTH = 20

/** Trims and collapses repeated spaces: "  Asha   Rani " -> "Asha Rani". */
export function cleanFirstName(raw: string): string {
  return raw.trim().replace(/\s+/g, ' ')
}

/**
 * A first name is letters and single spaces only, at most 20 characters.
 * "Letters" includes Hindi: \p{L} is any letter and \p{M} the vowel signs
 * Devanagari letters combine with. Digits, symbols and emoji are rejected.
 */
export function isValidFirstName(raw: string): boolean {
  const name = cleanFirstName(raw)
  if (name === '' || [...name].length > MAX_NAME_LENGTH) return false
  return /^[\p{L}\p{M}]+( [\p{L}\p{M}]+)*$/u.test(name)
}

// ---------------------------------------------------------------- demo mode

export const DEMO_CODE = 'demo'

/** Keeps the last few typed letters; demo mode turns on when they spell DEMO_CODE. */
export function nextDemoBuffer(buffer: string, key: string): string {
  if (key.length !== 1) return buffer // ignore Shift, Enter, arrows...
  return (buffer + key.toLowerCase()).slice(-DEMO_CODE.length)
}

export function isDemoCode(buffer: string): boolean {
  return buffer === DEMO_CODE
}
