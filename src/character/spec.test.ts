import { describe, expect, it } from 'vitest'
import { mix } from './color'
import {
  bottomColors,
  bottoms,
  defaultSpec,
  hairColors,
  hairFor,
  hairStyles,
  headwearColors,
  headwears,
  normalizeSpec,
  outfitColors,
  outfits,
  playerHeadwears,
  playerTops,
  randomSpec,
  skinTones,
  withGender,
} from './spec'

describe('FR-01 character options (BUILD_PLAN P2)', () => {
  it('has 8 to 10 skin tones, five modern hairstyles each for boys and girls, and at least 5 hair colours', () => {
    expect(skinTones.length).toBeGreaterThanOrEqual(8)
    expect(skinTones.length).toBeLessThanOrEqual(10)
    expect(hairFor('boy')).toHaveLength(5)
    expect(hairFor('girl')).toHaveLength(5)
    expect(hairColors.length).toBeGreaterThanOrEqual(5)
  })

  it('offers players modern clothes only: tops with jeans, trousers or joggers (D-034)', () => {
    expect(playerTops.map((o) => o.id)).toEqual(['tshirt', 'shirt', 'hoodie', 'jacket'])
    expect(bottoms.map((o) => o.id)).toEqual(['jeans', 'trousers', 'joggers'])
    expect(playerHeadwears.map((h) => h.id)).toEqual(['none', 'patka', 'hijab'])
  })

  it('still knows the uniforms and traditional clothes worn by people in the stories', () => {
    const ids = outfits.map((o) => o.id)
    for (const id of ['uniform', 'kurta', 'salwar', 'casual']) expect(ids).toContain(id)
    expect(headwears.map((h) => h.id)).toContain('dupatta')
  })

  it('switching between boy and girl picks a hairstyle from the new list', () => {
    const girl = withGender(defaultSpec, 'girl')
    expect(girl.gender).toBe('girl')
    expect(hairFor('girl').map((h) => h.id)).toContain(girl.hair)
    expect(withGender(girl, 'girl')).toBe(girl)
  })

  it('has unique ids within each option list', () => {
    for (const list of [skinTones, hairStyles, hairColors, outfits, outfitColors, bottoms, bottomColors, headwears, headwearColors]) {
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

  it('can produce every player hairstyle and top, and keeps to the gender asked for', () => {
    const seen = { hair: new Set<string>(), outfit: new Set<string>() }
    for (let i = 0; i < 500; i++) {
      const spec = randomSpec()
      seen.hair.add(spec.hair)
      seen.outfit.add(spec.outfit)
      expect(hairFor(spec.gender).map((h) => h.id)).toContain(spec.hair)
    }
    expect(seen.hair.size).toBe(hairFor('boy').length + hairFor('girl').length)
    expect(seen.outfit.size).toBe(playerTops.length)
    expect(randomSpec(Math.random, 'girl').gender).toBe('girl')
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

  it('gives characters saved before D-034 a gender, guessed from the hairstyle', () => {
    expect(normalizeSpec({ hair: 'two-plaits', outfit: 'salwar' })).toMatchObject({ gender: 'girl', outfit: 'salwar', bottom: 'jeans' })
    expect(normalizeSpec({ hair: 'side-part' }).gender).toBe('boy')
  })
})

describe('colour mixing', () => {
  it('mixes two colours', () => {
    expect(mix('#000000', '#ffffff', 0.5)).toBe('#808080')
    expect(mix('#123456', '#ffffff', 0)).toBe('#123456')
  })
})
