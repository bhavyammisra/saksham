// Content validator: `npm run validate` (also runs in CI).
//
// Checks every content/scenes/*.json file against the contract in content/types.ts,
// and checks that every t('key') used in src/ exists in content/strings.en.json.
// Each check returns a list of human-readable problems; an empty list means valid.
//
// Runs directly with Node 24 (which strips TypeScript types), so this file only
// uses type annotations, nothing that needs compiling.

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { SceneDef, SortGame, StoryNode } from '../content/types.ts'
import { overlayProblems, textPaths, type Overlay } from '../src/lib/localize.ts'
import { CONTENT_OVERLAYS } from '../src/lib/overlays.ts'

const TONES = ['normal', 'gentle']
const MOODS = ['neutral', 'happy', 'worried', 'surprised', 'sad']
const HOTSPOT_KINDS = ['npc', 'object', 'exit']
const CHOICE_KINDS = ['good', 'weak']
const ENDS = ['good', 'retry']
const SURFACES = ['paving', 'earth', 'floor']
const TIMES = ['morning', 'day', 'evening', 'clock']
const AMBIENT_KINDS = ['dog', 'cat', 'pigeons', 'cow', 'passerby', 'cloth', 'plant', 'diya']
const MAX_AMBIENT = 6 // performance (D-030, D-053)
const CARD_FIELDS = ['id', 'title', 'kid', 'teen', 'ifItHappens', 'law', 'source'] as const

// ---------------------------------------------------------------- helpers

// Dialogue stays short and spoken (BUILD_PLAN P6 voice pass, docs/VOICES.md, D-052).
const MAX_LINE_WORDS = 18
const MAX_CHOICE_WORDS = 22
const wordCount = (text: string) => text.trim().split(/\s+/).length

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isText(value: unknown): value is string {
  return typeof value === 'string' && value.trim() !== ''
}

function isNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function isStringList(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(isText)
}

// ---------------------------------------------------------------- scenes

