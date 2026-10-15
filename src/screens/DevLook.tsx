import { useCallback, useState } from 'react'
import schoolJson from '@content/scenes/school.json'
import type { SceneDef } from '@content/types'
import { Button } from '@/components/Button'
import { Page } from '@/components/Page'
import { Scene } from '@/engine/Scene'
import { t } from '@/lib/i18n'

/**
 * Look development (/dev/look): the School scene with its real story (Phase 3),
 * for checking the art and the writing together. The card, quiz and results come next.
 */
const school = schoolJson as SceneDef

export function DevLook() {
  const [run, setRun] = useState(0)
  const [done, setDone] = useState(false)
  const finish = useCallback(() => setDone(true), [])
  return (
    <Page title={t('dev.look')} wide>
      {done ? (
        <Button onClick={() => (setDone(false), setRun((n) => n + 1))}>{t('dev.sceneRestart')}</Button>
      ) : (
        <Scene key={run} scene={school} onComplete={finish} onExit={finish} />
      )}
    </Page>
  )
}
