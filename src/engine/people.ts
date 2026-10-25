import npcsJson from '@content/npcs.json'
import hiNpcs from '@content/hi/npcs.json'
import type { NpcDef } from '@content/types'
import { normalizeSpec, type CharacterSpec } from '@/character/spec'
import { getLang } from '@/lib/i18n'

const npcs = npcsJson as Record<string, NpcDef>
const hindiNames = hiNpcs as Record<string, string> // "ravi.name": "रवि" (D-054)

/** The person (or parrot) behind an npc or speaker id. "player" is handled by the caller. */
export function getNpc(id: string): NpcDef | null {
  const npc = npcs[id]
  if (!npc) return null
  const name = getLang() === 'hi' ? hindiNames[`${id}.name`] : undefined
  return name ? { ...npc, name } : npc
}

/** An npc's character drawing, with defaults for anything not given. */
export function npcSpec(npc: NpcDef): CharacterSpec {
  return normalizeSpec(npc.look ?? {})
}
