// Content review (FR-15, D-049): every rights card, every building's games and the Help Centre
// become a reviewable item. The class server stores only a SHA-256 hash of each item's exact text,
// never the text itself; a reviewer reads the text in the app and publishes the hash.
// Plain relative imports, so both the app and scripts/content-hashes.ts (Node) can use this file.

import type { Card, GameDef, HelpContent } from '../../content/types.ts'

export interface ReviewItem {
  id: string // e.g. "card:right-to-education:en", "quiz:school:en", "help:centre:en"
  kind: 'card' | 'quiz' | 'help'
  lang: 'en'
  title: string // what a reviewer sees in the list
  text: string // exactly what is hashed
}

/** The words that matter, as text. The `review` block is left out: changing who checked it isn't changing the content. */
const asText = (value: object) => JSON.stringify(value, null, 2)
const withoutReview = <T extends { review?: unknown }>(value: T) => {
  const copy = { ...value }
  delete copy.review
  return copy
}

export const cardItemId = (card: Card) => `card:${card.id}:en`

export function cardText(card: Card): string {
  return asText(withoutReview(card))
}

/** Every reviewable item, in a fixed order: each building's card and games, then the Help Centre. */
export function reviewItems(buildings: { id: string; name: string; card?: Card | null; games?: GameDef[] }[], help: HelpContent): ReviewItem[] {
  const items: ReviewItem[] = []
  for (const b of buildings) {
    if (b.card) items.push({ id: cardItemId(b.card), kind: 'card', lang: 'en', title: `${b.name}: ${b.card.title}`, text: cardText(b.card) })
    if (b.games?.length) items.push({ id: `quiz:${b.id}:en`, kind: 'quiz', lang: 'en', title: `${b.name}: games`, text: asText(b.games) })
  }
  items.push({ id: 'help:centre:en', kind: 'help', lang: 'en', title: help.title, text: asText(withoutReview(help)) })
  return items
}

/** An item's text laid out for reading: one labelled line per field, with real quotes and line breaks. */
export function readable(value: unknown, depth = 0): string {
  const pad = '  '.repeat(depth)
  if (Array.isArray(value)) return value.map((v, i) => `${pad}${i + 1}.\n${readable(v, depth + 1)}`).join('\n')
  if (value && typeof value === 'object') {
    return Object.entries(value)
      .map(([key, v]) => (v && typeof v === 'object' ? `${pad}${key}:\n${readable(v, depth + 1)}` : `${pad}${key}: ${String(v)}`))
      .join('\n')
  }
  return `${pad}${String(value)}`
}

/** The SHA-256 hash of a text, as 64 hex characters (the same in the browser and in Node). */
export async function sha256(text: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
}
