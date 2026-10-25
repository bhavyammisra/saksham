// Hindi over English (BUILD_PLAN P6, D-054). A translation is a flat map from a "path" in the
// English content to the words that replace it, for example
//   "nodes.ravi-hello.text": "नमस्ते! ..."   or   "hotspots.ravi.label": "रवि से बात करो"
// Only text fields can be replaced. Ids, links, answers, the law, sources and helpline numbers
// always come from English, because their keys are not in TEXT_KEYS. Pure, so it is unit-tested.
// Plain relative imports, so scripts (Node) can use this file too.

/** Fields that hold words a person reads. Everything else is wiring and stays English. */
export const TEXT_KEYS = new Set([
  'title', 'right', 'tagline', 'label', 'text', 'kid', 'teen', 'ifItHappens', 'options', 'explanation', 'prompt',
  'name', 'urgent', 'helplinesTitle', 'when', 'hours', 'steps', 'items', 'disclaimer', 'goal', 'what',
])

/** Parts of the content that are never translated, whatever their fields are called. */
const NEVER = new Set(['review', 'sources', 'law', 'source', 'layers', 'ambient'])

export type Overlay = Record<string, string>

/** One step of a path: an array item with an id goes by its id (stable when items move), others by place. */
const step = (item: unknown, index: number) =>
  item && typeof item === 'object' && 'id' in item && typeof item.id === 'string' ? item.id : String(index)

/**
 * Every translatable text in `value`, by path. `also` adds field names that are text only in
 * this file (the Help Centre's `intro` is words; a scene's `intro` is a node id).
 */
export function textPaths(value: unknown, also: string[] = []): Map<string, string> {
  const keys = new Set([...TEXT_KEYS, ...also])
  const found = new Map<string, string>()
  const walk = (v: unknown, path: string, isText: boolean) => {
    if (typeof v === 'string') {
      if (isText) found.set(path, v)
    } else if (Array.isArray(v)) {
      v.forEach((item, i) => walk(item, path ? `${path}.${step(item, i)}` : step(item, i), isText))
    } else if (v && typeof v === 'object') {
      for (const [key, child] of Object.entries(v)) {
        if (NEVER.has(key)) continue
        walk(child, path ? `${path}.${key}` : key, keys.has(key))
      }
    }
  }
  walk(value, '', false)
  return found
}

/** A copy of `value` with every text the overlay has replaced. Paths that aren't text are ignored. */
export function localize<T>(value: T, overlay: Overlay | undefined, also: string[] = []): T {
  if (!overlay) return value
  const allowed = textPaths(value, also)
  const keys = new Set([...TEXT_KEYS, ...also])
  const copy = (v: unknown, path: string, isText: boolean): unknown => {
    if (typeof v === 'string') return isText && allowed.has(path) && overlay[path] ? overlay[path] : v
    if (Array.isArray(v)) return v.map((item, i) => copy(item, path ? `${path}.${step(item, i)}` : step(item, i), isText))
    if (v && typeof v === 'object') {
      return Object.fromEntries(
        Object.entries(v).map(([key, child]) => [key, NEVER.has(key) ? child : copy(child, path ? `${path}.${key}` : key, keys.has(key))]),
      )
    }
    return v
  }
  return copy(value, '', false) as T
}

/** Problems with an overlay: paths that are not English text, empty words, or {placeholders} that differ. */
export function overlayProblems(english: unknown, overlay: Overlay, also: string[] = []): string[] {
  const paths = textPaths(english, also)
  const problems: string[] = []
  for (const [path, words] of Object.entries(overlay)) {
    const source = paths.get(path)
    if (source === undefined) problems.push(`"${path}" is not English text that can be translated`)
    else if (!words.trim()) problems.push(`"${path}" is empty`)
    else if (placeholders(source) !== placeholders(words)) problems.push(`"${path}" must keep the placeholders ${placeholders(source) || '(none)'}`)
  }
  return problems
}

const placeholders = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(', ')
