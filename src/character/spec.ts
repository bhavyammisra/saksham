// The player character is described by a small JSON object (CharacterSpec).
// It is saved with the profile and drawn by <Character>. Every option has a
// string id (saved) and a label key (shown, through t()).

import type { StringKey } from '@/lib/i18n'

export interface CharacterSpec {
  skin: string
  hair: string
  hairColor: string
  outfit: string
  outfitColor: string
  headwear: string
  headwearColor: string
  glasses: boolean
  bag: boolean
}

export interface ColorOption {
  id: string
  label: StringKey
  color: string
}

export interface StyleOption {
  id: string
  label: StringKey
}

// Skin tones span the range of Indian complexions, light to deep.
export const skinTones: ColorOption[] = [
  { id: 'skin-1', label: 'builder.skin1', color: '#f1d3b5' },
  { id: 'skin-2', label: 'builder.skin2', color: '#e6c09b' },
  { id: 'skin-3', label: 'builder.skin3', color: '#dbac84' },
  { id: 'skin-4', label: 'builder.skin4', color: '#cd9770' },
  { id: 'skin-5', label: 'builder.skin5', color: '#bd8560' },
  { id: 'skin-6', label: 'builder.skin6', color: '#a97351' },
  { id: 'skin-7', label: 'builder.skin7', color: '#946244' },
  { id: 'skin-8', label: 'builder.skin8', color: '#7f5238' },
  { id: 'skin-9', label: 'builder.skin9', color: '#6a432e' },
  { id: 'skin-10', label: 'builder.skin10', color: '#553424' },
]

export const hairStyles: StyleOption[] = [
  { id: 'short', label: 'hair.short' },
  { id: 'side-part', label: 'hair.sidePart' },
  { id: 'curly', label: 'hair.curly' },
  { id: 'bob', label: 'hair.bob' },
  { id: 'ponytail', label: 'hair.ponytail' },
  { id: 'plait', label: 'hair.plait' },
  { id: 'two-plaits', label: 'hair.twoPlaits' },
  { id: 'bun', label: 'hair.bun' },
]

export const hairColors: ColorOption[] = [
  { id: 'black', label: 'color.black', color: '#1f1a17' },
  { id: 'soft-black', label: 'color.softBlack', color: '#2e2622' },
  { id: 'dark-brown', label: 'color.darkBrown', color: '#3f2d22' },
  { id: 'brown', label: 'color.brown', color: '#5c3f2c' },
  { id: 'henna', label: 'color.henna', color: '#7a3c22' },
  { id: 'light-brown', label: 'color.lightBrown', color: '#7d5a3e' },
]

export const outfits: StyleOption[] = [
  { id: 'uniform', label: 'outfit.uniform' },
  { id: 'pinafore', label: 'outfit.pinafore' },
  { id: 'kurta', label: 'outfit.kurta' },
  { id: 'salwar', label: 'outfit.salwar' },
  { id: 'casual', label: 'outfit.casual' },
]

/** Colour of the kurta, kameez or T-shirt. School uniforms keep their own colours. */
export const outfitColors: ColorOption[] = [
  { id: 'marigold', label: 'color.marigold', color: '#d48f32' },
  { id: 'peacock', label: 'color.peacock', color: '#2f6f73' },
  { id: 'maroon', label: 'color.maroon', color: '#8a3d3d' },
  { id: 'leaf', label: 'color.leaf', color: '#5f7a4a' },
  { id: 'indigo', label: 'color.indigo', color: '#404d8c' },
  { id: 'rose', label: 'color.rose', color: '#c27180' },
]

export const headwears: StyleOption[] = [
  { id: 'none', label: 'headwear.none' },
  { id: 'patka', label: 'headwear.patka' },
  { id: 'hijab', label: 'headwear.hijab' },
  { id: 'dupatta', label: 'headwear.dupatta' },
]

export const headwearColors: ColorOption[] = [
  { id: 'navy', label: 'color.navy', color: '#2c3a63' },
  { id: 'saffron', label: 'color.saffron', color: '#d8892c' },
  { id: 'cream', label: 'color.cream', color: '#ebe3d3' },
  { id: 'black', label: 'color.black', color: '#26221f' },
  { id: 'maroon', label: 'color.maroon', color: '#7d3036' },
  { id: 'teal', label: 'color.teal', color: '#2f6f73' },
]

export const defaultSpec: CharacterSpec = {
  skin: 'skin-5',
  hair: 'short',
  hairColor: 'black',
  outfit: 'uniform',
  outfitColor: 'marigold',
  headwear: 'none',
  headwearColor: 'navy',
  glasses: false,
  bag: true,
}

const pick = <T>(list: T[], random: () => number): T => list[Math.floor(random() * list.length)] as T

/** "Surprise me": a random character. `random` is injectable so tests are repeatable. */
export function randomSpec(random: () => number = Math.random): CharacterSpec {
  return {
    skin: pick(skinTones, random).id,
    hair: pick(hairStyles, random).id,
    hairColor: pick(hairColors, random).id,
    outfit: pick(outfits, random).id,
    outfitColor: pick(outfitColors, random).id,
    headwear: pick(headwears, random).id,
    headwearColor: pick(headwearColors, random).id,
    glasses: random() < 0.25,
    bag: random() < 0.5,
  }
}

/** Fixes a saved spec: unknown or missing values fall back to the defaults. */
export function normalizeSpec(raw: unknown): CharacterSpec {
  const s = (typeof raw === 'object' && raw !== null ? raw : {}) as Partial<Record<keyof CharacterSpec, unknown>>
  const oneOf = (value: unknown, list: { id: string }[], fallback: string) =>
    typeof value === 'string' && list.some((o) => o.id === value) ? value : fallback
  return {
    skin: oneOf(s.skin, skinTones, defaultSpec.skin),
    hair: oneOf(s.hair, hairStyles, defaultSpec.hair),
    hairColor: oneOf(s.hairColor, hairColors, defaultSpec.hairColor),
    outfit: oneOf(s.outfit, outfits, defaultSpec.outfit),
    outfitColor: oneOf(s.outfitColor, outfitColors, defaultSpec.outfitColor),
    headwear: oneOf(s.headwear, headwears, defaultSpec.headwear),
    headwearColor: oneOf(s.headwearColor, headwearColors, defaultSpec.headwearColor),
    glasses: typeof s.glasses === 'boolean' ? s.glasses : defaultSpec.glasses,
    bag: typeof s.bag === 'boolean' ? s.bag : defaultSpec.bag,
  }
}

/** Looks up an option's colour by id (falls back to the first option). */
export function colorOf(list: ColorOption[], id: string): string {
  return (list.find((o) => o.id === id) ?? list[0])?.color ?? '#000000'
}
