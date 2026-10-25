// Which content a reviewer has published (D-049), for the "Reviewed" tick on rights cards.
// Read once per visit. Without a class server, offline, or on any failure there is simply no tick:
// the card itself never waits for this.

import type { Card } from '@content/types'
import { getLang } from './i18n'
import { cardItemId, cardText, sha256 } from './review'
import { supabase } from './supabase'

let published: Promise<Map<string, { hash: string; reviewedAt: string | null }>> | null = null

function loadPublished() {
  published ??= (async () => {
    if (!supabase || !navigator.onLine) return new Map()
    const { data, error } = await supabase.rpc('published_content')
    if (error) {
      published = null // try again next time
      return new Map()
    }
    return new Map((data ?? []).map((r) => [r.id, { hash: r.content_hash, reviewedAt: r.reviewed_at }]))
  })()
  return published
}

/** The date this exact card text, in the language on screen, was published by a reviewer, or null (not reviewed, changed since, or unknown). */
export async function reviewedOn(card: Card): Promise<string | null> {
  try {
    const row = (await loadPublished()).get(cardItemId(card, getLang()))
    if (!row || row.hash !== (await sha256(cardText(card)))) return null
    return row.reviewedAt ? new Date(row.reviewedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : ''
  } catch {
    return null
  }
}
