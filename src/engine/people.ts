import npcsJson from '@content/npcs.json'
import type { NpcDef } from '@content/types'
import { normalizeSpec, type CharacterSpec } from '@/character/spec'

const npcs = npcsJson as Record<string, NpcDef>

/** The person (or parrot) behind an npc or speaker id. "player" is handled by the caller. */
export function getNpc(id: string): NpcDef | null {
  return npcs[id] ?? null
}

/** An npc's character drawing, with defaults for anything not given. */
export function npcSpec(npc: NpcDef): CharacterSpec {
  return normalizeSpec(npc.look ?? {})
}
