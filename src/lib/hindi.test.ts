import { afterEach, describe, expect, it } from 'vitest'
import en from '@content/strings.en.json'
import type { SceneDef } from '@content/types'
import { getLang, setLang, t } from './i18n'
import { textPaths } from './localize'
import { getBuildings, getHelp, getScene, getTownScene, reviewableContent } from './scenes'
import { getNpc } from '@/engine/people'

afterEach(() => setLang('en'))

/** Everything in a scene that is not words: what Hindi must never change. */
function wiring(scene: SceneDef) {
  const words = new Set(textPaths(scene).values())
  return JSON.stringify(scene, (_key, value: unknown) => (typeof value === 'string' && words.has(value) ? '…' : value))
}

describe('P6 Hindi (D-054)', () => {
  it('the UI speaks Hindi, and falls back to English for nothing', () => {
    setLang('hi')
    expect(getLang()).toBe('hi')
    expect(t('title.newGame')).toBe('नया खेल')
    expect(t('results.title', { name: 'आशा' })).toBe('शाबाश, आशा!')
    for (const key of Object.keys(en) as (keyof typeof en)[]) {
      // Language names and the Hindi name are the same in both on purpose.
      if (!['lang.en', 'lang.hi', 'app.nameHindi'].includes(key)) expect(t(key), key).not.toBe(en[key])
    }
  })

  it('every scene in Hindi has the same ids, links, answers, law and sources as in English', () => {
    const ids = getBuildings().filter((b) => !b.teaser).map((b) => b.id)
    const english = [getTownScene(), ...ids.map((id) => getScene(id))]
    setLang('hi')
    const hindi = [getTownScene(), ...ids.map((id) => getScene(id))]
    hindi.forEach((scene, i) => {
      const before = english[i]!
      expect(scene).not.toBe(before)
      expect(scene!.title).not.toBe(before.title)
      expect(wiring(scene!)).toBe(wiring(before))
      expect(scene!.card?.law).toBe(before.card?.law)
      expect(scene!.card?.source).toBe(before.card?.source)
    })
  })

  it('the Help Centre in Hindi keeps every number, link and source exactly', () => {
    const english = getHelp()
    setLang('hi')
    const hindi = getHelp()
    expect(hindi.title).toBe('मदद चाहिए?')
    expect(hindi.helplines.map((h) => [h.number, h.sources])).toEqual(english.helplines.map((h) => [h.number, h.sources]))
  })

  it('people have Hindi names, and the same look', () => {
    const english = getNpc('ravi')
    setLang('hi')
    expect(getNpc('ravi')?.name).toBe('रवि')
    expect(getNpc('ravi')?.look).toEqual(english?.look)
  })

  it('Hindi is reviewed on its own: every English item has a Hindi twin with different text', () => {
    const items = reviewableContent()
    const english = items.filter((i) => i.lang === 'en')
    const hindi = items.filter((i) => i.lang === 'hi')
    expect(hindi.map((i) => i.id)).toEqual(english.map((i) => i.id.replace(/:en$/, ':hi')))
    hindi.forEach((item, i) => expect(item.text).not.toBe(english[i]!.text))
  })
})
