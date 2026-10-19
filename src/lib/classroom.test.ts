import { describe, expect, it } from 'vitest'
import { problemFor } from './classroom'

describe('FR-11 class problems in words a child understands', () => {
  it('a wrong or switched-off code is one problem (the server answers both the same way)', () => {
    expect(problemFor({ code: 'P0002', message: 'unknown or inactive code' }, true)).toBe('code')
  })

  it('no connection is its own problem', () => {
    expect(problemFor({ message: 'TypeError: Failed to fetch' }, true)).toBe('offline')
    expect(problemFor({ code: 'P0002' }, false)).toBe('offline')
  })

  it('anything else is a general problem', () => {
    expect(problemFor({ code: '22023', message: 'invalid first name' }, true)).toBe('general')
    expect(problemFor(null, true)).toBe('general')
  })
})
