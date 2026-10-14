// Every user-facing string goes through t(). Never hard-code UI text in components.
//
// Strings live in content/strings.<lang>.json as a flat map: "area.thing": "Text".
// English is the source of truth: its keys define StringKey, so a typo in a key
// is a compile error. Hindi (Phase 6) will be layered over English, and any key
// it lacks falls back to the English text.
import en from '@content/strings.en.json'

export type StringKey = keyof typeof en
export type Lang = 'en'
type Dictionary = Record<string, string>

const dictionaries: Record<Lang, Dictionary> = { en }

let currentLang: Lang = 'en'

export function setLang(lang: Lang): void {
  currentLang = lang
}

export function getLang(): Lang {
  return currentLang
}

/**
 * Look up a UI string and fill in {placeholders}.
 *   t('profiles.playAs', { name: 'Asha' })
 * A missing key returns the key itself (and warns in development),
 * so a gap is visible on screen instead of crashing the app.
 */
export function t(key: StringKey, vars?: Record<string, string | number>): string {
  const text = dictionaries[currentLang][key] ?? dictionaries.en[key]
  if (text === undefined) {
    if (import.meta.env.DEV) console.warn(`[i18n] missing string: ${key}`)
    return key
  }
  return vars ? interpolate(text, vars) : text
}

// Replaces {name} with vars.name. Unknown placeholders are left as they are.
function interpolate(text: string, vars: Record<string, string | number>): string {
  return text.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in vars ? String(vars[name]) : match,
  )
}
