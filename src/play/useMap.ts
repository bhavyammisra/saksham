// The places on the area map, and travelling to them (D-036). A building is open when the
// unlock rules say so (rules.ts) and its story has been written; the town square and the
// Help Centre are always open. Used by the Town and by every building (Play).

import { useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router'
import type { MapPlace } from '@/components/AreaMap'
import { t } from '@/lib/i18n'
import { isUnlocked, recommendedBuilding } from '@/lib/rules'
import { getBuildings, getScene } from '@/lib/scenes'
import { selectActiveData, useStore } from '@/lib/store'

export const TOWN = 'town'
export const HELP = 'help'

/** `here` is where the player is now: "town" or a building id. */
export function useMap(here: string) {
  const data = useStore(selectActiveData)
  const demo = useStore((s) => s.demo)
  const navigate = useNavigate()

  const places = useMemo<MapPlace[]>(() => {
    const progress = data?.progress ?? {}
    const playable = getBuildings().filter((b) => !b.teaser)
    const suggested = recommendedBuilding(getBuildings(), progress, demo)
    const fromBuildings: MapPlace[] = getBuildings().map((b) => {
      const open = isUnlocked(b.id, getBuildings(), progress, demo) && getScene(b.id) !== null
      const previous = playable[playable.findIndex((p) => p.id === b.id) - 1]
      const note = b.teaser
        ? t('town.comingSoon')
        : !isUnlocked(b.id, getBuildings(), progress, demo)
          ? t('town.lockedAfter', { name: previous?.name ?? '' })
          : t('town.beingBuilt')
      const stars = progress[b.id]?.completed ? progress[b.id]?.stars : undefined
      return {
        id: b.id,
        name: b.name,
        ...b.map,
        status: b.id === here ? 'here' : open ? 'open' : 'locked',
        note: open ? undefined : note,
        stars,
        suggested: open && b.id === suggested && b.id !== here,
      }
    })
    return [
      { id: TOWN, name: t('map.square'), x: 760, y: 540, status: here === TOWN ? 'here' : 'open' },
      ...fromBuildings,
      { id: HELP, name: t('map.help'), x: 1390, y: 470, status: 'open', help: true },
    ]
  }, [data, demo, here])

  const onTravel = useCallback(
    (id: string) => {
      if (id === HELP) navigate('/help', { state: { from: here === TOWN ? '/town' : `/play/${here}` } })
      else if (id === TOWN) navigate('/town', { state: { from: here } })
      else navigate(`/play/${id}`)
    },
    [navigate, here],
  )

  return { places, onTravel }
}
