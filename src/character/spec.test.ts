import { describe, expect, it } from 'vitest'
import { mix } from './color'
import {
  defaultSpec,
  hairColors,
  hairStyles,
  headwearColors,
  headwears,
  normalizeSpec,
  outfitColors,
  outfits,
  randomSpec,
  skinTones,
} from './spec'

describe('FR-01 character options (BUILD_PLAN P2)', () => {
  it('has 8 to 10 skin tones, 6 to 8 hairstyles and at least 5 hair colours', () => {
    expect(skinTones.length).toBeGreaterThanOrEqual(8)
    expect(skinTones.length).toBeLessThanOrEqual(10)
    expect(hairStyles.length).toBeGreaterThanOrEqual(6)
    expect(hairStyles.length).toBeLessThanOrEqual(8)
    expect(hairColors.length).toBeGreaterThanOrEqual(5)
  })

  it('includes school uniform, kurta, salwar kameez and casual outfits', () => {
    const ids = outfits.map((o) => o.id)
    for (const id of ['uniform', 'kurta', 'salwar', 'casual']) expect(ids).toContain(id)
  })

  it('includes patka, hijab and dupatta as head coverings', () => {
    const ids = headwears.map((h) => h.id)
    for (const id of ['none', 'patka', 'hijab', 'dupatta']) expect(ids).toContain(id)
  })

  it('has unique ids within each option list', () => {
    for (const list of [skinTones, hairStyles, hairColors, outfits, outfitColors, headwears, headwearColors]) {
      const ids = list.map((o) => o.id)
      expect(new Set(ids).size).toBe(ids.length)
    }
  })
})

describe('FR-01 "Surprise me"', () => {
  it('always makes a valid character', () => {
    let seed = 1
    const random = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646
    for (let i = 0; i < 200; i++) {
      const spec = randomSpec(random)
      expect(normalizeSpec(spec)).toEqual(spec)
    }
  })

  it('can produce every hairstyle and outfit', () => {
    const seen = { hair: new Set<string>(), outfit: new Set<string>() }
    for (let i = 0; i < 500; i++) {
      const spec = randomSpec()
      seen.hair.add(spec.hair)
      seen.outfit.add(spec.outfit)
    }
    expect(seen.hair.size).toBe(hairStyles.length)
    expect(seen.outfit.size).toBe(outfits.length)
  })
})

describe('saved characters', () => {
  it('keeps a valid spec unchanged', () => {
    expect(normalizeSpec(defaultSpec)).toEqual(defaultSpec)
  })

  it('repairs unknown or missing values with the defaults', () => {
    expect(normalizeSpec({ skin: 'green', hair: 'curly', glasses: 'yes' })).toEqual({
      ...defaultSpec,
      hair: 'curly',
    })
    expect(normalizeSpec(null)).toEqual(defaultSpec)
  })
})

describe('colour mixing', () => {
  it('mixes two colours', () => {
    expect(mix('#000000', '#ffffff', 0.5)).toBe('#808080')
    expect(mix('#123456', '#ffffff', 0)).toBe('#123456')
  })
})