/** Returns every problem found in one scene. Empty list = valid. */
export function validateScene(raw: unknown): string[] {
  const errors: string[] = []
  const fail = (message: string) => errors.push(message)

  if (!isObject(raw)) return ['scene is not a JSON object']
  // From here on we check each field before trusting it.
  const scene = raw as Partial<SceneDef> & Record<string, unknown>

  for (const field of ['id', 'title', 'right', 'tagline', 'startNode'] as const) {
    if (!isText(scene[field])) fail(`"${field}" must be non-empty text`)
  }
  if (!TONES.includes(scene.tone as string)) fail(`"tone" must be one of ${TONES.join(', ')}`)
  if (!isNumber(scene.width) || scene.width <= 0) fail('"width" must be a positive number')

  // Layers
  if (!Array.isArray(scene.layers) || scene.layers.length === 0) {
    fail('"layers" must be a non-empty list')
  } else {
    scene.layers.forEach((layer, i) => {
      if (!isText(layer?.id) || !isText(layer?.art)) fail(`layers[${i}] needs "id" and "art"`)
      if (!isNumber(layer?.speed) || layer.speed < 0) fail(`layers[${i}].speed must be 0 or more`)
    })
  }

  // Sound and light (D-051, D-053)
  if (scene.surface !== undefined && !SURFACES.includes(scene.surface)) fail(`"surface" must be one of ${SURFACES.join(', ')}`)
  if (scene.time !== undefined && !TIMES.includes(scene.time)) fail(`"time" must be one of ${TIMES.join(', ')}`)

  // Ambient life (D-053): a few small things, each inside the scene
  if (scene.ambient !== undefined) {
    if (!Array.isArray(scene.ambient)) fail('"ambient" must be a list')
    else {
      if (scene.ambient.length > MAX_AMBIENT) fail(`"ambient" has ${scene.ambient.length} pieces (at most ${MAX_AMBIENT})`)
      const seen = new Set<string>()
      scene.ambient.forEach((a, i) => {
        const where = `ambient[${i}]`
        if (!isObject(a) || !isText(a.id)) return fail(`${where} needs an "id"`)
        if (seen.has(a.id)) fail(`ambient "${a.id}" is duplicated`)
        seen.add(a.id)
        if (!AMBIENT_KINDS.includes(a.kind)) fail(`ambient "${a.id}" has unknown kind "${String(a.kind)}"`)
        const end = (a.x ?? 0) + (a.roam ?? 0)
        if (!isNumber(a.x) || !isNumber(scene.width) || a.x < 0 || end > scene.width) fail(`ambient "${a.id}" must stay inside the scene`)
        if (a.depth !== undefined && (!isNumber(a.depth) || a.depth < 0 || a.depth > 1)) fail(`ambient "${a.id}".depth must be from 0 to 1`)
        if (a.roam !== undefined && (!isNumber(a.roam) || a.roam < 0)) fail(`ambient "${a.id}".roam must be 0 or more`)
      })
    }
  }

  // Walking area
  const walk = scene.walkable
  const walkOk = isObject(walk) && isNumber(walk.minX) && isNumber(walk.maxX) && walk.minX < walk.maxX
  if (!walkOk) {
    fail('"walkable" needs minX < maxX')
  } else if (isNumber(scene.width) && (walk.minX < 0 || walk.maxX > scene.width)) {
    fail('"walkable" must stay inside the scene width')
  }
  const insideWalk = (x: unknown) => walkOk && isNumber(x) && x >= walk.minX && x <= walk.maxX

  if (!isObject(scene.spawn) || !insideWalk(scene.spawn.x)) fail('"spawn.x" must be inside "walkable"')
  ;(scene.blockers ?? []).forEach((b, i) => {
    if (!isNumber(b?.x1) || !isNumber(b?.x2) || b.x1 >= b.x2) fail(`blockers[${i}] needs x1 < x2`)
  })

  // Story nodes
  const nodes: Record<string, StoryNode> = isObject(scene.nodes) ? (scene.nodes as Record<string, StoryNode>) : {}
  if (!isObject(scene.nodes) || Object.keys(nodes).length === 0) fail('"nodes" must be a non-empty object')
  const nodeExists = (id: unknown) => typeof id === 'string' && id in nodes

  if (isText(scene.startNode) && !nodeExists(scene.startNode)) {
    fail(`"startNode" points to missing node "${scene.startNode}"`)
  }
  if (scene.intro !== undefined && !nodeExists(scene.intro)) fail(`"intro" points to missing node "${String(scene.intro)}"`)

  const flagsSet = new Set<string>()
  // Flags the host sets from saved progress count as set (they are used by showIf/hideIf and art).
  if (scene.hostFlags !== undefined) {
    if (!isStringList(scene.hostFlags)) fail('"hostFlags" must be a list of flags')
    else scene.hostFlags.forEach((flag) => flagsSet.add(flag))
  }
  for (const [key, node] of Object.entries(nodes)) {
    const where = `node "${key}"`
    if (!isObject(node)) {
      fail(`${where} is not an object`)
      continue
    }
    if (node.id !== key) fail(`${where} has id "${String(node.id)}" (must match its key)`)
    if (!isText(node.speaker)) fail(`${where} needs a "speaker"`)
    if (!isText(node.text)) fail(`${where} needs "text"`)
    else if (wordCount(node.text) > MAX_LINE_WORDS) fail(`${where} has ${wordCount(node.text)} words (at most ${MAX_LINE_WORDS}; split it, docs/VOICES.md)`)
    if (node.mood !== undefined && !MOODS.includes(node.mood)) fail(`${where} has unknown mood "${node.mood}"`)
    if (node.end !== undefined && !ENDS.includes(node.end)) fail(`${where} has unknown end "${node.end}"`)
    if (node.set !== undefined) {
      if (!isStringList(node.set)) fail(`${where}.set must be a list of flags`)
      else node.set.forEach((flag) => flagsSet.add(flag))
    }
    if (node.next !== undefined && !nodeExists(node.next)) {
      fail(`${where}.next points to missing node "${node.next}"`)
    }
    if (node.choices !== undefined) {
      if (!Array.isArray(node.choices) || node.choices.length === 0) {
        fail(`${where}.choices must be a non-empty list`)
      } else {
        node.choices.forEach((choice, i) => {
          if (!isText(choice?.label)) fail(`${where}.choices[${i}] needs a "label"`)
          else if (wordCount(choice.label) > MAX_CHOICE_WORDS) fail(`${where}.choices[${i}] has ${wordCount(choice.label)} words (at most ${MAX_CHOICE_WORDS})`)
          if (!nodeExists(choice?.to)) fail(`${where}.choices[${i}] points to missing node "${String(choice?.to)}"`)
          if (choice?.kind !== undefined && !CHOICE_KINDS.includes(choice.kind)) {
            fail(`${where}.choices[${i}] has unknown kind "${choice.kind}"`)
          }
        })
      }
    }
    const ways = [node.next, node.choices, node.end].filter((w) => w !== undefined).length
    if (ways === 0) fail(`${where} is a dead end (needs "next", "choices" or "end")`)
    if (ways > 1) fail(`${where} must have only one of "next", "choices" or "end"`)
  }

  // A good ending must exist and be reachable from the start.
  const goodEnds = Object.values(nodes).filter((n) => isObject(n) && n.end === 'good')
  if (goodEnds.length === 0) fail('no node has end: "good"')
  else if (nodeExists(scene.startNode) && !canReachGoodEnd(nodes, scene.startNode as string)) {
    fail('no good ending can be reached from "startNode"')
  }

  // Hotspots
  if (!Array.isArray(scene.hotspots)) {
    fail('"hotspots" must be a list')
  } else {
    const ids = new Set<string>()
    scene.hotspots.forEach((h, i) => {
      const where = `hotspot "${h?.id ?? i}"`
      if (!isText(h?.id)) fail(`hotspots[${i}] needs an "id"`)
      else if (ids.has(h.id)) fail(`${where} is duplicated`)
      else ids.add(h.id)
      if (!isText(h?.label)) fail(`${where} needs a "label"`)
      if (!HOTSPOT_KINDS.includes(h?.kind)) fail(`${where} has unknown kind "${String(h?.kind)}"`)
      if (!insideWalk(h?.x)) fail(`${where}.x must be inside "walkable"`)
      if (h?.kind === 'npc' && !isText(h.npc)) fail(`${where} is an npc and needs "npc"`)
      if (h?.kind !== 'exit' && h?.node === undefined) fail(`${where} needs a "node" to open`)
      if (h?.node !== undefined && !nodeExists(h.node)) fail(`${where}.node points to missing node "${h.node}"`)
      if (h?.lockedNode !== undefined && !nodeExists(h.lockedNode)) fail(`${where}.lockedNode points to missing node "${h.lockedNode}"`)
      if (h?.lockedNode !== undefined && h.kind !== 'exit') fail(`${where} has a lockedNode but is not an exit`)
      if (h?.to !== undefined && !isText(h.to)) fail(`${where}.to must be non-empty text`)
      for (const list of ['showIf', 'hideIf'] as const) {
        const flags = h?.[list]
        if (flags === undefined) continue
        if (!isStringList(flags)) fail(`${where}.${list} must be a list of flags`)
        else flags.forEach((f) => !flagsSet.has(f) && fail(`${where}.${list} uses flag "${f}" that no node sets`))
      }
    })
  }

  // Objectives
  if (!Array.isArray(scene.objectives)) {
    fail('"objectives" must be a list')
  } else {
    const ids = new Set<string>()
    scene.objectives.forEach((o, i) => {
      const where = `objective "${o?.id ?? i}"`
      if (!isText(o?.id)) fail(`objectives[${i}] needs an "id"`)
      else if (ids.has(o.id)) fail(`${where} is duplicated`)
      else ids.add(o.id)
      if (!isText(o?.text)) fail(`${where} needs "text"`)
      if (!isStringList(o?.requires) || o.requires.length === 0) fail(`${where}.requires must list flags`)
      else o.requires.forEach((f) => !flagsSet.has(f) && fail(`${where} requires flag "${f}" that no node sets`))
    })
  }

  if (scene.hub !== undefined && typeof scene.hub !== 'boolean') fail('"hub" must be true or false')
  const isHub = scene.hub === true

  // Card (every scene except a hub)
  if (isHub) {
    if (scene.card !== undefined || scene.games !== undefined) fail('a hub has no "card" or "games"')
  } else if (!isObject(scene.card)) fail('"card" is missing')
  else {
    for (const field of CARD_FIELDS) if (!isText(scene.card[field])) fail(`card.${field} must be non-empty text`)
    validateReview(scene.card.review).forEach((p) => fail(`card.review ${p}`))
  }

  // Games (every scene except a hub)
  if (isHub) {
    // nothing to check
  } else if (!Array.isArray(scene.games) || scene.games.length === 0) {
    fail('"games" must list at least one game')
  } else {
    if (!scene.games.some((g) => g?.kind === 'quiz')) fail('"games" must include a quiz')
    scene.games.forEach((game, gi) => {
      if (game?.kind === 'sort') return validateSort(game, fail)
      if (game?.kind !== 'quiz') return fail(`games[${gi}] has unknown kind "${String((game as { kind?: unknown } | undefined)?.kind)}"`)
      if (!isText(game.id)) fail(`games[${gi}] needs an "id"`)
      if (!Array.isArray(game.questions) || game.questions.length === 0) {
        return fail(`quiz "${game.id}" needs questions`)
      }
      const ids = new Set<string>()
      game.questions.forEach((q, qi) => {
        const where = `quiz "${game.id}" question "${q?.id ?? qi}"`
        if (!isText(q?.id)) fail(`quiz "${game.id}" questions[${qi}] needs an "id"`)
        else if (!ANSWER_ID.test(q.id)) fail(`${where} id must be lowercase letters, digits and dashes (the class server stores it)`)
        else if (ids.has(q.id)) fail(`${where} is duplicated`)
        else ids.add(q.id)
        if (!isText(q?.text)) fail(`${where} needs "text"`)
        if (!isText(q?.explanation)) fail(`${where} needs an "explanation"`)
        if (!isStringList(q?.options) || q.options.length < 2) fail(`${where} needs at least 2 options`)
        else if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer >= q.options.length) {
          fail(`${where}.answer must be an index into options`)
        }
        if (q?.band !== undefined && q.band !== 'teen') fail(`${where}.band can only be "teen"`)
      })
      // Every band must be left with at least one question.
      if (game.questions.every((q) => q?.band === 'teen')) fail(`quiz "${game.id}" has no questions for young players`)
    })
  }

  return errors
}

