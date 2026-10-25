// Prints every reviewable content item with its SHA-256 hash (FR-15, D-049), in English and then
// in Hindi (D-054).
//   npm run content:hashes
// The same items and hashes are what /reviewer sends for review ("Send changed items for review"),
// signed in as a reviewer: this script never touches the class server, so it needs no keys.

import { readdirSync, readFileSync } from 'node:fs'
import type { BuildingInfo, HelpContent, SceneDef } from '../content/types.ts'
import { localize, type Overlay } from '../src/lib/localize.ts'
import { reviewItems, sha256 } from '../src/lib/review.ts'

const read = <T>(path: string) => JSON.parse(readFileSync(path, 'utf8')) as T
const scenes = new Map(readdirSync('content/scenes').map((f) => [f.replace('.json', ''), read<SceneDef>(`content/scenes/${f}`)]))
const hindiScenes = new Map(readdirSync('content/hi/scenes').map((f) => [f.replace('.json', ''), read<Overlay>(`content/hi/scenes/${f}`)]))
const hindiBuildings = read<Overlay>('content/hi/buildings.json')
const help = read<HelpContent>('content/help.json')

for (const lang of ['en', 'hi'] as const) {
  const buildings = read<BuildingInfo[]>('content/buildings.json')
    .filter((b) => !b.teaser)
    .map((b) => {
      const scene = scenes.get(b.id)
      const shown = lang === 'en' || !scene ? scene : localize(scene, hindiScenes.get(b.id))
      const name = lang === 'en' ? b.name : hindiBuildings[`${b.id}.name`] || b.name
      return { id: b.id, name, card: shown?.card, games: shown?.games }
    })
  const words = lang === 'en' ? help : localize(help, read<Overlay>('content/hi/help.json'), ['intro'])
  for (const item of reviewItems(buildings, words, lang)) console.log(`${await sha256(item.text)}  ${item.id}`)
}
