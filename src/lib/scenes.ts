// The content, by building id. Like the art registry, this is the one place that lists content
// files; the engine itself never refers to a building by id.
// Every getter returns the content in the language on screen: Hindi is laid over the English by
// localize() (D-054), so ids, wiring, answers, the law and numbers always come from English.
// The app remounts when the language changes (App.tsx), so callers simply call these again.

import dhabaJson from '@content/scenes/dhaba.json'
import homeJson from '@content/scenes/home.json'
import panchayatJson from '@content/scenes/panchayat.json'
import schoolJson from '@content/scenes/school.json'
import townJson from '@content/scenes/town.json'
import buildingsJson from '@content/buildings.json'
import communityJson from '@content/community.json'
import helpJson from '@content/help.json'
import hiBuildings from '@content/hi/buildings.json'
import hiCommunity from '@content/hi/community.json'
import hiHelp from '@content/hi/help.json'
import hiDhaba from '@content/hi/scenes/dhaba.json'
import hiHome from '@content/hi/scenes/home.json'
import hiPanchayat from '@content/hi/scenes/panchayat.json'
import hiSchool from '@content/hi/scenes/school.json'
import hiTown from '@content/hi/scenes/town.json'
import type { BuildingInfo, Card, CommunityContent, HelpContent, SceneDef } from '@content/types'
import { getLang } from './i18n'
import { localize, type Overlay } from './localize'
import { reviewItems, type ReviewItem } from './review'

const scenes: Record<string, SceneDef> = {
  school: schoolJson as SceneDef,
  dhaba: dhabaJson as SceneDef,
  home: homeJson as SceneDef,
  panchayat: panchayatJson as SceneDef,
}
const town = townJson as SceneDef

const hindi: Record<string, Overlay> = { school: hiSchool, dhaba: hiDhaba, home: hiHome, panchayat: hiPanchayat, town: hiTown }

/** `value` in Hindi when Hindi is on screen, worked out once per language. */
const inLanguage = <T,>(value: T, overlay: Overlay | undefined, also?: string[]) => {
  const cache: Partial<Record<string, T>> = {}
  return (): T => {
    const lang = getLang()
    if (lang === 'en') return value
    return (cache[lang] ??= localize(value, overlay, also))
  }
}

const sceneGetters = Object.fromEntries(Object.entries(scenes).map(([id, scene]) => [id, inLanguage(scene, hindi[id])]))
const townGetter = inLanguage(town, hindi.town)
const buildingsGetter = inLanguage(buildingsJson as BuildingInfo[], hiBuildings)
const helpGetter = inLanguage(helpJson as HelpContent, hiHelp, ['intro'])
const communityGetter = inLanguage(communityJson as CommunityContent, hiCommunity)

/** Every building in town order (ids and order are the same in every language). */
export const getBuildings = (): BuildingInfo[] => buildingsGetter()

/** The town: the walkable hub that links to every building. */
export const getTownScene = (): SceneDef => townGetter()

/** The Help Centre's words. */
export const getHelp = (): HelpContent => helpGetter()

/** The Community page's pledges, mission and places. */
export const getCommunity = (): CommunityContent => communityGetter()

/** The scene for a building, or null if it isn't written yet. */
export function getScene(id: string): SceneDef | null {
  return sceneGetters[id]?.() ?? null
}

/** The next playable building after `id` in the unlock order, or null if it is the last. */
export function nextBuilding(id: string): string | null {
  const playable = getBuildings().filter((b) => !b.teaser)
  const i = playable.findIndex((b) => b.id === id)
  return i >= 0 ? (playable[i + 1]?.id ?? null) : null
}

/** Every playable building with its rights card (null while its story isn't written), in town order. */
export function cardsInTown(): { building: BuildingInfo; card: Card | null }[] {
  return getBuildings()
    .filter((b) => !b.teaser)
    .map((building) => ({ building, card: getScene(building.id)?.card ?? null }))
}

/**
 * Every reviewable item in this build (D-049): the same list scripts/content-hashes.ts prints.
 * English first, then the same items in Hindi, which a fluent reviewer publishes separately (D-054).
 */
export function reviewableContent(): ReviewItem[] {
  const items = (lang: ReviewItem['lang']) => {
    const playable = (buildingsJson as BuildingInfo[])
      .filter((b) => !b.teaser)
      .map((b) => {
        const scene = lang === 'en' ? scenes[b.id] : scenes[b.id] && localize(scenes[b.id], hindi[b.id])
        const name = lang === 'en' ? b.name : (hiBuildings as Overlay)[`${b.id}.name`] || b.name
        return { id: b.id, name, card: scene?.card, games: scene?.games }
      })
    return reviewItems(playable, lang === 'en' ? (helpJson as HelpContent) : localize(helpJson as HelpContent, hiHelp, ['intro']), lang)
  }
  return [...items('en'), ...items('hi')]
}