// Quiz question and sort card ids are sent to the class server, whose quiz_attempts table only takes these (D-043).
const ANSWER_ID = /^[a-z0-9-]{1,60}$/

/** A sort game: two boxes, at least 3 items, each item going into one of the boxes, and both boxes used. */
function validateSort(game: SortGame, fail: (message: string) => void) {
  const where = `sort "${String(game.id)}"`
  if (!isText(game.id)) fail('a sort game needs an "id"')
  if (!isText(game.prompt)) fail(`${where} needs a "prompt"`)
  if (!Array.isArray(game.bins) || game.bins.length !== 2 || !game.bins.every((b) => isText(b?.id) && isText(b?.label))) {
    return fail(`${where} needs exactly 2 "bins", each with an "id" and a "label"`)
  }
  if (game.bins[0].id === game.bins[1].id) fail(`${where} has two bins with the same id`)
  if (!Array.isArray(game.items) || game.items.length < 3) return fail(`${where} needs at least 3 items`)
  const bins = new Set(game.bins.map((b) => b.id))
  const ids = new Set<string>()
  game.items.forEach((item, i) => {
    const at = `${where} item "${item?.id ?? i}"`
    if (!isText(item?.id)) fail(`${where} items[${i}] needs an "id"`)
    else if (!ANSWER_ID.test(item.id)) fail(`${at} id must be lowercase letters, digits and dashes (the class server stores it)`)
    else if (ids.has(item.id)) fail(`${at} is duplicated`)
    else ids.add(item.id)
    if (!isText(item?.text)) fail(`${at} needs "text"`)
    if (!isText(item?.explanation)) fail(`${at} needs an "explanation"`)
    if (!bins.has(item?.bin)) fail(`${at}.bin must be one of the bins`)
  })
  for (const bin of bins) if (!game.items.some((item) => item?.bin === bin)) fail(`${where} has no items for bin "${bin}"`)
}

