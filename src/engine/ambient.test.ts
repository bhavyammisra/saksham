import { describe, expect, it } from 'vitest'
import type { Ambient } from '@content/types'
import { ambientShown, lightFor, MAX_AMBIENT, roamSeconds } from './ambient'

describe('P6 living world (D-053)', () => {
  it('a story scene keeps its own light; the default is day', () => {
    expect(lightFor('morning', 22)).toBe('morning')
    expect(lightFor('evening', 9)).toBe('evening')
    expect(lightFor(undefined, 20)).toBe('day')
  })

  it('the town follows the clock: morning from 5, day from 11, evening from 5 pm', () => {
    expect(lightFor('clock', 4)).toBe('evening')
    expect(lightFor('clock', 5)).toBe('morning')
    expect(lightFor('clock', 10)).toBe('morning')
    expect(lightFor('clock', 11)).toBe('day')
    expect(lightFor('clock', 16)).toBe('day')
    expect(lightFor('clock', 17)).toBe('evening')
    expect(lightFor('clock', 23)).toBe('evening')
  })

  it('diyas only come out in the evening, and there are never more than the cap', () => {
    const items: Ambient[] = [
      { id: 'dog', kind: 'dog', x: 0 },
      { id: 'diya', kind: 'diya', x: 10, evening: true },
    ]
    expect(ambientShown(items, false).map((a) => a.id)).toEqual(['dog'])
    expect(ambientShown(items, true).map((a) => a.id)).toEqual(['dog', 'diya'])
    expect(ambientShown(undefined, true)).toEqual([])
    const many = Array.from({ length: 10 }, (_, i): Ambient => ({ id: `d${i}`, kind: 'dog', x: i }))
    expect(ambientShown(many, false)).toHaveLength(MAX_AMBIENT)
  })

  it('a stroll moves at an easy pace and never rushes', () => {
    expect(roamSeconds(600)).toBe(20)
    expect(roamSeconds(50)).toBe(6)
  })
})
