// Sending a player's progress to their class, and bringing it back (FR-12, D-046).
// The game never waits for this and never shows an error: if anything fails, the same data is
// simply sent again on the next change, on the next start, or when the connection comes back.
//
// Progress and extras need no queue: the whole (small) state is sent each time and the database
// keeps the best of both (D-043). Quiz and sort answers are events, so they wait in `outbox` until sent.

import { signInAsActivePlayer } from './classroom'
import type { Extras, ProgressMap } from './rules'
import { selectActiveData, useStore } from './store'
import type { Supabase } from './supabase'

/** One round: send this player's state, then merge back what the class server has. */
export async function syncActivePlayer(db: Supabase): Promise<void> {
  // shortcut: only the active player syncs; other players on the device sync when they next play.
  if (!navigator.onLine || !selectActiveData(useStore.getState())?.classInfo) return
  try {
    await signInAsActivePlayer(db)
    const data = selectActiveData(useStore.getState())! // read again: signing in may have saved a new login
    const studentId = data.cloud!.userId

    const progress = Object.entries(data.progress).map(([building_id, p]) => ({
      student_id: studentId,
      building_id,
      stars: p.stars,
      best_score: p.bestScore,
      completed: p.completed,
    }))
    if (progress.length > 0) check(await db.from('progress').upsert(progress))
    check(await db.from('student_extras').upsert({ student_id: studentId, ...data.extras }))

    const outbox = data.outbox ?? []
    if (outbox.length > 0) {
      check(await db.from('quiz_attempts').insert(outbox.map((a) => ({ student_id: studentId, building_id: a.buildingId, question_id: a.questionId, correct: a.correct }))))
      useStore.getState().dropSent(outbox.length) // only what was sent: new answers may have arrived meanwhile
    }

    // Bring back anything saved from another device (the merge rules keep the best of both).
    const remoteProgress = check(await db.from('progress').select('building_id, stars, best_score, completed'))
    const remoteExtras = check(await db.from('student_extras').select('cards, badges, marigolds, pledges').maybeSingle())
    const progressMap: ProgressMap = Object.fromEntries(
      (remoteProgress ?? []).map((p) => [p.building_id, { stars: p.stars, bestScore: p.best_score, completed: p.completed }]),
    )
    const extras: Extras = remoteExtras ?? { cards: [], badges: [], marigolds: [], pledges: [] }
    useStore.getState().mergeRemote(progressMap, extras)
  } catch {
    // Background work: nothing to tell the child. It runs again on the next change, start or reconnect.
  }
}

/** A Supabase answer's data, or a throw if it failed (so one failure ends the round). */
function check<T>(result: { data: T; error: unknown }): T {
  if (result.error) throw result.error
  return result.data
}

/**
 * Starts syncing: once now, a moment after the active player's data changes, and when the
 * connection comes back. Rounds never overlap; a change during a round runs one more after it.
 */
export function startSync(db: Supabase): void {
  let running = false
  let again = false
  let timer: ReturnType<typeof setTimeout> | undefined

  const run = async () => {
    if (running) {
      again = true
      return
    }
    running = true
    await syncActivePlayer(db)
    running = false
    if (again) {
      again = false
      void run()
    }
  }
  const soon = () => {
    clearTimeout(timer)
    timer = setTimeout(() => void run(), 1500) // a burst of changes (end of a building) becomes one round
  }

  useStore.subscribe((state, before) => {
    const id = state.activeProfileId
    if (id !== before.activeProfileId || (id && state.data[id] !== before.data[id])) soon()
  })
  window.addEventListener('online', () => void run())
  void run()
}