/** Follows next/choices from the start node and reports whether an end: "good" node is reachable. */
function canReachGoodEnd(nodes: Record<string, StoryNode>, start: string): boolean {
  const seen = new Set<string>()
  const queue = [start]
  while (queue.length > 0) {
    const id = queue.shift() as string
    if (seen.has(id)) continue
    seen.add(id)
    const node = nodes[id]
    if (!node) continue
    if (node.end === 'good') return true
    if (node.next) queue.push(node.next)
    for (const choice of node.choices ?? []) queue.push(choice.to)
  }
  return false
}

// ---------------------------------------------------------------- buildings

/** The town's buildings: unique ids, a name and a right each, and a playable first building. */
export function validateBuildings(raw: unknown): string[] {
  if (!Array.isArray(raw) || raw.length === 0) return ['buildings must be a non-empty list']
  const errors: string[] = []
  const ids = new Set<string>()
  raw.forEach((b, i) => {
    if (!isObject(b) || !isText(b.id)) return void errors.push(`buildings[${i}] needs an "id"`)
    if (ids.has(b.id)) errors.push(`building "${b.id}" is duplicated`)
    ids.add(b.id)
    if (!isText(b.name) || !isText(b.right)) errors.push(`building "${b.id}" needs a "name" and a "right"`)
    if (b.teaser !== undefined && typeof b.teaser !== 'boolean') errors.push(`building "${b.id}".teaser must be true or false`)
  })
  if (isObject(raw[0]) && raw[0].teaser === true) errors.push('the first building must be playable (it is always unlocked)')
  return errors
}

