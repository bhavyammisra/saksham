// Joining and leaving a class (FR-11, D-045). Only the active player is ever involved.
// Each player has their own anonymous login on the class server, saved with their data, so that
// on a shared classroom device every child is a separate student.

import type { Json } from './database.types'
import { selectActiveData, selectActiveProfile, useStore } from './store'
import type { Supabase } from './supabase'

/** What went wrong, in the three ways the child is told about. */
export type ClassProblem = 'code' | 'offline' | 'general'

/** Sorts an error from the class server into a problem the child can understand. */
export function problemFor(error: { code?: string; message?: string } | null | undefined, online = navigator.onLine): ClassProblem {
  if (!online) return 'offline'
  if (error?.code === 'P0002') return 'code' // join_class: the code is wrong or switched off (one answer for both, on purpose)
  if (/fetch|network/i.test(error?.message ?? '')) return 'offline'
  return 'general'
}

/** Makes sure the class server knows this player as themselves: their saved login, or a new anonymous one. */
async function signInAsActivePlayer(db: Supabase): Promise<void> {
  const saved = selectActiveData(useStore.getState())?.cloud
  const { data } = await db.auth.getSession()
  if (saved && data.session?.user.id === saved.userId) return

  const result = saved ? await db.auth.refreshSession({ refresh_token: saved.refreshToken }) : await db.auth.signInAnonymously()
  const session = result.data.session
  if (result.error || !session) throw result.error ?? new Error('no session')
  useStore.getState().setCloud({ userId: session.user.id, refreshToken: session.refresh_token })
}

/** Joins the class with this code, as the active player. Returns null when it worked. */
export async function joinClass(db: Supabase, code: string): Promise<ClassProblem | null> {
  const profile = selectActiveProfile(useStore.getState())
  if (!profile) return 'general'
  if (!navigator.onLine) return 'offline' // say so at once (the client would retry for a long time first)
  try {
    await signInAsActivePlayer(db)
  } catch (error) {
    return problemFor(error as { message?: string })
  }
  const { data, error } = await db.rpc('join_class', {
    code: code.trim(),
    first_name: profile.firstName,
    band: profile.band,
    avatar: profile.avatar as unknown as Json,
  })
  const row = data?.[0]
  if (error || !row) return problemFor(error)
  useStore.getState().setClassInfo({ id: row.class_id, name: row.class_name })
  return null
}

/** Leaves the class, as the active player. Their game on this device keeps everything. */
export async function leaveClass(db: Supabase): Promise<ClassProblem | null> {
  if (!navigator.onLine) return 'offline'
  try {
    await signInAsActivePlayer(db)
  } catch (error) {
    return problemFor(error as { message?: string })
  }
  const { error } = await db.rpc('leave_class')
  if (error) return problemFor(error)
  useStore.getState().setClassInfo(null)
  return null
}
