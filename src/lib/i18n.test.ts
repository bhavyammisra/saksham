import { describe, expect, it } from 'vitest'
import en from '@content/strings.en.json'
import { t, type StringKey } from './i18n'

describe('t()', () => {
  it('returns the English text for a key', () => {
    expect(t('app.name')).toBe('Saksham')
  })

  it('fills in {placeholders}', () => {
    expect(t('shell.comingSoon', { name: 'Asha' })).toBe(
      'The town is being built. Come back soon, Asha!',
    )
  })

  it('leaves unknown placeholders untouched', () => {
    expect(t('shell.comingSoon', {})).toContain('{name}')
  })

  it('returns the key itself when a string is missing', () => {
    expect(t('does.not.exist' as StringKey)).toBe('does.not.exist')
  })
})

describe('strings.en.json', () => {
  it('is a flat map of non-empty strings', () => {
    for (const [key, value] of Object.entries(en)) {
      expect(typeof value, key).toBe('string')
      expect(value.trim(), key).not.toBe('')
    }
  })
})