/** A hub's doors must lead somewhere real: a building in buildings.json, or "help". */
export function validateHubLinks(raw: unknown, buildingIds: Set<string>): string[] {
  if (!isObject(raw) || raw.hub !== true || !Array.isArray(raw.hotspots)) return []
  return (raw.hotspots as Partial<SceneDef['hotspots'][number]>[])
    .filter((h) => h?.kind === 'exit')
    .filter((h) => h.to !== 'help' && !(typeof h.to === 'string' && buildingIds.has(h.to)))
    .map((h) => `hub door "${String(h.id)}" leads to "${String(h.to)}", which is not a building or "help"`)
}

// ---------------------------------------------------------------- people

/** Every hotspot npc and every node speaker must be a known person ("player" is the child). */
export function validatePeople(raw: unknown, npcIds: Set<string>): string[] {
  if (!isObject(raw)) return []
  const errors: string[] = []
  const scene = raw as Partial<SceneDef>
  for (const h of Array.isArray(scene.hotspots) ? scene.hotspots : []) {
    if (h?.npc !== undefined && !npcIds.has(h.npc)) errors.push(`hotspot "${h.id}" uses unknown npc "${h.npc}"`)
  }
  for (const node of Object.values(isObject(scene.nodes) ? scene.nodes : {})) {
    if (isObject(node) && typeof node.speaker === 'string' && node.speaker !== 'player' && !npcIds.has(node.speaker)) {
      errors.push(`node "${node.id}" has unknown speaker "${node.speaker}"`)
    }
  }
  return errors
}

// ---------------------------------------------------------------- UI strings

