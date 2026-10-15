import { useCallback, useState } from 'react'
import sandboxJson from '@content/scenes/sandbox.json'
import type { SceneDef } from '@content/types'
import { Button } from '@/components/Button'
import { Page } from '@/components/Page'
import { Scene } from '@/engine/Scene'
import { t } from '@/lib/i18n'

/**
 * Look development (/dev/look): the School backdrop with the sandbox story in it,
 * for judging the visual style before any more scenes are made (🛑 owner gate).
 * The real School scene and its story are written in Phase 3.
 */
const sandbox = sandboxJson as SceneDef
const look: SceneDef = {
  ...sandbox,
  id: 'look',
  title: t('dev.look'),
  width: 3600,
  layers: [
    { id: 'sky', art: 'school.sky', speed: 0.05 },
    { id: 'far', art: 'school.far', speed: 0.15 },
    { id: 'town', art: 'school.town', speed: 0.4 },
    { id: 'trees', art: 'school.trees', speed: 0.65 },
    { id: 'school', art: 'school.building', speed: 1 },
    { id: 'light', art: 'school.light', speed: 0, front: true },
    { id: 'foreground', art: 'school.foreground', speed: 1.35 },
  ],
  walkable: { minX: 150, maxX: 3450 },
  blockers: [],
  spawn: { x: 560 },
  hotspots: sandbox.hotspots.map((h) => ({ ...h, x: { ravi: 1250, box: 1650, notice: 1850, didi: 2350, door: 3300 }[h.id] ?? h.x })),
}

export function DevLook() {
  const [run, setRun] = useState(0)
  const [done, setDone] = useState(false)
  const finish = useCallback(() => setDone(true), [])
  return (
    <Page title={t('dev.look')} wide>
      {done ? (
        <Button onClick={() => (setDone(false), setRun((n) => n + 1))}>{t('dev.sceneRestart')}</Button>
      ) : (
        <Scene key={run} scene={look} onComplete={finish} onExit={finish} />
      )}
    </Page>
  )
}
