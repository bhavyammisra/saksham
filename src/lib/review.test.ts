import { describe, expect, it } from 'vitest'
import help from '@content/help.json'
import school from '@content/scenes/school.json'
import type { Card, GameDef, HelpContent } from '@content/types'
import { cardText, readable, reviewItems, sha256 } from './review'

const card = school.card as Card
const buildings = [{ id: 'school', name: 'The School', card, games: school.games as GameDef[] }]

describe('FR-15 reviewable content and its hash', () => {
  it('lists each card, each building\'s games and the Help Centre', () => {
    expect(reviewItems(buildings, help as HelpContent).map((i) => i.id)).toEqual(['card:right-to-education:en', 'quiz:school:en', 'help:centre:en'])
  })

  it('lays the text out for reading, with real quotes and line breaks', () => {
    expect(readable({ title: 'A', law: 'He said "yes".\nNext line.', options: ['x', 'y'] })).toBe('title: A\nlaw: He said "yes".\nNext line.\noptions:\n  1.\n    x\n  2.\n    y')
  })

  it('gives a known SHA-256 hash', async () => {
    expect(await sha256('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad')
  })

  it('changes the hash when the words change, but not when only the review notes change', async () => {
    const before = await sha256(cardText(card))
    expect(await sha256(cardText({ ...card, law: card.law + ' ' }))).not.toBe(before)
    expect(await sha256(cardText({ ...card, review: { ...card.review, status: 'verified', checkedBy: 'Owner', checkedOn: '2026-10-18' } }))).toBe(before)
  })
})