/** Finds t('key') calls in source text. */
export function findStringKeys(source: string): string[] {
  return [...source.matchAll(/\bt\(\s*['"]([\w.-]+)['"]/g)].map((m) => m[1] as string)
}

/** Every key used in code must exist in the English strings, and every value must be non-empty text. */
export function validateStrings(strings: unknown, usedKeys: Iterable<string>): string[] {
  if (!isObject(strings)) return ['strings file is not a JSON object']
  const errors: string[] = []
  for (const [key, value] of Object.entries(strings)) {
    if (!isText(value)) errors.push(`string "${key}" must be non-empty text`)
  }
  for (const key of new Set(usedKeys)) {
    if (!(key in strings)) errors.push(`t('${key}') is used in code but missing from the strings file`)
  }
  return errors
}

// ---------------------------------------------------------------- Help Centre

/** Official sources only: Government of India sites end in .gov.in or .nic.in. */
export function isOfficialSource(url: string): boolean {
  try {
    const { protocol, hostname } = new URL(url)
    return protocol === 'https:' && (hostname.endsWith('.gov.in') || hostname.endsWith('.nic.in') || hostname === 'gov.in')
  } catch {
    return false
  }
}

/**
 * A fact-check record (legal and safety content). "verified" needs who checked it and when,
 * so a card can never be marked checked by accident.
 */
export function validateReview(raw: unknown): string[] {
  if (!isObject(raw)) return ['is missing (add { status: "unverified", ... } for the owner to fact-check)']
  const errors: string[] = []
  if (raw.status !== 'unverified' && raw.status !== 'verified') errors.push('status must be "unverified" or "verified"')
  if (!isText(raw.note)) errors.push('needs a "note"')
  if (raw.checks !== undefined && !isStringList(raw.checks)) errors.push('checks must be a list of text')
  if (raw.status === 'verified' && (!isText(raw.checkedBy) || !isText(raw.checkedOn))) {
    errors.push('is "verified" but has no "checkedBy" and "checkedOn"')
  }
  return errors
}

/** Every helpline needs a dialable number and at least one official source page. */
export function validateHelp(raw: unknown): string[] {
  if (!isObject(raw)) return ['help content is not a JSON object']
  const errors: string[] = []
  const help = raw as Record<string, unknown>
  for (const field of ['title', 'intro', 'urgent', 'helplinesTitle', 'disclaimer']) {
    if (!isText(help[field])) errors.push(`"${field}" must be non-empty text`)
  }
  if (!Array.isArray(help.helplines) || help.helplines.length === 0) {
    errors.push('"helplines" must list at least one helpline')
  } else {
    help.helplines.forEach((line, i) => {
      const where = `helpline "${isObject(line) ? String(line.id) : i}"`
      if (!isObject(line)) return void errors.push(`${where} is not an object`)
      for (const field of ['id', 'name', 'when', 'hours']) {
        if (!isText(line[field])) errors.push(`${where} needs "${field}"`)
      }
      if (typeof line.number !== 'string' || !/^\d{3,12}$/.test(line.number)) {
        errors.push(`${where}.number must be digits only`)
      }
      const sources = line.sources
      if (!Array.isArray(sources) || sources.length === 0) {
        errors.push(`${where} needs at least one source`)
      } else {
        sources.forEach((s, si) => {
          if (!isObject(s) || !isText(s.title)) errors.push(`${where}.sources[${si}] needs a "title"`)
          if (!isObject(s) || typeof s.url !== 'string' || !isOfficialSource(s.url)) {
            errors.push(`${where}.sources[${si}] must be an https .gov.in or .nic.in page`)
          }
        })
      }
    })
  }
  validateReview(help.review).forEach((p) => errors.push(`review ${p}`))
  for (const section of ['trustedAdult', 'rights'] as const) {
    const value = help[section]
    const list = section === 'trustedAdult' ? 'steps' : 'items'
    if (!isObject(value) || !isText(value.title) || !isStringList(value[list]) || value[list].length === 0) {
      errors.push(`"${section}" needs a "title" and a non-empty "${list}" list`)
    }
  }
  return errors
}

// ---------------------------------------------------------------- command line

/** Hindi UI strings (D-054): only keys English has, never empty, with the same {placeholders}. */
export function validateHindiStrings(english: Record<string, string>, hindi: Record<string, string>): string[] {
  const holes = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(', ')
  const errors: string[] = []
  for (const [key, words] of Object.entries(hindi)) {
    if (!(key in english)) errors.push(`"${key}" is not an English string`)
    else if (!words.trim()) errors.push(`"${key}" is empty`)
    else if (holes(english[key] ?? '') !== holes(words)) errors.push(`"${key}" must keep the placeholders ${holes(english[key] ?? '') || '(none)'}`)
  }
  return errors
}

function listFiles(dir: string, test: (name: string) => boolean): string[] {
  let names: string[]
  try {
    names = readdirSync(dir)
  } catch {
    return [] // folder does not exist yet
  }
  return names.flatMap((name) => {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) return listFiles(path, test)
    return test(name) ? [path] : []
  })
}

function main(): void {
  const root = fileURLToPath(new URL('..', import.meta.url))
  const problems: string[] = []
  const readJson = (path: string): unknown => JSON.parse(readFileSync(path, 'utf8'))

  const npcIds = new Set(Object.keys(readJson(join(root, 'content', 'npcs.json')) as object))
  const buildingsRaw = readJson(join(root, 'content', 'buildings.json'))
  const buildingIds = new Set(Array.isArray(buildingsRaw) ? buildingsRaw.map((b: { id?: unknown }) => String(b?.id)) : [])
  const sceneFiles = listFiles(join(root, 'content', 'scenes'), (n) => n.endsWith('.json'))
  for (const file of sceneFiles) {
    let scene: unknown
    try {
      scene = readJson(file)
    } catch (error) {
      problems.push(`${relative(root, file)}: not valid JSON (${(error as Error).message})`)
      continue
    }
    for (const p of [...validateScene(scene), ...validatePeople(scene, npcIds), ...validateHubLinks(scene, buildingIds)]) {
      problems.push(`${relative(root, file)}: ${p}`)
    }
  }

  const sourceFiles = listFiles(join(root, 'src'), (n) => /\.tsx?$/.test(n) && !n.includes('.test.'))
  const usedKeys = sourceFiles.flatMap((file) => findStringKeys(readFileSync(file, 'utf8')))
  for (const p of validateStrings(readJson(join(root, 'content', 'strings.en.json')), usedKeys)) {
    problems.push(`content/strings.en.json: ${p}`)
  }

  for (const p of validateBuildings(readJson(join(root, 'content', 'buildings.json')))) {
    problems.push(`content/buildings.json: ${p}`)
  }

  for (const p of validateHelp(readJson(join(root, 'content', 'help.json')))) {
    problems.push(`content/help.json: ${p}`)
  }

  // Hindi (D-054): every line translates real English text and keeps its placeholders.
  let missingHindi = 0
  for (const { english, hindi, also } of CONTENT_OVERLAYS) {
    const source = readJson(join(root, english))
    const overlay = (existsSync(join(root, hindi)) ? readJson(join(root, hindi)) : {}) as Overlay
    for (const p of overlayProblems(source, overlay, also)) problems.push(`${hindi}: ${p}`)
    missingHindi += [...textPaths(source, also).keys()].filter((path) => !overlay[path]).length
  }
  const enStrings = readJson(join(root, 'content', 'strings.en.json')) as Record<string, string>
  const hiStrings = readJson(join(root, 'content', 'strings.hi.json')) as Record<string, string>
  for (const p of validateHindiStrings(enStrings, hiStrings)) problems.push(`content/strings.hi.json: ${p}`)
  missingHindi += Object.keys(enStrings).filter((key) => !hiStrings[key]).length

  if (problems.length > 0) {
    console.error(`Content problems (${problems.length}):\n- ${problems.join('\n- ')}`)
    process.exit(1)
  }
  console.log(`Content OK: ${sceneFiles.length} scene(s), ${new Set(usedKeys).size} UI string key(s) checked.`)
  // Missing Hindi shows the English instead, so it is a warning, not an error. List it: node scripts/hindi-todo.ts
  if (missingHindi > 0) console.warn(`Hindi: ${missingHindi} English text(s) have no Hindi yet (they show in English).`)
  else console.log('Hindi: every text has a translation.')
}

// Run only when called as a script, not when imported by tests.
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main()
