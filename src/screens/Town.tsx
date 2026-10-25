import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import type { Hotspot } from '@content/types'
import { ReturnCelebration, type Celebration } from '@/components/ReturnCelebration'
import { Scene } from '@/engine/Scene'
import { t } from '@/lib/i18n'
import { isUnlocked, recommendedBuilding } from '@/lib/rules'
import { getBuildings, getScene, getTownScene } from '@/lib/scenes'
import { selectActiveData, selectActiveProfile, useStore } from '@/lib/store'
import { HELP, TOWN, useMap } from '@/play/useMap'

/**
 * The town (Phase 4, full screen since D-036): a walkable street played by the same scene engine.
 * Each building is an exit hotspot whose `to` is the building id. This screen decides which doors
 * are locked (rules.ts and saved progress) and where each door leads; the engine only plays the
 * scene. The area map (Map, or M) shows every place, its stars and why a place is still locked.
 */
export function Town() {
  const data = useStore(selectActiveData)
  const profile = useStore(selectActiveProfile)
  const demo = useStore((s) => s.demo)
  const navigate = useNavigate()
  const location = useLocation()
  const progress = useMemo(() => data?.progress ?? {}, [data])
  const map = useMap(TOWN)

  // A door is open when its building is unlocked and its story has been written. Help is always open.
  const locked = useMemo(
    () =>
      new Set(
        getTownScene().hotspots
          .filter((h) => h.kind === 'exit' && h.to !== HELP && !(h.to && isUnlocked(h.to, getBuildings(), progress, demo) && getScene(h.to)))
          .map((h) => h.id),
      ),
    [progress, demo],
  )

  // Coming back from a building: start outside its door, and celebrate if it was just finished.
  const routeState = location.state as { from?: string; celebration?: Celebration | null } | null
  const from = routeState?.from
  const startX = getTownScene().hotspots.find((h) => h.to !== undefined && h.to === from)?.x
  const [celebration, setCelebration] = useState<Celebration | null>(routeState?.celebration ?? null)
  // Show it once: clear it from the history entry, so a reload or Back doesn't celebrate again.
  useEffect(() => {
    if (routeState?.celebration) navigate('/town', { replace: true, state: { from } })
  }, [routeState?.celebration, navigate, from])

  // Saved progress, as flags the town's content and art can use ("done:school").
  const startFlags = useMemo(
    () => (getTownScene().hostFlags ?? []).filter((f) => progress[f.replace('done:', '')]?.completed),
    [progress],
  )

  const onExit = useCallback(
    (h: Hotspot) => {
      if (h.to === HELP) navigate('/help', { state: { from: '/town' } })
      else if (h.to) navigate(`/play/${h.to}`)
    },
    [navigate],
  )
  const onComplete = useCallback(() => {}, []) // the town never "completes"

  // Mitthu only suggests a place that can actually be played right now, and points at its door.
  const suggested = recommendedBuilding(getBuildings(), progress, demo)
  const suggestion = suggested && getScene(suggested) ? getBuildings().find((b) => b.id === suggested) : undefined
  const guideDoor = getTownScene().hotspots.find((h) => h.kind === 'exit' && h.to === suggestion?.id)
  const guide = useMemo(
    () => (guideDoor && suggestion ? { hotspotId: guideDoor.id, text: t('town.guideHint', { name: suggestion.name }) } : undefined),
    [guideDoor, suggestion],
  )

  return (
    <>
      <Scene scene={getTownScene()} locked={locked} startX={startX} startFlags={startFlags} skipIntro={from !== undefined} guide={guide} onExit={onExit} onComplete={onComplete} map={map} />
      {celebration && profile && <ReturnCelebration name={profile.firstName} celebration={celebration} onClose={() => setCelebration(null)} />}
    </>
  )
}
