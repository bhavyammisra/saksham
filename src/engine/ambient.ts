// Living world (D-053): the time of day and the ambient life in a scene. Pure, so it is unit-tested.

import type { Ambient, AmbientKind, TimeOfDay } from '@content/types'

export const MAX_AMBIENT = 6

/** The light a scene is drawn in. "clock" (the town) follows the device: evening from 5 pm to 5 am. */
export function lightFor(time: TimeOfDay | undefined, hour: number): 'morning' | 'day' | 'evening' {
  if (time === 'clock') return hour >= 17 || hour < 5 ? 'evening' : hour < 11 ? 'morning' : 'day'
  return time ?? 'day'
}

/** Which ambient pieces are out: diyas only in the evening, and never more than the cap. */
export function ambientShown(ambient: Ambient[] | undefined, evening: boolean): Ambient[] {
  return (ambient ?? []).filter((a) => !a.evening || evening).slice(0, MAX_AMBIENT)
}

/** Each kind's size in design units (people are 400 tall, D-036). */
export const AMBIENT_SIZE: Record<AmbientKind, { w: number; h: number }> = {
  dog: { w: 150, h: 110 },
  cat: { w: 80, h: 80 },
  pigeons: { w: 150, h: 50 },
  cow: { w: 360, h: 250 },
  passerby: { w: 140, h: 420 }, // an adult, a little taller than the player
  cloth: { w: 320, h: 220 },
  plant: { w: 90, h: 150 },
  diya: { w: 40, h: 40 },
}

/** How long one stroll there and back takes: about 60 units a second, never faster than 6 s. */
export function roamSeconds(roam: number): number {
  return Math.max(6, (2 * roam) / 60)
}

/** The people who stroll past (kind "passerby"), by `look`. Adults in everyday clothes. */
export const PASSERBY_LOOKS = [
  { skin: 'skin-5', hair: 'short', hairColor: 'black', outfit: 'kurta', outfitColor: 'leaf', glasses: true },
  { skin: 'skin-3', hair: 'bun', hairColor: 'dark-brown', outfit: 'salwar', outfitColor: 'marigold', headwear: 'dupatta', headwearColor: 'cream' },
  { skin: 'skin-7', hair: 'short', hairColor: 'soft-black', outfit: 'kurta', outfitColor: 'peacock' },
]
