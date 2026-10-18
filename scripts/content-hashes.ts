// Prints every reviewable content item with its SHA-256 hash (FR-15, D-049).
//   npm run content:hashes
// The same items and hashes are what /reviewer sends for review ("Send changed items for review"),
// signed in as a reviewer: this script never touches the class server, so it needs no keys.

import { readdirSync, readFileSync } from 'node:fs'
import type { BuildingInfo, HelpContent, SceneDef } from '../content/types.ts'
import { reviewItems, sha256 } from '../src/lib/review.ts'

const read = <T>(path: string) => JSON.parse(readFileSync(path, 'utf8')) as T
const scenes = new Map(readdirSync('content/scenes').map((f) => [f.replace('.json', ''), read<SceneDef>(`content/scenes/${f}`)]))
const buildings = read<BuildingInfo[]>('content/buildings.json')
  .filter((b) => !b.teaser)
  .map((b) => ({ id: b.id, name: b.name, card: scenes.get(b.id)?.card, games: scenes.get(b.id)?.games }))

for (const item of reviewItems(buildings, read<HelpContent>('content/help.json'))) {
  console.log(`${await sha256(item.text)}  ${item.id}`)
}
