// The player character is described by a small JSON object (CharacterSpec).
// It is saved with the profile and drawn by <Character>. Every option has a
// string id (saved) and a label key (shown, through t()).
//
// The same spec draws the people in the stories (content/npcs.json), so the drawing
// knows more options than the customiser offers. Players choose from the modern
// lists (hairFor, playerTops, bottoms, playerHeadwears): owner feedback, D-034.

import type { StringKey } from '@/lib/i18n'

export type Gender = 'boy' | 'girl'

export interface CharacterSpec {
  gender: Gender
  skin: string
  hair: string
  hairColor: string
  outfit: string
  outfitColor: string
  /** Jeans, trousers or joggers. Only drawn with the modern tops; older outfits bring their own. */
  bottom: string
  bottomColor: string
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

export const genders: { id: Gender; label: StringKey }[] = [
  { id: 'boy', label: 'gender.boy' },
  { id: 'girl', label: 'gender.girl' },
]

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

// Every hairstyle the drawing knows. Plaits are kept for the people in the stories.
export const hairStyles: StyleOption[] = [
  { id: 'short', label: 'hair.short' },
  { id: 'side-part', label: 'hair.sidePart' },
  { id: 'fade', label: 'hair.fade' },
  { id: 'buzz', label: 'hair.buzz' },
  { id: 'curly', label: 'hair.curly' },
  { id: 'long', label: 'hair.long' },
  { id: 'long-curly', label: 'hair.longCurly' },
  { id: 'bob', label: 'hair.bob' },
  { id: 'ponytail', label: 'hair.ponytail' },
  { id: 'bun', label: 'hair.bun' },
  { id: 'plait', label: 'hair.plait' },
  { id: 'two-plaits', label: 'hair.twoPlaits' },
]

const HAIR_FOR: Record<Gender, string[]> = {
  boy: ['short', 'side-part', 'fade', 'buzz', 'curly'],
  girl: ['long', 'ponytail', 'bob', 'long-curly', 'bun'],
}

/** The modern hairstyles offered in the customiser for a boy or a girl. */
export function hairFor(gender: Gender): StyleOption[] {
  return hairStyles.filter((h) => HAIR_FOR[gender].includes(h.id))
}

export const hairColors: ColorOption[] = [
  { id: 'black', label: 'color.black', color: '#1f1a17' },
  { id: 'soft-black', label: 'color.softBlack', color: '#2e2622' },
  { id: 'dark-brown', label: 'color.darkBrown', color: '#3f2d22' },
  { id: 'brown', label: 'color.brown', color: '#5c3f2c' },
  { id: 'henna', label: 'color.henna', color: '#7a3c22' },
  { id: 'light-brown', label: 'color.lightBrown', color: '#7d5a3e' },
]

// Every outfit the drawing knows. The first four are modern tops worn with a `bottom`;
// the rest (school uniforms, kurta, salwar kameez) dress the people in the stories.
export const outfits: StyleOption[] = [
  { id: 'tshirt', label: 'outfit.tshirt' },
  { id: 'shirt', label: 'outfit.shirt' },
  { id: 'hoodie', label: 'outfit.hoodie' },
  { id: 'jacket', label: 'outfit.jacket' },
  { id: 'uniform', label: 'outfit.uniform' },
  { id: 'pinafore', label: 'outfit.pinafore' },
  { id: 'kurta', label: 'outfit.kurta' },
  { id: 'salwar', label: 'outfit.salwar' },
  { id: 'casual', label: 'outfit.casual' },
]

/** The tops a player can choose. */
export const playerTops: StyleOption[] = outfits.slice(0, 4)
export const isModernTop = (outfit: string) => playerTops.some((o) => o.id === outfit)

export const bottoms: StyleOption[] = [
  { id: 'jeans', label: 'bottom.jeans' },
  { id: 'trousers', label: 'bottom.trousers' },
  { id: 'joggers', label: 'bottom.joggers' },
]

export const bottomColors: ColorOption[] = [
  { id: 'denim', label: 'color.denim', color: '#4a6488' },
  { id: 'dark-denim', label: 'color.darkDenim', color: '#2e3d57' },
  { id: 'charcoal', label: 'color.charcoal', color: '#3a3836' },
  { id: 'khaki', label: 'color.khaki', color: '#b59f7b' },
  { id: 'olive', label: 'color.olive', color: '#5d6146' },
  { id: 'stone', label: 'color.stone', color: '#d3c9b8' },
]

/** Colour of the top (and of the kurta or kameez worn by people in the stories). */
export const outfitColors: ColorOption[] = [
  { id: 'white', label: 'color.white', color: '#ece8e1' },
  { id: 'black', label: 'color.black', color: '#2b2826' },
  { id: 'navy', label: 'color.navy', color: '#2c3a5c' },
  { id: 'rust', label: 'color.rust', color: '#a4502f' },
  { id: 'sage', label: 'color.sage', color: '#8a9a7b' },
  { id: 'mustard', label: 'color.mustard', color: '#c99a3e' },
  { id: 'marigold', label: 'color.marigold', color: '#d48f32' },
  { id: 'peacock', label: 'color.peacock', color: '#2f6f73' },
  { id: 'maroon', label: 'color.maroon', color: '#8a3d3d' },
  { id: 'leaf', label: 'color.leaf', color: '#5f7a4a' },
  { id: 'indigo', label: 'color.indigo', color: '#404d8c' },
  { id: 'rose', label: 'color.rose', color: '#c27180' },
]

/** The top colours a player can choose: calm, modern colours. */
export const playerTopColors: ColorOption[] = outfitColors.slice(0, 6)

export const headwears: StyleOption[] = [
  { id: 'none', label: 'headwear.none' },
  { id: 'patka', label: 'headwear.patka' },
  { id: 'hijab', label: 'headwear.hijab' },
  { id: 'dupatta', label: 'headwear.dupatta' },
]

/** Head coverings a player can choose (the dupatta stays with the people in the stories). */
export const playerHeadwears: StyleOption[] = headwears.filter((h) => h.id !== 'dupatta')

export const headwearColors: ColorOption[] = [
  { id: 'navy', label: 'color.navy', color: '#2c3a63' },
  { id: 'saffron', label: 'color.saffron', color: '#d8892c' },
  { id: 'cream', label: 'color.cream', color: '#ebe3d3' },
  { id: 'black', label: 'color.black', color: '#26221f' },
  { id: 'maroon', label: 'color.maroon', color: '#7d3036' },
  { id: 'teal', label: 'color.teal', color: '#2f6f73' },
]

export const defaultSpec: CharacterSpec = {
  gender: 'boy',
  skin: 'skin-5',
  hair: 'short',
  hairColor: 'black',
  outfit: 'tshirt',
  outfitColor: 'navy',
  bottom: 'jeans',
  bottomColor: 'denim',
  headwear: 'none',
  headwearColor: 'navy',
  glasses: false,
  bag: false,
}

/** Switches between boy and girl. The hairstyle moves to the first one on the new list. */
export function withGender(spec: CharacterSpec, gender: Gender): CharacterSpec {
  if (spec.gender === gender) return spec
  return { ...spec, gender, hair: HAIR_FOR[gender][0]! }
}

const pick = <T>(list: T[], random: () => number): T => list[Math.floor(random() * list.length)] as T

/** "Surprise me": a random modern character. `random` is injectable so tests are repeatable. */
export function randomSpec(random: () => number = Math.random, gender?: Gender): CharacterSpec {
  const g = gender ?? pick(genders, random).id
  return {
    gender: g,
    skin: pick(skinTones, random).id,
    hair: pick(hairFor(g), random).id,
    hairColor: pick(hairColors, random).id,
    outfit: pick(playerTops, random).id,
    outfitColor: pick(playerTopColors, random).id,
    bottom: pick(bottoms, random).id,
    bottomColor: pick(bottomColors, random).id,
    headwear: 'none',
    headwearColor: pick(headwearColors, random).id,
    glasses: random() < 0.25,
    bag: random() < 0.3,
  }
}

/** Fixes a saved spec: unknown or missing values fall back to the defaults. */
export function normalizeSpec(raw: unknown): CharacterSpec {
  const s = (typeof raw === 'object' && raw !== null ? raw : {}) as Partial<Record<keyof CharacterSpec, unknown>>
  const oneOf = (value: unknown, list: { id: string }[], fallback: string) =>
    typeof value === 'string' && list.some((o) => o.id === value) ? value : fallback
  const hair = oneOf(s.hair, hairStyles, defaultSpec.hair)
  // Characters saved before D-034 have no gender: guess it from the hairstyle.
  const longHair = HAIR_FOR.girl.includes(hair) || hair === 'plait' || hair === 'two-plaits'
  const gender: Gender = s.gender === 'boy' || s.gender === 'girl' ? s.gender : longHair ? 'girl' : 'boy'
  return {
    gender,
    skin: oneOf(s.skin, skinTones, defaultSpec.skin),
    hair,
    hairColor: oneOf(s.hairColor, hairColors, defaultSpec.hairColor),
    outfit: oneOf(s.outfit, outfits, defaultSpec.outfit),
    outfitColor: oneOf(s.outfitColor, outfitColors, defaultSpec.outfitColor),
    bottom: oneOf(s.bottom, bottoms, defaultSpec.bottom),
    bottomColor: oneOf(s.bottomColor, bottomColors, defaultSpec.bottomColor),
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
